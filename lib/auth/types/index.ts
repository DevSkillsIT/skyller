/**
 * Types for Keycloak tokens and extended NextAuth session.
 *
 * @description Provides type definitions for Keycloak JWT tokens,
 * extended session types, and NextAuth module augmentation.
 */

import type { DefaultSession } from "next-auth";
import type { OrganizationClaim } from "@/types/next-auth";

// =============================================================================
// Keycloak Token Types
// =============================================================================

/**
 * Keycloak resource access structure.
 * Contains roles per client.
 */
export interface KeycloakResourceAccess {
  [clientId: string]: {
    roles: string[];
  };
}

/**
 * Keycloak realm access structure.
 * Contains global realm roles.
 */
export interface KeycloakRealmAccess {
  roles: string[];
}

/**
 * Keycloak JWT token structure.
 * Decoded from access_token.
 */
export interface KeycloakToken {
  /** Subject (user ID) */
  sub: string;
  /** Email */
  email?: string;
  /** Email verified flag */
  email_verified?: boolean;
  /** Full name */
  name?: string;
  /** Preferred username */
  preferred_username?: string;
  /** Given name */
  given_name?: string;
  /** Family name */
  family_name?: string;
  /** Picture URL */
  picture?: string;

  // Custom claims (tenant-specific)
  /** Tenant UUID (canonical) */
  tenant_id?: string;
  /** Tenant UUID (canonical) */
  tenant_uuid?: string;
  /** Tenant slug (URL-friendly) */
  tenant_slug?: string;
  /** Tenant display name */
  tenant_name?: string;
  /** Claim bruto "organization" do Keycloak (array legado ou objeto Keycloak 26) */
  organization?: string[] | OrganizationClaim;
  /** User groups */
  groups?: string[];
  /** Department */
  department?: string;
  /** Company */
  company?: string;

  // Keycloak-specific
  /** Realm access (global roles) */
  realm_access?: KeycloakRealmAccess;
  /** Resource access (per-client roles) */
  resource_access?: KeycloakResourceAccess;
  /** Authorized party (client ID) */
  azp?: string;
  /** Token issuer */
  iss?: string;
  /** Expiration time */
  exp?: number;
  /** Issued at */
  iat?: number;
}

/**
 * Client key type for dual-client architecture.
 */
export type ClientKey = "skyller" | "nexus-admin";

/**
 * Keycloak client configuration.
 */
export interface KeycloakClientConfig {
  clientId: string;
  clientSecret: string;
  name: string;
}

// =============================================================================
// Extended Session Types
// =============================================================================

/**
 * Extended user type with Keycloak claims.
 */
export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;

  // Tenant information
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;

  // Multi-organization support (Keycloak Organizations)
  organizations: string[];
  organizationObject: OrganizationClaim;

  // Authorization
  roles: string[];
  groups: string[];

  // Optional fields
  department: string;
  company: string;

  // Client identification
  clientId: string;
}

/**
 * Extended session type with Keycloak claims.
 */
export interface ExtendedSession extends DefaultSession {
  user: ExtendedUser;
  accessToken?: string;
  error?: string;
}

// =============================================================================
// JWT Token Extension
// =============================================================================

/**
 * Extended JWT type with Keycloak claims.
 */
export interface ExtendedJWT {
  sub?: string;
  name?: string;
  email?: string;

  // Tenant claims
  tenant_id?: string;
  tenant_slug?: string;
  tenant_name?: string;

  // Multi-organization support (Keycloak Organizations)
  organizations?: string[];
  organizationObject?: OrganizationClaim;

  // Authorization claims
  roles?: string[];
  groups?: string[];

  // Optional claims
  department?: string;
  company?: string;

  // Client identification
  clientId?: string;

  // Tokens for API calls
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;

  // Error state
  error?: string;
}

// =============================================================================
// NextAuth Module Augmentation
// =============================================================================

declare module "next-auth" {
  interface Session extends ExtendedSession {}

  interface User extends ExtendedUser {}

  interface Profile extends KeycloakToken {}
}

declare module "next-auth/jwt" {
  interface JWT extends ExtendedJWT {}
}
