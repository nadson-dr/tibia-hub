# 06 — Restrições

## 🛑 Regra de ouro: sem cobrança (CipSoft)

Tibia Hub é um **fansite**. Pela política de fansites da CipSoft, um fansite **não pode cobrar
valores** por nenhuma funcionalidade prestada dentro do site.

**Consequências obrigatórias no produto:**
- **Toda feature é gratuita para todos.** Não existe tier pago, paywall, gating por pagamento,
  comissão sobre service, nem limite de volume removível por dinheiro.
- **Não há gateway de pagamento** no projeto. Nenhum fluxo cobra R$/cartão/PIX.
- O modelo freemium do projeto anterior (premium destravando `max_members`, `max_offerings`,
  boost na busca) **foi removido** e **não pode voltar**. Ver ADR de retração.

### Doação opcional (permitido, só cosmético)
- Doação **voluntária mensal** estilo "apoiador" é aceitável **desde que não destrave nenhuma
  funcionalidade essencial**.
- Doação é em **Tibia Coin (TC)**, transferida in-game para um char dedicado da plataforma —
  **não** em dinheiro real, **sem** gateway.
- Confirmação **manual**: admin confirma após receber o TC (ou trust-based).
- Contrapartida **apenas cosmética:** `teams.supporterBadge` (badge "Apoiador"), agradecimento.
  Nunca prioridade de busca, limites maiores, ou qualquer vantagem funcional.

> Se uma feature parece exigir pagamento para funcionar, **ela está modelada errada** — reabra a
> decisão. Em dúvida, a feature é grátis.

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
