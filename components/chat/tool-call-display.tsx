/**
 * ToolCallDisplay - Exibe chamadas de ferramentas do agente
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-023: TOOL_CALL Events - Display tool execution in UI
 *
 * Componente para visualizar execucao de ferramentas:
 * - Status da execucao (running, completed, error)
 * - Nome e argumentos da ferramenta
 * - Resultado ou mensagem de erro
 * - Tempo de execucao
 */
"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ToolCall } from "@/lib/hooks/use-agent-events";
import { cn } from "@/lib/utils";

export interface ToolCallDisplayProps {
  /** Chamada de ferramenta a ser exibida */
  toolCall: ToolCall;
  /** Se deve mostrar detalhes expandidos por padrao */
  defaultExpanded?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Se o componente e compacto (para lista) */
  compact?: boolean;
}

/**
 * Formata duracao de execucao
 */
function formatDuration(startedAt: Date, completedAt?: Date): string {
  const end = completedAt || new Date();
  const durationMs = end.getTime() - startedAt.getTime();

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  return `${(durationMs / 1000).toFixed(1)}s`;
}

/**
 * Formata argumentos para exibicao
 */
function formatArguments(args: Record<string, unknown>): string {
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

/**
 * Formata resultado para exibicao
 */
function formatResult(result: unknown): string {
  if (result === undefined) return "";
  try {
    if (typeof result === "string") return result;
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

/**
 * Icone de status da ferramenta
 */
function StatusIcon({ status }: { status: ToolCall["status"] }) {
  switch (status) {
    case "running":
    case "pending":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Wrench className="h-4 w-4 text-muted-foreground" />;
  }
}

/**
 * Badge de status
 */
function StatusBadge({ status }: { status: ToolCall["status"] }) {
  const statusConfig = {
    pending: {
      label: "Aguardando",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    running: {
      label: "Executando",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    completed: {
      label: "Concluido",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    error: {
      label: "Erro",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", config.className)}>
      {config.label}
    </span>
  );
}

/**
 * ToolCallDisplay - Componente para exibir chamada de ferramenta
 *
 * @example
 * ```tsx
 * <ToolCallDisplay
 *   toolCall={{
 *     id: "1",
 *     name: "search",
 *     arguments: { query: "test" },
 *     status: "completed",
 *     startedAt: new Date(),
 *     result: { items: [] },
 *   }}
 * />
 * ```
 */
export function ToolCallDisplay({
  toolCall,
  defaultExpanded = false,
  className,
  compact = false,
}: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Formata dados para exibicao
  const formattedArgs = useMemo(() => formatArguments(toolCall.arguments), [toolCall.arguments]);
  const formattedResult = useMemo(() => formatResult(toolCall.result), [toolCall.result]);
  const duration = useMemo(
    () => formatDuration(toolCall.startedAt, toolCall.completedAt),
    [toolCall.startedAt, toolCall.completedAt]
  );
  const timeAgo = useMemo(
    () =>
      formatDistanceToNow(toolCall.startedAt, {
        addSuffix: true,
        locale: ptBR,
      }),
    [toolCall.startedAt]
  );

  // Versao compacta para listas
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm", className)}>
        <StatusIcon status={toolCall.status} />
        <span className="font-mono text-xs">{toolCall.name}</span>
        <StatusBadge status={toolCall.status} />
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {duration}
        </span>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "border rounded-lg bg-muted/30 overflow-hidden",
          toolCall.status === "error" && "border-red-200 dark:border-red-900",
          className
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50 rounded-none"
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={toolCall.status} />
              <div className="flex flex-col items-start">
                <span className="font-mono text-sm font-medium">{toolCall.name}</span>
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={toolCall.status} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        {/* Conteudo expandido */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t">
            {/* Argumentos */}
            {Object.keys(toolCall.arguments).length > 0 && (
              <div className="pt-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Argumentos
                </span>
                <pre className="mt-1 p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
                  {formattedArgs}
                </pre>
              </div>
            )}

            {/* Resultado */}
            {toolCall.status === "completed" && formattedResult && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resultado
                </span>
                <pre className="mt-1 p-2 rounded bg-muted text-xs font-mono overflow-x-auto max-h-48">
                  {formattedResult}
                </pre>
              </div>
            )}

            {/* Erro */}
            {toolCall.status === "error" && toolCall.error && (
              <div>
                <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Erro
                </span>
                <pre className="mt-1 p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs font-mono text-red-600 dark:text-red-400 overflow-x-auto">
                  {toolCall.error}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * Lista de chamadas de ferramentas ativas
 */
export interface ActiveToolCallsProps {
  /** Lista de tool calls ativas */
  toolCalls: ToolCall[];
  /** Classe CSS adicional */
  className?: string;
}

export function ActiveToolCalls({ toolCalls, className }: ActiveToolCallsProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">
        Ferramentas em execucao ({toolCalls.length})
      </span>
      <div className="space-y-1">
        {toolCalls.map((tc) => (
          <ToolCallDisplay key={tc.id} toolCall={tc} compact />
        ))}
      </div>
    </div>
  );
}

export default ToolCallDisplay;
