/**
 * Hook para processar eventos AG-UI do agente
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-023: TOOL_CALL Events - Display tool execution in UI
 * @acceptance AC-024: THINKING Events - Show "thinking" indicator
 * @acceptance AC-025: Lifecycle Events - Conversation start/end
 * @acceptance AC-026: State Snapshot - State management
 * @acceptance AC-027: RUN_ERROR Events - Error handling in chat
 *
 * Processa eventos do @ag-ui/client para exibicao na UI:
 * - TOOL_CALL: Exibe execucao de ferramenta
 * - THINKING: Indica que o agente esta pensando
 * - RUN_ERROR: Tratamento de erros
 * - Lifecycle: Inicio/fim de conversa
 * - State Snapshot: Gerenciamento de estado
 */
"use client";

import { useCallback, useRef, useState } from "react";

// Tipos de eventos AG-UI
export type AgentEventType =
  | "TOOL_CALL"
  | "TOOL_CALL_START"
  | "TOOL_CALL_END"
  | "THINKING"
  | "THINKING_START"
  | "THINKING_END"
  | "RUN_START"
  | "RUN_END"
  | "RUN_ERROR"
  | "STATE_SNAPSHOT"
  | "MESSAGE_START"
  | "MESSAGE_END"
  | "TEXT_DELTA"
  | "STEP_START"
  | "STEP_END";

// Interface para chamada de ferramenta
export interface ToolCall {
  /** ID unico da chamada */
  id: string;
  /** Nome da ferramenta */
  name: string;
  /** Argumentos passados */
  arguments: Record<string, unknown>;
  /** Resultado da execucao (quando disponivel) */
  result?: unknown;
  /** Status da execucao */
  status: "pending" | "running" | "completed" | "error";
  /** Timestamp de inicio */
  startedAt: Date;
  /** Timestamp de conclusao */
  completedAt?: Date;
  /** Mensagem de erro (se houver) */
  error?: string;
}

// Interface para evento de erro
export interface RunError {
  /** Codigo do erro */
  code: string;
  /** Mensagem do erro */
  message: string;
  /** Detalhes adicionais */
  details?: Record<string, unknown>;
  /** Timestamp do erro */
  timestamp: Date;
  /** Se e recuperavel (pode tentar retry) */
  recoverable: boolean;
}

// Interface para snapshot de estado
export interface StateSnapshot {
  /** ID do snapshot */
  id: string;
  /** Estado serializado */
  state: Record<string, unknown>;
  /** Timestamp do snapshot */
  timestamp: Date;
  /** Metadados adicionais */
  metadata?: Record<string, unknown>;
}

// Interface para evento do agente
export interface AgentEvent {
  /** Tipo do evento */
  type: AgentEventType;
  /** Dados do evento */
  data?: unknown;
  /** Timestamp do evento */
  timestamp: Date;
  /** ID de correlacao */
  correlationId?: string;
}

// Estado do processador de eventos
export interface AgentEventsState {
  /** Se o agente esta pensando */
  isThinking: boolean;
  /** Se o agente esta executando */
  isRunning: boolean;
  /** Chamadas de ferramentas ativas */
  activeToolCalls: ToolCall[];
  /** Historico de chamadas de ferramentas */
  toolCallHistory: ToolCall[];
  /** Ultimo erro ocorrido */
  lastError: RunError | null;
  /** Ultimo snapshot de estado */
  lastStateSnapshot: StateSnapshot | null;
  /** ID da execucao atual */
  currentRunId: string | null;
  /** Contagem de eventos processados */
  eventCount: number;
}

// Opcoes do hook
export interface UseAgentEventsOptions {
  /** Callback quando ferramenta inicia */
  onToolCallStart?: (toolCall: ToolCall) => void;
  /** Callback quando ferramenta termina */
  onToolCallEnd?: (toolCall: ToolCall) => void;
  /** Callback quando comeca a pensar */
  onThinkingStart?: () => void;
  /** Callback quando para de pensar */
  onThinkingEnd?: () => void;
  /** Callback quando erro ocorre */
  onError?: (error: RunError) => void;
  /** Callback quando execucao inicia */
  onRunStart?: (runId: string) => void;
  /** Callback quando execucao termina */
  onRunEnd?: (runId: string) => void;
  /** Callback quando snapshot e recebido */
  onStateSnapshot?: (snapshot: StateSnapshot) => void;
  /** Maximo de tool calls no historico */
  maxToolCallHistory?: number;
}

// Retorno do hook
export interface UseAgentEventsReturn extends AgentEventsState {
  /** Processa um evento do agente */
  processEvent: (event: AgentEvent) => void;
  /** Processa multiplos eventos */
  processEvents: (events: AgentEvent[]) => void;
  /** Limpa o estado */
  reset: () => void;
  /** Obtem tool call por ID */
  getToolCall: (id: string) => ToolCall | undefined;
  /** Verifica se ha tool calls ativas */
  hasActiveToolCalls: boolean;
  /** Verifica se tem erro recuperavel */
  hasRecoverableError: boolean;
}

