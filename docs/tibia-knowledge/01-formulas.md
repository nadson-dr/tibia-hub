# 01 — Fórmulas

Arquivo central de fórmulas pras calculadoras. **Qualquer divergência entre este arquivo e código é bug.** Cada componente de calculadora deve importar a constante / função correspondente e referenciar o número da seção desta página em comentário.

## Convenções

- `lvl` = level do char.
- `n` = "X-ésimo level" (alvo).
- `s` = skill atual.
- `c` = skill base inicial (0 pra ML, 10 pra outras skills).
- Resultados em **inteiro arredondado pra baixo** salvo nota contrária.

---

## XP por nível (curva de level)

XP **acumulado** necessário pra alcançar level `x`:

```
exp(x) = (50/3) * x³ − 100 * x² + (850/3) * x − 200
```

XP **necessário** pra passar de level `n − 1` pra level `n`:

```
diff(n) = exp(n) − exp(n − 1)
        = 50 * n² − 150 * n + 200
```

**Exemplos pra validar implementação** [canon, TibiaWiki Experience_Formula]:

| Level | exp acumulado | diff pro próximo |
|---:|---:|---:|
| 2 | 100 | 100 |
| 8 | 4.200 | 2.500 |
| 50 | 1.965.700 | 122.500 |
| 100 | 16.331.300 | 485.000 |
| 200 | 131.662.700 | 1.970.000 |
| 400 | 1.053.325.400 | 7.940.000 |

> Nota: O TibiaWiki escreve a forma equivalente `(50*x³ − 300*x² + 850*x − 600) / 3`. Mesmo número, dá pra checar substituindo.

---

## Skill physical (sword, axe, club, fist, distance, shielding, fishing)

Skill avança quando o char acumula **skill points**. O contador resetar a cada level de skill alcançado.

Pontos necessários pra subir de skill `s` pra `s + 1`:

```
points(s) = round( (50/3) * a * (s + 1 − c)² + b * (s + 1 − c) )
```

Onde `c = 10` (base inicial), e `a`, `b` dependem da skill **e** da vocação. Como Tibia não publica `a` e `b` literais por par (skill × voc), na prática **a implementação tabela** o multiplicador final. A regra comunitária usável:

- **Vocação especialista** na skill (ex: Knight em sword/axe/club, Paladin em distance, mago em ML): multiplicador menor → sobe mais rápido.
- Quanto **maior `s`**, mais skill points são necessários — crescimento quadrático.

Pra calculadoras concretas, usar uma **tabela de "skill rates por vocação"** em vez de inferir os coeficientes:

| Skill | Knight | Paladin | Sorcerer / Druid | Monk |
|---|---:|---:|---:|---:|
| Sword/Axe/Club | rate 2.0 | rate 1.5 | rate 1.1 | rate 1.5 |
| Distance | rate 1.5 | rate 2.0 | rate 1.1 | rate 1.5 |
| Shielding | rate 2.0 | rate 1.5 | rate 1.1 | rate 1.5 |
| Fist | rate 1.5 | rate 1.5 | rate 1.1 | rate 2.0 |
| Fishing | 1.1 | 1.1 | 1.1 | 1.1 |
| Magic Level | rate 1.1 (knight 3.0) | (rate especial — ver seção ML) | rate especial | rate especial |

> Os "rates" acima são `vocation multiplier` aplicados na fórmula base. Na prática, **derive os números da tabela final do TibiaWiki** ou cruze com calculadoras consagradas (TibiaPal, Exevo Pan, GuildStats) antes de soltar pro usuário. Nunca chute.

---

## Magic Level

Mesma estrutura da skill, com `c = 0`. **A mana usada pra subir do ML 0 → ML 1 é 1.600 pra TODAS as vocações** [canon].

Multiplicador de mana por ML após o primeiro [canon]:

| Vocação | Multiplicador por ML |
|---|---:|
| Sorcerer | × 1.1 |
| Druid | × 1.1 |
| **Monk** | × 1.25 |
| Paladin | × 1.4 |
| Knight | × 3.0 |

Mana acumulada pra alcançar ML `n` (n ≥ 1):

```
mana(n) = 1600 * Σ (multiplicador)^(k − 1) , k de 1 até n
        = 1600 * (multiplicador^n − 1) / (multiplicador − 1)
```

(Soma de progressão geométrica, multiplicador > 1.)

