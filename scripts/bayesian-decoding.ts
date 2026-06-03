// Decodificação Bayesiana do corpus bonelord:
//
//   1. Constrói vocabulário a partir de n-grams com log-odds alto.
//   2. Tokeniza cada book via Viterbi (max-likelihood segmentation).
//   3. Pra cada token, computa "context vector" (vizinhança esquerda + direita).
//   4. Cluster tokens por classe gramatical via cosine similarity.
//   5. Inicia clusters com cribs canônicos:
//        3478 → 'race' (Bonelord, canon)
//        1    → 'world' (Tibia, canon)
//        145145 / 451451 → 'name' (estatístico)
//        15135 → 'predicate-prefix' (vizinhança de 3478)
//        01928 → 'predicate-suffix' (vizinhança de 3478)
//   6. Propaga: tokens com contexto similar a cribs herdam classe.
//   7. Output: léxico expandido com classe gramatical inferida.

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");
const N = all.length;

// ===========================================================================
// 1. CONSTRÓI VOCABULÁRIO — n-grams com log-odds alto
// ===========================================================================
function logOdds(c: number, len: number, total: number): number {
  if (c === 0) return -Infinity;
  return Math.log2((c / total) / Math.pow(10, -len));
}

const vocab = new Map<string, { count: number; len: number; lo: number; logP: number }>();

// Pega n-grams entre 2 e 7 dígitos com log-odds significativo
for (const ngLen of [2, 3, 4, 5, 6, 7]) {
  const cnt = new Map<string, number>();
  const total = N - ngLen + 1;
  for (let i = 0; i <= N - ngLen; i++) {
    const g = all.slice(i, i + ngLen);
    cnt.set(g, (cnt.get(g) ?? 0) + 1);
  }
  // Threshold de log-odds e count
  const THRESHOLDS: Record<number, { lo: number; count: number }> = {
    2: { lo: 0.5, count: 100 },
    3: { lo: 2.0, count: 50 },
    4: { lo: 4.0, count: 30 },
    5: { lo: 7.0, count: 20 },
    6: { lo: 9.0, count: 15 },
    7: { lo: 11.0, count: 10 },
  };
  const t = THRESHOLDS[ngLen];
  for (const [g, c] of cnt) {
    if (c < t.count) continue;
    const lo = logOdds(c, ngLen, total);
    if (lo < t.lo) continue;
    // logP pra Viterbi (use frequência sobre corpus)
    const logP = Math.log2(c / total);
    vocab.set(g, { count: c, len: ngLen, lo, logP });
  }
}
// Sempre garante presença dos cribs canônicos:
const FORCED = ["1", "3478", "0", "145145", "451451", "15135", "01928", "611451"];
for (const f of FORCED) {
  const c = (all.match(new RegExp(f, "g")) ?? []).length;
  const total = N - f.length + 1;
  if (c > 0 && !vocab.has(f)) {
    vocab.set(f, {
      count: c,
      len: f.length,
      lo: logOdds(c, f.length, total),
      logP: Math.log2(Math.max(c, 1) / total),
    });
  }
}

console.log(`Vocabulary size: ${vocab.size} tokens`);
console.log(`  Length distribution:`);
const byLen = new Map<number, number>();
for (const [, v] of vocab) byLen.set(v.len, (byLen.get(v.len) ?? 0) + 1);
for (const [k, v] of [...byLen.entries()].sort()) console.log(`    ${k}-gram: ${v}`);
console.log();

// ===========================================================================
// 2. VITERBI tokenization de cada book
//    Pra cada book, acha seg = arg max Σ log P(token_i)
//    onde token_i ∈ vocab e concatenação é o book inteiro.
//    Penalty pra "unknown character" (cobre lacunas).
// ===========================================================================
const UNK_PENALTY = -20; // log-prob de um caracter unknown — grande pra desincentivar

function tokenize(book: string): string[] {
  const n = book.length;
  const dp = new Array<number>(n + 1).fill(-Infinity);
  const back = new Array<number>(n + 1).fill(-1);
  const tok = new Array<string>(n + 1).fill("");
  dp[0] = 0;
  for (let i = 1; i <= n; i++) {
    // try all token lengths
    for (let len = 1; len <= 7 && len <= i; len++) {
      const sub = book.slice(i - len, i);
      let score: number;
      if (vocab.has(sub)) {
        score = dp[i - len] + vocab.get(sub)!.logP;
      } else if (len === 1) {
        // single-digit fallback (UNK)
        score = dp[i - len] + UNK_PENALTY;
      } else {
        continue;
      }
      if (score > dp[i]) {
        dp[i] = score;
        back[i] = i - len;
        tok[i] = sub;
      }
    }
  }
  // Backtrace
  const tokens: string[] = [];
  let pos = n;
  while (pos > 0) {
    tokens.unshift(tok[pos]);
    pos = back[pos];
  }
  return tokens;
}

