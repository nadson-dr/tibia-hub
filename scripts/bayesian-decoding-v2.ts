// Decodificação Bayesiana v2 — refinada:
//   - Vocab focado em cribs canônicos + n-grams com log-odds MUITO alto
//   - Boundary detection via branching entropy (técnica clássica de
//     unsupervised word segmentation — Harris 1955)
//   - Cross-validation entre Viterbi e entropy boundaries
//   - Inference de classes via contexto bayesiano

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");
const N = all.length;

// ===========================================================================
// 1. BRANCHING ENTROPY — boundary detection (Harris 1955)
//    Pra cada substring s, computa H(próximo dígito | s).
//    Spike em H = limite de palavra (palavra termina aqui).
// ===========================================================================

function buildSuffixCounts(): Map<string, Map<string, number>> {
  // map: substring → distribuição do próximo dígito
  const counts = new Map<string, Map<string, number>>();
  for (let L = 1; L <= 6; L++) {
    for (let i = 0; i <= N - L - 1; i++) {
      const s = all.slice(i, i + L);
      const next = all[i + L];
      let m = counts.get(s);
      if (!m) { m = new Map(); counts.set(s, m); }
      m.set(next, (m.get(next) ?? 0) + 1);
    }
  }
  return counts;
}

function shannonEntropy(dist: Map<string, number>): number {
  let total = 0;
  for (const v of dist.values()) total += v;
  let H = 0;
  for (const v of dist.values()) {
    const p = v / total;
    if (p > 0) H -= p * Math.log2(p);
  }
  return H;
}

console.log("Building branching entropy index...");
const suffixCounts = buildSuffixCounts();
console.log(`Indexed ${suffixCounts.size} substrings`);

// Pra cada posição no corpus all, calcula entropia branching à direita
// usando o sufixo mais informativo (o mais longo com dados suficientes)
function branchingEntropyAt(pos: number): number {
  for (let L = 6; L >= 2; L--) {
    if (pos - L < 0) continue;
    const sub = all.slice(pos - L, pos);
    const dist = suffixCounts.get(sub);
    if (!dist) continue;
    let total = 0;
    for (const v of dist.values()) total += v;
    if (total < 5) continue; // not enough evidence
    return shannonEntropy(dist);
  }
  return Math.log2(10); // fallback to maximum (uniform)
}

// ===========================================================================
// 2. ESCOLHE BOUNDARIES por entropy peaks
//    Boundaries em posições onde entropia local é máxima localmente
// ===========================================================================
console.log("Computing branching entropy at every position...");
const entropies = new Array<number>(N).fill(0);
for (let i = 1; i < N; i++) entropies[i] = branchingEntropyAt(i);

// Distribuição da entropia
const sortedH = [...entropies].slice(2).sort((a, b) => a - b);
const median = sortedH[Math.floor(sortedH.length / 2)];
const p75 = sortedH[Math.floor(sortedH.length * 0.75)];
const p90 = sortedH[Math.floor(sortedH.length * 0.9)];
console.log(`Entropy distribution: median=${median.toFixed(2)} p75=${p75.toFixed(2)} p90=${p90.toFixed(2)}`);

// Boundary = entropia > p75 (palavras "comuns" estão em low-entropy stretches)
const BOUNDARY_THRESHOLD = p75;
console.log(`Boundary threshold: ${BOUNDARY_THRESHOLD.toFixed(2)} bits`);
console.log();

// ===========================================================================
// 3. SEGMENTA cada book usando entropy boundaries
// ===========================================================================
function segmentWithEntropy(book: string, globalOffset: number): string[] {
  const tokens: string[] = [];
  let start = 0;
  for (let i = 1; i < book.length; i++) {
    if (entropies[globalOffset + i] > BOUNDARY_THRESHOLD) {
      tokens.push(book.slice(start, i));
      start = i;
    }
  }
  if (start < book.length) tokens.push(book.slice(start));
  return tokens;
}

// Calcular offsets de cada book em `all`
const offsets: number[] = [];
let off = 0;
for (const d of docs) {
  offsets.push(off);
  off += d.digits.length;
}

const segmented = docs.map((d, idx) => ({
  slug: d.slug,
  tokens: segmentWithEntropy(d.digits, offsets[idx]),
}));

// Estatísticas
const tokFreq = new Map<string, number>();
const tokInBooks = new Map<string, Set<string>>();
let totalTok = 0;
for (const s of segmented) {
  for (const t of s.tokens) {
    if (t.length === 0) continue;
    tokFreq.set(t, (tokFreq.get(t) ?? 0) + 1);
    let bs = tokInBooks.get(t);
    if (!bs) { bs = new Set(); tokInBooks.set(t, bs); }
    bs.add(s.slug);
    totalTok++;
  }
}
const tokLens = [...tokFreq.keys()].map((t) => t.length);
console.log(`Total tokens: ${totalTok}`);
console.log(`Unique tokens: ${tokFreq.size}`);
console.log(`Avg token length: ${(tokLens.reduce((a, b) => a + b, 0) / tokLens.length).toFixed(2)}`);
console.log(`Avg tokens per book: ${(totalTok / docs.length).toFixed(1)}`);
console.log();

// ===========================================================================
// 4. RANKED VOCABULARY — top tokens por (freq × books)
//    Privilegia tokens que aparecem em muitos books distintos
// ===========================================================================
const ranked = [...tokFreq.entries()]
  .map(([t, c]) => ({ tok: t, count: c, books: tokInBooks.get(t)!.size }))
  .filter((x) => x.tok.length >= 2 && x.count >= 3)
  .sort((a, b) => b.books - a.books || b.count - a.count);

