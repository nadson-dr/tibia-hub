// Testa hipóteses de decodificação concreta sobre o corpus bonelord.
//
// H_A. Bigrama-base-26: cada par de dígitos (10-base) mod 26 → A-Z.
//      Se for cifra ASCII naive disso, IC do resultado seria ≈ 0.067 (inglês).
//
// H_B. Bigrama-base-27: igual mas com espaço (26 = space).
//
// H_C. Trigrama-base-26: 3 dígitos → letra. Range 000-999, mod 26.
//
// H_D. Periodicidade (Kasiski): substrings repetidas têm distância múltipla
//      de um período → indica cifra Vigenère.
//
// H_E. "Palavra" frequente vs posição (início, meio, fim do book).

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");
const N = all.length;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function indexOfCoincidence(s: string, alphabetSize: number): number {
  const count = new Map<string, number>();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  let ic = 0;
  for (const [, c] of count) ic += c * (c - 1);
  return ic / (s.length * (s.length - 1));
}

function decodeBigramMod(text: string, mod: number): string {
  let out = "";
  for (let i = 0; i + 1 < text.length; i += 2) {
    const v = parseInt(text.slice(i, i + 2), 10) % mod;
    out += mod === 26 ? String.fromCharCode(65 + v) : v === 26 ? " " : String.fromCharCode(65 + v);
  }
  return out;
}

function decodeTrigramMod(text: string): string {
  let out = "";
  for (let i = 0; i + 2 < text.length; i += 3) {
    const v = parseInt(text.slice(i, i + 3), 10) % 27;
    out += v === 26 ? " " : String.fromCharCode(65 + v);
  }
  return out;
}

