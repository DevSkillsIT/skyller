/**
 * Session Callback - Extract Claims from AccessToken
 *
 * @description Decodes accessToken to extract user claims on each request.
 * This avoids storing duplicate claims in the JWT cookie.
 *
 * OPTIMIZATION: Claims are decoded from accessToken at request time,
 * not stored in cookie. This reduces cookie size by ~50%.
 *
 * SPEC-ORGS-001: Extracts organization from accessToken (Keycloak 26 format)
 */

import { jwtDecode } from "jwt-decode";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { KeycloakToken } from "@/lib/auth/types";
import type { OrganizationClaim } from "@/types/next-auth";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

interface SessionCallbackParams {
  session: Session;
  token: JWT;
}

/**
 * Extrai tenant info do objeto organization do Keycloak 26.
 *
 * Formato esperado:
 * {
 *   "skills": {           // <-- chave é o tenant_slug (alias)
 *     "tenant_uuid": ["uuid-real"],
 *     "id": "org-id"
 *   }
 * }
 */
function extractTenantFromOrganization(
  orgObj: OrganizationClaim | undefined
): { tenant_id: string; tenant_slug: string } {
  if (!orgObj || typeof orgObj !== "object" || Array.isArray(orgObj)) {
    return { tenant_id: "", tenant_slug: "" };
  }

  const firstAlias = Object.keys(orgObj)[0];
  if (!firstAlias) {
    return { tenant_id: "", tenant_slug: "" };
  }

  const orgData = orgObj[firstAlias];
  const tenantUuidArray = orgData?.tenant_uuid;
  const tenantId = Array.isArray(tenantUuidArray) && isUuid(tenantUuidArray[0])
    ? tenantUuidArray[0]
    : "";

  return {
    tenant_id: tenantId,
    tenant_slug: firstAlias,
  };
}

/**
 * Session Callback que decodifica accessToken para extrair claims.
 *
 * IMPORTANTE: Nao armazenamos claims no cookie JWT.
 * Em cada request, decodificamos o accessToken para popular session.user.
 * Isso reduz o tamanho do cookie em ~50%.
 *
 * @param params - Session callback parameters
 * @returns Updated session
 */
export async function sessionCallback({ session, token }: SessionCallbackParams): Promise<Session> {
  const accessToken = token.accessToken as string | undefined;

  // Valores default
  let decoded: KeycloakToken | null = null;
  let tenantId = "";
  let tenantSlug = "";
  let tenantName = "";
  let groups: string[] = [];
  let roles: string[] = [];
  let email = "";
  let name = "Usuario";
  let department = "";
  let company = "";
  let organizations: string[] = [];
  let organizationObject: OrganizationClaim = {};

  // Decodificar accessToken para extrair claims
  if (accessToken) {
    try {
      decoded = jwtDecode<KeycloakToken>(accessToken);

      // Extrair organization object (Keycloak 26 format)
      const orgClaim = decoded.organization;
      if (orgClaim && typeof orgClaim === "object" && !Array.isArray(orgClaim)) {
        organizationObject = orgClaim as OrganizationClaim;
        organizations = Object.keys(organizationObject);

        // Extrair tenant_id (UUID) e tenant_slug (alias) do organization
        const tenant = extractTenantFromOrganization(organizationObject);
        tenantId = tenant.tenant_id;
        tenantSlug = tenant.tenant_slug;
      } else if (Array.isArray(orgClaim)) {
        // Fallback para formato legado (array de strings)
        organizations = orgClaim;
        tenantSlug = orgClaim[0] || "";
      }

      // Fallback: claims diretos se organization nao tiver UUID
      if (!tenantId && isUuid(decoded.tenant_uuid)) {
        tenantId = decoded.tenant_uuid;
      }
      if (!tenantSlug && decoded.tenant_slug) {
        tenantSlug = decoded.tenant_slug;
      }

      // tenant_name do claim ou fallback para slug
      tenantName = decoded.tenant_name || tenantSlug || "";

      // Groups e roles
      groups = decoded.groups || [];

      // Roles: client-specific ou realm
      const clientId = (token.clientId as string) || "skyller";
      if (decoded.resource_access?.[clientId]?.roles) {
        roles = decoded.resource_access[clientId].roles;
      } else if (decoded.realm_access?.roles) {
        roles = decoded.realm_access.roles;
      }

      // Campos basicos
      email = decoded.email || "";
      name = decoded.name || decoded.preferred_username || "Usuario";
      department = decoded.department || "";
      company = decoded.company || "";

    } catch (error) {
      console.error("[Session Callback] Failed to decode accessToken:", error);
    }
  }

  session.user = {
    ...session.user,
    id: (token.sub as string) || "",
    tenant_id: tenantId,
    tenant_name: tenantName,
    tenant_slug: tenantSlug,
    groups,
    roles,
    department,
    company,
    email,
    name,
    clientId: (token.clientId as string) || "skyller",
    // SPEC-ORGS-001: Organization fields
    organizations,
    organizationObject,
    activeOrganization: tenantSlug || null,
  };

  // Expor access token para API calls (BFF pattern)
  session.accessToken = token.accessToken as string;
  session.error = token.error as string | undefined;

  return session;
}
