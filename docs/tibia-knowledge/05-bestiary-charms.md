# 05 — Bestiary e Charms

## Bestiary

Sistema "kill-and-learn" — cada criatura entra na **Bestiary** quando o char acumula kills suficientes. Desbloqueia info da criatura **e dá Charm Points**.

### Difficulty tiers e kills necessários

| Difficulty | Stage 1 | Stage 2 | Stage 3 (full) | Charm Points |
|---|---:|---:|---:|---:|
| **Harmless** | 5 | 10 | 25 | 1 |
| **Trivial** | 25 | 50 | 250 | 5 |
| **Easy** | 100 | 250 | 1.000 | 15 |
| **Medium** | 250 | 500 | 2.500 | 25 |
| **Hard** | 500 | 1.000 | 5.000 | 50 |
| **Challenging** | 1.000 | 2.000 | 10.000 | 100 |

> Sources: TibiaWiki — Bestiary/Difficulties.

### Stage unlock

- **Stage 1**: imagem da criatura, nome.
- **Stage 2**: HP, XP, raça.
- **Stage 3**: loot, immunities, abilities — full info.
- **Charm Points liberados quando completar stage 3.**

### Bestiary tracker

- Em [`/v4/creature/{race}`](./10-tibia-data-api.md) você consulta nominalmente, mas TibiaData **não expõe kill count pessoal**.
- Killstatistics tem **kill global por mundo** ([`/v4/killstatistics/{world}`](./10-tibia-data-api.md)).
- Pra "tibia bestiary tracker" no fansite, usuário precisa **uploader manual** ou ferramentas client-side (lendo do client se possível).

---

## Charms

Sistema que aplica **bônus passivo** quando o char causa dano em criaturas no charm assigned.

### Slots de charm

- **Free account**: 2 criaturas com charms ativos.
- **Premium**: 6 criaturas.
- **Charm Expansion** (loja, 450 TC): **ilimitado**.

### Major vs Minor

- **Major Charm** (1 slot por criatura): efeito de dano/leech etc.
- **Minor Charm** (1 slot por criatura, paralelo): efeitos menores (resist, etc).
- **Você pode ter 1 Major + 1 Minor** ativos por criatura simultaneamente.

### Major Charms (post-2025 update)

Sistema de **3 stages** (charm sobe gastando charm points):

| Charm | Stage 1 (5%) | Stage 2 (10%) | Stage 3 (11%) | Tipo |
|---|---:|---:|---:|---|
| Wound | 5% dmg fis | 10% | 11% | Phys |
| Enflame | | | | Fire |
| Freeze | | | | Ice |
| Poison | | | | Earth |
| Zap | | | | Energy |
| Curse | | | | Death |
| Divine Wrath | | | | Holy |
| Vampiric Embrace | | | | Life Leech |
| Voids Call | | | | Mana Leech |

### Dano por proc (Major)

```
dmg = min(0.05 * maxHpAlvo, 2 * lvl)
```

- 5% do **HP máximo** do alvo (relevante em hunts de mob baixo HP), **capado em 2 × level** do char.
- Wheel pode aumentar o cap.

### Minor Charms

Tipicamente:
- **Dodge** (% de esquiva de dano físico).
- **Carnage** (heal on kill).
- **Cleansing** (chance de remover condição negativa).
- **Hardening** (% redução de dmg físico).

### Charm Points

- Ganhos por completar entradas de bestiary (ver tabela acima).
- **Não há cap conhecido**.
- Gasto pra **comprar** charm (assign único, perde se removida) ou **upgrade de stage**.
- Cada criatura assignment com Major Charm custa **X Charm Points** (varia por charm + stage).

### Charm planner

Estratégia comum:
- **Wound** assigned em criatura de hunt **HP médio**, level alto → procs cheios no cap.
- **Vampiric Embrace** em mob HP baixo onde leech compensa.
- **Voids Call** em hunt cara de mana (mago).

UI sugerida pro fansite: "qual charm aplicar em qual criatura por hunt favorita".

---

## Implementação no fansite

### `/tools/charm-planner`

Inputs: level, vocação, criatura alvo (autocomplete via TibiaData).

Output:
- Quanto custa pra assignar full stage 3 (charm points).
- Dano esperado por proc no charm escolhido (com `min(0.05*HP, 2*lvl)`).
- DPS estimado se hits ocorrem a X / segundo.
- Alternativas (compare Wound vs Enflame com base nas resistências).

### `/tools/bestiary-progress`

Inputs: cole o output do client (formato a definir) ou JSON upload.

Output: progresso por criatura, charm points totais, ranking de criaturas faltantes por relação custo-benefício (kills × CP).

---

## Fonte
- TibiaWiki — Charms, Bestiary/Difficulties, Cyclopedia
- TibiaBuddy — Complete Charm Guide 2026
- TibiaPal — Charm Planner
