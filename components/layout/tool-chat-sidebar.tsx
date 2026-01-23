"use client";

import { Bot, Loader2, Maximize2, MessageSquare, Minimize2, Send, User, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Message } from "@/components/chat/message";
import { useChat } from "@/lib/contexts/chat-context";

interface ToolChatSidebarProps {
  toolName: string;
  toolDescription: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ToolChatSidebar({
  toolName,
  toolDescription,
  isOpen,
  onToggle,
  className,
}: ToolChatSidebarProps) {
  // Usar contexto com AgentState (useAgent v2)
  const {
    messages,
    isRunning,
    currentTool,
    thinkingState,
    runAgent,
  } = useChat();

  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;

    const messageContent = input.trim();
    setInput("");

    try {
      // Executar agente com nova mensagem (dispara eventos AG-UI)
      await runAgent(messageContent);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-background transition-all duration-300",
        isMinimized ? "w-[48px]" : "w-[320px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isMinimized && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium">{toolName} Copilot</h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {toolDescription}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Como posso ajudar com {toolName}?</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  // Última mensagem do assistente está em streaming durante isRunning
                  const isLastAssistantMessage = message.role === "assistant" && index === messages.length - 1;
                  const messageIsStreaming = isLastAssistantMessage && isRunning;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white text-[10px]">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                          message.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted"
                        )}
                      >
                        <Message
                          message={message}
                          isStreaming={messageIsStreaming}
                          // Passar estado AG-UI em tempo real
                          currentTool={isLastAssistantMessage ? currentTool : undefined}
                          thinkingState={isLastAssistantMessage ? thinkingState : undefined}
                        />
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="bg-muted text-[10px]">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                {isRunning && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white text-[10px]">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Pergunte sobre ${toolName}...`}
                className="min-h-[40px] max-h-[100px] resize-none pr-10 py-2 text-sm"
                disabled={isRunning}
              />
              <Button
                size="icon"
                className="absolute right-1.5 bottom-1.5 h-7 w-7"
                onClick={handleSend}
                disabled={!input.trim() || isRunning}
              >
                {isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
