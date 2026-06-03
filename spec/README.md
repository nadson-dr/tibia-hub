# Spec — Tibia Hub

Esta pasta é a **fonte de verdade** do projeto. Todo código, agent e decisão de produto
deve ser rastreável até um destes documentos. Se a realidade divergir da spec, ou o código
muda ou a spec é atualizada por um ADR — nunca ficam em silêncio divergindo.

> **Regra de ouro do projeto:** Tibia Hub é um **fansite**. Pela política da CipSoft, um
> fansite **não pode cobrar** por nenhuma funcionalidade. Toda feature é gratuita para todos.
> Veja [`06-constraints.md`](./06-constraints.md).

## Mapa da spec

| # | Documento | O que define |
|---|-----------|--------------|
| 00 | [overview](./00-overview.md) | Visão, personas, problema, goals/non-goals |
| 01 | [architecture](./01-architecture.md) | Stack, princípios de simplicidade, fronteira client/server, deploy |
| 02 | [data-model](./02-data-model.md) | Coleções Firestore, security rules, índices |
| 03 | [design-system](./03-design-system.md) | Paleta **Royal Parchment**, tokens, tipografia, componentes base |
| 04 | [mvp-serviceiros](./04-mvp-serviceiros.md) | Escopo do MVP (substituir o form do Besteam), telas e fluxos |
| 05 | [roadmap](./05-roadmap.md) | Fases de entrega, da Fase 0 (deploy) ao multi-ferramenta |
| 06 | [constraints](./06-constraints.md) | Regra CipSoft, doação TC cosmética, dados mínimos/LGPD |
| 07 | [agents-workflow](./07-agents-workflow.md) | Orquestrador + workers, contrato de paralelismo |
| 08 | [conventions](./08-conventions.md) | Organização de código, naming, `Result<T,E>`, commits |

### ADRs

Decisões de arquitetura registradas em [`adr/`](./adr/). ADRs novas (Firebase, no-paywall)
e migradas do projeto anterior (fila por vocação, carries, TC, validação híbrida, comms).

## Como usar

- **Implementando uma feature?** Leia `00`, `04` e `02`, depois o `03` para a UI.
- **É um agent?** Seu briefing (`07`) aponta para a seção exata que você deve seguir.
- **Mudou uma decisão estrutural?** Escreva um ADR em `adr/` e atualize o documento afetado.
