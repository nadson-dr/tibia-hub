# 04 — Equipamento: imbuements, tiers, fusion

## Imbuements

Sistema de "encantamentos temporários" em equipamentos. Cada item compatível tem N **slots de imbuement** (0–3 dependendo do item). Aplicado pelo NPC **Imbuer** em cada cidade.

### Tipos de imbuement

| Categoria | Imbuement | Exemplo de bônus (Powerful) |
|---|---|---|
| **Sustain** | Vampirism (Life Leech) | +25% life leech |
| | Void (Mana Leech) | +15% mana leech |
| **Damage** | Strike (Critical Hit) | +10% crit chance, +60% crit dmg |
| **Elemental damage** | Frost / Earth / Fire / Energy / Death | +12% extra dmg do elemento |
| **Elemental protection** | Reflection (Phys) / Cloud Fabric (Energy) / etc | +10% protection |
| **Skill boost** | Swiftness (Speed) / Dwarven (Fishing) / etc | +20% speed |
| **Fighting skill** | Sword / Axe / Club / Distance / Shielding / ML | +5 skill (Powerful) |

### Tiers de imbuement

| Tier | Bônus genérico | Gold base | Duração de uso |
|---|---|---:|---:|
| Basic | +25% / +1 / +5% | 5.000 gp | 20h |
| Intricate | +40% / +2 / +10% | 25.000 gp | 20h |
| Powerful | +50% / +3 / +25% / +5 skill | 100.000 gp | 20h |

> Os números acima são padrão **Basic**: 25%, **Intricate**: 40%, **Powerful**: 50% pra leech/crit; ajustes finos por imbuement.

### Reagentes (3 por tier)

Cada imbuement tem 3 reagentes específicos. Exemplo Powerful Vampirism:
- 25 × Vampire Teeth
- 1 × Bloody Pincers
- 5 × Piece of Dead Brain

### Mecânica de aplicação

1. Vai num NPC **Imbuer**.
2. Seleciona slot, escolhe tier.
3. Tem **chance de sucesso**: Basic 100%, Intricate 90%, Powerful 70% **sem proteção**.
4. **Astral Source** (item da loja) garante 100% sucesso.
5. Se falhar **sem astral**: perde o **gold base e os reagentes**. Equipamento intacto.

### Durabilidade

- 20 horas reais **de uso**, não tempo real.
- Pode ser "rebrought" antes de zerar (recharge) por mesmo preço.
- **Pause**: clicando "stop" antes do logoff conserva.

### Imbuement Shrine (player house)

- Reduz custo em **10%**.
- Item de loja, instalável em casa.

---

## Equipment Tiers (Exaltation Forge)

Sistema de "tier up" pra itens **classificação 1–4** (a maioria do endgame).

### Bônus por tier

Cada vez que sobe tier, item ganha **% chance de ativar bônus** quando atacado/atacando:

| Tier | Chance de proc | Bônus |
|---|---:|---|
| T0 | — | Sem bônus |
| T1 | 1% | +X% defesa, +Y% leech, etc (varia por slot) |
| T2 | 2.5% | idem mais forte |
| T3 | 5% | |
| T4 | 7.5% | |
| T5 | 10% | |
| T6 | (raro endgame) | |
| T7 | (extremamente raro) | |

> Bônus depende do **slot** (helmet, armor, legs, etc) e do **tipo de item** (offensive vs defensive). Helmet costuma dar ML/skill, armor dá defesa/resist, etc.

### Custo de subir tier — Fusion clássica

Pra subir **1 → 2**: 2 itens T1 idênticos + Dust + Gold.

Tabela de custo (T1 → T2 exemplo):
| Tier | Itens | Dust (sem core) | Gold |
|---|---|---:|---:|
| 0 → 1 | 2× T0 | 25 | 10k |
| 1 → 2 | 2× T1 | 50 | 30k |
| 2 → 3 | 2× T2 | 80 | 100k |
| 3 → 4 | 2× T3 | 130 | 350k |
| 4 → 5 | 2× T4 | 180 | 1M |

> Valores comunitários 2026; podem mudar com updates.

### Probabilidade

