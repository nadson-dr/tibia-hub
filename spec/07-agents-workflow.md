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
| **tibia-qa** | **Sempre ao finalizar:** valida ponta a ponta (unit + integração + E2E em navegador real, ambas personas); reporta bugs | `tests/` + scripts efêmeros (não toca produto) | sonnet |
| **tibia-fixer** | Resolve tudo que o QA achar — bugs in-scope **e** fora de escopo; triá e re-testa | onde o bug estiver | sonnet |
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
  3. integra: build, conecta o form à action
  4. tibia-qa → testa unit+integração+E2E (cliente e dono) e reporta
  5. se houver bug → tibia-fixer corrige → tibia-qa re-testa → aprovado
```

## Loop de QA e correção (obrigatório ao finalizar)

Nenhuma tarefa é considerada pronta sem passar pelo QA:

1. **`tibia-qa`** roda as três camadas — **unit** (vitest), **integração** (server actions + queries
   Firestore reais, atento a índice faltando e `catch` que engole erro) e **qualidade/E2E**
   (Playwright em navegador real, acessando a funcionalidade nas **duas personas**: cliente e dono
   de time). Entrega um relatório ✅/⚠️/❌ com bugs, severidade, causa raiz e evidências.
2. Se reprovar ou listar bugs, **`tibia-fixer`** resolve **tudo** — inclusive itens **fora do
   escopo** da tarefa (corrige os pequenos/seguros; documenta como follow-up os grandes/arriscados).
3. O orquestrador **re-roda o `tibia-qa`** na área afetada até aprovado ou só restarem follow-ups.

> Automação: o gatilho é o passo 6–7 do protocolo do orquestrador acima. Um hook de `Stop` rodando
> `pnpm test`/`pnpm build` pode ser adicionado depois (via skill `update-config`) como rede extra,
> mas o E2E com navegador é responsabilidade do `tibia-qa`.

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
