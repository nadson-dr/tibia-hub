# ADR-005: Moeda única Tibia Coin (sem dinheiro real)

## Status
Aceito · 2026-05-31

## Contexto

Service de quest no Tibia é **historicamente pago em TC** — Tibia Coin é a moeda real do ecossistema P2P. Ninguém quer pagar com R$ ou USD pra dois motivos:

1. **Risco regulatório:** intermediar dinheiro real entre jogadores levanta KYC/PCI; manter TC fica fora de escopo financeiro tradicional.
2. **Fluxo natural:** drops, itens, services — tudo já é TC. Misturar com real seria fricção desnecessária.

## Decisão

**Toda transação no sistema é em Tibia Coin.** Nada de moeda real (BRL/USD/EUR) em nenhum lugar.

Modelos de pagamento suportados (ambos em TC):
- `tc_100`: cliente paga **100% do service fee em TC**, mantém o drop quando sair.
- `split_50_50`: cliente **não paga antecipado**, time fica com o drop, vende, e repassa **50% do valor da venda em TC** pro cliente.

`service_fee_tc` é configuração de cada `QuestOffering`. Pode ser ajustada por anúncio se o time quiser (ex: promoção).

## Consequências

**Positivas**
- Sem integração com gateway de pagamento (Pix, Stripe, etc.) — escopo dramaticamente menor.
- Conformidade automática (não somos custódia de moeda real).
- Cliente não precisa cadastrar cartão / chave Pix.
- Tempo de venda dos drops vira métrica natural (TC é fungível, tempo é dimensão real).

**Negativas**
- Quem precisa de "comprovante fiscal" não tem — toda venda é off-chain do sistema bancário.
- Time precisa registrar manualmente cada venda de drop (`/admin/financial/sales/new`) — não tem automação.
- Conversão de TC pra real é responsabilidade do time (ferramentas externas).

## Implicações no modelo de dados

| Campo | Como fica |
|---|---|
| `QuestOffering.service_fee_tc` | inteiro (TC) — sem `currency` field |
| `Signup.payment_choice` | enum `tc_100 | split_50_50` |
| `DropSale.sold_for_tc` | inteiro (TC) |
| `DropSale.client_share_tc` | inteiro (TC) — 0 se modelo era `tc_100`, ~50% se era `split_50_50` |
| `ServiceFeePayment.paid_tc` | inteiro (TC) |

**Removido:** colunas `currency`, `price_cents` (modelo antigo).

## Alternativas consideradas

- **Dual currency (TC + BRL/USD)**: rejeitado — duplica complexidade pra cobrir caso minoritário.
- **Permitir negociado caso a caso**: já temos `negotiated` no `payment_model` antigo; ficou no domínio mas como exceção, não regra.
