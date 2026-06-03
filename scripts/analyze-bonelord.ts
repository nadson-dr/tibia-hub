// Análise estatística do corpus "bonelord-language" — os 72 livros com slug
// numérico da Hellgate Library (lore: "the books the bonelords write contain
// only numbers" — Beware of the Bonelords).
//
// Goal: pistas formais (frequência, n-grams, IC, repetições) que possam dar
// pés à decodificação — não prometer leitura. O canon literalmente diz
// "almost impossible to comprehend".
//
// Hipóteses testadas:
//   H1. Distribuição uniforme (não-linguagem; ruído).
//   H2. Linguagem em base 10 (cada dígito = símbolo).
//   H3. Blinking code de 2 olhos → bigramas de dígitos (00..99 = vocabulário).
//   H4. Substring sharing — palavras / morfemas recorrentes entre books.
//   H5. Headers/footers — primeiros/últimos N dígitos repetem entre books.

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;

const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");
const N = all.length;

// ---------------------------------------------------------------------------
// 1. Histograma de dígitos (unigram)
// ---------------------------------------------------------------------------
const unigram = new Map<string, number>();
for (const c of all) unigram.set(c, (unigram.get(c) ?? 0) + 1);
console.log("=== UNIGRAM (digit frequency, total N=" + N + ") ===");
const uniformExp = N / 10;
console.log("digit | count | freq    | exp(uniform) | z-score");
let chiSquare = 0;
const sortedDigits = [...unigram.entries()].sort(([a], [b]) => a.localeCompare(b));
for (const [d, c] of sortedDigits) {
  const freq = c / N;
  const z = (c - uniformExp) / Math.sqrt(uniformExp * 0.9);
  chiSquare += Math.pow(c - uniformExp, 2) / uniformExp;
  console.log(
    `  ${d}   | ${String(c).padStart(5)} | ${freq.toFixed(4)}  | ${uniformExp.toFixed(1).padStart(10)}   | ${z.toFixed(2).padStart(6)}`,
  );
}
console.log(`chi-square (df=9): ${chiSquare.toFixed(2)}  (critical 0.05 = 16.92; 0.001 = 27.88)`);
console.log();

// ---------------------------------------------------------------------------
// 2. Index of Coincidence
//    IC = Σ (n_i * (n_i - 1)) / (N * (N - 1))
//    Uniform random base-10: IC ≈ 0.10
//    Linguagem natural typical: 0.06-0.07 (en); compressed: ~0.04
// ---------------------------------------------------------------------------
let ic = 0;
for (const [, c] of unigram) ic += c * (c - 1);
ic /= N * (N - 1);
console.log("=== INDEX OF COINCIDENCE ===");
console.log("IC = " + ic.toFixed(5));
console.log("uniform random base-10 expected = 0.10000");
console.log("english plaintext (base-26) = ~0.0667");
console.log("if IC ≈ 0.10 → looks random / well-mixed; if > 0.105 → some structure.");
console.log();

// ---------------------------------------------------------------------------
// 3. Bigram distribution (testa H3: blinking de 2 olhos = pares de dígitos)
// ---------------------------------------------------------------------------
const bigram = new Map<string, number>();
for (let i = 0; i < all.length - 1; i++) {
  const bg = all.slice(i, i + 2);
  bigram.set(bg, (bigram.get(bg) ?? 0) + 1);
}
const bigramTotal = all.length - 1;
const bigramEntries = [...bigram.entries()].sort((a, b) => b[1] - a[1]);
console.log("=== BIGRAM top-20 (sliding window) ===");
console.log("bigram | count | freq    | exp(uniform)");
const bigramExp = bigramTotal / 100;
for (const [bg, c] of bigramEntries.slice(0, 20)) {
  console.log(`  ${bg}    | ${String(c).padStart(5)} | ${(c / bigramTotal).toFixed(4)}  | ${bigramExp.toFixed(1)}`);
}
console.log();
console.log("=== BIGRAM bottom-10 (rarest) ===");
for (const [bg, c] of bigramEntries.slice(-10)) {
  console.log(`  ${bg}    | ${String(c).padStart(5)} | ${(c / bigramTotal).toFixed(4)}`);
}
// chi-square sobre 100 cells
let bigramChi = 0;
for (let i = 0; i < 100; i++) {
  const bg = i.toString().padStart(2, "0");
  const c = bigram.get(bg) ?? 0;
  bigramChi += Math.pow(c - bigramExp, 2) / bigramExp;
}
console.log(
  `bigram chi-square (df=99) = ${bigramChi.toFixed(1)}  (critical 0.05 = 123.2; 0.001 = 148.2)`,
);
console.log();

// ---------------------------------------------------------------------------
// 4. Trigram top-15
// ---------------------------------------------------------------------------
const trigram = new Map<string, number>();
for (let i = 0; i < all.length - 2; i++) {
  const tg = all.slice(i, i + 3);
  trigram.set(tg, (trigram.get(tg) ?? 0) + 1);
}
const trigramEntries = [...trigram.entries()].sort((a, b) => b[1] - a[1]);
console.log("=== TRIGRAM top-15 ===");
const trigramExp = (all.length - 2) / 1000;
for (const [tg, c] of trigramEntries.slice(0, 15)) {
  console.log(`  ${tg}   | ${String(c).padStart(4)} | freq=${(c / (all.length - 2)).toFixed(5)} | exp~${trigramExp.toFixed(2)}`);
}
console.log();

