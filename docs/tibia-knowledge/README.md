# Tibia Knowledge Base

Base de conhecimento canônica sobre o jogo **Tibia** (CipSoft, 1997+), usada pelas calculadoras, agents e skills do projeto. Construída a partir de fontes públicas (TibiaWiki, tibia.com, TibiaData, calculadoras comunitárias) e validada para uso em produção do fansite.

> ⚠️ **Sobre veracidade**: Tibia recebe updates frequentes (Winter/Summer Updates, ajustes pontuais). Qualquer número aqui é "verdadeiro até a data de revisão". Sempre que uma calculadora ou texto público derivar dum valor crítico (preço, fórmula, requisito de quest), o componente deve referenciar o arquivo desta pasta como fonte e expor a data de revisão na UI. Veja `11-sources-and-guardrails.md`.

## Última revisão
2026-06-01 (revisão 2 — added lore + books)

## Índice

| # | Arquivo | Tópico |
|---|---------|--------|
| 00 | [`00-fundamentals.md`](./00-fundamentals.md) | Vocações, atributos, ganhos por nível, soul points |
| 01 | [`01-formulas.md`](./01-formulas.md) | **Todas as fórmulas em um lugar** — XP, ML, skill, dano, defesa |
| 02 | [`02-progression.md`](./02-progression.md) | Curva de XP, treino, exercise weapons, dummies, offline training |
| 03 | [`03-party-and-hunt.md`](./03-party-and-hunt.md) | Shared exp, party, hunt analyzer, loot split |
| 04 | [`04-equipment.md`](./04-equipment.md) | Imbuements, tiers, fusion, convergence, exalted core, dust |
| 05 | [`05-bestiary-charms.md`](./05-bestiary-charms.md) | Bestiary stages, charms major/minor, charm cap |
| 06 | [`06-wheel-of-destiny.md`](./06-wheel-of-destiny.md) | Dedication, Conviction, Revelation perks |
| 07 | [`07-quests-endgame.md`](./07-quests-endgame.md) | Soul War, Primal Ordeal (Rotten Blood), Feaster of Souls, Cobra, Falcon |
| 08 | [`08-bosses.md`](./08-bosses.md) | Bane/Archfoe/Nemesis, cooldowns, world bosses, raids |
| 09 | [`09-economy.md`](./09-economy.md) | Tibia Coins, market, NPC vs market, loot value |
| 10 | [`10-tibia-data-api.md`](./10-tibia-data-api.md) | API v4 endpoints (única fonte oficial-ish de dados) |
| 11 | [`11-sources-and-guardrails.md`](./11-sources-and-guardrails.md) | Fontes canônicas, o que verificar antes de publicar, no-go zones |
| 12 | [`12-lore.md`](./12-lore.md) | Cosmologia, deuses, history, raças, geografia |
| 13 | [`13-books.md`](./13-books.md) | Catálogo de ~135+ books in-game + Genesis (Tibian History) + metodologia de fetch |
| 14 | [`14-bonelord-language-469.md`](./14-bonelord-language-469.md) | **A linguagem 469** — análise criptanalítica completa, cipher key Stradivarius, NPCs, frases decoded, clusters |

## Como esta base é consumida

- **Calculadoras** (`/tools/*`): cada cálculo importa fórmulas de `01-formulas.md`. UI mostra "ver fórmula" expansível com link pra fonte.
- **Boss timers** (`/bosses/*`): metadata (categoria, respawn) vem do seed; UI explica mecânica via `08-bosses.md`.
- **Service marketplace**: validação de quest e level mínimo cita `07-quests-endgame.md`. Wizard de pedido herda pré-requisitos daqui.
- **Agent `tibia-expert`** (em `.claude/agents/`): este é o seu manual. Antes de afirmar algo, ele cita arquivo + linha desta base.
- **Skills `tibia-*`** (em `.claude/skills/`): cada skill ancora num arquivo aqui e segue os guardrails do `11-sources-and-guardrails.md`.

## Convenções

- Toda fórmula matemática usa **notação inline** (`x³`, não `x^3`) e define cada variável.
- Valores numéricos vêm sempre acompanhados da **versão / janela do update** quando aplicável.
- Quando algo é "consenso de comunidade" sem fonte oficial, marcamos com `[community]`.
- Quando algo veio da API oficial (`tibia.com` / TibiaData), marcamos com `[canon]`.
- Variáveis em fórmulas estão em **minúsculas** (`x`, `n`, `lvl`); constantes em UPPERCASE.
