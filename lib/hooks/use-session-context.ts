"use client";

/**
 * Hook useSessionContext - Gerenciamento centralizado de contexto de sessao
 *
 * @description Gera e persiste session_id unico por sessao do navegador.
 * Centraliza todos os IDs de contexto necessarios para headers de API.
 *
 * Headers gerenciados:
 * - X-Session-ID: ID unico da sessao do navegador
 * - X-Conversation-ID: ID da conversa atual
 * - X-Workspace-ID: ID do workspace atual
 * - X-Agent-ID: ID do agente sendo usado
 *
 * @module lib/hooks/use-session-context
 */

import { useCallback, useEffect, useMemo, useState } from "react";

// ==============================================================================
// Types
// ==============================================================================

/**
 * Contexto completo para headers de API
 */
export interface ApiContext {
  sessionId: string;
  conversationId?: string;
  threadId?: string;
  workspaceId?: string;
  agentId?: string;
}

/**
 * Estado retornado pelo hook
 */
export interface UseSessionContextState {
  /** ID unico da sessao (persistido em sessionStorage) */
  sessionId: string;
  /** ID da conversa atual */
  conversationId: string | null;
  /** Thread ID do AG-UI (alternativa ao conversationId) */
  threadId: string | null;
  /** ID do workspace atual */
  workspaceId: string | null;
  /** ID do agente atual */
  agentId: string | null;
  /** Contexto completo para passar ao api-client */
  apiContext: ApiContext;
  /** Atualizar conversation ID */
  setConversationId: (id: string | null) => void;
  /** Atualizar thread ID */
  setThreadId: (id: string | null) => void;
  /** Atualizar workspace ID */
  setWorkspaceId: (id: string | null) => void;
  /** Atualizar agent ID */
  setAgentId: (id: string | null) => void;
  /** Gerar novo session ID (para reset) */
  regenerateSessionId: () => string;
}

// ==============================================================================
// Constants
// ==============================================================================

const SESSION_ID_KEY = "skyller_session_id";
const SESSION_ID_PREFIX = "sess_";

// ==============================================================================
// Helpers
// ==============================================================================

/**
 * Gera um UUID v4 com prefixo para facilitar identificacao
 */
function generateSessionId(): string {
  // Usar crypto.randomUUID se disponivel (mais seguro)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${SESSION_ID_PREFIX}${crypto.randomUUID()}`;
  }

  // Fallback para geracao manual
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback extremo para SSR
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Formatar como UUID v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${SESSION_ID_PREFIX}${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Obtem session ID do sessionStorage ou gera um novo
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    // SSR: retornar placeholder (sera substituido no client)
    return generateSessionId();
  }

  try {
    const stored = sessionStorage.getItem(SESSION_ID_KEY);
    if (stored?.startsWith(SESSION_ID_PREFIX)) {
      return stored;
    }

    // Gerar novo e persistir
    const newId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  } catch {
    // sessionStorage indisponivel (modo privado, etc)
    return generateSessionId();
  }
}

// ==============================================================================
// Hook
// ==============================================================================

/**
 * Hook para gerenciamento centralizado de contexto de sessao.
 *
 * @example
 * const { sessionId, apiContext, setConversationId } = useSessionContext();
 *
 * // Usar em chamadas de API
 * await authPost('/api/v1/agents/track-usage', session, {}, { context: apiContext });
 *
 * // Atualizar contexto
 * setConversationId("conv-123");
 * setWorkspaceId("ws-456");
 */
export function useSessionContext(): UseSessionContextState {
  // Estado principal
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Sincronizar com sessionStorage no mount (hydration)
  useEffect(() => {
    const storedId = getOrCreateSessionId();
    if (storedId !== sessionId) {
      setSessionId(storedId);
    }
  }, [sessionId]);

  // Regenerar session ID (para reset/logout)
  const regenerateSessionId = useCallback(() => {
    const newId = generateSessionId();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_ID_KEY, newId);
      } catch {
        // Ignorar erro de storage
      }
    }
    setSessionId(newId);
    return newId;
  }, []);

  // Contexto completo para API
  const apiContext = useMemo<ApiContext>(() => {
    const ctx: ApiContext = {
      sessionId,
    };

    // Adicionar apenas valores definidos
    if (conversationId) ctx.conversationId = conversationId;
    if (threadId) ctx.threadId = threadId;
    if (workspaceId) ctx.workspaceId = workspaceId;
    if (agentId) ctx.agentId = agentId;

    return ctx;
  }, [sessionId, conversationId, threadId, workspaceId, agentId]);

  return {
    sessionId,
    conversationId,
    threadId,
    workspaceId,
    agentId,
    apiContext,
    setConversationId,
    setThreadId,
    setWorkspaceId,
    setAgentId,
    regenerateSessionId,
  };
}

export default useSessionContext;