console.log("=== TOP TOKENS (frequency × book-coverage) ===");
console.log("token            | freq | books | len");
console.log("-----------------|------|-------|----");
for (const r of ranked.slice(0, 30)) {
  console.log(`  ${r.tok.padEnd(16)} | ${String(r.count).padStart(4)} | ${String(r.books).padStart(5)} | ${r.tok.length}`);
}
console.log();

// ===========================================================================
// 5. CRIB CONTEXT (de novo, mas com tokens limpos)
//    Pega cada crib canônico e mostra qual TOKEN aparece antes/depois
// ===========================================================================
const CRIBS_TO_TRACE = ["3478", "1", "0", "451451", "145145", "611451"];
console.log("=== TOKEN CONTEXT around canonical cribs ===");

for (const crib of CRIBS_TO_TRACE) {
  console.log(`\nCRIB "${crib}":`);
  // Pra cada book, acha posições onde aparece o crib e captura tokens vizinhos
  const beforeTokens = new Map<string, number>();
  const afterTokens = new Map<string, number>();
  let occurrences = 0;
  for (const s of segmented) {
    for (let i = 0; i < s.tokens.length; i++) {
      const t = s.tokens[i];
      if (!t.includes(crib)) continue;
      occurrences++;
      if (i > 0) {
        const b = s.tokens[i - 1];
        beforeTokens.set(b, (beforeTokens.get(b) ?? 0) + 1);
      }
      if (i < s.tokens.length - 1) {
        const a = s.tokens[i + 1];
        afterTokens.set(a, (afterTokens.get(a) ?? 0) + 1);
      }
    }
  }
  console.log(`  Containing-token occurrences: ${occurrences}`);
  const topBefore = [...beforeTokens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topAfter = [...afterTokens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  console.log(`  Token ← before: ${topBefore.map(([t, c]) => `${t}×${c}`).join(", ")}`);
  console.log(`  Token after → : ${topAfter.map(([t, c]) => `${t}×${c}`).join(", ")}`);
}
console.log();

// ===========================================================================
// 6. CLASS PROPAGATION via distributional similarity
// ===========================================================================
console.log("=== CONTEXT VECTORS for top tokens ===");

const leftCtx = new Map<string, Map<string, number>>();
const rightCtx = new Map<string, Map<string, number>>();
for (const s of segmented) {
  for (let i = 0; i < s.tokens.length; i++) {
    const t = s.tokens[i];
    if (i > 0) {
      const l = s.tokens[i - 1];
      let m = leftCtx.get(t); if (!m) { m = new Map(); leftCtx.set(t, m); }
      m.set(l, (m.get(l) ?? 0) + 1);
    }
    if (i < s.tokens.length - 1) {
      const r = s.tokens[i + 1];
      let m = rightCtx.get(t); if (!m) { m = new Map(); rightCtx.set(t, m); }
      m.set(r, (m.get(r) ?? 0) + 1);
    }
  }
}

function cos(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    const av = a.get(k) ?? 0;
    const bv = b.get(k) ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function sim(t1: string, t2: string): number {
  const l = cos(leftCtx.get(t1) ?? new Map(), leftCtx.get(t2) ?? new Map());
  const r = cos(rightCtx.get(t1) ?? new Map(), rightCtx.get(t2) ?? new Map());
  return 0.5 * l + 0.5 * r;
}

// Tokens-âncora reais que apareceram no top
const anchors = ranked.slice(0, 15).map((r) => r.tok);
console.log("\nSimilarity matrix between top-15 tokens:");
console.log("            " + anchors.map((a) => a.slice(0, 6).padStart(7)).join(""));
for (const a of anchors) {
  let line = `  ${a.slice(0, 10).padEnd(11)} `;
  for (const b of anchors) {
    const s = sim(a, b);
    line += s.toFixed(2).padStart(7);
  }
  console.log(line);
}
console.log();

// ===========================================================================
// 7. EXAMPLE TOKENIZATIONS WITH ENTROPY
// ===========================================================================
console.log("=== EXAMPLE TOKENIZATIONS ===");
for (const slug of ["0152551751", "0421595615", "1928895216", "2295345274"]) {
  const s = segmented.find((x) => x.slug === slug);
  if (!s) continue;
  console.log(`  ${slug}:`);
  console.log(`    tokens: ${s.tokens.slice(0, 15).join(" | ")} ...`);
}
console.log();

// ===========================================================================
// 8. RESPONDE: QUANTOS TOKENS DISTINTOS SÃO COMPARTILHADOS POR ≥3 BOOKS?
//    Esses são as "palavras canônicas" reais do dialeto.
// ===========================================================================
const sharedTokens = [...tokInBooks.entries()].filter(([, bs]) => bs.size >= 3);
console.log(`\nTokens compartilhados por ≥3 books: ${sharedTokens.length}`);
console.log(`Tokens em ≥10 books: ${sharedTokens.filter(([, bs]) => bs.size >= 10).length}`);
console.log(`Tokens em ≥20 books: ${sharedTokens.filter(([, bs]) => bs.size >= 20).length}`);
console.log();

console.log("=== Top 30 'canonical words' (≥10 books) ===");
const canonical = sharedTokens
  .filter(([t, bs]) => t.length >= 2 && bs.size >= 10)
  .sort(([, a], [, b]) => b.size - a.size)
  .slice(0, 30);
for (const [t, bs] of canonical) {
  console.log(`  ${t.padEnd(16)} in ${bs.size} books  (count=${tokFreq.get(t)})`);
}
