# ADR-001: Stack Next.js + Firebase (supersede stack Supabase)

## Status
Aceito · 2026-06-03 · supersede o ADR-001 do projeto anterior (Supabase)

## Contexto

O projeto anterior (`tibia-quest-platform`) usava Next.js + **Supabase** (Postgres + Auth + RLS +
Realtime). Acumulou complexidade desproporcional ao MVP (RLS por tabela, server actions amarradas
ao schema, generic types de FK). O usuário pediu **recomeço com arquitetura simples**, mirando o
**free tier** e publicação **rápida na Vercel**.

## Decisão

Stack do Tibia Hub:

- **Next.js 16 (App Router) + TypeScript** — único framework de peso.
- **Firebase Firestore** como banco (NoSQL serverless).
- **Firebase Auth** (Google + email/senha) — ver ADR-008.
- **Tailwind v4** + componentes copy-in (estilo shadcn) + Radix pontual. Sem lib de design pesada.
- **Vercel** para hospedagem; Firebase no plano **Spark (free)**.
- **Sem Cloud Functions no MVP** — lógica server roda como Route Handler/Server Action na Vercel
  com o Admin SDK.

## Consequências

**Positivas**
- Setup mais simples; free tier generoso (Spark) sem cartão.
- Firestore realtime nativo (útil para fila/notificações futuras) sem montar canais.
- Deploy Vercel + Firebase é caminho batido, publicação rápida.

**Negativas**
- NoSQL exige modelar por leitura (denormalização) — menos flexível que SQL ad-hoc. Mitigado em
  [`02-data-model.md`](../02-data-model.md).
- Sem joins; queries compostas precisam de índices declarados (`firestore.indexes.json`).
- Lógica de negócio que no Supabase ficava em RLS agora fica em server actions + rules — fronteira
  documentada em [`01-architecture.md`](../01-architecture.md).

## Alternativas consideradas
- **Manter Supabase:** rejeitado — o usuário quer simplificar e o free tier do Firebase atende.
- **Firebase + Cloud Functions:** adiado — Functions empurram para Blaze e adicionam runtime;
  desnecessário no MVP.
