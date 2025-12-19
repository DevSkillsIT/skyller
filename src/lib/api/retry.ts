/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T023: Implementar retry com backoff exponencial
 *
 * Utilitário para retry automático de operações com backoff exponencial,
 * conforme NFR-002: Resiliência de Conexão SSE.
 */

/**
 * Interface de configuração de retry
 */
export interface RetryOptions {
  /** Número máximo de tentativas (default: 3) */
  maxAttempts?: number
  /** Delay inicial em milissegundos (default: 1000ms = 1s) */
  initialDelayMs?: number
  /** Delay máximo em milissegundos (default: 8000ms = 8s) */
  maxDelayMs?: number
  /** Multiplicador do backoff exponencial (default: 2) */
  backoffMultiplier?: number
  /** Callback executado antes de cada retry */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
  /** Função para determinar se deve fazer retry baseado no erro */
  shouldRetry?: (error: Error) => boolean
}

/**
 * Interface de retorno com informações de retry
 */
export interface RetryResult<T> {
  /** Resultado da operação */
  data: T
  /** Número de tentativas realizadas */
  attempts: number
  /** Se houve retry */
  hadRetry: boolean
}

/**
 * Função auxiliar para sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executa função com retry e backoff exponencial
 *
 * @param fn - Função assíncrona a ser executada
 * @param options - Opções de configuração
 * @returns Resultado da operação
 * @throws Último erro após esgotar tentativas
 *
 * @example
 * ```typescript
 * // Retry simples (3 tentativas, backoff 1s → 2s → 4s)
 * const data = await retryWithBackoff(
 *   () => fetch("/api/data").then(r => r.json())
 * )
 *
 * // Retry customizado
 * const data = await retryWithBackoff(
 *   () => connectSSE(),
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 500,
 *     maxDelayMs: 10000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Tentativa ${attempt} falhou: ${error.message}`)
 *       console.log(`Aguardando ${delay}ms antes de retry...`)
 *     },
 *     shouldRetry: (error) => error.name === "NetworkError"
 *   }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 8000,
    backoffMultiplier = 2,
    onRetry,
    shouldRetry = () => true,
  } = options

  let attempt = 0
  let delay = initialDelayMs
  let lastError: Error | null = null

  while (attempt < maxAttempts) {
    try {
      attempt++
      const result = await fn()
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Se não deve fazer retry, lança erro imediatamente
      if (!shouldRetry(lastError)) {
        throw lastError
      }

      // Se esgotou tentativas, lança erro
      if (attempt >= maxAttempts) {
        throw lastError
      }

      // Callback antes de retry
      if (onRetry) {
        onRetry(attempt, lastError, delay)
      }

      // Aguarda delay exponencial
      await sleep(delay)

      // Calcula próximo delay (exponencial com limite máximo)
      delay = Math.min(delay * backoffMultiplier, maxDelayMs)
    }
  }

  // Fallback (nunca deve chegar aqui)
  throw lastError || new Error("Retry failed without error")
}

/**
 * Versão do retry que retorna informações sobre tentativas
 *
 * @param fn - Função assíncrona a ser executada
 * @param options - Opções de configuração
 * @returns Resultado com metadata de retry
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoffDetailed(
 *   () => fetch("/api/data").then(r => r.json())
 * )
 *
 * console.log(`Sucesso após ${result.attempts} tentativa(s)`)
 * console.log(`Houve retry: ${result.hadRetry}`)
 * console.log(`Dados:`, result.data)
 * ```
 */
export async function retryWithBackoffDetailed<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  let attempts = 0

  const wrappedFn = async () => {
    const result = await fn()
    return result
  }

  const wrappedOptions: RetryOptions = {
    ...options,
    onRetry: (attempt, error, delay) => {
      attempts = attempt
      options.onRetry?.(attempt, error, delay)
    },
  }

  const data = await retryWithBackoff(wrappedFn, wrappedOptions)
  attempts = attempts || 1 // Se não houve retry, attempts = 1

  return {
    data,
    attempts,
    hadRetry: attempts > 1,
  }
}

/**
 * Hook React para usar retry com estado
 * (Nota: Implementação básica, pode ser expandida)
 */
export function createRetryHook() {
  return {
    retry: retryWithBackoff,
    retryDetailed: retryWithBackoffDetailed,
  }
}