Mana pra subir **de** `n` pra `n + 1`:

```
manaStep(n) = 1600 * multiplicador^n
```

**Exemplos sorcerer (mult 1.1):**
- ML 0 → 1: 1.600
- ML 1 → 2: 1.760
- ML 10 → 11: ~ 4.150
- ML 100 → 101: ~ 22.1M

**Knight é brutal** (mult 3): ML 10 → 11 já custa ~ 94.5M de mana, por isso EK quase não sobe ML.

---

## HP / Mana total no level X

HP total no level `lvl`:

```
hp(lvl) = 150  // base nível 1
         + min(lvl - 1, 7) * 5         // ganho até level 8
         + max(0, lvl - 8) * hpPorLvl  // pós-promoção por voc
```

Mana total no level `lvl`:

```
mp(lvl) = 55   // base nível 1 (varia ligeiramente, 50 sem promo)
         + min(lvl - 1, 7) * 5
         + max(0, lvl - 8) * mpPorLvl
```

Cap total no level `lvl`:

```
cap(lvl) = 410  // base nível 1
          + min(lvl - 1, 7) * 10
          + max(0, lvl - 8) * capPorLvl
```

Tabela de `hpPorLvl`, `mpPorLvl`, `capPorLvl` em [`00-fundamentals.md`](./00-fundamentals.md#ganhos-de-atributo-por-nível-após-nível-8).

> Validar com TibiaWiki `Hit_Point` / `Mana_Point` antes de pôr no calculador "quanto HP eu tenho no nível X" — pequenos drifts existem em char Rookgaard vs char Mainland.

---

## Stamina

Detalhes em [`02-progression.md#stamina`](./02-progression.md#stamina). Fórmulas-resumo:

- **Regen offline**: 1 min stamina a cada 3 min offline (até stamina ≤ 40h). Pra preencher de 39h até 42h é **6 min offline por 1 min stamina**.
- **Início da regen**: só começa após **10 min** logado off.
- **Tempo pra encher stamina** de `s` (em minutos) até 42h:

```
tempoOff(s) =
  if s ≥ 39*60:     (42*60 − s) * 6   // 6:1 nos últimos 3h
  else:             (39*60 − s) * 3 + (42*60 − 39*60) * 6
```

(Tudo em minutos.)

- **Multiplicadores de XP por faixa de stamina** (premium):
  - `s > 39h` → **× 1.5** (Happy Hours)
  - `14h ≤ s ≤ 39h` → **× 1.0** (normal)
  - `s < 14h` → **× 0.5** (penalidade)
- Free account: nunca tem 1.5; faixas normal e penalidade idênticas.

---

## Shared Experience (party)

### Faixa de level válida

Dois chars podem dar shared se:

```
2 / 3 * lvlMaior  ≤  lvlMenor  ≤  1.5 * lvlMaior
```

Equivalente, fixando o menor `m`:

```
m ≤ outro ≤ floor((m + 1) * 1.5) − 1   // limite superior
floor(m * 2/3) ≤ outro                  // limite inferior
```

Pra party com N chars, **todos** precisam estar dentro do range entre o menor e o maior. Operacionalmente: pega o menor `m` e o maior `M`. Vale shared se `M ≤ 1.5 * m`.

### Bônus por diversidade de vocação

Quando shared está ativo e a criatura dá ≥ 20 XP, o **base XP é multiplicado** por:

| Vocações distintas na party | Bônus |
|---:|---:|
| 1 | × 1.20 |
| 2 | × 1.30 |
| 3 | × 1.60 |
| 4 ou 5 | × 2.00 |

### XP final por jogador

```
xpPorPlayer = (xpBaseDoMonstro * bonusVoc) / nMembrosCompartilhando
            * multStamina * multPersonal
```

`multPersonal` inclui XP boost (store), Wisdom of Solitude, double XP events, etc.

### Distância

Todos os membros precisam estar a **≤ 30 SQM** do líder, podendo estar 1 floor acima ou abaixo.

---

## Dano corpo a corpo (melee)

Fórmula base estimada por engenharia reversa pela comunidade [community]:

```
maxDmgBase = (skill + attackBonus) * weaponAtk * 0.085  + lvl / 5
```

- `skill` = sword/axe/club/fist conforme arma
- `weaponAtk` = atk da arma + atk de imbuement
- `attackBonus` = bônus de atk (raros, items específicos)
- Resultado é o **máximo**; dano efetivo é uniforme entre `0.5 * max` e `max` aproximadamente, com mais variação em offensive stance e menos em defensive.

## Dano distance (paladin, ranged)

```
maxDmgBase = (distance + attackBonus) * weaponAtk * 0.09  + lvl / 5
```

Distância adiciona modificador por **range exato** (precisão diminui com tiles), e Royal Paladin tem perks (Wheel + Royal Bonus) que somam multiplicadores.

## Defesa física (melee defense)

```
defense = (sqrt(2 * S) + 1) * D
```

- `S` = shielding (se com shield) ou skill da arma (se sem shield)
- `D` = defense da shield (+ modificador da arma) ou defense da arma sem shield

Modificadores: stance defensiva = × 1.4 aprox, balanced = × 1.0, offensive = × 0.6. **Charm "Dodge" e revelation perks alteram esse cálculo** — qualquer fórmula final num calculator precisa banner "estimativa, não inclui perks de wheel" se não tiver tratamento dedicado.

---

## Dano de spells

Cada spell tem fórmula no formato (consultável em `/v4/spell/{id}` do TibiaData):

```
dano = mlMult * ML + lvlMult * lvl + offset   ± variancia
```

Exemplo: Exori Mas Vis (Sorcerer SD rune) tem dano base aproximado:
```
dmg ≈ 2.6 * ML + 4 * lvl + 13       // valores ilustrativos
```

> **NUNCA hardcode multiplicadores de spell sem cruzar com `/v4/spell/{id}`** — CipSoft revisa periodicamente e quebra calculadora.

---

## Loot Value

```
lootGoldValue = Σ (itemNpcPrice * dropChance * lootRateBonus)
```

- `lootRateBonus` = 1.0 base; eventos como Double Loot multiplicam.
- O **Loot Analyzer in-game** usa preço NPC ou preço médio de market do mundo.
- Pra cálculo de **profit por hora**:

```
profitPorHora = (lootGanho - suppliesGastos) / horasHunt
```

Supplies inclui: potions, ammo (paladin), runes, used food.

---

## Imbuement cost (resumo)

Cada imbuement (tier × tipo) tem custo de:
- **Gold base** (paga ao NPC).
- **3 reagentes** específicos (compráveis em market, ou farmados).

Tiers:

| Tier | Bônus | Gold base | Duração |
|---|---|---:|---:|
| Basic | +25% / +1% / etc | 5.000 gp | 20h |
| Intricate | +40% / +2% / etc | 25.000 gp | 20h |
| Powerful | +50% / +3% / etc | 100.000 gp | 20h |

> Os valores acima são **referência base** [community 2026]; os exatos por imbuement variam. Pra produção, use a tabela completa em [`04-equipment.md#imbuements`](./04-equipment.md#imbuements).

Pra um imbuement Powerful comum: gasto total típico **150k–300k gold** em market price atual (gold + reagents).

---

## Equipment Tier / Fusion

Detalhe em [`04-equipment.md`](./04-equipment.md). Fórmulas-chave:

- **Fusion**: 50% sucesso base, 65% com Exalted Core. Falha rebaixa 1 tier (50% se usou core, 100% se não).
- **Convergence Fusion**: 100% sucesso. Custo: **130 Dust + gold**. Não dispara "bônus tiers" extras.
- **3 Slivers** = 60 Dust (no Exaltation Forge).
- **1 Exalted Core** = 50 Slivers ≈ 1.000 Dust.

---

## Exercise Weapons (training)

- Cada **charge de exercise weapon de melee** ≈ **7.2 hits "regulares"**.
- Cada **charge de bow exercise** ≈ **2.16 hits sangrentos** ou **4.32 hits errados** equivalentes.
- Cada **charge de wand/rod exercise** ≈ **600 mana queimada** (pra ML).
- 1 exercise weapon = **500 charges** → dura **16:40 min** num dummy normal.
- **Demon / Ferumbras / Monk Dummy** → +10% eficiência, single-user.

---

## Charm damage

Major charms tier 1/2/3 procam a 5% / 10% / 11% por hit.

Dano por proc:
```
dmg = min(0.05 * maxHpAlvo, 2 * lvl)
```

> Cap dobra em algumas charms via Wheel (ver `06-wheel-of-destiny.md`).

---

Continua em [`02-progression.md`](./02-progression.md).
