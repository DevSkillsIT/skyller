"use client";

import { Bot, Check, Copy, Loader2, RefreshCw, ThumbsDown, ThumbsUp, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Message } from "@/components/chat/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export function ChatMessages({
  messages,
  isLoading,
  selectedAgentId,
  thinking,
  steps,
  toolCalls,
  activities,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const { agents } = useAgents();

  // Smart auto-scroll: detecta viewport interno do ScrollArea e rastreia posição
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsNearBottom(distanceFromBottom < 100);
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll quando novas mensagens chegam (só se usuário estiver no bottom)
  useEffect(() => {
    if (!isNearBottom) return;
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages.length, isNearBottom]);

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
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Welcome Message if no messages */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-3">
              <Bot className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-1">Como posso ajudar?</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Pergunte qualquer coisa. Posso ajudar com pesquisa, escrita, codigo, analise de dados
              e mais.
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
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white">
                    <AgentIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`flex flex-col gap-2 max-w-[80%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Message Header - Only for Assistant */}
                {message.role === "assistant" && agent && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{agent.name}</span>
                  </div>
                )}

                {/* Message Content */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted"
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
                      onClick={() => toast.info("Regenerando resposta...")}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
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
    </ScrollArea>
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
