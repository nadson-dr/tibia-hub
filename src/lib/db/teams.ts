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
 * Lista times aprovados, com filtro opcional por mundo.
 * Ordenados por createdAt DESC.
 *
 * Query com filtro de mundo: (approved == true, world array-contains, createdAt DESC)
 * → índice composto necessário quando world estiver presente (ver firestore.indexes.json).
 * Query sem filtro: (approved == true, createdAt DESC) → índice simples.
 */
export async function listApprovedTeams(
  filters?: { world?: string },
): Promise<WithId<TeamDoc>[]> {
  let query = adminDb()
    .collection("teams")
    .where("approved", "==", true)
    .orderBy("createdAt", "desc") as FirebaseFirestore.Query;

  if (filters?.world) {
    query = adminDb()
      .collection("teams")
      .where("approved", "==", true)
      .where("worlds", "array-contains", filters.world)
      .orderBy("createdAt", "desc");
  }

  const snap = await query.get();
  return snap.docs.map((doc) => hydrateTeam(doc.id, doc.data() as FirestoreTeamDoc));
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
