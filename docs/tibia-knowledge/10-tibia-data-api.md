# 10 — TibiaData API v4

API **comunitária** que faz scraping/parsing de tibia.com e expõe JSON. **Não é** API oficial CipSoft, mas é a fonte mais estável que temos.

- Base URL: `https://api.tibiadata.com/v4`
- Edge (dev): `https://dev.tibiadata.com`
- Swagger: `https://docs.tibiadata.com/`
- Repo: GitHub `tibiadata/tibiadata-api-go`

**Versão atual (jun/2026)**: v4.8.0.

## Política de uso

- **Sem auth** (request livres).
- Sem rate limit declarado, mas **respeite cache** (24h pra char é razoável; 5min pra news ticker).
- **Sempre adicione `User-Agent`** identificando seu projeto. Recomendo: `tibia-quest-platform/1.0 (+https://tibiaquest.app)`.
- Cache: o projeto **já usa Next 16 `fetch({ next: { revalidate: 60*60*24 } })`** em `src/lib/tibiadata/index.ts` pra char. Replicar padrão pros outros endpoints.

---

## Endpoints

### Characters

```
GET /v4/character/{name}
```

Response (relevante):
```json
{
  "character": {
    "character": {
      "name": "X",
      "level": 850,
      "vocation": "Elite Knight",
      "world": "Antica",
      "sex": "male",
      "title": "...",
      "guild": { "name": "...", "rank": "..." },
      "last_login": "2026-06-01T12:34:00Z",
      "married_to": "...",
      "houses": [{ "name": "...", "town": "..." }]
    },
    "achievements": [...],
    "deaths": [...],
    "account_information": { "loyalty_title": "...", "created": "...", "position": "..." },
    "other_characters": [{ "name": "...", "world": "...", "main": false }]
  },
  "information": {
    "api": { "version": 4, "release": "v4.8.0" },
    "timestamp": "..."
  }
}
```

Casos de uso no fansite:
- **Signup do cliente** (`/g/[slug]/q/[code]/new`): fetch level + vocação + mundo. Validar contra `min_level` da quest.
- **Perfil de char** (`/me/characters`): mostrar info pro user.

### Worlds

```
GET /v4/worlds
GET /v4/world/{name}
```

`/worlds` retorna lista de todos com online count. `/world/{name}` traz detalhes (pvp_type, battleye, location, online_count, online_players[]).

Caso de uso: **dropdown de mundos** no signup, listagem por região.

### Guilds

```
GET /v4/guild/{name}
GET /v4/guilds/{world}
```

Caso de uso: futuro recurso "lista de guilds" + "perfil de guild" no fansite. Atual: só usado pra autocomplete em char info.

### Highscores

```
GET /v4/highscores/{world}/{category}/{vocation}/{page}
```

Categories: `experience`, `axe_fighting`, `club_fighting`, `distance_fighting`, `fishing`, `fist_fighting`, `magic_level`, `shielding`, `sword_fighting`, `loyalty_points`, `achievements`, `boss_points`, `charm_points`, `drome_score`, `goshnars_taint`.

Vocations: `all`, `knights`, `paladins`, `sorcerers`, `druids`, `monks`.

Caso de uso: tela de top players por mundo + filtros.

### Houses

```
GET /v4/house/{world}/{house_id}
GET /v4/houses/{world}/{town}
```

Caso de uso: futuro "casa do dia/mês" pra newsletter ou estatística.

### Creatures

```
GET /v4/creature/{race}
GET /v4/creatures
```

`{race}` é o slug do creature (ex: `dragons`, `demons`, `cobras`). Inclui boosted creature do dia.

Response inclui HP, XP, immunities, abilities, drops, behavior_summary.

Caso de uso:
- **Bestiary tracker** mostra info da creature.
- **Charm planner** consulta resists pra sugerir charm.
- **Hunt finder** (futuro) usa drops pra estimar profit.

### Boostable Bosses

```
GET /v4/boostablebosses
```

