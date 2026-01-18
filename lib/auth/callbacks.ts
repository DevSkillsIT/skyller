/**
 * NextAuth Callbacks - JWT and Session Management
 *
 * @description Handles JWT token processing and session creation.
 * Extracts custom Keycloak claims including multi-organization support.
 *
 * SPEC-ORGS-001: Multi-Organization Support
 * - Extrai organization[] claim do JWT
 * - Mapeia organization[0] para tenant_id (compatibilidade)
 * - Suporta usuários multi-org (organization.length > 1)
 */

import { jwtDecode } from "jwt-decode";
import type { Account, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { KeycloakToken } from "@/lib/auth/types";

/**
 * JWT callback - Processa tokens do Keycloak e extrai claims customizados.
 *
 * Executado quando:
 * - Usuário faz login (account e profile disponíveis)
 * - Token é atualizado (apenas token disponível)
 *
 * @param params - Parâmetros do callback (token, account, profile, user)
 * @returns Token JWT atualizado com claims customizados
 */
export async function jwtCallback({
  token,
  account,
  profile,
  user,
}: {
  token: JWT;
  account?: Account | null;
  profile?: Profile;
  user?: User;
}): Promise<JWT> {
  // Login inicial: extrair dados do account/profile
  if (account && profile) {
    try {
      // Decodificar access_token do Keycloak
      const decoded = jwtDecode<KeycloakToken>(account.access_token || "");

      // ════════════════════════════════════════════════════════════════════
      // SPEC-ORGS-001: Multi-Organization Support
      // ════════════════════════════════════════════════════════════════════
      // Extrai organization[] claim do JWT (Keycloak Organizations)
      // - organization: ["skills", "ramada"] para usuários multi-org
      // - organization: ["skills"] para usuários single-org
      // - organization: [] ou undefined para usuários sem organization
      const organization = decoded.organization || [];

      // Mapear organization[0] para tenant_id (compatibilidade)
      // Se organization[] está vazio, usar tenant_id direto do token
      const tenant_id = organization[0] || decoded.tenant_id || "default";

      // Armazenar no token JWT
      token.organization = organization;
      token.tenant_id = tenant_id;
      token.tenant_slug = decoded.tenant_slug || tenant_id;
      token.tenant_name = decoded.tenant_name || tenant_id;

      // ════════════════════════════════════════════════════════════════════
      // Authorization Claims
      // ════════════════════════════════════════════════════════════════════
      token.groups = decoded.groups || [];

      // Extrair roles (priorizar resource_access, fallback para realm_access)
      let roles: string[] = [];
      const clientId = decoded.azp || "skyller"; // azp = authorized party (client ID)

      if (decoded.resource_access?.[clientId]?.roles) {
        roles = decoded.resource_access[clientId].roles;
      } else if (decoded.realm_access?.roles) {
        roles = decoded.realm_access.roles;
      }

      token.roles = roles;

      // ════════════════════════════════════════════════════════════════════
      // Optional Claims
      // ════════════════════════════════════════════════════════════════════
      token.department = decoded.department || "";
      token.company = decoded.company || "";
      token.clientId = clientId;

      // ════════════════════════════════════════════════════════════════════
      // Tokens for Backend API Calls
      // ════════════════════════════════════════════════════════════════════
      token.accessToken = account.access_token;
      token.refreshToken = account.refresh_token;
      token.expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 3600000; // exp em ms

      if (process.env.NODE_ENV === "development") {
        console.log("[Callbacks] JWT created:", {
          tenant_id: token.tenant_id,
          organization: token.organization,
          multi_org: organization.length > 1,
          roles: roles.length,
          groups: token.groups.length,
        });
      }
    } catch (error) {
      console.error("[Callbacks] Failed to decode access token:", error);
      token.error = "TokenDecodeError";
    }
  }

  // Login via user object (fallback quando account não está disponível)
  if (user && !token.tenant_id) {
    token.tenant_id = user.tenant_id || "default";
    token.tenant_slug = user.tenant_slug || user.tenant_id || "default";
    token.tenant_name = user.tenant_name || user.tenant_id || "default";
    token.organization = user.organization || [];
    token.roles = user.roles || [];
    token.groups = user.groups || [];
    token.department = user.department || "";
    token.company = user.company || "";
    token.clientId = user.clientId || "skyller";
  }

  // TODO: Token refresh quando expiresAt se aproxima
  // if (token.expiresAt && Date.now() > token.expiresAt - 300000) {
  //   return await refreshAccessToken(token);
  // }

  return token;
}

/**
 * Session callback - Cria session object disponível no cliente.
 *
 * Executado toda vez que session é acessada (getSession, useSession).
 *
 * @param params - Parâmetros do callback (session, token)
 * @returns Session object com dados do usuário
 */
export async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> {
  // Mapear dados do JWT para a session
  if (token && session.user) {
    session.user.id = token.sub || "";
    session.user.tenant_id = token.tenant_id || "default";
    session.user.tenant_slug = token.tenant_slug || "default";
    session.user.tenant_name = token.tenant_name || "default";

    // ════════════════════════════════════════════════════════════════════
    // SPEC-ORGS-001: Expor organization array na session
    // ════════════════════════════════════════════════════════════════════
    session.user.organization = token.organization || [];

    // Authorization
    session.user.roles = token.roles || [];
    session.user.groups = token.groups || [];

    // Optional
    session.user.department = token.department || "";
    session.user.company = token.company || "";
    session.user.clientId = token.clientId || "skyller";

    // Access token para chamadas ao backend
    session.accessToken = token.accessToken;

    // Error state
    session.error = token.error;

    if (process.env.NODE_ENV === "development") {
      console.log("[Callbacks] Session created:", {
        user_id: session.user.id,
        tenant_id: session.user.tenant_id,
        organization: session.user.organization,
        multi_org: session.user.organization.length > 1,
        email: session.user.email,
      });
    }
  }

  return session;
}
