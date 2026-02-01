/**
 *
 * Este hook foi descontinuado no caminho principal da aplicação em favor do
 * gerenciamento nativo de eventos fornecido pelo CopilotKit useAgent v2.
 *
 * **Status**: MANTIDO PARA BACKWARD COMPATIBILITY
 *
 * **Motivação da Descontinuação**:
 * - CopilotKit useAgent v2 fornece subscription nativa a eventos AG-UI
 * - Eventos são processados via agent.subscribe() com interface tipada
 * - Reduz camada de abstração desnecessária e mantém consistência com framework
 *
 * **Caminho Principal Atual**:
 * - `lib/contexts/chat-context.tsx` processa eventos diretamente via agent.subscribe()
 * - Eventos suportados: THINKING_START/END, TOOL_CALL_START/END, RUN_ERROR
 * - Estado gerenciado localmente no ChatContext via useState
 *
 * **Quando Usar Este Hook**:
 * - Integração com sistemas legados que precisam de interface simplificada
 * - Componentes isolados que não têm acesso ao ChatContext
 * - Testes e desenvolvimento de features experimentais
 *
 * **Migração Recomendada**:
 * ```tsx
 * // ANTES (useAgentEvents)
 * const agent = useAgent({ ... });
 * const { isThinking, currentTool, lastError } = useAgentEvents(agent);
 *
 * // DEPOIS (agent.subscribe direto)
 * const [currentTool, setCurrentTool] = useState<string>();
 * const [thinkingState, setThinkingState] = useState<string>();
 *
 * useEffect(() => {
 *   const { unsubscribe } = agent.subscribe({
 *     onCustomEvent: ({ event }) => {
 *       if (event.name === 'TOOL_CALL_START') {
 *         setCurrentTool(event.value?.toolName);
 *       }
 *       if (event.name === 'THINKING_START') {
 *         setThinkingState('Analisando...');
 *       }
 *     }
 *   });
 *   return unsubscribe;
 * }, [agent]);
 * ```
 *
 * **Requisitos SPEC Atendidos pelo Caminho Principal**:
 * - AC-023: Exibir tool calls em execução ✅ (via agent.subscribe onCustomEvent)
 * - AC-024: Exibir thinking state ✅ (via agent.subscribe onCustomEvent)
 * - AC-027: Exibir erros de execução ✅ (via agent.subscribe onCustomEvent)
 *
 * **Referências**:
 * - SPEC-COPILOT-INTEGRATION-001 v1.2.1 (GAP-CRIT-03: Subscription a eventos AG-UI)
 * - Consolidação de Reauditorias Multi-IA (OBS-02)
 * - _shared/docs/04-REFERENCE/agno-copilotkit/02-hooks-reference.md (agent.subscribe interface)
 *
 *
 * ---
 *
 * Hook para processar eventos AG-UI (GAP-CRIT-03)
 *
 * Processa eventos do agente:
 * - THINKING_START/END: Estado de pensamento do agente
 * - TOOL_CALL_START/END: Execução de ferramentas
 * - RUN_ERROR: Erros durante execução
 *
 * Requisitos SPEC:
 * - AC-023: Exibir tool calls em execução
 * - AC-024: Exibir thinking state
 * - AC-027: Exibir erros de execução
 */

import { useCallback, useEffect, useState } from "react";

/**
 * Estados possíveis de um tool call
 */
export type ToolCallStatus = "running" | "success" | "error";

/**
 * Informações sobre tool call em execução
 */
export interface CurrentTool {
  name: string;
  status: ToolCallStatus;
  startedAt: Date;
}

/**
 * Informações sobre erro de execução
 */
export interface LastError {
  message: string;
  code: string;
  timestamp: Date;
}

/**
 * Estado completo dos eventos do agente
 */
export interface AgentEventsState {
  isThinking: boolean;
  thinkingMessage: string;
  currentTool?: CurrentTool;
  lastError?: LastError;
}

/**
 * Tipo de eventos AG-UI suportados
 */
export type AgentEventType =
  | "THINKING_START"
  | "THINKING_END"
  | "TOOL_CALL_START"
  | "TOOL_CALL_END"
  | "RUN_ERROR";

