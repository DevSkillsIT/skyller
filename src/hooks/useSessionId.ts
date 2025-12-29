/**
 * SPEC-006-skyller - Hook useSessionId
 * NOTA: Auth desabilitado temporariamente
 */

"use client"

import { useEffect, useState, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"

export interface SessionIdData {
  sessionId: string
  compositeSessionId: string
  resetSession: () => void
  isLoaded: boolean
}

export function useSessionId(agentId: string = "skyller"): SessionIdData {
  const [sessionId, setSessionId] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState(false)

  const storageKey = useMemo(() => {
    return `session:default:${agentId}`
  }, [agentId])

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setSessionId(stored)
    } else {
      const newSessionId = uuidv4()
      setSessionId(newSessionId)
      localStorage.setItem(storageKey, newSessionId)
    }
    setIsLoaded(true)
  }, [storageKey])

  const compositeSessionId = useMemo(() => {
    if (!sessionId) return ""
    return `default:anonymous:${agentId}:${sessionId}`
  }, [agentId, sessionId])

  const resetSession = () => {
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

export function useSimpleSessionId(agentId: string = "skyller"): string {
  const { sessionId } = useSessionId(agentId)
  return sessionId
}
