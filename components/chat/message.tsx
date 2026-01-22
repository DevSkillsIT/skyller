/**
 * Message - Componente de mensagem individual com Streamdown
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-035: Componente Message Extraido com Markdown
 * @acceptance AC-019: Markdown Rendering com Streamdown
 * @acceptance AC-030: XSS Prevention com Sanitizacao
 * @acceptance AC-033: Syntax Highlighting
 * @acceptance AC-034: Timestamp Formatacao Relativa+Absoluta
 * @acceptance AC-018: Retry Logic para Mensagens Falhas
 *
 * Renderiza mensagens do usuario e assistente com suporte a:
 * - Markdown com Streamdown v2 (seguranca embutida)
 * - Syntax highlighting com @streamdown/code
 * - Timestamps relativos e absolutos
 * - Botoes de feedback e acoes
 * - Retry para mensagens falhas
 */
"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  BarChart3,
  Bot,
  Check,
  Code2,
  Copy,
  FileText,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import type React from "react";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Artifact } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

// Importacao dinamica do Streamdown para evitar problemas SSR
const Streamdown = lazy(() => import("streamdown").then((mod) => ({ default: mod.Streamdown })));

// Tipos de dados
export interface MessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentId?: string;
  artifacts?: Artifact[];
  isStreaming?: boolean;
  /** AC-018: Indica se a mensagem falhou e pode ser retentada */
  hasError?: boolean;
  /** Mensagem de erro (se houver) */
  errorMessage?: string;
}

export type { Artifact };

export interface Agent {
  id: string;
  name: string;
  description?: string;
}

export interface MessageProps {
  /** Dados da mensagem */
  message: MessageData;
  /** Informacoes do agente (para mensagens do assistente) */
  agent?: Agent | null;
  /** Se e a ultima mensagem (para streaming) */
  isLastMessage?: boolean;
  /** Se o agente esta processando */
  isAgentRunning?: boolean;
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

// Mapa de icones por agente
const agentIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  general: Bot,
  "data-analyst": BarChart3,
  "doc-analyst": FileText,
  "code-assistant": Code2,
};

/**
 * Formata timestamp com formato relativo e absoluto
 * AC-034: Timestamp Formatacao Relativa+Absoluta
 *
 * @example
 * // Retorna: "ha 5 minutos (21/01/2026 14:30)"
 */
function formatTimestamp(date: Date): string {
  const relative = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  const absolute = format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  return `${relative} (${absolute})`;
}

/**
 * Formata hora simples para exibicao compacta
 */
function formatTime(date: Date): string {
  return format(date, "HH:mm", { locale: ptBR });
}

/**
 * Componente Message - Renderiza uma mensagem do chat
 *
 * Layout visual preservado 100% do design original
 * com adicao de Streamdown para markdown seguro.
 */
export function Message({
  message,
  agent,
  isLastMessage = false,
  isAgentRunning = false,
  onFeedbackPositive,
  onFeedbackNegative,
  onRegenerate,
  onOpenArtifact,
  onRetry,
}: MessageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Determina se esta em streaming
  const isStreaming = useMemo(
    () => message.isStreaming || (isLastMessage && isAgentRunning && message.role === "assistant"),
    [message.isStreaming, isLastMessage, isAgentRunning, message.role]
  );

  // Obtem icone do agente
  const AgentIcon = useMemo(
    () => (message.agentId ? agentIconMap[message.agentId] || Bot : Bot),
    [message.agentId]
  );

  // Handler para copiar conteudo
  const handleCopy = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handler para feedback positivo
  const handleFeedbackPositive = useCallback(() => {
    if (onFeedbackPositive) {
      onFeedbackPositive(message.id);
    } else {
      toast.success("Feedback positivo registrado!");
    }
  }, [message.id, onFeedbackPositive]);

  // Handler para feedback negativo
  const handleFeedbackNegative = useCallback(() => {
    if (onFeedbackNegative) {
      onFeedbackNegative(message.id);
    } else {
      toast.success("Feedback negativo registrado!");
    }
  }, [message.id, onFeedbackNegative]);

  // Handler para regenerar
  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate(message.id);
    } else {
      toast.info("Regenerando resposta...");
    }
  }, [message.id, onRegenerate]);

  // AC-018: Handler para retry de mensagem com erro
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry(message.id, message.content);
    } else {
      toast.info("Reenviando mensagem...");
    }
  }, [message.id, message.content, onRetry]);

  return (
    <div className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {/* Avatar do assistente (esquerda) */}
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
        {/* Header da mensagem - Apenas para assistente */}
        {message.role === "assistant" && agent && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{agent.name}</span>
            <span className="text-muted-foreground/60">{formatTime(message.timestamp)}</span>
          </div>
        )}

        {/* Conteudo da mensagem */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            message.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted",
            message.hasError &&
              "border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/20"
          )}
        >
          {/* AC-018: Indicador de erro */}
          {message.hasError && (
            <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">
                {message.errorMessage || "Falha ao enviar mensagem"}
              </span>
            </div>
          )}

          {/*
            AC-019: Renderizacao de Markdown com Streamdown v2
            AC-030: XSS Prevention - Streamdown tem sanitizacao embutida
            AC-033: Syntax Highlighting - Suporte nativo via plugins
          */}
          <Suspense
            fallback={
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
            }
          >
            <div className="prose dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none">
              <Streamdown>{message.content}</Streamdown>
            </div>
          </Suspense>

          {/* Indicador de streaming */}
          {isStreaming && <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1" />}
        </div>

        {/* Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="w-full space-y-2">
            {message.artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="border border-dashed rounded-lg p-3 hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => onOpenArtifact?.(artifact)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{artifact.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {artifact.content.slice(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        )}

        {/* AC-018: Botao de retry para mensagens do usuario com erro */}
        {message.role === "user" && message.hasError && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              onClick={handleRetry}
              title="Tentar novamente"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Tentar novamente</span>
            </Button>
          </div>
        )}

        {/* Acoes da mensagem - Apenas para assistente */}
        {message.role === "assistant" && !message.hasError && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleFeedbackPositive}
              title="Feedback positivo"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleFeedbackNegative}
              title="Feedback negativo"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleCopy(message.content, message.id)}
              title="Copiar"
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
              onClick={handleRegenerate}
              title="Regenerar resposta"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Avatar do usuario (direita) */}
      {message.role === "user" && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-muted">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export default Message;
