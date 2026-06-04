"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import { DONATION } from "@/config/donation";
import type {
  DonationDoc,
  RequestDonationInput,
  Result,
  SupporterStatus,
  WithId,
} from "@/types";

type FirestoreDonationDoc = Omit<DonationDoc, "requestedAt" | "confirmedAt"> & {
  requestedAt: { toMillis(): number };
  confirmedAt?: { toMillis(): number };
};

function hydrateDonation(id: string, data: FirestoreDonationDoc): WithId<DonationDoc> {
  return {
    id,
    uid: data.uid,
    userEmail: data.userEmail,
    purpose: data.purpose,
    tcAmount: data.tcAmount,
    status: data.status,
    ...(data.note !== undefined ? { note: data.note } : {}),
    requestedAt: data.requestedAt.toMillis(),
    ...(data.confirmedAt !== undefined ? { confirmedAt: data.confirmedAt.toMillis() } : {}),
    ...(data.confirmedByUid !== undefined ? { confirmedByUid: data.confirmedByUid } : {}),
  };
}

/**
 * Usuário declara que enviou TC para o personagem da plataforma.
 * Cria donations/{id} com status "pending" e seta users/{uid}.supporter="pending".
 * Barra se o usuário já tiver uma doação pendente.
 */
export async function requestDonation(
  input: RequestDonationInput,
): Promise<Result<WithId<DonationDoc>>> {
  const user = await requireUser();

  // Verifica se já existe doação pending deste usuário
  const existingSnap = await adminDb()
    .collection("donations")
    .where("uid", "==", user.uid)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    return {
      ok: false,
      error:
        "Você já tem uma doação pendente. Aguarde a confirmação do admin antes de solicitar outra.",
    };
  }

  const donationData: Omit<DonationDoc, "requestedAt"> & { requestedAt: FieldValue } = {
    uid: user.uid,
    userEmail: user.email ?? "",
    purpose: input.purpose,
    tcAmount: DONATION.teamOwnerTc,
    status: "pending",
    ...(input.note ? { note: input.note } : {}),
    requestedAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb().collection("donations").add(donationData);

  // Atualiza o status do usuário para "pending"
  await adminDb().collection("users").doc(user.uid).update({
    supporter: "pending",
  });

  const snap = await ref.get();
  const data = snap.data() as FirestoreDonationDoc;

  return {
    ok: true,
    value: hydrateDonation(ref.id, data),
  };
}

/**
 * Retorna o SupporterStatus do usuário autenticado.
 * Ausência do campo = "none" (compat com docs antigos).
 */
export async function getMySupporterStatus(): Promise<SupporterStatus> {
  const user = await requireUser();
  const snap = await adminDb().collection("users").doc(user.uid).get();
  return (snap.data()?.supporter ?? "none") as SupporterStatus;
}

/**
 * Retorna a última doação do usuário autenticado, ou null se não houver.
 */
export async function getMyDonation(): Promise<WithId<DonationDoc> | null> {
  const user = await requireUser();

  const snap = await adminDb()
    .collection("donations")
    .where("uid", "==", user.uid)
    .get();

  if (snap.empty) return null;

  // Ordena em memória (filtro de igualdade única, sem índice composto)
  const sorted = snap.docs
    .map((doc) => hydrateDonation(doc.id, doc.data() as FirestoreDonationDoc))
    .sort((a, b) => b.requestedAt - a.requestedAt);

  return sorted[0] ?? null;
}