const DEFAULT_MAX_HISTORY = 50;

const initialState: AgentEventsState = {
  isThinking: false,
  isRunning: false,
  activeToolCalls: [],
  toolCallHistory: [],
  lastError: null,
  lastStateSnapshot: null,
  currentRunId: null,
  eventCount: 0,
};

/**
 * Hook para processar eventos AG-UI do agente
 *
 * @example
 * ```tsx
 * const {
 *   isThinking,
 *   isRunning,
 *   activeToolCalls,
 *   lastError,
 *   processEvent,
 * } = useAgentEvents({
 *   onToolCallStart: (tc) => console.log('Tool started:', tc.name),
 *   onError: (err) => toast.error(err.message),
 * });
 *
 * // Processar evento recebido do SSE
 * processEvent({
 *   type: 'TOOL_CALL_START',
 *   data: { id: '1', name: 'search', arguments: { query: 'test' } },
 *   timestamp: new Date(),
 * });
 * ```
 */
export function useAgentEvents(
  options: UseAgentEventsOptions = {}
): UseAgentEventsReturn {
  const {
    onToolCallStart,
    onToolCallEnd,
    onThinkingStart,
    onThinkingEnd,
    onError,
    onRunStart,
    onRunEnd,
    onStateSnapshot,
    maxToolCallHistory = DEFAULT_MAX_HISTORY,
  } = options;

  const [state, setState] = useState<AgentEventsState>(initialState);

  // Refs para callbacks (evita re-renders desnecessarios)
  const callbacksRef = useRef({
    onToolCallStart,
    onToolCallEnd,
    onThinkingStart,
    onThinkingEnd,
    onError,
    onRunStart,
    onRunEnd,
    onStateSnapshot,
  });
  callbacksRef.current = {
    onToolCallStart,
    onToolCallEnd,
    onThinkingStart,
    onThinkingEnd,
    onError,
    onRunStart,
    onRunEnd,
    onStateSnapshot,
  };

  /**
   * Processa evento TOOL_CALL_START
   * AC-023: Display tool execution in UI
   */
  const handleToolCallStart = useCallback(
    (data: unknown) => {
      const toolData = data as {
        id?: string;
        name?: string;
        arguments?: Record<string, unknown>;
      };

      const toolCall: ToolCall = {
        id: toolData.id || `tc-${Date.now()}`,
        name: toolData.name || "unknown",
        arguments: toolData.arguments || {},
        status: "running",
        startedAt: new Date(),
      };

      setState((prev) => ({
        ...prev,
        activeToolCalls: [...prev.activeToolCalls, toolCall],
      }));

      callbacksRef.current.onToolCallStart?.(toolCall);
    },
    []
  );

  /**
   * Processa evento TOOL_CALL_END
   * AC-023: Display tool execution in UI
   */
  const handleToolCallEnd = useCallback(
    (data: unknown) => {
      const toolData = data as {
        id?: string;
        result?: unknown;
        error?: string;
      };

      setState((prev) => {
        const toolCallIndex = prev.activeToolCalls.findIndex(
          (tc) => tc.id === toolData.id
        );

        if (toolCallIndex === -1) return prev;

        const toolCall = prev.activeToolCalls[toolCallIndex];
        const completedToolCall: ToolCall = {
          ...toolCall,
          result: toolData.result,
          error: toolData.error,
          status: toolData.error ? "error" : "completed",
          completedAt: new Date(),
        };

        // Remove da lista ativa e adiciona ao historico
        const newActiveToolCalls = prev.activeToolCalls.filter(
          (tc) => tc.id !== toolData.id
        );
        const newHistory = [completedToolCall, ...prev.toolCallHistory].slice(
          0,
          maxToolCallHistory
        );

        callbacksRef.current.onToolCallEnd?.(completedToolCall);

        return {
          ...prev,
          activeToolCalls: newActiveToolCalls,
          toolCallHistory: newHistory,
        };
      });
    },
    [maxToolCallHistory]
  );

  /**
   * Processa evento THINKING_START
   * AC-024: Show "thinking" indicator
   */
  const handleThinkingStart = useCallback(() => {
    setState((prev) => ({ ...prev, isThinking: true }));
    callbacksRef.current.onThinkingStart?.();
  }, []);

  /**
   * Processa evento THINKING_END
   * AC-024: Show "thinking" indicator
   */
  const handleThinkingEnd = useCallback(() => {
    setState((prev) => ({ ...prev, isThinking: false }));
    callbacksRef.current.onThinkingEnd?.();
  }, []);

  /**
   * Processa evento RUN_START
   * AC-025: Lifecycle events - Conversation start/end
   */
  const handleRunStart = useCallback((data: unknown) => {
    const runData = data as { runId?: string; id?: string };
    const runId = runData.runId || runData.id || `run-${Date.now()}`;

    setState((prev) => ({
      ...prev,
      isRunning: true,
      currentRunId: runId,
      lastError: null,
    }));

    callbacksRef.current.onRunStart?.(runId);
  }, []);

  /**
   * Processa evento RUN_END
   * AC-025: Lifecycle events - Conversation start/end
   */
  const handleRunEnd = useCallback(() => {
    setState((prev) => {
      const runId = prev.currentRunId;
      if (runId) {
        callbacksRef.current.onRunEnd?.(runId);
      }
      return {
        ...prev,
        isRunning: false,
        isThinking: false,
        currentRunId: null,
      };
    });
  }, []);

  /**
   * Processa evento RUN_ERROR
   * AC-027: Error handling in chat
   */
  const handleRunError = useCallback((data: unknown) => {
    const errorData = data as {
      code?: string;
      message?: string;
      details?: Record<string, unknown>;
      recoverable?: boolean;
    };

    const error: RunError = {
      code: errorData.code || "UNKNOWN_ERROR",
      message: errorData.message || "Ocorreu um erro durante a execucao",
      details: errorData.details,
      timestamp: new Date(),
      recoverable: errorData.recoverable ?? false,
    };

    setState((prev) => ({
      ...prev,
      lastError: error,
      isRunning: false,
      isThinking: false,
    }));

    callbacksRef.current.onError?.(error);
  }, []);

  /**
   * Processa evento STATE_SNAPSHOT
   * AC-026: State management
   */
  const handleStateSnapshot = useCallback((data: unknown) => {
    const snapshotData = data as {
      id?: string;
      state?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };

    const snapshot: StateSnapshot = {
      id: snapshotData.id || `snap-${Date.now()}`,
      state: snapshotData.state || {},
      timestamp: new Date(),
      metadata: snapshotData.metadata,
    };

    setState((prev) => ({
      ...prev,
      lastStateSnapshot: snapshot,
    }));

    callbacksRef.current.onStateSnapshot?.(snapshot);
  }, []);

  /**
   * Processa um evento do agente
   */
  const processEvent = useCallback(
    (event: AgentEvent) => {
      setState((prev) => ({ ...prev, eventCount: prev.eventCount + 1 }));

      switch (event.type) {
        case "TOOL_CALL_START":
        case "TOOL_CALL":
          handleToolCallStart(event.data);
          break;
        case "TOOL_CALL_END":
          handleToolCallEnd(event.data);
          break;
        case "THINKING_START":
        case "THINKING":
          handleThinkingStart();
          break;
        case "THINKING_END":
          handleThinkingEnd();
          break;
        case "RUN_START":
          handleRunStart(event.data);
          break;
        case "RUN_END":
          handleRunEnd();
          break;
        case "RUN_ERROR":
          handleRunError(event.data);
          break;
        case "STATE_SNAPSHOT":
          handleStateSnapshot(event.data);
          break;
        case "MESSAGE_START":
          // Inicia mensagem - pode ser usado para streaming
          break;
        case "MESSAGE_END":
          // Fim de mensagem
          break;
        case "TEXT_DELTA":
          // Delta de texto para streaming
          break;
        case "STEP_START":
        case "STEP_END":
          // Eventos de passo (workflow)
          break;
        default:
          // Evento desconhecido - log em desenvolvimento
          if (process.env.NODE_ENV === "development") {
            console.warn("[useAgentEvents] Evento desconhecido:", event.type);
          }
      }
    },
    [
      handleToolCallStart,
      handleToolCallEnd,
      handleThinkingStart,
      handleThinkingEnd,
      handleRunStart,
      handleRunEnd,
      handleRunError,
      handleStateSnapshot,
    ]
  );

  /**
   * Processa multiplos eventos em sequencia
   */
  const processEvents = useCallback(
    (events: AgentEvent[]) => {
      events.forEach(processEvent);
    },
    [processEvent]
  );

  /**
   * Reseta o estado para inicial
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Obtem tool call por ID
   */
  const getToolCall = useCallback(
    (id: string): ToolCall | undefined => {
      return (
        state.activeToolCalls.find((tc) => tc.id === id) ||
        state.toolCallHistory.find((tc) => tc.id === id)
      );
    },
    [state.activeToolCalls, state.toolCallHistory]
  );

  return {
    ...state,
    processEvent,
    processEvents,
    reset,
    getToolCall,
    hasActiveToolCalls: state.activeToolCalls.length > 0,
    hasRecoverableError: state.lastError?.recoverable ?? false,
  };
}

export default useAgentEvents;
