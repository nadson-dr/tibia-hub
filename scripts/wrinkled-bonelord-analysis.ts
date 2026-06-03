// Análise focada nos mapeamentos canônicos extraídos do diálogo
// do NPC "A Wrinkled Bonelord" (Hellgate Library).
//
// Mapeamentos diretos:
//   "Tibia"          → 1
//   "486486"         → nome do NPC
//   "0"              → palavra obscena
//   "469"            → nome da linguagem deles
//   "bonelord"       → fórmula variável (não-fixa)
//
// Hipóteses NOVAS:
//   H_O. "1" como token isolado (palavra) — é cercado por boundaries previsíveis?
//   H_P. "486486" aparece no corpus? (auto-citação do narrador)
//   H_Q. Padrão de repetição AA (mesmo dígito 2x) é especial?
//   H_R. Padrão de repetição ABCABC é raro? (estilo nome próprio)
//   H_S. Pair-ordering re-testado em BODY apenas (header pode mascarar)
//   H_T. Tetranacci re-testado por book em vez de agregado
//   H_U. Slugs como nomes próprios — comparar com 486486

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => {
  const digits = r.text_md.replace(/\D/g, "");
  return { slug: r.slug, digits, body: digits.slice(r.slug.length) };
});
const all = docs.map((d) => d.digits).join("");
const allBodies = docs.map((d) => d.body).join("");

console.log("=== H_P: '486486' (name of narrator) in corpus ===");
{
  const cnt = (all.match(/486486/g) ?? []).length;
  const expected = (all.length - 5) / 1_000_000;
  console.log(`  '486486' exact: ${cnt} occurrences  (uniform expected: ${expected.toFixed(4)})`);
  // Quais books contêm
  const inBooks = docs.filter((d) => d.digits.includes("486486"));
  console.log(`  Books containing '486486': ${inBooks.length}/${docs.length}  ${inBooks.map((b) => b.slug).join(", ")}`);

  const cnt486 = (all.match(/486/g) ?? []).length;
  const expected486 = (all.length - 2) / 1000;
  console.log(`  '486' standalone: ${cnt486} occurrences  (uniform expected: ${expected486.toFixed(2)})  ratio=${(cnt486 / expected486).toFixed(2)}×`);
}
console.log();

console.log("=== H_Q: AA-repetition (same digit ×2) per digit ===");
{
  for (let d = 0; d < 10; d++) {
    const pat = String(d) + String(d);
    const cnt = (all.match(new RegExp(pat, "g")) ?? []).length;
    const expected = (all.length - 1) / 100;
    const ratio = cnt / expected;
    const arrow = ratio < 0.5 ? " ← rare" : ratio > 1.5 ? " ← common" : "";
    console.log(`  ${pat}: ${String(cnt).padStart(4)} (expected ${expected.toFixed(1)}) ratio=${ratio.toFixed(2)}×${arrow}`);
  }
}
console.log();

console.log("=== H_R: ABCABC pattern (3-digit + repeat) — name candidates ===");
{
  const map = new Map<string, number>();
  for (let i = 0; i + 6 <= all.length; i++) {
    const six = all.slice(i, i + 6);
    if (six.slice(0, 3) === six.slice(3, 6)) {
      const root = six.slice(0, 3);
      map.set(root, (map.get(root) ?? 0) + 1);
    }
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`  Total ABCABC sequences: ${sorted.reduce((a, b) => a + b[1], 0)}`);
  console.log(`  Distinct roots: ${sorted.length}`);
  console.log(`  Top 15 roots (potential 'name' candidates):`);
  for (const [r, c] of sorted.slice(0, 15)) {
    const exp = (all.length - 5) * 0.001 * 0.001;
    console.log(`    ${r}${r} → ${c} occurrences  ${r === "486" ? "← NARRATOR NAME" : ""}`);
  }
}
console.log();

console.log("=== H_O: '1' as standalone token (isolated by non-1 boundaries) ===");
{
  // count '1' surrounded by non-'1'
  let standalone = 0;
  let total1 = 0;
  for (let i = 0; i < all.length; i++) {
    if (all[i] === "1") {
      total1++;
      const before = i > 0 ? all[i - 1] : "";
      const after = i < all.length - 1 ? all[i + 1] : "";
      if (before !== "1" && after !== "1") standalone++;
    }
  }
  console.log(`  Total '1' digits: ${total1}  (${(total1 / all.length * 100).toFixed(2)}% of corpus)`);
  console.log(`  Of these, isolated (non-1 neighbours): ${standalone}  (${(standalone / total1 * 100).toFixed(2)}%)`);
  // Análise de runs de '1'
  const runs = all.match(/1+/g) ?? [];
  const runLens = new Map<number, number>();
  for (const r of runs) runLens.set(r.length, (runLens.get(r.length) ?? 0) + 1);
  console.log(`  Run-length distribution of consecutive 1's:`);
  for (const [k, v] of [...runLens.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`    ${k} × '1': ${v} runs`);
  }
}
console.log();

