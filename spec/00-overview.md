# 00 — Visão geral

## O que é

**Tibia Hub** é um **fansite de Tibia** com múltiplas ferramentas para a comunidade. A primeira
ferramenta — e o motor inicial de tráfego — é um **marketplace de service de quests**: um lugar
onde times de service (Soul War, Primal Ordeal / Rotten Blood, etc.) organizam suas filas e os
clientes se inscrevem com o personagem validado automaticamente.

O fansite cresce em ferramentas (boss timers, calculadoras, lore/books) sem refatoração, porque
a arquitetura nasce modular. Mas o **foco inicial é resolver bem um problema só**: facilitar a
vida dos **serviceiros**.

## O problema (foco do MVP)

Times de service hoje coletam fila por **Google Forms + WhatsApp/Instagram**. Exemplo real: o
[form do Besteam](https://docs.google.com/forms/d/e/1FAIpQLSd55XGFnH7Oc_SyqTqtd1-BjGUBvHWeBqjWeiS7-8IEwfZe2Q/viewform)
tem 6 campos (quest, servidor, vocação, level, contato, origem) **sem validação** — gera typos
de mundo, level inflado, vocação errada, e a fila vira uma planilha bagunçada.

**Tibia Hub resolve isso** validando o personagem na hora (mundo/vocação/level via TibiaData API)
e organizando a fila por vocação num painel, sem aumentar a fricção de quem se inscreve.

## Personas

1. **Serviceiro (dono/admin de time)** — *persona primária*. Quer uma fila organizada por
   vocação, sem fraude, com contato rápido (WhatsApp) e visão de quem está esperando. Modelo de
   referência: times como Besteam, Julio Bezerra.
2. **Cliente** — jogador que quer contratar uma quest. Quer achar um time confiável e se
   inscrever rápido com o char certo. **Sempre 100% grátis.**
3. **Jogador da comunidade** — *persona secundária*. Usa as ferramentas do fansite (boss timers,
   calculadoras, lore) e eventualmente cria uma **formação avulsa** (quest com amigos / aberta),
   sem precisar ser um time formal. Cabe na arquitetura desde o início, mas não é o foco do MVP.

## Goals

- Substituir o fluxo Google Form + WhatsApp por algo **melhor e mais confiável**, sem mais fricção.
- Validação automática de personagem (anti-typo, anti-fraude) via TibiaData.
- Painel de fila por vocação para o dono do time.
- Base de fansite multi-ferramenta pronta para crescer (boss timers, calculadoras, lore).
- **Publicável na Vercel rapidamente** e operável no **free tier do Firebase**.

## Non-goals (agora)

- **Cobrar por qualquer coisa** — proibido (regra CipSoft, ver [`06`](./06-constraints.md)).
- Gateway de pagamento, comissão, assinatura.
- Notificações push/email no MVP (arquitetura reserva espaço, mas não implementa).
- Chat in-app — contato acontece via WhatsApp (`wa.me`, sem API paga).
- Boss timers e calculadoras **completos** no MVP (entram em fases seguintes).
- Mobile app nativo (é web responsivo).

## Métrica de sucesso do MVP

Um time real (ex. Besteam) consegue **abrir uma fila** e receber inscrições validadas pelo Tibia
Hub em vez do Google Form, e prefere o painel à planilha. Cliente consegue se inscrever em
< 1 minuto.