// Tokeniza cada book e coleta estatísticas
const tokenized = docs.map((d) => ({ slug: d.slug, tokens: tokenize(d.digits) }));

const tokenFreq = new Map<string, number>();
let totalTokens = 0;
let unkTokens = 0;
for (const t of tokenized) {
  for (const tok of t.tokens) {
    tokenFreq.set(tok, (tokenFreq.get(tok) ?? 0) + 1);
    totalTokens++;
    if (tok.length === 1 && !vocab.has(tok)) unkTokens++;
  }
}
console.log(`Total tokens across all books: ${totalTokens}`);
console.log(`Avg tokens per book: ${(totalTokens / docs.length).toFixed(1)}`);
console.log(`UNK single-digit tokens: ${unkTokens} (${(unkTokens / totalTokens * 100).toFixed(1)}%)`);
console.log();

console.log("=== Top 25 tokens by frequency (after tokenization) ===");
const ranked = [...tokenFreq.entries()].sort((a, b) => b[1] - a[1]);
console.log("token   | count | %     | len");
for (const [t, c] of ranked.slice(0, 25)) {
  console.log(`  ${t.padEnd(7)} | ${String(c).padStart(4)} | ${((c / totalTokens) * 100).toFixed(2).padStart(5)}% | ${t.length}`);
}
console.log();

// ===========================================================================
// 3. CONTEXT VECTORS — pra cada token, conta tokens à esquerda e direita
//    Esta é a base de word2vec/distributional semantics.
// ===========================================================================
const leftCtx = new Map<string, Map<string, number>>();
const rightCtx = new Map<string, Map<string, number>>();
for (const t of tokenized) {
  for (let i = 0; i < t.tokens.length; i++) {
    const tok = t.tokens[i];
    if (i > 0) {
      const l = t.tokens[i - 1];
      let m = leftCtx.get(tok);
      if (!m) { m = new Map(); leftCtx.set(tok, m); }
      m.set(l, (m.get(l) ?? 0) + 1);
    }
    if (i < t.tokens.length - 1) {
      const r = t.tokens[i + 1];
      let m = rightCtx.get(tok);
      if (!m) { m = new Map(); rightCtx.set(tok, m); }
      m.set(r, (m.get(r) ?? 0) + 1);
    }
  }
}

// ===========================================================================
// 4. Cosine similarity entre context vectors
// ===========================================================================
function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    const av = a.get(k) ?? 0;
    const bv = b.get(k) ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function combinedSim(t1: string, t2: string): number {
  const l1 = leftCtx.get(t1) ?? new Map();
  const l2 = leftCtx.get(t2) ?? new Map();
  const r1 = rightCtx.get(t1) ?? new Map();
  const r2 = rightCtx.get(t2) ?? new Map();
  return 0.5 * cosineSim(l1, l2) + 0.5 * cosineSim(r1, r2);
}

// ===========================================================================
// 5. CLASS PROPAGATION — começa com cribs canônicos, propaga via similaridade
// ===========================================================================
const SEEDS: Record<string, string> = {
  "3478": "RACE",          // Bonelord (canon)
  "1": "WORLD",            // Tibia (canon)
  "145145": "NAME",        // candidato a nome próprio (ABCABC)
  "451451": "NAME",        // idem
  "15135": "PRE-RACE",     // sempre antes de 3478
  "01928": "POST-RACE",    // sempre depois de 3478
  "611451": "INVOCATION",  // root da família Chayenne
  "0": "TABOO",            // obscene (canon)
};

console.log("=== SEED tokens (cribs canônicos) ===");
for (const [tok, cls] of Object.entries(SEEDS)) {
  console.log(`  ${tok.padEnd(8)} → ${cls.padEnd(15)} (freq=${tokenFreq.get(tok) ?? 0})`);
}
console.log();

