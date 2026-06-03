# 01 — Arquitetura

## Princípios

1. **Simples por padrão.** Poucos frameworks. Cada dependência precisa justificar seu peso.
2. **Rotas finas, lógica em módulos.** Páginas/route handlers orquestram; a lógica vive em
   `lib/` e `features/`. Nada de abstração especulativa.
3. **Server Components por padrão.** `"use client"` só onde há interatividade real.
4. **Fronteira de segurança clara.** Leitura pública via client SDK + rules; escrita sensível e
   validação externa via **Admin SDK no servidor**.
5. **Fácil de evoluir.** Adicionar uma ferramenta nova = adicionar uma rota + um módulo, sem
   tocar nas existentes.

## Stack

| Camada | Escolha | Por quê |
|--------|---------|---------|
| Framework | **Next.js 16 (App Router) + TypeScript** | Único framework de peso. SSR/RSC, route handlers, deploy Vercel nativo. |
| Estilo | **Tailwind CSS v4** | Tokens da paleta em `@theme`. Zero runtime. |
| UI | Componentes **copy-in** (estilo shadcn) + **Radix** onde precisa de a11y | Sem lib pesada de design; controle total do visual Royal Parchment. |
| Ícones | **lucide-react** | Leve, tree-shakeable. |
| Banco | **Firebase Firestore** (Spark/free) | NoSQL serverless, realtime, generoso no free tier. |
| Auth | **Firebase Auth** — Google + email/senha | Login social 1-clique + fallback. |
| Validação de char | **TibiaData API v4** | Confirma mundo/vocação/level. Wrapper já migrado em `lib/tibiadata/`. |
| Hospedagem | **Vercel** | Deploy automático via GitHub, edge/Node runtime. |

**Sem:** Supabase, Postgres, RLS, ORM, Redux, gateway de pagamento, Cloud Functions (no MVP).

## Fronteira client / server

```
┌─────────────── Browser (client) ───────────────┐
│  Firebase Web SDK                               │
│   • Auth (Google / email-senha)                 │
│   • Firestore reads (dados públicos + próprios) │   ← protegido por firestore.rules
│   • Firestore listeners (realtime, quando usado)│
└────────────────────────────────────────────────┘
                     │  ID token
                     ▼
┌──────────── Next.js server (Vercel) ────────────┐
│  Route Handlers / Server Actions                │
│   • Firebase Admin SDK (escrita privilegiada)   │
│   • verifyIdToken() em toda mutação sensível    │
│   • fetch TibiaData (validação de personagem)   │
└─────────────────────────────────────────────────┘
```

- **Leituras** simples (listar times aprovados, ofertas abertas, perfil próprio) podem ir direto
  do client via SDK, governadas pelas `firestore.rules`.
- **Escritas sensíveis** (criar signup validado, mudar status da fila, aprovar time) passam pelo
  **servidor** (Admin SDK), que verifica o ID token e aplica regras de negócio que rules não
  conseguem expressar (ex.: validar char na TibiaData antes de aceitar o signup).

## Por que sem Cloud Functions no MVP

Cloud Functions exigem o plano Blaze (cartão) em muitos casos e adicionam um runtime extra para
operar. Toda lógica de servidor roda como **Route Handler / Server Action na Vercel** (Node
runtime), mantendo o Firebase no **Spark (free)**. Functions só entram se algum gatilho
server-side (ex.: cron de boss respawn) realmente exigir — decisão por ADR quando chegar a hora.

## Configuração Firebase

- `src/lib/firebase/client.ts` — inicializa o Web SDK a partir de `NEXT_PUBLIC_FIREBASE_*`.
  Idempotente (`getApps().length ? getApp() : initializeApp(...)`).
- `src/lib/firebase/admin.ts` — inicializa o Admin SDK a partir de credenciais de service account
  (`FIREBASE_ADMIN_*` em env vars do servidor; **nunca** `NEXT_PUBLIC_`). Usado só no servidor.
- `firestore.rules` e `firestore.indexes.json` versionados na raiz; aplicados via
  `firebase deploy --only firestore` (ou console no começo).

## Deploy

- Push para `main` no GitHub → Vercel builda e publica.
- Env vars na Vercel: `NEXT_PUBLIC_FIREBASE_*` (client) + `FIREBASE_ADMIN_*` (server) +
  `TIBIADATA_USER_AGENT`.
- **Fase 0** publica um hub estático com o tema, validando o pipeline antes de qualquer feature.

## Notificações (reservado, não no MVP)

Coleção `notifications/{uid}/items` modelada em [`02`](./02-data-model.md) mas **não
implementada**. Quando ativarmos: listener Firestore no client mostra badge in-app. Push (FCM) /
email ficam para um ADR futuro. Nada de API paga.
