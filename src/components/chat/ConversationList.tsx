/**
 * SPEC-006-skyller - Phase 6: US4 - Multi-Tenancy e Branding
 * T040: Componente ConversationList para exibir historico de conversas
 *
 * Lista de conversas com suporte a paginacao, delecao e selecao.
 */

"use client"

import React, { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useConversations, type Conversation } from "@/hooks/useConversations"

/**
 * Props do componente ConversationList
 */
export interface ConversationListProps {
  /** Callback quando conversa e selecionada */
  onSelect?: (conversation: Conversation) => void
  /** ID da conversa atualmente selecionada */
  selectedId?: string
  /** Classe CSS adicional */
  className?: string
}

/**
 * Props do item de conversa
 */
interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
  onDelete: () => Promise<void>
}

/**
 * Formata data relativa (hoje, ontem, etc)
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (diffDays === 1) {
    return "Ontem"
  }

  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "long" })
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

/**
 * Gera titulo padrao se nao houver
 */
function getDisplayTitle(conversation: Conversation): string {
  if (conversation.title) return conversation.title
  return `Conversa de ${formatRelativeDate(conversation.createdAt)}`
}

/**
 * Componente de item de conversa individual
 */
function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [onDelete])

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
        isSelected
          ? "bg-blue-100 dark:bg-blue-900/30"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      onClick={onSelect}
    >
      {/* Icone */}
      <div className="flex-shrink-0">
        <svg
          className={cn(
            "w-5 h-5",
            isSelected
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400 dark:text-gray-500"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>

      {/* Conteudo */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "text-sm font-medium truncate",
            isSelected
              ? "text-blue-900 dark:text-blue-100"
              : "text-gray-900 dark:text-gray-100"
          )}
        >
          {getDisplayTitle(conversation)}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {conversation.messageCount} mensagens ·{" "}
          {formatRelativeDate(conversation.createdAt)}
        </p>
      </div>

      {/* Botao de delete */}
      {showDeleteConfirm ? (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={isDeleting}
            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
            title="Confirmar exclusao"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(false)
            }}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Cancelar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteConfirm(true)
          }}
          className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
          title="Deletar conversa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * Componente ConversationList
 *
 * Lista de conversas com suporte a:
 * - Paginacao infinita
 * - Selecao de conversa
 * - Delecao com confirmacao
 * - Estados de loading e erro
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
 *
 *   return (
 *     <ConversationList
 *       onSelect={setSelectedConv}
 *       selectedId={selectedConv?.id}
 *     />
 *   )
 * }
 * ```
 */
export function ConversationList({
  onSelect,
  selectedId,
  className,
}: ConversationListProps) {
  const {
    conversations,
    pagination,
    isLoading,
    error,
    deleteConversation,
    loadMore,
    refresh,
  } = useConversations(true)

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Conversas
        </h3>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          title="Atualizar"
        >
          <svg
            className={cn("w-4 h-4", isLoading && "animate-spin")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Estado de erro */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && !error && conversations.length === 0 && (
          <div className="p-6 text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Nenhuma conversa ainda
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Inicie uma conversa para comecar
            </p>
          </div>
        )}

        {/* Lista de conversas */}
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedId}
            onSelect={() => onSelect?.(conversation)}
            onDelete={() => deleteConversation(conversation.threadId)}
          />
        ))}

        {/* Loading inicial */}
        {isLoading && conversations.length === 0 && (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Botao de carregar mais */}
        {pagination.hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {isLoading ? "Carregando..." : "Carregar mais"}
          </button>
        )}
      </div>

      {/* Footer com total */}
      {pagination.total > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {pagination.total} conversa{pagination.total !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

/**
 * Variante compacta do ConversationList (sem header e footer)
 */
export function ConversationListCompact(
  props: Omit<ConversationListProps, "className">
) {
  const {
    conversations,
    isLoading,
    deleteConversation,
  } = useConversations(true)

  return (
    <div className="space-y-1">
      {conversations.slice(0, 5).map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === props.selectedId}
          onSelect={() => props.onSelect?.(conversation)}
          onDelete={() => deleteConversation(conversation.threadId)}
        />
      ))}
      {isLoading && (
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      )}
    </div>
  )
}
