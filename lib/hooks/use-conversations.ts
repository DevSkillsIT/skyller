/**
 * Hook useConversations - Gerenciamento de conversas
 *
 * @description Hook para listar, renomear e deletar conversas do usuario.
 * Integra com a API de historico de chat do backend.
 *
 * @spec SPEC-CHAT-HISTORY-INTEGRATION-001
 */
"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { authDelete, authGet, authPut } from "@/lib/api-client";

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
 * Opcoes de filtro para conversas
 * GAP-IMP-05: Preparacao para filtros de workspace/project
 */
export interface UseConversationsOptions {
  /** Numero maximo de conversas a buscar (default: 50) */
  limit?: number;
  /** ID do workspace para filtrar conversas (GAP-IMP-05) */
  workspaceId?: string;
  /** ID do projeto para filtrar conversas (GAP-IMP-05) */
  projectId?: string;
}

/**
 * Hook para gerenciamento de conversas
 *
 * @param options - Opcoes de configuracao do hook (limit, workspaceId, projectId)
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
 * // Com filtros de workspace/project (GAP-IMP-05)
 * const { conversations } = useConversations({
 *   limit: 20,
 *   workspaceId: currentWorkspace?.id,
 *   projectId: currentProject?.id,
 * });
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
export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  // GAP-IMP-05: Extrair opcoes com defaults
  const { limit = 50, workspaceId, projectId } = options;
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Busca lista de conversas da API
   */
  const fetchConversations = useCallback(async () => {
    // DEBUG: Log session state
    console.log("[useConversations] fetchConversations chamado", {
      hasSession: !!session,
      userId: session?.user?.id,
      tenantId: (session?.user as { tenant_id?: string })?.tenant_id,
      hasToken: !!(session as { accessToken?: string })?.accessToken,
      // GAP-IMP-05: Log filtros de workspace/project
      workspaceId,
      projectId,
    });

    if (!session) {
      console.log("[useConversations] EARLY EXIT: session is null/undefined");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // GAP-IMP-05: Construir URL com filtros opcionais de workspace/project
      // TODO: Backend ainda nao suporta workspace_id e project_id - implementar em SPEC futura
      // Quando o backend suportar, os filtros serao aplicados automaticamente
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (workspaceId) {
        params.set("workspace_id", workspaceId);
      }
      if (projectId) {
        params.set("project_id", projectId);
      }
      const url = `/api/v1/conversations?${params.toString()}`;

      console.log("[useConversations] Fazendo GET", url);
      const response = await authGet<ConversationListResponse>(url, session);
      console.log("[useConversations] Resposta recebida:", {
        total: response.total,
        itemsCount: response.items?.length,
      });
      // FIX: Deduplicar conversas por ID para evitar React key warnings
      const uniqueConversations = response.items.reduce((acc, conv) => {
        if (!acc.some((c) => c.id === conv.id)) {
          acc.push(conv);
        }
        return acc;
      }, [] as ConversationSummary[]);
      if (uniqueConversations.length !== response.items.length) {
        console.warn("[useConversations] Duplicatas removidas:", {
          original: response.items.length,
          unique: uniqueConversations.length,
        });
      }
      setConversations(uniqueConversations);
      setTotal(response.total);
    } catch (err) {
      console.error("[useConversations] Erro ao buscar conversas:", err);
      setError(err instanceof Error ? err : new Error("Falha ao buscar conversas"));
    } finally {
      setIsLoading(false);
    }
  }, [session, limit, workspaceId, projectId]);

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
