import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { OfferingDoc, WithId } from "@/types";

type FirestoreOfferingDoc = Omit<OfferingDoc, "createdAt"> & {
  createdAt: { toMillis(): number };
};

function hydrateOffering(id: string, data: FirestoreOfferingDoc): WithId<OfferingDoc> {
  return {
    id,
    teamId: data.teamId,
    teamSlug: data.teamSlug,
    quest: data.quest,
    world: data.world,
    vocationSlots: data.vocationSlots,
    kind: data.kind,
    status: data.status,
    createdAt: data.createdAt.toMillis(),
  };
}

/**
 * Lista todas as ofertas de um time (qualquer status), ordenadas por createdAt DESC.
 * Uso em dashboards do dono — Admin SDK bypassa rules.
 *
 * Query com filtro de igualdade única (sem orderBy no Firestore) para NÃO exigir índice
 * composto — funciona em qualquer projeto novo sem deploy de índice. A ordenação é feita em
 * memória. Em escala, trocar por `.orderBy("createdAt","desc")` + deploy do índice em
 * firestore.indexes.json.
 */
export async function listOfferingsByTeam(teamId: string): Promise<WithId<OfferingDoc>[]> {
  const snap = await adminDb().collection("offerings").where("teamId", "==", teamId).get();

  return snap.docs
    .map((doc) => hydrateOffering(doc.id, doc.data() as FirestoreOfferingDoc))
    .sort((a, b) => b.createdAt - a.createdAt);
}
