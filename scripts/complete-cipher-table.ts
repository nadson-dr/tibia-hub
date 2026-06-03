// Completar tabela cipher 10×10 via inferência iterativa:
//   1. Aplica tabela Stradivarius parcial em frases CANON com tradução conhecida
//   2. Pra placeholders frequentes, hipotetiza letra baseado em:
//      a) Frequência inglesa: E(12.7%), T(9%), A(8.2%), O(7.5%), I(7%), N(6.7%)
//      b) Co-ocorrência com letras já decoded (bigramas inglesas comuns)
//      c) Mirror property aplicado iterativamente
//   3. Cross-check com Honeminas Formula + Avar Tar + Knightmare
//   4. Outputs tabela 10×10 completa estimada

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");

// ===========================================================================
// 1. STRADIVARIUS TABLE (known)
// ===========================================================================
const KNOWN: Record<string, string> = {
  "34": "B", "78": "E", "62": "N", "79": "A", "20": "R", "68": "C",
  "65": "I", "72": "S", "61": "T", "87": "E", "02": "R", "86": "C",
  "56": "I", "27": "S", "16": "T", "97": "A", "26": "N", "43": "B",
  // Surreal numbers (all = N)
  "01": "N", "13": "N", "49": "N", "94": "N", "31": "N", "10": "N",
};

// Mirror pairs (auto-computed)
function mirror(pair: string): string { return pair[1] + pair[0]; }

// ===========================================================================
// 2. CANON FRASES com hint de tradução
// ===========================================================================
const CANON_HINTS: { name: string; digits: string; partial_translation: string }[] = [
  {
    name: "Knightmare event quote",
    digits: "347867908719766434660345",
    partial_translation: "BE A WIT THAN BE A FOOL", // (Stradivarius)
  },
  {
    name: "Avar Tar poem snippet",
    digits: "296394678190633762903222011",
    partial_translation: "RUN FAY 'TWAS NOT 'WARE...", // (Stradivarius decoded)
  },
  {
    name: "Honeminas vector 2",
    digits: "34784",
    partial_translation: "BE?", // BE = 3478, 4 sobra
  },
  {
    name: "Honeminas vector 1",
    digits: "43153",
    partial_translation: "B??", // 43=B mirror, 15+3 unknown
  },
  {
    name: "486486 (Wrinkled name)",
    digits: "486486",
    partial_translation: "?C?C", // 48=?, 64=?, 86=C, 6=?
  },
  {
    name: "Tibia Poll",
    digits: "97879726", // YOU'VE THROUGH SO (Stradivarius)
    partial_translation: "Y???E?N",
  },
  {
    name: "Hellgate matrix concat",
    digits: "1111136111414611",
    partial_translation: "EYES THEME", // (Stradivarius)
  },
];

// ===========================================================================
// 3. Iterative inference
//    Pra cada frase canon, alinhar dígitos com tradução conhecida e inferir
//    pares novos.
// ===========================================================================

function alignAndInfer(digits: string, translation: string): Map<string, string> {
  const inferences = new Map<string, string>();
  // Tenta: pares-de-dígitos → 1 letra na tradução
  // Pega frase digit, divide em pares; mapeia ao caracter na translation
  const pairs: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    pairs.push(digits.slice(i, i + 2));
  }
  // Skip if mismatch
  if (translation.length !== pairs.length) return inferences;
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const c = translation[i].toUpperCase();
    if (c === "?" || c === " ") continue;
    inferences.set(p, c);
  }
  return inferences;
}

// Knightmare quote alignment (Stradivarius decoded "BE A WIT THAN BE A FOOL")
console.log("=== INFERRING from KNIGHTMARE quote ===");
console.log("digits      : 34 78 67 90 87 19 76 64 34 66 03 45");
console.log("translation : B  E  A     W  I  T  ?  B  E  ?  ?  (interpretation)");
console.log("(Knightmare: 'BE A WIT THAN BE A FOOL!')");
console.log();
console.log("Letter-by-pair mapping inferred:");
const knightInferences = new Map([
  ["34", "B"], ["78", "E"], ["67", "A"], ["90", " "], ["87", "W"],
  ["19", "I"], ["76", "T"], ["64", " "], ["66", "E"], ["03", " "], ["45", "?"],
]);
// Actually "BE A WIT THAN BE A FOOL" has 19 letters but our pair count is 12
// So spacing/grouping differs. Let me try a different alignment.

// Better approach: just collect candidate inferences from EACH canon phrase
// where word-boundary in translation matches pair-boundary in digits

// ===========================================================================
// 4. FREQUENCY-BASED INFERENCE
//    Pra os 100 pares possíveis, calcula frequência no corpus.
//    Cruza com frequência esperada de letras inglesas.
// ===========================================================================

function pairFreq(corpus: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i + 1 < corpus.length; i += 2) {
    const p = corpus.slice(i, i + 2);
    m.set(p, (m.get(p) ?? 0) + 1);
  }
  return m;
}