// ---------------------------------------------------------------------------
// 5. Repeated substrings — candidates a "palavras" do dialeto
//    Procura substrings de comprimento 4..8 que aparecem ≥ 3 vezes no corpus
//    OU em ≥ 2 books diferentes.
// ---------------------------------------------------------------------------
console.log("=== REPEATED SUBSTRINGS (length 5..8, count ≥ 3) ===");
const SUBLEN_MIN = 5;
const SUBLEN_MAX = 8;
const found: { sub: string; total: number; books: Set<string> }[] = [];
for (let len = SUBLEN_MIN; len <= SUBLEN_MAX; len++) {
  const map = new Map<string, { total: number; books: Set<string> }>();
  for (const d of docs) {
    const seen = new Set<string>();
    for (let i = 0; i <= d.digits.length - len; i++) {
      const sub = d.digits.slice(i, i + len);
      let entry = map.get(sub);
      if (!entry) {
        entry = { total: 0, books: new Set() };
        map.set(sub, entry);
      }
      entry.total += 1;
      if (!seen.has(sub)) {
        entry.books.add(d.slug);
        seen.add(sub);
      }
    }
  }
  for (const [sub, info] of map) {
    if (info.total >= 3 && info.books.size >= 2) found.push({ sub, ...info });
  }
}
found.sort((a, b) => b.books.size - a.books.size || b.total - a.total || a.sub.length - b.sub.length);
const top = found.slice(0, 30);
for (const f of top) {
  console.log(
    `  ${f.sub.padEnd(9)} total=${String(f.total).padStart(3)} books=${String(f.books.size).padStart(3)}  e.g. ${[...f.books].slice(0, 3).join(", ")}`,
  );
}
console.log(`...(showing ${top.length} of ${found.length})`);
console.log();

// ---------------------------------------------------------------------------
// 6. Headers / footers — prefixos e sufixos compartilhados
// ---------------------------------------------------------------------------
console.log("=== HEAD/TAIL prefix-suffix repeats (5 digits) ===");
const headFreq = new Map<string, number>();
const tailFreq = new Map<string, number>();
for (const d of docs) {
  if (d.digits.length < 10) continue;
  const head = d.digits.slice(0, 5);
  const tail = d.digits.slice(-5);
  headFreq.set(head, (headFreq.get(head) ?? 0) + 1);
  tailFreq.set(tail, (tailFreq.get(tail) ?? 0) + 1);
}
const headTop = [...headFreq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]);
const tailTop = [...tailFreq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]);
console.log("Headers (5 digits) appearing in ≥2 books:");
if (headTop.length === 0) console.log("  none — every book starts uniquely");
else for (const [h, c] of headTop) console.log(`  ${h} → ${c} books`);
console.log("Tails (5 digits) appearing in ≥2 books:");
if (tailTop.length === 0) console.log("  none — every book ends uniquely");
else for (const [t, c] of tailTop) console.log(`  ${t} → ${c} books`);
console.log();

// ---------------------------------------------------------------------------
// 7. H3 explicit — split as bigrams (eye1, eye2 alternados) e medir
// ---------------------------------------------------------------------------
console.log("=== H3: blinking 2 eyes — split as bigrams ===");
// se cada bigrama é (eye1, eye2), separa em 2 streams
let eye1 = "";
let eye2 = "";
for (let i = 0; i + 1 < all.length; i += 2) {
  eye1 += all[i];
  eye2 += all[i + 1];
}
function digitHisto(s: string): number[] {
  const out = new Array(10).fill(0);
  for (const c of s) out[Number(c)] += 1;
  return out;
}
const h1 = digitHisto(eye1);
const h2 = digitHisto(eye2);
console.log("eye1 freq:", h1.map((c, i) => `${i}:${(c / eye1.length).toFixed(3)}`).join(" "));
console.log("eye2 freq:", h2.map((c, i) => `${i}:${(c / eye2.length).toFixed(3)}`).join(" "));
let chi1 = 0,
  chi2 = 0;
const exp = eye1.length / 10;
for (let i = 0; i < 10; i++) {
  chi1 += Math.pow(h1[i] - exp, 2) / exp;
  chi2 += Math.pow(h2[i] - exp, 2) / exp;
}
console.log(`chi-square eye1=${chi1.toFixed(2)} eye2=${chi2.toFixed(2)} (df=9, crit 0.05=16.92)`);
console.log();

// ---------------------------------------------------------------------------
// 8. Resumo
// ---------------------------------------------------------------------------
console.log("=== SUMMARY ===");
console.log(`Books: ${docs.length}`);
console.log(`Total digits: ${N}`);
console.log(`IC: ${ic.toFixed(4)} (uniform=0.1000; lang typical=0.05-0.07 in same base)`);
console.log(`Unigram chi-square: ${chiSquare.toFixed(2)} / 9 df  (>16.92 = significant non-uniform)`);
console.log(`Bigram chi-square: ${bigramChi.toFixed(2)} / 99 df  (>123.2 = significant non-uniform)`);
console.log(`Repeated substrings (≥5 chars, ≥3 occur, ≥2 books): ${found.length}`);
console.log(`Headers repeating in ≥2 books: ${headTop.length}`);
console.log(`Tails repeating in ≥2 books: ${tailTop.length}`);
