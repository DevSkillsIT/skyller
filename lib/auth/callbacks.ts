/**
 * NextAuth Callbacks - JWT and Session Management
 *
 * @description Handles JWT token processing and session creation.
 * Extracts custom Keycloak claims including multi-organization support.
 *
 * SPEC-ORGS-001: Multi-Organization Support
 * - Extrai organization[] claim do JWT
 * - Mantem tenant_id como UUID (sem fallback para slug)
 * - Suporta usuários multi-org (organization.length > 1)
 */

import { jwtDecode } from "jwt-decode";
import type { Account, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { KeycloakToken } from "@/lib/auth/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

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
      // GAP-CRIT-01 FIX: Garantir consistência do user_id com access_token
      // ════════════════════════════════════════════════════════════════════
      // O backend extrai user_id do claim 'sub' do access_token.
      // NextAuth define token.sub automaticamente do profile/id_token.
      // Para garantir que X-User-ID header corresponda ao JWT do backend,
      // definimos explicitamente token.sub do access_token decodificado.
      if (decoded.sub) {
        token.sub = decoded.sub;
      }

      // ════════════════════════════════════════════════════════════════════
      // SPEC-ORGS-001: Multi-Organization Support
      // ════════════════════════════════════════════════════════════════════
      // Extrai organization[] claim do JWT (Keycloak Organizations)
      // - organization: ["skills", "ramada"] para usuários multi-org
      // - organization: ["skills"] para usuários single-org
      // - organization: [] ou undefined para usuários sem organization
      const organization = decoded.organization || [];

      const tenant_uuid = isUuid((decoded as KeycloakToken & { tenant_uuid?: string }).tenant_uuid)
        ? (decoded as KeycloakToken & { tenant_uuid?: string }).tenant_uuid
        : isUuid(decoded.tenant_id)
          ? decoded.tenant_id
          : undefined;
      const tenant_slug = decoded.tenant_slug || organization[0] || "";
      const tenant_id = tenant_uuid;

      // Armazenar no token JWT
      token.organization = organization;
      token.tenant_id = tenant_id;
      token.tenant_slug = tenant_slug;
      token.tenant_name = decoded.tenant_name || tenant_slug;
      if (!tenant_id) {
        token.error = "MissingTenantUUID";
      }

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
    const candidate = isUuid(user.tenant_id) ? user.tenant_id : undefined;
    token.tenant_id = candidate;
    token.tenant_slug = user.tenant_slug || "";
    token.tenant_name = user.tenant_name || token.tenant_slug || "";
    token.organization = user.organization || [];
    token.roles = user.roles || [];
    token.groups = user.groups || [];
    token.department = user.department || "";
    token.company = user.company || "";
    token.clientId = user.clientId || "skyller";
    if (!token.tenant_id) {
      token.error = "MissingTenantUUID";
    }
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
    session.user.tenant_id = token.tenant_id || "";
    session.user.tenant_slug = token.tenant_slug || "";
    session.user.tenant_name = token.tenant_name || "";

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

    // Refresh token para logout no Keycloak (backchannel)
    session.refreshToken = token.refreshToken;

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
