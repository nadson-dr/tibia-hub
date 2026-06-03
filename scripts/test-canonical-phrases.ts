// Testa frases canônicas extraídas da TibiaWiki BR contra o corpus.
//
// Fontes canônicas (CipSoft staff + NPCs):
//   - Knightmare (CipSoft, evento 15 anos): "3478 67 90871 97664 3466 0 345!"
//     "3478" = Beholder/Bonelord (novo nome canônico)
//   - Chayenne (CipSoft Content Team 2009): "114514519485611451908304576512282177 :) 6612527570584 xD"
//   - Avar Tar (NPC): "29639 46781! 9063376290 3222011 677 80322429 67538 14805394,
//     6880326 677 63378129 337011 72683 149630 4378! 453 639 578300 986372 2953639!"
//     (4378 provavelmente erro CipSoft para 3478)
//   - Matriz 4×4 Hellgate (crânios):
//     [1 1 1 1]
//     [1 3 6 1]
//     [1 1 4 1]
//     [4 6 1 1]

import fs from "node:fs";

type Row = { slug: string; text_md: string };
const corpus: Row[] = (JSON.parse(fs.readFileSync("data/bonelord-corpus.json", "utf8")) as { rows: Row[] }).rows;
const docs = corpus.map((r) => ({ slug: r.slug, digits: r.text_md.replace(/\D/g, "") }));
const all = docs.map((d) => d.digits).join("");

function searchSubstring(label: string, pattern: string, expectedNote = "") {
  const occurrences = (all.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
  const expected = Math.max(0.0001, (all.length - pattern.length + 1) * Math.pow(10, -pattern.length));
  const inBooks = docs.filter((d) => d.digits.includes(pattern));
  const ratio = occurrences / expected;
  const flag = occurrences > 0 ? (ratio > 100 ? " ← HIGH" : "") : " ← NOT FOUND";
  console.log(
    `  ${label.padEnd(38)} "${pattern.length > 22 ? pattern.slice(0, 22) + "..." : pattern.padEnd(22)}" len=${String(pattern.length).padStart(3)} | found=${String(occurrences).padStart(3)} | in_books=${String(inBooks.length).padStart(3)}/${docs.length} | uniform_exp=${expected.toFixed(3)} | ratio=${ratio.toFixed(1)}×${flag}${expectedNote ? "  " + expectedNote : ""}`,
  );
  return inBooks;
}

console.log("=== KNIGHTMARE PHRASE ===");
console.log("Quote: '3478 67 90871 97664 3466 0 345!'");
console.log("3478 = Beholder/Bonelord (canon CipSoft 15-year anniversary)");
console.log();
{
  searchSubstring("3478 (= Beholder, canon!)", "3478");
  searchSubstring("Knightmare full no spaces", "347867908719766434660345");
  searchSubstring("First token: 3478", "3478");
  searchSubstring("Second token: 67", "67");
  searchSubstring("90871", "90871");
  searchSubstring("97664", "97664");
  searchSubstring("3466", "3466");
  searchSubstring("345", "345");
  console.log();
}

console.log("=== CHAYENNE PHRASE (CipSoft 2009 interview) ===");
console.log("Quote: '114514519485611451908304576512282177 :) 6612527570584 xD'");
console.log();
{
  const inBooks = searchSubstring("Chayenne full part 1", "114514519485611451908304576512282177");
  if (inBooks.length > 0) {
    console.log(`  ✅ APPEARS in: ${inBooks.map((b) => b.slug).join(", ")}`);
  }
  const inBooks2 = searchSubstring("Chayenne part 2", "6612527570584");
  if (inBooks2.length > 0) console.log(`  ✅ Part 2 in: ${inBooks2.map((b) => b.slug).join(", ")}`);
  searchSubstring("Beginning '11451'", "11451");
  searchSubstring("'5611451908304576512282177'", "5611451908304576512282177");
}
console.log();

console.log("=== AVAR TAR PHRASE ===");
console.log("Quote: '29639 46781! 9063376290 3222011 677 80322429 67538 14805394...'");
console.log();
{
  searchSubstring("29639", "29639");
  searchSubstring("46781", "46781");
  searchSubstring("9063376290", "9063376290");
  searchSubstring("3222011", "3222011");
  searchSubstring("677", "677");
  searchSubstring("80322429", "80322429");
  searchSubstring("67538", "67538");
  searchSubstring("14805394", "14805394");
  searchSubstring("4378 (= '3478' typo?)", "4378");
}
console.log();

console.log("=== HELLGATE 4×4 MATRIX ===");
console.log("Matrix: [1 1 1 1] [1 3 6 1] [1 1 4 1] [4 6 1 1]");
console.log("Total skulls: 33  (irony: 33 is taboo!)");
console.log();
{
  searchSubstring("Row-by-row", "1111136111414611");
  searchSubstring("Col-by-col", "1114131616411111");
  searchSubstring("Diagonal main", "1341");
  searchSubstring("Diagonal anti", "1611");
  searchSubstring("As '469' search", "469");
  searchSubstring("Reverse row", "1146141111613111");
  searchSubstring("Bottom row '4611'", "4611");
  searchSubstring("Top row '1111'", "1111");
  searchSubstring("Middle row '1361'", "1361");
  searchSubstring("Other middle '1141'", "1141");
  // Há sequência "469" implícita na matriz? cols 2,3 lendo de cima pra baixo: (3,6),(6,4),(1,1) = 36,64,11 → not really
  // ou somatórios row: 4, 11, 7, 12 → 411712 ?
  searchSubstring("Row sums concat", "411712");
}
console.log();

console.log("=== OTHER CANONICAL CONNECTIONS ===");
console.log("Theory: 486 = Intel 80486, mathmagic as cryptography pun");
console.log();
{
  searchSubstring("486 (Intel reference)", "486");
  searchSubstring("486486 (Wrinkled name)", "486486");
  searchSubstring("21 (shelf 21 in Isle of Kings)", "21");  // way too common, skip ratio
}
console.log();

console.log("=== SANITY: confirm position of Chayenne phrase within the famous LCS ===");
{
  // The LCS I previously found:
  // "...512282177350843485" appears at end of LCS
  // Chayenne ends part 1 with "...85611451908304576512282177"
  // So Chayenne IS quoting from the corpus directly!
  const chayennePart = "611451908304576512282177";
  const containingBooks = docs.filter((d) => d.digits.includes(chayennePart));
  console.log(`  Chayenne fragment '${chayennePart}' (24 chars) appears in:`);
  for (const d of containingBooks) {
    const pos = d.digits.indexOf(chayennePart);
    const ctx = d.digits.slice(Math.max(0, pos - 10), pos + chayennePart.length + 10);
    console.log(`    ${d.slug.padEnd(13)} at pos ${pos}: ...${ctx}...`);
  }
}
