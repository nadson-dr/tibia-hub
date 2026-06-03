# ADR-007: WhatsApp como canal principal de comunicação

## Status
Aceito · 2026-05-31

## Contexto

Hoje o BESTEAM coordena tudo via:
- **Instagram DM** pra captação inicial
- **WhatsApp** pra fechar pedido + grupo da run

Cliente não vai usar app de chat dedicado; jogador médio de Tibia já vive no WhatsApp. Substituir WhatsApp por chat in-app seria construir uma feature pesada que não terá adoção.

## Decisão

**WhatsApp é canal externo de comunicação. O sistema facilita o uso, não substitui.**

### Tipos de integração

| Funcionalidade | Como fizemos | Custo |
|---|---|---|
| Botão "Conversar com cliente X" | Link `wa.me/{phone}?text={mensagem}` abre WA Web/app com texto pré-preenchido | R$ 0 |
| Botão "Conversar com membro do time" | Mesmo padrão | R$ 0 |
| Criar grupo da run | App lista os números + nome sugerido pro admin colar manualmente no WhatsApp Web | R$ 0 (admin gasta ~10s) |
| Notificação "sua posição mudou" | Email via Resend (default) + opcionalmente WhatsApp Cloud API | R$ 0 / ~R$ 0,02 por msg |

### Por que não criar grupo automaticamente

O WhatsApp **não tem API pública pra criar grupos** com participantes pré-selecionados. As únicas opções seriam:

- **WhatsApp Business Cloud API**: cobra ~R$ 0,02-0,12 por conversa, exige conta business verificada (3-7 dias), templates aprovados pela Meta.
- **Solução não-oficial (Baileys, etc.)**: viola ToS — risco de ban do número.

**Decisão pragmática:** a app entrega o que dá (números formatados, nome sugerido) e o admin gasta 10s no celular pra criar o grupo. Ganho marginal de automação não compensa o custo.

## Implementação atual

```typescript
// src/components/mock/whatsapp-link.tsx
const digits = phone.replace(/\D/g, '');
const text = message ? `&text=${encodeURIComponent(message)}` : '';
const href = `https://wa.me/${digits}?${text}`.replace(/\?$/, '');
```

Usado em:
- Lista de membros (`/admin/team`)
- Lista de signups no detalhe do anúncio
- Detalhe individual de cliente no slot da sugestão
- Pré-visualização do grupo (`<details>` no detalhe do anúncio)

## Quando reconsiderar

Migrar pra **WhatsApp Cloud API** se:
- Volume > 100 runs/mês — custo viraria R$ 50/mês mas economizaria horas
- Equipe quiser dashboard de mensagens (read receipts, etc.)
- Cliente reclamar de não receber notificações automáticas

## Consequências

**Positivas**
- Zero custo de mensageria pra MVP.
- Funciona com o WhatsApp pessoal do admin/cliente — sem onboarding extra.
- Compatível com WhatsApp Business comum (não a API).

**Negativas**
- Não dá pra rastrear se mensagem foi lida/respondida.
- Cria grupo é manual (mas tolerável).
- Cliente que não usa WhatsApp fica sem canal — corner case.

## Alternativas consideradas

- **Chat in-app**: muito esforço de UI, baixa adoção esperada.
- **Telegram bot**: minoria dos jogadores brasileiros de Tibia usa Telegram.
- **Discord como canal principal**: bom pra time, mas cliente médio quer responder no celular sem precisar abrir Discord.
