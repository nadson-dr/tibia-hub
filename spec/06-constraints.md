# 06 — Restrições

## 🛑 Regra base: sem cobrança em dinheiro real (CipSoft)

Tibia Hub é um **fansite**. Pela política de fansites da CipSoft, um fansite **não pode cobrar
valores em dinheiro real** por funcionalidade.

**Invariantes do produto (não negociáveis):**
- **Nunca há cobrança em dinheiro real.** Sem R$/cartão/PIX, sem gateway de pagamento.
- **Cliente final é sempre 100% grátis** — browse, achar time e entrar na fila nunca exigem nada.

## 💰 Doação em Tibia Coin destrava o tier "Apoiador" (ADR-010)

> ⚠️ **Decisão do dono, com risco assumido.** O ADR-009 (doação só cosmética) foi **supersepido
> pelo [ADR-010](./adr/010-supporter-tc-gating.md)**: o dono optou por **gatear funções especiais
> atrás de doação em Tibia Coin**, ciente de que destravar funcionalidade essencial pode ser
> interpretado como cobrar por serviço e arriscar o status de fansite. Mitigação: TC in-game (não
> dinheiro real), voluntário, sem gateway, confirmação manual.

- **Moeda:** Tibia Coin transferida in-game para um personagem dedicado (`src/config/donation.ts`).
- **Confirmação manual** por admin após receber o TC; só então o tier é ativado.
- **Perks do tier Apoiador** (dirigidos por config `CAPS[supporter]`):
  - `canOwnTeam` — criar/operar um time.
  - `maxActiveOfferings` — número de filas abertas simultâneas (várias quests ao mesmo tempo).
  - `supporterBadge` cosmético (badge "Apoiador").
- Extensível para **tiers** (mais TC = mais filas) adicionando níveis no config — sem refator.

> Reverter para "tudo grátis" (ADR-009) = relaxar o `CAPS` (tudo liberado no nível `none`). Manter
> o gate isolado no config + checagens facilita reverter se a regra de fansite exigir.

## Free tier (Firebase Spark)

- Ficar dentro do **Spark (gratuito)**: sem Cloud Functions que exijam Blaze no MVP, sem
  egress pago.
- Modelar leituras com economia (denormalização leve, evitar fan-out de reads caro).
- TibiaData é gratuita mas **deve** mandar `User-Agent` identificado e respeitar cache (TTL nos
  wrappers de `lib/tibiadata/`) — ver `docs/tibia-knowledge/11-sources-and-guardrails.md`.

## Dados e privacidade (LGPD)

- Coletar o **mínimo**: nome de char (público no jogo), contato (WhatsApp/Instagram), origem.
- Contato é sensível para spam → visível só para o dono do time da fila em que o cliente entrou
  (garantido por `firestore.rules`).
- Nada de scraping bulk de fontes proibidas; respeitar licenças (TibiaWiki CC-BY-SA nos books).

## Guardrails de conteúdo (do projeto)
- **No bot / no exploit / no RMT externo.** O service marketplace organiza um serviço legítimo
  in-game; não promove venda de conta/gold por dinheiro real fora das regras da CipSoft.
- Hierarquia de fontes para qualquer número de gameplay: tibia.com (canon) > TibiaWiki/TibiaData >
  fansites. Ver knowledge base.
