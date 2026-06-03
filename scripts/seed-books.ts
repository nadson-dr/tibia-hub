// Seed books table no Supabase a partir do JSONL scrapeado.
//
// Estratégia: gera `supabase/seed_books.sql` com INSERTS em batches.
// Aplicar via: supabase db push  OU  cole no Supabase Studio → SQL Editor.
//
// Por que SQL e não supabase-js? Sem dependência runtime, idempotente,
// versionável, fácil de auditar em PR.
//
// Uso:
//   pnpm tsx scripts/seed-books.ts
//   pnpm tsx scripts/seed-books.ts --upsert    # ON CONFLICT update
//   pnpm tsx scripts/seed-books.ts --input=path/to/other.jsonl

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

type Row = {
  source: string;
  pageTitle: string;
  pageId: number;
  slug: string;
  pageUrl: string;
  scrapedAt: string;
  title: string;
  inGameTitle?: string;
  booktype?: string;
  text: string;
  textStatus: "ok" | "empty" | "unknown_language" | "image_only" | "missing";
  location?: string;
  author?: string;
  blurb?: string;
  returnPage?: string;
  relatedPages?: string[];
  notes?: string;
  implemented?: string;
  variantIndex?: number;
};

function parseArgs() {
  const out = {
    input: path.join(ROOT, "data", "books-raw.jsonl"),
    output: path.join(ROOT, "supabase", "seed_books.sql"),
    upsert: false,
    batch: 100,
  };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--input=")) out.input = path.resolve(arg.slice("--input=".length));
    else if (arg.startsWith("--output=")) out.output = path.resolve(arg.slice("--output=".length));
    else if (arg === "--upsert") out.upsert = true;
    else if (arg.startsWith("--batch=")) out.batch = Number(arg.slice("--batch=".length));
  }
  return out;
}

