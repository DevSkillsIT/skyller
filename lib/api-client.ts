/**
 * API Client - Browser-side API calls with X-Tenant-ID
 *
 * @description Cliente de API para uso em Client Components.
 * Baseado em SPEC-ORGS-001 - Single Realm Multi-Organization Architecture.
 *
 * Features:
 * - Adiciona Authorization header automaticamente
 * - Adiciona X-Tenant-ID header baseado em activeOrganization
 * - Fallback para subdomain do hostname
 * - Single source of truth para chamadas de API no browser
 *
 * @example
 * ```typescript
 * import apiClient from "@/lib/api-client"
 *
 * const response = await apiClient("/v1/agents")
 * const agents = await response.json()
 * ```
 */

import { getSession } from "next-auth/react"

/**
 * API Client - Single source of X-Tenant-ID para fetch no browser
 *
 * @param endpoint - Endpoint da API (ex: "/v1/agents")
 * @param options - Opcoes do fetch (method, body, headers, etc)
 * @returns Promise com Response do fetch
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const session = await getSession()

  // Priority: 1) Session activeOrg, 2) Hostname subdomain
  const activeOrg = session?.user?.activeOrganization || getTenantFromHostname()

  const headers = new Headers(options.headers)

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`)
  }

  if (activeOrg) {
    headers.set("X-Tenant-ID", activeOrg)
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.skyller.ai"

  return fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  })
}

/**
 * Extrai tenant do hostname (subdomain)
 *
 * @returns Tenant alias extraido do subdomain
 */
function getTenantFromHostname(): string {
  if (typeof window === "undefined") return "skills"
  const hostname = window.location.hostname
  const subdomain = hostname.split(".")[0]
  return subdomain === "admin" ? "skills" : subdomain
}

export default apiClient
