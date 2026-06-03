# 03 — Party, shared XP e hunt analyzers

## Party formation

- **Convidar**: `Use` no char alvo → "Invite to party".
- Líder pode promover outro a líder.
- Sair: `Use` em si mesmo → "Leave party".

## Shared Experience

### Pré-requisitos pra ativar

- **2+ membros**.
- Todos no range de level (ver fórmula em [`01-formulas.md#shared-experience-party`](./01-formulas.md#shared-experience-party)).
- Distância máxima entre líder e qualquer membro: **30 SQM** (manhattan distance), pode estar 1 floor acima/abaixo.
- Todos precisam ter **dado dano ou cura** no monstro pra contar como ativo (anti-leech).

### Cálculo prático

Pra grupo de N membros, monstro com XP base `X`:

```
xpDistribuida = (X * vocBonus) / N
```

Multiplicador `vocBonus` baseado em **vocações distintas** no grupo:

| Vocações diferentes | vocBonus |
|---:|---:|
| 1 | 1.20 |
| 2 | 1.30 |
| 3 | 1.60 |
| 4 ou 5 | 2.00 |

> Em party com 4 vocs, cada membro recebe `(X * 2) / 4 = X / 2`. Isso significa que **uma party de 4 vocs distintas recebe metade do XP base** por jogador — bem menos que solo, porém com **lucro e segurança maiores em hunts de alto nível**.

### Sharing range calculator

Use a fórmula direta. Casos práticos:

| Char A (level) | Range válido pra char B |
|---:|---|
| 100 | 67 a 150 |
| 200 | 134 a 300 |
| 400 | 267 a 600 |
| 800 | 534 a 1200 |

> Pra "range mínimo" floor(`a * 2/3`); pra "range máximo" floor(`a * 1.5`).

---

## Loot Split em party

### Regras

- **Active Party**: configura redistribuição de loot do session.
- Loot vai pra **mochila do leader** ou **do que pega** (depende da config).
- Settlement final é manual: leader olha o **Party Hunt Analyser** e usa um **loot split calculator** (Exevo Pan, TibianLoot, etc).

### Fórmula de loot split justo

```
saldoMembroI = lootGanhoI - suppliesGastosI - cotaJustaI
cotaJustaI = (Σ lootTotal - Σ supplies) / nMembros
```

- Se `saldoMembroI > 0`: membro **paga** o excedente pro pool.
- Se `saldoMembroI < 0`: membro **recebe** do pool.
- Resultado: todos saem com o mesmo lucro líquido absoluto.

> No Tibia oficial isso é feito via **transferência manual pelo balance**. Não tem auto-split.

---

## Party Hunt Analyser (in-game)

Estrutura do output (texto raw, copy-paste):

```
Session data: From 2026-06-01, 14:00:00 to 2026-06-01, 16:00:00
Session: 02:00h
Loot Type: Market
Loot: 1,234,567
Supplies: 234,567
Balance: 1,000,000
NomeJogadorA
    Loot: 800,000
    Supplies: 100,000
    Balance: 700,000
    Damage: 12,345,678
    Healing: 1,234,567
NomeJogadorB
    Loot: 434,567
    Supplies: 134,567
    Balance: 300,000
    Damage: 8,765,432
    Healing: 234,567
```

Parser de referência: **`parse-tibia-analyser`** (npm/GitHub).

## Hunting Session Analyser (solo, in-game)

Estrutura típica:

```
Session: 01:34h
XP Gain: 1,234,567
XP/h: 789,012
Loot: 567,890
Supplies: 234,567
Balance: 333,323
Damage: 9,876,543
Damage/h: 6,287,000
Healing: 1,234,567
Healing/h: 786,000
```

Killed monsters e Looted items listados em seguida.

---

## Implementação no fansite

### `/tools/loot-split` (calculadora)

Inputs:
- Cole o output do **Party Hunt Analyser** num textarea.
- Opcional: ajustar manualmente loot/supplies por membro.

Outputs:
- Tabela "quem paga / quem recebe quanto" pra zerar saldos.
- Saldo líquido por membro depois do split.

Stack proposta:
- Parser cliente: lib `parse-tibia-analyser` (TS-friendly).
- 100% client-side (`'use client'`), sem persistir.

### `/tools/share-range`

Input: level.
Output: range mínimo e máximo de share + tabela de vocs com bônus de exp.

### `/tools/hunt-profit`

Inputs: cole Hunting Session Analyser **ou** preencha manualmente.
Output: XP/h, gold/h, supplies/h, gold consumido por XP gerada (eficiência).

---

## Edge cases que a UI precisa cobrir

1. **Party com voc mista mas 1 membro AFK** (não causou dano) — não recebe XP. Aviso "verifique se todos atacaram".
2. **Range quebrado por level up** durante hunt — share desativa silenciosamente. Calculadora deve avisar "se algum membro upar X levels, share quebra".
3. **Party com vocs duplicadas** (3 EK + 1 ED) — soma vocBonus por **vocação distinta**, não por nro de chars. 2 vocs distintas = bônus 1.30, mesmo com 4 chars.
4. **Cliente/serviceiro no marketplace**: cobrir o caso de share quebrado por subir level mid-service. Recomendação: forçar que char do cliente esteja em range do char do team **na hora do signup**, e mostrar warning se a diferença for marginal (≥ 80% do range).