function sqlString(value: string | undefined | null): string {
  if (value === undefined || value === null) return "null";
  return "'" + value.replace(/'/g, "''") + "'";
}

function sqlInt(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "null";
  return String(Math.trunc(value));
}

function sqlArray(value: string[] | undefined | null): string {
  if (!value || value.length === 0) return "'{}'";
  // Postgres array literal envelopado em SQL string: '{"a","b"}'
  // 1) dentro do array, escape backslash e aspas duplas (regras do array literal)
  // 2) depois, dobrar aspas simples (regra do SQL string literal externo)
  const escaped = value.map((s) => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"');
  return "'{" + escaped.join(",").replace(/'/g, "''") + "}'";
}

function sqlEnum(value: string): string {
  // Não escapamos enums além do quote — já validados pelo TS.
  return "'" + value + "'";
}

function sqlTimestamp(iso: string | undefined | null): string {
  if (!iso) return "null";
  return "'" + iso + "'::timestamptz";
}

// Slug do JSONL pode colidir ou estar errado (sprite name). Recomputa do title.
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqSlugify(row: Row, seen: Set<string>): string {
  // Prioridade: title (page name limpo) → inGameTitle → pageTitle → fallback pageId.
  let base = "";
  if (row.title && row.title.trim()) base = slugifyTitle(row.title);
  if (!base && row.inGameTitle && row.inGameTitle.trim() && !/^untitled$/i.test(row.inGameTitle)) {
    base = slugifyTitle(row.inGameTitle);
  }
  if (!base) base = slugifyTitle(row.pageTitle.replace(/\s*\(Book\)\s*$/i, ""));
  if (!base) base = `book-${row.pageId}`;
  if (row.variantIndex && row.variantIndex > 1) base = `${base}-v${row.variantIndex}`;
  let candidate = base;
  let suffix = 2;
  while (seen.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  seen.add(candidate);
  return candidate;
}

function buildRow(row: Row, slug: string): string {
  return (
    "(" +
    [
      sqlString(slug),                            // slug
      sqlString(row.title),                       // title
      sqlString(row.inGameTitle),                 // in_game_title
      sqlString(row.booktype),                    // booktype
      sqlString(row.text),                        // text_md
      sqlEnum(row.textStatus),                    // text_status
      sqlString(row.blurb),                       // blurb
      sqlString(row.author),                      // author
      sqlString(row.location),                    // location_md
      sqlString(row.returnPage),                  // return_page
      sqlArray(row.relatedPages),                 // related_pages
      sqlString(row.notes),                       // notes
      sqlString(row.implemented),                 // implemented_version
      sqlString(row.source),                      // source
      sqlString(row.pageTitle),                   // source_page_title
      sqlInt(row.pageId),                         // source_page_id
      sqlString(row.pageUrl),                     // source_url
      "2",                                        // source_tier (default 2 = TibiaWiki)
      "null",                                     // collection (preencher manual depois)
      "null",                                     // city
      "null",                                     // series
      "null",                                     // series_part
      sqlInt(row.variantIndex),                   // variant_index
      sqlTimestamp(row.scrapedAt),                // scraped_at
    ].join(", ") +
    ")"
  );
}

const COLUMNS = [
  "slug",
  "title",
  "in_game_title",
  "booktype",
  "text_md",
  "text_status",
  "blurb",
  "author",
  "location_md",
  "return_page",
  "related_pages",
  "notes",
  "implemented_version",
  "source",
  "source_page_title",
  "source_page_id",
  "source_url",
  "source_tier",
  "collection",
  "city",
  "series",
  "series_part",
  "variant_index",
  "scraped_at",
];

const ON_CONFLICT_UPDATE = `
on conflict (slug) do update set
  title = excluded.title,
  in_game_title = excluded.in_game_title,
  booktype = excluded.booktype,
  text_md = excluded.text_md,
  text_status = excluded.text_status,
  blurb = excluded.blurb,
  author = excluded.author,
  location_md = excluded.location_md,
  return_page = excluded.return_page,
  related_pages = excluded.related_pages,
  notes = excluded.notes,
  implemented_version = excluded.implemented_version,
  source = excluded.source,
  source_page_title = excluded.source_page_title,
  source_page_id = excluded.source_page_id,
  source_url = excluded.source_url,
  scraped_at = excluded.scraped_at,
  updated_at = now()
`.trim();

function main() {
  const args = parseArgs();
  if (!fs.existsSync(args.input)) {
    console.error(`Input not found: ${args.input}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(args.input, "utf8");
  const rows: Row[] = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  console.log(`Loaded ${rows.length} rows from ${args.input}`);

  const seen = new Set<string>();
  const parts: string[] = [];
  parts.push(
    [
      "-- Auto-generated by scripts/seed-books.ts.",
      "-- Source: " + path.relative(ROOT, args.input),
      "-- Generated at: " + new Date().toISOString(),
      "-- Books: " + rows.length,
      "-- Strategy: " + (args.upsert ? "INSERT ... ON CONFLICT UPDATE" : "INSERT ... ON CONFLICT DO NOTHING"),
      "",
      "begin;",
      "",
    ].join("\n"),
  );

  for (let i = 0; i < rows.length; i += args.batch) {
    const batch = rows.slice(i, i + args.batch);
    const values = batch.map((r) => buildRow(r, uniqSlugify(r, seen))).join(",\n  ");
    const onConflict = args.upsert ? ON_CONFLICT_UPDATE : "on conflict (slug) do nothing";
    parts.push(
      `insert into public.books (${COLUMNS.join(", ")}) values\n  ${values}\n${onConflict};\n`,
    );
  }

  parts.push("commit;\n");
  fs.writeFileSync(args.output, parts.join("\n"));
  const stats = fs.statSync(args.output);
  console.log(
    `Wrote ${args.output} (${rows.length} rows, ${seen.size} unique slugs, ${(stats.size / 1024 / 1024).toFixed(2)} MB).`,
  );
  console.log("Apply via: supabase db push  OR  paste in Supabase Studio → SQL Editor.");
}

main();
