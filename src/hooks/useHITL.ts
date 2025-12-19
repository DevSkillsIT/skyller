/**
 * SPEC-006-skyller - Phase 5: US3 - Human-in-the-Loop (HITL)
 * T031: Hook useHITL com timeout de 5 minutos
 *
 * Hook React para gerenciar solicitações HITL com timeout automático
 * e verificação de permissões (admin/operator).
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useIdentity } from "./useIdentity"
import { useAccessToken } from "./useAccessToken"
import type {
  HITLRequest,
  HITLResponse,
  HITLResult,
} from "@/types/hitl"

/**
 * Timeout padrão para confirmações HITL: 5 minutos
 */
const HITL_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Interface de retorno do hook useHITL
 */
export interface UseHITLReturn {
  /** Solicitação HITL atual pendente (null se não houver) */
  currentRequest: HITLRequest | null

  /** Lista de todas as solicitações HITL pendentes */
  pendingRequests: HITLRequest[]

  /** Indica se usuário tem permissão para aprovar (admin/operator) */
  canApprove: boolean

  /** Aprova uma solicitação HITL */
  approveConfirmation: (toolCallId: string) => Promise<void>

  /** Rejeita uma solicitação HITL */
  rejectConfirmation: (toolCallId: string, reason?: string) => Promise<void>

  /** Limpa a solicitação atual */
  clearCurrentRequest: () => void

  /** Indica se há uma operação em andamento */
  isProcessing: boolean

  /** Erro da última operação (null se não houver) */
  error: string | null
}

/**
 * Hook para gerenciar Human-in-the-Loop (HITL) com timeout automático
 *
 * Features:
 * - Timeout de 5 minutos para confirmações
 * - Verificação de permissões (admin/operator)
 * - Rejeição automática em caso de timeout
 * - Logging de decisões no backend
 *
 * @returns Objeto UseHITLReturn com estado e funções de controle
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     currentRequest,
 *     canApprove,
 *     approveConfirmation,
 *     rejectConfirmation
 *   } = useHITL()
 *
 *   if (!currentRequest) {
 *     return <div>Sem confirmações pendentes</div>
 *   }
 *
 *   return (
 *     <ConfirmationModal
 *       request={currentRequest}
 *       canApprove={canApprove}
 *       onApprove={approveConfirmation}
 *       onReject={rejectConfirmation}
 *     />
 *   )
 * }
 * ```
 */
export function useHITL(): UseHITLReturn {
  const [pendingRequests, setPendingRequests] = useState<HITLRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<HITLRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { roles } = useIdentity()
  const { getAuthHeaders } = useAccessToken()

  // Verificar se usuário tem permissão (admin ou operator)
  const canApprove = roles.includes("admin") || roles.includes("operator")

  /**
   * Timeout automático para a solicitação atual
   * Rejeita automaticamente após 5 minutos
   */
  useEffect(() => {
    if (!currentRequest) return

    const timeoutMs = currentRequest.timeoutAt.getTime() - Date.now()

    // Se já expirou, rejeitar imediatamente
    if (timeoutMs <= 0) {
      rejectConfirmation(currentRequest.toolCallId, "Timeout: tempo limite excedido")
      return
    }

    // Configurar timer para rejeitar quando expirar
    const timeoutId = setTimeout(() => {
      rejectConfirmation(currentRequest.toolCallId, "Timeout: tempo limite excedido")
    }, timeoutMs)

    return () => clearTimeout(timeoutId)
  }, [currentRequest])

  /**
   * Aprova uma solicitação HITL
   */
  const approveConfirmation = useCallback(
    async (toolCallId: string): Promise<void> => {
      if (!canApprove) {
        setError("Você não tem permissão para aprovar. Apenas admin/operator.")
        return
      }

      setIsProcessing(true)
      setError(null)

      try {
        const response = await fetch(`/api/agui/hitl/${toolCallId}`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: "approve",
          } as HITLResponse),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Erro HTTP ${response.status}`)
        }

        const result: HITLResult = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Falha ao processar aprovação")
        }

        // Remover da lista de pendentes
        setPendingRequests((prev) =>
          prev.filter((req) => req.toolCallId !== toolCallId)
        )

        // Limpar solicitação atual se for a mesma
        if (currentRequest?.toolCallId === toolCallId) {
          setCurrentRequest(null)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido ao aprovar"
        setError(errorMessage)
        console.error("[useHITL] Erro ao aprovar confirmação:", err)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [canApprove, getAuthHeaders, currentRequest]
  )

  /**
   * Rejeita uma solicitação HITL
   */
  const rejectConfirmation = useCallback(
    async (toolCallId: string, reason?: string): Promise<void> => {
      setIsProcessing(true)
      setError(null)

      try {
        const response = await fetch(`/api/agui/hitl/${toolCallId}`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: "reject",
            reason: reason || "Rejeitado pelo usuário",
          } as HITLResponse),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Erro HTTP ${response.status}`)
        }

        const result: HITLResult = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Falha ao processar rejeição")
        }

        // Remover da lista de pendentes
        setPendingRequests((prev) =>
          prev.filter((req) => req.toolCallId !== toolCallId)
        )

        // Limpar solicitação atual se for a mesma
        if (currentRequest?.toolCallId === toolCallId) {
          setCurrentRequest(null)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido ao rejeitar"
        setError(errorMessage)
        console.error("[useHITL] Erro ao rejeitar confirmação:", err)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [getAuthHeaders, currentRequest]
  )

  /**
   * Limpa a solicitação atual
   */
  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(null)
  }, [])

  /**
   * Adiciona uma nova solicitação HITL
   * (Função exposta para ser chamada quando o agente solicitar confirmação)
   */
  const addRequest = useCallback((request: HITLRequest) => {
    setPendingRequests((prev) => [...prev, request])

    // Se não houver solicitação atual, definir esta como atual
    setCurrentRequest((current) => current || request)
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
