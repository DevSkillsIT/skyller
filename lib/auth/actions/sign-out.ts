"use server";

import { auth, signOut } from "@/auth";
import { getClientId, getIssuer } from "@/lib/auth/helpers/issuer";
import { getTenantConfig } from "@/lib/auth/providers/keycloak-factory";

/**
 * Gera a URL de logout do Keycloak (end_session_endpoint).
 *
 * IMPORTANTE: O logout do Auth.js sozinho NAO desloga do Keycloak.
 * E necessario redirecionar para o endpoint de logout do Keycloak
 * para invalidar a sessao do IdP.
 *
 * @param callbackUrl - URL para redirect apos logout completo
 * @param idTokenHint - ID token para hint de sessao (opcional, melhora UX)
 * @returns URL completa do endpoint de logout do Keycloak
 *
 * @example
 * const logoutUrl = await generateKeycloakLogoutUrl("https://app.skyller.ai");
 * // Retorna: https://tenant.skyller.ai/auth/realms/skyller/protocol/openid-connect/logout?...
 */
export async function generateKeycloakLogoutUrl(
  callbackUrl: string,
  idTokenHint?: string,
  tenantId?: string
): Promise<string> {
  const issuer = getIssuer(tenantId);
  const clientId = getClientId(tenantId);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  // O post_logout_redirect_uri deve apontar para nossa rota de logout
  // que finaliza a sessao do Auth.js
  params.append("post_logout_redirect_uri", `${callbackUrl}/api/auth/logout`);

  if (idTokenHint) {
    params.append("id_token_hint", idTokenHint);
  }

  return `${issuer}/protocol/openid-connect/logout?${params.toString()}`;
}

/**
 * Invalida a sessao do Keycloak via backchannel (server-side).
 *
 * Faz uma chamada HTTP para o endpoint de logout do Keycloak
 * usando o refresh_token para invalidar a sessao sem redirect.
 *
 * @param refreshToken - Refresh token da sessao atual
 * @param tenantId - ID do tenant
 * @returns true se logout foi bem sucedido
 */
async function invalidateKeycloakSession(
  refreshToken: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const issuer = getIssuer(tenantId);
    const tenant = tenantId || process.env.DEFAULT_TENANT || "skills";
    const config = getTenantConfig(tenant);

    const logoutUrl = `${issuer}/protocol/openid-connect/logout`;

    const response = await fetch(logoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (response.ok || response.status === 204) {
      console.log("[SignOut] Keycloak session invalidated successfully");
      return true;
    }

    console.warn("[SignOut] Keycloak logout returned:", response.status);
    return false;
  } catch (error) {
    console.error("[SignOut] Failed to invalidate Keycloak session:", error);
    return false;
  }
}

/**
 * Server Action para sign-out COMPLETO.
 *
 * Realiza o logout:
 * 1. Invalida a sessao do Keycloak via backchannel (sem redirect externo)
 * 2. Limpa a sessao do Auth.js
 * 3. Redireciona para a URL especificada (dentro do dominio)
 *
 * @param callbackUrl - URL para redirect apos logout (padrao: "/")
 *
 * @example
 * // Em um Server Component
 * await signOutFromKeycloak("/login");
 *
 * @example
 * // Em um form action
 * <form action={async () => {
 *   "use server";
 *   await signOutFromKeycloak();
 * }}>
 *   <button type="submit">Sair</button>
 * </form>
 */
export async function signOutFromKeycloak(callbackUrl?: string): Promise<void> {
  const redirectTo = callbackUrl || "/";

  // 1. Obter sessao atual para pegar o refresh_token
  const session = await auth();

  // 2. Invalidar sessao do Keycloak via backchannel (se tiver refresh token)
  if (session?.refreshToken) {
    await invalidateKeycloakSession(session.refreshToken, session.user?.tenant_slug);
  }

  // 3. Limpar sessao do Auth.js e redirecionar
  await signOut({
    redirect: true,
    redirectTo,
  });
}

/**
 * Server Action para obter a URL de logout do Keycloak.
 *
 * Util quando voce precisa da URL para construir um link
 * em vez de executar o logout diretamente.
 *
 * @param idToken - ID token da sessao atual (opcional)
 * @returns URL de logout do Keycloak
 *
 * @example
 * const logoutUrl = await getKeycloakLogoutUrl(session.idToken);
 * // Use em um <a href={logoutUrl}>Sair</a>
 */
export async function getKeycloakLogoutUrl(idToken?: string): Promise<string> {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3004";
  return generateKeycloakLogoutUrl(baseUrl, idToken);
}

/**
 * Server Action para logout completo com redirect limpo.
 *
 * Alias para signOutFromKeycloak - mantido para compatibilidade.
 */
export async function signOutComplete(): Promise<void> {
  return signOutFromKeycloak("/");
}
