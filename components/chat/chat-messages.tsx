"use client";

import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Message } from "@/components/chat/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/contexts/chat-context";
import { usePanel } from "@/lib/contexts/panel-context";
import { useAgents } from "@/lib/hooks/use-agents";
import type { Artifact, Message as MessageType } from "@/lib/mock/data";
import type { ActivityState, StepState, ThinkingState, ToolCallState } from "@/lib/types/agui";

interface ChatMessagesProps {
  messages: MessageType[];
  isLoading: boolean;
  selectedAgentId: string;
  thinking?: ThinkingState;
  steps?: StepState[];
  toolCalls?: ToolCallState[];
  activities?: ActivityState[];
  /** GAP-CRIT-02: Indica se há mensagens mais antigas para carregar */
  hasOlderMessages?: boolean;
  /** GAP-CRIT-02: Indica se está carregando mensagens mais antigas */
  isLoadingOlder?: boolean;
  /** GAP-CRIT-02: Função para carregar mensagens mais antigas */
  onLoadOlder?: () => void;
}

export function ChatMessages({
  messages,
  isLoading,
  selectedAgentId,
  thinking,
  steps,
  toolCalls,
  activities,
  hasOlderMessages,
  isLoadingOlder,
  onLoadOlder,
}: ChatMessagesProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const { regenerateAssistantResponse } = useChat();
  const { agents } = useAgents();

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Encontrar agente selecionado
  const currentAgent = agents.find((a) => a.id === selectedAgentId);

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const shouldShowLoadingBubble = isLoading && !lastAssistantMessage;

  // Diferenciação visual: Processing (tools/steps ativos) vs Responding (apenas escrevendo)
  const isProcessing =
    thinking?.status === "active" ||
    steps?.some((step) => step.status === "running") ||
    toolCalls?.some((tool) => tool.status === "running");
  const loadingText = isProcessing ? "Processando..." : "Respondendo...";

  return (
    <StickToBottom className="flex flex-1 min-h-0 flex-col relative">
      {/* IMPORTANTE: o scroll real fica no wrapper interno do StickToBottom.
          Por isso usamos scrollClassName aqui (e não className), senão o
          auto-scroll e o scroll manual travam. */}
      <StickToBottom.Content
        data-testid="chat-scroll"
        data-chat-messages
        scrollClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4"
        className="min-h-full"
      >
        {/* Espaçamento inferior mínimo para evitar "buraco" visual. Updated width for Enterprise look */}
        <div className="max-w-5xl mx-auto py-4 pb-4 md:pb-6 space-y-6">
          {/* GAP-CRIT-02: Botão para carregar mensagens anteriores */}
          {hasOlderMessages && onLoadOlder && (
            <button
              onClick={onLoadOlder}
              disabled={isLoadingOlder}
              className="w-full py-2 text-sm text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoadingOlder ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </span>
              ) : (
                "Carregar mensagens anteriores"
              )}
            </button>
          )}

          {/* Welcome Message if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-3">
                <Bot className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-xl font-semibold mb-1">Como posso ajudar?</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Pergunte qualquer coisa. Posso ajudar com pesquisa, escrita, codigo, analise de
                dados e mais.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => {
            const agent = message.agentId
              ? agents.find((a) => a.id === message.agentId)
              : currentAgent;
            const AgentIcon = agent?.icon || Bot;
            const isLastAssistant = lastAssistantMessage?.id === message.id;
            const messageIsStreaming = isLastAssistant && isLoading;

            return (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <AgentIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"
                    }`}
                >
                  {/* Message Header - Only for Assistant */}
                  {message.role === "assistant" && agent && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{agent.name}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  {/* GAP-FIX: Hide ghost messages (empty content & no status) */}
                  {/* Show if: has content OR is last message with active tools/thinking OR streaming OR has artifacts */}
                  {(message.content || (isLastAssistant && (toolCalls?.length || thinking)) || messageIsStreaming || (message.artifacts && message.artifacts.length > 0)) && (
                    <div
                      className={`relative px-5 py-3 text-base ${message.role === "user"
                          ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm ml-auto max-w-[85%]"
                          : "bg-transparent text-foreground w-full"
                        }`}
                    >
                      <Message
                        message={message}
                        isStreaming={messageIsStreaming}
                        thinking={isLastAssistant ? thinking : undefined}
                        steps={isLastAssistant ? steps : undefined}
                        toolCalls={isLastAssistant ? toolCalls : undefined}
                        activities={isLastAssistant ? activities : undefined}
                      />
                    </div>
                  )}

                  {/* Artifacts */}
                  {message.artifacts && message.artifacts.length > 0 && (
                    <div className="w-full space-y-2">
                      {message.artifacts.map((artifact) => (
                        <ArtifactPreview key={artifact.id} artifact={artifact} />
                      ))}
                    </div>
                  )}

                  {/* Message Actions */}
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toast.success("Feedback positivo registrado!")}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toast.success("Feedback negativo registrado!")}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => regenerateAssistantResponse(message.id)}
                        disabled={isLoading || !isLastAssistant}
                        title={
                          isLastAssistant
                            ? "Regenerar resposta"
                            : "Disponível apenas para a última resposta"
                        }
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* TypeMind Style: User avatar hidden for cleaner look */}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {shouldShowLoadingBubble && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
                <Loader2
                  className={`h-4 w-4 animate-spin ${isProcessing ? "text-blue-500" : "text-accent"}`}
                />
                <span className="text-sm text-muted-foreground">{loadingText}</span>
              </div>
            </div>
          )}
        </div>
      </StickToBottom.Content>
      <ScrollToBottomButton />
    </StickToBottom>
  );
}

// Artifact Preview Component
function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  const { openPanel } = usePanel();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <button
      type="button"
      className="w-full border border-dashed border-border rounded-lg p-3 hover:border-accent/50 transition-colors cursor-pointer text-left"
      onClick={() => openPanel("artifact", artifact)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-medium">{artifact.title}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(artifact.content, artifact.id);
          }}
        >
          {copiedId === artifact.id ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {artifact.content.slice(0, 150)}...
      </p>
    </button>
  );
}

function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <div className="absolute inset-x-0 flex justify-center z-10 pointer-events-none bottom-24">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full pointer-events-auto"
        onClick={() => scrollToBottom()}
        aria-label="Ir para o final"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
