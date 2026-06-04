"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import { capsFor } from "@/config/donation";
import type {
  CreateOfferingInput,
  OfferingDoc,
  OfferingStatus,
  Result,
  SupporterStatus,
  WithId,
} from "@/types";

/**
 * Retorna o número de ofertas com status "open" do time (contagem em memória,
 * sem índice composto — filtro de igualdade única em teamId).
 */
async function countOpenOfferingsForTeam(teamId: string): Promise<number> {
  const snap = await adminDb()
    .collection("offerings")
    .where("teamId", "==", teamId)
    .get();

  return snap.docs.filter((d) => d.data().status === "open").length;
}

/**
 * Retorna o SupporterStatus do dono de um time.
 */
async function getTeamOwnerSupporterStatus(ownerUid: string): Promise<SupporterStatus> {
  const snap = await adminDb().collection("users").doc(ownerUid).get();
  return (snap.data()?.supporter ?? "none") as SupporterStatus;
}

/**
 * Cria uma nova oferta (fila) para o time.
 * Exige que o caller seja o dono do teamId informado.
 * Bloqueia se o dono atingiu o limite de ofertas abertas do seu tier.
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

  // Verifica limite de ofertas abertas (cap do tier do dono)
  const ownerStatus = await getTeamOwnerSupporterStatus(teamData.ownerUid);
  const caps = capsFor(ownerStatus);
  const openCount = await countOpenOfferingsForTeam(input.teamId);
  if (openCount >= caps.maxActiveOfferings) {
    return {
      ok: false,
      error: `Limite de filas ativas atingido (${caps.maxActiveOfferings}). Apoie o Hub para abrir mais.`,
    };
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
 * Ao reabrir ("open"), verifica o limite de filas ativas do tier do dono.
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

  const offeringData = offeringSnap.data() as { teamId: string; status: OfferingStatus };

  // Verifica que o caller é dono do time
  const teamSnap = await adminDb().collection("teams").doc(offeringData.teamId).get();
  if (!teamSnap.exists) {
    return { ok: false, error: "Time associado à oferta não encontrado." };
  }

  const teamData = teamSnap.data() as { ownerUid: string };
  if (teamData.ownerUid !== user.uid) {
    return { ok: false, error: "Acesso negado: você não é o dono deste time." };
  }

  // Ao tentar colocar em "open", verifica o cap do tier (excluindo a própria oferta
  // caso já esteja open para evitar contar duas vezes ao re-abrir).
  if (input.status === "open") {
    const ownerStatus = await getTeamOwnerSupporterStatus(teamData.ownerUid);
    const caps = capsFor(ownerStatus);
    const openCount = await countOpenOfferingsForTeam(offeringData.teamId);
    // Desconta 1 se a própria oferta já está "open" (transição open→open é rara, mas segura)
    const effectiveOpen =
      offeringData.status === "open" ? openCount - 1 : openCount;
    if (effectiveOpen >= caps.maxActiveOfferings) {
      return {
        ok: false,
        error: `Limite de filas ativas atingido (${caps.maxActiveOfferings}). Apoie o Hub para abrir mais.`,
      };
    }
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
