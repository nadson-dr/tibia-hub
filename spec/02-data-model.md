# 02 — Modelo de dados (Firestore)

Firestore é NoSQL orientado a documentos. Modelamos **para leitura** (denormalização leve onde a
fila precisa de queries rápidas). IDs de documento são auto-gerados salvo indicado.

## Coleções

### `users/{uid}`
Perfil do usuário (uid = Firebase Auth uid).
```ts
{
  role: "player" | "team_owner";   // vira team_owner ao criar um time
  displayName: string;
  email: string;                   // do provider de auth
  contact: {
    whatsapp?: string;             // E.164, ex. "+55119..."
    instagram?: string;            // handle sem @
  };
  createdAt: Timestamp;
}
```

#### `users/{uid}/characters/{charId}` (subcoleção)
Personagens do usuário, validados via TibiaData.
```ts
{
  name: string;
  world: string;
  vocation: "EK" | "RP" | "ED" | "MS" | "EM";   // promovidas (ver lib/tibiadata/vocation.ts)
  level: number;
  validatedAt: Timestamp;          // última confirmação na TibiaData
}
```

### `teams/{teamId}`
Time de service.
```ts
{
  slug: string;                    // único, usado em /g/[slug]
  name: string;
  ownerUid: string;                // users/{uid}
  worlds: string[];                // mundos que o time atende
  approved: boolean;               // admin aprova antes de aparecer no /service
  supporterBadge: boolean;         // cosmético — doação TC (ver 06), NUNCA destrava feature
  description?: string;
  createdAt: Timestamp;
}
```

#### `teams/{teamId}/members/{memberId}` (subcoleção)
Membros/carries do time (composição que executa as quests).
```ts
{
  characterName: string;
  vocation: "EK" | "RP" | "ED" | "MS" | "EM";
  role: "owner" | "carry";
  active: boolean;
}
```

### `offerings/{offeringId}`
Uma fila aberta: um time oferta uma quest num mundo. (Equivale ao "anúncio".)
```ts
{
  teamId: string;
  teamSlug: string;                // denorm p/ link sem segundo fetch
  quest: "soulwar" | "primal_ordeal" | "rotten_blood" | string;  // ver tibia-knowledge/07
  world: string;
  vocationSlots: Partial<Record<"EK"|"RP"|"ED"|"MS"|"EM", number>>;  // vagas por vocação
  kind: "service" | "community";   // community = formação avulsa (persona secundária)
  status: "open" | "paused" | "closed";
  createdAt: Timestamp;
}
```

### `signups/{signupId}`
Inscrição de um cliente numa fila.
```ts
{
  offeringId: string;
  teamId: string;                  // denorm p/ o dono filtrar sem join
  clientUid: string;
  characterName: string;
  vocation: "EK" | "RP" | "ED" | "MS" | "EM";
  level: number;                   // capturado da validação TibiaData
  world: string;
  contact: { whatsapp?: string; instagram?: string };
  source?: string;                 // "Twitch" | "Instagram" | "Amigos" | ... (atribuição)
  status: "waiting" | "scheduled" | "done" | "cancelled";
  queueOrder: number;              // posição; menor = mais cedo
  createdAt: Timestamp;
}
```

### Reservadas (modeladas, **não** no MVP)
- `bosses/{slug}` + `boss_appearances/{id}` — boss timers (ver skill `tibia-boss-timers`).
- `books/{slug}` — lore/books (seed migrado dos scrapers).
- `notifications/{uid}/items/{id}` — in-app realtime, ativado depois.

## Security rules (esboço — ver `firestore.rules`)

```
// Helpers
function isSignedIn() { return request.auth != null; }
function isOwner(teamId) {
  return isSignedIn()
      && get(/databases/$(database)/documents/teams/$(teamId)).data.ownerUid == request.auth.uid;
}

match /users/{uid} {
  allow read: if isSignedIn() && request.auth.uid == uid;
  allow write: if isSignedIn() && request.auth.uid == uid;
  match /characters/{charId} {
    allow read, write: if isSignedIn() && request.auth.uid == uid;
  }
}

match /teams/{teamId} {
  allow read: if resource.data.approved == true || isOwner(teamId);
  // criação/edição via servidor (Admin SDK); client não escreve direto.
  allow write: if false;
  match /members/{memberId} {
    allow read: if true;
    allow write: if false;     // via servidor
  }
}

match /offerings/{offeringId} {
  allow read: if resource.data.status == "open"
              || isOwner(resource.data.teamId);
  allow write: if false;        // via servidor
}

match /signups/{signupId} {
  allow read: if isSignedIn() &&
              (request.auth.uid == resource.data.clientUid
               || isOwner(resource.data.teamId));
  allow create, update, delete: if false;   // via servidor (valida TibiaData + queueOrder)
}
```

**Princípio:** leitura pública só do que é público (times aprovados, ofertas abertas). Toda
escrita relevante passa pelo Admin SDK no servidor — rules barram escrita direta do client onde a
lógica de negócio (validação de char, ordenação de fila, aprovação) não cabe em rules.

## Índices compostos (ver `firestore.indexes.json`)

- `signups`: `(teamId ASC, status ASC, queueOrder ASC)` — fila do dono por status.
- `signups`: `(clientUid ASC, createdAt DESC)` — "minhas inscrições".
- `offerings`: `(world ASC, status ASC, createdAt DESC)` — busca em `/service`.
- `offerings`: `(quest ASC, status ASC)` — view quest-first `/quests/[code]`.
