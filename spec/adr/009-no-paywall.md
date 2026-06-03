# ADR-009: Sem cobrança (retração do freemium) — doação TC cosmética

## Status
Aceito · 2026-06-03

## Contexto

O projeto anterior tinha um modelo **freemium pago** (premium destravando `max_members`,
`max_offerings`, boost na busca, métricas). Como Tibia Hub se posiciona como **fansite**, isso
**viola a política de fansites da CipSoft**: fansite não pode cobrar por funcionalidade. Cobrar =
perder o status de fansite e cair sob regras comerciais diferentes.

## Decisão

1. **Nenhuma funcionalidade é paga.** Todas as features são gratuitas para todos. Sem paywall,
   gating por pagamento, comissão, ou limite removível por dinheiro.
2. **Sem gateway de pagamento** no projeto (nada de R$/cartão/PIX/Stripe).
3. **Doação opcional**, voluntária, **só cosmética**: em **Tibia Coin** in-game, transferida para
   um char dedicado da plataforma, confirmada **manualmente** pelo admin. Contrapartida limitada a
   `teams.supporterBadge` (badge "Apoiador") + agradecimento. **Nunca** destrava função, prioridade
   de busca ou limites.

Isto retrata e supersede qualquer decisão de freemium pago do projeto anterior.

## Consequências

**Positivas**
- Conformidade com a política de fansites da CipSoft.
- Modelo de dados mais simples (sem planos, sem billing, sem gating em server actions).
- Confiança da comunidade (tudo grátis).

**Negativas**
- Sem receita direta da plataforma (só doação voluntária em TC) — aceitável: o objetivo é
  utilidade comunitária + tráfego, não lucro.
- Doação manual dá trabalho operacional (admin confere TC) — aceitável no volume esperado.

## Implicações
- Remover do modelo: `subscription_plans`, gating de `max_members`/`max_offerings` por pagamento.
- Manter só: `teams.supporterBadge: boolean` (cosmético).
- Ver [`06-constraints.md`](../06-constraints.md) — restrição permanente do projeto.
