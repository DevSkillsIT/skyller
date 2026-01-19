/**
 * JWT Callback with robust claims extraction and fallbacks.
 *
 * @description This callback extracts custom claims from Keycloak tokens,
 * applies fallbacks for missing claims, and stores tokens for API calls.
 */

import type { JWT } from "next-auth/jwt";
import type { Account, Profile } from "next-auth";
import { extractClaim, extractRoles, extractGroups } from "@/lib/auth/helpers/extract-claims";

interface JWTCallbackParams {
  token: JWT;
  account?: Account | null;
  profile?: Profile;
}

/**
 * JWT Callback com extracao robusta de claims e fallbacks.
 *
 * Este callback:
 * 1. Extrai claims customizados do Keycloak
 * 2. Aplica fallbacks para claims ausentes
 * 3. Armazena tokens para refresh
 *
 * @param params - JWT callback parameters
 * @returns Updated JWT token
 */
export async function jwtCallback({ token, account, profile }: JWTCallbackParams): Promise<JWT> {
  // Apenas processar no primeiro login
  if (account && profile) {
    // Claims essenciais com fallbacks
    token.tenant_id = extractClaim(profile, "tenant_id", "default");
    token.tenant_name = extractClaim(profile, "tenant_name", token.tenant_id as string);
    token.tenant_slug = extractClaim(profile, "tenant_slug", token.tenant_id as string);

    // Arrays com fallback para vazio
    token.groups = extractGroups(profile);
    token.roles = extractRoles(profile, account.provider || "skyller");

    // Campos opcionais
    token.department = extractClaim(profile, "department", "");
    token.company = extractClaim(profile, "company", "");

    // Identificacao
    token.email = profile.email || "";
    token.name = profile.name || profile.preferred_username || "Usuario";
    token.clientId = account.provider; // skyller ou nexus-admin

    // Tokens para API calls e refresh
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at;

    // Debug em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("[JWT Callback] Claims extracted:", {
        tenant_id: token.tenant_id,
        roles: token.roles,
        groups: token.groups,
        clientId: token.clientId,
      });
    }
  }

  // Token refresh logic (future implementation)
  // TODO: Implement token refresh when expired
  // if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
  //   try {
  //     const refreshedTokens = await refreshAccessToken(token);
  //     return { ...token, ...refreshedTokens };
  //   } catch (error) {
  //     console.error("[JWT Callback] Token refresh failed:", error);
  //     return { ...token, error: "RefreshAccessTokenError" };
  //   }
  // }

  return token;
}

/**
 * Refresh access token using refresh token.
 *
 * @param token - Current JWT token
 * @returns Refreshed token data
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function refreshAccessToken(token: JWT): Promise<Partial<JWT>> {
  const tokenEndpoint = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.KEYCLOAK_SKYLLER_CLIENT_ID || "skyller",
      client_secret: process.env.KEYCLOAK_SKYLLER_CLIENT_SECRET || "",
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const refreshedTokens = await response.json();

  return {
    accessToken: refreshedTokens.access_token,
    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
  };
}
