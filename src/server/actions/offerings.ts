"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import type {
  CreateOfferingInput,
  OfferingDoc,
  OfferingStatus,
  Result,
  WithId,
} from "@/types";

/**
 * Cria uma nova oferta (fila) para o time.
 * Exige que o caller seja o dono do teamId informado.
 */
export async function createOffering(
  input: CreateOfferingInput,
): Promise<Result<WithId<OfferingDoc>>> {
  const user = await requireUser();

  // Verifica que o caller é dono do time
  const teamSnap = await adminDb().collection("teams").doc(input.teamId).get();
  if (!teamSnap.exists) {
    return { ok: false, error: "Time não encontrado." };
  }

  const teamData = teamSnap.data() as { ownerUid: string; slug: string };
  if (teamData.ownerUid !== user.uid) {
    return { ok: false, error: "Acesso negado: você não é o dono deste time." };
  }

  const offeringData: Omit<OfferingDoc, "createdAt"> & { createdAt: FieldValue } = {
    teamId: input.teamId,
    teamSlug: teamData.slug,
    quest: input.quest,
    world: input.world,
    vocationSlots: input.vocationSlots,
    kind: input.kind ?? "service",
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb().collection("offerings").add(offeringData);

  const snap = await ref.get();
  const data = snap.data() as Omit<OfferingDoc, "createdAt"> & {
    createdAt: { toMillis(): number };
  };

  return {
    ok: true,
    value: {
      id: ref.id,
      ...data,
      createdAt: data.createdAt.toMillis(),
    } as WithId<OfferingDoc>,
  };
}

/**
 * Muda o status de uma oferta (open/paused/closed).
 * Exige que o caller seja o dono do time dono da oferta.
 */
export async function setOfferingStatus(input: {
  offeringId: string;
  status: OfferingStatus;
}): Promise<Result<void>> {
  const user = await requireUser();

  const offeringSnap = await adminDb().collection("offerings").doc(input.offeringId).get();
  if (!offeringSnap.exists) {
    return { ok: false, error: "Oferta não encontrada." };
  }

  const offeringData = offeringSnap.data() as { teamId: string };

  // Verifica que o caller é dono do time
  const teamSnap = await adminDb().collection("teams").doc(offeringData.teamId).get();
  if (!teamSnap.exists) {
    return { ok: false, error: "Time associado à oferta não encontrado." };
  }

  const teamData = teamSnap.data() as { ownerUid: string };
  if (teamData.ownerUid !== user.uid) {
    return { ok: false, error: "Acesso negado: você não é o dono deste time." };
  }

  try {
    await adminDb().collection("offerings").doc(input.offeringId).update({
      status: input.status,
    });
    return { ok: true, value: undefined };
  } catch (err) {
    console.error("[setOfferingStatus]", err);
    return { ok: false, error: "Falha ao atualizar status da oferta." };
  }
}
