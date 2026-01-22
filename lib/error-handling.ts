/**
 * Structured Error Handling & Logging
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance CI-08: Structured Error Handling
 * @acceptance RU-003/RU-004: Erros JSON com error/message/details
 *
 * Padronizacao de erros JSON + logging estruturado multi-tenant
 */

/**
 * Contexto de erro para logging estruturado
 */
export interface ErrorContext {
  /** ID do tenant (para isolamento RLS) */
  tenantId?: string;
  /** ID do usuario */
  userId?: string;
  /** ID da conversa */
  conversationId?: string;
  /** Caminho da API */
  path?: string;
  /** Metadados adicionais */
  metadata?: Record<string, unknown>;
}

/**
 * Resposta de erro padronizada
 */
export interface ErrorResponse {
  /** Codigo de erro para programacao */
  error: string;
  /** Mensagem amigavel para usuario */
  message: string;
  /** Detalhes tecnicos (apenas em dev) */
  details?: string;
  /** Campos adicionais */
  retry_after?: number;
}

/**
 * Erro de API customizado com status HTTP
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Trata erro e retorna Response JSON padronizada
 *
 * @param error - Erro a ser tratado
 * @param ctx - Contexto para logging (tenant_id, user_id, etc)
 * @param options - Opcoes de tratamento
 * @returns Response JSON padronizada
 *
 * @example
 * ```ts
 * catch (error) {
 *   return handleApiError(error, {
 *     tenantId: session?.user?.tenant_id,
 *     userId: session?.user?.id,
 *     path: req.nextUrl.pathname,
 *   });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  ctx: ErrorContext,
  options?: { maskDetails?: boolean }
): Response {
  // Logging estruturado com contexto RLS
  console.error("[api:error]", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...ctx,
    timestamp: new Date().toISOString(),
  });

  // Determinar status e mensagem baseado no tipo de erro
  let status = 500;
  let errorCode = "runtime_error";
  let message = "Erro ao processar requisicao";
  let retryAfter: number | undefined;

  if (error instanceof ApiError) {
    status = error.status;
    errorCode = error.code;
    message = error.message;
  } else if (error instanceof Error) {
    // Detectar erros especificos
    if (error.message.includes("NEXUS_API_URL")) {
      status = 503;
      errorCode = "configuration_error";
      message = "Servico temporariamente indisponivel";
    } else if (error.message.includes("fetch")) {
      status = 502;
      errorCode = "backend_error";
      message = "Erro ao comunicar com o servidor";
    } else if (error.message.includes("rate limit") || error.message.includes("429")) {
      status = 429;
      errorCode = "rate_limited";
      message = "Limite de requisicoes excedido";
      retryAfter = 60;
    }
  }

  // Resposta padronizada JSON
  const isDevelopment = process.env.NODE_ENV === "development";

  const responseBody: ErrorResponse = {
    error: errorCode,
    message,
  };

  // Incluir detalhes apenas em desenvolvimento e se nao mascarado
  if (isDevelopment && !options?.maskDetails && error instanceof Error) {
    responseBody.details = error.message;
  }

  // Incluir retry_after para rate limiting
  if (retryAfter) {
    responseBody.retry_after = retryAfter;
  }

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

/**
 * Cria erro 401 Unauthorized padronizado
 */
export function unauthorized(message = "Nao autenticado - faca login para continuar"): Response {
  return new Response(
    JSON.stringify({
      error: "unauthorized",
      message,
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Cria erro 403 Forbidden padronizado
 */
export function forbidden(message = "Acesso negado"): Response {
  return new Response(
    JSON.stringify({
      error: "forbidden",
      message,
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Cria erro 503 Service Unavailable padronizado
 */
export function serviceUnavailable(message = "Servico temporariamente indisponivel"): Response {
  return new Response(
    JSON.stringify({
      error: "service_error",
      message,
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}
