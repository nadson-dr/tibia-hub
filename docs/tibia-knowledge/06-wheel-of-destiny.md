# 06 — Wheel of Destiny

Sistema de **perks de promoção** introduzido em 2023, expandido em 2024-2026. Cada vocação tem sua própria roda com perks únicos.

## Estrutura

- **4 domínios** por vocação (corresponde a especialidades temáticas).
- **9 slatures (slices)** por domínio = **36 slices total**.
- Cada slice tem perks de **Dedication**, **Conviction** e **Revelation**.

## Tipos de Perk

### Dedication Perks

Bônus **graduais e pequenos** em stats base:
- Hit Points
- Mana
- Capacity
- **Mitigation** (redução de dano)

Por **Promotion Point** investido:
- HP: +0.5 hp/ponto
- Mana: variável por voc
- Mitigation: **+0.075% por ponto** [community, atualizado 2026]
- Cap: +0.5 cap/ponto

### Conviction Perks

Bônus **médios** que afetam **spells específicos** ou habilidades passivas:
- Aumentam dano de **uma spell específica** (+%)
- Aumentam range de spell
- Habilitam **vocation passives** (ex: Sorcerer "Combat Mastery", Druid "Nature's Blessing")
- Resistências elementais (+5% de proteção a um elemento)

### Revelation Perks

Bônus de **alto impacto**:
- **Stage 1, 2, 3** progressivos.
- Cada stage adiciona **bônus a dano e cura via spells/runes/attacks**.
- Stages **stackeam** se vier de slices diferentes.
- Algumas Revelations habilitam **mecânicas únicas** (Knight Avatar of Steel, Sorcerer Avatar of Storm, etc).

---

## Promotion Points

- Ganhos **por level acima de 50** (1 ponto a cada level pós-50, aprox).
- **Capacidade máxima**: ~600+ points em chars de level 800+.
- Investe num slice, ele se "ativa" — pode redistribuir trocando pontos (gasta gold).

## Domínios por vocação (resumo)

### Knight
- Combat Mastery
- Battle Healer
- Avatar of Steel
- Executioner's Throw

### Paladin
- Divine Grenade
- Avatar of Light
- Ballistic Mastery
- Salvation

### Sorcerer
- Beam Mastery
- Strike Mastery
- Avatar of Storm
- Cleansing Flame

### Druid
- Nature's Embrace
- Twin Burst
- Avatar of Nature
- Sanctuary

### Monk (post-2025)
- Harmony Channeling
- Virtue Mastery
- Avatar of Spirit
- Inner Peace

> Nomes exatos e perks específicos: consultar Wheel of Destiny no TibiaWiki por vocação — CipSoft revisa balanceamento e quebra docs derivados.

---

## Mecânicas-chave

### Soulpoint requirements para spells de Wheel

Algumas Revelations consomem **soul points** ao usar (ex: Avatar of Steel custa 100 soul).

### Cooldowns

Spells de Wheel têm **cooldown longo** (10-30 min reais), mas dão burst gigante.

### Recalibração

- Recoloca pontos custa **gold** progressivo (mais pontos = mais caro).
- Pode trocar de domínio inteiro num único reset.

---

## Implementação no fansite

### `/tools/wheel-planner`

Inputs:
- Vocação.
- Level (deriva pontos máximos).
- Foco: PvP / PvE / Hunt eficiência.

Output:
- Build sugerida (slices a priorizar).
- Pontos totais necessários.
- Comparativo dano sem vs com Wheel.

Banner: "buildings são estimativas; testar in-game e ajustar". Linkar com guia oficial da vocação.

### Integração com TibiaData

API atual **NÃO expõe** wheel investido por char. Só dá pra mostrar planner abstrato + permitir o user salvar build (no localStorage por agora).

---

## Fonte
- TibiaWiki — Wheel_of_Destiny, Wheel_of_Destiny/Conviction_Perks, /Dedication_Perks, /Revelation_Perks
- tibia.com — Game Guide / Characters
- TibiaRoute / TibiaBuddy — guias por vocação
