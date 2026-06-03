import { listCategoryMembers, fetchWikitext } from "./lib/mediawiki";
import { parseBookPage } from "./lib/parse-wikitext";
import fs from "node:fs";

async function main() {
  const remote = await listCategoryMembers("fandom-en", "Category:Book Texts");
const local = new Set(
  fs
    .readFileSync("data/books-raw.jsonl", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l).pageTitle),
);
console.log("Remote Book Texts:", remote.length);
console.log("Local in JSONL  :", local.size);
const missing = remote.filter((m) => !local.has(m.title));
console.log("");
console.log(`Missing from local (${missing.length}):`);
for (const m of missing) console.log("  - " + m.title);

// Probe "extra catalogue" items (parent Category:Books, not in Book Texts):
const extraTitles = [
  "Almanac of Magic",
  "Atlas",
  "Blue Tome",
  "Book of Necromantic Rituals",
  "Book of Orc Language",
  "Book of Prayers",
  "Book with Old Legends",
  "Cookbook",
  "Dragha's Spellbook",
  "Elven Poetry Book",
  "Heavily Bound Book",
  "Heavy Old Tome",
  "Jean Pierre's Cookbook I",
  "Jean Pierre's Cookbook II",
  "Knowledgeable Book",
];
console.log("");
console.log("Probing parent-Category:Books items for actual text content:");
for (const t of extraTitles) {
  const res = await fetchWikitext("fandom-en", t);
  if (!res) {
    console.log(`  ${t.padEnd(35)} MISS`);
    continue;
  }
  const books = parseBookPage(res.title, res.wikitext);
  const total = books.reduce((a, b) => a + b.text.length, 0);
  const status = books[0]?.textStatus ?? "?";
  console.log(`  ${t.padEnd(35)} status=${status.padEnd(16)} chars=${total} variants=${books.length}`);
  await new Promise((r) => setTimeout(r, 300));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
