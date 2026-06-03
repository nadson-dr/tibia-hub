# 11 — Fontes e Guardrails

Este arquivo define **o que pode ser publicado**, **com que confiança** e **onde verificar antes**. Toda calculadora, texto público, e agent/skill deste projeto segue essas regras.

## Hierarquia de fontes

### Tier 1 — Canônico (CipSoft)
- **tibia.com** — Game Guides, News, Status páginas oficiais.
- Patch notes / news entries da CipSoft (via API ou page scrape).
- **Confiança máxima.** Pode ser citado sem ressalvas.

### Tier 2 — Comunitário consensus, well-maintained
- **TibiaWiki (Fandom)** — `tibia.fandom.com/wiki/*`. Não é oficial mas comunidade mantém com rigor; CipSoft NPCs citam wiki em entrevistas.
- **TibiaData** — fonte derivada do tibia.com, sincronizada.
- **Tier 1+2 fansites**: TibiaBosses, TibiaStatistic, GuildStats — datasets longitudinais confiáveis.

### Tier 3 — Comunitário individual
- **Calculadoras e blogs**: TibiaPal, TibiaBuddy, TibiaVault, TibiaPedia, Exevo Pan, Intibia, TibiaMonk, TibialLoot, calculattor.com.
- **YouTube guides**, OTLand threads.
- Boas referências, mas valores numéricos devem ser **cross-checked** com Tier 1 ou Tier 2 antes de publicar.

### Tier 4 — Anedotal
- Posts de fórum, discord screenshots, vídeos sem fonte.
- Aceitável como "tendência" mas nunca como número absoluto.

## Quando publicar com confiança

| Tipo de info | Mínimo de fontes |
|---|---|
| Fórmula matemática (XP, dano, ML) | 1× Tier 1/2 confirmado |
| Drop rate / loot value | 2× Tier 2/3 concordantes |
| Mecânica de quest | 1× Tier 2 + 1× Tier 3 (preferível com vídeo recente) |
| Patch / mudança | 1× Tier 1 (patch notes) |
| Boss timer / spawn | Tier 2 longitudinal (TibiaStatistic) + self-report |
| Equipment stats | 1× Tier 1 ou Tier 2 |
| Preços de market | TC tracker em real-time (sem cache > 1h pra preço) |
| Tier 3 fansite mechanic | Verificar com Tier 1/2 antes de citar como verdade |

## "Não publicar" — guardrails firmes

### 1. **Nunca afirmar exploit / cheat / bot strategy**
- Não escrever "use macro X pra farmar Y". CipSoft baneia.
- Não documentar **mecânicas explorativas conhecidas** (ex: bugs antigos).
- Fansite deve **promover gameplay legítimo**.

### 2. **Nunca recomendar RMT fora da loja oficial**
- Não citar **playerauctions, g2g, leilões privados** como "compre TC barato lá".
- Pode listar **trackers de preço** (TibiaMarket, TibiaTrade) como informativos.
- Foco: trade in-game via Market é seguro; trade externo é proibição da CipSoft.

### 3. **Não inferir cooldown/spawn pessoal por outro player**
- Privacidade: não exibir tempo de kill por user sem opt-in.
- Boss timers do fansite são **agregados de self-report**; nunca scrape de char individual.

### 4. **Nunca afirmar números sem fonte**
- Toda fórmula, valor, drop rate em UI pública deve linkar `docs/tibia-knowledge/*.md` + fonte upstream.
- Se incerto: dizer **"estimativa baseada em comunidade [data]"** explicitamente.

### 5. **Nunca personificar a CipSoft**
- Não responder "como CipSoft pretende em X update". Marcar como **especulação comunitária**.

### 6. **Não publicar informação que viola TOS de fontes**
- Não fazer **scraping bulk** de Fandom (eles bloqueiam).
- Não revender API gratuita comunitária como paga.

## "Verificar antes de publicar" — checklist

Antes de mergear qualquer feature que cita números do jogo:

- [ ] Fórmula confirmada em pelo menos 1 fonte Tier 1/2.
- [ ] Versão do jogo / data de revisão visível no componente.
- [ ] Link "ver fórmula / ver fonte" expandível na UI.
- [ ] Se número for de Tier 3 only, marcado como `[community estimate]`.
- [ ] Se for sensível a update da CipSoft (preços, drop rates, spell formulas), **agendado pra revisão trimestral**.

## Data review schedule

Quarterly:
- **Cada Q1, Q4**: comparar fórmulas com Summer/Winter Update patch notes.
- **Q3**: revisar bosses dataset (mudanças em mecânica, novos bosses).

Quando CipSoft anuncia balance change (newsticker via TibiaData), criar issue automatic via cron pra revisar arquivos relevantes.

## Disclaimers obrigatórios na UI

Adicionar em cada calculadora e tool:
> "Cálculos baseados em fórmulas comunitárias (TibiaWiki, atualizado em [data]). Tibia é © CipSoft GmbH. Este é um fansite não-oficial."

Footer global:
> "Tibia ® é uma marca registrada da CipSoft GmbH. Este site é uma iniciativa comunitária e não tem afiliação oficial."

## Política de updates

- **Newsticker da CipSoft** monitorado via TibiaData a cada 5min em produção.
- **Anúncio de update** dispara webhook → cria issue automática "revisar knowledge base pra update X".
- Após update aplicado, **suite de testes** de calculadora roda comparando com calculadoras de referência (TibiaPal, GuildStats) — divergência > 5% = bloqueia release.

## Agents/Skills devem seguir:

Toda informação que um agent ou skill afirma sobre Tibia precisa:
1. **Citar arquivo** desta knowledge base (`docs/tibia-knowledge/XX.md#secao`).
2. Se a info **não está** na knowledge base, agent deve:
   - Pesquisar fontes Tier 1/2 via WebSearch/WebFetch.
   - **Propor adicionar** ao knowledge base antes de afirmar.
3. **Nunca alucinar números**. Se incerto, dizer "não tenho confirmação, sugiro verificar em [TibiaWiki link]".
4. **Nunca aconselhar** real-money trade fora da loja oficial.
5. **Nunca recomendar** bot / cheat / exploit.
6. Sempre **datar** afirmações que dependem de updates ("válido a partir do Summer Update 2025").

---

## Fontes deste projeto (autorizadas)

### Reading allowed
- tibia.com (qualquer subpath)
- api.tibiadata.com (rate-limited)
- guildstats.eu (cite quando usar)
- TibiaWiki (cite quando usar)
- TibiaStatistic, TibiaBosses (cite quando usar)
- TibiaBuddy, TibiaVault, TibiaPedia (cite quando usar)

### Writing forbidden (compliance)
- Não criar dataset derivado de scrape massivo de Fandom (bloqueio anti-bot).
- Não revender dados da TibiaData API.
- Sempre atribuir CipSoft GmbH como detentora da IP.
