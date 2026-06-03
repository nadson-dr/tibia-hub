# ADR-003: Fila por vocação com prioridade de redo

## Status
Aceito · 2026-05-31

## Contexto

Cada anúncio tem N slots (tipicamente 5) e cada slot tem **vocação fixa** (1 EK, 1 ED, 3 livres ou conforme template). Se a fila fosse única ("FIFO simples"), o décimo EK na fila bloquearia o quinto ED — irrealista, porque o time só precisa de 1 EK no time.

Além disso, quando uma run não completa (cliente morre, sem drop, etc.) os chars **não-DONE** precisam de prioridade pra próxima execução da mesma quest — é o que o time chama de "REDO".

## Decisão

**Cada anúncio mantém 5 filas independentes** — uma por vocação. Dentro de cada fila:

1. Chars marcados como **redo-priority** sempre primeiro (resultado de uma run anterior incompleta).
2. Demais chars em ordem de inscrição (FIFO).

Critério de prioridade quando há redo:
```sql
ORDER BY redo_priority DESC NULLS LAST, signed_up_at ASC
```

A app sugere composição combinando o "topo de cada fila" — ou seja, o primeiro EK, primeiro RP, primeiro ED, etc.

## Consequências

**Positivas**
- Cliente sabe exatamente sua posição na fila da SUA vocação (não numa fila global irreal).
- Redo é semanticamente claro — quem ficou pra trás avança quando a quest abrir de novo.
- Algoritmo de sugestão fica trivial: `for each vocation, pick queue[0]`.

**Negativas**
- "Posição na fila" precisa ser exibida com contexto ("você é 1º de ED, mas time fecha quando bater todas as 5 vocações").
- Redo carregado entre anúncios: se cliente foi REDO numa run, app precisa criar signup automático no próximo anúncio da mesma quest.

## Implementação esperada

```sql
-- signup table
redo_priority    boolean default false
redo_reason      text
previous_run_id  uuid references run_executions(id)

-- ao marcar REDO numa RunSlotResult:
--   1) UPDATE signup SET status = 'pending_redo'
--   2) Trigger cria novo signup no próximo announcement aberto da mesma offering
--      com redo_priority = true, copiando dados do signup original
```

## Alternativas consideradas

- **Fila única global por anúncio**: rejeitado (ver contexto).
- **Cliente escolhe slot ao se inscrever**: complexidade desnecessária — vocação do char já define o slot.
- **Redo manual (admin decide)**: gera fricção desnecessária; trigger automático é mais previsível.
