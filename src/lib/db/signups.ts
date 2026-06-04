import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { SignupDoc, WithId } from "@/types";

type FirestoreSignupDoc = Omit<SignupDoc, "createdAt"> & {
  createdAt: { toMillis(): number };
};

function hydrateSignup(id: string, data: FirestoreSignupDoc): WithId<SignupDoc> {
  return {
    id,
    offeringId: data.offeringId,
    teamId: data.teamId,
    clientUid: data.clientUid,
    characterName: data.characterName,
    vocation: data.vocation,
    level: data.level,
    world: data.world,
    contact: data.contact,
    ...(data.source !== undefined ? { source: data.source } : {}),
    status: data.status,
    queueOrder: data.queueOrder,
    createdAt: data.createdAt.toMillis(),
  };
}

/**
 * Lista inscrições de múltiplas ofertas (usado no dashboard do dono).
 *
 * Usa só o filtro `in` (sem orderBy no Firestore) para NÃO exigir índice composto — a ordenação
 * por queueOrder é feita em memória. Em escala, voltar a `.orderBy("queueOrder","asc")` + deploy
 * do índice (offeringId/queueOrder) declarado em firestore.indexes.json.
 */
export async function listSignupsByOfferings(
  offeringIds: string[],
): Promise<WithId<SignupDoc>[]> {
  if (offeringIds.length === 0) return [];

  // Firestore `in` aceita até 30 valores por query; para o MVP fazemos batches simples.
  const BATCH = 30;
  const results: WithId<SignupDoc>[] = [];

  for (let i = 0; i < offeringIds.length; i += BATCH) {
    const batch = offeringIds.slice(i, i + BATCH);
    const snap = await adminDb().collection("signups").where("offeringId", "in", batch).get();

    for (const doc of snap.docs) {
      results.push(hydrateSignup(doc.id, doc.data() as FirestoreSignupDoc));
    }
  }

  return results.sort((a, b) => a.queueOrder - b.queueOrder);
}
