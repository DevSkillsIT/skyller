/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T025: Componente MessageInput
 *
 * Componente para input de mensagens com suporte a textarea
 * multi-linha, envio por Enter, e estados disabled.
 */

"use client"

import React, { useState, useRef, useEffect, KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

/**
 * Props do componente MessageInput
 */
export interface MessageInputProps {
  /** Callback executado ao enviar mensagem */
  onSend: (message: string) => void
  /** Se o input está desabilitado (aguardando resposta) */
  disabled?: boolean
  /** Placeholder do textarea */
  placeholder?: string
  /** Classe CSS adicional */
  className?: string
  /** Altura máxima do textarea em linhas (default: 6) */
  maxRows?: number
}

/**
 * Componente MessageInput
 *
 * Input de mensagens com textarea expansível e botão de envio.
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const [isLoading, setIsLoading] = useState(false)
 *
 *   const handleSend = async (message: string) => {
 *     setIsLoading(true)
 *     await sendMessage(message)
 *     setIsLoading(false)
 *   }
 *
 *   return (
 *     <MessageInput
 *       onSend={handleSend}
 *       disabled={isLoading}
 *       placeholder="Digite sua mensagem..."
 *     />
 *   )
 * }
 * ```
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Digite sua mensagem...",
  className,
  maxRows = 6,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea conforme conteúdo
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height para calcular corretamente
      textareaRef.current.style.height = "auto"

      // Calcula nova altura baseada no scrollHeight
      const lineHeight = 24 // altura aproximada de uma linha
      const maxHeight = lineHeight * maxRows
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight)

      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [message, maxRows])

  // Handle envio da mensagem
  const handleSend = () => {
    const trimmedMessage = message.trim()

    // Não envia mensagem vazia
    if (!trimmedMessage || disabled) return

    // Callback onSend
    onSend(trimmedMessage)

    // Limpa input
    setMessage("")

    // Reset focus
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Handle Enter (envia) e Shift+Enter (quebra linha)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 p-4 border-t border-gray-200 bg-white",
        className
      )}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2",
          "text-sm text-gray-900 placeholder-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      />

      {/* Botão de envio */}
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          disabled || !message.trim()
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
        )}
      >
        {disabled ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Enviando
          </span>
        ) : (
          <span>Enviar</span>
        )}
      </button>
    </div>
  )
}

/**
 * Componente MessageInput compacto (sem textarea expansível)
 */
export function MessageInputCompact({
  onSend,
  disabled = false,
  placeholder = "Digite sua mensagem...",
  className,
}: Omit<MessageInputProps, "maxRows">) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSend(trimmedMessage)
    setMessage("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-4 border-t border-gray-200 bg-white",
        className
      )}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex-1 rounded-lg border border-gray-300 px-4 py-2",
          "text-sm text-gray-900 placeholder-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      />

      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm",
          disabled || !message.trim()
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        )}
      >
        Enviar
      </button>
    </div>
  )
}