Response:
```json
{
  "boostable_bosses": {
    "boosted": { "image_url": "...", "name": "X", "race": "x" },
    "boostable_boss_list": [...]
  }
}
```

Caso de uso: banner "Boss boosted hoje" na home + filtros em `/bosses`.

### Spells

```
GET /v4/spells
GET /v4/spell/{spell_id}
```

`{spell_id}` é slug (ex: `exevomasvis`). Retorna formula, mana cost, level req, vocation.

Caso de uso:
- **Calculadora de dano**: importar coeficientes via API em vez de hardcode (anti-drift).
- Lista de spells por vocação.

### Kill Statistics

```
GET /v4/killstatistics/{world}
```

Response: array com kills_per_day/week + deaths_per_day/week de cada criatura no mundo.

Caso de uso:
- Estimar **abundância de reagentes** (mais kills de Demons num mundo = mais Demon Horns no market).
- Hunt finder pode usar pra estimar concorrência.

### News

```
GET /v4/news/latest                    -- 90 dias
GET /v4/news/archive
GET /v4/news/archive/{days}
GET /v4/news/id/{news_id}
GET /v4/news/newsticker
```

Caso de uso:
- **News widget** na home (top 5 latest).
- Tracking de **server saves / maintenance** via newsticker.

### Fansites

```
GET /v4/fansites
```

Lista de fansites oficiais reconhecidos pela CipSoft. Útil pra mostrar "we are a partner of X".

---

## Recomendações de implementação

### Wrappers em `src/lib/tibiadata/`

Já temos `index.ts` com `fetchCharacter`. Adicionar:

```
fetchCharacter(name)             ✅ existe
fetchWorld(name)
fetchWorldsList()
fetchGuild(name)
fetchHighscores(world, cat, voc, page)
fetchCreature(race)
fetchBoostableBosses()
fetchSpell(id)
fetchKillStatistics(world)
fetchNewsLatest()
```

Cada um:
- Retorna `Result<T, "not_found" | "network" | "invalid_response">` (mesmo padrão de `fetchCharacter`).
- `next: { revalidate: TTL }` apropriado por tipo (ver tabela abaixo).
- `User-Agent` configurável via env.

### TTL recomendado por endpoint

| Endpoint | Revalidate | Justificativa |
|---|---:|---|
| `character/{name}` | 1h | char muda devagar (level, last_login) |
| `worlds`, `world/{name}` | 5 min | online count atualiza rápido |
| `guild/{name}` | 6h | member list muda devagar |
| `highscores` | 1h | atualizam end-of-day |
| `creature/{race}` | 24h | estático, só muda em update |
| `boostablebosses` | 1h | muda diariamente às 10h CET |
| `spell/{id}`, `spells` | 24h | estático |
| `killstatistics/{world}` | 6h | atualizam 1×/dia |
| `news/*` | 5 min | breaking |

### Error handling

- Status 404 → não-existência (renderizar "char não encontrado").
- Status 5xx → fallback: ler cache stale + banner "dados podem estar desatualizados".
- Status >>30s timeout → considerar tibiadata-api degradado, usar fallback cache.

### Monitoramento

Hook em produção:
- Log 5xx em logflare/sentry.
- Health check: ping `/v4/worlds` (cheap) a cada 5 min, alert se 3 falhas seguidas.

---

## Limitações conhecidas

1. **Não expõe**: market data, char inventory, char wheel investido, char bestiary progress, char charms ativos.
2. **Latência**: alguns endpoints (highscores, news) demoram 1-3s na cold cache do servidor da TibiaData.
3. **Cross-world data** (Tibia Coins balance) **não existe** — TC é por conta, não exposto.
4. **Atualizações de CipSoft podem quebrar parsing** temporariamente — followar o repo no GitHub.

---

## Fonte
- docs.tibiadata.com (swagger oficial)
- github.com/tibiadata/tibiadata-api-go
- Existing `src/lib/tibiadata/index.ts`
