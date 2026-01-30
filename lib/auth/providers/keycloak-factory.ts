/**
 * Factory for creating Keycloak providers - Dynamic Multi-Tenant
 *
 * @description Creates Keycloak providers dynamically from environment variables.
 * NO CODE CHANGES needed to add new tenants - just add env vars.
 *
 * Required env vars per tenant:
 * - KEYCLOAK_TENANTS=skills,ramada,lindacor (comma-separated list)
 * - KEYCLOAK_CLIENT_SECRET_SKILLS=xxx
 * - KEYCLOAK_CLIENT_SECRET_RAMADA=xxx
 * - KEYCLOAK_TENANT_NAME_SKILLS=Skills IT (optional display name)
 *
 * @see KEYCLOAK-MULTI-TENANT-AD.md
 */

import { jwtDecode } from "jwt-decode";
import KeycloakProvider from "next-auth/providers/keycloak";
import type { KeycloakToken } from "../types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

/**
 * Tenant configuration type
 */
interface TenantConfig {
  realm: string;
  clientId: string;
  clientSecret: string;
  displayName: string;
}

/**
 * Keycloak base URL (servidor real - usado para token verification e server-to-server)
 *
 * IMPORTANTE: Esta URL e usada apenas para comunicacao servidor-servidor
 * (token exchange, userinfo, etc). O redirect do usuario usa o path
 * /auth/ do subdominio via nginx reverse proxy (white-label).
 */
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || "https://idp.servidor.one";

/**
 * Habilitar white-label auth (usuario permanece no subdominio)
 * Quando true, authorization URLs usam /auth/ path do subdominio
 */
const _WHITE_LABEL_AUTH = process.env.WHITE_LABEL_AUTH !== "false";

/**
 * Default tenant for development and fallback
 */
const DEFAULT_TENANT = process.env.DEFAULT_TENANT || "skills";

/**
 * Get list of configured tenants from environment.
 *
 * Reads KEYCLOAK_TENANTS env var (comma-separated).
 * If not set, returns default tenant only.
 *
 * @returns Array of tenant IDs
 */
function getConfiguredTenants(): string[] {
  const tenantsEnv = process.env.KEYCLOAK_TENANTS;
  if (!tenantsEnv) {
    // Fallback: buscar todas as variaveis KEYCLOAK_CLIENT_SECRET_*
    const tenants: string[] = [];
    for (const key of Object.keys(process.env)) {
      const match = key.match(/^KEYCLOAK_CLIENT_SECRET_([A-Z0-9_]+)$/);
      if (match) {
        tenants.push(match[1].toLowerCase());
      }
    }
    return tenants.length > 0 ? tenants : [DEFAULT_TENANT];
  }
  return tenantsEnv.split(",").map((t) => t.trim().toLowerCase());
}

/**
 * Get tenant configuration from environment variables.
 *
 * @param tenantId - Tenant identifier
 * @returns Tenant configuration
 */
function getTenantConfigFromEnv(tenantId: string): TenantConfig {
  const upperTenant = tenantId.toUpperCase();

  return {
    realm: tenantId,
    clientId: process.env[`KEYCLOAK_CLIENT_ID_${upperTenant}`] || "skyller",
    clientSecret: process.env[`KEYCLOAK_CLIENT_SECRET_${upperTenant}`] || "",
    displayName:
      process.env[`KEYCLOAK_TENANT_NAME_${upperTenant}`] ||
      tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
  };
}

/**
 * Cache of tenant configurations (built once at startup)
 */
let _tenantCache: Map<string, TenantConfig> | null = null;

function getTenantCache(): Map<string, TenantConfig> {
  if (!_tenantCache) {
    _tenantCache = new Map();
    for (const tenantId of getConfiguredTenants()) {
      _tenantCache.set(tenantId, getTenantConfigFromEnv(tenantId));
    }
  }
  return _tenantCache;
}

/**
 * Get tenant ID from hostname.
 *
 * Examples:
 * - skills.skyller.ai → skills
 * - ramada.skyller.ai → ramada
 * - admin.skyller.ai → "admin" (caso especial - usa nexus-admin)
 * - localhost:3004 → skills (default)
 *
 * @param host - Request hostname
 * @returns Tenant ID
 */
export function getTenantFromHost(host: string | null): string {
  if (!host) return DEFAULT_TENANT;

  // Development: localhost sempre usa tenant default
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return DEFAULT_TENANT;
  }

  // Extrair subdomain de [tenant].skyller.ai
  const match = host.match(/^([a-z0-9-]+)\.skyller\.ai/i);
  if (match) {
    const subdomain = match[1].toLowerCase();

    // Caso especial: admin.skyller.ai - retorna "admin" para ser tratado
    // pelo /api/auth/login que usara nexus-admin provider
    if (subdomain === "admin") {
      return "admin";
    }

    // Verificar se o tenant existe na configuracao
    if (getTenantCache().has(subdomain)) {
      return subdomain;
    }
  }

  return DEFAULT_TENANT;
}

/**
 * Verifica se o host e acesso admin (admin.skyller.ai).
 *
 * @param host - Request hostname
 * @returns true se for acesso admin
 */
