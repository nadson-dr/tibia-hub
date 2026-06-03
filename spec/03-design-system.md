# 03 — Design system: Royal Parchment

Tema medieval quente que evoca o **cliente clássico do Tibia**: madeira escura, ouro, pergaminho.
Sem neon, sem flat-design genérico. Aconchegante como uma taverna.

## Tokens

Definidos como CSS custom properties em `src/app/globals.css` e expostos ao Tailwind v4 via
`@theme`. **Nunca** hard-code hex em componente — sempre o token.

```css
:root {
  --bg:      #17120c;  /* madeira escura — fundo da app        */
  --surface: #241b12;  /* painéis / cards                      */
  --surface-2: #2e2418;/* hover de superfície / linhas zebra   */
  --border:  #3a2c1c;  /* bordas quentes                       */
  --gold:    #d4af37;  /* CTA primário / realce                */
  --amber:   #e8a33d;  /* hover / ênfase                       */
  --text:    #ece3d0;  /* pergaminho — texto principal         */
  --muted:   #9a8c73;  /* texto secundário                     */
  --success: #6fae5e;  /* confirmado / done                    */
  --danger:  #c0552f;  /* erro / cancelado                     */
  --info:    #7c93c0;  /* avisos neutros                       */
}
```

Mapeamento Tailwind (em `@theme`): `--color-bg`, `--color-surface`, `--color-gold`, etc., para
usar como `bg-bg`, `text-gold`, `border-border`, `bg-surface`.

### Cores por vocação (badges de fila)
| Vocação | Cor | Token sugerido |
|---------|-----|----------------|
| EK (Knight) | vermelho aço | `#c0552f` |
| RP (Paladin) | verde | `#6fae5e` |
| ED (Druid) | azul-gelo | `#7c93c0` |
| MS (Sorcerer) | violeta | `#9b6fd4` |
| EM (Monk) | âmbar | `#e8a33d` |

## Tipografia

- **Display / títulos:** serifada medieval — **Cinzel** (caps elegantes) ou **EB Garamond**,
  via `next/font/google`. Usada em headings e no logo.
- **Corpo / UI:** sans legível — **Inter** ou a stack do sistema. Prioriza leitura de tabelas de
  fila.
- Escala: títulos com `tracking` levemente aumentado; corpo confortável (16px base).

## Componentes base (`src/components/ui/`)

Copy-in, tipados, sem dependência de design framework. Cada um lê tokens, não hex.

- **Button** — variantes `gold` (CTA, fundo dourado + texto escuro), `outline` (borda quente),
  `ghost`. Foco com brilho dourado (`ring-gold`).
- **Card** — `bg-surface`, `border-border`, cantos levemente arredondados, sombra sutil quente.
- **Badge** — vocação (cor da tabela acima), status (`waiting`/`scheduled`/`done`/`cancelled`),
  e **Apoiador** (cosmético, dourado).
- **Input / Select** — `bg-surface-2`, borda quente, foco dourado.
- **Dialog** (Radix) — para wizard de signup e confirmações.
- **Tabs** (Radix) — separar fila por vocação no painel.
- **Table** — fila: zebra com `surface-2`, colunas char/level/contato/status.
- **EmptyState** — pergaminho com mensagem (ex.: "Nenhuma fila aberta").

## Princípios visuais

- **Hierarquia pelo ouro:** só o que importa (CTA, números-chave) recebe dourado. Excesso de ouro
  mata o efeito.
- **Profundidade quente:** camadas `bg` → `surface` → `surface-2`, bordas `border`. Sem sombras
  azuladas.
- **Estados claros:** `success`/`danger`/`info` para status; nunca comunicar só por cor (ícone +
  texto também — a11y).
- **Responsivo mobile-first:** o cliente se inscreve no celular; a tabela de fila colapsa em
  cards no mobile.

## Acessibilidade

- Contraste mínimo AA: `--text` sobre `--bg`/`--surface` passa. `--gold` sobre escuro é CTA, não
  texto longo.
- Foco sempre visível (anel dourado). Componentes Radix dão semântica de teclado.
