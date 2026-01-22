/**
 * ChatPage - Pagina principal do chat com componentes extraidos
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-035: Componente Message Extraido
 * @acceptance AC-036: Componente MessageList Extraido
 * @acceptance AC-037: Componente ChatInput Extraido
 * @acceptance AC-038: ChatErrorBoundary Criado
 * @acceptance AC-003: useCopilotChat Hook Integrado
 * @acceptance AC-004: sendMessage Substitui Mock
 * @acceptance AC-010: Character Limit Validation
 * @acceptance AC-012: Rate Limit UI
 * @acceptance AC-018: Retry Logic
 * @acceptance AC-032: Optimistic Updates
 *
 * Refatorado para usar componentes modulares do diretorio components/chat/
 * Layout visual preservado 100% do design original.
 */
"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { AgentsGalleryDialog } from "@/components/dialogs/agents-gallery-dialog";
import {
  ChatErrorBoundary,
  ChatInput,
  MessageList,
  type ConversationSuggestion,
  type RateLimitInfo,
} from "@/components/chat";
import { useChat, type Message, type Artifact } from "@/lib/contexts/chat-context";
import { usePanel } from "@/lib/contexts/panel-context";
import { useRateLimit } from "@/lib/hooks";
import { conversationSuggestions, mockAgents } from "@/lib/mock/data";

/**
 * ChatPage - Componente principal da pagina de chat
 *
 * Features:
 * - Lista de mensagens com auto-scroll
 * - Input estilo Gemini com dropdowns
 * - Integracao com CopilotKit via useChat
 * - Error boundary para captura de erros
 * - Galeria de agentes
 */
export default function ChatPage() {
  // Hooks de contexto
  const {
    messages,
    sendMessage,
    isLoading,
    isThinking,
    regenerateLastResponse,
    retryMessage,
  } = useChat();

  // Hook de rate limit (AC-012)
  const {
    isLimited,
    formattedTime,
    remaining,
    limit,
  } = useRateLimit({
    defaultLimit: 10,
  });

  // Informacoes de rate limit para o ChatInput
  const rateLimitInfo: RateLimitInfo = {
    isLimited,
    formattedTime,
    remaining,
    limit,
  };
  const { openPanel } = usePanel();

  // Estado local
  const [selectedAgent, setSelectedAgent] = useState<string>("general");
  const [isAgentsGalleryOpen, setIsAgentsGalleryOpen] = useState(false);

  // Converte mensagens para formato do MessageList
  const messageData = messages.map((msg: Message) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: msg.timestamp,
    agentId: msg.agentId,
    artifacts: msg.artifacts,
    isStreaming: msg.isStreaming,
    hasError: msg.hasError,
    errorMessage: msg.errorMessage,
  }));

  // Handler para envio de mensagem
  const handleSend = useCallback(
    async (content: string, agentId?: string) => {
      await sendMessage(content, agentId || selectedAgent);
    },
    [sendMessage, selectedAgent]
  );

  // Handler para clique em sugestao
  const handleSuggestionClick = useCallback(
    (suggestion: ConversationSuggestion) => {
      setSelectedAgent(suggestion.agentId);
      handleSend(suggestion.title, suggestion.agentId);
    },
    [handleSend]
  );

  // Handler para feedback positivo
  const handleFeedbackPositive = useCallback((messageId: string) => {
    // TODO: Implementar envio de feedback para backend
    console.log("[ChatPage] Feedback positivo:", messageId);
  }, []);

  // Handler para feedback negativo
  const handleFeedbackNegative = useCallback((messageId: string) => {
    // TODO: Implementar envio de feedback para backend
    console.log("[ChatPage] Feedback negativo:", messageId);
  }, []);

  // Handler para regenerar resposta
  const handleRegenerate = useCallback(
    async (_messageId: string) => {
      await regenerateLastResponse();
    },
    [regenerateLastResponse]
  );

  // Handler para abrir artifact
  const handleOpenArtifact = useCallback(
    (artifact: Artifact) => {
      openPanel("artifact", artifact);
    },
    [openPanel]
  );

  // AC-018: Handler para retry de mensagem com erro
  const handleRetry = useCallback(
    async (messageId: string, content: string) => {
      await retryMessage(messageId, content);
    },
    [retryMessage]
  );

  // Handler para erro no chat
  const handleChatError = useCallback((error: Error) => {
    console.error("[ChatPage] Erro no chat:", error);
    // TODO: Enviar para servico de monitoramento
  }, []);

  return (
    <ChatErrorBoundary onError={handleChatError}>
      <div className="flex flex-col h-full">
        {/* Lista de Mensagens */}
        <MessageList
          messages={messageData}
          agents={mockAgents}
          isLoading={isLoading}
          isThinking={isThinking}
          suggestions={conversationSuggestions as ConversationSuggestion[]}
          onSuggestionClick={handleSuggestionClick}
          onFeedbackPositive={handleFeedbackPositive}
          onFeedbackNegative={handleFeedbackNegative}
          onRegenerate={handleRegenerate}
          onOpenArtifact={handleOpenArtifact}
          onRetry={handleRetry}
        />

        {/* Area de Input */}
        <ChatInput
          agents={mockAgents}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          isLoading={isLoading}
          onSend={handleSend}
          onOpenAgentsGallery={() => setIsAgentsGalleryOpen(true)}
          docsCount={12}
          toolsCount={3}
          rateLimit={rateLimitInfo}
        />

        {/* Dialogo da Galeria de Agentes */}
        <AgentsGalleryDialog
          open={isAgentsGalleryOpen}
          onOpenChange={setIsAgentsGalleryOpen}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />
      </div>
    </ChatErrorBoundary>
  );
}
