"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import { fetchCharacter } from "@/lib/tibiadata";
import { parseTibiaVocation } from "@/lib/tibiadata/vocation";
import type {
  Result,
  TeamDoc,
  TeamMemberDoc,
  TeamOnboardingInput,
  WithId,
} from "@/types";

/**
 * Cria um novo time.
 * - Valida slug único na coleção teams.
 * - Valida o personagem owner na TibiaData.
 * - Cria teams/{autoId}, teams/{id}/members/{autoId} (owner) e atualiza
 *   users/{uid}.role para 'team_owner'.
 */
export async function createTeam(
  input: TeamOnboardingInput,
): Promise<Result<WithId<TeamDoc>>> {
  const user = await requireUser();

  // 1. Verifica slug único
  const slugQuery = await adminDb()
    .collection("teams")
    .where("slug", "==", input.slug)
    .limit(1)
    .get();

  if (!slugQuery.empty) {
    return { ok: false, error: "Slug já está em uso. Escolha outro identificador para o time." };
  }

  // 2. Valida o personagem owner na TibiaData
  const charResult = await fetchCharacter(input.ownerCharacterName);
  if (!charResult.ok) {
    const errorMap = {
      not_found: "Personagem do dono não encontrado na TibiaData.",
      network: "Erro de rede ao validar personagem. Tente novamente.",
      invalid_response: "Resposta inválida da TibiaData ao validar personagem.",
    } as const;
    return { ok: false, error: errorMap[charResult.error] };
  }

  const vocParse = parseTibiaVocation(charResult.character.vocation);
  if (!vocParse.ok) {
    if (vocParse.reason === "unpromoted") {
      return {
        ok: false,
        error: `Personagem owner com vocação não-promovida (${charResult.character.vocation}). Promova antes de criar o time.`,
      };
    }
    return {
      ok: false,
      error: `Vocação desconhecida para o personagem owner: ${charResult.character.vocation}.`,
    };
  }

  // 3. Cria o documento do time
  const teamData: Omit<TeamDoc, "createdAt"> & { createdAt: FieldValue } = {
    slug: input.slug,
    name: input.name,
    ownerUid: user.uid,
    worlds: input.worlds,
    approved: false,
    supporterBadge: false,
    ...(input.description ? { description: input.description } : {}),
    createdAt: FieldValue.serverTimestamp(),
  };

  const teamRef = await adminDb().collection("teams").add(teamData);

  // 4. Cria o membro owner na subcoleção
  const memberData: TeamMemberDoc = {
    characterName: charResult.character.name,
    vocation: vocParse.vocation,
    role: "owner",
    active: true,
  };

  await teamRef.collection("members").add(memberData);

  // 5. Atualiza contato e role do usuário
  await adminDb()
    .collection("users")
    .doc(user.uid)
    .update({
      role: "team_owner",
      contact: input.contact,
    });

  // 6. Busca o doc criado para retornar com timestamp resolvido
  const teamSnap = await teamRef.get();
  const data = teamSnap.data() as Omit<TeamDoc, "createdAt"> & {
    createdAt: { toMillis(): number };
  };

  return {
    ok: true,
    value: {
      id: teamRef.id,
      ...data,
      createdAt: data.createdAt.toMillis(),
    } as WithId<TeamDoc>,
  };
}

/**
 * Retorna o time cujo ownerUid é o usuário autenticado, ou null.
 */
export async function getMyTeam(): Promise<WithId<TeamDoc> | null> {
  const user = await requireUser();

  const snap = await adminDb()
    .collection("teams")
    .where("ownerUid", "==", user.uid)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data() as Omit<TeamDoc, "createdAt"> & {
    createdAt: { toMillis(): number };
  };

  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt.toMillis(),
  } as WithId<TeamDoc>;
}
