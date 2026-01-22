/**
 * Hook para SSE (Server-Sent Events) com auto-reconnection
 * @spec SPEC-COPILOT-INTEGRATION-001
 *
 * Configuracao padrao:
 * - Max retries: 3
 * - Retry delay: 2000ms
 * - Exponential backoff: 1.5x
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SSEConfig {
  /** URL do endpoint SSE */
  url: string;
  /** Numero maximo de tentativas de reconexao (padrao: 3) */
  maxRetries?: number;
  /** Delay inicial entre tentativas em ms (padrao: 2000) */
  retryDelay?: number;
  /** Fator de backoff exponencial (padrao: 1.5) */
  backoffMultiplier?: number;
  /** Headers adicionais para a requisicao */
  headers?: Record<string, string>;
  /** Callback quando a conexao e estabelecida */
  onConnect?: () => void;
  /** Callback quando a conexao e fechada */
  onDisconnect?: () => void;
  /** Callback quando ocorre erro */
  onError?: (error: Error) => void;
  /** Callback quando recebe mensagem */
  onMessage?: (event: MessageEvent) => void;
}

export interface SSEState {
  /** Indica se esta conectado */
  isConnected: boolean;
  /** Indica se esta tentando reconectar */
  isReconnecting: boolean;
  /** Numero de tentativas de reconexao */
  retryCount: number;
  /** Ultimo erro ocorrido */
  error: Error | null;
  /** Segundos restantes ate proxima tentativa (para countdown UI) */
  retryCountdown: number;
}

export interface SSERateLimitInfo {
  /** Limite de requests por minuto */
  limit: number;
  /** Requests restantes */
  remaining: number;
  /** Segundos ate reset */
  resetSeconds: number;
  /** Indica se rate limit foi excedido (429) */
  isLimited: boolean;
}

export interface UseSSEReturn extends SSEState {
  /** Conecta ao servidor SSE */
  connect: () => void;
  /** Desconecta do servidor SSE */
  disconnect: () => void;
  /** Informacoes de rate limit */
  rateLimit: SSERateLimitInfo | null;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 2000;
const DEFAULT_BACKOFF_MULTIPLIER = 1.5;

/**
 * Hook para gerenciar conexoes SSE com auto-reconnection
 *
 * @example
 * ```tsx
 * const { isConnected, isReconnecting, retryCountdown, connect, disconnect } = useSSE({
 *   url: '/api/copilot',
 *   onMessage: (event) => console.log(event.data),
 *   onError: (error) => console.error(error),
 * });
 * ```
 */
export function useSSE(config: SSEConfig): UseSSEReturn {
  const {
    url,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER,
    headers,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = config;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    isReconnecting: false,
    retryCount: 0,
    error: null,
    retryCountdown: 0,
  });

  const [rateLimit, setRateLimit] = useState<SSERateLimitInfo | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  // Limpa timeouts e intervals
  const clearTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Inicia countdown para proxima tentativa
  const startRetryCountdown = useCallback((seconds: number) => {
    setState((prev) => ({ ...prev, retryCountdown: seconds }));

    countdownIntervalRef.current = setInterval(() => {
      setState((prev) => {
        const newCountdown = Math.max(0, prev.retryCountdown - 1);
        return { ...prev, retryCountdown: newCountdown };
      });
    }, 1000);
  }, []);

  // Fecha a conexao atual
  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Calcula delay com backoff exponencial
  const getRetryDelay = useCallback(
    (attemptNumber: number) => {
      return Math.round(retryDelay * backoffMultiplier ** attemptNumber);
    },
    [retryDelay, backoffMultiplier]
  );

  // Tenta reconectar
  const attemptReconnect = useCallback(
    (currentRetryCount: number) => {
      if (currentRetryCount >= maxRetries) {
        setState((prev) => ({
          ...prev,
          isReconnecting: false,
          error: new Error(`Falha ao reconectar apos ${maxRetries} tentativas`),
        }));
        onError?.(new Error(`Falha ao reconectar apos ${maxRetries} tentativas`));
        return;
      }

      const delay = getRetryDelay(currentRetryCount);
      const delaySeconds = Math.ceil(delay / 1000);

      setState((prev) => ({
        ...prev,
        isReconnecting: true,
        retryCount: currentRetryCount + 1,
      }));

      startRetryCountdown(delaySeconds);

      retryTimeoutRef.current = setTimeout(() => {
        clearTimers();
        // A reconexao sera tratada pelo connect()
        // que sera chamado apos o timeout
      }, delay);
    },
    [maxRetries, getRetryDelay, startRetryCountdown, clearTimers, onError]
  );

  // Conecta ao servidor SSE
  const connect = useCallback(() => {
    // Fecha conexao existente
    closeConnection();
    clearTimers();
    shouldReconnectRef.current = true;

    // Cria URL com headers como query params (EventSource nao suporta headers customizados)
    // Para headers customizados, seria necessario usar fetch com ReadableStream
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setState({
        isConnected: true,
        isReconnecting: false,
        retryCount: 0,
        error: null,
        retryCountdown: 0,
      });
      onConnect?.();
    };

    eventSource.onmessage = (event) => {
      onMessage?.(event);
    };

    eventSource.onerror = () => {
      const wasConnected = eventSourceRef.current?.readyState === EventSource.OPEN;

      closeConnection();

      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: new Error("Conexao SSE perdida"),
      }));

      onDisconnect?.();

      // Tenta reconectar se estava conectado e devemos reconectar
      if (shouldReconnectRef.current) {
        attemptReconnect(wasConnected ? 0 : state.retryCount);
      }
    };

    // Listener para eventos de rate limit
    eventSource.addEventListener("rate_limit", (event) => {
      try {
        const data = JSON.parse(event.data);
        setRateLimit({
          limit: data.limit || 30,
          remaining: data.remaining || 0,
          resetSeconds: data.reset_seconds || 60,
          isLimited: true,
        });
      } catch {
        // Ignora erro de parse
      }
    });

    return eventSource;
  }, [
    url,
    closeConnection,
    clearTimers,
    onConnect,
    onMessage,
    onDisconnect,
    attemptReconnect,
    state.retryCount,
  ]);

  // Desconecta do servidor SSE
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimers();
    closeConnection();

    setState({
      isConnected: false,
      isReconnecting: false,
      retryCount: 0,
      error: null,
      retryCountdown: 0,
    });

    onDisconnect?.();
  }, [closeConnection, clearTimers, onDisconnect]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearTimers();
      closeConnection();
    };
  }, [clearTimers, closeConnection]);

  return {
    ...state,
    connect,
    disconnect,
    rateLimit,
  };
}

export default useSSE;
