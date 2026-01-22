/**
 * Hook para gerenciar estado de Rate Limiting com countdown UI
 * @spec SPEC-COPILOT-INTEGRATION-001
 * AC-012: Retornar 429 com retry_after header quando limite excedido
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RateLimitState {
  /** Limite de requests por minuto */
  limit: number;
  /** Requests restantes */
  remaining: number;
  /** Segundos ate reset */
  resetSeconds: number;
  /** Indica se rate limit foi excedido (429) */
  isLimited: boolean;
  /** Timestamp do ultimo update */
  lastUpdated: number;
}

export interface UseRateLimitOptions {
  /** Limite padrao de RPM (padrao: 30) */
  defaultLimit?: number;
  /** Callback quando rate limit e excedido */
  onLimitExceeded?: (resetSeconds: number) => void;
  /** Callback quando rate limit e restaurado */
  onLimitRestored?: () => void;
}

export interface UseRateLimitReturn extends RateLimitState {
  /** Atualiza estado de rate limit a partir de headers de resposta */
  updateFromHeaders: (headers: Headers) => void;
  /** Atualiza estado de rate limit manualmente */
  updateRateLimit: (state: Partial<RateLimitState>) => void;
  /** Reseta o estado de rate limit */
  reset: () => void;
  /** Formata tempo restante para exibicao (ex: "0:45") */
  formattedTime: string;
}

const DEFAULT_LIMIT = 30;

/**
 * Hook para gerenciar estado de rate limiting com countdown automatico
 *
 * @example
 * ```tsx
 * const { isLimited, remaining, formattedTime, updateFromHeaders } = useRateLimit({
 *   onLimitExceeded: (seconds) => toast.error(`Limite excedido. Tente em ${seconds}s`),
 * });
 *
 * // Apos uma requisicao:
 * const response = await fetch('/api/copilot');
 * updateFromHeaders(response.headers);
 *
 * // No JSX:
 * {isLimited && <div>Aguarde {formattedTime} para continuar</div>}
 * ```
 */
export function useRateLimit(options: UseRateLimitOptions = {}): UseRateLimitReturn {
  const { defaultLimit = DEFAULT_LIMIT, onLimitExceeded, onLimitRestored } = options;

  const [state, setState] = useState<RateLimitState>({
    limit: defaultLimit,
    remaining: defaultLimit,
    resetSeconds: 0,
    isLimited: false,
    lastUpdated: Date.now(),
  });

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasLimitedRef = useRef(false);

  // Limpa interval do countdown
  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Inicia countdown automatico
  const startCountdown = useCallback(
    (seconds: number) => {
      clearCountdown();

      if (seconds <= 0) return;

      countdownIntervalRef.current = setInterval(() => {
        setState((prev) => {
          const newSeconds = Math.max(0, prev.resetSeconds - 1);
          const newIsLimited = newSeconds > 0;

          // Notifica quando rate limit e restaurado
          if (!newIsLimited && wasLimitedRef.current) {
            wasLimitedRef.current = false;
            onLimitRestored?.();
          }

          return {
            ...prev,
            resetSeconds: newSeconds,
            isLimited: newIsLimited,
            remaining: newIsLimited ? 0 : prev.limit,
          };
        });
      }, 1000);
    },
    [clearCountdown, onLimitRestored]
  );

  // Atualiza estado a partir de headers de resposta
  const updateFromHeaders = useCallback(
    (headers: Headers) => {
      const limit = parseInt(headers.get("X-RateLimit-Limit") || String(defaultLimit), 10);
      const remaining = parseInt(headers.get("X-RateLimit-Remaining") || String(limit), 10);
      const resetSeconds = parseInt(
        headers.get("Retry-After") || headers.get("X-RateLimit-Reset") || "0",
        10
      );

      const isLimited = remaining === 0 || resetSeconds > 0;

      setState({
        limit,
        remaining,
        resetSeconds,
        isLimited,
        lastUpdated: Date.now(),
      });

      if (isLimited && !wasLimitedRef.current) {
        wasLimitedRef.current = true;
        onLimitExceeded?.(resetSeconds);
        startCountdown(resetSeconds);
      } else if (!isLimited) {
        clearCountdown();
        wasLimitedRef.current = false;
      }
    },
    [defaultLimit, onLimitExceeded, startCountdown, clearCountdown]
  );

  // Atualiza estado manualmente
  const updateRateLimit = useCallback(
    (newState: Partial<RateLimitState>) => {
      setState((prev) => {
        const updated = { ...prev, ...newState, lastUpdated: Date.now() };

        if (updated.isLimited && !prev.isLimited) {
          wasLimitedRef.current = true;
          onLimitExceeded?.(updated.resetSeconds);
          startCountdown(updated.resetSeconds);
        }

        return updated;
      });
    },
    [onLimitExceeded, startCountdown]
  );

  // Reseta o estado
  const reset = useCallback(() => {
    clearCountdown();
    wasLimitedRef.current = false;
    setState({
      limit: defaultLimit,
      remaining: defaultLimit,
      resetSeconds: 0,
      isLimited: false,
      lastUpdated: Date.now(),
    });
  }, [clearCountdown, defaultLimit]);

  // Formata tempo restante para exibicao
  const formattedTime = useCallback(() => {
    const minutes = Math.floor(state.resetSeconds / 60);
    const seconds = state.resetSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [state.resetSeconds])();

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  return {
    ...state,
    updateFromHeaders,
    updateRateLimit,
    reset,
    formattedTime,
  };
}

export default useRateLimit;
