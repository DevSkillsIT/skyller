import { useEffect, useState } from "react";

/**
 * Interface do estado de rate limiting
 * Sincronizada com headers do backend (X-RateLimit-*)
 */
interface RateLimitState {
  /** Se o usuário está atualmente limitado */
  isLimited: boolean;
  /** Número de requisições restantes nesta janela */
  remaining: number;
  /** Limite total de requisições por minuto */
  limit: number;
  /** Data/hora quando o rate limit será resetado */
  resetAt: Date | null;
  /** Tempo formatado até o reset (ex: "59s" ou "1m 30s") */
  formattedTime: string;
}

/**
 * Hook para gerenciar rate limiting conectado ao backend
 *
 * Intercepta respostas fetch para extrair headers X-RateLimit-*
 * conforme especificação AC-012/RU-005 (30 RPM)
 *
 * @returns Estado atual do rate limiting
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { isLimited, remaining, formattedTime } = useRateLimit();
 *
 *   return (
 *     <div>
 *       {isLimited && <p>Aguarde {formattedTime}</p>}
 *       <button disabled={isLimited || remaining === 0}>
 *         Enviar ({remaining} restantes)
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRateLimit(): RateLimitState {
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    remaining: 30, // Valor inicial conforme SPEC (30 RPM)
    limit: 30, // Limite padrão conforme SPEC
    resetAt: null,
    formattedTime: "",
  });

  useEffect(() => {
    const originalFetch = window.fetch;
    let countdownInterval: NodeJS.Timeout | null = null;

    // Interceptar todas as chamadas fetch
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);

      // Extrair headers de rate limit (presentes em 200 e 429)
      const limitHeader = response.headers.get("X-RateLimit-Limit");
      const remainingHeader = response.headers.get("X-RateLimit-Remaining");
      const resetHeader = response.headers.get("X-RateLimit-Reset");
      const retryAfterHeader = response.headers.get("Retry-After");

      // Se resposta 429 (rate limit excedido)
      if (response.status === 429) {
        const limit = parseInt(limitHeader || "30", 10);
        const remaining = parseInt(remainingHeader || "0", 10);
        const resetTimestamp = parseInt(resetHeader || "0", 10);
        const retryAfter = parseInt(retryAfterHeader || "60", 10);

        // Calcular data de reset
        const resetAt = resetTimestamp
          ? new Date(resetTimestamp * 1000)
          : new Date(Date.now() + retryAfter * 1000);

        setState({
          isLimited: true,
          remaining,
          limit,
          resetAt,
          formattedTime: formatSecondsToTime(Math.floor((resetAt.getTime() - Date.now()) / 1000)),
        });

        // Limpar intervalo anterior se existir
        if (countdownInterval) {
          clearInterval(countdownInterval);
        }

        // Iniciar countdown até reset
        countdownInterval = setInterval(() => {
          const secondsLeft = Math.floor((resetAt.getTime() - Date.now()) / 1000);

          if (secondsLeft <= 0) {
            if (countdownInterval) {
              clearInterval(countdownInterval);
              countdownInterval = null;
            }
            setState((prev) => ({
              ...prev,
              isLimited: false,
              remaining: limit,
              resetAt: null,
              formattedTime: "",
            }));
          } else {
            setState((prev) => ({
              ...prev,
              formattedTime: formatSecondsToTime(secondsLeft),
            }));
          }
        }, 1000);
      }

      // Atualizar remaining em respostas bem-sucedidas
      if (response.ok && remainingHeader) {
        const remaining = parseInt(remainingHeader, 10);
        const limit = parseInt(limitHeader || "30", 10);

        setState((prev) => ({
          ...prev,
          remaining,
          limit,
        }));
      }

      return response;
    };

    // Cleanup: restaurar fetch original e limpar intervalo
    return () => {
      window.fetch = originalFetch;
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  return state;
}

/**
 * Formata segundos em string legível (ex: "59s" ou "1m 30s")
 *
 * @param seconds - Número de segundos
 * @returns String formatada
 */
function formatSecondsToTime(seconds: number): string {
  if (seconds < 0) return "0s";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${minutes}m ${secs}s`;
}
