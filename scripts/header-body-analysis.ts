// Separa cada book em HEADER (= slug) e BODY (= resto) e analisa cada um.
//
// Hipótese: header é "assinatura" / ID; body é "conteúdo" litúrgico.
// Se for o caso, body deve ter estatísticas DIFERENTES de header.

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;

const docs = corpus.map((r) => {
  const digits = r.text_md.replace(/\D/g, "");
  return { slug: r.slug, digits, header: r.slug, body: digits.slice(r.slug.length) };
});

// ---------------------------------------------------------------------------
// 1. Header analysis — slug itself as corpus
// ---------------------------------------------------------------------------
const allHeaders = docs.map((d) => d.header).join("");
const allBodies = docs.map((d) => d.body).join("");
const headerLens = docs.map((d) => d.header.length);
const bodyLens = docs.map((d) => d.body.length);

console.log("=== HEADER vs BODY size ===");
console.log(`Headers: ${headerLens.length} total, lens min=${Math.min(...headerLens)} max=${Math.max(...headerLens)} mean=${(headerLens.reduce((a, b) => a + b) / headerLens.length).toFixed(1)}`);
console.log(`Bodies : ${bodyLens.length} total, lens min=${Math.min(...bodyLens)} max=${Math.max(...bodyLens)} mean=${(bodyLens.reduce((a, b) => a + b) / bodyLens.length).toFixed(1)}`);
console.log();

function histo(s: string): number[] {
  const h = new Array(10).fill(0);
  for (const c of s) h[Number(c)]++;
  return h;
}

const hH = histo(allHeaders);
const hB = histo(allBodies);
console.log("=== Digit distribution: HEADER vs BODY ===");
console.log("digit | header% | body%  | delta");
for (let i = 0; i < 10; i++) {
  const pH = hH[i] / allHeaders.length;
  const pB = hB[i] / allBodies.length;
  const flag = Math.abs(pH - pB) > 0.02 ? " ←" : "";
  console.log(`  ${i}   | ${(pH * 100).toFixed(2).padStart(5)}% | ${(pB * 100).toFixed(2).padStart(5)}% | ${((pH - pB) * 100).toFixed(2).padStart(6)}%${flag}`);
}
console.log();

// ---------------------------------------------------------------------------
// 2. Bigrama freq: header vs body
// ---------------------------------------------------------------------------
function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i + 1 < s.length; i++) {
    const bg = s.slice(i, i + 2);
    m.set(bg, (m.get(bg) ?? 0) + 1);
  }
  return m;
}
const bgH = bigrams(allHeaders);
const bgB = bigrams(allBodies);
const totH = allHeaders.length - 1;
const totB = allBodies.length - 1;

console.log("=== Bigrams: most divergent between header and body ===");
const all100 = [];
for (let i = 0; i < 100; i++) {
  const bg = i.toString().padStart(2, "0");
  const pH = (bgH.get(bg) ?? 0) / totH;
  const pB = (bgB.get(bg) ?? 0) / totB;
  all100.push({ bg, pH, pB, delta: pH - pB });
}
all100.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
console.log("bigram | header% | body%  | delta");
for (const e of all100.slice(0, 15)) {
  console.log(`  ${e.bg}    | ${(e.pH * 100).toFixed(2).padStart(5)}% | ${(e.pB * 100).toFixed(2).padStart(5)}% | ${(e.delta * 100).toFixed(2).padStart(6)}%`);
}
console.log();

// ---------------------------------------------------------------------------
// 3. Slugs como corpus — buscar padrões nos próprios títulos
// ---------------------------------------------------------------------------
console.log("=== SLUG patterns ===");
const sortedSlugs = docs.map((d) => d.slug).sort();
console.log("All 72 slugs sorted ascending (numeric)?");
const numericSorted = [...sortedSlugs].sort((a, b) => Number(a) - Number(b));
console.log("First 10:", numericSorted.slice(0, 10).join(", "));
console.log("Last  10:", numericSorted.slice(-10).join(", "));
console.log();

// Verifica se slugs formam sequência (consecutive, periodic, etc)
const nums = docs.map((d) => Number(d.slug));
console.log(`Numeric range: ${Math.min(...nums)} to ${Math.max(...nums)}`);
console.log(`Slugs have leading zero? Count: ${docs.filter((d) => d.slug.startsWith("0")).length}/72`);
console.log(`Slugs of length 10: ${docs.filter((d) => d.slug.length === 10).length}/72`);
console.log(`Slugs of length 11: ${docs.filter((d) => d.slug.length === 11).length}/72`);
console.log(`Slugs of length 12: ${docs.filter((d) => d.slug.length === 12).length}/72`);
console.log();

// ---------------------------------------------------------------------------
// 4. Há substring "469" no corpus? (a teoria mais famosa)
// ---------------------------------------------------------------------------
console.log("=== '469' substring — the famous mystery ===");
const count469 = (allBodies.match(/469/g) ?? []).length;
const count469AllText = ((allHeaders + allBodies).match(/469/g) ?? []).length;
const expected469 = (allBodies.length - 2) / 1000;
console.log(`  '469' in bodies: ${count469} (expected uniform: ${expected469.toFixed(2)})`);
console.log(`  '469' in all corpus: ${count469AllText}`);
const books469 = docs.filter((d) => d.body.includes("469")).length;
console.log(`  Books containing '469' in body: ${books469}/${docs.length}`);
// Em quais books aparece?
for (const d of docs) if (d.body.includes("469")) console.log(`     ${d.slug}: positions ${[...d.body.matchAll(/469/g)].map((m) => m.index).slice(0, 5).join(", ")}`);
console.log();

// ---------------------------------------------------------------------------
// 5. Análise específica: começo do BODY de cada book (primeiros 5 dígitos do corpo)
// ---------------------------------------------------------------------------
console.log("=== BODY first-5 prefix patterns ===");
const bodyHeads = new Map<string, number>();
for (const d of docs) if (d.body.length >= 5) {
  const h = d.body.slice(0, 5);
  bodyHeads.set(h, (bodyHeads.get(h) ?? 0) + 1);
}
const sortedBodyHeads = [...bodyHeads.entries()].sort((a, b) => b[1] - a[1]);
console.log(`Distinct first-5 of body: ${sortedBodyHeads.length}/${docs.length}`);
console.log(`Top repeats:`);
for (const [h, c] of sortedBodyHeads.slice(0, 5)) if (c >= 2) console.log(`  ${h} → ${c} books`);
console.log();

// ---------------------------------------------------------------------------
// 6. Hipótese final: header (slug) é "data" + body é "comentário"
//   Verifica se slugs ordenados parecem timestamps ou IDs
// ---------------------------------------------------------------------------
console.log("=== SLUG anomalies / odd-one-out ===");
const slugLengths = new Map<number, number>();
for (const d of docs) slugLengths.set(d.slug.length, (slugLengths.get(d.slug.length) ?? 0) + 1);
console.log(`Slug length distribution: ${[...slugLengths.entries()].map(([k, v]) => `${k}d:${v}`).join(", ")}`);
