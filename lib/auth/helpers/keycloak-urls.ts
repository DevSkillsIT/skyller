/**
 * Helpers for generating Keycloak URLs.
 *
 * @description Provides URL generation for Keycloak logout,
 * token refresh, and other OIDC endpoints.
 */

/**
 * Generate Keycloak logout URL.
 *
 * @param redirectUrl - URL to redirect after logout
 * @param idToken - ID token for logout hint (optional)
 * @returns Full Keycloak logout URL
 */
export function generateKeycloakLogoutUrl(redirectUrl: string, idToken?: string): string {
  const clientId = process.env.KEYCLOAK_SKYLLER_CLIENT_ID || "skyller";
  const issuer = process.env.KEYCLOAK_ISSUER || "";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("post_logout_redirect_uri", `${redirectUrl}/api/auth/logout`);

  if (idToken) {
    params.append("id_token_hint", idToken);
  }

  return `${issuer}/protocol/openid-connect/logout?${params.toString()}`;
}

/**
 * Get Keycloak issuer URL.
 *
 * In production, uses template with tenant host substitution.
 * In development, uses direct issuer URL.
 *
 * @param tenantHost - Optional tenant host for production
 * @returns Keycloak issuer URL
 */
export function getKeycloakIssuer(tenantHost?: string): string {
  if (process.env.NODE_ENV === "production" && tenantHost) {
    const template =
      process.env.KEYCLOAK_ISSUER_TEMPLATE || "https://${TENANT_HOST}/auth/realms/skyller";
    return template.replace("${TENANT_HOST}", tenantHost);
  }

  return process.env.KEYCLOAK_ISSUER || "https://idp.servidor.one/realms/skyller";
}

/**
 * Generate Keycloak token endpoint URL.
 *
 * @returns Token endpoint URL
 */
export function getTokenEndpoint(): string {
  const issuer = process.env.KEYCLOAK_ISSUER || "";
  return `${issuer}/protocol/openid-connect/token`;
}

/**
 * Generate Keycloak userinfo endpoint URL.
 *
 * @returns Userinfo endpoint URL
 */
export function getUserInfoEndpoint(): string {
  const issuer = process.env.KEYCLOAK_ISSUER || "";
  return `${issuer}/protocol/openid-connect/userinfo`;
}

/**
 * Generate Keycloak authorization endpoint URL.
 *
 * @returns Authorization endpoint URL
 */
export function getAuthorizationEndpoint(): string {
  const issuer = process.env.KEYCLOAK_ISSUER || "";
  return `${issuer}/protocol/openid-connect/auth`;
}

/**
 * Generate Keycloak end session endpoint URL.
 *
 * @returns End session endpoint URL
 */
export function getEndSessionEndpoint(): string {
  const issuer = process.env.KEYCLOAK_ISSUER || "";
  return `${issuer}/protocol/openid-connect/logout`;
}

/**
 * Build OAuth callback URL for NextAuth.
 *
 * @param baseUrl - Base URL of the application
 * @param provider - Provider ID (e.g., "skyller", "nexus-admin")
 * @returns Full callback URL
 */
export function buildCallbackUrl(baseUrl: string, provider: string): string {
  return `${baseUrl}/api/auth/callback/${provider}`;
}
