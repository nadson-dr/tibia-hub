# ADR-008: Autenticação via Firebase Auth (Google + email/senha)

## Status
Aceito · 2026-06-03 · supersede o ADR-008 do projeto anterior (Supabase Auth)

## Contexto

Precisamos identificar dois papéis: **dono de time** (gerencia fila) e **cliente** (se inscreve).
Jogadores de Tibia não têm identidade canônica fora do char; o login precisa ser de baixa fricção.

## Decisão

**Firebase Auth** com email/senha agora; Google planejado para depois:
- **Email/senha** — único método exposto na UI no momento (login e signup).
- **Google** — login social 1-clique **adiado para uma próxima versão**. O método
  `signInWithGoogle` permanece no `AuthProvider`, mas sem ponto de entrada na UI; reativar
  exige habilitar o provider Google no console Firebase Auth + repor o botão em `/login`.

O `uid` do Firebase Auth é a chave de `users/{uid}`. O papel (`player` | `team_owner`) é um campo
em `users`, definido no onboarding (`team_owner` ao criar um time).

Mutações sensíveis verificam o **ID token** no servidor (`verifyIdToken` via Admin SDK) antes de
escrever — não confiamos só nas rules para lógica de negócio.

## Consequências

**Positivas**
- Sem gerência de sessão própria; SDK cuida de refresh.
- Google reduz fricção; email/senha cobre o resto.
- `uid` estável como chave de dados.

**Negativas**
- Identidade ≠ personagem: o vínculo char↔conta é nosso (validação TibiaData em
  `users/{uid}/characters`), não do Auth.
- Recuperação de senha/email é responsabilidade do Firebase (aceitável).

## Alternativas consideradas
- **Só Google:** rejeitado — exclui quem não usa conta Google.
- **Anônimo + upgrade:** rejeitado para o MVP — mais estado/complexidade do que ganho.

## Atualização (2026-06-03)
Para o lançamento inicial, **apenas email/senha** na UI. Google será configurado numa versão
seguinte. No console Firebase, basta habilitar **Email/senha** em Authentication por enquanto.
