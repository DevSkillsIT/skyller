/**
 * Next.js Middleware para protecao de rotas - NextAuth v5
 *
 * WHITE-LABEL AUTHENTICATION:
 * Quando um usuario nao autenticado tenta acessar uma rota protegida,
 * ele e redirecionado para /api/auth/login que faz signIn direto
 * no Keycloak sem pagina intermediaria.
 *
 * FLUXO:
 * 1. Usuario acessa skills.skyller.ai/chat
 * 2. Middleware detecta que nao esta autenticado
 * 3. Redireciona para /api/auth/login?callbackUrl=/chat
 * 4. /api/auth/login detecta tenant e faz signIn("keycloak-skills")
 * 5. Usuario vai direto para skills.skyller.ai/auth/realms/skills/...
 * 6. Apos login, retorna para skills.skyller.ai/chat
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isPublicRoute } from "@/lib/auth/constants";

/**
 * Middleware usando NextAuth v5 auth wrapper.
 *
 * O auth() retorna um middleware que injeta req.auth com a sessao.
 * Isso permite verificar autenticacao no Edge Runtime.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Rotas publicas - permitir sempre
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Verificar se usuario esta autenticado
  const isLoggedIn = !!req.auth?.user;

  if (!isLoggedIn) {
    // MULTI-TENANT FIX: Usar X-Forwarded-Host para construir URL correta
    // req.url pode ter o host interno do servidor, nao o host do cliente
    const forwardedHost = req.headers.get("x-forwarded-host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";

    // Construir base URL do tenant
    const tenantBaseUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : req.nextUrl.origin;

    // Construir callback URL com o host correto
    const callbackUrl = `${tenantBaseUrl}${pathname}${req.nextUrl.search}`;

    // WHITE-LABEL: Redirecionar para /api/auth/login
    const loginUrl = new URL("/api/auth/login", tenantBaseUrl);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  // Usuario autenticado - continuar
  return NextResponse.next();
});

/**
 * Configuracao do matcher para otimizar performance
 *
 * Exclui:
 * - Assets estaticos (_next/static, _next/image)
 * - Arquivos estaticos (favicon.ico, images, etc.)
 * - API de autenticacao (/api/auth/*)
 */
export const config = {
  matcher: [
    /*
     * Match todas as rotas exceto:
     * - _next/static (arquivos estaticos)
     * - _next/image (otimizacao de imagens)
     * - favicon.ico (icone do site)
     * - static/ (pasta de arquivos estaticos)
     * - public/ (pasta publica)
     * - api/auth (rotas de autenticacao NextAuth)
     * - Arquivos com extensoes de imagem/video/fonte
     */
    "/((?!_next/static|_next/image|favicon.ico|static/|public/|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff|woff2|ttf|eot)$).*)",
  ],
};
