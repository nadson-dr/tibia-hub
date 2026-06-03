// Brute-force criptanalítico em "Aerith" e "Bsth4e" (Monolith of the Planes).
//
// Hipóteses testadas:
//   1. Caesar shift (todos 25 shifts) + reverse
//   2. ATBASH (A↔Z, B↔Y)
//   3. l33t substitution: 4 → A, 3 → E, etc
//   4. Vigenère com palavras canon (TIBIA, BONELORD, GALTHEN, etc) como chave
//   5. Anagram check contra dictionary
//   6. Conjuntos como "frase composta" tipo MARIONETTES
//
// Status canon:
//   - GALTHEN = cavaleiro canon, namorado de Scarlett Etzel
//   - AERITH = significado desconhecido (possível easter egg FFVII)
//   - BSTH4E = string anômala com '4' no meio

const WORDS = ["GALTHEN", "AERITH", "BSTH4E"];

// ===========================================================================
// 1. Caesar shifts (todos 25)
// ===========================================================================
function caesar(text: string, shift: number): string {
  return text
    .split("")
    .map((c) => {
      if (/[A-Z]/.test(c)) {
        const code = c.charCodeAt(0) - 65;
        return String.fromCharCode(((code + shift) % 26 + 26) % 26 + 65);
      }
      return c; // preserva números e símbolos
    })
    .join("");
}

console.log("=== CAESAR SHIFTS ===");
for (const word of WORDS) {
  console.log(`\n${word}:`);
  for (let shift = 1; shift <= 25; shift++) {
    const shifted = caesar(word, shift);
    const reversed = shifted.split("").reverse().join("");
    console.log(`  shift +${String(shift).padStart(2)}: ${shifted.padEnd(8)} | reversed: ${reversed}`);
  }
}

// ===========================================================================
// 2. ATBASH (A↔Z, B↔Y, C↔X...)
// ===========================================================================
function atbash(text: string): string {
  return text
    .split("")
    .map((c) => {
      if (/[A-Z]/.test(c)) {
        const code = c.charCodeAt(0) - 65;
        return String.fromCharCode(25 - code + 65);
      }
      return c;
    })
    .join("");
}

console.log("\n\n=== ATBASH ===");
for (const word of WORDS) {
  const a = atbash(word);
  const r = a.split("").reverse().join("");
  console.log(`  ${word}: ${a}  | reversed: ${r}`);
}

// ===========================================================================
// 3. L33t substitution
// ===========================================================================
const L33T: Record<string, string> = {
  "4": "A",
  "3": "E",
  "1": "I",
  "0": "O",
  "5": "S",
  "7": "T",
  "8": "B",
  "9": "G",
};

function unL33t(text: string): string {
  return text
    .split("")
    .map((c) => L33T[c] ?? c)
    .join("");
}

console.log("\n\n=== L33T SUBSTITUTION ===");
for (const word of WORDS) {
  if (/\d/.test(word)) {
    const u = unL33t(word);
    console.log(`  ${word} → ${u}`);
    console.log(`     reversed: ${u.split("").reverse().join("")}`);
    console.log(`     atbash: ${atbash(u)}`);
    for (const shift of [1, 2, 3, 13]) {
      console.log(`     caesar+${shift}: ${caesar(u, shift)}`);
    }
  }
}

// ===========================================================================
// 4. Vigenère com palavras canon
// ===========================================================================
function vigenere(text: string, key: string, decrypt = false): string {
  let out = "";
  let k = 0;
  for (const c of text) {
    if (/[A-Z]/.test(c)) {
      const tCode = c.charCodeAt(0) - 65;
      const kCode = key[k % key.length].charCodeAt(0) - 65;
      const shift = decrypt ? -kCode : kCode;
      out += String.fromCharCode(((tCode + shift) % 26 + 26) % 26 + 65);
      k++;
    } else {
      out += c;
    }
  }
  return out;
}

const VIGENERE_KEYS = [
  "TIBIA", "BONELORD", "GALTHEN", "AERITH", "ZATHROTH", "MARIONETTES",
  "PLANESTRIDER", "BSTHE", "FERUMBRAS", "QJELL", "GARSHARAK",
];

console.log("\n\n=== VIGENÈRE (decrypt with canon keys) ===");
for (const word of WORDS) {
  console.log(`\n${word}:`);
  for (const key of VIGENERE_KEYS) {
    if (key === word) continue;
    const decrypted = vigenere(word, key, true);
    const encrypted = vigenere(word, key, false);
    console.log(`  key=${key.padEnd(13)} decrypt: ${decrypted.padEnd(8)}  encrypt: ${encrypted}`);
  }
}

// ===========================================================================
// 5. Anagram analysis
// ===========================================================================
function sortChars(s: string): string {
  return s.split("").sort().join("");
}

