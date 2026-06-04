"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/current-user";
import { listPendingDonationsDb, listPendingTeamsDb } from "@/lib/db/admin";
import type { DonationDoc, ResolveDonationInput, Result, TeamDoc, WithId } from "@/types";

/**
 * Lista todas as doações com status "pending".
 * Requer que o caller seja admin (ADMIN_UIDS).
 */
export async function listPendingDonations(): Promise<WithId<DonationDoc>[]> {
  await requireAdmin();
  return listPendingDonationsDb();
}

/**
 * Lista todos os times com approved == false (aguardando revisão).
 * Requer que o caller seja admin (ADMIN_UIDS).
 */
export async function listPendingTeams(): Promise<WithId<TeamDoc>[]> {
  await requireAdmin();
  return listPendingTeamsDb();
}

/**
 * Admin confirma ou rejeita uma doação declarada pelo usuário.
 *
 * confirm:
 *   - donations/{id}.status = "confirmed", confirmedAt, confirmedByUid
 *   - users/{uid}.supporter = "active", supporterConfirmedAt
 *
 * reject:
 *   - donations/{id}.status = "rejected"
 *   - users/{uid}.supporter = "none"
 *
 * Requer que o caller seja admin (ADMIN_UIDS).
 */
export async function resolveDonation(
  input: ResolveDonationInput,
): Promise<Result<void>> {
  const admin = await requireAdmin();

  const donationSnap = await adminDb()
    .collection("donations")
    .doc(input.donationId)
    .get();

  if (!donationSnap.exists) {
    return { ok: false, error: "Doação não encontrada." };
  }

  const donationData = donationSnap.data() as { uid: string; status: string };

  if (donationData.status !== "pending") {
    return {
      ok: false,
      error: `Doação já foi resolvida (status atual: ${donationData.status}).`,
    };
  }

  const donationRef = adminDb().collection("donations").doc(input.donationId);
  const userRef = adminDb().collection("users").doc(donationData.uid);

  try {
    if (input.decision === "confirm") {
      const now = FieldValue.serverTimestamp();
      await donationRef.update({
        status: "confirmed",
        confirmedAt: now,
        confirmedByUid: admin.uid,
      });
      await userRef.update({
        supporter: "active",
        supporterConfirmedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await donationRef.update({
        status: "rejected",
      });
      await userRef.update({
        supporter: "none",
      });
    }

    return { ok: true, value: undefined };
  } catch (err) {
    console.error("[resolveDonation]", err);
    return { ok: false, error: "Falha ao resolver doação." };
  }
}

/**
 * Admin aprova um time (approved = true), tornando-o visível publicamente.
 * Requer que o caller seja admin (ADMIN_UIDS).
 */
export async function approveTeam(teamId: string): Promise<Result<void>> {
  await requireAdmin();

  const teamSnap = await adminDb().collection("teams").doc(teamId).get();
  if (!teamSnap.exists) {
    return { ok: false, error: "Time não encontrado." };
  }

  try {
    await adminDb().collection("teams").doc(teamId).update({
      approved: true,
    });
    return { ok: true, value: undefined };
  } catch (err) {
    console.error("[approveTeam]", err);
    return { ok: false, error: "Falha ao aprovar time." };
  }
}