- **Sucesso base**: 50%.
- Com **Exalted Core**: 65%.
- Em falha sem core: 100% do "item base" cai 1 tier.
- Em falha com core: 50% do item base cai 1 tier (50% fica como tá).

### Convergence Fusion (item classe 4+)

- Aceita 2 itens **do mesmo slot** mas **não idênticos**, no **mesmo tier**.
- **100% sucesso**.
- Custa **130 Dust** + gold.
- **Não dispara bônus extra** (tier sobe limpo).

### Transfer (mover tier entre items)

- Transfere o tier de um item pra outro do mesmo slot.
- Item origem **vira T0**.
- Custa: Dust + Gold + Exalted Core.

### Convergence Transfer

- Como transfer normal, mas aceita slots diferentes (com restrições).
- Custa mais Dust.

---

## Dust, Slivers, Cores

Materiais do Exaltation Forge.

### Dust

- Obtido **moendo itens** no forge (qualquer item dá dust baseado em tipo/valor).
- **Cap diário** de dust geração: ~250–300 dust/dia em endgame [community].

### Slivers

- **3 Slivers = 60 Dust** no forge.
- Material intermediário.

### Exalted Core

- **1 Exalted Core = 50 Slivers** = **1.000 Dust** (aprox.).
- Usado pra elevar sucesso de fusion pra 65%.

### Estratégias

- Pra T3: orçar **~5–10 fusions** = 250+ dust por tentativa em média.
- Pra T4+: fazer **Convergence** é financeiramente mais previsível (sem RNG).

---

## Soul Set (Soul War Quest)

Set de equipamento "top tier" (Summer 2020, ainda forte em 2026 endgame). Mínimo **level 400** pra usar.

Itens (por vocação):
- **Knight**: Soulshanks (legs), Soulful Armor (chest), Soulkeeper / Soulbeam (weapons), Pair of Soulwalkers (boots), Soulhome (shield)
- **Paladin**: Soultainer (quiver-like), Soulbiter (bow), Soulful Legs, etc
- **Sorcerer / Druid**: Soulhide, Soulshield, etc
- **Monk**: Soulkamas (specific weapon), etc — adicionado com release Monk

Obtido em chest único (1× por char) **+ drops dos bosses** do Soul War. Sistema **Goshnar's Taints** desbloqueia upgrades das peças.

Detalhes em [`07-quests-endgame.md#soul-war-quest`](./07-quests-endgame.md).

---

## Cobra Equipment (Cobra Bastion)

- **Cobra Crown** (helmet de mago) [+2 ML, +5% earth, -5% fire].
- **Cobra Hood** (alternativa).
- Acessível em **level 250+ premium**, área **Cobra Bastion** (acesso por Issavi).

---

## Falcon Equipment (Falcon Bastion)

Set "Falcon" — armadura, calça, escudo. Drop dos **Grand Master Oberon**, **Grand Canon Dominus** etc.

Acesso: **The Secret Library Quest** + level alto.

---

## Implementação no fansite

### Calculator "imbuement cost"

Inputs: imbuement + tier + slots já preenchidos + se usa Astral Source + se tem Imbuement Shrine.

Output:
- Gold total (NPC + reagentes a preço de market do mundo).
- Reagentes detalhados (qtd + preço).
- Probabilidade de sucesso (sem astral).
- TC equivalente (se aplicável).

Banner: "preços de reagentes dinâmicos via TibiaData killstatistics + market estimado". Linkar política de atualização.

### Calculator "forge fusion"

Inputs: tier inicial, tier alvo, com/sem core, valor do item base.

Output:
- Custo esperado em dust + gold + items.
- **Probabilidade de chegar no tier**: cálculo de Monte Carlo (ou árvore de probabilidades).
- Custo médio por tentativa.

UI: gráfico de distribuição (P(chegar em T4) por orçamento).

---

## Fonte
- TibiaWiki — Imbuing, Equipment_Upgrade, Equipment_Upgrade/Fusing, Soul_Set, Cobra_Bastion
- TibiaBuddy — Imbuement Guide 2026 (valores atuais)
- GuildStats — Forge Simulator (probabilidades)
- Exevo Pan — Imbuement Cost Calculator
