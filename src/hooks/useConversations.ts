/**
 * SPEC-006-skyller - Phase 6: US4 - Multi-Tenancy e Branding
 * T039: Hook useConversations para gerenciar historico de conversas
 *
 * Hook React para listar, criar e deletar conversas com suporte
 * a paginacao e integracao com o backend.
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAccessToken } from "./useAccessToken"

/**
 * Interface de uma conversa
 */
export interface Conversation {
  /** ID unico da conversa */
  id: string
  /** Thread ID do Agno */
  threadId: string
  /** Titulo da conversa (pode ser gerado automaticamente) */
  title: string | null
  /** Quantidade de mensagens */
  messageCount: number
  /** Data de criacao */
  createdAt: Date
  /** ID do agente usado */
  agentId: string
}

/**
 * Interface de paginacao
 */
export interface ConversationsPagination {
  /** Total de conversas */
  total: number
  /** Limite por pagina */
  limit: number
  /** Offset atual */
  offset: number
  /** Se ha mais paginas */
  hasMore: boolean
}

/**
 * Interface de retorno do hook useConversations
 */
export interface UseConversationsReturn {
  /** Lista de conversas */
  conversations: Conversation[]

  /** Informacoes de paginacao */
  pagination: ConversationsPagination

  /** Se esta carregando */
  isLoading: boolean

  /** Erro, se houver */
  error: string | null

  /** Busca conversas (com paginacao) */
  fetchConversations: (offset?: number, limit?: number) => Promise<void>

  /** Deleta uma conversa */
  deleteConversation: (threadId: string) => Promise<void>

  /** Carrega mais conversas (proxima pagina) */
  loadMore: () => Promise<void>

  /** Recarrega conversas do inicio */
  refresh: () => Promise<void>
}

/**
 * URL base da API
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_AGUI_URL || "http://localhost:7777"

/**
 * Hook para gerenciar historico de conversas
 *
 * @param autoFetch - Se deve buscar conversas automaticamente ao montar
 * @returns Objeto UseConversationsReturn com conversas e funcoes de controle
 *
 * @example
 * ```tsx
 * function ConversationsPage() {
 *   const {
 *     conversations,
 *     pagination,
 *     isLoading,
 *     deleteConversation,
 *     loadMore
 *   } = useConversations()
 *
 *   return (
 *     <div>
 *       {conversations.map(conv => (
 *         <ConversationItem
 *           key={conv.id}
 *           conversation={conv}
 *           onDelete={() => deleteConversation(conv.threadId)}
 *         />
 *       ))}
 *
 *       {pagination.hasMore && (
 *         <button onClick={loadMore}>Carregar mais</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useConversations(autoFetch: boolean = true): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pagination, setPagination] = useState<ConversationsPagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getAuthHeaders, isLoading: tokenLoading } = useAccessToken()

  /**
   * Busca conversas da API
   */
  const fetchConversations = useCallback(
    async (offset: number = 0, limit: number = 20) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/conversations?limit=${limit}&offset=${offset}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Erro HTTP ${response.status}`)
        }

        const data = await response.json()

        // Mapear resposta para interface Conversation
        const mappedConversations: Conversation[] = data.items.map(
          (item: any) => ({
            id: item.id,
            threadId: item.thread_id,
            title: item.title,
            messageCount: item.message_count,
            createdAt: new Date(item.created_at),
            agentId: item.agent_id,
          })
        )

        // Se offset > 0, append aos existentes (paginacao)
        if (offset > 0) {
          setConversations((prev) => [...prev, ...mappedConversations])
        } else {
          setConversations(mappedConversations)
        }

        setPagination({
          total: data.total,
          limit: data.limit,
          offset: data.offset,
          hasMore: data.offset + data.items.length < data.total,
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido ao buscar conversas"
        setError(errorMessage)
        console.error("[useConversations] Erro ao buscar conversas:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [getAuthHeaders]
  )

  /**
   * Deleta uma conversa
   */
  const deleteConversation = useCallback(
    async (threadId: string) => {
      setError(null)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/conversations/${threadId}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          }
        )

        if (!response.ok && response.status !== 204) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Erro HTTP ${response.status}`)
        }

        // Remover da lista local
        setConversations((prev) =>
          prev.filter((conv) => conv.threadId !== threadId)
        )

        // Atualizar total
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }))
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido ao deletar conversa"
        setError(errorMessage)
        console.error("[useConversations] Erro ao deletar conversa:", err)
        throw err
      }
    },
    [getAuthHeaders]
  )

  /**
   * Carrega proxima pagina
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !pagination.hasMore) return

    const nextOffset = pagination.offset + pagination.limit
    await fetchConversations(nextOffset, pagination.limit)
  }, [isLoading, pagination, fetchConversations])

  /**
   * Recarrega do inicio
   */
  const refresh = useCallback(async () => {
    await fetchConversations(0, pagination.limit)
  }, [fetchConversations, pagination.limit])

  // Auto-fetch ao montar (se habilitado)
  useEffect(() => {
    if (autoFetch && !tokenLoading) {
      fetchConversations()
    }
  }, [autoFetch, tokenLoading, fetchConversations])

  return {
    conversations,
    pagination,
    isLoading,
    error,
    fetchConversations,
    deleteConversation,
    loadMore,
    refresh,
  }
}

/**
 * Hook derivado para obter apenas a conversa mais recente
 *
 * @returns Conversa mais recente ou null
 */
export function useLatestConversation(): Conversation | null {
  const { conversations } = useConversations(true)
  return useMemo(() => conversations[0] || null, [conversations])
}

/**
 * Hook derivado para contar conversas
 *
 * @returns Total de conversas
 */
export function useConversationCount(): number {
  const { pagination } = useConversations(true)
  return pagination.total
}
