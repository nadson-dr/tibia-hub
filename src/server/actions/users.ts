"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import type { Contact, Result, UserDoc, WithId } from "@/types";

/**
 * Cria o documento users/{uid} se ainda não existir (idempotente).
 * Deve ser chamado após o primeiro login.
 */
export async function ensureUserDoc(input: {
  displayName?: string;
  role?: UserDoc["role"];
}): Promise<Result<WithId<UserDoc>>> {
  const user = await requireUser();
  // Fallback: usa a parte local do email como displayName se não fornecido
  const displayName = input.displayName ?? (user.email?.split("@")[0] ?? "Jogador");
  const { role = "player" } = input;

  const ref = adminDb().collection("users").doc(user.uid);
  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data() as Omit<UserDoc, "createdAt"> & { createdAt: { toMillis(): number } };
    return {
      ok: true,
      value: {
        id: snap.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
      } as WithId<UserDoc>,
    };
  }

  const newDoc: Omit<UserDoc, "createdAt"> & { createdAt: FieldValue } = {
    role,
    displayName,
    email: user.email ?? "",
    contact: {},
    createdAt: FieldValue.serverTimestamp(),
  };

  await ref.set(newDoc);

  // Busca de volta para obter o timestamp real
  const created = await ref.get();
  const createdData = created.data() as Omit<UserDoc, "createdAt"> & {
    createdAt: { toMillis(): number };
  };

  return {
    ok: true,
    value: {
      id: ref.id,
      ...createdData,
      createdAt: createdData.createdAt.toMillis(),
    } as WithId<UserDoc>,
  };
}

/**
 * Atualiza o contato (whatsapp/instagram) do usuário autenticado.
 */
export async function updateContact(contact: Contact): Promise<Result<void>> {
  const user = await requireUser();

  try {
    await adminDb().collection("users").doc(user.uid).update({ contact });
    return { ok: true, value: undefined };
  } catch (err) {
    console.error("[updateContact]", err);
    return { ok: false, error: "Falha ao atualizar contato." };
  }
}
