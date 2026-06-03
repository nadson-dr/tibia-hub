// Wikitext parser focado em pages do tipo {{Infobox Book}}.
// Extrai metadata + texto do book como markdown limpo.

export type BookFields = {
  /** Título canônico do book pra UI (wiki identifier; usa booktype, depois page name). */
  title: string;
  /** Título exato escrito no livro in-game (preservado fielmente; pode ser "Untitled"). */
  inGameTitle?: string;
  /** Tipo do book (alguns títulos coletivos têm múltiplas variantes). */
  booktype?: string;
  /** Texto completo, normalizado pra markdown. */
  text: string;
  /** Texto cru com flags de "vazio" / "ilegível". */
  textStatus: "ok" | "empty" | "unknown_language" | "image_only" | "missing";
  /** Local in-game (humanizado, sem wikilinks). */
  location?: string;
  /** Autor declarado na wiki, se houver. */
  author?: string;
  /** Blurb/descrição de wiki — útil pra summary curta. */
  blurb?: string;
  /** Página relacionada (ex: "Plains of Havoc Library"). */
  returnPage?: string;
  /** Páginas relacionadas (nomes humanizados). */
  relatedPages?: string[];
  /** Notas wiki (ex: "Obtained during X quest"). */
  notes?: string;
  /** Versão do client em que foi implementado. */
  implemented?: string;
};

/**
 * Extrai o conteúdo do template `{{Infobox Book|...}}` de um wikitext.
 * Suporta múltiplos Infobox Book na mesma página (coleções tipo The First Creatures I + II).
 */
export function extractInfoboxBooks(wikitext: string): Record<string, string>[] {
  const results: Record<string, string>[] = [];
  // Match each `{{Infobox Book ... }}` permitindo balanced braces aninhadas.
  let cursor = 0;
  while (true) {
    const start = wikitext.indexOf("{{Infobox Book", cursor);
    if (start === -1) break;
    // Procura fechamento balanceado.
    let depth = 0;
    let i = start;
    for (; i < wikitext.length; i++) {
      if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
        depth++;
        i++;
      } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
        depth--;
        i++;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    const block = wikitext.slice(start + 2, i - 2); // sem as chaves
    results.push(parseTemplateBody(block));
    cursor = i;
  }
  return results;
}

/**
 * Parseia o corpo de um template `Nome|key = value|key2 = value2|...`.
 * Respeita templates aninhados (não quebra o pipe interno deles).
 */
function parseTemplateBody(body: string): Record<string, string> {
  // Skip "Infobox Book" name no início.
  const parts = splitTopLevel(body, "|");
  const fields: Record<string, string> = {};
  // primeiro parts[0] é o nome do template; pulamos.
  for (let p = 1; p < parts.length; p++) {
    const eq = parts[p].indexOf("=");
    if (eq === -1) continue;
    const key = parts[p].slice(0, eq).trim();
    const value = parts[p].slice(eq + 1).trim();
    if (key) fields[key.toLowerCase()] = value;
  }
  return fields;
}

/**
 * Split por separador no top-level, respeitando templates `{{...}}` e wikilinks `[[...]]` aninhados.
 */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let buf = "";
  let braceDepth = 0;
  let bracketDepth = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const n = input[i + 1];
    if (c === "{" && n === "{") {
      braceDepth++;
      buf += "{{";
      i++;
      continue;
    }
    if (c === "}" && n === "}") {
      braceDepth--;
      buf += "}}";
      i++;
      continue;
    }
    if (c === "[" && n === "[") {
      bracketDepth++;
      buf += "[[";
      i++;
      continue;
    }
    if (c === "]" && n === "]") {
      bracketDepth--;
      buf += "]]";
      i++;
      continue;
    }
    if (c === sep && braceDepth === 0 && bracketDepth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf.length) out.push(buf);
  return out;
}

/**
 * Limpa wikitext de texto narrativo:
 *  - resolve `[[Target|Display]]` → `Display`, `[[Target]]` → `Target`
 *  - remove templates inline simples como `{{Mapper Coords|...|text=here}}` → "here"
 *  - converte `<br>` / `<br/>` em quebra de linha
 *  - colapsa whitespace
 */
export function cleanWikitextProse(input: string): string {
  if (!input) return "";
  let s = input;

  // Resolver Mapper Coords -> text=...
  s = s.replace(/\{\{Mapper Coords[^}]*\|text=([^|}]+)\}\}/gi, "$1");

  // Templates desconhecidos simples (1 nível): apenas remove
  s = s.replace(/\{\{[^{}]*\}\}/g, "");

  // Wikilinks com display
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  // Wikilinks sem display
  s = s.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // <br> variants → \n
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // outras tags HTML simples — remove abre/fecha mas preserva conteúdo
  s = s.replace(/<\/?(?:i|b|em|strong|pre|code|small|big|sub|sup|span|div|p)>/gi, "");
  // tags com atributos (<span style="..."> etc)
  s = s.replace(/<(?:span|div|p|pre|code)\b[^>]*>/gi, "");

  // HTML entities básicos
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  // Colapsa 3+ \n para 2
  s = s.replace(/\n{3,}/g, "\n\n");
  // Trim espaços por linha
  s = s
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();

  return s;
}

