# ADR-010: Doação em Tibia Coin destrava "ser dono de time" (supersede ADR-009)

## Status
Aceito · 2026-06-04 · **supersede [ADR-009](./009-no-paywall.md)** na parte de gating.

## Contexto

O ADR-009 estabeleceu que nenhuma funcionalidade seria destravada por doação (só cosmético), por
leitura conservadora da regra de fansite da CipSoft. O dono do produto, ciente do risco, decidiu
**gatear funções especiais (ex.: "ser dono de time") atrás de uma doação em Tibia Coin**.

**Risco assumido (documentado):** destravar funcionalidade essencial via doação pode ser
interpretado como cobrar por um serviço — risco ao status de fansite oficial. O dono optou por
seguir assim. Mitigações que reduzem (não eliminam) o risco: a doação é em **TC in-game** (não
dinheiro real), **sem gateway de pagamento**, **voluntária** e **confirmada manualmente**.

## Decisão

1. **Funções especiais exigem doação em TC**, agrupadas num tier **Apoiador**. Perks do tier:
   - **Ser dono de time** (criar/operar um time). Sem doação, não cria time.
   - **Mais filas ativas / múltiplas quests ao mesmo tempo** — limite de ofertas `status=open`
     por time é dirigido por config (ex.: `none = 0`, `active = 5`). Não-apoiador não mantém fila
     aberta; apoiador mantém várias.
   - Cliente final continua **100% grátis** (browse + inscrição na fila nunca exigem doação).
2. **Moeda: Tibia Coin**, transferida in-game para um personagem dedicado da plataforma. **Sem**
   dinheiro real, **sem** gateway. Personagem e valores em `src/config/donation.ts`.
3. **Confirmação manual:** o usuário declara a doação; um **admin confirma** após receber o TC
   in-game. Só então o tier é ativado (`supporter=active`) e o time pode ir ao ar.
4. **Capacidades por config** (`CAPS[supporter]`): `canOwnTeam`, `maxActiveOfferings`. Hoje 2
   níveis (`none`/`active`); extensível para **tiers** (mais TC = mais filas) sem refator — basta
   adicionar níveis no config.
5. **Sem reembolso automático / sem cobrança recorrente forçada.** Doação de apoio que habilita o
   tier enquanto a plataforma existir (modelo simples; revisável).

## Modelo (resumo; detalhe em 02-data-model)

- `users/{uid}.supporter`: `"none" | "pending" | "active"` (+ `confirmedAt`).
- Coleção `donations/{id}`: `uid`, `purpose` (`team_owner`), `tcAmount`, `status`
  (`pending|confirmed|rejected`), `requestedAt`, `confirmedAt`, `confirmedByUid`.
- **Gate:** criar time exige `supporter !== "none"`; o time nasce `approved=false` e só vai ao ar
  quando o admin confirma a doação (`supporter=active`) **e** aprova o time.
- **Admin:** definido por `ADMIN_UIDS` (env, server-only). Ações de confirmar doação / aprovar time
  são guardadas por `isAdmin`.

## Consequências

**Positivas**
- Sustenta a plataforma (apoio em TC) e cria um tier de "dono" comprometido.
- Sem dinheiro real → fora do escopo financeiro/fiscal; mais simples que gateway.

**Negativas / risco**
- **Risco de compliance de fansite** (acima) — assumido pelo dono.
- Confirmação manual dá trabalho operacional ao admin.
- Atrito no onboarding de time (espera pela confirmação).

## Notas
- Reverter para o modelo do ADR-009 (tudo grátis, doação cosmética) é possível removendo o gate —
  manter o código do gate isolado (`src/config/donation.ts` + checagens) facilita reverter.
- O badge **Apoiador** (cosmético) do ADR-009 continua válido e passa a refletir `supporter=active`.
