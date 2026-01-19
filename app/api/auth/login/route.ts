/**
 * Login Route Handler - Direct Redirect to Keycloak (WHITE-LABEL)
 *
 * PADRAO WHITE-LABEL: Esta rota faz redirect direto para o Keycloak
 * usando a URL do subdominio do tenant. O usuario NUNCA ve idp.servidor.one.
 *
 * FLUXO:
 * 1. Usuario acessa skills.skyller.ai (nao autenticado)
 * 2. Middleware redireciona para /api/auth/login
 * 3. Esta rota detecta o tenant e seta AUTH_URL dinamicamente
 * 4. Faz signIn e intercepta o NEXT_REDIRECT
 * 5. Substitui TODAS as URLs do Keycloak e callback URLs pelo tenant correto
 * 6. Usuario vai direto para skills.skyller.ai/realms/skills/...
 *
 * MULTI-TENANT ISOLATION:
 * - AUTH_URL e setado ANTES do signIn para garantir callback URL correta
 * - Qualquer callback URL errada (de outro tenant) e corrigida no redirect
 * - Usuario pode acessar multiplos tenants no mesmo navegador
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import { signIn } from "@/auth";
import { getTenantFromHost, isAdminHost } from "@/lib/auth/providers/keycloak-factory";
import { NextRequest, NextResponse } from "next/server";

/**
 * URL base do Keycloak real (para substituicao white-label)
 */
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || "https://idp.servidor.one";

/**
 * GET /api/auth/login
 *
 * Detecta o tenant pelo hostname e redireciona para o provider correto.
 * Suporta callbackUrl para redirecionar apos login.
 *
 * Query params:
 * - callbackUrl: URL para redirecionar apos login (default: "/")
 * - provider: Override do provider (opcional, para admin)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const providerOverride = searchParams.get("provider");

  // Detectar host do request
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "";

  // DEBUG: Log do host detectado
  console.log(`[Auth Login] Host detected: "${host}", X-Forwarded-Host: "${forwardedHost}"`);

  // Detectar se e acesso admin (admin.skyller.ai)
  const isAdmin = isAdminHost(host);

  // Determinar tenant e provider
  let tenantId: string;
  let providerId: string;

  if (providerOverride) {
    // Provider especificado explicitamente
    providerId = providerOverride;
    // SPEC-ORGS-001: nexus-admin usa KEYCLOAK_DEFAULT_REALM (Skyller)
    if (providerOverride === "nexus-admin") {
      tenantId = process.env.KEYCLOAK_DEFAULT_REALM || "Skyller";
    } else {
      tenantId = providerOverride.replace("keycloak-", "");
    }
  } else if (isAdmin) {
    // Admin access - usar nexus-admin
    // SPEC-ORGS-001: Usar KEYCLOAK_DEFAULT_REALM (Skyller) em vez de "master"
    providerId = "nexus-admin";
    tenantId = process.env.KEYCLOAK_DEFAULT_REALM || "Skyller";
  } else {
    // Tenant access - detectar pelo hostname
    tenantId = getTenantFromHost(host);
    providerId = `keycloak-${tenantId}`;
  }

  // Construir base URL do tenant para white-label
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const tenantBaseUrl = forwardedHost && !forwardedHost.includes("localhost")
    ? `${forwardedProto}://${forwardedHost}`
    : `${forwardedProto}://${request.headers.get("host") || "localhost:3004"}`;

  // DEBUG: Log das URLs
  console.log(`[Auth Login] Provider: ${providerId}, Tenant: ${tenantId}, TenantBaseUrl: ${tenantBaseUrl}`);

  try {
    // MULTI-TENANT FIX: Setar AUTH_URL ANTES do signIn para garantir callback URL correta
    // Isso e necessario porque o NextAuth usa AUTH_URL para gerar a callback URL
    // e process.env e global (compartilhado entre requests)
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
        // MULTI-TENANT FIX: NextAuth cacheia o primeiro provider
        // e ignora os demais. Precisamos corrigir TUDO na URL:
        // 1. Host do Keycloak (white-label)
        // 2. Realm (pode estar errado)
        // 3. Callback URL (pode estar errada)
        // 4. Provider no callback (pode estar errado)
        // =========================================================

        // 1. WHITE-LABEL: Substituir URL do Keycloak real pela URL do subdominio
        if (redirectUrl.includes(KEYCLOAK_BASE_URL)) {
          redirectUrl = redirectUrl.replace(KEYCLOAK_BASE_URL, tenantBaseUrl);
        }

        // 2. REALM FIX: Corrigir realm errado na URL
        // Exemplo: /realms/skills/ -> /realms/wga/
        redirectUrl = redirectUrl.replace(
          /\/realms\/[a-z0-9_-]+\//gi,
          `/realms/${tenantId}/`
        );

        // 3. CALLBACK URL FIX: Corrigir o dominio do callback
        // Exemplo: https://skills.skyller.ai/api/auth/callback/... -> https://wga.skyller.ai/api/auth/callback/...
        redirectUrl = redirectUrl.replace(
          /https:\/\/[a-z0-9-]+\.skyller\.ai\/api\/auth\/callback\//gi,
          `${tenantBaseUrl}/api/auth/callback/`
        );

        // 4. PROVIDER FIX: Corrigir o provider ID no callback
        // Exemplo: /callback/keycloak-skills -> /callback/keycloak-wga
        redirectUrl = redirectUrl.replace(
          /\/callback\/keycloak-[a-z0-9_-]+/gi,
          `/callback/keycloak-${tenantId}`
        );

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
