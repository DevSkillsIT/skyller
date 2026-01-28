/**
 * Hook useConversations - Gerenciamento de conversas
 *
 * @description Hook para listar, renomear e deletar conversas do usuario.
 * Integra com a API de historico de chat do backend.
 *
 * @spec SPEC-CHAT-HISTORY-INTEGRATION-001
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { authGet, authPut, authDelete } from "@/lib/api-client";

// ==============================================================================
// Types
// ==============================================================================

/**
 * Resumo de uma conversa (lista)
 */
export interface ConversationSummary {
  id: string;
  session_id: string;
  title: string | null;
  message_count: number;
  last_message_at: string | null;
  agent_id: string;
  created_at: string;
}

/**
 * Resposta paginada da API de conversas
 */
export interface ConversationListResponse {
  items: ConversationSummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Mensagem individual de uma conversa
 */
export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  created_at_ts: number;
}

/**
 * Resposta paginada da API de mensagens
 */
export interface MessageListResponse {
  items: MessageItem[];
  conversation_id: string;
  total: number;
  next_cursor: number | null;
  has_more: boolean;
}

/**
 * Retorno do hook useConversations
 */
export interface UseConversationsReturn {
  /** Lista de conversas */
  conversations: ConversationSummary[];
  /** Total de conversas */
  total: number;
  /** Indica se esta carregando */
  isLoading: boolean;
  /** Erro, se houver */
  error: Error | null;
  /** Recarrega a lista de conversas */
  refresh: () => Promise<void>;
  /** Renomeia uma conversa */
  rename: (conversationId: string, newTitle: string) => Promise<void>;
  /** Remove uma conversa */
  remove: (conversationId: string) => Promise<void>;
  /** Carrega mensagens de uma conversa (com paginacao) */
  loadMessages: (conversationId: string, cursor?: number) => Promise<MessageListResponse>;
}

// ==============================================================================
// Hook
// ==============================================================================

/**
 * Hook para gerenciamento de conversas
 *
 * @param limit - Numero maximo de conversas a buscar (default: 20)
 * @returns Estado e funcoes para gerenciar conversas
 *
 * @example
 * const {
 *   conversations,
 *   isLoading,
 *   error,
 *   refresh,
 *   rename,
 *   remove,
 *   loadMessages
 * } = useConversations();
 *
 * // Listar conversas
 * conversations.map(c => <ConversationItem key={c.id} conversation={c} />)
 *
 * // Renomear
 * await rename(conversationId, 'Novo titulo');
 *
 * // Deletar
 * await remove(conversationId);
 *
 * // Carregar mensagens com paginacao
 * const messages = await loadMessages(conversationId);
 * const moreMessages = await loadMessages(conversationId, messages.next_cursor);
 */
export function useConversations(limit = 20): UseConversationsReturn {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Busca lista de conversas da API
   */
  const fetchConversations = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authGet<ConversationListResponse>(
        `/api/v1/conversations?limit=${limit}`,
        session
      );
      setConversations(response.items);
      setTotal(response.total);
    } catch (err) {
      console.error("[useConversations] Erro ao buscar conversas:", err);
      setError(err instanceof Error ? err : new Error("Falha ao buscar conversas"));
    } finally {
      setIsLoading(false);
    }
  }, [session, limit]);

  // Buscar conversas ao montar ou quando session/limit mudar
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /**
   * Renomeia uma conversa
   */
  const rename = useCallback(
    async (conversationId: string, newTitle: string) => {
      if (!session) {
        throw new Error("Sessao nao disponivel");
      }

      await authPut(`/api/v1/conversations/${conversationId}`, session, { title: newTitle });

      // Atualizar estado local (otimistic update)
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c))
      );
    },
    [session]
  );

  /**
   * Remove uma conversa
   */
  const remove = useCallback(
    async (conversationId: string) => {
      if (!session) {
        throw new Error("Sessao nao disponivel");
      }

      await authDelete(`/api/v1/conversations/${conversationId}`, session);

      // Atualizar estado local
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setTotal((prev) => prev - 1);
    },
    [session]
  );

  /**
   * Carrega mensagens de uma conversa com paginacao por cursor
   */
  const loadMessages = useCallback(
    async (conversationId: string, cursor?: number): Promise<MessageListResponse> => {
      if (!session) {
        throw new Error("Sessao nao disponivel");
      }

      const url = cursor
        ? `/api/v1/conversations/${conversationId}/messages?limit=50&after=${cursor}`
        : `/api/v1/conversations/${conversationId}/messages?limit=50`;

      return authGet<MessageListResponse>(url, session);
    },
    [session]
  );

  return {
    conversations,
    total,
    isLoading,
    error,
    refresh: fetchConversations,
    rename,
    remove,
    loadMessages,
  };
}

export default useConversations;
