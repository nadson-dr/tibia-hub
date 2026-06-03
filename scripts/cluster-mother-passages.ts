// Cluster do corpus bonelord por "passagem-mãe" canônica.
//
// Hipótese de trabalho (deduzida da análise anterior):
//   - CipSoft criou ~3-7 passagens canônicas longas em 469
//   - Cada book é um SCRAMBLE / VARIANT de uma passagem-mãe
//   - A frase da Chayenne (CipSoft 2009) é um fragmento de uma delas
//
// Método:
//   1. Pra cada par (a,b) com a<b, calcular LCS. Se LCS ≥ 30 chars, registrar.
//   2. Greedy clustering: passagem-mãe = LCS com maior coverage; assigna
//      todos os books que a contêm a esse cluster; repete no resto.
//   3. Mede estatísticas por cluster.

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));

const LCS_MIN = 30;

// ---------------------------------------------------------------------------
// LCS (substring contígua) entre 2 strings
// ---------------------------------------------------------------------------
function lcs(a: string, b: string): { length: number; sub: string } {
  let best = { length: 0, sub: "" };
  let prev = new Array<number>(b.length + 1).fill(0);
  let curr = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
        if (curr[j] > best.length) best = { length: curr[j], sub: a.slice(i - curr[j], i) };
      } else {
        curr[j] = 0;
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }
  return best;
}

// ---------------------------------------------------------------------------
// 1. Computar todos os LCS ≥ LCS_MIN entre pares
// ---------------------------------------------------------------------------
console.log("Computing pairwise LCS...");
const candidates = new Map<string, Set<string>>(); // passagem → books que a contêm
for (let i = 0; i < docs.length; i++) {
  for (let j = i + 1; j < docs.length; j++) {
    const r = lcs(docs[i].digits, docs[j].digits);
    if (r.length >= LCS_MIN) {
      if (!candidates.has(r.sub)) candidates.set(r.sub, new Set());
      const s = candidates.get(r.sub)!;
      s.add(docs[i].slug);
      s.add(docs[j].slug);
    }
  }
}
console.log(`Found ${candidates.size} LCS candidates with length ≥ ${LCS_MIN}`);

// ---------------------------------------------------------------------------
// 2. Pra cada candidato, recheck contra TODOS os books (não só o par original)
// ---------------------------------------------------------------------------
const expanded = new Map<string, Set<string>>();
for (const [sub, books] of candidates) {
  const fullBooks = new Set<string>();
  for (const d of docs) if (d.digits.includes(sub)) fullBooks.add(d.slug);
  expanded.set(sub, fullBooks);
}

// ---------------------------------------------------------------------------
// 3. Limpa candidatos redundantes: se sub_a ⊂ sub_b E books(sub_a) == books(sub_b),
//    fica só sub_b (a maior).
// ---------------------------------------------------------------------------
const subs = [...expanded.keys()].sort((a, b) => b.length - a.length);
const keep = new Set(subs);
for (const a of subs) {
  if (!keep.has(a)) continue;
  for (const b of subs) {
    if (a === b || !keep.has(b)) continue;
    if (a.length > b.length && a.includes(b)) {
      // b ⊂ a — se books são iguais, remove b
      const bA = expanded.get(a)!;
      const bB = expanded.get(b)!;
      if (bA.size === bB.size && [...bA].every((x) => bB.has(x))) {
        keep.delete(b);
      }
    }
  }
}
const cleaned = [...keep].sort((a, b) => {
  const cA = expanded.get(a)!.size;
  const cB = expanded.get(b)!.size;
  return cB - cA || b.length - a.length;
});
console.log(`After collapsing subsumed substrings: ${cleaned.length} unique candidates`);
console.log();

