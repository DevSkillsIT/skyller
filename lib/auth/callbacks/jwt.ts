/**
 * JWT Callback - Ultra-Minimal Token Storage
 *
 * @description This callback stores ONLY the tokens needed for API calls and refresh.
 * All user claims are extracted from accessToken in sessionCallback.
 *
 * OPTIMIZATION: Reduces cookie size by ~50% by:
 * - Not duplicating claims already in accessToken
 * - Storing only accessToken/refreshToken/expiresAt/clientId
 *
 * Before: accessToken + refreshToken + groups + org + email + ... = ~9KB cookie
 * After: accessToken + refreshToken + clientId = ~4-5KB cookie (target)
 *
 * SPEC-ORGS-001: Handles organization as OBJECT (Keycloak 26)
 */

import { jwtDecode } from "jwt-decode";
import type { Account, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { KeycloakToken } from "@/lib/auth/types";

interface JWTCallbackParams {
  token: JWT;
  account?: Account | null;
  profile?: Profile;
}

/**
 * JWT Callback - Armazena APENAS tokens essenciais para API calls e refresh.
 *
 * IMPORTANTE: Claims do usuario NAO sao armazenados aqui para evitar duplicacao.
 * O accessToken ja contem todos os claims (groups, org, email, etc).
 * A sessionCallback decodifica o accessToken para popular session.user.
 *
 * Este callback armazena apenas:
 * - accessToken: Para chamadas de API (Bearer token)
 * - refreshToken: Para renovacao automatica
 * - expiresAt: Para saber quando renovar
 * - clientId: Para identificar o provider usado
 *
 * @param params - JWT callback parameters
 * @returns Updated JWT token (minimal)
 */
export async function jwtCallback({ token, account, profile }: JWTCallbackParams): Promise<JWT> {
  // Apenas processar no primeiro login
  if (account && profile) {
    // Garantir consistencia do user_id com o access_token
    if (account.access_token) {
      try {
        const decoded = jwtDecode<KeycloakToken>(account.access_token);
        if (decoded.sub) {
          token.sub = decoded.sub;
        }
      } catch (error) {
        console.error("[JWT Callback] Failed to decode sub from access_token:", error);
      }
    }

    // MINIMAL STORAGE: Apenas tokens necessarios para API calls e refresh
    // NAO armazenar claims duplicados (groups, org, email, etc) - ja estao no accessToken
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at;
    token.clientId = account.provider; // skyller ou nexus-admin

    // Debug em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      const tokenSize = JSON.stringify({
        sub: token.sub,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
        clientId: token.clientId,
      }).length;
      console.log("[JWT Callback] Minimal token stored:", {
        sub: token.sub,
        clientId: token.clientId,
        tokenSize: `${tokenSize} bytes (before JWE)`,
        hasRefreshToken: !!token.refreshToken,
      });
    }
  }

  // Token refresh logic - SPEC-AUTH-REFRESH-001
  // Faz refresh proativo do token quando está prestes a expirar (30 segundos antes)
  // Isso evita erros 401 TOKEN_EXPIRED na primeira requisição após expiração
  const expiresAt = token.expiresAt as number | undefined;
  const bufferSeconds = 30; // Refresh 30 segundos antes de expirar

  if (expiresAt && Date.now() >= expiresAt * 1000 - bufferSeconds * 1000) {
    try {
      if (!token.refreshToken) {
        console.warn("[JWT Callback] refreshToken ausente - usuário precisa re-login");
        return { ...token, error: "RefreshAccessTokenError" };
      }
      console.log("[JWT Callback] Token próximo de expirar, iniciando refresh...");
      const refreshedTokens = await refreshAccessToken(token);
      console.log("[JWT Callback] Token refreshed com sucesso");
      return { ...token, ...refreshedTokens, error: undefined };
    } catch (error) {
      console.error("[JWT Callback] Token refresh failed:", error);
      // Retorna o token antigo com flag de erro
      // Isso permite que o usuário tente novamente ou faça re-login
      return { ...token, error: "RefreshAccessTokenError" };
    }
  }

  return token;
}

/**
 * Refresh access token using refresh token.
 *
 * SPEC-AUTH-REFRESH-001: Renova o access_token usando o refresh_token do Keycloak.
 * Chamado automaticamente pelo jwtCallback quando o token está prestes a expirar.
 *
 * @param token - Current JWT token
 * @returns Refreshed token data
 */
async function refreshAccessToken(token: JWT): Promise<Partial<JWT>> {
  const tokenEndpoint = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID || "skyller",
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET || "",
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
