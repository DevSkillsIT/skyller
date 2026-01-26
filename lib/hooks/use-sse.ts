"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ⚠️ LEGACY HOOK - DESCONTINUADO NO CAMINHO PRINCIPAL
 *
 * Este hook foi descontinuado no caminho principal da aplicação em favor do
 * gerenciamento nativo de SSE fornecido pelo CopilotKit useAgent v2.
 *
 * **Status**: MANTIDO PARA BACKWARD COMPATIBILITY
 *
 * **Motivação da Descontinuação**:
 * - CopilotKit useAgent v2 gerencia SSE connection nativamente com backoff exponencial
 * - Reconexão automática é tratada internamente pelo framework
 * - Reduz duplicação de código e mantém consistência com padrões CopilotKit
 *
 * **Caminho Principal Atual**:
 * - `lib/contexts/chat-context.tsx` usa `useAgent` com subscription a eventos SSE
 * - Eventos: SSE_RECONNECTING, SSE_RECONNECTED, SSE_MAX_RETRIES_EXCEEDED
 *
 * **Quando Usar Este Hook**:
 * - Integração com sistemas legados que não usam CopilotKit
 * - Conexões SSE customizadas fora do fluxo de chat principal
 * - Testes e desenvolvimento de features experimentais
 *
 * **Migração Recomendada**:
 * ```tsx
 * // ANTES (use-sse.ts)
 * const { isConnected, reconnectAttempt } = useSse({
 *   url: "/api/copilot",
 *   maxRetries: 5,
 *   onReconnecting: (attempt) => toast.info(`Reconectando... ${attempt}/5`)
 * });
 *
 * // DEPOIS (useAgent v2 com subscription)
 * const { agent } = useAgent({ agentId: 'skyller' });
 * useEffect(() => {
 *   const { unsubscribe } = agent.subscribe({
 *     onCustomEvent: ({ event }) => {
 *       if (event.name === 'SSE_RECONNECTING') {
 *         toast.info(`Reconectando... ${event.value.attempt}/5`);
 *       }
 *     }
 *   });
 *   return unsubscribe;
 * }, [agent]);
 * ```
 *
 * **Referências**:
 * - SPEC-COPILOT-INTEGRATION-001 v1.2.1 (Migração para useAgent v2)
 * - Consolidação de Reauditorias Multi-IA (OBS-02)
 *
 * @deprecated Use CopilotKit useAgent v2 com subscription a eventos SSE
 */

/**
 * Opções de configuração para o hook useSse
 */
export interface UseSseOptions {
  /** URL do endpoint SSE */
  url: string;

  /** Número máximo de tentativas de reconexão (padrão: 5) */
  maxRetries?: number;

  /** Delay inicial para reconexão em ms (padrão: 1000ms)
   * Usa backoff exponencial: 1s → 2s → 4s → 8s → 16s
   */
  initialRetryDelay?: number;

  /** Callback quando iniciar reconexão */
  onReconnecting?: (attempt: number, maxRetries: number) => void;

  /** Callback quando reconectar com sucesso */
  onReconnected?: () => void;

  /** Callback quando exceder máximo de tentativas */
  onMaxRetriesExceeded?: () => void;

  /** Callback quando receber mensagem */
  onMessage?: (event: MessageEvent) => void;

  /** Callback quando ocorrer erro */
  onError?: (error: Event) => void;

  /** Callback quando a conexão abrir */
  onOpen?: (event: Event) => void;

  /** Headers customizados para a requisição */
  headers?: Record<string, string>;

  /** Desabilitar reconexão automática (padrão: false) */
  disableReconnect?: boolean;
}

/**
 * Estado de retorno do hook useSse
 */
export interface UseSseState {
  /** Se está conectado ao SSE */
  isConnected: boolean;

  /** Tentativa atual de reconexão (0 se conectado) */
  reconnectAttempt: number;

  /** Conectar ao endpoint SSE */
  connect: () => void;

  /** Desconectar do endpoint SSE */
  disconnect: () => void;

  /** EventSource atual (null se desconectado) */
  eventSource: EventSource | null;
}

