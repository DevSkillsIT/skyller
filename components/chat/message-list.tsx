/**
 * Componente MessageList - Lista de mensagens com indicadores AG-UI
 *
 * Implementa GAP-CRIT-03:
 * - AC-023: Exibe tool calls em execução
 * - AC-024: Exibe thinking state
 * - AC-027: Exibe erros de execução
 *
 * Features:
 * - Renderização de mensagens com Streamdown
 * - Indicadores visuais de thinking state
 * - Indicadores visuais de tool calls
 * - Auto-scroll para última mensagem
 */

"use client";

import { Brain, Loader2, Wrench } from "lucide-react";
import { useEffect, useRef } from "react";
import { Message } from "@/components/chat/message";
import { useToolCallMessage } from "@/lib/hooks/use-agent-events";
import type { Message as MessageType } from "@/lib/mock/data";

interface MessageListProps {
  /** Lista de mensagens a serem exibidas */
  messages: MessageType[];

  /** Indica se o agente está em estado de thinking */
  isThinking?: boolean;

  /** Mensagem de thinking personalizada */
  thinkingMessage?: string;

  /** Nome da ferramenta em execução */
  currentTool?: string;

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
 *   isThinking={agentState.isThinking}
 *   thinkingMessage={agentState.thinkingMessage}
 *   currentTool={agentState.currentTool}
 * />
 * ```
 */
export function MessageList({
  messages,
  isThinking = false,
  thinkingMessage,
  currentTool,
  isStreaming = false,
  className = "",
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolMessage = useToolCallMessage(currentTool);

  /**
   * Auto-scroll para a última mensagem quando nova mensagem chega
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isThinking, currentTool]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Renderizar todas as mensagens */}
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
          currentTool={currentTool}
          thinkingState={isThinking ? thinkingMessage : undefined}
        />
      ))}

      {/* AC-024: Indicador de Thinking State (GAP-CRIT-03) */}
      {isThinking && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border animate-pulse"
          role="status"
          aria-live="polite"
          aria-label="Agente pensando"
        >
          <Brain className="h-4 w-4 text-muted-foreground animate-pulse" aria-hidden="true" />
          <span className="text-sm text-muted-foreground italic">
            {thinkingMessage || "🧠 Analisando sua solicitação..."}
          </span>
        </div>
      )}

      {/* AC-023: Indicador de Tool Call (GAP-CRIT-03) */}
      {currentTool && !isThinking && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
          role="status"
          aria-live="polite"
          aria-label={`Executando ferramenta: ${currentTool}`}
        >
          <Wrench
            className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              🔧 Ferramenta: {currentTool}
            </span>
            <span className="text-xs text-blue-700 dark:text-blue-300">{toolMessage}</span>
          </div>
          <Loader2
            className="h-3 w-3 ml-auto text-blue-600 dark:text-blue-400 animate-spin"
            aria-hidden="true"
          />
        </div>
      )}

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
