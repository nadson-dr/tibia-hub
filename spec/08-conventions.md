# 08 — Convenções de código

Código **extremamente organizado e fácil de evoluir**. Quem chega lê isto e sabe onde tudo vai.

## Organização

```
src/
  app/            rotas (App Router). Páginas finas: buscam dados + compõem componentes.
    (site)/       grupo público (hub, /service, /g/[slug], /quests/[code])
    (auth)/       /login, /signup
    p/[slug]/     dashboard do time (logado)
    me/           perfil + characters
  components/
    ui/           primitivos genéricos (Button, Card, Badge, Input, Dialog, Tabs, Table)
    <domain>/     componentes de feature (service/, team/, character/, site/)
  lib/
    firebase/     client.ts (Web SDK), admin.ts (Admin SDK), config
    tibiadata/    wrappers da API externa (Result-like)
    formulas/     math do jogo (calculadoras)
  server/
    actions/      server actions (mutações via Admin SDK)
  features/       (opcional) módulo co-localizado quando a lógica de uma feature cresce
  types/          tipos compartilhados (contrato entre front e back)
```

**Regra:** rota fina → lógica em `lib`/`server`/`features`. Componente não fala com Firestore
Admin direto; chama uma server action.

## TypeScript

- `strict: true`. Sem `any` implícito. `unknown` + narrowing nas bordas (respostas de API).
- **Padrão `Result`** para I/O que pode falhar (TibiaData, escrita Firestore), em vez de throw:
  ```ts
  type Result<T, E = string> =
    | { ok: true; value: T }
    | { ok: false; error: E };
  ```
  (O wrapper migrado de `lib/tibiadata` usa a variante `{ ok, character } | { ok, error }` — ok
  manter o estilo local, desde que explícito e discriminável.)
- Tipos de dados Firestore vivem em `src/types/` e são a fonte única — front e back importam dali.

## Nomenclatura

- **Código em inglês** (identificadores, tipos, arquivos). **Conteúdo/UI em PT-BR.**
- Arquivos: `kebab-case.ts` para módulos, `PascalCase.tsx` para componentes.
- Server actions: verbo + entidade — `createSignup`, `updateSignupStatus`, `approveTeam`.
- Coleções Firestore e campos: `camelCase` (ver [`02`](./02-data-model.md)).

## Componentes

- Server Component por padrão; `"use client"` só com interatividade (forms, listeners realtime).
- Componente pequeno, uma responsabilidade. Props tipadas. Sem hex hard-coded — usar tokens (`03`).

## Firebase

- **Nunca** importar o Admin SDK em código client. `admin.ts` é server-only (`import "server-only"`).
- Toda mutação relevante: server action → `verifyIdToken` → regra de negócio → write.
- `firestore.rules` versionado; mudança de regra acompanha a feature no mesmo PR.

## Git

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Sem segredos no repo. `.env.local.example` documenta as chaves; `.env.local` é gitignored.
- `legacy/` é gitignored (snapshot de referência, não faz parte do projeto).

## ADRs

Decisão estrutural (escolha de banco, modelo de auth, política de cobrança) → um ADR em
`spec/adr/NNN-titulo.md`. ADR muda → não apaga o antigo, escreve um novo que o supersede.
