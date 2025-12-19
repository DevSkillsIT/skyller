/**
 * SPEC-006-skyller - Phase 4: US2 - Chat com Streaming AG-UI
 * T026: Componente AgentChat principal
 *
 * Componente principal que integra MessageList, MessageInput,
 * ToolCallList, ConnectionStatus e CopilotKit para chat completo.
 */

"use client"

import React, { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAgentConnection } from "@/hooks/useAgentConnection"
import { useHITL } from "@/hooks/useHITL"
import { MessageList, type Message } from "./MessageList"
import { MessageInput } from "./MessageInput"
import { ConnectionStatus, type ConnectionStatusType, useConnectionStatus } from "./ConnectionStatus"
import { ToolCallList } from "@/components/tools/ToolCallList"
import { ToolCallSummary } from "@/components/tools/ToolCallList"
import { type ToolCall } from "@/components/tools/ToolCallCard"
import { ConfirmationModal } from "@/components/hitl/ConfirmationModal"
import { retryWithBackoff } from "@/lib/api/retry"

/**
 * Props do componente AgentChat
 */
export interface AgentChatProps {
  /** ID do agente (default: "skyller") */
  agentId?: string
  /** Classe CSS adicional */
  className?: string
  /** Se deve mostrar painel de tool calls */
  showToolCalls?: boolean
  /** Callback executado quando mensagem é enviada */
  onMessageSent?: (message: string) => void
  /** Callback executado quando mensagem é recebida */
  onMessageReceived?: (message: Message) => void
}

/**
 * Componente AgentChat
 *
 * Chat completo com streaming AG-UI, tool calls, e reconexão automática.
 *
 * NOTA: Esta é uma implementação de demonstração que simula o comportamento.
 * Para produção, integrar com CopilotKit usando useCoAgent() ou useCopilotChat().
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   return (
 *     <AgentChat
 *       agentId="skyller"
 *       showToolCalls
 *     />
 *   )
 * }
 * ```
 */
export function AgentChat({
  agentId = "skyller",
  className,
  showToolCalls = true,
  onMessageSent,
  onMessageReceived,
}: AgentChatProps) {
  // Hooks de conexão
  const connection = useAgentConnection({ agentId })
  const { status: connectionStatus, setStatus: setConnectionStatus, attempt, setAttempt } = useConnectionStatus()

  // Hook HITL
  const {
    currentRequest: currentHITL,
    canApprove,
    approveConfirmation,
    rejectConfirmation,
    clearCurrentRequest: clearHITL,
  } = useHITL()

  // Estado de mensagens e tool calls
  const [messages, setMessages] = useState<Message[]>([])
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isHITLModalOpen, setIsHITLModalOpen] = useState(false)

  // Efeito para abrir modal quando há nova solicitação HITL
  useEffect(() => {
    if (currentHITL) {
      setIsHITLModalOpen(true)
    }
  }, [currentHITL])

  // Handle envio de mensagem
  const handleSendMessage = useCallback(
    async (content: string) => {
      // Callback onMessageSent
      if (onMessageSent) {
        onMessageSent(content)
      }

      // Adiciona mensagem do usuário
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Indica que está aguardando resposta
      setIsLoading(true)
      setConnectionStatus("connecting")

      try {
        // Aqui seria a integração real com CopilotKit
        // Por enquanto, simula uma resposta
        await simulateAgentResponse(content, {
          onMessage: (msg) => {
            setMessages((prev) => [...prev, msg])
            if (onMessageReceived) {
              onMessageReceived(msg)
            }
          },
          onToolCall: (tc) => {
            setToolCalls((prev) => [...prev, tc])
          },
        })

        setConnectionStatus("connected")
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error)
        setConnectionStatus("error")
      } finally {
        setIsLoading(false)
      }
    },
    [onMessageSent, onMessageReceived, setConnectionStatus]
  )

  // Handle retry de conexão
  const handleRetryConnection = useCallback(async () => {
    setConnectionStatus("reconnecting")
    setAttempt(1)

    try {
      await retryWithBackoff(
        async () => {
          // Aqui seria a lógica de reconexão real
          // Por enquanto, simula sucesso
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return true
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          onRetry: (attemptNum, error, delay) => {
            setAttempt(attemptNum)
            console.log(`Tentativa ${attemptNum} falhou, aguardando ${delay}ms...`)
          },
        }
      )

      setConnectionStatus("connected")
      setAttempt(0)
    } catch (error) {
      setConnectionStatus("error")
    }
  }, [setConnectionStatus, setAttempt])

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            S
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900">Skyller</h2>
            <p className="text-xs text-gray-500">
              {connection.isReady ? "Online" : "Conectando..."}
            </p>
          </div>
        </div>

        {/* Tool calls summary (se houver) */}
        {showToolCalls && toolCalls.length > 0 && (
          <ToolCallSummary toolCalls={toolCalls} />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área de mensagens */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            className="flex-1"
            autoScroll
          />

          <MessageInput
            onSend={handleSendMessage}
            disabled={!connection.isReady || isLoading}
            placeholder="Digite sua mensagem..."
          />
        </div>

        {/* Painel de tool calls (se habilitado) */}
        {showToolCalls && toolCalls.length > 0 && (
          <div className="w-96 border-l border-gray-200 overflow-y-auto p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Ferramentas Executadas
            </h3>
            <ToolCallList
              toolCalls={toolCalls}
              groupByStatus
            />
          </div>
        )}
      </div>

      {/* Connection status indicator */}
      <ConnectionStatus
        status={connectionStatus}
        attempt={attempt}
        maxAttempts={3}
        onRetry={handleRetryConnection}
      />

      {/* HITL Confirmation Modal */}
      {currentHITL && (
        <ConfirmationModal
          request={currentHITL}
          onApprove={approveConfirmation}
          onReject={rejectConfirmation}
          canApprove={canApprove}
          isOpen={isHITLModalOpen || !!currentHITL}
          onClose={() => {
            setIsHITLModalOpen(false)
            clearHITL()
          }}
        />
      )}
    </div>
  )
}

/**
 * Função auxiliar para simular resposta do agente
 * (REMOVER em produção - usar CopilotKit)
 */
async function simulateAgentResponse(
  userMessage: string,
  callbacks: {
    onMessage: (msg: Message) => void
    onToolCall: (tc: ToolCall) => void
  }
) {
  // Simula delay de processamento
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simula tool call (se mensagem contém "buscar")
  if (userMessage.toLowerCase().includes("buscar")) {
    const toolCall: ToolCall = {
      id: `tc-${Date.now()}`,
      name: "search_documentation",
      args: { query: userMessage },
      status: "running",
      startedAt: new Date(),
    }
    callbacks.onToolCall(toolCall)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Atualiza tool call para completed
    callbacks.onToolCall({
      ...toolCall,
      status: "completed",
      result: "Encontrei 3 resultados relevantes.",
      completedAt: new Date(),
    })
  }

  // Simula streaming de resposta
  const response = `Recebi sua mensagem: "${userMessage}". Como posso ajudar?`
  const assistantMessage: Message = {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: response,
    createdAt: new Date(),
    isStreaming: false,
  }

  callbacks.onMessage(assistantMessage)
}

/**
 * Variante compacta do AgentChat (sem tool calls panel)
 */
export function AgentChatCompact(props: Omit<AgentChatProps, "showToolCalls">) {
  return <AgentChat {...props} showToolCalls={false} />
}
