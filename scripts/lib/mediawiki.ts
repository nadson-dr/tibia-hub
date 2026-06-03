// MediaWiki API client (Fandom).
// Used by scripts/scrape-books.ts.
//
// Endpoints documented at:
//   https://www.mediawiki.org/wiki/API:Main_page
//   https://tibia.fandom.com/api.php

const USER_AGENT = "tibia-quest-platform/1.0 (https://github.com/nadson; contact: nadson.dr11@gmail.com)";

export type WikiSource = "fandom-en" | "fandom-pt-br";

const ENDPOINTS: Record<WikiSource, string> = {
  "fandom-en": "https://tibia.fandom.com/api.php",
  "fandom-pt-br": "https://www.tibiawiki.com.br/api.php",
};

export type CategoryMember = {
  pageid: number;
  title: string;
};

export type ParseResult = {
  title: string;
  pageid: number;
  wikitext: string;
};

type CategoryMembersResponse = {
  batchcomplete?: string;
  continue?: { cmcontinue: string };
  query: { categorymembers: CategoryMember[] };
};

type ParseResponse = {
  parse?: {
    title: string;
    pageid: number;
    wikitext: string;
  };
  error?: { code: string; info: string };
};

async function call<T>(source: WikiSource, params: Record<string, string>): Promise<T> {
  const url = new URL(ENDPOINTS[source]);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return (await response.json()) as T;
}

/**
 * Lista todos os membros de uma categoria, paginando automaticamente.
 * Filtra pra ns=0 (mainspace) por padrão.
 */
export async function listCategoryMembers(
  source: WikiSource,
  category: string,
  options: { limit?: number; pageSize?: number } = {},
): Promise<CategoryMember[]> {
  const { limit = Infinity, pageSize = 500 } = options;
  const collected: CategoryMember[] = [];
  let cmcontinue: string | undefined;

  while (collected.length < limit) {
    const remaining = Math.min(pageSize, limit - collected.length);
    const params: Record<string, string> = {
      action: "query",
      list: "categorymembers",
      cmtitle: category,
      cmlimit: String(remaining),
      cmnamespace: "0",
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    const data = await call<CategoryMembersResponse>(source, params);
    collected.push(...data.query.categorymembers);

    if (!data.continue) break;
    cmcontinue = data.continue.cmcontinue;

    // be polite — 200ms between paginated calls
    await sleep(200);
  }

  return collected.slice(0, limit === Infinity ? undefined : limit);
}

/**
 * Baixa o wikitext bruto de uma página.
 */
export async function fetchWikitext(source: WikiSource, title: string): Promise<ParseResult | null> {
  const data = await call<ParseResponse>(source, {
    action: "parse",
    page: title,
    prop: "wikitext",
  });

  if (data.error) {
    if (data.error.code === "missingtitle") return null;
    throw new Error(`Parse error for "${title}": ${data.error.code} — ${data.error.info}`);
  }
  if (!data.parse) return null;

  return {
    title: data.parse.title,
    pageid: data.parse.pageid,
    wikitext: data.parse.wikitext,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Slug-ify usando convenção do projeto: lowercase, hífen, ASCII puro.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(book\)\s*$/i, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
