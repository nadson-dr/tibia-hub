// Aplica o cipher key de Antonio Stradivarius (tibiasecrets/article160)
// ao corpus bonelord pra ver o que decodifica.
//
// Mapeamentos canônicos:
//   34→B, 78→E, 62→N, 79→A, 20→R, 68→C, 65→I, 72→S, 61→T/M, 87→E
//   02→R (mirror of 20), 87→E (mirror of 78)
//   Surreal numbers: 1, 13, 49, 94, 31, 10 → N (all)
//   Letter groupings: V/U/W equivalent; T/TH; N/M conflate
//   469 → "FOOL"
//
// Hipótese: pares de dígitos = letra. Books cifrados com mathmagical
// transformations + mirror property.

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));

// ===========================================================================
// 1. Stradivarius cipher key (parcial)
// ===========================================================================
const CIPHER: Record<string, string> = {
  // Confirmed by article
  "34": "B",
  "78": "E",
  "62": "N",
  "79": "A",
  "20": "R",
  "68": "C",
  "65": "I",
  "72": "S",
  "61": "T", // also M
  "87": "E", // mirror of 78
  "02": "R", // mirror of 20
  "86": "C", // mirror of 68
  "56": "I", // mirror of 65
  "27": "S", // mirror of 72
  "16": "T", // mirror of 61
  "97": "A", // mirror of 79
  "26": "N", // mirror of 62
  "43": "B", // mirror of 34
  // Surreal numbers all map to N
  "01": "N",
  "13": "N",
  "49": "N",
  "94": "N",
  "31": "N",
  "10": "N",
};

// Single digits (per surreal hypothesis)
const SINGLE: Record<string, string> = {
  "1": "N",
};

// ===========================================================================
// 2. Decode com pares fixos
// ===========================================================================
function decodePairs(digits: string): string {
  let out = "";
  let i = 0;
  while (i < digits.length) {
    // Try 2-digit pair first
    if (i + 2 <= digits.length) {
      const pair = digits.slice(i, i + 2);
      if (CIPHER[pair]) {
        out += CIPHER[pair];
        i += 2;
        continue;
      }
    }
    // Try single digit (surreal)
    const single = digits[i];
    if (SINGLE[single]) {
      out += SINGLE[single];
    } else {
      out += "·"; // unknown placeholder
    }
    i += 1;
  }
  return out;
}

// ===========================================================================
// 3. Decode known canonical phrases
// ===========================================================================
console.log("=== DECODING CANONICAL PHRASES ===");
console.log();

const phrases: { name: string; digits: string }[] = [
  { name: "3478 (canon = Bonelord/Beholder)", digits: "3478" },
  { name: "Knightmare full quote", digits: "347867908719766434660345" },
  { name: "Chayenne phrase 1", digits: "114514519485611451908304576512282177" },
  { name: "Chayenne phrase 2", digits: "6612527570584" },
  { name: "Doxology of Bonelord (16× in corpus)", digits: "1513534780192" },
  { name: "Around 3478 (full context)", digits: "151353478019" },
  { name: "Salmo Chayenne mother", digits: "26114514519485611451908304576512282177" },
  { name: "Cluster 1 mother", digits: "956151353478019288952160199364672" },
  { name: "Cluster 5 mother", digits: "26114514519485611451908304576512282177" },
  { name: "Hellgate matrix row-by-row", digits: "1111136111414611" },
  { name: "469 itself", digits: "469" },
  { name: "486486 (Wrinkled name)", digits: "486486" },
];

for (const p of phrases) {
  const decoded = decodePairs(p.digits);
  console.log(`  ${p.name}`);
  console.log(`    digits : ${p.digits}`);
  console.log(`    decoded: ${decoded}`);
  console.log();
}

// ===========================================================================
// 4. Decode books inteiros (sample)
// ===========================================================================
console.log("=== DECODING SAMPLE BOOKS ===");
console.log();

for (const slug of ["0152551751", "0421595615", "2295345274", "1928895216", "9457655996"]) {
  const d = docs.find((x) => x.slug === slug);
  if (!d) continue;
  const decoded = decodePairs(d.digits);
  // Limpa: junta letras isoladas em "palavras" (tentativa)
  console.log(`  Book: ${slug}`);
  console.log(`    digits : ${d.digits.slice(0, 80)}...`);
  console.log(`    decoded: ${decoded.slice(0, 80)}...`);
  // Count coverage
  const knownChars = [...decoded].filter((c) => c !== "·").length;
  const coverage = knownChars / decoded.length;
  console.log(`    coverage: ${(coverage * 100).toFixed(1)}% (${knownChars}/${decoded.length} chars decoded)`);
  console.log();
}

// ===========================================================================
// 5. Quais palavras EM INGLÊS aparecem no corpus decodificado?
//    Procura sequências consecutivas decoded sem placeholder.
// ===========================================================================
console.log("=== ENGLISH-LIKE STRINGS in fully decoded corpus ===");
const allDigits = docs.map((d) => d.digits).join("");
const allDecoded = decodePairs(allDigits);

// Split by placeholders and keep only longish runs
const runs = allDecoded.split("·").filter((s) => s.length >= 3);
console.log(`Total runs of decoded letters ≥3 chars: ${runs.length}`);

// Top words
const wordFreq = new Map<string, number>();
for (const r of runs) {
  wordFreq.set(r, (wordFreq.get(r) ?? 0) + 1);
}
console.log("Top 30 'words' (decoded runs):");
for (const [w, c] of [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${c.toString().padStart(3)}× "${w}"`);
}
console.log();

// ===========================================================================
// 6. Overall coverage statistics
// ===========================================================================
console.log("=== OVERALL DECODING STATISTICS ===");
const totalChars = allDecoded.length;
const knownChars = [...allDecoded].filter((c) => c !== "·").length;
console.log(`  Corpus total decoded positions: ${totalChars}`);
console.log(`  Successfully decoded: ${knownChars} (${(knownChars / totalChars * 100).toFixed(1)}%)`);
console.log(`  Unknown placeholders (·): ${totalChars - knownChars}`);

// Frequência das letras decoded
const letterFreq = new Map<string, number>();
for (const c of allDecoded) {
  if (c !== "·") letterFreq.set(c, (letterFreq.get(c) ?? 0) + 1);
}
console.log("\n  Decoded letter frequency:");
const ranked = [...letterFreq.entries()].sort((a, b) => b[1] - a[1]);
for (const [l, c] of ranked) {
  const pct = (c / knownChars) * 100;
  console.log(`    ${l}: ${pct.toFixed(1)}% (${c} occurrences)`);
}
