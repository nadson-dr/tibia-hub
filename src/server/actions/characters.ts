"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/current-user";
import { fetchCharacter } from "@/lib/tibiadata";
import { parseTibiaVocation } from "@/lib/tibiadata/vocation";
import type { AddCharacterInput, CharacterDoc, Result, WithId } from "@/types";

/**
 * Valida o personagem na TibiaData e o adiciona à subcoleção
 * users/{uid}/characters/{autoId}.
 *
 * Retorna erro se o personagem não existir ou tiver vocação não-promovida.
 */
export async function addCharacter(
  input: AddCharacterInput,
): Promise<Result<WithId<CharacterDoc>>> {
  const user = await requireUser();

  // 1. Busca na TibiaData
  const result = await fetchCharacter(input.name);
  if (!result.ok) {
    const errorMap = {
      not_found: "Personagem não encontrado na TibiaData.",
      network: "Erro de rede ao consultar TibiaData. Tente novamente.",
      invalid_response: "Resposta inválida da TibiaData.",
    } as const;
    return { ok: false, error: errorMap[result.error] };
  }

  // 2. Valida vocação promovida
  const vocParse = parseTibiaVocation(result.character.vocation);
  if (!vocParse.ok) {
    if (vocParse.reason === "unpromoted") {
      return {
        ok: false,
        error: `Personagem com vocação não-promovida (${result.character.vocation}). Promova o personagem antes de cadastrar.`,
      };
    }
    return {
      ok: false,
      error: `Vocação desconhecida: ${result.character.vocation}.`,
    };
  }

  // 3. Grava na subcoleção
  const charData: Omit<CharacterDoc, "validatedAt"> & { validatedAt: FieldValue } = {
    name: result.character.name,
    world: result.character.world,
    vocation: vocParse.vocation,
    level: result.character.level,
    validatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb()
    .collection("users")
    .doc(user.uid)
    .collection("characters")
    .add(charData);

  const snap = await ref.get();
  const data = snap.data() as Omit<CharacterDoc, "validatedAt"> & {
    validatedAt: { toMillis(): number };
  };

  return {
    ok: true,
    value: {
      id: ref.id,
      ...data,
      validatedAt: data.validatedAt.toMillis(),
    } as WithId<CharacterDoc>,
  };
}

/**
 * Lista os personagens já cadastrados do usuário autenticado
 * (users/{uid}/characters), ordenados por validação mais recente.
 * Usado para hidratar /me no carregamento (sem isso a lista some no reload).
 */
export async function listMyCharacters(): Promise<WithId<CharacterDoc>[]> {
  const user = await requireUser();

  const snap = await adminDb()
    .collection("users")
    .doc(user.uid)
    .collection("characters")
    .orderBy("validatedAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<CharacterDoc, "validatedAt"> & {
      validatedAt: { toMillis(): number };
    };
    return {
      id: doc.id,
      name: data.name,
      world: data.world,
      vocation: data.vocation,
      level: data.level,
      validatedAt: data.validatedAt.toMillis(),
    };
  });
}
