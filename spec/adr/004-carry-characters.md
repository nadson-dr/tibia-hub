# ADR-004: Carregadores como substituição estratégica, não preenchimento de vaga

## Status
Aceito · 2026-05-31 (revisado após feedback do stakeholder)

## Contexto

Carregadores são **personagens do próprio time** (do owner, admins ou membros) usados em runs onde queremos **mais força bruta** — tipicamente puxar boss, segurar dano em fases críticas.

A primeira versão modelou carry como "preenche slot vazio". Stakeholder corrigiu: **carry não é fallback de falta de cliente**, é substituição estratégica de um cliente por um char muito mais forte.

Exemplo real: na Rotten Blood, é praxe ter um RP carregador (~lv 1300) puxando o boss enquanto os outros atacam. O cliente RP (~lv 800) é substituído pelo carry e volta com prioridade redo na próxima run.

## Decisão

1. **CarryCharacter** é entidade própria, vinculada à equipe.
   - Vocação, level (alto), dono (membro do time), notas, cooldown próprio.

2. **Slot na sugestão** mantém um cliente como base; carry aparece como **opção de substituição**.
   - Estado 1: `client_signup_id` preenchido (slot tem cliente)
   - Estado 2: `client_signup_id` + `substituted_by_carry_id` (carry assume, cliente vai pra próxima)
   - Estado 3: ambos null (vaga vazia — aguarda mais inscritos)

3. **Configuração de carry obrigatório** fica em `QuestOffering.carries_needed`:
   - Ex: Rotten = `{ RP: 1 }` significa "essa quest tipicamente tem 1 carry RP"
   - App pré-aplica carry elegível automaticamente em sugestões
   - Admin pode desfazer manualmente

4. **Cooldown** se aplica também a carregadores — char (cliente ou carry) que participou de run fica bloqueado pelo `cooldown_hours` da quest.

5. **Carry não preenche vaga vazia** sem cliente disponível — se a vocação obrigatória não tem nenhum cliente inscrito, app aguarda inscrições.

## Consequências

**Positivas**
- Modelo bate com a operação real do BESTEAM.
- Cliente substituído **não perde a vez** — vai pro topo da próxima run.
- Time pode pré-configurar quais quests precisam de carry de praxe.

**Negativas**
- Lógica do redo no signup substituído precisa ser explícita (gera signup automático pro próximo anúncio).
- Admin pode esquecer de configurar `carries_needed` — sugestões viriam sem carry. Mitigação: tela de "Quests oferecidas" mostra config visualmente; wizard exibe campo.

## Alternativas consideradas

- **Carry preenche vaga vazia**: rejeitado pelo stakeholder.
- **Sem cooldown pra carry**: rejeitado — carry humano também tem fadiga, e seria estranho usar mesmo carry em 5 runs no dia sem descanso.
- **Carry decidido na hora pelo membro**: gera bagunça; pré-cadastro permite o algoritmo considerar.
