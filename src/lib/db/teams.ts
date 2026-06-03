import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { TeamDoc, TeamMemberDoc, WithId } from "@/types";

type FirestoreTeamDoc = Omit<TeamDoc, "createdAt"> & {
  createdAt: { toMillis(): number };
};

type FirestoreTeamMemberDoc = TeamMemberDoc;

function hydrateTeam(id: string, data: FirestoreTeamDoc): WithId<TeamDoc> {
  return {
    id,
    slug: data.slug,
    name: data.name,
    ownerUid: data.ownerUid,
    worlds: data.worlds,
    approved: data.approved,
    supporterBadge: data.supporterBadge,
    ...(data.description !== undefined ? { description: data.description } : {}),
    createdAt: data.createdAt.toMillis(),
  };
}

/**
 * Busca um time pelo slug. Retorna null se não encontrado.
 * Para RSC: usa Admin SDK e retorna o time independente de approved.
 * A página decide se exibe ou redireciona baseado em approved.
 */
export async function getTeamBySlug(slug: string): Promise<WithId<TeamDoc> | null> {
  const snap = await adminDb()
    .collection("teams")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  return hydrateTeam(doc.id, doc.data() as FirestoreTeamDoc);
}

/**
 * Lista times aprovados, com filtro opcional por mundo, ordenados por createdAt DESC.
 *
 * Usa um único filtro de igualdade (`approved == true`) e aplica mundo + ordenação em
 * memória — assim NÃO exige índice composto e funciona em projeto novo sem deploy de índice.
 * Em escala, voltar a `.where("worlds","array-contains",world).orderBy("createdAt","desc")` +
 * deploy do índice composto (já declarado em firestore.indexes.json).
 */
export async function listApprovedTeams(
  filters?: { world?: string },
): Promise<WithId<TeamDoc>[]> {
  const snap = await adminDb().collection("teams").where("approved", "==", true).get();

  let teams = snap.docs.map((doc) => hydrateTeam(doc.id, doc.data() as FirestoreTeamDoc));
  if (filters?.world) {
    teams = teams.filter((t) => t.worlds.includes(filters.world!));
  }
  return teams.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Lista todos os membros de um time.
 */
export async function getTeamMembers(teamId: string): Promise<WithId<TeamMemberDoc>[]> {
  const snap = await adminDb()
    .collection("teams")
    .doc(teamId)
    .collection("members")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as FirestoreTeamMemberDoc;
    return {
      id: doc.id,
      characterName: data.characterName,
      vocation: data.vocation,
      role: data.role,
      active: data.active,
    };
  });
}
