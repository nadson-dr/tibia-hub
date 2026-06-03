# ADR-006: Validação híbrida — TibiaData API + checklist declarativo

## Status
Aceito · 2026-05-30

## Contexto

Pra entrar numa fila, o cliente precisa atender:
- **Level mínimo** da vocação no slot
- **Vocação correta** (EK pro slot de EK, etc.)
- **Mundo (server)** — embora o sistema não force o mesmo mundo, é relevante mostrar
- **Quests precedentes** completas (ex: Feaster of Souls antes de Soul War)
- **Itens de acesso e supplies** (ex: 25 prey cards, 2 Bloody Tears, 600 stone skin amulet)

Validar **tudo** automaticamente seria ideal, mas só o que a TibiaData API expõe pode ser checado sem fricção.

## Decisão

Validação dividida em três níveis:

### Nível 1 — Automático via TibiaData API

Endpoint: `https://api.tibiadata.com/v4/character/{name}`

| Dado | Como valida |
|---|---|
| Nome do char existe | Resposta da API |
| Vocação | `character.vocation` |
| Level | `character.level` |
| Mundo | `character.world` |
| Achievements | `achievements: [...]` (se visíveis) → match com `prerequisite_quests` da offering |

### Nível 2 — Declarativo com checklist

Itens que a API não expõe ou que mudam frequentemente:
- Supplies (potions, runes, amulets)
- Bens monetários (5kk, 250 TC extra)
- Gear específico (armors, weapons)
- Quests prereq sem achievement notório

Renderizado como checkbox/input no signup. Cliente confirma antes de submeter; admin revisa antes de iniciar.

### Nível 3 — Validação manual pelo admin

Pra casos edge (cliente novato, char privado, achievements ocultos), admin pode liberar manualmente no painel.

## Cache da TibiaData

- Resposta cacheada por 24h (`next: { revalidate: 86400 }`).
- Cliente pode forçar refresh em `/me/characters`.

## Consequências

**Positivas**
- Reduz erros operacionais: cliente declarava ter Feaster, na hora não tinha → wipe.
- Cliente tem feedback imediato ("✓ Compatível").
- Provider economiza tempo de verificação.

**Negativas**
- Dependência da TibiaData (third-party, sem SLA garantido).
- Achievements podem estar ocultos no perfil — fallback declarativo necessário.
- Rate limit da API não é documentado; cachear é essencial.

## Implementação

```typescript
// src/lib/tibiadata/index.ts
export async function fetchCharacter(name: string): Promise<FetchCharacterResult> {
  const res = await fetch(
    `https://api.tibiadata.com/v4/character/${encodeURIComponent(name.trim())}`,
    { next: { revalidate: 86400 }, headers: { Accept: 'application/json' } }
  );
  // ... parse + return typed result
}
```

## Alternativas consideradas

- **Só declarativo**: muito atrito + propenso a erro humano. Rejeitado.
- **Scraping HTML do tibia.com**: violação de ToS + frágil. Rejeitado.
- **Bot Tibia conectado ao jogo**: bot oficial não tem API; bot não-oficial = ban.
