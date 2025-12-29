/**
 * SPEC-006-skyller - Hook useConversations
 * NOTA: Auth desabilitado temporariamente
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export interface Conversation {
  id: string
  threadId: string
  title: string | null
  messageCount: number
  createdAt: Date
  agentId: string
}

export interface ConversationsPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface UseConversationsReturn {
  conversations: Conversation[]
  pagination: ConversationsPagination
  isLoading: boolean
  error: string | null
  fetchConversations: (offset?: number, limit?: number) => Promise<void>
  deleteConversation: (threadId: string) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AGUI_URL || "http://localhost:7777"

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

  const fetchConversations = useCallback(
    async (offset: number = 0, limit: number = 20) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/conversations?limit=${limit}&offset=${offset}`,
          { method: "GET" }
        )

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`)
        }

        const data = await response.json()

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
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const deleteConversation = useCallback(async (threadId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${threadId}`,
        { method: "DELETE" }
      )

      if (!response.ok && response.status !== 204) {
        throw new Error(`Erro HTTP ${response.status}`)
      }

      setConversations((prev) =>
        prev.filter((conv) => conv.threadId !== threadId)
      )

      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      throw err
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || !pagination.hasMore) return
    await fetchConversations(pagination.offset + pagination.limit, pagination.limit)
  }, [isLoading, pagination, fetchConversations])

  const refresh = useCallback(async () => {
    await fetchConversations(0, pagination.limit)
  }, [fetchConversations, pagination.limit])

  useEffect(() => {
    if (autoFetch) {
      fetchConversations()
    }
  }, [autoFetch, fetchConversations])

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

export function useLatestConversation(): Conversation | null {
  const { conversations } = useConversations(true)
  return useMemo(() => conversations[0] || null, [conversations])
}

export function useConversationCount(): number {
  const { pagination } = useConversations(true)
  return pagination.total
}