// Pra cada token frequente (excluindo seeds), encontra seed mais similar
const TOP_TOKENS_TO_CLASSIFY = 30;
const candidates = ranked
  .filter(([tok]) => !SEEDS[tok] && tok.length >= 2 && (tokenFreq.get(tok) ?? 0) >= 15)
  .slice(0, TOP_TOKENS_TO_CLASSIFY);

console.log("=== INFERRED CLASSES — top candidates with best matching seed ===");
console.log("token    | freq | best-match seed | sim   | inferred class");
console.log("---------|------|-----------------|-------|----------------");
const inferences: { tok: string; freq: number; seedTok: string; seedClass: string; sim: number }[] = [];
for (const [tok, freq] of candidates) {
  let bestSeed = "";
  let bestSim = -1;
  for (const seedTok of Object.keys(SEEDS)) {
    if (seedTok === tok) continue;
    const sim = combinedSim(tok, seedTok);
    if (sim > bestSim) {
      bestSim = sim;
      bestSeed = seedTok;
    }
  }
  if (bestSim < 0.20) continue;
  const seedClass = SEEDS[bestSeed];
  inferences.push({ tok, freq, seedTok: bestSeed, seedClass, sim: bestSim });
  console.log(
    `  ${tok.padEnd(7)} | ${String(freq).padStart(4)} | ${(bestSeed + " (" + seedClass + ")").padEnd(15)} | ${bestSim.toFixed(3)} | ${seedClass}`,
  );
}
console.log();

// ===========================================================================
// 6. LÉXICO POR CLASSE
// ===========================================================================
console.log("=== LÉXICO INFERIDO POR CLASSE ===");
const byClass = new Map<string, string[]>();
for (const cls of new Set(Object.values(SEEDS))) byClass.set(cls, []);
for (const [tok, cls] of Object.entries(SEEDS)) byClass.get(cls)!.push(tok);
for (const inf of inferences) byClass.get(inf.seedClass)!.push(inf.tok);

for (const [cls, toks] of byClass) {
  console.log(`  ${cls}:`);
  for (const t of toks) {
    const isSeed = SEEDS[t] === cls;
    console.log(`    ${t.padEnd(7)} ${isSeed ? "★ (seed)" : "  (inferred)"}  freq=${tokenFreq.get(t) ?? 0}`);
  }
}
console.log();

// ===========================================================================
// 7. SHOW TOKENIZATION OF KNOWN BOOKS
// ===========================================================================
console.log("=== EXAMPLE TOKENIZATIONS ===");
const examples = ["0421595615", "0152551751", "2295345274", "1928895216"];
for (const slug of examples) {
  const d = tokenized.find((x) => x.slug === slug);
  if (!d) continue;
  console.log(`  ${slug}:`);
  console.log(`    raw: ${docs.find(x => x.slug === slug)!.digits.slice(0, 80)}...`);
  console.log(`    seg: ${d.tokens.slice(0, 12).join(" | ")}...`);
  // Apply class labels
  const labeled = d.tokens.slice(0, 12).map((t) => {
    if (SEEDS[t]) return `${t}<${SEEDS[t]}>`;
    const inf = inferences.find((i) => i.tok === t);
    if (inf) return `${t}<${inf.seedClass}>`;
    return t;
  });
  console.log(`    lbl: ${labeled.join(" | ")}...`);
  console.log();
}

// ===========================================================================
// 8. PHRASE-LEVEL n-grams (sequences of TOKENS, not digits)
//    Quais sequências de 2-3 tokens são "frases canônicas"?
// ===========================================================================
console.log("=== TOKEN n-gram phrases (top 15) ===");
const tokenBigram = new Map<string, number>();
const tokenTrigram = new Map<string, number>();
for (const t of tokenized) {
  for (let i = 0; i < t.tokens.length - 1; i++) {
    const bg = `${t.tokens[i]} ⊕ ${t.tokens[i + 1]}`;
    tokenBigram.set(bg, (tokenBigram.get(bg) ?? 0) + 1);
  }
  for (let i = 0; i < t.tokens.length - 2; i++) {
    const tg = `${t.tokens[i]} ⊕ ${t.tokens[i + 1]} ⊕ ${t.tokens[i + 2]}`;
    tokenTrigram.set(tg, (tokenTrigram.get(tg) ?? 0) + 1);
  }
}
console.log("Token bigrams:");
for (const [bg, c] of [...tokenBigram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(c).padStart(3)}× ${bg}`);
}
console.log();
console.log("Token trigrams:");
for (const [tg, c] of [...tokenTrigram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(c).padStart(3)}× ${tg}`);
}
