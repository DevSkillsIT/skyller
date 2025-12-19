/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T024: Componente MessageList
 *
 * Componente para exibir lista de mensagens de chat com suporte
 * a streaming, auto-scroll, e diferentes tipos de mensagens.
 */

"use client"

import React, { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

/**
 * Interface de mensagem (compatível com CopilotKit)
 */
export interface Message {
  /** ID único da mensagem */
  id: string
  /** Role: user, assistant, system */
  role: "user" | "assistant" | "system"
  /** Conteúdo da mensagem */
  content: string
  /** Timestamp da mensagem */
  createdAt?: Date
  /** Se a mensagem está sendo digitada (streaming) */
  isStreaming?: boolean
}

/**
 * Props do componente MessageList
 */
export interface MessageListProps {
  /** Lista de mensagens */
  messages: Message[]
  /** Se está carregando (aguardando resposta) */
  isLoading?: boolean
  /** Classe CSS adicional */
  className?: string
  /** Se deve fazer auto-scroll para última mensagem */
  autoScroll?: boolean
}

/**
 * Componente para exibir uma mensagem individual
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-blue-600 text-white"
            : isSystem
              ? "bg-gray-200 text-gray-700 italic"
              : "bg-gray-100 text-gray-900 border border-gray-200"
        )}
      >
        {/* Avatar ou indicador de role */}
        <div className="mb-1 text-xs opacity-70">
          {isUser ? "Você" : isSystem ? "Sistema" : "Skyller"}
        </div>

        {/* Conteúdo da mensagem */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Indicador de streaming */}
        {message.isStreaming && (
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse delay-75" />
            <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse delay-150" />
          </div>
        )}

        {/* Timestamp (se disponível) */}
        {message.createdAt && (
          <div className="mt-1 text-xs opacity-50">
            {message.createdAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Componente de indicador de carregamento
 */
function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3 text-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-75" />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-150" />
          </div>
          <span className="text-gray-600">Skyller está pensando...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente MessageList
 *
 * Exibe lista de mensagens com suporte a streaming e auto-scroll.
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const [messages, setMessages] = useState<Message[]>([])
 *   const [isLoading, setIsLoading] = useState(false)
 *
 *   return (
 *     <MessageList
 *       messages={messages}
 *       isLoading={isLoading}
 *       autoScroll
 *     />
 *   )
 * }
 * ```
 */
export function MessageList({
  messages,
  isLoading = false,
  className,
  autoScroll = true,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para última mensagem quando atualiza
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }
  }, [messages, autoScroll])

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 overflow-y-auto",
        className
      )}
    >
      {/* Lista de mensagens */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Indicador de carregamento */}
      {isLoading && <LoadingIndicator />}

      {/* Mensagem vazia (se não houver mensagens) */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
          <p className="text-sm">
            Digite uma mensagem abaixo para começar a conversa com a Skyller.
          </p>
        </div>
      )}

      {/* Referência para auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  )
}
