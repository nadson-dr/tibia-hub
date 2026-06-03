# 02 — Progressão: XP, skills, ML e treino

## XP por nível — referência rápida

Fórmula completa em [`01-formulas.md#xp-por-nível`](./01-formulas.md#xp-por-nível-curva-de-level).

Calculador de XP necessária pra alvo:
```
xpFaltando(lvlAtual, lvlAlvo) = exp(lvlAlvo) − xpAtual
```

Onde `xpAtual` é XP exata do char (não exp(lvlAtual), que é o piso do level).

## Sources de XP

- **Killing monsters** (principal): cada criatura tem XP base; modificadores aplicados em ordem (server-side):
  1. Loyalty bonus (até +5% sobre XP base, ganho jogando muito num mesmo mundo).
  2. Premium account bonus (+50% em algumas atividades).
  3. Stamina multiplier (× 1.5 / × 1.0 / × 0.5).
  4. XP boost de loja (+50% por 1h, comprado com TC).
  5. Wisdom of Solitude.
  6. Double XP events server-wide (raros, CipSoft).
  7. Bestiary multiplier de creature **boosted** (× 2.0 na criatura escolhida do dia, server-wide).

- **Boss kills** — XP única / cooldown.
- **Quests** com XP reward.
- **Hireling tasks** premium.

---

## Stamina

### Tabela de regen

| Stamina atual | Taxa offline |
|---|---|
| 0:00–39:00 | 1 min stamina por 3 min offline |
| 39:00–42:00 | 1 min stamina por 6 min offline |
| Logado online (não-resting) | 0 |
| Logado online em **resting area** com daily reward streak ≥ 4 dias | mesma taxa offline normal |

### Resting Areas

- Templos
- Depots
- Casas (próprias ou de aliados)
- Guildhalls
- Adventurers' Guild

### Faixas de XP

| Stamina (h:m) | Premium | Free |
|---|---|---|
| 42:00 → 39:01 | × 1.50 (Happy Hours) | × 1.00 |
| 39:00 → 14:01 | × 1.00 | × 1.00 |
| 14:00 → 0:00 | × 0.50 | × 0.50 |

> Detalhe: muitos jogadores **planejam hunts com 3h em "happy hours"** = 42:00 → 39:00 com +50% XP, pra maximizar lucro de XP/h em hunts caras.

### Penalidades

- **Stamina 0:** XP zerada, sem skill progression. Não para de receber loot/dano, só não evolui.
- Hunt em stamina ≤ 14h é financialmente ruim, mas é onde sobra tempo de jogo. Calculadora de "quanto vou ganhar de XP/lucro nas próximas X horas com Y stamina" é a ferramenta mais útil.

---

## Skills físicas

### Sobre o que conta

| Skill | Hit conta quando |
|---|---|
| Sword/Axe/Club/Fist | Hit numa criatura (não miss) |
| Distance | Hit sangrento conta cheio; miss conta como ~½ |
| Shielding | Damage absorvido por shield (não dodge, não block puro) |
| Fishing | Cada cast (mesmo sem pescar) |

### Skill rate fórmula

Ver [`01-formulas.md#skill-physical`](./01-formulas.md#skill-physical-sword-axe-club-fist-distance-shielding-fishing). Resumo prático:

- **Crescimento quadrático**: dobrar de skill 80 → 90 custa ~3× mais que de 70 → 80.
- **Loyalty bonus** afeta skill rate (até +5%).
- **XP boost de loja NÃO afeta skill** (engano comum).
- **Boosted creature** dá +50% skill progression nela.

---

## Magic Level (ML)

Ver `01-formulas.md#magic-level`.

### Modos de subir ML

1. **Casting spells** que custam mana.
2. **Healing** (`exura`, `exura ico`, etc) — toda mana consumida conta.
3. **Exercise wands/rods** em dummies.
4. **Offline training** em statues.

### Quanto ML afeta dano?

- ML aumenta dano/cura de **TODAS** as spells e runas. Multiplicador típico de spell de ataque: **+ 2 a + 4 dano por ML**, dependendo da spell.
- Charm cap **não escala** com ML, só com level.
- Wheel de mago tem perks que **adicionam multiplicador** ao ML.

---

## Exercise Weapons

Quase obrigatório no endgame pra subir skill **sem gastar tempo de stamina hunteando**.

| Item | Custo | Skill train | Duração base |
|---|---:|---|---:|
| Exercise Sword/Axe/Club/Wraps | 4 TC ou 1k gold/charge | Melee respectivo | 500 charges = 16min40s |
| Exercise Bow | 4 TC | Distance | 500 charges |
| Exercise Wand/Rod | 4 TC | Magic level | 500 charges |
| Lasting Exercise [version] | 7 TC | 1.800 charges (60 min) | 60 min |
| Durable Exercise [version] | 25 TC | 14.400 charges | 8 horas |

### Eficiência relativa

- **Demon Exercise Dummy** (player-owned, ⊃ Edron): +10%.
- **Ferumbras Exercise Dummy** (rare reward): +10%.
- **Monk Exercise Dummy** (post-Monk release): +10%.
- Regular dummies em cidade: padrão (sharável).

### Offline training (em statues)

- Cada char pode acumular **até 12 horas** de offline training (pool máximo).
- Pool regenera 1:1 enquanto online (1s online = 1s de offline disponível).
- Statues nas trainer rooms (varia por cidade).
- Treina **2 skills simultaneamente** (escolhidas no logout).

---

## Calculadora "quanto exp/skill posso subir em X horas"

Estrutura recomendada pra UI:
1. Input: level atual, vocação, skill atual, alvo, mundo, premium status, stamina inicial.
2. Output:
   - XP/hora estimada (com fontes externas: TibiaVault hunts, comunitário).
   - Horas até atingir alvo, considerando faixas de stamina.
   - Quanto vai gastar de exercise weapons / charges.
   - Custo total em gold + TC.

Banner obrigatório: "valores são estimativas; rendimento real varia com waste, supplies, latência e drops."

---

## Próximo: party hunt e shared exp
Veja [`03-party-and-hunt.md`](./03-party-and-hunt.md).
