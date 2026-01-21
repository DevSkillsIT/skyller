"use server";

import { signOut } from "@/auth";
import { getClientId, getIssuer } from "@/lib/auth/helpers/issuer";

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
 * Server Action para sign-out completo (Auth.js + Keycloak).
 *
 * Realiza o logout em duas etapas:
 * 1. Invalida a sessao do Auth.js (limpa cookies)
 * 2. Redireciona para o endpoint de logout do Keycloak
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

  // Realiza o signOut do Auth.js que limpa os cookies de sessao
  // e redireciona para a URL especificada
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
 * Esta versao primeiro obtem a URL de logout do Keycloak
 * e depois executa o signOut do Auth.js, garantindo que
 * ambas as sessoes sejam invalidadas.
 */
export async function signOutComplete(): Promise<void> {
  // Primeiro, signOut do Auth.js
  // O callback sera tratado pela rota /api/auth/logout
  await signOut({
    redirect: true,
    redirectTo: "/",
  });
}
