/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T029: Componente ConnectionStatus
 *
 * Componente para exibir status de conexão SSE com indicador
 * visual de reconexão conforme NFR-002.
 */

"use client"

import React from "react"
import { cn } from "@/lib/utils"

/**
 * Status possíveis da conexão
 */
export type ConnectionStatusType = "connected" | "connecting" | "reconnecting" | "disconnected" | "error"

/**
 * Props do componente ConnectionStatus
 */
export interface ConnectionStatusProps {
  /** Status atual da conexão */
  status: ConnectionStatusType
  /** Tentativa atual de reconexão (1-based) */
  attempt?: number
  /** Número máximo de tentativas */
  maxAttempts?: number
  /** Mensagem de erro personalizada */
  errorMessage?: string
  /** Classe CSS adicional */
  className?: string
  /** Callback para tentar reconectar manualmente */
  onRetry?: () => void
}

/**
 * Componente ConnectionStatus
 *
 * Exibe indicador visual do status de conexão SSE com suporte a
 * retry automático e manual.
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const [status, setStatus] = useState<ConnectionStatusType>("connecting")
 *   const [attempt, setAttempt] = useState(0)
 *
 *   return (
 *     <ConnectionStatus
 *       status={status}
 *       attempt={attempt}
 *       maxAttempts={3}
 *       onRetry={() => reconnect()}
 *     />
 *   )
 * }
 * ```
 */
export function ConnectionStatus({
  status,
  attempt = 0,
  maxAttempts = 3,
  errorMessage,
  className,
  onRetry,
}: ConnectionStatusProps) {
  // Se conectado, não exibe nada
  if (status === "connected") {
    return null
  }

  // Configurações visuais por status
  const statusConfig = {
    connecting: {
      icon: "🔌",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-400",
      textColor: "text-blue-800",
      message: "Conectando ao servidor...",
      showSpinner: true,
    },
    reconnecting: {
      icon: "🔄",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-400",
      textColor: "text-yellow-800",
      message: `Reconectando... (${attempt}/${maxAttempts})`,
      showSpinner: true,
    },
    disconnected: {
      icon: "⚠️",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-400",
      textColor: "text-orange-800",
      message: "Conexão perdida. Tente novamente.",
      showSpinner: false,
    },
    error: {
      icon: "❌",
      bgColor: "bg-red-100",
      borderColor: "border-red-400",
      textColor: "text-red-800",
      message: errorMessage || "Erro de conexão. Não foi possível conectar ao servidor.",
      showSpinner: false,
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 max-w-sm z-50",
        "border rounded-lg p-3 shadow-lg",
        "transition-all duration-300 ease-in-out",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="text-2xl flex-shrink-0">
          {config.icon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Mensagem */}
          <p className={cn("text-sm font-medium", config.textColor)}>
            {config.message}
          </p>

          {/* Spinner (se aplicável) */}
          {config.showSpinner && (
            <div className="flex items-center gap-2 mt-2">
              <svg
                className={cn("animate-spin h-4 w-4", config.textColor)}
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className={cn("text-xs", config.textColor)}>
                Aguarde...
              </span>
            </div>
          )}

          {/* Botão de retry manual (se disponível e desconectado/erro) */}
          {onRetry && (status === "disconnected" || status === "error") && (
            <button
              onClick={onRetry}
              className={cn(
                "mt-2 px-3 py-1 rounded-md text-xs font-medium",
                "transition-colors duration-200",
                status === "error"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              )}
            >
              Tentar Novamente
            </button>
          )}
        </div>

        {/* Botão fechar (apenas para erro) */}
        {status === "error" && (
          <button
            onClick={() => {
              // Aqui poderia ter um callback para fechar o toast
              // Por enquanto, deixa vazio (component será removido do parent)
            }}
            className={cn(
              "flex-shrink-0 text-gray-400 hover:text-gray-600",
              "transition-colors duration-200"
            )}
            aria-label="Fechar"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Barra de progresso (para reconnecting) */}
      {status === "reconnecting" && (
        <div className="mt-2 h-1 bg-yellow-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-600 transition-all duration-1000 ease-linear"
            style={{
              width: `${(attempt / maxAttempts) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Hook para gerenciar estado de conexão
 * (Pode ser expandido para integração com SSE)
 */
export function useConnectionStatus() {
  const [status, setStatus] = React.useState<ConnectionStatusType>("connected")
  const [attempt, setAttempt] = React.useState(0)

  return {
    status,
    setStatus,
    attempt,
    setAttempt,
  }
}
