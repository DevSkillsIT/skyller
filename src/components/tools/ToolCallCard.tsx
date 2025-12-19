/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T027: Componente ToolCallCard
 *
 * Componente para exibir detalhes de uma tool call individual,
 * incluindo nome, argumentos, status, e resultado.
 */

"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Status possíveis de uma tool call
 */
export type ToolCallStatus = "pending" | "running" | "completed" | "failed"

/**
 * Interface de uma tool call
 */
export interface ToolCall {
  /** ID único da tool call */
  id: string
  /** Nome da ferramenta */
  name: string
  /** Argumentos da ferramenta - usando any para evitar propagação de unknown */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>
  /** Status da execução */
  status: ToolCallStatus
  /** Resultado da execução (se completed) - usando any para evitar propagação de unknown */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any
  /** Mensagem de erro (se failed) */
  error?: string
  /** Timestamp de início */
  startedAt?: Date
  /** Timestamp de conclusão */
  completedAt?: Date
}

/**
 * Props do componente ToolCallCard
 */
export interface ToolCallCardProps {
  /** Dados da tool call */
  toolCall: ToolCall
  /** Classe CSS adicional */
  className?: string
  /** Se deve expandir por padrão */
  defaultExpanded?: boolean
}

/**
 * Badge de status da tool call
 */
function StatusBadge({ status }: { status: ToolCallStatus }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    running: "bg-blue-100 text-blue-800 border-blue-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    failed: "bg-red-100 text-red-800 border-red-300",
  }

  const labels = {
    pending: "Aguardando",
    running: "Executando",
    completed: "Concluído",
    failed: "Falhou",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border",
        styles[status]
      )}
    >
      {/* Indicador visual */}
      {status === "running" && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
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
      )}

      {/* Label */}
      {labels[status]}
    </span>
  )
}

/**
 * Componente ToolCallCard
 *
 * Exibe detalhes de uma tool call com suporte a expansão/colapso.
 *
 * @example
 * ```tsx
 * function ToolCallsPanel() {
 *   const toolCall: ToolCall = {
 *     id: "tc-123",
 *     name: "search_documentation",
 *     args: { query: "install docker" },
 *     status: "running"
 *   }
 *
 *   return <ToolCallCard toolCall={toolCall} />
 * }
 * ```
 */
export function ToolCallCard({
  toolCall,
  className,
  defaultExpanded = false,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Verificar se tem argumentos de forma segura
  const argsKeys = Object.keys(toolCall.args || {})
  const showArgsButton = argsKeys.length > 0
  const showArgsPreview = expanded && argsKeys.length > 0

  return (
    <div
      className={cn(
        "border rounded-lg p-3 bg-white shadow-sm",
        "transition-all duration-200",
        className
      )}
    >
      {/* Header: Nome e Status */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900">
            🔧 {toolCall.name}
          </h4>

          {/* Timestamps */}
          {toolCall.startedAt !== undefined && toolCall.startedAt !== null && (
            <p className="text-xs text-gray-500 mt-1">
              Iniciado às {toolCall.startedAt.toLocaleTimeString("pt-BR")}
            </p>
          )}
        </div>

        <StatusBadge status={toolCall.status} />
      </div>

      {/* Botão para expandir/colapsar argumentos */}
      {showArgsButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          {expanded ? "▼ Ocultar" : "▶ Ver"} argumentos
        </button>
      )}

      {/* Argumentos (colapsável) */}
      {showArgsPreview && (
        <div className="mt-2">
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      )}

      {/* Resultado (se completed) */}
      {toolCall.status === "completed" && toolCall.result && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs font-medium text-green-800 mb-1">✓ Resultado:</p>
          <pre className="text-xs text-green-900 overflow-x-auto">
            {typeof toolCall.result === "string"
              ? toolCall.result
              : JSON.stringify(toolCall.result, null, 2)}
          </pre>
        </div>
      )}

      {/* Erro (se failed) */}
      {toolCall.status === "failed" && toolCall.error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs font-medium text-red-800 mb-1">✗ Erro:</p>
          <p className="text-xs text-red-900">{toolCall.error}</p>
        </div>
      )}

      {/* Duração (se completed ou failed) */}
      {(toolCall.status === "completed" || toolCall.status === "failed") &&
        toolCall.startedAt &&
        toolCall.completedAt && (
          <p className="mt-2 text-xs text-gray-500">
            Duração:{" "}
            {((toolCall.completedAt.getTime() - toolCall.startedAt.getTime()) / 1000).toFixed(2)}s
          </p>
        )}
    </div>
  )
}

/**
 * Variante compacta do ToolCallCard (sem expansão)
 */
export function ToolCallCardCompact({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="flex items-center gap-2 py-1 px-2 bg-gray-50 rounded text-xs">
      <span className="font-medium text-gray-700">🔧 {toolCall.name}</span>
      <StatusBadge status={toolCall.status} />
    </div>
  )
}
