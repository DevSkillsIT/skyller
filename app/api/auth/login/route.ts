/**
 * Login Route Handler - SPEC-ORGS-001 Single Realm Multi-Organization
 *
 * PADRAO WHITE-LABEL: Esta rota faz redirect direto para o Keycloak
 * usando a URL do subdominio do tenant. O usuario NUNCA ve idp.servidor.one.
 *
 * SPEC-ORGS-001 ARCHITECTURE:
 * - Single Realm: "Skyller" (NAO mais multi-realm)
 * - 2 Providers estaticos: keycloak-skyller (usuarios), keycloak-admin (admins)
 * - Organizations: cada tenant e uma Organization no Keycloak 26
 *
 * FLUXO:
 * 1. Usuario acessa skills.skyller.ai (nao autenticado)
 * 2. Proxy redireciona para /api/auth/login
 * 3. Esta rota detecta se e admin ou tenant
 * 4. Usa keycloak-skyller (para tenants) ou keycloak-admin (para admin)
 * 5. Faz signIn e intercepta o NEXT_REDIRECT
 * 6. Substitui URLs do Keycloak pelo tenant correto (white-label)
 *
 * @see SPEC-ORGS-001
 */

import { signIn } from "@/auth";
import { isAdminHost } from "@/lib/auth/providers/keycloak-factory";
import { NextRequest, NextResponse } from "next/server";

/**
 * URL base do Keycloak real (para substituicao white-label)
 */
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || "https://idp.servidor.one";

/**
 * Realm unico para SPEC-ORGS-001
 */
const KEYCLOAK_REALM = process.env.KEYCLOAK_DEFAULT_REALM || "Skyller";

/**
 * GET /api/auth/login
 *
 * SPEC-ORGS-001: Usa apenas 2 providers estaticos:
 * - keycloak-skyller: para usuarios de tenants
 * - keycloak-admin: para administradores da plataforma
 *
 * Query params:
 * - callbackUrl: URL para redirecionar apos login (default: "/")
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Detectar host do request
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  // DEBUG: Log do host detectado
  console.log(`[Auth Login] Host: "${host}", Subdomain: "${subdomain}"`);

  // Detectar se e acesso admin (admin.skyller.ai)
  const isAdmin = isAdminHost(host);

  // SPEC-ORGS-001: Apenas 2 providers estaticos
  const providerId = isAdmin ? "keycloak-admin" : "keycloak-skills";

  // Construir base URL do tenant para white-label
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const tenantBaseUrl = forwardedHost && !forwardedHost.includes("localhost")
    ? `${forwardedProto}://${forwardedHost}`
    : `${forwardedProto}://${request.headers.get("host") || "localhost:3004"}`;

  // DEBUG: Log das URLs
  console.log(`[Auth Login] Provider: ${providerId}, Realm: ${KEYCLOAK_REALM}, TenantBaseUrl: ${tenantBaseUrl}`);

  try {
    // MULTI-TENANT FIX: Setar AUTH_URL ANTES do signIn para garantir callback URL correta
    process.env.AUTH_URL = tenantBaseUrl;
    console.log(`[Auth Login] AUTH_URL set to: ${tenantBaseUrl}`);

    // Fazer signIn - vai jogar NEXT_REDIRECT que interceptamos
    await signIn(providerId, {
      redirectTo: callbackUrl,
      redirect: true,
    });

    // Se chegou aqui, algo deu errado (signIn deveria ter jogado NEXT_REDIRECT)
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    // NEXT_REDIRECT contem a URL de redirect no digest
    // Formato: 'NEXT_REDIRECT;replace;URL;STATUS;'
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      const digestMatch = (error as Error & { digest?: string }).digest?.match(
        /NEXT_REDIRECT;[^;]*;([^;]+);/
      );

      if (digestMatch && digestMatch[1]) {
        let redirectUrl = decodeURIComponent(digestMatch[1]);

        console.log(`[Auth Login] Original redirect URL: ${redirectUrl}`);

        // =========================================================
        // WHITE-LABEL: Substituir URL do Keycloak real pela URL do subdominio
        // =========================================================

        // 1. Substituir base URL do Keycloak
        if (redirectUrl.includes(KEYCLOAK_BASE_URL)) {
          redirectUrl = redirectUrl.replace(KEYCLOAK_BASE_URL, tenantBaseUrl);
        }

        // 2. SPEC-ORGS-001: Realm e sempre "Skyller" (garantir consistencia)
        // Nao precisamos corrigir realm porque ja e unico

        // 3. Corrigir callback URL para o dominio correto
        // Isso garante que o callback volta para o tenant correto
        const callbackUrlRegex = /redirect_uri=([^&]+)/;
        const callbackMatch = redirectUrl.match(callbackUrlRegex);
        if (callbackMatch) {
          const originalCallback = decodeURIComponent(callbackMatch[1]);
          // Substituir qualquer dominio skyller.ai pelo tenant correto
          const fixedCallback = originalCallback.replace(
            /https?:\/\/[a-z0-9-]+\.skyller\.ai/gi,
            tenantBaseUrl
          );
          redirectUrl = redirectUrl.replace(
            callbackUrlRegex,
            `redirect_uri=${encodeURIComponent(fixedCallback)}`
          );
        }

        console.log(`[Auth Login] Fixed redirect URL: ${redirectUrl}`);

        return NextResponse.redirect(redirectUrl);
      }

      // Se nao conseguiu extrair URL, re-throw
      throw error;
    }

    // Outros erros - redirecionar para pagina de erro
    console.error("[Auth Login] Error initiating sign-in:", error);

    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", "OAuthSignin");
    return NextResponse.redirect(errorUrl);
  }
}
