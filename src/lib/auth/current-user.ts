import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import type { SessionUser } from "@/types";

const SESSION_COOKIE_NAME = "session";

/**
 * Lê o cookie de sessão httpOnly e valida com o Admin SDK.
 * Retorna o usuário autenticado ou null se não houver sessão válida.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Como getCurrentUser(), mas lança um erro se não houver sessão válida.
 * Usar em server actions/RSCs que exigem autenticação.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Não autenticado.");
  }
  return user;
}

/**
 * Verifica se o uid informado está na lista ADMIN_UIDS (env, separada por vírgula).
 * Server-only — nunca expor ao client.
 */
export function isAdmin(uid: string): boolean {
  const raw = process.env.ADMIN_UIDS ?? "";
  if (!raw.trim()) return false;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(uid);
}

/**
 * Retorna true se o usuário da sessão atual for admin.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isAdmin(user.uid);
}

/**
 * Como requireUser(), mas também exige que o usuário seja admin (ADMIN_UIDS).
 * Lança se não autenticado ou não for admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user.uid)) {
    throw new Error("Acesso negado: requer privilégios de admin.");
  }
  return user;
}