function topNgram(s: string, n: number, k: number): [string, number][] {
  const map = new Map<string, number>();
  for (let i = 0; i + n <= s.length; i++) {
    const g = s.slice(i, i + n);
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
}

// ---------------------------------------------------------------------------
// H_A / H_B / H_C
// ---------------------------------------------------------------------------
function testHypothesis(label: string, decoded: string, alphabetSize: number) {
  const ic = indexOfCoincidence(decoded, alphabetSize);
  const sample = decoded.slice(0, 120);
  const topL = topNgram(decoded, 1, 6);
  console.log(`--- ${label} ---`);
  console.log(`  decoded len = ${decoded.length}`);
  console.log(`  IC (alphabet=${alphabetSize}) = ${ic.toFixed(5)}`);
  console.log(`    [reference: english IC=0.0667 | uniform=${(1 / alphabetSize).toFixed(4)}]`);
  console.log(`  top symbols: ${topL.map(([s, c]) => `${s}=${c}`).join(" ")}`);
  console.log(`  sample: "${sample}"`);
  console.log();
}

console.log("=== HYPOTHESIS TESTS ===");
testHypothesis("H_A: bigram mod 26 → A-Z", decodeBigramMod(all, 26), 26);
testHypothesis("H_B: bigram mod 27 → A-Z + space", decodeBigramMod(all, 27), 27);
testHypothesis("H_C: trigram mod 27", decodeTrigramMod(all), 27);

// ---------------------------------------------------------------------------
// H_D: Kasiski-like — distâncias entre ocorrências da mesma trigrama
// ---------------------------------------------------------------------------
console.log("=== H_D: KASISKI period analysis ===");
console.log("Distance between repeats of frequent trigrams — GCD reveals period if Vigenère");
const trigrams = ["611", "519", "646", "118", "114"];
for (const tg of trigrams) {
  const positions: number[] = [];
  for (let i = 0; i + 3 <= all.length; i++) if (all.slice(i, i + 3) === tg) positions.push(i);
  const dists: number[] = [];
  for (let i = 1; i < positions.length; i++) dists.push(positions[i] - positions[i - 1]);
  // GCD of distances
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  const g = dists.reduce((a, b) => gcd(a, b));
  const small = dists.filter((d) => d < 60).slice(0, 15);
  console.log(`  ${tg}: ${positions.length} occurrences, gcd(distances)=${g}, small distances=${small.join(",")}`);
}
console.log();

// ---------------------------------------------------------------------------
// H_E: posição das palavras frequentes
// ---------------------------------------------------------------------------
console.log("=== H_E: position of most-frequent 'words' within each book ===");
const words = ["88952", "89521", "91180", "61145", "11800", "9118003"];
for (const w of words) {
  let firstPositions: number[] = [];
  let normalizedPositions: number[] = [];
  for (const d of docs) {
    const idx = d.digits.indexOf(w);
    if (idx === -1) continue;
    firstPositions.push(idx);
    normalizedPositions.push(idx / d.digits.length);
  }
  if (firstPositions.length === 0) continue;
  const mean = firstPositions.reduce((a, b) => a + b, 0) / firstPositions.length;
  const meanNorm = normalizedPositions.reduce((a, b) => a + b, 0) / normalizedPositions.length;
  // contagem em fraction-of-book buckets
  const buckets = [0, 0, 0, 0]; // 0-25%, 25-50%, 50-75%, 75-100%
  for (const p of normalizedPositions) buckets[Math.min(3, Math.floor(p * 4))] += 1;
  console.log(
    `  ${w.padEnd(8)} | first-occur mean=${mean.toFixed(1).padStart(6)} | normalized mean=${meanNorm.toFixed(3)} | buckets ${buckets.join(",")}`,
  );
}
console.log();

// ---------------------------------------------------------------------------
// H_F: forbidden bigrams — quais combinações nunca aparecem?
// ---------------------------------------------------------------------------
console.log("=== H_F: FORBIDDEN / RARE bigrams (rare = count < 5) ===");
const bigram = new Map<string, number>();
for (let i = 0; i + 1 < all.length; i++) {
  const bg = all.slice(i, i + 2);
  bigram.set(bg, (bigram.get(bg) ?? 0) + 1);
}
const rare: string[] = [];
const never: string[] = [];
for (let i = 0; i < 100; i++) {
  const bg = i.toString().padStart(2, "0");
  const c = bigram.get(bg) ?? 0;
  if (c === 0) never.push(bg);
  else if (c < 5) rare.push(`${bg}(${c})`);
}
console.log(`  Never:  [${never.join(", ")}]  (${never.length} forbidden bigrams)`);
console.log(`  Rare:   [${rare.join(", ")}]  (${rare.length} bigrams with <5 occurrences)`);
console.log(`  Most-frequent bigram ratio (top1/least) = ${(444 / Math.max(1, never.length === 0 ? 1 : 1)).toFixed(0)}× when forbidden exist`);
console.log();

// ---------------------------------------------------------------------------
// H_G: substring "88952" — boundary entropy. Onde palavras terminam?
//      Olha o que vem antes e depois da palavra-âncora.
// ---------------------------------------------------------------------------
console.log("=== H_G: BOUNDARY context for top word '88952' ===");
const W = "88952";
const beforeFreq = new Map<string, number>();
const afterFreq = new Map<string, number>();
for (const d of docs) {
  let from = 0;
  while (true) {
    const idx = d.digits.indexOf(W, from);
    if (idx === -1) break;
    if (idx > 0) {
      const b = d.digits[idx - 1];
      beforeFreq.set(b, (beforeFreq.get(b) ?? 0) + 1);
    }
    if (idx + W.length < d.digits.length) {
      const a = d.digits[idx + W.length];
      afterFreq.set(a, (afterFreq.get(a) ?? 0) + 1);
    }
    from = idx + 1;
  }
}
console.log("  before '88952': " + [...beforeFreq.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" "));
console.log("  after  '88952': " + [...afterFreq.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" "));
console.log();

// ---------------------------------------------------------------------------
// H_H: longest common substring entre pares de books (potencial "frase")
// ---------------------------------------------------------------------------
console.log("=== H_H: longest shared substring across pairs of books ===");
function lcs(a: string, b: string): { length: number; sub: string } {
  // Suffix-array-free naive — corpus pequeno.
  // Mas books podem ter até 294 dígitos → quadratic é OK pra um sample.
  let best = { length: 0, sub: "" };
  const dp = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const cur = a[i - 1] === b[j - 1] ? prev + 1 : 0;
      if (cur > best.length) best = { length: cur, sub: a.slice(i - cur, i) };
      prev = dp[j];
      dp[j] = cur;
    }
  }
  return best;
}
const sample = docs.slice(0, 10);
for (let i = 0; i < sample.length; i++) {
  for (let j = i + 1; j < sample.length; j++) {
    const r = lcs(sample[i].digits, sample[j].digits);
    if (r.length >= 12) {
      console.log(`  ${sample[i].slug} ∩ ${sample[j].slug}: ${r.length} chars → "${r.sub}"`);
    }
  }
}
console.log();
