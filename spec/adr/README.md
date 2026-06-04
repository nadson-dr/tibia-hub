# ADRs — Architecture Decision Records

Decisões estruturais. Não se apaga ADR antigo: escreve-se um novo que o supersede.

| ADR | Decisão | Status |
|-----|---------|--------|
| [001](./001-stack-firebase.md) | Stack Next.js + **Firebase** | Aceito (supersede stack Supabase) |
| [003](./003-queue-by-vocation.md) | Fila por vocação | Aceito (migrado) |
| [004](./004-carry-characters.md) | Personagens carry / composição | Aceito (migrado) |
| [005](./005-tibia-coin-only.md) | Moeda única Tibia Coin | Aceito (migrado) |
| [006](./006-validation-hybrid.md) | Validação híbrida (TibiaData + checklist) | Aceito (migrado) |
| [007](./007-whatsapp-comms.md) | Comunicação via WhatsApp | Aceito (migrado) — no MVP usar `wa.me`, sem API paga |
| [008](./008-auth-firebase.md) | Auth Firebase (Google + email/senha) | Aceito (supersede auth Supabase) |
| [009](./009-no-paywall.md) | Sem cobrança; doação TC cosmética | ⚠️ Supersepido por 010 (na parte de gating) |
| [010](./010-supporter-tc-gating.md) | Doação em TC destrava tier Apoiador (ser dono de time, mais filas) | Aceito (risco de fansite assumido pelo dono) |

> O modelo de domínio canônico vive em [`../02-data-model.md`](../02-data-model.md) (Firestore),
> não num ADR — ele evolui com o projeto. ADRs registram *decisões*, não o schema vivo.
>
> **Nota sobre os ADRs migrados (003–007):** foram escritos no contexto Supabase/relacional.
> As *decisões de produto* seguem válidas (fila por vocação, carries, TC, validação híbrida,
> WhatsApp); onde citam tabelas/colunas SQL, a implementação real segue o modelo Firestore do
> doc 02. Em conflito, vale o doc 02 + ADR-001/009.
