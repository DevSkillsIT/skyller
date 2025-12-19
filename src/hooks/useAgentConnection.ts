/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T022b: Hook useAgentConnection com headers multi-tenant
 *
 * Hook React para estabelecer conexão AG-UI com o backend usando
 * CopilotKit, incluindo headers de autenticação e multi-tenancy.
 */

"use client"

import { useMemo } from "react"
import { useIdentity } from "./useIdentity"
import { useAccessToken } from "./useAccessToken"
import { useSessionId } from "./useSessionId"

/**
 * Interface de configuração da conexão do agente
 */
export interface AgentConnectionConfig {
  /** ID do agente (default: "skyller") */
  agentId?: string
  /** URL do endpoint AG-UI (default: process.env.NEXT_PUBLIC_AGUI_URL) */
  url?: string
}

/**
 * Interface de retorno do hook useAgentConnection
 */
export interface AgentConnection {
  /** URL do endpoint AG-UI */
  url: string
  /** Headers HTTP com autenticação e multi-tenancy */
  headers: Record<string, string>
  /** Se a conexão está pronta (autenticado + session carregado) */
  isReady: boolean
  /** Session ID composto */
  sessionId: string
  /** Função para resetar sessão */
  resetSession: () => void
}

/**
 * Hook para estabelecer conexão AG-UI com headers multi-tenant
 *
 * Este hook integra autenticação Keycloak, identidade do usuário,
 * e session management para fornecer uma conexão completa ao backend.
 *
 * @param config - Configuração da conexão
 * @returns Objeto AgentConnection com URL, headers e helpers
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const connection = useAgentConnection({ agentId: "skyller" })
 *
 *   if (!connection.isReady) {
 *     return <div>Carregando...</div>
 *   }
 *
 *   // Usar connection.url e connection.headers para conectar com CopilotKit
 *   // useCoAgent({ name: "skyller", url: connection.url, headers: connection.headers })
 *
 *   return <div>Chat pronto!</div>
 * }
 * ```
 */
export function useAgentConnection(
  config: AgentConnectionConfig = {}
): AgentConnection {
  const { agentId = "skyller", url: customUrl } = config

  const { tenantId, userId, groups, isAuthenticated, isLoading: identityLoading } = useIdentity()
  const { getAuthHeaders, isLoading: tokenLoading } = useAccessToken()
  const { compositeSessionId, resetSession, isLoaded: sessionLoaded } = useSessionId(agentId)

  // URL do endpoint AG-UI (prioriza customUrl > env > localhost)
  const url = useMemo(() => {
    return customUrl || process.env.NEXT_PUBLIC_AGUI_URL || "http://localhost:7777"
  }, [customUrl])

  // Headers completos com autenticação e multi-tenancy
  const headers = useMemo(() => {
    // Base headers com autenticação
    const baseHeaders = getAuthHeaders()

    // Se não autenticado, retorna apenas base headers
    if (!isAuthenticated || !tenantId || !userId) {
      return baseHeaders
    }

    // Adiciona headers de multi-tenancy (4-Level Security - Constitution II)
    return {
      ...baseHeaders,
      "X-Agent-ID": agentId,
      "X-Session-ID": compositeSessionId,
    }
  }, [getAuthHeaders, isAuthenticated, tenantId, userId, agentId, compositeSessionId])

  // Conexão está pronta quando:
  // 1. Usuário autenticado
  // 2. Identidade carregada
  // 3. Token carregado
  // 4. Session ID carregado
  const isReady = useMemo(() => {
    return (
      isAuthenticated &&
      !identityLoading &&
      !tokenLoading &&
      sessionLoaded &&
      !!compositeSessionId
    )
  }, [isAuthenticated, identityLoading, tokenLoading, sessionLoaded, compositeSessionId])

  return {
    url,
    headers,
    isReady,
    sessionId: compositeSessionId,
    resetSession,
  }
}

/**
 * Hook derivado para obter apenas os headers de autenticação
 *
 * @param agentId - ID do agente (default: "skyller")
 * @returns Headers HTTP completos
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const headers = useAgentHeaders("skyller")
 *
 *   const fetchData = async () => {
 *     const response = await fetch("/api/data", { headers })
 *     return response.json()
 *   }
 *
 *   return <button onClick={fetchData}>Fetch</button>
 * }
 * ```
 */
export function useAgentHeaders(agentId: string = "skyller"): Record<string, string> {
  const { headers } = useAgentConnection({ agentId })
  return headers
}