/**
 * Interface de evento do agente
 */
export interface AgentEvent {
  type: AgentEventType;
  toolName?: string;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Interface mínima esperada do agente
 */
export interface Agent {
  subscribe?: (callback: (event: AgentEvent) => void) => () => void;
}

/**
 * Hook para processar eventos AG-UI do agente
 *
 * @param agent - Instância do agente (opcional)
 * @returns Estado dos eventos processados
 *
 * @example
 * ```tsx
 * const agent = useAgent({ ... });
 * const events = useAgentEvents(agent);
 *
 * if (events.isThinking) {
 *   return <div>{events.thinkingMessage}</div>;
 * }
 * ```
 */
export function useAgentEvents(agent?: Agent | null): AgentEventsState {
  const [state, setState] = useState<AgentEventsState>({
    isThinking: false,
    thinkingMessage: "",
  });

  /**
   * Processa evento THINKING_START
   */
  const handleThinkingStart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isThinking: true,
      thinkingMessage: "🧠 Analisando sua solicitação...",
    }));
  }, []);

  /**
   * Processa evento THINKING_END
   */
  const handleThinkingEnd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isThinking: false,
      thinkingMessage: "",
    }));
  }, []);

  /**
   * Processa evento TOOL_CALL_START
   */
  const handleToolCallStart = useCallback((toolName: string) => {
    setState((prev) => ({
      ...prev,
      currentTool: {
        name: toolName,
        status: "running",
        startedAt: new Date(),
      },
    }));
  }, []);

  /**
   * Processa evento TOOL_CALL_END
   */
  const handleToolCallEnd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTool: undefined,
    }));
  }, []);

  /**
   * Processa evento RUN_ERROR
   */
  const handleRunError = useCallback((errorData: { message: string; code?: string }) => {
    setState((prev) => ({
      ...prev,
      isThinking: false,
      currentTool: undefined,
      lastError: {
        message: errorData.message,
        code: errorData.code || "UNKNOWN",
        timestamp: new Date(),
      },
    }));
  }, []);

  /**
   * Handler principal de eventos
   */
  const handleEvent = useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "THINKING_START":
          handleThinkingStart();
          break;

        case "THINKING_END":
          handleThinkingEnd();
          break;

        case "TOOL_CALL_START":
          if (event.toolName) {
            handleToolCallStart(event.toolName);
          }
          break;

        case "TOOL_CALL_END":
          handleToolCallEnd();
          break;

        case "RUN_ERROR":
          if (event.error) {
            handleRunError(event.error);
          }
          break;

        default:
          console.warn(`[useAgentEvents] Evento desconhecido: ${event.type}`);
      }
    },
    [handleThinkingStart, handleThinkingEnd, handleToolCallStart, handleToolCallEnd, handleRunError]
  );

  /**
   * Subscrição a eventos do agente
   */
  useEffect(() => {
    if (!agent || !agent.subscribe) {
      // Se o agente não está disponível ou não suporta eventos, não fazer nada
      return;
    }

    // Subscrever a eventos do agente
    const unsubscribe = agent.subscribe(handleEvent);

    // Cleanup: desinscrever ao desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [agent, handleEvent]);

  return state;
}

/**
 * Hook para obter mensagem contextual de tool call
 *
 * Converte nome técnico de ferramentas em mensagens amigáveis
 *
 * @param toolName - Nome técnico da ferramenta
 * @returns Mensagem amigável
 *
 * @example
 * ```tsx
 * const message = useToolCallMessage("search_docs");
 * // Retorna: "Consultando documentação..."
 * ```
 */
export function useToolCallMessage(toolName?: string): string {
  if (!toolName) return "";

  // Mapeamento de ferramentas para mensagens amigáveis
  const toolMessages: Record<string, string> = {
    search_docs: "Consultando documentação...",
    search_database: "Pesquisando no banco de dados...",
    analyze_data: "Analisando dados...",
    generate_code: "Gerando código...",
    execute_query: "Executando consulta...",
  };

  return toolMessages[toolName] || `Executando ${toolName}...`;
}
