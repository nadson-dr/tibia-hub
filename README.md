# Tibia Hub

Fansite de Tibia com múltiplas ferramentas para a comunidade. A primeira é um **marketplace de
service de quests** que substitui o fluxo de Google Forms + WhatsApp dos times, validando o
personagem na hora (mundo/vocação/level via TibiaData) e organizando a fila por vocação.

> **Tibia Hub é um fansite — não cobra por nada.** Todas as ferramentas são gratuitas (regra
> CipSoft). Doação opcional em Tibia Coin é só cosmética. Ver [`spec/06-constraints.md`](./spec/06-constraints.md).

## A spec é a fonte de verdade

Antes de codar, leia [`spec/`](./spec/). Visão (`00`), arquitetura (`01`), modelo de dados (`02`),
design system (`03`), MVP (`04`), roadmap (`05`), restrições (`06`), workflow de agents (`07`),
convenções (`08`).

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind v4 · Firebase (Firestore + Auth, free tier) ·
TibiaData API · deploy na Vercel. Detalhes e o *porquê* em `spec/01-architecture.md`.

## Desenvolvimento

```bash
pnpm install
cp .env.local.example .env.local   # preencha com as chaves do seu projeto Firebase
pnpm dev                           # http://localhost:3000
```

Outros scripts: `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`.

### Firebase

1. Crie um projeto no [console Firebase](https://console.firebase.google.com) (plano Spark/free).
2. Ative **Firestore** e **Authentication** (Google + Email/senha).
3. Web app → copie a config para `NEXT_PUBLIC_FIREBASE_*` no `.env.local`.
4. Service account → gere a chave privada → `FIREBASE_ADMIN_*` no `.env.local`.
5. Rules/índices: `firebase deploy --only firestore` (ou cole `firestore.rules` no console).

### Deploy (Vercel)

Conecte o repositório na Vercel e defina as mesmas env vars (`NEXT_PUBLIC_FIREBASE_*`,
`FIREBASE_ADMIN_*`, `TIBIADATA_USER_AGENT`). Push em `main` → deploy automático.

## Estrutura

```
spec/        fonte de verdade (produto + arquitetura)
src/app/     rotas (App Router)
src/components/ui   primitivos do design system Royal Parchment
src/lib/     firebase/ (client+admin), tibiadata/ (validação de char)
src/types/   tipos compartilhados (contrato front/back)
docs/tibia-knowledge/   base canônica de Tibia (fórmulas, quests, bosses, lore)
scripts/     scrapers (books) — fase futura
firestore.rules / firestore.indexes.json   regras e índices versionados
legacy/      snapshot do projeto anterior (Supabase) — referência, fora do repo
```

Agents e skills de desenvolvimento ficam em `.claude/` na raiz do workspace (`../`) — ver
`spec/07-agents-workflow.md`.
