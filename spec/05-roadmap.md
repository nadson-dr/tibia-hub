# 05 — Roadmap

Entrega incremental. Cada fase é deployável. Fases 0–1 são bloqueadoras; o resto pode ser
paralelizado pelos agents (ver [`07`](./07-agents-workflow.md)).

## Fase 0 — Scaffold + deploy (publicação rápida) ✅ alvo imediato
- Next.js 16 + TS + Tailwind v4, tokens **Royal Parchment** em `globals.css`.
- `lib/firebase/{client,admin}.ts`, `firestore.rules`, `firestore.indexes.json`.
- Página `/` (hub estático) com os cards das ferramentas.
- Repo GitHub + deploy Vercel + env vars.
- **Saída:** URL pública no ar com o tema. Pipeline validado antes de qualquer feature.

## Fase 1 — MVP serviceiros (o foco)
- Firebase Auth (Google + email/senha); `/login`, `/signup` (cliente | time).
- Onboarding do time; `/p/[slug]` dashboard de fila.
- `offerings` (abrir/pausar/fechar); `signups` com validação TibiaData.
- Wizard de inscrição em `/g/[slug]/a/[offeringId]/signup` (+ modo rápido).
- `/service` (busca + filtro por mundo) e `/g/[slug]`.
- **Saída:** um time real consegue substituir o Google Form.

## Fase 2 — Hub público + governança
- Polish da home; `/quests/[code]` (quest-first).
- Aprovação de times (admin) e onboarding mais fluido.
- **Badge Apoiador** (doação TC cosmética — ver [`06`](./06-constraints.md)); página de
  agradecimento. **Sem** desbloqueio de feature.
- Métricas de `source` para o time.

## Fase 3 — Boss Timers
- Coleções `bosses` + `boss_appearances`; `/bosses`, `/bosses/[slug]`.
- Self-report comunitário + cálculo de janela de respawn.
- Usa skill `tibia-boss-timers` e a knowledge base (`docs/tibia-knowledge/08-bosses.md`).

## Fase 4 — Calculadoras
- `lib/formulas/` (XP, ML, skill, dano, charm…) derivado de `docs/tibia-knowledge/01-formulas.md`.
- `/tools/*` com cross-check contra calculadoras de referência (skill `tibia-formulas`).

## Fase 5 — Comunidade + Lore
- Formações **avulsas** (`offerings.kind = "community"`, split igual de drops).
- `/lore`, `/books`, `/books/[slug]` (seed migrado dos scrapers; footer CC-BY-SA TibiaWiki).
- Notificações in-app (coleção `notifications`, listener realtime) — se fizer sentido.

## Dependências
```
Fase 0 ──> Fase 1 ──> Fase 2
                 └──> Fase 3 (paralela)
                 └──> Fase 4 (paralela)
                          └──> Fase 5
```
