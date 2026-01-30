/**
 * Helpers for extracting claims from Keycloak tokens.
 *
 * @description Provides robust claim extraction with fallbacks
 * for handling different Keycloak configurations.
 */

import type { Profile } from "next-auth";
import type { KeycloakResourceAccess, KeycloakToken } from "../types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

/**
 * Extract a claim from profile with fallback value.
 *
 * @param profile - The Keycloak profile object
 * @param key - The claim key to extract
 * @param fallback - The fallback value if claim is missing
 * @returns The claim value or fallback
 */
export function extractClaim<T>(
  profile: Profile | undefined,
  key: keyof KeycloakToken,
  fallback: T
): T {
  if (!profile) {
    return fallback;
  }

  const value = (profile as Record<string, unknown>)[key];

  if (value === undefined || value === null) {
    return fallback;
  }

  return value as T;
}

/**
 * Extract roles from Keycloak token.
 *
 * Tries to extract roles in order:
 * 1. resource_access[clientId].roles (client-specific roles)
 * 2. realm_access.roles (realm-wide roles)
 * 3. Empty array (fallback)
 *
 * @param profile - The Keycloak profile object
 * @param clientId - The client ID to extract roles for
 * @returns Array of role strings
 */
export function extractRoles(profile: Profile | undefined, clientId: string): string[] {
  if (!profile) {
    return [];
  }

  const keycloakProfile = profile as KeycloakToken;

  // Try client-specific roles first (resource_access)
  const resourceAccess = keycloakProfile.resource_access as KeycloakResourceAccess | undefined;
  if (resourceAccess?.[clientId]?.roles) {
    return resourceAccess[clientId].roles;
  }

  // Try realm-wide roles (realm_access)
  if (keycloakProfile.realm_access?.roles) {
    return keycloakProfile.realm_access.roles;
  }

  // Fallback to empty array
  return [];
}

/**
 * Extract groups from Keycloak token.
 *
 * @param profile - The Keycloak profile object
 * @returns Array of group paths
 */
export function extractGroups(profile: Profile | undefined): string[] {
  if (!profile) {
    return [];
  }

  const keycloakProfile = profile as KeycloakToken;
  return keycloakProfile.groups || [];
}

/**
 * Extract organization array from Keycloak token.
 *
 * SPEC-ORGS-001: Multi-Organization Support
 * - Keycloak Organizations expõe claim organization[] com aliases
 * - Ex: ["skills", "ramada"] para usuários multi-org
 *
 * @param profile - The Keycloak profile object
 * @returns Array of organization aliases
 */
export function extractOrganization(profile: Profile | undefined): string[] {
  if (!profile) {
    return [];
  }

  const keycloakProfile = profile as KeycloakToken;
  return keycloakProfile.organization || [];
}

/**
 * Extract tenant information from Keycloak token.
 *
 * SPEC-ORGS-001: UUID canonical sem fallback
 * - Usa tenant_uuid (ou tenant_id se for UUID)
 * - Mantem tenant_slug a partir de organization[0] ou tenant_slug
 *
 * @param profile - The Keycloak profile object
 * @returns Tenant information object
 */
export function extractTenant(profile: Profile | undefined): {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
} {
  const organization = extractOrganization(profile);
  const rawTenantId = extractClaim(profile, "tenant_id", "");
  const rawTenantUuid = extractClaim(profile, "tenant_uuid", "");
  const tenant_uuid = isUuid(rawTenantUuid)
    ? rawTenantUuid
    : isUuid(rawTenantId)
      ? rawTenantId
      : "";
  const tenant_slug = extractClaim(
    profile,
    "tenant_slug",
    organization[0] || "default"
  );
  const tenant_name = extractClaim(profile, "tenant_name", tenant_slug);
  const tenant_id = tenant_uuid;

  return {
    tenant_id,
    tenant_slug,
    tenant_name,
  };
}

/**
 * Check if user has a specific role.
 *
 * @param roles - Array of user roles
 * @param requiredRole - The role to check for
 * @returns True if user has the role
 */
export function hasRole(roles: string[], requiredRole: string): boolean {
  return roles.includes(requiredRole);
}

/**
 * Check if user has any of the required roles.
 *
 * @param roles - Array of user roles
 * @param requiredRoles - Array of roles to check for
 * @returns True if user has any of the roles
 */
export function hasAnyRole(roles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => roles.includes(role));
}

/**
 * Check if user has all of the required roles.
 *
 * @param roles - Array of user roles
 * @param requiredRoles - Array of roles to check for
 * @returns True if user has all of the roles
 */
export function hasAllRoles(roles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every((role) => roles.includes(role));
}

/**
 * Check if user belongs to a specific group.
 *
 * @param groups - Array of user groups
 * @param requiredGroup - The group path to check for
 * @returns True if user belongs to the group
 */
export function inGroup(groups: string[], requiredGroup: string): boolean {
  return groups.some((group) => group === requiredGroup || group.startsWith(`${requiredGroup}/`));
}