const KNOWN_TIBIA_WORDS = [
  "BANOR", "CRUNOR", "SUON", "FAFNAR", "FARDOS", "UMAN", "ZATHROTH",
  "BROG", "BASTESH", "NORNUR", "BANOR", "TIBIA", "TIBIASULA",
  "BONELORD", "BEHOLDER", "GHOUL", "DEMON", "VAMPIRE",
  "GALTHEN", "MARIONETTES", "PLANESTRIDER", "YSELDA", "KESAR",
  "AERITH", "GARSHARAK", "ZORALURK", "FERUMBRAS", "QJELL", "ZATHROTH",
  "SCARLETT", "ETZEL", "GOSHNAR", "BAKRAGORE", "ORSHABAAL",
  "MORGAROTH", "GHAZBARAN", "ABYSS", "PLANE", "ROSETTA",
  "LIONET", "KNIGHTMARE", "CHAYENNE", "TEYRATA",
  "SHADOW", "LIGHT", "DREAM", "DESTINY", "GENESIS",
  // Common English words for anagram fallback
  "MARIONETTE", "MARIONETTES", "MASTER", "ANCHOR", "BLESSED",
];

console.log("\n\n=== ANAGRAM CHECK ===");
for (const word of WORDS) {
  const sortedW = sortChars(word.replace(/\d/g, ""));
  console.log(`\n${word} (chars: ${word.replace(/\d/g, "").split("").sort().join("")}):`);
  // Procura palavras de mesmo length com mesmas letras
  const matches = KNOWN_TIBIA_WORDS.filter(
    (k) => sortChars(k) === sortedW && k !== word,
  );
  if (matches.length > 0) {
    console.log(`  ✅ Exact anagrams: ${matches.join(", ")}`);
  } else {
    console.log(`  No exact anagrams in dictionary.`);
  }
  // Sub-anagram (palavras que cabem dentro)
  const wordChars = new Map<string, number>();
  for (const c of word.replace(/\d/g, "")) wordChars.set(c, (wordChars.get(c) ?? 0) + 1);
  const subset = KNOWN_TIBIA_WORDS.filter((k) => {
    if (k === word) return false;
    const kChars = new Map<string, number>();
    for (const c of k) kChars.set(c, (kChars.get(c) ?? 0) + 1);
    for (const [ch, cnt] of kChars) {
      if ((wordChars.get(ch) ?? 0) < cnt) return false;
    }
    return true;
  });
  if (subset.length > 0) {
    console.log(`  Contained sub-anagrams: ${subset.slice(0, 8).join(", ")}`);
  }
}

// ===========================================================================
// 6. Combined "phrase" hypothesis
//    Frase final tem que abraçar GALTHEN + AERITH + BSTH4E
//    Ex: "GALTHEN+AERITH+BSTH4E" = 7+6+6 = 19 letras
//    "MARIONETTES" tem 11 letras pra 5 palavras = ~2.2 chars/word avg
//    Logo pra 3 palavras, frase ~6-8 letras esperada
// ===========================================================================
console.log("\n\n=== COMBINED PHRASE BRAINSTORM ===");
const allLetters = WORDS.join("").replace(/\d/g, "");
const counts = new Map<string, number>();
for (const c of allLetters) counts.set(c, (counts.get(c) ?? 0) + 1);
console.log(`  Letras combinadas: ${allLetters}`);
console.log(`  Counts: ${[...counts.entries()].sort().map(([k, v]) => `${k}=${v}`).join(", ")}`);
console.log(`  Total: ${allLetters.length} chars`);
// MARIONETTES = M A R I O N E T T E S = M(1) A(1) R(1) I(1) O(1) N(1) E(2) T(2) S(1) = 11 letras

// First letters
const firsts = WORDS.map((w) => w[0]).join("");
console.log(`  Iniciais: ${firsts}  (anagram: ${firsts.split("").sort().join("")})`);
// GAB

// Last letters
const lasts = WORDS.map((w) => w[w.length - 1]).join("");
console.log(`  Finais: ${lasts}  (anagram: ${lasts.split("").sort().join("")})`);
// NHE = could be "HEN" or "NEH"

// ===========================================================================
// 7. BSTH4E analyses específicas
// ===========================================================================
console.log("\n\n=== BSTH4E specific analysis ===");
console.log("  Hipóteses:");
console.log(`  - Como '4' = ASCII 52: BSTH(52)E pode ser 'BSTH 52 E'`);
console.log(`  - '4' = 'A' (l33t): BSTHAE → anagram of: ${[...sortChars("BSTHAE")]}`);
const bsthae = "BSTHAE";
const bsthaeAnagrams = ["BATHES", "BEATHS", "HEBATS", "BASE TH", "BE THSA"];
console.log(`  - BSTHAE anagram candidates: ${bsthaeAnagrams.join(", ")}`);
console.log(`  - 'BIRTH' palavra similar: BIRTH = B-I-R-T-H vs B-S-T-H = 'BSTH'`);
console.log(`  - Sem o '4': BSTHE → ${"BSTHE".split("").sort().join("")} = 'BEHST', 'BETHS'`);
console.log(`  - Como acronym: B.S.T.H. = ?`);
console.log(`  - Sound out: B-S-T-H = 'beast'? 'best'? phonetic?`);

// Caesar específico do BSTH4E preservando '4'
console.log(`\n  BSTH4E Caesar (preservando 4):`);
for (let shift = 1; shift <= 13; shift++) {
  const s = caesar("BSTH4E", shift);
  console.log(`    +${String(shift).padStart(2)}: ${s}`);
}