console.log("=== H_S: Pair-ordering re-test, BODY only (no headers) ===");
{
  let gt = 0, lt = 0, eq = 0;
  for (let i = 0; i + 1 < allBodies.length; i += 2) {
    const x = Number(allBodies[i]);
    const y = Number(allBodies[i + 1]);
    if (x > y) gt++;
    else if (x < y) lt++;
    else eq++;
  }
  const total = gt + lt + eq;
  console.log(`  Body disjoint bigrams: ${total}`);
  console.log(`  x > y: ${gt} (${(gt / total * 100).toFixed(2)}%)`);
  console.log(`  x < y: ${lt} (${(lt / total * 100).toFixed(2)}%)`);
  console.log(`  x = y: ${eq} (${(eq / total * 100).toFixed(2)}%)`);
  console.log(`  Random expected: x>y≈45% x<y≈45% x=y≈10%`);
}
console.log();

console.log("=== H_T: Tetranacci — per book (not global) ===");
{
  const tet = [1, 1, 1, 1, 4, 7, 13, 25, 49, 94, 181, 349, 673, 1297, 2500, 4819].map(String);
  let booksWithTet = 0;
  const bookMatches = new Map<string, number>();
  for (const d of docs) {
    let any = false;
    for (const v of tet) {
      if (v.length >= 2 && d.digits.includes(v)) {
        any = true;
        bookMatches.set(v, (bookMatches.get(v) ?? 0) + 1);
      }
    }
    if (any) booksWithTet++;
  }
  console.log(`  Books containing at least one tetranacci term: ${booksWithTet}/${docs.length}`);
  console.log(`  Per-term book count:`);
  for (const v of tet) {
    const c = bookMatches.get(v) ?? 0;
    if (c > 0) console.log(`    ${v.padEnd(5)} in ${c}/${docs.length} books`);
  }
}
console.log();

console.log("=== H_U: Slugs as name signatures — patterns ===");
{
  // Check for AA-pattern in slugs
  const aaSlugs = docs.filter((d) => /(\d{3})\1/.test(d.slug));
  const aaCount = aaSlugs.length;
  console.log(`  Slugs with 3-digit repetition (NNN×2 like 486486): ${aaCount}/${docs.length}`);
  for (const d of aaSlugs.slice(0, 10)) console.log(`    ${d.slug}`);

  // Check for any internal repetition in slugs
  const slugsWithRepeats = docs.filter((d) => {
    for (let n = 2; n <= 5; n++) {
      for (let i = 0; i + 2 * n <= d.slug.length; i++) {
        if (d.slug.slice(i, i + n) === d.slug.slice(i + n, i + 2 * n)) return true;
      }
    }
    return false;
  });
  console.log(`  Slugs with ANY internal repetition (length 2-5): ${slugsWithRepeats.length}/${docs.length}`);
}
console.log();

console.log("=== H_V: '486' near book boundaries (suggesting authorship) ===");
{
  const positions: { slug: string; firstIdx: number; lastIdx: number; count: number }[] = [];
  for (const d of docs) {
    const occ = [...d.digits.matchAll(/486/g)];
    if (occ.length > 0) {
      positions.push({
        slug: d.slug,
        firstIdx: occ[0].index!,
        lastIdx: occ[occ.length - 1].index!,
        count: occ.length,
      });
    }
  }
  console.log(`  Books containing '486' at all: ${positions.length}/${docs.length}`);
  console.log(`  Books with '486' in first 15 digits:`);
  for (const p of positions) if (p.firstIdx < 15) console.log(`    ${p.slug.padEnd(13)} first at pos ${p.firstIdx} (count ${p.count})`);
}
console.log();

console.log("=== H_W: '1' frequency by book — does any book emphasize '1' (Tibia/world)? ===");
{
  const top = docs.map((d) => ({ slug: d.slug, p1: (d.body.match(/1/g)?.length ?? 0) / Math.max(1, d.body.length) }))
    .sort((a, b) => b.p1 - a.p1);
  console.log("  Top 5 books with highest '1' density in body:");
  for (const x of top.slice(0, 5)) console.log(`    ${x.slug}: ${(x.p1 * 100).toFixed(2)}%`);
  console.log("  Bottom 5:");
  for (const x of top.slice(-5)) console.log(`    ${x.slug}: ${(x.p1 * 100).toFixed(2)}%`);
}
