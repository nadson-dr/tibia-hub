import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 dias

/**
 * POST /api/auth/session
 * Body: { idToken: string }
 * Verifica o ID token, cria um session cookie httpOnly e o seta na resposta.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let idToken: string | undefined;

  try {
    const body = (await req.json()) as { idToken?: unknown };
    if (typeof body.idToken === "string") {
      idToken = body.idToken;
    }
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  try {
    // Verifica o token primeiro para checar revogação
    await adminAuth().verifyIdToken(idToken, true);

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000, // segundos
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[session/POST] erro ao criar session cookie:", err);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

/**
 * DELETE /api/auth/session
 * Limpa o session cookie (logout).
 */
export async function DELETE(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
