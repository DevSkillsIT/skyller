/**
 * JWT Callback with robust claims extraction and fallbacks.
 *
 * @description This callback extracts custom claims from Keycloak tokens,
 * applies fallbacks for missing claims, and stores tokens for API calls.
 *
 * SPEC-ORGS-001: Handles organization as OBJECT (Keycloak 26)
 */

import { jwtDecode } from "jwt-decode";
import type { Account, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import {
  extractClaim,
  extractGroups,
  extractRoles,
  extractTenant,
} from "@/lib/auth/helpers/extract-claims";
import type { KeycloakToken } from "@/lib/auth/types";
import type { OrganizationClaim } from "@/types/next-auth";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

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
    const tenant = extractTenant(profile);
    let tenantId = tenant.tenant_id;
    let tenantSlug = tenant.tenant_slug;
    let tenantName = tenant.tenant_name;

    if (!tenantId && account?.access_token) {
      try {
        const decoded = jwtDecode<KeycloakToken>(account.access_token);

        // Garantir consistencia do user_id com o access_token
        if (decoded.sub) {
          token.sub = decoded.sub;
        }

        // Keycloak 26: tenant_uuid dentro de organization
        // Formato: {"skills": {"tenant_uuid": ["uuid"], "id": "..."}}
        const orgObj = decoded.organization as Record<string, { tenant_uuid?: string[] }> | undefined;
        if (orgObj && typeof orgObj === "object" && !Array.isArray(orgObj)) {
          const firstAlias = Object.keys(orgObj)[0];
          const orgData = firstAlias ? orgObj[firstAlias] : undefined;
          if (orgData?.tenant_uuid?.[0] && isUuid(orgData.tenant_uuid[0])) {
            tenantId = orgData.tenant_uuid[0];
            tenantSlug = firstAlias;
          }
        }

        // Fallback: claim direto
        if (!tenantId) {
          tenantId = isUuid(decoded.tenant_uuid) ? decoded.tenant_uuid : "";
        }
        if (!tenantSlug) {
          tenantSlug = decoded.tenant_slug || "";
        }
        if (!tenantName) {
          tenantName = decoded.tenant_name || tenantSlug || "";
        }
      } catch (error) {
        console.error("[JWT Callback] Failed to decode tenant_uuid:", error);
      }
    }

    token.tenant_id = tenantId;
    token.tenant_slug = tenantSlug;
    token.tenant_name = tenantName;
    if (!tenantId) {
      token.error = "MissingTenantUUID";
    }

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
    token.idToken = account.id_token; // Para logout no Keycloak (id_token_hint)
    token.expiresAt = account.expires_at;

    // SPEC-ORGS-001: Extrair organization como OBJETO do access_token
    if (account.access_token) {
      try {
        const decoded = jwtDecode<{ organization?: OrganizationClaim }>(account.access_token);

        // CRITICAL: organization é OBJETO com aliases como keys
        const orgObject = decoded.organization || {};
        const organizationAliases = Object.keys(orgObject);

        token.organizations = organizationAliases;
        token.organizationObject = orgObject;
        token.activeOrganization = organizationAliases[0] || null;
      } catch (error) {
        console.error("[JWT Callback] Failed to decode organization from access_token:", error);
        token.organizations = [];
        token.organizationObject = {};
        token.activeOrganization = null;
      }
    }

    // Debug em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("[JWT Callback] Claims extracted:", {
        tenant_id: token.tenant_id,
        roles: token.roles,
        groups: token.groups,
        clientId: token.clientId,
        organizations: token.organizations,
        activeOrganization: token.activeOrganization,
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
