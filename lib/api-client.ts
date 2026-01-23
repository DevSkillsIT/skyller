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
 */
export function getApiBaseUrl(): string {
  // Server-side: usar variavel de ambiente
  if (typeof window === "undefined") {
    return process.env.NEXUS_API_URL || "http://localhost:8000";
  }

  // Client-side: usar URL relativa ou configurada
  return process.env.NEXT_PUBLIC_API_URL || "";
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
 * @throws {ApiError} Quando a requisicao falha (inclui status 401/403)
 */
export async function apiGet<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // Lançar erro customizado com status code para tratamento adequado de 401/403
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
 * @throws {ApiError} Quando a requisicao falha (inclui status 401/403)
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
    // Lançar erro customizado com status code para tratamento adequado de 401/403
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
 * Cria headers de autenticacao a partir da session do NextAuth
 *
 * @param session - Session do NextAuth (com accessToken)
 * @returns Headers com Authorization, X-Tenant-ID e X-User-ID
 */
export function createAuthHeaders(session: AuthSession | null): HeadersInit {
  if (!session?.user) return {};

  const headers: HeadersInit = {};

  // Authorization header (JWT token)
  if (session.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  // Headers de contexto multi-tenant
  if (session.user.tenant_id) {
    headers["X-Tenant-ID"] = session.user.tenant_id;
  }
  if (session.user.id) {
    headers["X-User-ID"] = session.user.id;
  }

  return headers;
}

/**
 * Faz uma requisicao GET autenticada para a API
 *
 * @param endpoint - Endpoint da API (ex: "/api/v1/agents")
 * @param session - Session do NextAuth
 * @param options - Opcoes adicionais do fetch
 * @returns Response da API
 * @throws {ApiError} Quando a requisicao falha
 */
export async function authGet<T>(
  endpoint: string,
  session: AuthSession | null,
  options?: RequestInit
): Promise<T> {
  const authHeaders = createAuthHeaders(session);

  // Nota: credentials: "include" removido pois autenticacao e via header Authorization
  // e nao via cookies. Isso evita problemas de CORS com wildcard origins.
  return apiGet<T>(endpoint, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });
}

/**
 * Faz uma requisicao POST autenticada para a API
 *
 * @param endpoint - Endpoint da API
 * @param session - Session do NextAuth
 * @param data - Dados a enviar
 * @param options - Opcoes adicionais do fetch
 * @returns Response da API
 * @throws {ApiError} Quando a requisicao falha
 */
export async function authPost<T, D = unknown>(
  endpoint: string,
  session: AuthSession | null,
  data?: D,
  options?: RequestInit
): Promise<T> {
  const authHeaders = createAuthHeaders(session);

  // Nota: credentials: "include" removido pois autenticacao e via header Authorization
  // e nao via cookies. Isso evita problemas de CORS com wildcard origins.
  return apiPost<T, D>(endpoint, data, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });
}
