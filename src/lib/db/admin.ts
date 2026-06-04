import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { DonationDoc, TeamDoc, WithId } from "@/types";

// ─── Helpers de hidratação ────────────────────────────────────────────────────

type FirestoreDonationDoc = Omit<DonationDoc, "requestedAt" | "confirmedAt"> & {
  requestedAt: { toMillis(): number };
  confirmedAt?: { toMillis(): number };
};

type FirestoreTeamDoc = Omit<TeamDoc, "createdAt"> & {
  createdAt: { toMillis(): number };
};

export function hydrateDonation(id: string, data: FirestoreDonationDoc): WithId<DonationDoc> {
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

export function hydrateTeam(id: string, data: FirestoreTeamDoc): WithId<TeamDoc> {
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

// ─── Queries de admin ─────────────────────────────────────────────────────────

/**
 * Lista todas as doações com status "pending".
 * Filtro de igualdade única — sem índice composto necessário.
 */
export async function listPendingDonationsDb(): Promise<WithId<DonationDoc>[]> {
  const snap = await adminDb()
    .collection("donations")
    .where("status", "==", "pending")
    .get();

  return snap.docs
    .map((doc) => hydrateDonation(doc.id, doc.data() as FirestoreDonationDoc))
    .sort((a, b) => a.requestedAt - b.requestedAt);
}

/**
 * Lista todos os times com approved == false.
 * Filtro de igualdade única — sem índice composto necessário.
 */
export async function listPendingTeamsDb(): Promise<WithId<TeamDoc>[]> {
  const snap = await adminDb()
    .collection("teams")
    .where("approved", "==", false)
    .get();

  return snap.docs
    .map((doc) => hydrateTeam(doc.id, doc.data() as FirestoreTeamDoc))
    .sort((a, b) => a.createdAt - b.createdAt);
}
