// Aplicação de conceitos criptanalíticos de Turing (Bletchley Park) ao corpus
// bonelord-language (469).
//
// Cribs canônicos conhecidos:
//   "1"     = Tibia (o mundo)            — Wrinkled NPC
//   "3478"  = Beholder/Bonelord (a raça) — Knightmare 15-yr event
//   "145"   = candidato a nome próprio   — análise estatística (16 ABCABC repeats)
//   "451"   = candidato a nome próprio   — idem
//   "0"     = palavra obscena (tabu)     — Wrinkled NPC
//
// Métodos:
//   1. CRIB DRAGGING — pra cada crib, listar contextos canônicos (vizinhança).
//   2. BANBURISMUS — log-odds pra rankear bigramas/trigramas vs uniform.
//   3. BOMBE-style LOOP DETECTION — busca ciclos no grafo de transições.
//   4. MUTUAL INFORMATION — quanta info dígito X dá sobre Y no contexto?
//   5. KAPPA TEST — coincidence count entre books offsetados.

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");
const N = all.length;

// ===========================================================================
// 1. CRIB DRAGGING — vizinhança de cada palavra canônica
// ===========================================================================
console.log("=== 1. CRIB DRAGGING — boundary words around canonical cribs ===");
console.log();

function dragCrib(crib: string, ctxSize = 3) {
  const before = new Map<string, number>();
  const after = new Map<string, number>();
  const both = new Map<string, number>();
  let occurrences = 0;
  for (const d of docs) {
    let from = 0;
    while (true) {
      const idx = d.digits.indexOf(crib, from);
      if (idx === -1) break;
      occurrences++;
      if (idx >= ctxSize) {
        const b = d.digits.slice(idx - ctxSize, idx);
        before.set(b, (before.get(b) ?? 0) + 1);
      }
      if (idx + crib.length + ctxSize <= d.digits.length) {
        const a = d.digits.slice(idx + crib.length, idx + crib.length + ctxSize);
        after.set(a, (after.get(a) ?? 0) + 1);
      }
      if (idx >= ctxSize && idx + crib.length + ctxSize <= d.digits.length) {
        const b = d.digits.slice(idx - ctxSize, idx + crib.length + ctxSize);
        both.set(b, (both.get(b) ?? 0) + 1);
      }
      from = idx + 1;
    }
  }
  return { occurrences, before, after, both };
}

