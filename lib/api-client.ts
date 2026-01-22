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
 * Faz uma requisicao GET para a API
 *
 * @param endpoint - Endpoint da API (ex: "/users")
 * @param options - Opcoes adicionais do fetch
 * @returns Response da API
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
