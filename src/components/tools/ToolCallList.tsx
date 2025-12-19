/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T028: Componente ToolCallList
 *
 * Componente para exibir lista de tool calls com suporte a
 * filtragem por status e agrupamento.
 */

"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import { ToolCallCard, ToolCallCardCompact, type ToolCall, type ToolCallStatus } from "./ToolCallCard"

/**
 * Props do componente ToolCallList
 */
export interface ToolCallListProps {
  /** Lista de tool calls */
  toolCalls: ToolCall[]
  /** Filtro de status (opcional) */
  statusFilter?: ToolCallStatus | "all"
  /** Se deve usar modo compacto */
  compact?: boolean
  /** Classe CSS adicional */
  className?: string
  /** Se deve agrupar por status */
  groupByStatus?: boolean
}

/**
 * Componente para header de grupo
 */
function GroupHeader({ status, count }: { status: ToolCallStatus; count: number }) {
  const statusLabels = {
    pending: "Aguardando",
    running: "Em Execução",
    completed: "Concluídos",
    failed: "Falharam",
  }

  const statusIcons = {
    pending: "⏳",
    running: "⚙️",
    completed: "✅",
    failed: "❌",
  }

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-100 rounded-t-lg border-b border-gray-200">
      <span className="text-lg">{statusIcons[status]}</span>
      <h3 className="font-medium text-sm text-gray-900">
        {statusLabels[status]} ({count})
      </h3>
    </div>
  )
}

/**
 * Componente ToolCallList
 *
 * Exibe lista de tool calls com suporte a filtragem e agrupamento.
 *
 * @example
 * ```tsx
 * function ToolsPanel() {
 *   const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
 *
 *   return (
 *     <ToolCallList
 *       toolCalls={toolCalls}
 *       groupByStatus
 *     />
 *   )
 * }
 * ```
 */
export function ToolCallList({
  toolCalls,
  statusFilter = "all",
  compact = false,
  className,
  groupByStatus = false,
}: ToolCallListProps) {
  // Filtra tool calls por status
  const filteredToolCalls = useMemo(() => {
    if (statusFilter === "all") return toolCalls
    return toolCalls.filter((tc) => tc.status === statusFilter)
  }, [toolCalls, statusFilter])

  // Agrupa tool calls por status - sempre retorna o mesmo tipo para evitar problemas de tipagem
  const groupedToolCalls = useMemo((): Record<ToolCallStatus, ToolCall[]> => {
    const groups: Record<ToolCallStatus, ToolCall[]> = {
      pending: [],
      running: [],
      completed: [],
      failed: [],
    }

    if (!groupByStatus) {
      // Quando não agrupa, coloca todos em "running" como placeholder (não será usado)
      return groups
    }

    filteredToolCalls.forEach((tc) => {
      groups[tc.status].push(tc)
    })

    return groups
  }, [filteredToolCalls, groupByStatus])

  // Se não há tool calls
  if (filteredToolCalls.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center text-gray-500",
          className
        )}
      >
        <div className="text-3xl mb-2">🔧</div>
        <p className="text-sm">Nenhuma ferramenta executada ainda</p>
      </div>
    )
  }

  // Renderiza lista sem agrupamento
  if (!groupByStatus) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {filteredToolCalls.map((toolCall) =>
          compact ? (
            <ToolCallCardCompact key={toolCall.id} toolCall={toolCall} />
          ) : (
            <ToolCallCard key={toolCall.id} toolCall={toolCall} />
          )
        )}
      </div>
    )
  }

  // Renderiza lista agrupada
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Grupo: Running */}
      {groupedToolCalls.running.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <GroupHeader status="running" count={groupedToolCalls.running.length} />
          <div className="p-3 space-y-3 bg-blue-50">
            {groupedToolCalls.running.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        </div>
      )}

      {/* Grupo: Pending */}
      {groupedToolCalls.pending.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <GroupHeader status="pending" count={groupedToolCalls.pending.length} />
          <div className="p-3 space-y-3 bg-yellow-50">
            {groupedToolCalls.pending.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        </div>
      )}

      {/* Grupo: Completed */}
      {groupedToolCalls.completed.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <GroupHeader status="completed" count={groupedToolCalls.completed.length} />
          <div className="p-3 space-y-3">
            {groupedToolCalls.completed.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} defaultExpanded={false} />
            ))}
          </div>
        </div>
      )}

      {/* Grupo: Failed */}
      {groupedToolCalls.failed.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <GroupHeader status="failed" count={groupedToolCalls.failed.length} />
          <div className="p-3 space-y-3 bg-red-50">
            {groupedToolCalls.failed.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} defaultExpanded />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Componente de resumo de tool calls
 */
export function ToolCallSummary({ toolCalls }: { toolCalls: ToolCall[] }) {
  const summary = useMemo(() => {
    const stats = {
      total: toolCalls.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    }

    toolCalls.forEach((tc) => {
      stats[tc.status]++
    })

    return stats
  }, [toolCalls])

  if (summary.total === 0) return null

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-gray-700">Total:</span>
        <span className="text-sm text-gray-900">{summary.total}</span>
      </div>

      {summary.running > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-blue-600">⚙️ {summary.running}</span>
        </div>
      )}

      {summary.pending > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-yellow-600">⏳ {summary.pending}</span>
        </div>
      )}

      {summary.completed > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-green-600">✅ {summary.completed}</span>
        </div>
      )}

      {summary.failed > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-red-600">❌ {summary.failed}</span>
        </div>
      )}
    </div>
  )
}
