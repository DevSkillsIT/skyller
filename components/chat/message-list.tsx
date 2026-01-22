/**
 * MessageList - Lista de mensagens com auto-scroll
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-036: Componente MessageList Extraido
 * @acceptance AC-015: Scroll Automatico
 * @acceptance AC-009: Indicador "Digitando" Durante Streaming
 *
 * Renderiza lista de mensagens com:
 * - Auto-scroll para ultima mensagem
 * - Sugestoes de conversa quando vazio
 * - Indicador de loading durante processamento
 */
"use client";

import { Bot, Code2, FileSearch, FileText, Loader2, TrendingUp } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Agent, type Artifact, Message, type MessageData } from "./message";

// Tipos
export interface ConversationSuggestion {
  id: string;
  title: string;
  icon: string;
  agentId: string;
}

export interface MessageListProps {
  /** Lista de mensagens */
  messages: MessageData[];
  /** Lista de agentes disponiveis */
  agents?: Agent[];
  /** Se o assistente esta processando */
  isLoading?: boolean;
  /** Se o assistente esta pensando (THINKING event) */
  isThinking?: boolean;
  /** Sugestoes de conversa para exibir quando vazio */
  suggestions?: ConversationSuggestion[];
  /** Callback quando sugestao e clicada */
  onSuggestionClick?: (suggestion: ConversationSuggestion) => void;
  /** Callback para feedback positivo */
  onFeedbackPositive?: (messageId: string) => void;
  /** Callback para feedback negativo */
  onFeedbackNegative?: (messageId: string) => void;
  /** Callback para regenerar resposta */
  onRegenerate?: (messageId: string) => void;
  /** Callback para abrir artifact */
  onOpenArtifact?: (artifact: Artifact) => void;
  /** AC-018: Callback para retentar envio de mensagem com erro */
  onRetry?: (messageId: string, content: string) => void;
}

// Mapa de icones para sugestoes
const suggestionIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  FileSearch,
  Code2,
  FileText,
};

/**
 * Componente de boas-vindas exibido quando nao ha mensagens
 */
function WelcomeMessage({
  suggestions,
  onSuggestionClick,
}: {
  suggestions?: ConversationSuggestion[];
  onSuggestionClick?: (suggestion: ConversationSuggestion) => void;
}) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-3">
        <Bot className="w-7 h-7 text-accent" />
      </div>
      <h2 className="text-xl font-semibold mb-1">Como posso ajudar?</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
        Pergunte qualquer coisa. Posso ajudar com pesquisa, escrita, codigo, analise de dados e
        mais.
      </p>

      {/* Sugestoes de conversa */}
      {suggestions && suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
          {suggestions.map((suggestion) => {
            const SuggestionIcon = suggestionIconMap[suggestion.icon] || FileText;
            return (
              <button
                key={suggestion.id}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-accent/30 transition-colors text-left"
              >
                <SuggestionIcon className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-sm">{suggestion.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Indicador de loading/thinking durante processamento
 * AC-009: Indicador "Digitando" Durante Streaming
 */
function LoadingIndicator({ isThinking = false }: { isThinking?: boolean }) {
  return (
    <div className="flex gap-4 justify-start">
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0A2463] to-[#6366f1] flex items-center justify-center">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span className="text-sm text-muted-foreground">
          {isThinking ? "Analisando..." : "Skyller esta pensando..."}
        </span>
      </div>
    </div>
  );
}

/**
 * MessageList - Componente principal da lista de mensagens
 *
 * Features:
 * - Auto-scroll suave para ultima mensagem
 * - Mensagem de boas-vindas quando vazio
 * - Sugestoes de conversa clicaveis
 * - Indicador de loading durante processamento
 */
export function MessageList({
  messages,
  agents = [],
  isLoading = false,
  isThinking = false,
  suggestions = [],
  onSuggestionClick,
  onFeedbackPositive,
  onFeedbackNegative,
  onRegenerate,
  onOpenArtifact,
  onRetry,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll para ultima mensagem com animacao suave
   * AC-015: Scroll Automatico
   */
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Auto-scroll quando mensagens mudam ou loading muda
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Encontra agente por ID
  const getAgent = useCallback(
    (agentId?: string): Agent | null => {
      if (!agentId) return null;
      return agents.find((a) => a.id === agentId) || null;
    },
    [agents]
  );

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Mensagem de boas-vindas quando vazio */}
        {messages.length === 0 && (
          <WelcomeMessage suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
        )}

        {/* Lista de mensagens */}
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            agent={getAgent(message.agentId)}
            isLastMessage={index === messages.length - 1}
            isAgentRunning={isLoading}
            onFeedbackPositive={onFeedbackPositive}
            onFeedbackNegative={onFeedbackNegative}
            onRegenerate={onRegenerate}
            onOpenArtifact={onOpenArtifact}
            onRetry={onRetry}
          />
        ))}

        {/* Indicador de loading */}
        {isLoading && <LoadingIndicator isThinking={isThinking} />}

        {/* Elemento de referencia para scroll */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

export default MessageList;
