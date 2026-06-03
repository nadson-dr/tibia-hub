# 00 — Fundamentos: vocações e atributos

## Vocações (5, desde a chegada do Monk em 2025)

| Vocação | Papel | Promoção | Especialidade |
|---|---|---|---|
| **Knight** | Tank / frontline melee | Elite Knight | Maior HP/cap, defesa, escudos |
| **Paladin** | Ranged híbrido | Royal Paladin | Distance fighting + holy + suporte de cura |
| **Sorcerer** | DPS mágico AoE | Master Sorcerer | Fire/Energy/Death — maior dano de runa |
| **Druid** | Healer / utilitário mágico | Elder Druid | Ice/Earth, Heal Friend, suporte essencial |
| **Monk** | Híbrido fist + magia espiritual | Exalted Monk | Sistema **Harmony** + **Serenity** + 3 virtudes |

## Ganhos de atributo por nível (após nível 8)

Vocação | HP/nível | Mana/nível | Capacidade/nível
---|---:|---:|---:
Knight | 15 | 5 | 25
Paladin | 10 | 15 | 20
Druid | 5 | 30 | 10
Sorcerer | 5 | 30 | 10
Monk | 10 | 10 | 25

- Até level 8, todos os atributos sobem na mesma taxa fixa (5 HP + 5 mana + 10 cap por nível) [canon].
- **Sem vocação** (rookgaard): ganhos planos pré-promoção.
- Ganhos de cap são em **oz** (unidade de peso). 1 cap = 1 oz.

## Soul Points

- Capa padrão: **100** em conta gratuita / sem promoção.
- Promovido: **200**.
- Usado pra castar runas (`exevo gran mas vis`, etc).
- Regenera **1 soul a cada 15 segundos** quando você ganha XP de criaturas com loot > 0.

## Stamina

Detalhe completo em [`02-progression.md`](./02-progression.md#stamina). Resumo:
- Máximo: **42 horas**.
- Penalidade: abaixo de **14 horas**, XP cai **pela metade**.
- Happy hours (premium): primeiras 3 horas (42h → 39h) dão **+50% XP**.

## Magic Level

Sobe usando mana (toda mana consumida vai pro "skill points" de ML). Custo por ML varia por vocação. Detalhe em [`01-formulas.md#magic-level`](./01-formulas.md#magic-level).

## Skills físicas (8 trainable)

| Skill | Sobe com |
|---|---|
| Magic Level | Mana consumida |
| Fist Fighting | Hits desarmado / wraps |
| Club Fighting | Hits com clava |
| Sword Fighting | Hits com espada |
| Axe Fighting | Hits com machado |
| Distance Fighting | Hits com arco/besta/throwing |
| Shielding | Hits **recebidos enquanto usando shield** |
| Fishing | Tentativas de pescar |

Base inicial pós-promoção: **10** pra skills físicas, **0** pra magic level [canon].

## Promoção

- Custa **20.000 gp** no templo da cidade home.
- Requer level **20** e premium account.
- Dobra a regeneração de HP/mana, +1 soul cap, e desbloqueia spells de vocação avançada.

## Mudanças relevantes 2026 [community / tibiabuddy]

- **Sorcerer e Druid não usam mais Energy Ring**. Substituto: **Mana Shield Potion** (consumível com efeito de magic shield).
- **Knight** agora pode beber **Strong Mana Potion** (antes só Mana Potion / Great).
- **Paladin** agora pode beber **Great Mana Potion**.
- **Monk** liberada como 5ª vocação. Mecânica nova: Harmony, Serenity, virtudes.

## Monk: harmony e serenity (resumo)

- **Harmony**: gerada por casts de spells ofensivos de Monk. Máximo **5** stacks.
- Consumida pra liberar spells mais fortes (sinergia tipo "combo").
- **3 virtudes** alternáveis (passive bonuses); jogador escolhe 1 ativa.
- **Serenity state**: alcançado quando isolado (≤5 tiles adjacentes com criatura). Dobra efeito de virtude + aumenta dano.

## Referências
- tibia.com — Game Guide / Characters (canônico)
- TibiaWiki — Vocations, Hit Point, Mana Point, Soul Point
- TibiaBuddy — Vocation Balance Guide 2026 (mudanças recentes)
