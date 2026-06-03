# 04 — MVP: facilitar a vida dos serviceiros

**Objetivo:** um time real abre uma fila no Tibia Hub e recebe inscrições **validadas**, em vez
do Google Form. Cliente se inscreve em < 1 min. Superar o form do Besteam em confiabilidade
**sem** aumentar a fricção.

## Baseline a superar (form do Besteam)

6 campos sem validação: quest, servidor (texto livre), vocação, level (texto livre), contato,
origem. Nossa vantagem: **validar mundo/vocação/level via TibiaData** e organizar a fila num
painel. Risco a evitar: pedir dados demais e afugentar o cliente.

## Telas e rotas

### Público (sem login)
- **`/`** — Hub. Cards das ferramentas: **Service** (ativo) + **Boss Timers** / **Calculadoras**
  como "Em breve". Comunica o que o site é.
- **`/service`** — Lista de times aprovados + ofertas abertas. Filtro por **mundo** e por
  **quest**. Times com `supporterBadge` mostram badge cosmético (sem prioridade funcional).
- **`/quests/[code]`** — View quest-first: todos os times que ofertam aquela quest (UX de quem
  sabe a quest mas não o time).
- **`/g/[slug]`** — Página pública do time: descrição, mundos, ofertas abertas, composição.

### Autenticado
- **`/login`**, **`/signup`** — Firebase Auth (Google + email/senha). `/signup` pergunta o tipo:
  **sou cliente** ou **tenho um time**.
- **`/me`** — perfil + contato. **`/me/characters`** — adicionar/validar personagens (TibiaData),
  ver "minhas inscrições".
- **`/g/[slug]/a/[offeringId]/signup`** — **wizard de inscrição** (detalhe abaixo).
- **`/p/[slug]`** — **dashboard do dono**: fila por vocação, mover status, contato WhatsApp.
  - `/p/[slug]/offerings` — abrir/pausar/fechar filas.
  - `/p/[slug]/team` — membros/carries.
  - `/p/[slug]/settings` — dados do time, mundos.

## Fluxos

### A. Onboarding do time
1. `/signup` → "tenho um time" → cria `users` (role `team_owner`) + `teams` (`approved=false`) +
   `members` (owner) + mundos.
2. Time entra em estado **pendente**; admin aprova (ver fase 2) → aparece em `/service` e `/g/[slug]`.
3. Owner abre a primeira **offering** (quest + mundo + vagas por vocação).

### B. Cliente se inscreve
1. Acha o time em `/service` ou `/quests/[code]` → `/g/[slug]` → escolhe a oferta → **wizard**.
2. **Wizard** (`/g/[slug]/a/[offeringId]/signup`):
   - **Passo 1 — personagem:** digita o nome → servidor valida na **TibiaData**
     (`lib/tibiadata/fetchCharacter`). Confirma **mundo == oferta**, lê **vocação** (promovida) e
     **level**. Erros tratados: char não existe, vocação não-promovida, mundo divergente.
   - **Passo 2 — contato + origem:** WhatsApp/Instagram + "por onde nos conheceu?" (`source`).
   - **Modo rápido:** se logado e já tem char validado no mundo certo, 1 clique (pré-preenche).
3. Cria `signups` (status `waiting`, `queueOrder` = fim da fila daquela oferta) via **servidor**.

### C. Dono gerencia a fila
1. `/p/[slug]` lista signups por **vocação** (tabs) e por **status** (`waiting`→`scheduled`→`done`).
2. Ações: mover status, reordenar, **botão WhatsApp** (`https://wa.me/<num>` click-to-chat, custo
   zero) para combinar pagamento/horário fora do app.
3. `source` agregado → o time vê de onde vêm os clientes (Twitch/Insta/indicação).

## Validação (híbrida — ver ADR 006)

- **Automática (TibiaData):** mundo, vocação, level. Bloqueia inscrição com char inexistente ou
  no mundo errado.
- **Declarativa (checklist):** pré-requisitos de acesso/quest que a API não expõe — cliente marca,
  time confere no WhatsApp. Não bloqueia, sinaliza.

## Definição de pronto (MVP)

- [ ] Login Google + email/senha funcionando.
- [ ] Time cria perfil + abre oferta.
- [ ] Cliente valida char na TibiaData e entra na fila.
- [ ] Dono vê a fila por vocação e move status + abre WhatsApp.
- [ ] `/service` lista times aprovados com filtro por mundo.
- [ ] Tudo no free tier; deployado na Vercel; tema Royal Parchment aplicado.

## Fora do MVP (próximas fases)
Notificações, aprovação de time self-service, badge Apoiador, boss timers, calculadoras,
formações community. Ver [`05`](./05-roadmap.md).
