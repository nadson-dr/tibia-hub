// Modela a linguagem bonelord com Markov de ordem k e mede compressibilidade
// (proxy de entropia). Gera amostras "bonelord-style".
import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");
const N = all.length;

// ---------------------------------------------------------------------------
// Entropia de Shannon por ordem
//   H_1 = unigrama; H_2 = bigrama; H_3 = trigrama; etc.
//   Entropia condicional H(X_n | X_{n-1}, ..., X_{n-k+1}) revela quanto a
//   sequência é "previsível dado os anteriores".
//   Pra ruído uniforme base-10: H = log2(10) ≈ 3.32 bits/digit.
//   Inglês ASCII em base 10 (depois de codificar): geralmente 1.0-1.5 bits.
// ---------------------------------------------------------------------------
function entropyOfOrder(text: string, order: number): number {
  // P(c | context_k) — conditional
  const ctxCount = new Map<string, number>();
  const ctxNextCount = new Map<string, Map<string, number>>();
  for (let i = order; i < text.length; i++) {
    const ctx = text.slice(i - order, i);
    const next = text[i];
    ctxCount.set(ctx, (ctxCount.get(ctx) ?? 0) + 1);
    let m = ctxNextCount.get(ctx);
    if (!m) {
      m = new Map();
      ctxNextCount.set(ctx, m);
    }
    m.set(next, (m.get(next) ?? 0) + 1);
  }
  let H = 0;
  let totalCtx = 0;
  for (const [ctx, c] of ctxCount) totalCtx += c;
  for (const [ctx, cMap] of ctxNextCount) {
    const ctxC = ctxCount.get(ctx)!;
    const pCtx = ctxC / totalCtx;
    let hCtx = 0;
    for (const [, n] of cMap) {
      const p = n / ctxC;
      hCtx -= p * Math.log2(p);
    }
    H += pCtx * hCtx;
  }
  return H;
}

console.log("=== SHANNON ENTROPY (bits per digit) ===");
console.log("uniform base-10 maximum = log2(10) = 3.3219");
for (let k = 0; k <= 5; k++) {
  const H = entropyOfOrder(all, k);
  console.log(`  H[${k}] (context len=${k}) = ${H.toFixed(4)} bits/digit  ${"█".repeat(Math.round(H * 6))}`);
}
console.log("  (decrease shows long-range structure / predictability)");
console.log();

// ---------------------------------------------------------------------------
// Markov sample — gera "frase bonelord" plausível
// ---------------------------------------------------------------------------
function markovTransitions(text: string, order: number): Map<string, Map<string, number>> {
  const transitions = new Map<string, Map<string, number>>();
  for (let i = order; i < text.length; i++) {
    const ctx = text.slice(i - order, i);
    const next = text[i];
    let m = transitions.get(ctx);
    if (!m) {
      m = new Map();
      transitions.set(ctx, m);
    }
    m.set(next, (m.get(next) ?? 0) + 1);
  }
  return transitions;
}

function sample(transitions: Map<string, Map<string, number>>, seed: string, length: number): string {
  let out = seed;
  while (out.length < length) {
    const ctx = out.slice(-seed.length);
    const m = transitions.get(ctx);
    if (!m) break;
    let total = 0;
    for (const [, c] of m) total += c;
    let pick = Math.random() * total;
    let picked = "";
    for (const [k, c] of m) {
      pick -= c;
      if (pick <= 0) {
        picked = k;
        break;
      }
    }
    if (!picked) break;
    out += picked;
  }
  return out;
}

console.log("=== MARKOV SAMPLES (orders 3, 4, 5) ===");
for (const k of [3, 4, 5]) {
  const t = markovTransitions(all, k);
  const seed = "61145".slice(0, k);
  const s = sample(t, seed, 160);
  console.log(`  order=${k}: ${s}`);
}
console.log();

// ---------------------------------------------------------------------------
// Compressibility via gzip-like Lempel-Ziv proxy: ratio entre len e dictionary
// ---------------------------------------------------------------------------
function lzPhrases(text: string): number {
  const dict = new Set<string>();
  let i = 0;
  while (i < text.length) {
    let len = 1;
    while (i + len <= text.length && dict.has(text.slice(i, i + len))) len += 1;
    dict.add(text.slice(i, i + len));
    i += len;
  }
  return dict.size;
}
const phrases = lzPhrases(all);
console.log("=== LZ COMPLEXITY ===");
console.log(`LZ phrases: ${phrases}`);
console.log(`Per char: ${(phrases / N).toFixed(4)}`);
console.log(`Reference: uniform random would give ~${Math.round(Math.sqrt(2 * N / Math.log2(N)))}`);
