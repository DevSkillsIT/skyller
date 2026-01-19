"use server";

import { signIn } from "@/auth";

/**
 * Tipos de cliente Keycloak suportados.
 *
 * Multi-tenant: keycloak-{tenant} (ex: keycloak-skills, keycloak-ramada)
 * Admin: nexus-admin
 *
 * O tipo string permite providers dinamicos baseados no tenant.
 */
export type ClientKey = `keycloak-${string}` | "nexus-admin";

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
 * Server Action pre-configurada para sign-in via tenant default (skills).
 * Uso simplificado para desenvolvimento local.
 *
 * @example
 * <form action={signInDefault}>
 *   <button type="submit">Entrar</button>
 * </form>
 */
export const signInDefault = signIn.bind(null, "keycloak-skills");

/**
 * Server Action pre-configurada para sign-in via Admin client.
 * Uso simplificado para acesso administrativo.
 *
 * @example
 * <form action={signInAdmin}>
 *   <button type="submit">Entrar como Admin</button>
 * </form>
 */
export const signInAdmin = signIn.bind(null, "nexus-admin");
