/**
 * SPEC-006-skyller - Hook useHITL
 * NOTA: Auth desabilitado temporariamente
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import type { HITLRequest, HITLResponse, HITLResult } from "@/types/hitl"

const HITL_TIMEOUT_MS = 5 * 60 * 1000

export interface UseHITLReturn {
  currentRequest: HITLRequest | null
  pendingRequests: HITLRequest[]
  canApprove: boolean
  approveConfirmation: (toolCallId: string) => Promise<void>
  rejectConfirmation: (toolCallId: string, reason?: string) => Promise<void>
  clearCurrentRequest: () => void
  isProcessing: boolean
  error: string | null
}

export function useHITL(): UseHITLReturn {
  const [pendingRequests, setPendingRequests] = useState<HITLRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<HITLRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sem auth, sempre pode aprovar
  const canApprove = true

  useEffect(() => {
    if (!currentRequest) return

    const timeoutMs = currentRequest.timeoutAt.getTime() - Date.now()

    if (timeoutMs <= 0) {
      rejectConfirmation(currentRequest.toolCallId, "Timeout")
      return
    }

    const timeoutId = setTimeout(() => {
      rejectConfirmation(currentRequest.toolCallId, "Timeout")
    }, timeoutMs)

    return () => clearTimeout(timeoutId)
  }, [currentRequest])

  const approveConfirmation = useCallback(async (toolCallId: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/agui/hitl/${toolCallId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" } as HITLResponse),
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`)
      }

      const result: HITLResult = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Falha ao aprovar")
      }

      setPendingRequests((prev) =>
        prev.filter((req) => req.toolCallId !== toolCallId)
      )

      if (currentRequest?.toolCallId === toolCallId) {
        setCurrentRequest(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar")
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [currentRequest])

  const rejectConfirmation = useCallback(async (toolCallId: string, reason?: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/agui/hitl/${toolCallId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: reason || "Rejeitado",
        } as HITLResponse),
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`)
      }

      setPendingRequests((prev) =>
        prev.filter((req) => req.toolCallId !== toolCallId)
      )

      if (currentRequest?.toolCallId === toolCallId) {
        setCurrentRequest(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao rejeitar")
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [currentRequest])

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(null)
  }, [])

  return {
    currentRequest,
    pendingRequests,
    canApprove,
    approveConfirmation,
    rejectConfirmation,
    clearCurrentRequest,
    isProcessing,
    error,
  }
}
