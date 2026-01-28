/**
 * API Client para Skyller
 *
 * @description Funcoes utilitarias para comunicacao com o backend e gerenciamento de estado.
 * Inclui helpers para organizacao multi-tenant e cookies.
 *
 * @module lib/api-client
 */

import type { Session } from "next-auth";

// ==============================================================================
// Constantes
// ==============================================================================

const ACTIVE_ORG_COOKIE = "active-organization";

// ==============================================================================
// 401 Unauthorized Handler
// ==============================================================================

/**
 * Limpa cookies de autenticacao do NextAuth.
 *
 * Necessario antes de redirecionar para login quando o token expira,
 * para evitar erro "400 Bad Request - Header Too Large" causado por
 * cookies acumulados sendo enviados para o Keycloak.
 */
function clearAuthCookies(): void {
  if (typeof document === "undefined") return;

  // Lista de cookies do NextAuth que precisam ser limpos
  // Usa prefixos para pegar tanto dev quanto prod
  const cookiePrefixes = [
    "authjs.",
    "__Secure-authjs.",
    "__Host-authjs.",
    "next-auth.",
    "__Secure-next-auth.",
  ];

  // Obter todos os cookies
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name] = cookie.split("=").map((c) => c.trim());

    // Verificar se e um cookie de auth
    const isAuthCookie = cookiePrefixes.some((prefix) => name.startsWith(prefix));

    if (isAuthCookie) {
      // Limpar o cookie definindo data de expiracao no passado
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // Tambem tentar com secure flag para cookies __Secure-
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure`;
    }
  }
}

/**
 * Handler para erros 401 (Unauthorized).
 *
 * Quando o backend retorna 401 (token expirado, invalido, ou backend reiniciado),
 * redireciona automaticamente para a pagina de login para renovar a sessao.
 *
 * O fluxo completo:
 * 1. API retorna 401 Unauthorized
 * 2. handleUnauthorized() limpa cookies de auth (evita 400 Header Too Large)
 * 3. Redireciona para /api/auth/signin
 * 4. NextAuth inicia fluxo OIDC com Keycloak
 * 5. Usuario e autenticado e retorna para a pagina original (callbackUrl)
 *
 * @param currentPath - Path atual para retornar apos login (opcional)
 */
export function handleUnauthorized(currentPath?: string): void {
  // Apenas executa no client-side
  if (typeof window === "undefined") return;

  // Evitar loops de redirect se ja estiver na pagina de auth
  if (
    window.location.pathname.startsWith("/auth") ||
    window.location.pathname.startsWith("/api/auth")
  ) {
    return;
  }

  // Construir URL de callback para retornar apos login
  const callbackUrl = currentPath || window.location.pathname + window.location.search;
  const encodedCallback = encodeURIComponent(callbackUrl);

  // Log para debug em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("[API Client] 401 Unauthorized - Redirecionando para login", {
      callbackUrl,
      currentPath: window.location.pathname,
    });
  }

  // IMPORTANTE: Limpar cookies de auth ANTES de redirecionar
  // Isso evita erro "400 Bad Request - Header Too Large" no Keycloak
  clearAuthCookies();

  // Redirecionar para signin do NextAuth com callback
  // Isso inicia o fluxo OIDC automaticamente
  window.location.href = `/api/auth/signin?callbackUrl=${encodedCallback}`;
}

// ==============================================================================
// Organization Helpers
// ==============================================================================

/**
 * Obtem a organizacao ativa do usuario
 *
 * Prioridade:
 * 1. Session (activeOrganization)
 * 2. Cookie (active-organization)
 * 3. Hostname (subdomain)
 * 4. Primeira org disponivel
 *
 * @param session - Sessao do NextAuth
 * @returns Alias da organizacao ativa
 */
export function getActiveOrganization(session: Session | null): string | undefined {
  if (!session?.user) return undefined;

  // Cast para acessar campos customizados
  const user = session.user as {
    activeOrganization?: string;
    organizations?: string[];
  };

  // 1. Tentar da session
  if (user.activeOrganization) {
    return user.activeOrganization;
  }

  // 2. Tentar do cookie (client-side only)
  if (typeof window !== "undefined") {
    const cookieValue = getCookie(ACTIVE_ORG_COOKIE);
    if (cookieValue && user.organizations?.includes(cookieValue)) {
      return cookieValue;
    }

    // 3. Tentar do hostname
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];
    if (subdomain && subdomain !== "www" && subdomain !== "admin") {
      if (user.organizations?.includes(subdomain)) {
        return subdomain;
      }
    }
  }

  // 4. Primeira org disponivel
  return user.organizations?.[0];
}

/**
 * Define a organizacao ativa no cookie
 *
 * @param orgAlias - Alias da organizacao
 */
export function setActiveOrganization(orgAlias: string): void {
  if (typeof window === "undefined") return;

  // Cookie valido por 30 dias
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  document.cookie = `${ACTIVE_ORG_COOKIE}=${orgAlias}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Remove o cookie de organizacao ativa
 */
export function clearActiveOrganization(): void {
  if (typeof window === "undefined") return;

  document.cookie = `${ACTIVE_ORG_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ==============================================================================
// Cookie Helpers
// ==============================================================================

/**
 * Obtem o valor de um cookie
 *
 * @param name - Nome do cookie
 * @returns Valor do cookie ou undefined
 */
export function getCookie(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }

  return undefined;
}

/**
 * Define um cookie
 *
 * @param name - Nome do cookie
 * @param value - Valor do cookie
 * @param days - Dias ate expirar (default: 30)
 */
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

// ==============================================================================
// API Helpers
// ==============================================================================

/**
 * Base URL para chamadas de API
 *
 * Client-side: Usa URL relativa para passar pelo proxy do Next.js (evita CORS)
 * Server-side: Usa NEXUS_API_URL diretamente
 */
export function getApiBaseUrl(): string {
  // Server-side: usar variavel de ambiente
  if (typeof window === "undefined") {
    return process.env.NEXUS_API_URL || "http://localhost:8000";
  }

  // Client-side: usar URL relativa (proxy via Next.js rewrites)
  // Isso evita problemas de CORS pois a requisicao vai para o mesmo dominio
  return "";
}

/**
 * Classe de erro customizada para erros de API
 * Inclui o status code e a response para tratamento adequado
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response: Response
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * Faz uma requisicao GET para a API
 *
 * @param endpoint - Endpoint da API (ex: "/users")
 * @param options - Opcoes adicionais do fetch
 * @returns Response da API
 * @throws {ApiError} Quando a requisicao falha (exceto 401 que redireciona para login)
 */
export async function apiGet<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // 401 Unauthorized: Token expirado ou invalido - redirecionar para login
    if (response.status === 401) {
      handleUnauthorized();
      // Lançar erro para interromper o fluxo (o redirect ja foi iniciado)
      throw new ApiError(response.status, "Session expired - redirecting to login", response);
    }

    // Outros erros: lançar para tratamento pelo chamador
    throw new ApiError(response.status, response.statusText, response);
  }

  return response.json();
}

/**
 * Faz uma requisicao POST para a API
 *
 * @param endpoint - Endpoint da API
 * @param data - Dados a enviar
 * @param options - Opcoes adicionais do fetch
 * @returns Response da API
 * @throws {ApiError} Quando a requisicao falha (exceto 401 que redireciona para login)
 */
export async function apiPost<T, D = unknown>(
  endpoint: string,
  data?: D,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    // 401 Unauthorized: Token expirado ou invalido - redirecionar para login
    if (response.status === 401) {
      handleUnauthorized();
      // Lançar erro para interromper o fluxo (o redirect ja foi iniciado)
      throw new ApiError(response.status, "Session expired - redirecting to login", response);
    }

    // Outros erros: lançar para tratamento pelo chamador
    throw new ApiError(response.status, response.statusText, response);
  }

  return response.json();
}

// ==============================================================================
// Authenticated API Helper (usa Session do NextAuth)
// ==============================================================================

/**
 * Interface para session com campos customizados
 */
interface AuthSession {
  user?: {
    id?: string;
    tenant_id?: string;
    email?: string | null;
  };
  accessToken?: string;
}

/**
 * Contexto adicional para headers de API
 *
 * Esses headers sao usados para logging, auditoria e RBAC no backend:
 * - X-Session-ID: Identificacao da sessao do navegador
 * - X-Conversation-ID: Identificacao da conversa atual
 * - X-Thread-ID: Alternativa ao conversation_id (AG-UI)
 * - X-Workspace-ID: Identificacao do workspace atual
 * - X-Agent-ID: Identificacao do agente sendo usado
 */
export interface ApiContext {
  sessionId?: string;
  conversationId?: string;
  threadId?: string;
  workspaceId?: string;
  agentId?: string;
}

/**
 * Cria headers de autenticacao a partir da session do NextAuth
 *
 * @param session - Session do NextAuth (com accessToken)
 * @param context - Contexto adicional opcional (sessionId, conversationId, etc.)
 * @returns Headers com Authorization, X-Tenant-ID, X-User-ID e headers de contexto
 *
 * @example
 * // Uso basico (sem contexto)
 * const headers = createAuthHeaders(session);
 *
 * @example
 * // Uso com contexto completo
 * const headers = createAuthHeaders(session, {
 *   sessionId: "sess_abc123",
 *   conversationId: "conv_xyz789",
 *   workspaceId: "ws_123",
 *   agentId: "skyller"
 * });
 */
export function createAuthHeaders(session: AuthSession | null, context?: ApiContext): HeadersInit {
  if (!session?.user) return {};

  const headers: Record<string, string> = {};

  // Authorization header (JWT token)
  if (session.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  // Headers de contexto multi-tenant (obrigatorios)
  if (session.user.tenant_id) {
    headers["X-Tenant-ID"] = session.user.tenant_id;
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

/**
 * Opcoes estendidas para requisicoes autenticadas
 */
export interface AuthRequestOptions extends RequestInit {
  /** Contexto adicional para headers (sessionId, conversationId, etc.) */
  context?: ApiContext;
}

/**
 * Faz uma requisicao GET autenticada para a API
 *
 * @param endpoint - Endpoint da API (ex: "/api/v1/agents")
 * @param session - Session do NextAuth
 * @param options - Opcoes adicionais do fetch (inclui context para headers extras)
 * @returns Response da API
 * @throws {ApiError} Quando a requisicao falha
 *
 * @example
 * // Uso basico
 * const agents = await authGet('/api/v1/agents', session);
 *
 * @example
 * // Uso com contexto
 * const history = await authGet('/api/v1/conversations/123/messages', session, {
 *   context: { sessionId: 'sess_abc', conversationId: '123' }
 * });
 */
export async function authGet<T>(
  endpoint: string,
  session: AuthSession | null,
  options?: AuthRequestOptions
): Promise<T> {
  const { context, ...fetchOptions } = options || {};
  const authHeaders = createAuthHeaders(session, context);

  // Nota: credentials: "include" removido pois autenticacao e via header Authorization
  // e nao via cookies. Isso evita problemas de CORS com wildcard origins.
  return apiGet<T>(endpoint, {
    ...fetchOptions,
    headers: {
      ...authHeaders,
      ...fetchOptions?.headers,
    },
  });
}

/**
 * Faz uma requisicao POST autenticada para a API
 *
 * @param endpoint - Endpoint da API
 * @param session - Session do NextAuth
 * @param data - Dados a enviar
 * @param options - Opcoes adicionais do fetch (inclui context para headers extras)
 * @returns Response da API
 * @throws {ApiError} Quando a requisicao falha
 *
 * @example
 * // Uso basico
 * await authPost('/api/v1/agents/skyller/track-usage', session, {});
 *
 * @example
 * // Uso com contexto
 * await authPost('/api/v1/agents/skyller/track-usage', session, {}, {
 *   context: {
 *     sessionId: 'sess_abc',
 *     conversationId: 'conv_123',
 *     agentId: 'skyller'
 *   }
 * });
 */
export async function authPost<T, D = unknown>(
  endpoint: string,
  session: AuthSession | null,
  data?: D,
  options?: AuthRequestOptions
): Promise<T> {
  const { context, ...fetchOptions } = options || {};
  const authHeaders = createAuthHeaders(session, context);

  // Nota: credentials: "include" removido pois autenticacao e via header Authorization
  // e nao via cookies. Isso evita problemas de CORS com wildcard origins.
  return apiPost<T, D>(endpoint, data, {
    ...fetchOptions,
    headers: {
      ...authHeaders,
      ...fetchOptions?.headers,
    },
  });
}
