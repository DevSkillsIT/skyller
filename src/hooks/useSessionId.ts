/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T022: Hook useSessionId para gerar/recuperar session_id
 *
 * Hook React para gerenciar session_id de chat, com suporte a
 * persistência em localStorage e geração automática de UUID.
 */

"use client"

import { useEffect, useState, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { useIdentity } from "./useIdentity"

/**
 * Interface de retorno do hook useSessionId
 */
export interface SessionIdData {
  /** UUID da sessão atual */
  sessionId: string
  /** Session ID composto no formato {tenant_id}:{user_id}:{agent_id}:{session_id} */
  compositeSessionId: string
  /** Função para gerar nova sessão (apaga histórico atual) */
  resetSession: () => void
  /** Se a sessão foi carregada do localStorage */
  isLoaded: boolean
}

/**
 * Hook para gerenciar session_id de chat com persistência
 *
 * @param agentId - ID do agente (default: "skyller")
 * @returns Objeto SessionIdData com session_id e helpers
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { sessionId, compositeSessionId, resetSession } = useSessionId("skyller")
 *
 *   // compositeSessionId = "skills-it:user-123:skyller:abc-def-ghi"
 *
 *   return (
 *     <div>
 *       <p>Session: {sessionId}</p>
 *       <button onClick={resetSession}>Nova Conversa</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSessionId(agentId: string = "skyller"): SessionIdData {
  const { tenantId, userId, isLoading } = useIdentity()
  const [sessionId, setSessionId] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Storage key único por tenant, user e agent
  const storageKey = useMemo(() => {
    if (!tenantId || !userId) return null
    return `session:${tenantId}:${userId}:${agentId}`
  }, [tenantId, userId, agentId])

  // Carregar ou criar session_id
  useEffect(() => {
    if (isLoading || !storageKey) return

    // Tentar recuperar do localStorage
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setSessionId(stored)
    } else {
      // Criar novo UUID
      const newSessionId = uuidv4()
      setSessionId(newSessionId)
      localStorage.setItem(storageKey, newSessionId)
    }

    setIsLoaded(true)
  }, [isLoading, storageKey])

  // Gerar session_id composto no formato Constitution II
  const compositeSessionId = useMemo(() => {
    if (!tenantId || !userId || !sessionId) {
      return ""
    }
    return `${tenantId}:${userId}:${agentId}:${sessionId}`
  }, [tenantId, userId, agentId, sessionId])

  // Função para resetar sessão
  const resetSession = () => {
    if (!storageKey) return

    const newSessionId = uuidv4()
    setSessionId(newSessionId)
    localStorage.setItem(storageKey, newSessionId)
  }

  return {
    sessionId,
    compositeSessionId,
    resetSession,
    isLoaded,
  }
}

/**
 * Hook derivado para obter apenas o session_id simples
 *
 * @param agentId - ID do agente (default: "skyller")
 * @returns UUID da sessão
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const sessionId = useSimpleSessionId()
 *   return <div>Session: {sessionId}</div>
 * }
 * ```
 */
export function useSimpleSessionId(agentId: string = "skyller"): string {
  const { sessionId } = useSessionId(agentId)
  return sessionId
}