export function isAdminHost(host: string | null): boolean {
  if (!host) return false;
  return host.toLowerCase().startsWith("admin.");
}

/**
 * Get tenant configuration.
 *
 * @param tenantId - Tenant identifier
 * @returns Tenant configuration or default
 */
export function getTenantConfig(tenantId: string): TenantConfig {
  const cache = getTenantCache();
  return cache.get(tenantId) || cache.get(DEFAULT_TENANT) || getTenantConfigFromEnv(tenantId);
}

/**
 * Get Keycloak issuer URL for a tenant.
 *
 * @param tenantId - Tenant identifier
 * @returns Issuer URL
 */
export function getIssuerForTenant(tenantId: string): string {
  const config = getTenantConfig(tenantId);
  return `${KEYCLOAK_BASE_URL}/realms/${config.realm}`;
}

/**
 * Get all available tenant IDs.
 *
 * @returns Array of tenant IDs
 */
export function getAvailableTenants(): string[] {
  return Array.from(getTenantCache().keys());
}

/**
 * Gera a URL de authorization white-label.
 *
 * NOTA: Esta funcao NAO e mais usada no provider config porque
 * NextAuth v5 valida URLs no startup com new URL() que falha
 * para paths relativos.
 *
 * O white-label e implementado no /api/auth/login route handler
 * que constroi a URL OAuth manualmente com base no host da request.
 *
 * @param realm - Realm do Keycloak
 * @param baseUrl - URL base (ex: https://skills.skyller.ai)
 * @returns URL absoluta para authorization
 */
export function getWhiteLabelAuthorizationUrl(realm: string, baseUrl: string): string {
  return `${baseUrl}/auth/realms/${realm}/protocol/openid-connect/auth`;
}

/**
 * Create a Keycloak provider for a specific tenant.
 *
 * WHITE-LABEL AUTH: O usuario permanece no subdominio do tenant durante
 * todo o fluxo de autenticacao. A URL visivel sera:
 *   https://skills.skyller.ai/auth/realms/skills/...
 * Em vez de:
 *   https://idp.servidor.one/realms/skills/...
 *
 * @param tenantId - Tenant identifier
 * @returns Configured KeycloakProvider
 */
export function createKeycloakProviderForTenant(tenantId: string) {
  const config = getTenantConfig(tenantId);
  const issuer = getIssuerForTenant(tenantId);

  if (!config.clientSecret) {
    console.warn(
      `[Keycloak Factory] Missing secret for tenant "${tenantId}". ` +
        `Set KEYCLOAK_CLIENT_SECRET_${tenantId.toUpperCase()} in environment.`
    );
  }

  // Configuracao de authorization
  // NOTA: NAO usamos authorization.url aqui porque NextAuth valida
  // URLs no startup e falha com paths relativos.
  // O white-label e implementado no /api/auth/login route handler.
  const authorizationConfig = {
    params: {
      scope: "openid email profile",
    },
  };

  return KeycloakProvider({
    id: `keycloak-${tenantId}`,
    name: `${config.displayName} Login`,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    issuer,

    authorization: authorizationConfig,

    profile(profile, tokens) {
      let decoded: KeycloakToken | null = null;
      try {
        if (tokens.access_token) {
          decoded = jwtDecode<KeycloakToken>(tokens.access_token);
        }
      } catch (error) {
        console.error("[Keycloak Factory] Failed to decode access token:", error);
      }

      let roles: string[] = [];
      if (decoded?.resource_access?.[config.clientId]?.roles) {
        roles = decoded.resource_access[config.clientId].roles;
      } else if (decoded?.realm_access?.roles) {
        roles = decoded.realm_access.roles;
      }

      // SPEC-ORGS-001: Extrair organization do token
      // Keycloak 26 retorna organization como objeto { alias, id } ou array de strings
      const rawOrg = decoded?.organization as
        | { alias: string; id: string }
        | Record<string, boolean>
        | string[]
        | undefined;
      let organization: string[] = [];
      let org_id: string | undefined;
      let org_alias: string | undefined;

      if (rawOrg) {
        if (typeof rawOrg === "object" && !Array.isArray(rawOrg)) {
          // Objeto: { "skills-it": true } ou { alias: "skills-it", id: "uuid" }
          const orgObj = rawOrg as { alias?: string; id?: string } & Record<string, boolean>;
          if (orgObj.alias) {
            org_alias = orgObj.alias;
            org_id = orgObj.id;
            organization = [org_alias];
          } else {
            // Formato { "skills-it": true, "ramada": false }
            organization = Object.keys(rawOrg).filter(
              (k) => (rawOrg as Record<string, boolean>)[k]
            );
            org_alias = organization[0];
          }
        } else if (Array.isArray(rawOrg)) {
          organization = rawOrg;
          org_alias = rawOrg[0];
        }
      }

      const tenant_uuid = isUuid(decoded?.tenant_uuid)
        ? decoded?.tenant_uuid
        : isUuid(decoded?.tenant_id)
          ? decoded?.tenant_id
          : "";
      const tenant_id = tenant_uuid;

      return {
        id: profile.sub,
        name: profile.name || profile.preferred_username || "Usuario",
        email: profile.email || "",
        image: profile.picture,
        tenant_id,
        tenant_slug: decoded?.tenant_slug || org_alias || tenantId,
        tenant_name: decoded?.tenant_name || org_alias || config.displayName,
        organization, // Multi-org support (array de aliases)
        org_id, // UUID da organization ativa
        org_alias, // Alias da organization ativa
        roles,
        groups: decoded?.groups || [],
        department: decoded?.department || "",
        company: decoded?.company || "",
        clientId: config.clientId,
        tenantId,
      };
    },
  });
}