/**
 * Hook para gerenciar conexão SSE (Server-Sent Events) com reconexão automática
 *
 * Implementa backoff exponencial: 1s → 2s → 4s → 8s → 16s
 *
 * @example
 * ```tsx
 * const { isConnected, reconnectAttempt, connect, disconnect } = useSse({
 *   url: "/api/copilot",
 *   maxRetries: 5,
 *   onReconnecting: (attempt) => {
 *     toast.info(`Reconectando... (tentativa ${attempt}/5)`);
 *   },
 *   onReconnected: () => {
 *     toast.success("Conexão restabelecida");
 *   },
 *   onMaxRetriesExceeded: () => {
 *     toast.error("Conexão perdida. Recarregue a página.");
 *   },
 *   onMessage: (event) => {
 *     console.log("Mensagem recebida:", event.data);
 *   },
 * });
 * ```
 */
export function useSse(options: UseSseOptions): UseSseState {
  const {
    url,
    maxRetries = 5,
    initialRetryDelay = 1000,
    onReconnecting,
    onReconnected,
    onMaxRetriesExceeded,
    onMessage,
    onError,
    onOpen,
    headers,
    disableReconnect = false,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectAttemptRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);

  /**
   * Calcula o delay de reconexão usando backoff exponencial
   * 1s → 2s → 4s → 8s → 16s
   */
  const getReconnectDelay = useCallback(
    (attempt: number): number => {
      return initialRetryDelay * 2 ** (attempt - 1);
    },
    [initialRetryDelay]
  );

  const updateReconnectAttempt = useCallback((value: number) => {
    reconnectAttemptRef.current = value;
    setReconnectAttempt(value);
  }, []);

  /**
   * Fecha a conexão SSE atual
   */
  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /**
   * Tenta reconectar ao SSE
   */
  const attemptReconnect = useCallback(() => {
    if (disableReconnect || isManualDisconnectRef.current) {
      return;
    }

    const nextAttempt = reconnectAttemptRef.current + 1;

    if (nextAttempt > maxRetries) {
      updateReconnectAttempt(maxRetries);
      onMaxRetriesExceeded?.();
      return;
    }

    const delay = getReconnectDelay(nextAttempt);
    updateReconnectAttempt(nextAttempt);
    onReconnecting?.(nextAttempt, maxRetries);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [
    disableReconnect,
    maxRetries,
    onMaxRetriesExceeded,
    onReconnecting,
    getReconnectDelay,
    updateReconnectAttempt,
  ]);

  /**
   * Conecta ao endpoint SSE
   */
  const connect = useCallback(() => {
    // Fecha conexão existente
    closeConnection();
    isManualDisconnectRef.current = false;

    try {
      // Cria nova conexão EventSource
      const eventSource = new EventSource(url, {
        withCredentials: true,
      });

      // Handler para abertura da conexão
      eventSource.onopen = (event) => {
        setIsConnected(true);
        const wasReconnecting = reconnectAttemptRef.current > 0;
        updateReconnectAttempt(0);

        // Se estava reconectando, notifica sucesso
        if (wasReconnecting) {
          onReconnected?.();
        }

        onOpen?.(event);
      };

      // Handler para mensagens
      eventSource.onmessage = (event) => {
        onMessage?.(event);
      };

      // Handler para erros
      eventSource.onerror = (error) => {
        console.error("[use-sse] EventSource error:", error);
        setIsConnected(false);
        onError?.(error);

        // Fecha conexão e tenta reconectar
        closeConnection();
        attemptReconnect();
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("[use-sse] Failed to create EventSource:", error);
      setIsConnected(false);
      attemptReconnect();
    }
  }, [
    url,
    closeConnection,
    onReconnected,
    onOpen,
    onMessage,
    onError,
    attemptReconnect,
    updateReconnectAttempt,
  ]);

  /**
   * Desconecta do endpoint SSE (manual)
   */
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    updateReconnectAttempt(0);
    closeConnection();
  }, [closeConnection, updateReconnectAttempt]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isManualDisconnectRef.current = true;
      closeConnection();
    };
  }, [closeConnection]);

  return {
    isConnected,
    reconnectAttempt,
    connect,
    disconnect,
    eventSource: eventSourceRef.current,
  };
}
