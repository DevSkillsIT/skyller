/**
 * Modulo de Autenticacao Skyller
 *
 * Este modulo centraliza todas as funcionalidades de autenticacao
 * do projeto Skyller, incluindo:
 *
 * - Server Actions para sign-in/sign-out
 * - Helpers para verificacao de autenticacao e autorizacao
 * - Tipos customizados para usuarios multi-tenant
 *
 * @example
 * // Importar tudo do modulo auth
 * import {
 *   signInWithKeycloak,
 *   signOutFromKeycloak,
 *   getCurrentUser,
 *   requireAuth,
 *   requireRole,
 *   hasPermission
 * } from "@/lib/auth";
 *
 * // Em um Server Component
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   return <div>Bem-vindo, {user.name}!</div>;
 * }
 *
 * // Em um Server Action
 * export async function createResource() {
 *   const user = await requireRole("admin");
 *   // ...
 * }
 */

// ============================================================
// Server Actions
// ============================================================

export {
  type ClientKey,
  generateKeycloakLogoutUrl,
  getKeycloakLogoutUrl,
  signInAdmin,
  signInSkyller,
  // Sign-in
  signInWithKeycloak,
  // Sign-out
  signOutFromKeycloak,
} from "./actions";

// ============================================================
// Helpers
// ============================================================

export {
  // Errors
  AuthenticationError,
  AuthorizationError,
  // Types
  type AuthUser,
  getCurrentUser,
  // Core helpers
  getIssuer,
  getTenantFromHost,
  hasAnyRole,
  hasPermission,
  isAuthenticated,
  // Auth guards
  requireAuth,
  requireRole,
} from "./helpers";
