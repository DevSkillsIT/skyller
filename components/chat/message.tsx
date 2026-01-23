"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { Loader2, Wrench, Brain } from "lucide-react";
import "katex/dist/katex.min.css"; // CSS para LaTeX

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  // Suporte a eventos AG-UI
  toolCall?: {
    name: string;
    status: "running" | "completed" | "failed";
    result?: string;
  };
  thinking?: {
    status: "active" | "completed";
    content?: string;
  };
}

interface MessageProps {
  message: Message;
  isStreaming?: boolean;
  // Indicadores de estado AG-UI em tempo real
  currentTool?: string;
  thinkingState?: string;
}

export function Message({
  message,
  isStreaming = false,
  currentTool,
  thinkingState,
}: MessageProps) {
  const showToolIndicator = message.toolCall || currentTool;
  const showThinkingIndicator = message.thinking || thinkingState;

  return (
    <div className="message-container">
      {/* Indicador de Thinking State (AG-UI Event) */}
      {showThinkingIndicator && (
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4 animate-pulse" />
          <span className="italic">
            {thinkingState || message.thinking?.content || "Analisando..."}
          </span>
        </div>
      )}

      {/* Indicador de Tool Call (AG-UI Event) */}
      {showToolIndicator && (
        <div className="flex items-center gap-2 mb-2 text-sm">
          <Wrench className="h-4 w-4" />
          <span className="font-medium">
            Ferramenta: {currentTool || message.toolCall?.name}
          </span>
          {message.toolCall?.status === "running" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {message.toolCall?.status === "completed" && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ Concluído</span>
          )}
          {message.toolCall?.status === "failed" && (
            <span className="text-xs text-red-600 dark:text-red-400">✗ Falhou</span>
          )}
        </div>
      )}

      {/* Resultado da Tool Call */}
      {message.toolCall?.result && (
        <div className="mb-2 p-2 rounded bg-muted/50 text-sm border border-border">
          <div className="font-medium text-xs text-muted-foreground mb-1">Resultado:</div>
          <div className="font-mono text-xs">{message.toolCall.result}</div>
        </div>
      )}

      {/* Conteúdo da mensagem com Streamdown */}
      <Streamdown
        plugins={{
          code,  // ✅ Syntax highlighting com Shiki
          math,  // ✅ Renderização LaTeX com KaTeX
        }}
        isAnimating={isStreaming}  // ✅ Animação apenas durante streaming
      >
        {message.content}
      </Streamdown>
    </div>
  );
}