/**
 * Create Keycloak providers for ALL configured tenants.
 *
 * Reads tenants from KEYCLOAK_TENANTS env var or auto-discovers
 * from KEYCLOAK_CLIENT_SECRET_* variables.
 *
 * @returns Array of configured KeycloakProviders
 */
export function createAllKeycloakProviders() {
  const tenants = getAvailableTenants();
  console.log(
    `[Keycloak Factory] Creating providers for ${tenants.length} tenants: ${tenants.join(", ")}`
  );
  return tenants.map((tenantId) => createKeycloakProviderForTenant(tenantId));
}

/**
 * Create Keycloak provider for admin access (nexus-admin).
 *
 * SPEC-ORGS-001: Migração de multi-realm para Organizations
 * - Realm: Skyller (unificado - não mais "master")
 * - Client: nexus-admin
 * - White-label: admin.skyller.ai/auth/realms/Skyller/...
 *
 * @param clientKey - Tipo de client (skyller para tenant, nexus-admin para admin)
 * @returns Configured KeycloakProvider
 */
export function createKeycloakProvider(clientKey: "skyller" | "nexus-admin") {
  if (clientKey === "skyller") {
    return createKeycloakProviderForTenant(DEFAULT_TENANT);
  }

  // SPEC-ORGS-001: Admin usa realm "Skyller" (não mais "master")
  const defaultRealm = process.env.KEYCLOAK_DEFAULT_REALM || "Skyller";
  const clientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || "";
  const issuer = `${KEYCLOAK_BASE_URL}/realms/${defaultRealm}`;

  console.log(`[Keycloak Factory] nexus-admin config:`, {
    defaultRealm,
    issuer,
    KEYCLOAK_DEFAULT_REALM_env: process.env.KEYCLOAK_DEFAULT_REALM,
  });

  // Configuracao de authorization para admin
  // NOTA: NAO usamos authorization.url aqui - white-label no route handler
  const authorizationConfig = { params: { scope: "openid email profile" } };

  return KeycloakProvider({
    id: "nexus-admin",
    name: "Admin Login",
    clientId: "nexus-admin",
    clientSecret,
    issuer,
    authorization: authorizationConfig,
    profile(profile, tokens) {
      let decoded: KeycloakToken | null = null;
      try {
        if (tokens.access_token) {
          decoded = jwtDecode<KeycloakToken>(tokens.access_token);
        }
      } catch {
        // Ignore
      }

      // SPEC-ORGS-001: Extrair organization do token para admin multi-tenant
      // Keycloak 26 retorna organization como objeto { alias, id } ou array de strings
      const rawOrg = decoded?.organization as
        | { alias: string; id: string }
        | Record<string, boolean>
        | string[]
        | undefined;
      let organization: string[] = [];
      let org_id: string | undefined;
      let org_alias: string | undefined;

      if (rawOrg) {
        if (typeof rawOrg === "object" && !Array.isArray(rawOrg)) {
          const orgObj = rawOrg as { alias?: string; id?: string } & Record<string, boolean>;
          if (orgObj.alias) {
            org_alias = orgObj.alias;
            org_id = orgObj.id;
            organization = [org_alias];
          } else {
            organization = Object.keys(rawOrg).filter(
              (k) => (rawOrg as Record<string, boolean>)[k]
            );
            org_alias = organization[0];
          }
        } else if (Array.isArray(rawOrg)) {
          organization = rawOrg;
          org_alias = rawOrg[0];
        }
      }

      const tenant_uuid = isUuid(decoded?.tenant_uuid)
        ? decoded?.tenant_uuid
        : isUuid(decoded?.tenant_id)
          ? decoded?.tenant_id
          : "";
      const tenant_id = tenant_uuid;

      return {
        id: profile.sub,
        name: profile.name || profile.preferred_username || "Admin",
        email: profile.email || "",
        image: profile.picture,
        tenant_id,
        tenant_slug: decoded?.tenant_slug || org_alias || "admin",
        tenant_name: decoded?.tenant_name || org_alias || "Platform Admin",
        organization, // Multi-org support (array de aliases)
        org_id, // UUID da organization ativa
        org_alias, // Alias da organization ativa
        roles: decoded?.realm_access?.roles || [],
        groups: decoded?.groups || [],
        department: decoded?.department || "",
        company: decoded?.company || "Skills IT",
        clientId: "nexus-admin",
        tenantId: tenant_id,
      };
    },
  });
}