const ENGLISH_FREQ: [string, number][] = [
  ["E", 12.7], ["T", 9.1], ["A", 8.2], ["O", 7.5], ["I", 7.0],
  ["N", 6.7], ["S", 6.3], ["H", 6.1], ["R", 6.0], ["D", 4.3],
  ["L", 4.0], ["C", 2.8], ["U", 2.8], ["M", 2.4], ["W", 2.4],
  ["F", 2.2], ["G", 2.0], ["Y", 2.0], ["P", 1.9], ["B", 1.5],
  ["V", 1.0], ["K", 0.8], ["J", 0.15], ["X", 0.15], ["Q", 0.1], ["Z", 0.07],
];

const pairCounts = pairFreq(all);
const totalPairs = [...pairCounts.values()].reduce((a, b) => a + b);

console.log("=== PAIR FREQUENCY in disjoint segmentation ===");
console.log("(top 30 pairs by frequency, with Stradivarius mapping if known)");
const ranked = [...pairCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);
let cumPct = 0;
for (const [p, c] of ranked) {
  const pct = (c / totalPairs) * 100;
  cumPct += pct;
  const known = KNOWN[p] ?? "?";
  console.log(`  ${p} → ${known}  freq=${pct.toFixed(2)}%  count=${c}  cumulative=${cumPct.toFixed(1)}%`);
}
console.log();

// ===========================================================================
// 5. Letras NÃO atribuídas ainda
// ===========================================================================
const usedLetters = new Set(Object.values(KNOWN));
const missing = ENGLISH_FREQ.filter(([l]) => !usedLetters.has(l));
console.log(`=== LETTERS NOT YET MAPPED (${missing.length}) ===`);
console.log("These should map to high-frequency unmapped pairs:");
for (const [l, f] of missing.slice(0, 15)) {
  console.log(`  ${l} (English freq ${f}%)`);
}
console.log();

// ===========================================================================
// 6. CANDIDATE PROPOSALS
//    Pra cada par frequente sem mapping, propor letra:
//    - Cruzar pair frequency com letter frequency
// ===========================================================================
console.log("=== PROPOSED NEW MAPPINGS (greedy frequency match) ===");
console.log("Heuristic: match top unmapped pair frequency to top unmapped letter frequency");

const unmappedPairs = ranked.filter(([p]) => !KNOWN[p]);
const unmappedLetters = missing.slice(0, 20);

const proposals = new Map<string, string>();
for (let i = 0; i < Math.min(unmappedPairs.length, unmappedLetters.length, 12); i++) {
  const [pair, count] = unmappedPairs[i];
  const [letter, lfreq] = unmappedLetters[i];
  const pairPct = (count / totalPairs) * 100;
  const ratio = pairPct / lfreq;
  proposals.set(pair, letter);
  // also mirror
  const mp = mirror(pair);
  if (pair !== mp) proposals.set(mp, letter);
  console.log(`  ${pair} (${pairPct.toFixed(2)}%) → ${letter} (eng ${lfreq.toFixed(1)}%)  ratio=${ratio.toFixed(2)}  [also ${mp}→${letter}]`);
}
console.log();

// ===========================================================================
// 7. EXTENDED CIPHER + decode test
// ===========================================================================
const EXTENDED: Record<string, string> = { ...KNOWN };
for (const [p, l] of proposals) EXTENDED[p] = l;
// Single digits (surreal hypothesis already in KNOWN as "01", "13"...)

function decodePairs(digits: string, table: Record<string, string>): string {
  let out = "";
  let i = 0;
  while (i < digits.length) {
    if (i + 2 <= digits.length) {
      const pair = digits.slice(i, i + 2);
      if (table[pair]) {
        out += table[pair];
        i += 2;
        continue;
      }
    }
    out += "·";
    i += 1;
  }
  return out;
}

console.log("=== EXTENDED TABLE — Decode test on canon phrases ===");
for (const c of CANON_HINTS) {
  const decoded = decodePairs(c.digits, EXTENDED);
  console.log(`  ${c.name}`);
  console.log(`    digits   : ${c.digits}`);
  console.log(`    expected : ${c.partial_translation}`);
  console.log(`    decoded  : ${decoded}`);
  console.log();
}

// ===========================================================================
// 8. OVERALL CORPUS DECODE
// ===========================================================================
const allDecoded = decodePairs(all, EXTENDED);
const totalChars = allDecoded.length;
const knownChars = [...allDecoded].filter((c) => c !== "·").length;
console.log("=== OVERALL CORPUS DECODE ===");
console.log(`  Coverage: ${knownChars}/${totalChars} = ${(knownChars / totalChars * 100).toFixed(1)}%`);
console.log(`  (Stradivarius alone: 35.0%)`);

const letterFreq = new Map<string, number>();
for (const ch of allDecoded) if (ch !== "·") letterFreq.set(ch, (letterFreq.get(ch) ?? 0) + 1);
console.log("  Letter distribution:");
for (const [l, c] of [...letterFreq.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${l}: ${((c / knownChars) * 100).toFixed(1)}%`);
}
console.log();

// Top decoded "words"
const runs = allDecoded.split("·").filter((s) => s.length >= 3);
const wordFreq = new Map<string, number>();
for (const r of runs) wordFreq.set(r, (wordFreq.get(r) ?? 0) + 1);
console.log("Top decoded 'words' (length ≥3):");
for (const [w, c] of [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
  console.log(`  ${c.toString().padStart(3)}× "${w}"`);
}
