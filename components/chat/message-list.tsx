/**
 * Componente MessageList - Lista de mensagens com indicadores AG-UI
 *
 * Implementa GAP-CRIT-03:
 * - AC-023: Tool calls via cards
 * - AC-024: Thinking via painel colapsável
 * - AC-027: Erros via contexto
 *
 * Features:
 * - Renderização de mensagens com Streamdown
 * - Propagação de estados AG-UI para a última mensagem
 * - Auto-scroll para última mensagem
 */

"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/components/chat/message";
import type { ActivityState, StepState, ThinkingState, ToolCallState } from "@/lib/types/agui";
import type { Message as MessageType } from "@/lib/mock/data";

interface MessageListProps {
  /** Lista de mensagens a serem exibidas */
  messages: MessageType[];

  /** Estado de thinking atual */
  thinking?: ThinkingState;

  /** Steps atuais do agente */
  steps?: StepState[];

  /** Tool calls atuais */
  toolCalls?: ToolCallState[];

  /** Activities atuais */
  activities?: ActivityState[];

  /** Indica se há streaming em andamento */
  isStreaming?: boolean;

  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente de lista de mensagens com suporte a eventos AG-UI
 *
 * @example
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   thinking={agentState.thinking}
 *   steps={agentState.steps}
 *   toolCalls={agentState.toolCalls}
 *   activities={agentState.activities}
 * />
 * ```
 */
export function MessageList({
  messages,
  thinking,
  steps,
  toolCalls,
  activities,
  isStreaming = false,
  className = "",
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll para a última mensagem quando nova mensagem chega
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking?.status, toolCalls?.length]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Renderizar todas as mensagens */}
      {messages.map((message) => {
        const isLastMessage = message.id === messages[messages.length - 1]?.id;
        return (
          <Message
            key={message.id}
            message={message}
            isStreaming={isStreaming && isLastMessage}
            thinking={isLastMessage ? thinking : undefined}
            steps={isLastMessage ? steps : undefined}
            toolCalls={isLastMessage ? toolCalls : undefined}
            activities={isLastMessage ? activities : undefined}
          />
        );
      })}

      {/* Elemento para scroll automático */}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * Componente de lista vazia - exibido quando não há mensagens
 */
export function EmptyMessageList() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4" aria-hidden="true">
        💬
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma mensagem ainda</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Comece uma conversa enviando uma mensagem para o agente.
      </p>
    </div>
  );
}

/**
 * Componente de loading - exibido durante carregamento inicial
 */
export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 p-4 rounded-lg bg-muted/50 animate-pulse"
          role="status"
          aria-label="Carregando mensagens"
        >
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
