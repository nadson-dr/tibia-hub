# 09 — Economia

## Moedas

### Gold Pieces (GP)

- Moeda interna. **1 KK = 1.000 gold = 1.000.000 gp**.
- Cap em carry: **inventário compactado** via:
  - 100 gp = 1 platinum coin
  - 100 platinum = 1 crystal coin
  - 1 KK = 100 crystal coins
- Acima disso vai pro **balance** automaticamente (gold no banco).

### Tibia Coins (TC)

- Moeda **premium**. Comprada com dinheiro real na loja oficial.
- **Cross-world**: única "item" que transcende mundos numa mesma conta.
- Usada em:
  - Tibia Store (mounts, outfits, addons, XP boost, etc).
  - **Market** (trade com outros players).
  - **Char transfer** entre mundos (250 TC).
  - **Name change** (250 TC).
  - **Imbuements** (substituto premium pra alguns reagentes).

### Tournament Coins (TocC)

- Moeda de temporadas de torneio (event window).
- Não transferível pro server normal.

### Gold Tokens

- Moeda quest-related — ganha completando objetivos.
- Trocável por items específicos em NPC.

---

## Tibia Store vs Market

| Categoria | Tibia Store (CipSoft) | Market (player-to-player) |
|---|---|---|
| **Mounts/outfits** | TC direto | (raros, só via TC trade) |
| **XP boost 1h** | 30 TC | TC trade |
| **Charm Expansion** | 450 TC (unlock permanente) | — |
| **Equipment** | algumas peças únicas | maioria |
| **Reagents pra imbuement** | alguns "astral source", etc | maioria |

### Market

- Acessível em depots.
- Trade book de **buy / sell offers** por item.
- **Comissão** do market: 1% sobre cada venda fechada (sai do vendedor).

---

## Câmbio TC ↔ GOLD

Câmbio flutua por mundo e por janela temporal. Janeiro-Junho 2026 typical range:

| Mundo | TC → KK (typical) |
|---|---:|
| Antica | ~ 50k-55k gp por 1 TC |
| Premia | ~ 48k-52k |
| Secura | ~ 50k-55k |
| Pacembra | ~ 45k-50k |
| Servers BR (Talera, etc) | ~ 45k-50k |

> Atualizações em tempo real: **TibiaMarket**, **TibiaTrade**, **TibiaPrices**, **Intibia Market Prices**.

### Strategies (community)

- **Comprar TC quando KK cai** (price-arb intra-server).
- **Cross-world arbitrage**: comprar TC barato num mundo, vender caro em outro (TC é cross, sua moeda real, mas o **gold trade** é por mundo).

---

## Loot Value (NPC vs Market)

Cada item droppado tem 2 referências:
1. **NPC sell price** (fixo, oficial).
2. **Market price** (flutuante, por mundo).

### Quando vender pra NPC vs Market

Regra geral:
- **NPC** se: item de "junk loot" (low value, high weight) — exemplo: black pearls em pre-endgame.
- **Market** se: rare/component (eg. imbuement reagent) — preço de market é 2-10× NPC.

### Loot Analyzer in-game

- Mostra **gold value baseado em NPC** ou **market**.
- Loot total da hora = soma dos values.
- Útil pra mensurar XP/loot por hora.

---

## Hunting Profitability

Variáveis:

| Variável | Cálculo |
|---|---|
| **Loot Per Hour (LPH)** | (loot da sessão) / horas |
| **Supplies Per Hour (SPH)** | (supplies da sessão) / horas |
| **Waste Per Hour** | == SPH |
| **Profit Per Hour (PPH)** | LPH − SPH |
| **XP/h** | (xp ganho) / horas |
| **Gold per XP** | PPH / XPH (eficiência) |
| **Sustain** | quanto tempo pode hunter sem sair (potions in cap) |

### Benchmark hunts (2026, level 400+, sample)

| Hunt | XP/h | PPH (community) |
|---|---:|---:|
| Cobra Bastion 4-man | ~ 8M | ~ 1-2M |
| Falcons Bastion 4-man | ~ 12M | ~ 1.5-3M |
| Soul War Path | ~ 18M | ~ 3-5M (boss days) |
| Primal Ordeal hunting | ~ 14M | ~ 2-4M |
| Inquisition demons | ~ 5M | ~ 0.5-1M |

> Estimativas comunitárias; varia por XP boost, double XP events, mundo.

---

## Implementação no fansite

### `/tools/hunt-profit`

Já planejado. Inputs:
- Cole Hunting Session Analyser **OU**
- Preencha manualmente XP ganho, loot, supplies.

Output:
- XP/h, gold/h, supplies/h.
- Tempo equivalente em stamina.
- Eficiência gold/XP.

### `/tools/market-price` (futuro)

Inputs: item slug, mundo.
Output: preço médio NPC, preço médio market, gráfico de tendência.

Sourcing:
- **TibiaData não tem market endpoint nativo**.
- Opção 1: scrape **TibiaMarket** (parceria, atribuição clara).
- Opção 2: self-input pela comunidade (semelhante boss timers).

### `/tools/loot-split`

Já definido em [`03-party-and-hunt.md`](./03-party-and-hunt.md#party-hunt-analyser-in-game).

---

## Fonte
- TibiaWiki — Tibia_Coins, Loot_Statistics
- tibia.com — Tibia Store
- TibiaPrices, TibiaMarket, TibiaTrade, Intibia
