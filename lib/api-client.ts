/**
 * API Client - Browser-side API calls with X-Tenant-ID
 *
 * @description Cliente de API para uso em Client Components.
 * Baseado em SPEC-ORGS-001 - Single Realm Multi-Organization Architecture.
 *
 * Features:
 * - Adiciona Authorization header automaticamente
 * - Adiciona X-Tenant-ID header baseado em activeOrganization
 * - Cookie active-organization para persistir escolha do usuario
 * - Fallback para subdomain do hostname
 * - Single source of truth para chamadas de API no browser
 *
 * @example
 * ```typescript
 * import apiClient, { setActiveOrganization } from "@/lib/api-client"
 *
 * // Mudar organization ativa
 * setActiveOrganization("ramada")
 *
 * // Chamadas usarao a organization ativa
 * const response = await apiClient("/v1/agents")
 * const agents = await response.json()
 * ```
 */

import { getSession } from "next-auth/react"

/** Nome do cookie para organization ativa */
const ACTIVE_ORG_COOKIE = "active-organization"

/**
 * Le o cookie active-organization
 *
 * @returns Organization alias do cookie ou undefined
 */
export function getActiveOrganizationCookie(): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp(`(^| )${ACTIVE_ORG_COOKIE}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : undefined
}

/**
 * Define o cookie active-organization
 *
 * @param orgAlias - Alias da organization (ex: "skills-it", "ramada")
 * @param maxAgeDays - Duracao do cookie em dias (default: 30)
 */
export function setActiveOrganization(orgAlias: string, maxAgeDays = 30): void {
  if (typeof document === "undefined") return
  const maxAge = maxAgeDays * 24 * 60 * 60
  document.cookie = `${ACTIVE_ORG_COOKIE}=${encodeURIComponent(orgAlias)}; path=/; max-age=${maxAge}; samesite=lax; secure`
}

/**
 * Remove o cookie active-organization
 */
export function clearActiveOrganization(): void {
  if (typeof document === "undefined") return
  document.cookie = `${ACTIVE_ORG_COOKIE}=; path=/; max-age=0`
}

/**
 * Obtem a organization ativa com prioridade:
 * 1) Session activeOrganization
 * 2) Cookie active-organization
 * 3) Hostname subdomain
 *
 * @param session - Sessao do usuario (opcional)
 * @returns Organization alias
 */
export function getActiveOrganization(session?: { user?: { activeOrganization?: string } } | null): string {
  // Priority 1: Session activeOrganization
  if (session?.user?.activeOrganization) {
    return session.user.activeOrganization
  }

  // Priority 2: Cookie
  const cookieOrg = getActiveOrganizationCookie()
  if (cookieOrg) {
    return cookieOrg
  }

  // Priority 3: Hostname subdomain
  return getTenantFromHostname()
}

/**
 * API Client - Single source of X-Tenant-ID para fetch no browser
 *
 * @param endpoint - Endpoint da API (ex: "/v1/agents")
 * @param options - Opcoes do fetch (method, body, headers, etc)
 * @returns Promise com Response do fetch
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const session = await getSession()

  // Priority: 1) Session activeOrg, 2) Cookie, 3) Hostname subdomain
  const activeOrg = getActiveOrganization(session)

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
