/**
 * Centraliza a montagem de headers de autenticacao e contexto.
 *
 * Regras inegociaveis:
 * - X-Tenant-ID deve ser UUID (nunca slug).
 * - X-User-ID deve refletir o sub do access_token.
 * - Authorization vem do accessToken da session.
 *
 * Objetivo: evitar duplicacao e ambiguidade no frontend.
 */

export interface AuthSession {
  user?: {
    id?: string;
    tenant_id?: string;
    email?: string | null;
  };
  accessToken?: string;
}

export interface ApiContext {
  sessionId?: string;
  conversationId?: string;
  threadId?: string;
  workspaceId?: string;
  agentId?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) return {};
  if (input instanceof Headers) {
    return Object.fromEntries(input.entries());
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(input);
  }
  return input as Record<string, string>;
}

export function mergeHeaders(...inputs: Array<HeadersInit | undefined>): Record<string, string> {
  return inputs.reduce<Record<string, string>>((acc, input) => {
    const normalized = normalizeHeaders(input);
    return { ...acc, ...normalized };
  }, {});
}

/**
 * Cria headers de autenticacao a partir da session do NextAuth.
 *
 * @param session - Session do NextAuth (com accessToken)
 * @param context - Contexto adicional opcional (sessionId, conversationId, etc.)
 * @returns Headers com Authorization, X-Tenant-ID, X-User-ID e headers de contexto
 */
export function createAuthHeaders(
  session: AuthSession | null,
  context?: ApiContext
): Record<string, string> {
  if (!session?.user) return {};

  const headers: Record<string, string> = {};

  // Authorization header (JWT token)
  if (session.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  // Headers multi-tenant (obrigatorios)
  if (session.user.tenant_id) {
    if (isUuid(session.user.tenant_id)) {
      headers["X-Tenant-ID"] = session.user.tenant_id;
    } else {
      console.error(
        `[auth-headers] tenant_id invalido (nao UUID) recebido na session: ${session.user.tenant_id}`
      );
    }
  }
  if (session.user.id) {
    headers["X-User-ID"] = session.user.id;
  }

  // Headers de contexto adicional (opcionais)
  if (context) {
    if (context.sessionId) {
      headers["X-Session-ID"] = context.sessionId;
    }
    if (context.conversationId) {
      headers["X-Conversation-ID"] = context.conversationId;
    }
    if (context.threadId) {
      headers["X-Thread-ID"] = context.threadId;
    }
    if (context.workspaceId) {
      headers["X-Workspace-ID"] = context.workspaceId;
    }
    if (context.agentId) {
      headers["X-Agent-ID"] = context.agentId;
    }
  }

  return headers;
}