// ---------------------------------------------------------------------------
// 4. Top 10 mother passages
// ---------------------------------------------------------------------------
console.log("=== TOP 10 MOTHER-PASSAGE CANDIDATES ===");
for (let i = 0; i < Math.min(10, cleaned.length); i++) {
  const sub = cleaned[i];
  const books = expanded.get(sub)!;
  console.log(`#${i + 1}: length=${sub.length}, books=${books.size}/${docs.length}`);
  console.log(`     "${sub.slice(0, 60)}${sub.length > 60 ? "..." : ""}"`);
  console.log(`     in: ${[...books].slice(0, 6).join(", ")}${books.size > 6 ? ` +${books.size - 6} more` : ""}`);
}
console.log();

// ---------------------------------------------------------------------------
// 5. Greedy clustering: assigna books à passagem-mãe que cobre mais books
// ---------------------------------------------------------------------------
console.log("=== GREEDY CLUSTERS (mutually exclusive) ===");
const remaining = new Set(docs.map((d) => d.slug));
const clusters: { sub: string; books: string[] }[] = [];

const orderedByCoverage = [...cleaned].sort((a, b) => expanded.get(b)!.size - expanded.get(a)!.size);
for (const sub of orderedByCoverage) {
  const books = expanded.get(sub)!;
  const claimed = [...books].filter((b) => remaining.has(b));
  if (claimed.length >= 3) {
    clusters.push({ sub, books: claimed });
    for (const b of claimed) remaining.delete(b);
  }
}
console.log(`Found ${clusters.length} clusters covering ${docs.length - remaining.size}/${docs.length} books`);
console.log(`Unclustered books (size < 3 or no mother): ${remaining.size}`);
console.log();

for (let i = 0; i < clusters.length; i++) {
  const c = clusters[i];
  console.log(`Cluster ${i + 1}: ${c.books.length} books, mother length=${c.sub.length}`);
  console.log(`  Books: ${c.books.slice(0, 8).join(", ")}${c.books.length > 8 ? ` +${c.books.length - 8}` : ""}`);
  console.log(`  Mother: "${c.sub.slice(0, 80)}${c.sub.length > 80 ? "..." : ""}"`);
  // Length stats
  const lens = c.books.map((b) => docs.find((d) => d.slug === b)!.digits.length);
  const meanLen = lens.reduce((a, b) => a + b) / lens.length;
  // 3478 (Beholder canon) presence
  const with3478 = c.books.filter((b) => docs.find((d) => d.slug === b)!.digits.includes("3478")).length;
  console.log(`  Stats: mean book length=${meanLen.toFixed(1)}  contains '3478': ${with3478}/${c.books.length}`);
  console.log();
}

// ---------------------------------------------------------------------------
// 6. Unclustered books
// ---------------------------------------------------------------------------
console.log("=== UNCLUSTERED books (outliers / unique theme) ===");
for (const slug of [...remaining]) {
  const d = docs.find((x) => x.slug === slug)!;
  console.log(`  ${slug.padEnd(13)} length=${String(d.digits.length).padStart(3)}  contains '3478': ${d.digits.includes("3478") ? "YES" : "no"}`);
}
console.log();

// ---------------------------------------------------------------------------
// 7. Stats por cluster sobre `3478`, `1`, `145`, `451`
// ---------------------------------------------------------------------------
console.log("=== '3478' presence per cluster ===");
for (let i = 0; i < clusters.length; i++) {
  const c = clusters[i];
  const totalDigits = c.books.reduce((acc, b) => acc + docs.find((d) => d.slug === b)!.digits.length, 0);
  const total3478 = c.books.reduce((acc, b) => acc + ((docs.find((d) => d.slug === b)!.digits.match(/3478/g) ?? []).length), 0);
  const total145 = c.books.reduce((acc, b) => acc + ((docs.find((d) => d.slug === b)!.digits.match(/145145/g) ?? []).length), 0);
  const total1 = c.books.reduce((acc, b) => acc + ((docs.find((d) => d.slug === b)!.digits.match(/1/g) ?? []).length), 0);
  console.log(
    `  Cluster ${i + 1} (n=${c.books.length}): digits=${totalDigits}  '3478'=${total3478}  '145145'=${total145}  '1'-density=${(total1 / totalDigits * 100).toFixed(1)}%`,
  );
}
