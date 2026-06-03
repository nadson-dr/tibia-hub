// Testa hipóteses derivadas dos achados de Paradox Tower + repo s2ward/469.
//
// H_I. PAIR ORDERING — bigramas xy onde x > y dominam? (paired-number theory)
// H_J. DIGIT 0 TABOO — books que evitam '0' explicitamente?
// H_K. TETRANACCI — termos da sequência tetranacci aparecem nos books?
// H_L. HONEMINAS — a fórmula "(4,3,1,5,3).(3,4,7,8,4)" → concat 4315334784
//      aparece exata ou aproximada no corpus?
// H_M. CROSS-CITATION — palavras-âncora aparecem em outros books da wiki?

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");

// ---------------------------------------------------------------------------
// H_I — pair ordering (x > y per bigram)
// ---------------------------------------------------------------------------
console.log("=== H_I: PAIR ORDERING (x>y vs x<y vs x=y) ===");
{
  let gt = 0, lt = 0, eq = 0;
  for (let i = 0; i + 1 < all.length; i += 2) {
    const x = Number(all[i]);
    const y = Number(all[i + 1]);
    if (x > y) gt++; else if (x < y) lt++; else eq++;
  }
  const total = gt + lt + eq;
  console.log(`  Disjoint bigrams: ${total}`);
  console.log(`  x > y: ${gt} (${(gt / total * 100).toFixed(1)}%)  [random expected: ~45%]`);
  console.log(`  x < y: ${lt} (${(lt / total * 100).toFixed(1)}%)  [random expected: ~45%]`);
  console.log(`  x = y: ${eq} (${(eq / total * 100).toFixed(1)}%)  [random expected: ~10%]`);
  console.log(`  asymmetry = ${((gt - lt) / total * 100).toFixed(2)}%`);
  // Sliding (overlapping):
  let gtS = 0, ltS = 0, eqS = 0;
  for (let i = 0; i + 1 < all.length; i++) {
    const x = Number(all[i]);
    const y = Number(all[i + 1]);
    if (x > y) gtS++; else if (x < y) ltS++; else eqS++;
  }
  const totalS = gtS + ltS + eqS;
  console.log(`  --- sliding window (overlapping) ---`);
  console.log(`  x > y: ${gtS} (${(gtS / totalS * 100).toFixed(1)}%)`);
  console.log(`  x < y: ${ltS} (${(ltS / totalS * 100).toFixed(1)}%)`);
  console.log(`  x = y: ${eqS} (${(eqS / totalS * 100).toFixed(1)}%)`);
}
console.log();

// ---------------------------------------------------------------------------
// H_J — digit 0 taboo
// ---------------------------------------------------------------------------
console.log("=== H_J: DIGIT 0 — taboo per NPC 'A Wrinkled Bonelord' ===");
{
  const zeroFreq = (all.match(/0/g)?.length ?? 0) / all.length;
  console.log(`  Overall freq of '0' in corpus: ${(zeroFreq * 100).toFixed(2)}% (uniform=10.00%)`);
  // Per-book zero count + zero-less books
  const perBook = docs.map((d) => ({
    slug: d.slug,
    zeros: (d.digits.match(/0/g)?.length ?? 0),
    len: d.digits.length,
  }));
  const zeroLess = perBook.filter((b) => b.zeros === 0);
  const zeroPoor = perBook.filter((b) => b.zeros / b.len < 0.04);
  console.log(`  Books with ZERO 0's: ${zeroLess.length}/${perBook.length}  ${zeroLess.map((b) => b.slug).slice(0, 8).join(", ")}`);
  console.log(`  Books with <4% 0's:  ${zeroPoor.length}/${perBook.length}`);
  // Average zeros per book vs expectation
  const avgZeros = perBook.reduce((a, b) => a + b.zeros, 0) / perBook.length;
  const avgLen = perBook.reduce((a, b) => a + b.len, 0) / perBook.length;
  console.log(`  Avg zeros/book: ${avgZeros.toFixed(2)}  |  avg book length: ${avgLen.toFixed(1)}  | expected uniform: ${(avgLen * 0.1).toFixed(2)}`);
}
console.log();