/**
 * Detecta status do texto do book.
 */
export function classifyText(raw: string): BookFields["textStatus"] {
  if (!raw || raw.trim() === "" || raw.trim() === "?") return "empty";
  const lower = raw.toLowerCase();
  if (
    lower.includes("(unknown language)") ||
    lower.includes("in an unknown") ||
    lower.includes("indecipherable") ||
    lower.includes("strange language") ||
    lower.includes("cannot be read") ||
    /^[a-z'\s]{1,30}$/i.test(raw) && /[xqz]{2,}/i.test(raw) // gibberish curto
  ) {
    return "unknown_language";
  }
  if (/^\[\[file:/i.test(raw.trim()) || /^\{\{image/i.test(raw.trim())) {
    return "image_only";
  }
  return "ok";
}

/**
 * Aplica um Infobox Book → BookFields.
 */
export function infoboxToBook(infobox: Record<string, string>, pageTitle: string): BookFields {
  const rawText = infobox.text ?? "";
  const textStatus = classifyText(rawText);

  const rawTitle = cleanWikitextProse(infobox.title ?? "").trim();
  const rawBooktype = cleanWikitextProse(infobox.booktype ?? "").trim();
  const pageTitleClean = pageTitle.replace(/\s*\(Book\)\s*$/i, "").trim();

  // Title pra UI: prefere o page name (identidade catalogada na wiki),
  // depois in-game title (se não for genérico tipo "Untitled"),
  // depois booktype (pode ser sprite template tipo "Book (Brown)").
  const titleIsGeneric = /^untitled$/i.test(rawTitle) || rawTitle === "";
  const booktypeIsSprite = /^Book\s*\(/i.test(rawBooktype);
  const uiTitle =
    pageTitleClean ||
    (titleIsGeneric ? "" : rawTitle) ||
    (booktypeIsSprite ? "" : rawBooktype) ||
    rawTitle ||
    rawBooktype;

  return {
    title: normalizeTitleCase(uiTitle),
    inGameTitle: rawTitle || undefined,
    booktype: rawBooktype || undefined,
    text: textStatus === "ok" ? cleanWikitextProse(rawText) : cleanWikitextProse(rawText),
    textStatus,
    location: infobox.location ? cleanWikitextProse(infobox.location) : undefined,
    author: infobox.author ? cleanWikitextProse(infobox.author) : undefined,
    blurb: infobox.blurb && infobox.blurb.trim() !== "?" ? cleanWikitextProse(infobox.blurb) : undefined,
    returnPage: infobox.returnpage ? cleanWikitextProse(infobox.returnpage) : undefined,
    relatedPages: infobox.relatedpages
      ? cleanWikitextProse(infobox.relatedpages)
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    notes: infobox.notes ? cleanWikitextProse(infobox.notes) : undefined,
    implemented: infobox.implemented ? infobox.implemented.trim() : undefined,
  };
}

/**
 * Normaliza título: se vier all-lowercase, capitaliza com Title Case;
 * preserva intencionais como "1001 ways ..." virando "1001 Ways ...".
 * Stopwords minúsculas: a, an, the, of, in, to, for, on, by, with, and, or
 */
const STOPWORDS = new Set(["a", "an", "the", "of", "in", "to", "for", "on", "by", "with", "and", "or", "from", "at"]);
export function normalizeTitleCase(input: string): string {
  if (!input) return input;
  // Se já tem mistura de maiúscula/minúscula, deixa como está.
  const hasUpper = /[A-Z]/.test(input);
  const hasLower = /[a-z]/.test(input);
  if (hasUpper && hasLower) return input;

  const words = input.toLowerCase().split(/(\s+)/);
  let firstWord = true;
  return words
    .map((w) => {
      if (/^\s+$/.test(w)) return w;
      if (firstWord) {
        firstWord = false;
        return capitalizeWord(w);
      }
      if (STOPWORDS.has(w)) return w;
      return capitalizeWord(w);
    })
    .join("");
}

function capitalizeWord(w: string): string {
  if (!w) return w;
  return w[0].toUpperCase() + w.slice(1);
}

/**
 * Helper end-to-end: pega wikitext de uma page de book e retorna 1+ BookFields.
 */
export function parseBookPage(pageTitle: string, wikitext: string): BookFields[] {
  const infoboxes = extractInfoboxBooks(wikitext);
  if (infoboxes.length === 0) {
    return [
      {
        title: pageTitle.replace(/\s*\(Book\)\s*$/i, "").trim(),
        text: "",
        textStatus: "missing",
      },
    ];
  }
  return infoboxes.map((ib) => infoboxToBook(ib, pageTitle));
}
