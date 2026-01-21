/**
 * Issuer utilities - Arquivo separado para evitar conflito com next/headers
 *
 * Este arquivo NAO importa next/headers e pode ser usado em Server Actions.
 */

import { getIssuerForTenant, getTenantConfig } from "@/lib/auth/providers/keycloak-factory";

/**
 * Constroi a URL do issuer do Keycloak baseado no tenant atual.
 *
 * Em ambiente multi-tenant, cada tenant tem seu proprio realm no Keycloak.
 * Esta funcao retorna o issuer correto para o tenant.
 *
 * @param tenantId - ID do tenant (opcional, usa default se nao fornecido)
 * @returns URL do issuer do Keycloak para o tenant
 *
 * @example
 * const issuer = getIssuer("ramada");
 * // "https://idp.servidor.one/realms/ramada"
 *
 * @example
 * const issuer = getIssuer();
 * // Usa DEFAULT_TENANT do env
 */
export function getIssuer(tenantId?: string): string {
  const tenant = tenantId || process.env.DEFAULT_TENANT || "skills";
  return getIssuerForTenant(tenant);
}

/**
 * Obtem o client ID para um tenant especifico.
 *
 * @param tenantId - ID do tenant
 * @returns Client ID configurado para o tenant
 */
export function getClientId(tenantId?: string): string {
  const tenant = tenantId || process.env.DEFAULT_TENANT || "skills";
  const config = getTenantConfig(tenant);
  return config.clientId;
}
