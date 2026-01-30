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
 * 2. Proxy detecta que nao esta autenticado
 * 3. Redireciona para /api/auth/login?callbackUrl=/chat
 * 4. /api/auth/login detecta tenant e faz signIn("keycloak-skyller")
 * 5. Usuario vai direto para idp.servidor.one/realms/Skyller/...
 * 6. Apos login, retorna para skills.skyller.ai/chat
 *
 * @see SPEC-ORGS-001 Single Realm Multi-Organization
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPublicRoute } from "@/lib/auth/constants";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

/**
 * Proxy function para Next.js 16
 *
 * Usando auth() wrapper do NextAuth v5 que injeta req.auth com a sessao.
 * IMPORTANTE: Next.js 16 requer export nomeado "proxy", nao "default" ou "middleware"
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Rotas publicas - permitir sempre
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // SPEC-ORGS-001: Extrair tenant do hostname
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const hostname = forwardedHost || req.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  // Construir base URL do tenant
  const tenantBaseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : req.nextUrl.origin;

  // Verificar se usuario esta autenticado
  const isLoggedIn = !!req.auth?.user;

  if (!isLoggedIn) {
    // Construir callback URL com o host correto
    const callbackUrl = `${tenantBaseUrl}${pathname}${req.nextUrl.search}`;

    // WHITE-LABEL: Redirecionar para /api/auth/login
    const loginUrl = new URL("/api/auth/login", tenantBaseUrl);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  // SPEC-ORGS-001: Validar se usuario pertence ao tenant
  // Ignorar validacao para localhost e admin
  const isLocalhost = hostname.includes("localhost");
  const isAdmin = subdomain === "admin";

  if (!isLocalhost && !isAdmin && req.auth?.user?.organizations) {
    const userOrgs = req.auth.user.organizations;
    if (!userOrgs.includes(subdomain)) {
      // Redirecionar para org padrao do usuario
      const defaultOrg = userOrgs[0];
      if (defaultOrg) {
        const redirectUrl = `https://${defaultOrg}.skyller.ai${pathname}${req.nextUrl.search}`;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Usuario autenticado - adicionar X-Tenant-ID (UUID) no request e continuar
  const requestHeaders = new Headers(req.headers);
  if (req.auth?.user?.tenant_id) {
    if (isUuid(req.auth.user.tenant_id)) {
      requestHeaders.set("X-Tenant-ID", req.auth.user.tenant_id);
    } else {
      console.warn("[proxy] tenant_id invalido (nao UUID) ignorado", {
        tenant_id: req.auth.user.tenant_id,
        path: pathname,
      });
    }
  }
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
     * - auth/ (proxy para Keycloak via nginx - WHITE-LABEL)
     * - Arquivos com extensoes de imagem/video/fonte
     */
    "/((?!_next/static|_next/image|favicon.ico|static/|public/|api/auth|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff|woff2|ttf|eot)$).*)",
  ],
};
