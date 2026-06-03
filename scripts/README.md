# scripts/

Scripts auxiliares de scraping e seed para o fansite.

## scrape-books.ts

Baixa **todos os books in-game** do Tibia via [MediaWiki API](https://tibia.fandom.com/api.php) de `Category:Book_Texts`.

### Como funciona

1. Lista membros de `Category:Book_Texts` (paginado, 500 por batch).
2. Para cada page, baixa o wikitext bruto.
3. Extrai `{{Infobox Book|...}}` (suporta múltiplos infoboxes por page).
4. Limpa wikitext → markdown.
5. Salva em `data/books-raw.jsonl` (1 linha JSON por book).

### Pré-requisitos

```bash
pnpm add -D tsx
```

### Uso

```bash
# Dry run com 10 books (review qualidade antes de soltar full):
pnpm tsx scripts/scrape-books.ts --limit=10

# Full scrape (~3-5 min, ~500 books esperados):
pnpm tsx scripts/scrape-books.ts

# Retoma se cancelar / der erro de rede no meio:
pnpm tsx scripts/scrape-books.ts --resume
```

### Output

- `data/books-raw.jsonl` — 1 linha por book parseado.
- `data/books-scrape.log` — log temporal.
- `data/books-raw.jsonl.prev` — backup do run anterior (se houver).

Cada linha tem:
```json
{
  "title": "The Holy Tible",
  "booktype": "The Holy Tible",
  "text": "The Holy Tible:\n\nBanor I praise your name.\n...",
  "textStatus": "ok",
  "location": "Plains of Havoc, here.",
  "blurb": null,
  "returnPage": "Plains of Havoc Library",
  "relatedPages": ["Banor"],
  "notes": "Obtained during the Pits of Inferno Quest.",
  "implemented": "7.9",
  "source": "fandom-en",
  "pageTitle": "The Holy Tible (Book)",
  "pageId": 75914,
  "slug": "the-holy-tible",
  "pageUrl": "https://tibia.fandom.com/wiki/The_Holy_Tible_(Book)",
  "scrapedAt": "2026-06-01T00:00:00.000Z"
}
```

### Política

- **User-Agent** identificado por convenção MediaWiki (em `scripts/lib/mediawiki.ts`).
- **Rate limit**: 4 req/s (250ms entre requests).
- **Sem auth**: API pública.
- **Compliance**: dados são **CC-BY-SA** (Fandom default). Atribuição em qualquer publicação derivada.
