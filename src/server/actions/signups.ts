"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import { fetchCharacter } from "@/lib/tibiadata";
import { parseTibiaVocation } from "@/lib/tibiadata/vocation";
import type {
  CreateSignupInput,
  SignupDoc,
  UpdateSignupStatusInput,
  Result,
  WithId,
} from "@/types";

/**
 * Cria uma inscrição numa fila de service.
 * Valida o personagem via TibiaData (mundo, vocação promovida).
 * queueOrder = último + 1 para a oferta.
 */
export async function createSignup(
  input: CreateSignupInput,
): Promise<Result<WithId<SignupDoc>>> {
  const user = await requireUser();

  // 1. Verifica a oferta
  const offeringSnap = await adminDb().collection("offerings").doc(input.offeringId).get();
  if (!offeringSnap.exists) {
    return { ok: false, error: "Oferta não encontrada." };
  }

  const offering = offeringSnap.data() as { teamId: string; world: string; status: string };
  if (offering.status !== "open") {
    return { ok: false, error: "Esta fila não está mais aberta para inscrições." };
  }

  // 2. Valida personagem na TibiaData
  const charResult = await fetchCharacter(input.characterName);
  if (!charResult.ok) {
    const errorMap = {
      not_found: "Personagem não encontrado na TibiaData.",
      network: "Erro de rede ao consultar TibiaData. Tente novamente.",
      invalid_response: "Resposta inválida da TibiaData.",
    } as const;
    return { ok: false, error: errorMap[charResult.error] };
  }

  // 3. Valida mundo
  if (charResult.character.world !== offering.world) {
    return {
      ok: false,
      error: `Personagem está no mundo ${charResult.character.world}, mas a fila é para ${offering.world}.`,
    };
  }

  // 4. Valida vocação promovida
  const vocParse = parseTibiaVocation(charResult.character.vocation);
  if (!vocParse.ok) {
    if (vocParse.reason === "unpromoted") {
      return {
        ok: false,
        error: `Personagem com vocação não-promovida (${charResult.character.vocation}). Promova antes de entrar na fila.`,
      };
    }
    return { ok: false, error: `Vocação desconhecida: ${charResult.character.vocation}.` };
  }

  // 5. Carrega as inscrições da oferta (filtro de igualdade única — sem índice composto)
  //    para (a) impedir inscrição duplicada do mesmo usuário e (b) calcular queueOrder.
  const existingSnap = await adminDb()
    .collection("signups")
    .where("offeringId", "==", input.offeringId)
    .get();

  const existing = existingSnap.docs.map(
    (d) => d.data() as { clientUid: string; status: string; queueOrder: number },
  );

  const alreadyIn = existing.some(
    (s) => s.clientUid === user.uid && (s.status === "waiting" || s.status === "scheduled"),
  );
  if (alreadyIn) {
    return { ok: false, error: "Você já está nesta fila." };
  }

  const lastOrder = existing.reduce((max, s) => Math.max(max, s.queueOrder ?? 0), 0);

  const signupData: Omit<SignupDoc, "createdAt"> & { createdAt: FieldValue } = {
    offeringId: input.offeringId,
    teamId: offering.teamId,
    clientUid: user.uid,
    characterName: charResult.character.name,
    vocation: vocParse.vocation,
    level: charResult.character.level,
    world: charResult.character.world,
    contact: input.contact,
    ...(input.source ? { source: input.source } : {}),
    status: "waiting",
    queueOrder: lastOrder + 1,
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb().collection("signups").add(signupData);

  const snap = await ref.get();
  const data = snap.data() as Omit<SignupDoc, "createdAt"> & {
    createdAt: { toMillis(): number };
  };

  return {
    ok: true,
    value: {
      id: ref.id,
      ...data,
      createdAt: data.createdAt.toMillis(),
    } as WithId<SignupDoc>,
  };
}

/**
 * Atualiza o status de uma inscrição.
 * Exige que o caller seja o dono do time da oferta.
 */
export async function updateSignupStatus(
  input: UpdateSignupStatusInput,
): Promise<Result<void>> {
  const user = await requireUser();

  const signupSnap = await adminDb().collection("signups").doc(input.signupId).get();
  if (!signupSnap.exists) {
    return { ok: false, error: "Inscrição não encontrada." };
  }

  const signupData = signupSnap.data() as { teamId: string };

  // Verifica que o caller é dono do time
  const teamSnap = await adminDb().collection("teams").doc(signupData.teamId).get();
  if (!teamSnap.exists) {
    return { ok: false, error: "Time associado não encontrado." };
  }

  const teamData = teamSnap.data() as { ownerUid: string };
  if (teamData.ownerUid !== user.uid) {
    return { ok: false, error: "Acesso negado: você não é o dono deste time." };
  }

  try {
    await adminDb()
      .collection("signups")
      .doc(input.signupId)
      .update({ status: input.status });
    return { ok: true, value: undefined };
  } catch (err) {
    console.error("[updateSignupStatus]", err);
    return { ok: false, error: "Falha ao atualizar status da inscrição." };
  }
}
