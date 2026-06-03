# 07 — Agents & workflow de paralelismo

O desenvolvimento usa um **orquestrador** que decompõe uma feature em tarefas independentes e
dispara **workers em paralelo**, depois integra. Definições em `.claude/agents/` (no root `Tibia/`,
auto-detectadas pelo Claude Code).

## Elenco

| Agent | Papel | Toca em | Modelo |
|-------|-------|---------|--------|
| **orchestrator** | Decompõe a feature, dispara workers em paralelo, integra e revisa | coordena (não escreve feature) | opus |
| **tibia-frontend** | UI seguindo o design system | `src/app/**`, `src/components/**`, `globals.css` | sonnet |
| **tibia-backend** | Dados, Admin SDK, server actions, rules, validação | `src/lib/**`, `src/server/**`, `firestore.rules`, `firestore.indexes.json` | sonnet |
| **tibia-expert** | Verdade de mecânica/fórmula/quest do jogo (lê a knowledge base) | consulta (não escreve app) | sonnet |
| **tibia-reviewer** *(opcional)* | Revisa o diff contra spec + convenções | leitura | sonnet |

## Contrato de paralelismo (como evitar conflito)

A divisão é por **fronteira de arquivo** — dois workers nunca editam os mesmos arquivos:

- **frontend** → `src/app/`, `src/components/`, estilos.
- **backend** → `src/lib/`, `src/server/`, `firestore.rules`, `firestore.indexes.json`.
- **Tipos compartilhados** (`src/types/`) são definidos **pelo orquestrador antes** de disparar,
  como contrato. Os workers consomem, não redefinem.

### O orquestrador, por feature, faz:
1. **Lê a spec** relevante (`00`/`02`/`03`/`04`) e fixa o **contrato de tipos** em `src/types/`.
2. Escreve um **briefing por worker** contendo: (a) caminho do doc de spec a seguir, (b) os tipos
   compartilhados já definidos, (c) a fronteira de arquivos permitida, (d) o critério de pronto.
3. **Dispara os workers em paralelo** — múltiplas chamadas do Agent tool **numa única mensagem**.
4. **Integra:** roda `pnpm build`/`lint`, resolve interfaces nas bordas, e (opcional) chama o
   `tibia-reviewer`.
5. Reporta o que foi feito e o que falta.

### Exemplo — feature "wizard de signup com validação TibiaData"
```
orchestrator:
  1. define em src/types/: Signup, Offering, CharacterValidation
  2. dispara em paralelo:
     • tibia-backend  → server action createSignup() + valida via lib/tibiadata + rules de signups
     • tibia-frontend → wizard /g/[slug]/a/[id]/signup usando os tipos + componentes ui/
     • tibia-expert   → confirma pré-requisitos da quest p/ o checklist (consulta)
  3. integra: build, conecta o form à action, revisa
```

## Quando NÃO paralelizar
Tarefa pequena, isolada e num único arquivo: o orquestrador (ou o próprio fluxo principal) faz
direto, sem disparar workers. Paralelismo é para features que cruzam front+back.

## Skills (`.claude/skills/`)
Disparadas automaticamente pelo `description`. Cada uma é conhecimento de domínio reutilizável:
- `firebase-firestore` — modelagem, security rules, queries, free tier, client vs Admin SDK.
- `tibia-data-api` — wrappers `Result<T,E>`, TTL, User-Agent.
- `tibia-service-marketplace` — modelo do marketplace, validação híbrida, fila por vocação.
- `tibia-formulas`, `tibia-quests`, `tibia-boss-timers`, `tibia-lore-books` — domínio do jogo.

> As skills herdadas do projeto Supabase foram revisadas para referenciar **Firestore/rules** em
> vez de Postgres/RLS. Se encontrar resíduo de Supabase numa skill, corrija e siga.