// ---------------------------------------------------------------------------
// H_K — Tetranacci sequence presence
// Tetranacci: 1,1,1,1,4,7,13,25,49,94,181,349,673,1297,2500,4819,9289...
// ---------------------------------------------------------------------------
console.log("=== H_K: TETRANACCI sequence terms ===");
{
  const tet: number[] = [1, 1, 1, 1];
  while (tet[tet.length - 1] < 1_000_000) {
    tet.push(tet.slice(-4).reduce((a, b) => a + b));
  }
  const interesting = tet.filter((v) => v > 1 && v < 100000);
  console.log(`  Tetranacci terms <100k: ${interesting.join(", ")}`);
  for (const v of interesting) {
    const s = String(v);
    if (s.length < 2) continue;
    const count = (all.match(new RegExp(s, "g")) ?? []).length;
    const expected = (all.length - s.length + 1) * Math.pow(10, -s.length);
    const ratio = expected > 0 ? count / expected : 0;
    if (count >= 3) console.log(`  "${s.padEnd(6)}": count=${String(count).padStart(4)}  expected=${expected.toFixed(2).padStart(6)}  ratio=${ratio.toFixed(1)}×`);
  }
}
console.log();

// ---------------------------------------------------------------------------
// H_L — Honeminas Formula concat search
// ---------------------------------------------------------------------------
console.log("=== H_L: HONEMINAS Formula '(4,3,1,5,3).(3,4,7,8,4)' patterns ===");
{
  const concats = [
    "4315334784",         // both vectors concatenated
    "43153",              // first vector
    "34784",              // second vector
    "43153.34784".replace(".", ""), // same
    "31534784",
  ];
  for (const c of concats) {
    const count = (all.match(new RegExp(c, "g")) ?? []).length;
    const expected = (all.length - c.length + 1) * Math.pow(10, -c.length);
    console.log(`  "${c.padEnd(12)}": ${String(count).padStart(3)} occurrences  (expected uniform: ${expected.toFixed(3)})`);
  }
  // Also check vectors as substrings even non-concat
  const v1 = "43153", v2 = "34784";
  let coOccur = 0;
  for (const d of docs) {
    if (d.digits.includes(v1) && d.digits.includes(v2)) coOccur++;
  }
  console.log(`  Books containing BOTH vectors: ${coOccur}/${docs.length}`);
}
console.log();

// ---------------------------------------------------------------------------
// H_M — books with rarest substrings — see which ones might be "outliers"
// ---------------------------------------------------------------------------
console.log("=== H_M: corpus length distribution + zero-rich vs zero-poor ===");
{
  const sorted = docs.map((d) => d.digits.length).sort((a, b) => a - b);
  console.log(`  Lengths: min=${sorted[0]}  q25=${sorted[Math.floor(sorted.length / 4)]}  median=${sorted[Math.floor(sorted.length / 2)]}  q75=${sorted[Math.floor(sorted.length * 3 / 4)]}  max=${sorted[sorted.length - 1]}`);
}
console.log();

// ---------------------------------------------------------------------------
// H_N — relation between books named with N digits and content (slug = title)
// "9457655996" book starts with "9457655996" content? title == sequence?
// ---------------------------------------------------------------------------
console.log("=== H_N: book slug vs content prefix ===");
{
  let matches = 0;
  let close = 0;
  for (const d of docs) {
    if (d.digits.startsWith(d.slug)) matches++;
    else if (d.digits.includes(d.slug)) close++;
  }
  console.log(`  Books whose content STARTS with the slug: ${matches}/${docs.length}`);
  console.log(`  Books whose content CONTAINS the slug (not at start): ${close}/${docs.length}`);
  console.log(`  Sample: slug=${docs[0].slug}  content starts with: ${docs[0].digits.slice(0, docs[0].slug.length)}`);
}
