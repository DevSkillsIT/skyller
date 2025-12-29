/**
 * SPEC-006-skyller - Hook useAgentConnection
 * NOTA: Auth desabilitado temporariamente
 */

"use client"

import { useMemo } from "react"
import { useSessionId } from "./useSessionId"

export interface AgentConnectionConfig {
  agentId?: string
  url?: string
}

export interface AgentConnection {
  url: string
  headers: Record<string, string>
  isReady: boolean
  sessionId: string
  resetSession: () => void
}

export function useAgentConnection(
  config: AgentConnectionConfig = {}
): AgentConnection {
  const { agentId = "skyller", url: customUrl } = config
  const { compositeSessionId, resetSession, isLoaded: sessionLoaded } = useSessionId(agentId)

  const url = useMemo(() => {
    return customUrl || process.env.NEXT_PUBLIC_AGUI_URL || "http://localhost:7777"
  }, [customUrl])

  const headers = useMemo(() => {
    return {
      "Content-Type": "application/json",
      "X-Agent-ID": agentId,
      "X-Session-ID": compositeSessionId,
    }
  }, [agentId, compositeSessionId])

  const isReady = useMemo(() => {
    return sessionLoaded && !!compositeSessionId
  }, [sessionLoaded, compositeSessionId])

  return {
    url,
    headers,
    isReady,
    sessionId: compositeSessionId,
    resetSession,
  }
}

export function useAgentHeaders(agentId: string = "skyller"): Record<string, string> {
  const { headers } = useAgentConnection({ agentId })
  return headers
}
