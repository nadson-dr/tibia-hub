// Scraper de books in-game do Tibia via TibiaWiki Fandom MediaWiki API.
//
// Uso:
//   pnpm tsx scripts/scrape-books.ts --limit=10   # dry run
//   pnpm tsx scripts/scrape-books.ts              # full scrape
//   pnpm tsx scripts/scrape-books.ts --resume     # continua de onde parou
//
// Output: data/books-raw.jsonl  (1 linha por book parseado)
// Logs:   data/books-scrape.log

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchWikitext, listCategoryMembers, sleep, slugify } from "./lib/mediawiki";
import { parseBookPage, type BookFields } from "./lib/parse-wikitext";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT_JSONL = path.join(DATA_DIR, "books-raw.jsonl");
const LOG_PATH = path.join(DATA_DIR, "books-scrape.log");

const CATEGORY = "Category:Book_Texts";
const REQUEST_DELAY_MS = 250; // ~4 req/s. Polite to Fandom.

type ScrapedRow = BookFields & {
  source: "fandom-en";
  pageTitle: string;
  pageId: number;
  slug: string;
  pageUrl: string;
  scrapedAt: string;
  variantIndex?: number; // pra books com múltiplos Infobox (ex: series)
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { limit: Infinity as number, resume: false, sample: false };
  for (const arg of args) {
    if (arg.startsWith("--limit=")) out.limit = Number(arg.slice("--limit=".length));
    else if (arg === "--resume") out.resume = true;
    else if (arg === "--sample") out.sample = true;
  }
  return out;
}

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDoneTitles(): Set<string> {
  if (!fs.existsSync(OUTPUT_JSONL)) return new Set();
  const lines = fs.readFileSync(OUTPUT_JSONL, "utf8").split("\n").filter(Boolean);
  const done = new Set<string>();
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as ScrapedRow;
      done.add(row.pageTitle);
    } catch {
      // skip bad line
    }
  }
  return done;
}

async function main() {
  ensureDataDir();
  const args = parseArgs();

  log(`Starting scrape. limit=${args.limit} resume=${args.resume} sample=${args.sample}`);

  log(`Listing members of ${CATEGORY}...`);
  const members = await listCategoryMembers("fandom-en", CATEGORY, { limit: args.limit });
  log(`Found ${members.length} members.`);

  // If resuming, skip what's already in the JSONL.
  const done = args.resume ? readDoneTitles() : new Set<string>();
  if (args.resume) log(`Resume mode: ${done.size} already scraped, will skip those.`);

  // If sample, write fresh.
  if (!args.resume && fs.existsSync(OUTPUT_JSONL)) {
    fs.renameSync(OUTPUT_JSONL, OUTPUT_JSONL + ".prev");
    log(`Moved previous JSONL to ${OUTPUT_JSONL}.prev`);
  }

  const stream = fs.createWriteStream(OUTPUT_JSONL, { flags: "a" });
  let okCount = 0;
  let emptyCount = 0;
  let failCount = 0;

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (done.has(m.title)) continue;

    try {
      const parsed = await fetchWikitext("fandom-en", m.title);
      if (!parsed) {
        log(`[${i + 1}/${members.length}] MISS ${m.title}`);
        failCount++;
        continue;
      }

      const books = parseBookPage(parsed.title, parsed.wikitext);
      for (let v = 0; v < books.length; v++) {
        const book = books[v];
        const row: ScrapedRow = {
          ...book,
          source: "fandom-en",
          pageTitle: parsed.title,
          pageId: parsed.pageid,
          slug: slugify(book.title || parsed.title.replace(/\s*\(Book\)\s*$/i, "")) + (v > 0 ? `-${v + 1}` : ""),
          pageUrl: `https://tibia.fandom.com/wiki/${encodeURIComponent(parsed.title.replace(/ /g, "_"))}`,
          scrapedAt: new Date().toISOString(),
          variantIndex: books.length > 1 ? v + 1 : undefined,
        };
        stream.write(JSON.stringify(row) + "\n");
      }

      const status = books[0].textStatus;
      const summary = `text=${status} chars=${books[0].text.length} variants=${books.length}`;
      if (status === "ok") okCount++;
      else if (status === "empty") emptyCount++;
      log(`[${i + 1}/${members.length}] OK  ${m.title} — ${summary}`);
    } catch (err) {
      failCount++;
      log(`[${i + 1}/${members.length}] FAIL ${m.title} — ${(err as Error).message}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  stream.end();

  log(
    `Done. ok=${okCount} empty=${emptyCount} fail=${failCount} total_pages=${members.length}. Output: ${OUTPUT_JSONL}`,
  );
}

main().catch((err) => {
  log(`FATAL ${(err as Error).stack ?? (err as Error).message}`);
  process.exit(1);
});