const cribs = ["3478", "145", "451", "1185", "611451"];
for (const crib of cribs) {
  const r = dragCrib(crib, 3);
  console.log(`CRIB "${crib}" (occurrences: ${r.occurrences})`);
  const topBefore = [...r.before.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topAfter = [...r.after.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(`  ←before: ${topBefore.map(([s, c]) => `[${s}]×${c}`).join(" ")}`);
  console.log(`  after→ : ${topAfter.map(([s, c]) => `[${s}]×${c}`).join(" ")}`);
  // Frase canônica recorrente (vizinhança completa)
  const topBoth = [...r.both.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`  full ctx: ${topBoth.map(([s, c]) => `"${s}"×${c}`).join(" ")}`);
  console.log();
}

// ===========================================================================
// 2. BANBURISMUS — log-odds por bigrama/trigrama
//    log P(bigram | corpus) - log P(bigram | uniform)
//    Bigramas com log-odds alto = "palavras canônicas" estatisticamente.
// ===========================================================================
console.log("=== 2. BANBURISMUS — log-odds ranking ===");
console.log();
function logOdds(n: number, len: number, alphabet: number, total: number): number {
  if (n === 0) return -Infinity;
  const pCorpus = n / total;
  const pUniform = Math.pow(alphabet, -len);
  return Math.log2(pCorpus / pUniform);
}

for (const ngramLen of [2, 3, 4, 5]) {
  const counts = new Map<string, number>();
  const total = N - ngramLen + 1;
  for (let i = 0; i <= N - ngramLen; i++) {
    const g = all.slice(i, i + ngramLen);
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .map(([g, c]) => ({ g, c, lo: logOdds(c, ngramLen, 10, total) }))
    .sort((a, b) => b.lo - a.lo);
  console.log(`Top 10 ${ngramLen}-grams by log-odds:`);
  for (const r of ranked.slice(0, 10)) {
    console.log(`  ${r.g.padEnd(6)}  count=${String(r.c).padStart(4)}  log-odds=${r.lo.toFixed(2)}`);
  }
  console.log(`Bottom 5 (most suppressed):`);
  for (const r of ranked.slice(-5)) {
    console.log(`  ${r.g.padEnd(6)}  count=${String(r.c).padStart(4)}  log-odds=${r.lo.toFixed(2)}`);
  }
  console.log();
}

// ===========================================================================
// 3. BOMBE-style LOOP DETECTION — cycles no transition graph
//    Em Enigma, Turing/Welchman achavam loops em "menus" pra eliminar configs.
//    Aqui: pra cada dígito d, qual é o sucessor mais provável? Se A→B→C→A,
//    é um "atrator" gramatical.
// ===========================================================================
console.log("=== 3. BOMBE-style LOOP DETECTION ===");
console.log();
const transition = new Map<string, Map<string, number>>();
for (let i = 0; i < N - 1; i++) {
  const from = all[i];
  const to = all[i + 1];
  let m = transition.get(from);
  if (!m) {
    m = new Map();
    transition.set(from, m);
  }
  m.set(to, (m.get(to) ?? 0) + 1);
}

console.log("Top successor of each digit (Markov-1 mode):");
const mostLikelyNext = new Map<string, string>();
for (let d = 0; d < 10; d++) {
  const m = transition.get(String(d));
  if (!m) continue;
  const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
  const total = [...m.values()].reduce((a, b) => a + b);
  const top = sorted[0];
  mostLikelyNext.set(String(d), top[0]);
  const pTop = top[1] / total;
  const ent = sorted.reduce((acc, [, c]) => {
    const p = c / total;
    return acc - p * Math.log2(p);
  }, 0);
  console.log(`  ${d} → ${top[0]} (p=${(pTop * 100).toFixed(1)}%)   entropy=${ent.toFixed(2)} bits`);
}
console.log();

// Loop detection: a → b → c → ... → a
console.log("Loops in Markov-1 mode (each digit → most-likely next):");
function findLoop(start: string): string[] | null {
  const seen: string[] = [];
  let cur = start;
  for (let step = 0; step < 12; step++) {
    seen.push(cur);
    const next = mostLikelyNext.get(cur);
    if (!next) return null;
    if (seen.includes(next)) {
      // loop detected; return cycle portion
      return [...seen, next].slice(seen.indexOf(next));
    }
    cur = next;
  }
  return null;
}
const seenLoops = new Set<string>();
for (let d = 0; d < 10; d++) {
  const loop = findLoop(String(d));
  if (loop) {
    const key = [...loop].sort().join("");
    if (!seenLoops.has(key)) {
      seenLoops.add(key);
      console.log(`  start=${d}: loop = ${loop.join(" → ")}`);
    }
  }
}
console.log();

// ===========================================================================
// 4. MUTUAL INFORMATION — I(X_n ; X_{n+k}) para distâncias k
//    Em Vigenère/cifras com chave periódica, MI tem picos em múltiplos do período.
// ===========================================================================
console.log("=== 4. MUTUAL INFORMATION at different lags ===");
console.log();
function mutualInfo(s: string, lag: number): number {
  const joint = new Map<string, number>();
  const marg1 = new Map<string, number>();
  const marg2 = new Map<string, number>();
  let total = 0;
  for (let i = 0; i < s.length - lag; i++) {
    const a = s[i];
    const b = s[i + lag];
    const key = a + b;
    joint.set(key, (joint.get(key) ?? 0) + 1);
    marg1.set(a, (marg1.get(a) ?? 0) + 1);
    marg2.set(b, (marg2.get(b) ?? 0) + 1);
    total++;
  }
  let mi = 0;
  for (const [k, c] of joint) {
    const [a, b] = [k[0], k[1]];
    const pj = c / total;
    const pa = (marg1.get(a) ?? 0) / total;
    const pb = (marg2.get(b) ?? 0) / total;
    if (pj > 0 && pa > 0 && pb > 0) mi += pj * Math.log2(pj / (pa * pb));
  }
  return mi;
}
console.log("Lag | MI (bits)  | bar");
for (let lag = 1; lag <= 30; lag++) {
  const mi = mutualInfo(all, lag);
  const bar = "█".repeat(Math.round(mi * 80));
  console.log(`  ${String(lag).padStart(2)}  | ${mi.toFixed(4)}     |${bar}`);
}
console.log();

// ===========================================================================
// 5. KAPPA TEST — coincidence rate between text and shifted version of itself
//    Friedman/Turing classic: kappa = matches / total at offset k.
//    Random base-10: kappa ≈ 0.10. Vigenère-cifrado: peaks at key length.
// ===========================================================================
console.log("=== 5. KAPPA TEST (coincidence rate at offset k) ===");
console.log("Random base-10 expected kappa ≈ 0.10");
console.log();
console.log("Offset | matches/total | kappa  | bar");
for (let offset = 1; offset <= 40; offset++) {
  let matches = 0;
  let total = 0;
  for (let i = 0; i < N - offset; i++) {
    if (all[i] === all[i + offset]) matches++;
    total++;
  }
  const kappa = matches / total;
  const bar = "█".repeat(Math.round(kappa * 200));
  const flag = kappa > 0.115 ? " ←" : "";
  console.log(`  ${String(offset).padStart(2)}    | ${String(matches).padStart(5)}/${total}  | ${kappa.toFixed(4)} |${bar}${flag}`);
}
console.log();

// ===========================================================================
// 6. CRIB-COMPATIBLE CONTEXT — Bombe-style hypothesis testing
//    Dado que "3478" = "Bonelord", quais bigramas vêm IMEDIATAMENTE antes/depois?
//    Se aparecer um padrão consistente do tipo "[X] 3478 [Y]", entao [X] ou [Y]
//    são candidatos a "the" / "our" / "of".
// ===========================================================================
console.log("=== 6. CRIB CONTEXT canonical phrases — '3478' anchor ===");
console.log();
const ctx3478 = new Map<string, number>();
for (const d of docs) {
  let from = 0;
  while (true) {
    const idx = d.digits.indexOf("3478", from);
    if (idx === -1) break;
    const start = Math.max(0, idx - 5);
    const end = Math.min(d.digits.length, idx + 4 + 5);
    const window = d.digits.slice(start, end);
    ctx3478.set(window, (ctx3478.get(window) ?? 0) + 1);
    from = idx + 1;
  }
}
console.log("Contexts around '3478' (5 digits each side):");
const sortedCtx = [...ctx3478.entries()].sort((a, b) => b[1] - a[1]);
for (const [c, n] of sortedCtx.slice(0, 8)) {
  // marca a posição do 3478 dentro do window
  const idx = c.indexOf("3478");
  const left = c.slice(0, idx);
  const right = c.slice(idx + 4);
  console.log(`  ${n}× : ${left}[3478]${right}`);
}
