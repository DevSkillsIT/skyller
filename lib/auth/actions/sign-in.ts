"use server";

import { signIn } from "@/auth";

/**
 * Tipos de cliente Keycloak suportados.
 *
 * SPEC-ORGS-001: Single realm com 2 providers estaticos
 * - keycloak-skyller: Provider principal para usuarios
 * - keycloak-admin: Provider para administradores
 */
export type ClientKey = "keycloak-skyller" | "keycloak-admin";

/**
 * Server Action para sign-in via Keycloak com suporte a dual clients.
 *
 * Esta action encapsula o signIn do Auth.js e adiciona suporte para
 * multiplos clientes Keycloak (skyller e nexus-admin).
 *
 * @param clientKey - Identificador do cliente Keycloak ("skyller" | "nexus-admin")
 * @param callbackUrl - URL de redirecionamento apos login bem-sucedido (opcional)
 * @returns Promise que resolve apos redirect do OAuth
 *
 * @example
 * // Em um Server Component ou form action
 * await signInWithKeycloak("skyller", "/dashboard");
 *
 * @example
 * // Em um form com action
 * <form action={async () => {
 *   "use server";
 *   await signInWithKeycloak("skyller");
 * }}>
 *   <button type="submit">Entrar</button>
 * </form>
 */
export async function signInWithKeycloak(
  clientKey: ClientKey,
  callbackUrl?: string
): Promise<void> {
  const options: { redirectTo?: string } = {};

  if (callbackUrl) {
    options.redirectTo = callbackUrl;
  }

  // O clientKey corresponde ao id do provider configurado no auth.ts
  // Ex: KeycloakProvider({ id: "skyller", ... })
  await signIn(clientKey, options);
}

/**
 * Server Action pre-configurada para sign-in via Skyller.
 * Uso simplificado para desenvolvimento local.
 *
 * @example
 * <form action={signInSkyller}>
 *   <button type="submit">Entrar</button>
 * </form>
 */
export const signInSkyller = signIn.bind(null, "keycloak-skyller");

/**
 * Server Action pre-configurada para sign-in via Admin client.
 * Uso simplificado para acesso administrativo.
 *
 * @example
 * <form action={signInAdmin}>
 *   <button type="submit">Entrar como Admin</button>
 * </form>
 */
export const signInAdmin = signIn.bind(null, "keycloak-admin");
