# 08 — Bosses & Timers

## Categorias (Bosstiary)

Tibia tem **541 bosses** registrados (2026). Sistema de **Bosstiary** segue a lógica do Bestiary mas só pra bosses.

### Categorização

| Categoria | Cooldown típico | Kills pra unlock | Charm points |
|---|---|---:|---:|
| **Bane** | < 20h | 25 → 250 → 1.000 | 5 / 15 / 25 |
| **Archfoe** | 20h – 48h | 5 → 25 → 50 | 25 / 50 / 100 |
| **Nemesis** | > 48h ou raid-only | 1 → 3 → 5 | 50 / 100 / 250 |

### Bosstiary Boost (Boosted Boss)

- 1 boss escolhido **por dia**, server-wide (mesma lógica de boosted creature).
- Dá **× 2 loot** + **× 2 charm point progress** + spawn especial em Vengoth (Bosstiary spawn).

---

## Boss Cooldowns (mecânica pessoal)

Cada player tem um **timer pessoal** que conta a partir do **último kill** daquele boss. Mata de novo só após o cooldown.

### Boss Cooldowns Widget (in-game)

Mostra cooldown de bosses que o char já matou ao menos 1 vez (apenas Archfoes; Nemesis tem tracking separado).

### Implementação no fansite

- **NÃO temos acesso a cooldown pessoal via API**.
- Solução: **self-report** do user ("matei tal boss agora").
- Storage: `boss_kill_records (user_id, boss_slug, killed_at)` + helper que mostra "próximo respawn possível".

---

## World Bosses (spawn server-wide)

Bosses que aparecem **uma vez por servidor** num intervalo. Não tem cooldown pessoal, mas **só 1 player/grupo mata por janela**.

### Mecânica de spawn

CipSoft não publica algoritmo exato. Modelos comunitários convergem em:

```
chanceDeSpawnDoDia = base se diasDesdeUltimo ≥ minIntervalo
                     base cresce linearmente com diasDesdeUltimo após minIntervalo
                     teto 100% atingido em maxIntervalo
```

### Bosses-chave (referência)

| Boss | min intervalo | max intervalo | Drop principal |
|---|---|---|---|
| **Ferumbras** | ~ 15 dias | ~ 175 dias | Ferumbras Hat, gold, addons |
| **Ghazbaran** | ~ 7 dias | ~ 50 dias | Ghazbaran Helmet, set |
| **Orshabaal** | ~ 7 dias | ~ 50 dias | Orshabaal mantle |
| **Morgaroth** | ~ 7 dias | ~ 50 dias | Morgaroth Heart |
| **Zulazza the Corruptor** | ~ 7 dias | ~ 30 dias | Snake set pieces |
| **The Pale Count** | ~ 14 dias | ~ 90 dias | Outfit + rare |
| **Midnight Panther** | rare hunt | — | Panther Head |

> Valores são **estimativas comunitárias** baseadas em logs históricos. Verificar com tracker (TibiaStatistic, GuildStats) **por mundo**, porque spawn é por mundo individualmente.

---

## Raid Bosses

Spawn precedido por **mensagem global** anunciando a chegada (ex: "Vampires are gathering near Drefia"). Mensagem dá uma janela de minutos pro time chegar.

### Raids notáveis

- **Demodras** (dragão em Tiquanda) — diário/semi-diário.
- **The Old Widow** (Liberty Bay) — semanal.
- **Yeti** (Folda) — semanal.
- **Tarbaz** (orc/troll raids).
- **Hellgorak**.

---

## Quest Bosses

- Spawn por **lever** ou **trigger** (mecânica de quest), sem timer global.
- Cooldown **pessoal** padrão 20h (Archfoe) ou 48h+ (Nemesis).
- Exemplos: bosses do Soul War, Primal Ordeal, Feaster of Souls.

---

## Boss Reports (community-sourced timer)

Modelo do fansite:

### Schema `boss_appearances`

Tabela já desenhada em `docs/PIVOT_FANSITE.md`:
- `boss_id` (fk catálogo `bosses`)
- `world` (Antica, Premia, etc)
- `sighted_at` (timestamp)
- `reporter_id` (auth.user)
- `status` (`reported` | `confirmed` | `disputed` | `killed`)

### Cálculo de "next respawn window"

```
nextRespawnStart = lastSightedAt + boss.respawn_min
nextRespawnEnd   = lastSightedAt + boss.respawn_max
```

UI:
- "Última aparição: 3 dias atrás (3 dias min, X dias max)".
- "Próxima janela: hoje 14h → próxima semana".
- Realtime via Supabase channel `boss_appearances:world=X`.

---

## Boostable Bosses Endpoint

TibiaData expõe **boss boosted do dia**:

```
GET https://api.tibiadata.com/v4/boostablebosses
```

Response inclui:
- `boosted` (boss boosted hoje)
- `boostable_boss_list` (todos os boostable bosses)

**Uso no fansite**: mostrar "Boosted Boss hoje: X" no hub principal e no `/bosses`. Atualiza diariamente às **10:00 server time** (CET).

---

## Boss Health & XP (referência rápida)

| Boss | HP | XP | Loot médio (community) |
|---|---:|---:|---|
| Ferumbras | ~ 35.000 HP | 8.500 | 200k-1M gold + raros |
| Ghazbaran | ~ 60.000 HP | 6.000 | 100k-500k + set raro |
| Orshabaal | ~ 40.000 HP | 5.500 | 100k-300k |
| Morgaroth | ~ 50.000 HP | 7.500 | 150k-400k |
| Goshnar's Spite | ~ 1.000.000+ HP | 1.5M | Soul Set chest |
| Bakragore | ~ 1.000.000+ HP | 1.2M | Primal items |
| The Pale Worm | ~ 4.000.000+ HP | 5M+ | Poltergeist outfit |

> Pra valores exatos, consultar `/v4/creature/{race}` do TibiaData.

---

## Implementação no fansite

### `/bosses`

- Lista bosses por **categoria** + **mundo** (filtro).
- Mostra "boosted boss hoje" no topo.
- Cada boss: "última aparição" + "próxima janela" + botão "vi agora" (logado).

### `/bosses/[slug]`

- Detalhes: HP, XP, drops, mecânica.
- Timeline de aparições por mundo.
- Form "vi agora" (validação anti-spam: rate limit por user + por boss).
- Moderation: admin pode marcar `disputed`.

### Seed inicial

Top 30 bosses em `supabase/seed_bosses.sql`:
- Ferumbras, Ghazbaran, Orshabaal, Morgaroth, Zulazza (world).
- Demodras, Yeti, Old Widow, Tarbaz (raids).
- Goshnar's bosses, Bakragore (quest).
- Big Boss / Charm-relevant: Boss Of The Bosses, Lord of the Lice, etc.

---

## Fonte
- TibiaWiki — Boss_Cooldowns, List_of_Bosses_by_Cooldown, TibiaWiki:Bosses_Spawn_Frequency
- tibia.com — Bosstiary game guide
- TibiaStatistic — Boss Tracker (predictions per world)
- GuildStats — Bosses Statistics
