/**
 * SPEC-006-skyller - Phase 5: US3 - Human-in-the-Loop (HITL)
 * T032: Componente ConfirmationModal com countdown visual
 *
 * Modal de confirmação para operações que requerem aprovação humana.
 * Exibe countdown de 5 minutos e rejeita automaticamente se timeout.
 */

"use client"

import { useState, useEffect } from "react"
import type { ConfirmationModalProps } from "@/types/hitl"

/**
 * Formata segundos em formato MM:SS
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

/**
 * Modal de confirmação HITL com countdown
 *
 * Features:
 * - Countdown visual de 5 minutos
 * - Exibição de tool name e argumentos
 * - Botões approve/reject
 * - Desabilita approve se usuário não tem permissão
 * - Campo de texto para razão de rejeição
 * - Auto-rejeição em caso de timeout
 *
 * @param props - Props do componente
 * @returns Componente ConfirmationModal
 *
 * @example
 * ```tsx
 * <ConfirmationModal
 *   request={hitlRequest}
 *   onApprove={handleApprove}
 *   onReject={handleReject}
 *   canApprove={true}
 *   isOpen={true}
 *   onClose={handleClose}
 * />
 * ```
 */
export function ConfirmationModal({
  request,
  onApprove,
  onReject,
  canApprove,
  isOpen,
  onClose,
}: ConfirmationModalProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Calcula tempo restante em segundos
   */
  useEffect(() => {
    if (!isOpen || !request) return

    // Calcula tempo inicial
    const initialTimeLeft = Math.max(
      0,
      Math.floor((request.timeoutAt.getTime() - Date.now()) / 1000)
    )
    setTimeLeft(initialTimeLeft)

    // Atualiza a cada segundo
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout - rejeitar automaticamente
          handleReject("Timeout: tempo limite de 5 minutos excedido")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [request, isOpen])

  /**
   * Handler para aprovar
   */
  const handleApprove = async () => {
    if (!canApprove || isProcessing) return

    setIsProcessing(true)
    try {
      await onApprove(request.toolCallId)
      onClose()
    } catch (error) {
      console.error("[ConfirmationModal] Erro ao aprovar:", error)
      // Erro já tratado no hook useHITL
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Handler para rejeitar
   */
  const handleReject = async (reason?: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    try {
      await onReject(request.toolCallId, reason || rejectReason || "Rejeitado pelo usuário")
      onClose()
    } catch (error) {
      console.error("[ConfirmationModal] Erro ao rejeitar:", error)
      // Erro já tratado no hook useHITL
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Calcula cor do countdown baseado em tempo restante
   */
  const getCountdownColor = () => {
    if (timeLeft > 180) return "text-green-600" // > 3 min
    if (timeLeft > 60) return "text-yellow-600" // > 1 min
    return "text-red-600" // < 1 min
  }

  if (!isOpen || !request) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Fecha se clicar fora do modal
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirmação Necessária
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A operação a seguir requer sua aprovação
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tool Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ferramenta
          </label>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
            <code className="text-blue-700 dark:text-blue-300 font-mono text-sm">
              {request.toolName}
            </code>
          </div>
        </div>

        {/* Tool Arguments */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Argumentos
          </label>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700 text-sm overflow-x-auto max-h-64">
            <code className="text-gray-800 dark:text-gray-200">
              {JSON.stringify(request.toolArgs, null, 2)}
            </code>
          </pre>
        </div>

        {/* Countdown */}
        <div className={`mb-4 flex items-center gap-2 font-semibold ${getCountdownColor()}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Tempo restante: {formatTime(timeLeft)}</span>
        </div>

        {/* Aviso de permissão */}
        {!canApprove && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">
                Você não tem permissão para aprovar esta operação.
                <br />
                Apenas usuários com role <strong>admin</strong> ou <strong>operator</strong> podem aprovar.
              </p>
            </div>
          </div>
        )}

        {/* Campo de razão de rejeição */}
        <div className="mb-6">
          <label
            htmlFor="reject-reason"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Razão da rejeição (opcional)
          </label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Descreva o motivo da rejeição..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleReject()}
            disabled={isProcessing}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processando..." : "Rejeitar"}
          </button>
          <button
            onClick={handleApprove}
            disabled={!canApprove || isProcessing}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processando..." : "Aprovar"}
          </button>
        </div>
      </div>
    </div>
  )
}
