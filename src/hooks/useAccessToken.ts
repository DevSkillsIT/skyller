/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * T020: Hook useAccessToken para obter access token JWT
 *
 * Hook React para componentes Client-Side obterem o access token
 * do Keycloak para chamadas ao backend.
 */

"use client"

import { useSession } from "next-auth/react"
import { useCallback, useMemo } from "react"
import { parseJwtClaims, isTokenExpired } from "@/lib/auth/claims"

/**
 * Interface de retorno do hook useAccessToken
 */
export interface AccessTokenData {
  /** Access token JWT (ou null se não autenticado) */
  token: string | null
  /** Se o token está expirado */
  isExpired: boolean
  /** Se a sessão está carregando */
  isLoading: boolean
  /** Função para obter headers HTTP com autenticação */
  getAuthHeaders: () => Record<string, string>
}

/**
 * Hook para obter access token do Keycloak
 *
 * @returns Objeto AccessTokenData com token e helpers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { token, isExpired, getAuthHeaders } = useAccessToken()
 *
 *   const fetchData = async () => {
 *     const response = await fetch("/api/data", {
 *       headers: getAuthHeaders()
 *     })
 *     return response.json()
 *   }
 *
 *   return <button onClick={fetchData}>Fetch</button>
 * }
 * ```
 */
export function useAccessToken(): AccessTokenData {
  const { data: session, status } = useSession()

  const token = session?.accessToken || null

  // Verifica se o token está expirado
  const isExpired = useMemo(() => {
    if (!token) return true
    try {
      const claims = parseJwtClaims(token)
      return isTokenExpired(claims)
    } catch {
      return true
    }
  }, [token])

  // Função helper para obter headers HTTP com autenticação
  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token && !isExpired) {
      headers["Authorization"] = `Bearer ${token}`

      // Adiciona headers de multi-tenancy (se disponíveis)
      try {
        const claims = parseJwtClaims(token)
        headers["X-Tenant-ID"] = claims.tenant_id
        headers["X-User-ID"] = claims.sub

        // Formata grupos como comma-separated
        if (claims.groups && claims.groups.length > 0) {
          headers["X-Groups"] = claims.groups.join(",")
        }
      } catch (error) {
        console.error("Erro ao extrair claims para headers:", error)
      }
    }

    return headers
  }, [token, isExpired])

  return {
    token,
    isExpired,
    isLoading: status === "loading",
    getAuthHeaders,
  }
}

/**
 * Hook derivado para fazer fetch com autenticação automática
 *
 * @returns Função fetch wrapper com headers de autenticação
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const authenticatedFetch = useAuthenticatedFetch()
 *
 *   const fetchData = async () => {
 *     const data = await authenticatedFetch("/api/data")
 *     return data
 *   }
 *
 *   return <button onClick={fetchData}>Fetch</button>
 * }
 * ```
 */
export function useAuthenticatedFetch() {
  const { getAuthHeaders, isExpired } = useAccessToken()

  return useCallback(
    async <T = any,>(
      url: string,
      options?: RequestInit,
    ): Promise<T> => {
      if (isExpired) {
        throw new Error("Token expirado. Faça login novamente.")
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options?.headers || {}),
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Request failed: ${response.status} ${error}`)
      }

      return response.json()
    },
    [getAuthHeaders, isExpired],
  )
}
