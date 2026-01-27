/**
 * Logout Route Handler
 *
 * Este endpoint e chamado pelo Keycloak apos logout (post_logout_redirect_uri).
 * Completa o logout limpando a session do NextAuth.
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import { type NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";

/**
 * GET /api/auth/logout
 *
 * Este endpoint e chamado pelo Keycloak apos logout.
 * Completa o logout limpando a session do NextAuth.
 */
export async function GET(_request: NextRequest) {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3004";

  try {
    // Limpar session do NextAuth
    await signOut({
      redirect: false,
    });
  } catch (error) {
    // Ignorar erros de signOut (pode nao haver sessao)
    console.warn("[Logout] signOut error:", error);
  }

  // Redirecionar para a pagina inicial
  return NextResponse.redirect(new URL("/", baseUrl));
}

/**
 * POST /api/auth/logout
 *
 * Suporte alternativo para POST requests.
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
