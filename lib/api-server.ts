/**
 * Server-side API Client with X-Tenant-ID
 *
 * @description Cliente de API para uso em Server Components e Route Handlers.
 * Baseado em SPEC-ORGS-001 - Single Realm Multi-Organization Architecture.
 *
 * Features:
 * - Adiciona Authorization header automaticamente
 * - Adiciona X-Tenant-ID header baseado em:
 *   1. Cookie active-organization
 *   2. Session activeOrganization
 *   3. Header host (subdomain)
 *   4. Fallback "skills"
 * - Single source of truth para chamadas de API server-side
 *
 * @example
 * ```typescript
 * import { serverApiClient } from "@/lib/api-server"
 *
 * const response = await serverApiClient("/v1/agents")
 * const agents = await response.json()
 * ```
 */

import { cookies, headers } from "next/headers"
import { auth } from "@/auth"

/**
 * Server-side API client com X-Tenant-ID
 *
 * @param endpoint - Endpoint da API (ex: "/v1/agents")
 * @param options - Opcoes do fetch (method, body, headers, etc)
 * @returns Promise com Response do fetch
 */
export async function serverApiClient(endpoint: string, options: RequestInit = {}) {
  const session = await auth()
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Priority: 1) Cookie, 2) Session activeOrg, 3) Hostname subdomain, 4) Fallback "skills"
  const activeOrg =
    cookieStore.get("active-organization")?.value ||
    session?.user?.activeOrganization ||
    headerStore.get("host")?.split(".")[0] ||
    "skills"

  const reqHeaders = new Headers(options.headers)

  if (session?.accessToken) {
    reqHeaders.set("Authorization", `Bearer ${session.accessToken}`)
  }
  reqHeaders.set("X-Tenant-ID", activeOrg)

  const apiUrl = process.env.API_URL || "http://nexus-core:8000"

  return fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: reqHeaders,
  })
}

export default serverApiClient
