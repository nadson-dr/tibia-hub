// Análise linguística do book "Mehrah Asram" (Serpentine Tower)
// — corpus completo em demon language com vocabulary parcialmente conhecido.
//
// Mapeamentos canon (via "The Spectres Were Everywhere" book + community):
//   chamek = blood / sacrifice
//   ath uthul arak = "your blood" (collocation)
//   Kadash = attack
//
// Vocabulário-hipótese:
//   ath / uth / at = "your" (pronominal)
//   uthul / athul / a'thul = "blood" (variants)
//   cha / tha / dah = particle/article
//   mah / moh = adverb/conjunction
//   asram = name/title (since it's also the book title)
//   mehrah = greeting/invocation?
//   arak / hatradek = noun ending?

const MEHRAH_ASRAM = `
Mehrah asram cha mehe than.
Uth a'thul at cha there.
Orum tha cha elik jahara.
Udhun zah fahr mal.
Chamek at uthul hatradek asram.
Mehrem alir iktha at uthun.
Kasin tha Ur ch helim doh.
Mah dah direm.
Athul as hathu, athul as dofah, athul as mereth.
Cha ukhtu muhn dahra.
Sethor mah amin dah.
At meruhm cha me dah.
Chamek persim kaharah bah tufi.
Moh dah rah.
Moh Udhin cha uthul.
Meheth Zuhl tha berah.
`.trim();

// Mapeamentos canon
const KNOWN: Record<string, string> = {
  chamek: "blood/sacrifice",
  "ath uthul arak": "your blood",
  kadash: "attack",
};

// Mapeamentos especulativos (community + análise)
const SPECULATIVE: Record<string, string> = {
  uthul: "blood",
  athul: "blood (variant)",
  "a'thul": "blood (variant with apostrophe)",
  ath: "your",
  at: "your (short form)",
  uth: "your (variant)",
  cha: "the/of (article)",
  tha: "the (variant)",
  dah: "the (variant)",
  mah: "adverb",
  moh: "adverb (variant)",
  asram: "[NAME: Asram - person/place/concept]",
  mehrah: "[GREETING/INVOCATION]",
};

// ===========================================================================
// 1. Tokenização
// ===========================================================================
const tokens = MEHRAH_ASRAM.toLowerCase()
  .replace(/[.,!?]/g, " ")
  .split(/\s+/)
  .filter((t) => t.length > 0);

console.log(`Total tokens: ${tokens.length}`);
console.log(`Unique tokens: ${new Set(tokens).size}`);

// ===========================================================================
// 2. Frequência de palavras
// ===========================================================================
const freq = new Map<string, number>();
for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

console.log("\n=== Token frequency (≥2) ===");
const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
for (const [w, c] of sorted) {
  if (c < 2) continue;
  const knownMark = KNOWN[w] ? "✅ canon" : SPECULATIVE[w] ? "❓ specul" : "";
  const meaning = KNOWN[w] ?? SPECULATIVE[w] ?? "?";
  console.log(`  ${w.padEnd(12)} × ${c} | ${meaning.padEnd(30)} ${knownMark}`);
}

// ===========================================================================
// 3. Análise de variantes do tronco "thul"
// ===========================================================================
console.log("\n=== Variantes da raiz 'thul' (= blood?) ===");
const thulVariants = tokens.filter((t) =>
  /(thul|athul|uthul|a'thul|uthun|udhun|udhin)/i.test(t),
);
const thulSet = new Set(thulVariants);
console.log(`  Encontradas: ${[...thulSet].join(", ")}`);
console.log(`  Total ocorrências: ${thulVariants.length}`);

// ===========================================================================
// 4. Análise de "cha" / "tha" / "dah" (artigos candidatos)
// ===========================================================================
const articles = ["cha", "tha", "dah"];
console.log("\n=== Possíveis artigos ===");
for (const a of articles) {
  const c = freq.get(a) ?? 0;
  console.log(`  ${a}: ${c}x`);
}

// ===========================================================================
// 5. Linha-por-linha decoded com o que sabemos
// ===========================================================================
console.log("\n=== Decoded line-by-line (palavras conhecidas em maiúsculo) ===");
const lines = MEHRAH_ASRAM.split("\n");
for (const line of lines) {
  if (!line.trim()) continue;
  const decoded = line
    .split(/\s+/)
    .map((w) => {
      const lower = w.toLowerCase().replace(/[.,!?]$/g, "");
      const punct = w.match(/[.,!?]$/)?.[0] ?? "";
      if (KNOWN[lower]) return `[${KNOWN[lower].toUpperCase()}]${punct}`;
      if (SPECULATIVE[lower]) return `<${SPECULATIVE[lower]}>${punct}`;
      return w;
    })
    .join(" ");
  console.log(`  ${line}`);
  console.log(`  → ${decoded}\n`);
}

// ===========================================================================
// 6. Procurar pattern "chamek + at + uthul" (frase canon)
// ===========================================================================
console.log("\n=== Ocorrências da frase 'chamek ... uthul' ===");
const text = MEHRAH_ASRAM.toLowerCase();
const matches = text.matchAll(/chamek[^.]{0,40}uthul/g);
let count = 0;
for (const m of matches) {
  count++;
  console.log(`  ${count}. "${m[0]}" (pos ${m.index})`);
}

// ===========================================================================
// 7. Conclusão analítica
// ===========================================================================
console.log("\n=== ANÁLISE FINAL ===");
console.log(`- Vocabulário: ~${new Set(tokens).size} palavras únicas em ${tokens.length} tokens`);
console.log(`- Variantes de "thul" (blood): ${thulSet.size} formas diferentes`);
console.log(`- "chamek" (blood/sacrifice) aparece: ${freq.get("chamek") ?? 0}x`);
console.log(`- Artigos candidatos (cha+tha+dah): ${
  (freq.get("cha") ?? 0) + (freq.get("tha") ?? 0) + (freq.get("dah") ?? 0)
}x`);
console.log(`\nHipótese: a frase 'chamek at uthul hatradek asram' (linha 5) pode significar`);
console.log(`           'sacrifice your blood [hatradek] of/to Asram' — invocação ritualística`);
console.log(`           focada em Asram (Mehrah Asram = invocação a Asram).`);
