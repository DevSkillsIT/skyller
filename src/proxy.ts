/**
 * SPEC-006-skyller - Proxy + Auth Middleware
 * Combina validacao de rotas do AG-UI Dojo com autenticacao NextAuth v5
 *
 * Next.js 16 nao permite middleware.ts e proxy.ts simultaneamente,
 * entao combinamos as funcionalidades aqui.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIntegrationValid, isFeatureAvailable } from "./utils/menu";

/**
 * Rotas que nao requerem autenticacao
 */
const PUBLIC_ROUTES = [
  "/api/auth",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/images",
];

/**
 * Verifica se a rota e publica (nao requer auth)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // NOTA: Autenticacao via NextAuth v5 usando auth() callback
  // Temporariamente desabilitado ate Keycloak estar configurado
  // Para habilitar: descomentar bloco abaixo e importar { auth } from "@/lib/auth"
  /*
  // Verificar autenticacao para rotas protegidas
  if (!isPublicRoute(pathname)) {
    // O middleware auth() do NextAuth v5 lida com a validacao
    // Sera integrado quando Keycloak estiver 100% configurado
  }
  */

  // Check for feature routes: /[integrationId]/feature/[featureId]
  const featureMatch = pathname.match(/^\/([^/]+)\/feature\/([^/]+)\/?$/);

  if (featureMatch) {
    const [, integrationId, featureId] = featureMatch;

    // Check if integration exists
    if (!isIntegrationValid(integrationId)) {
      requestHeaders.set("x-not-found", "integration");
    }
    // Check if feature is available for this integration
    else if (!isFeatureAvailable(integrationId, featureId)) {
      requestHeaders.set("x-not-found", "feature");
    }
  }

  // Check for integration routes: /[integrationId] (but not /[integrationId]/feature/...)
  const integrationMatch = pathname.match(/^\/([^/]+)\/?$/);

  if (integrationMatch) {
    const [, integrationId] = integrationMatch;

    // Skip the root path
    if (integrationId && integrationId !== "") {
      if (!isIntegrationValid(integrationId)) {
        requestHeaders.set("x-not-found", "integration");
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};

