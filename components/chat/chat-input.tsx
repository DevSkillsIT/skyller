/**
 * ChatInput - Area de entrada de mensagens estilo Gemini
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-037: Componente ChatInput Extraido
 * @acceptance AC-010: Character Limit Validation
 * @acceptance AC-012: Rate Limit UI with Countdown
 *
 * Renderiza area de entrada com:
 * - Textarea com auto-resize
 * - Botao de envio
 * - Dropdowns para anexos, ferramentas e agentes
 * - Status info (docs, tools)
 * - Validacao de limite de caracteres
 * - UI de rate limit com countdown
 */
"use client";

import {
  AlertCircle,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Code2,
  FileSearch,
  FileText,
  FolderKanban,
  LayoutGrid,
  Loader2,
  Plus,
  Presentation,
  Search,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Constantes de limite
const DEFAULT_MAX_CHARS = 4000;
const WARNING_THRESHOLD = 0.9; // 90% do limite

// Tipos
export interface Agent {
  id: string;
  name: string;
  description?: string;
}

export interface RateLimitInfo {
  /** Se esta rate limited */
  isLimited: boolean;
  /** Tempo restante formatado (ex: "0:45") */
  formattedTime: string;
  /** Requests restantes */
  remaining: number;
  /** Limite total */
  limit: number;
}

export interface ChatInputProps {
  /** Lista de agentes disponiveis */
  agents?: Agent[];
  /** ID do agente selecionado */
  selectedAgent?: string;
  /** Callback quando agente e selecionado */
  onAgentChange?: (agentId: string) => void;
  /** Se esta carregando (enviando mensagem) */
  isLoading?: boolean;
  /** Callback quando mensagem e enviada */
  onSend?: (message: string, agentId?: string) => void;
  /** Callback para abrir galeria de agentes */
  onOpenAgentsGallery?: () => void;
  /** Placeholder do textarea */
  placeholder?: string;
  /** Se o input esta desabilitado */
  disabled?: boolean;
  /** Contagem de documentos ativos */
  docsCount?: number;
  /** Contagem de ferramentas ativas */
  toolsCount?: number;
  /** Callback para upload de arquivo */
  onFileUpload?: () => void;
  /** Callback para adicionar do Drive */
  onAddFromDrive?: () => void;
  /** Callback para importar codigo */
  onImportCode?: () => void;
  /** Limite maximo de caracteres (padrao: 4000) */
  maxChars?: number;
  /** Informacoes de rate limit */
  rateLimit?: RateLimitInfo;
}

// Mapa de icones por agente
const agentIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  general: Bot,
  "data-analyst": BarChart3,
  "doc-analyst": FileText,
  "code-assistant": Code2,
};

/**
 * ChatInput - Componente de entrada de mensagens
 *
 * Features:
 * - Textarea com auto-resize (52px a 200px)
 * - Enter para enviar, Shift+Enter para nova linha
 * - Dropdowns para anexos, ferramentas e agentes
 * - Status info com contagem de docs e tools
 * - Validacao de limite de caracteres (AC-010)
 * - UI de rate limit com countdown (AC-012)
 */
export function ChatInput({
  agents = [],
  selectedAgent = "general",
  onAgentChange,
  isLoading = false,
  onSend,
  onOpenAgentsGallery,
  placeholder = "Digite sua mensagem...",
  disabled = false,
  docsCount = 0,
  toolsCount = 0,
  onFileUpload,
  onAddFromDrive,
  onImportCode,
  maxChars = DEFAULT_MAX_CHARS,
  rateLimit,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AC-010: Calcula estado do limite de caracteres
  const charCount = input.length;
  const charPercentage = (charCount / maxChars) * 100;
  const isNearLimit = charPercentage >= WARNING_THRESHOLD * 100;
  const isOverLimit = charCount > maxChars;

  // Determina se esta rate limited
  const isRateLimited = rateLimit?.isLimited ?? false;

  // Auto-resize do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Handler para envio de mensagem
  const handleSend = useCallback(() => {
    // AC-010: Valida limite de caracteres
    if (isOverLimit) {
      toast.error(`Mensagem muito longa. Limite: ${maxChars} caracteres.`);
      return;
    }

    // AC-012: Verifica rate limit
    if (isRateLimited) {
      toast.error(`Aguarde ${rateLimit?.formattedTime} para enviar outra mensagem.`);
      return;
    }

    if (!input.trim() || isLoading || disabled) return;

    onSend?.(input.trim(), selectedAgent);
    setInput("");

    // Reset altura do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
    }
  }, [
    input,
    isLoading,
    disabled,
    onSend,
    selectedAgent,
    isOverLimit,
    isRateLimited,
    maxChars,
    rateLimit?.formattedTime,
  ]);

  // Handler para teclas (Enter para enviar)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handlers para acoes dos dropdowns
  const handleFileUpload = useCallback(() => {
    if (onFileUpload) {
      onFileUpload();
    } else {
      toast.info("Enviar arquivos");
    }
  }, [onFileUpload]);

  const handleAddFromDrive = useCallback(() => {
    if (onAddFromDrive) {
      onAddFromDrive();
    } else {
      toast.info("Adicionar do Drive");
    }
  }, [onAddFromDrive]);

  const handleImportCode = useCallback(() => {
    if (onImportCode) {
      onImportCode();
    } else {
      toast.info("Importar codigo");
    }
  }, [onImportCode]);

  // Encontra agente selecionado
  const currentAgent = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* Input Box */}
        <div className="relative border border-border rounded-3xl bg-background shadow-sm hover:shadow-md transition-shadow">
          {/* Input area with textarea */}
          <div className="flex items-end gap-2 p-3">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none py-2 px-2"
                disabled={isLoading || disabled}
              />
            </div>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || disabled || isOverLimit || isRateLimited}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* AC-012: Rate Limit Warning Banner */}
          {isRateLimited && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Limite de requisicoes atingido. Aguarde{" "}
                <span className="font-mono font-semibold">{rateLimit?.formattedTime}</span> para
                continuar.
              </span>
            </div>
          )}

          {/* AC-010: Character Count Indicator */}
          {charCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border/50">
              <Progress
                value={Math.min(charPercentage, 100)}
                className={cn(
                  "h-1.5 flex-1",
                  isOverLimit && "[&>div]:bg-red-500",
                  isNearLimit && !isOverLimit && "[&>div]:bg-yellow-500"
                )}
              />
              <span
                className={cn(
                  "text-xs font-mono",
                  isOverLimit && "text-red-500 font-semibold",
                  isNearLimit && !isOverLimit && "text-yellow-600 dark:text-yellow-400",
                  !isNearLimit && "text-muted-foreground"
                )}
              >
                {charCount.toLocaleString()}/{maxChars.toLocaleString()}
              </span>
              {isOverLimit && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
            </div>
          )}

          {/* Bottom bar with buttons - Gemini style */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border/50">
            <div className="flex items-center gap-1">
              {/* Botao + (Anexar, Drive, Codigo) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Adicionar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleFileUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar arquivos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddFromDrive}>
                    <Cloud className="h-4 w-4 mr-2" />
                    Adicionar do Drive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportCode}>
                    <Code2 className="h-4 w-4 mr-2" />
                    Importar codigo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botao Ferramentas (Kanban, Canvas, etc) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs">Ferramentas</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => (window.location.href = "/kanban")}>
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Kanban
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/canvas")}>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Canvas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/analysis")}>
                    <FileSearch className="h-4 w-4 mr-2" />
                    Analise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/presentations")}>
                    <Presentation className="h-4 w-4 mr-2" />
                    Apresentacoes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/research")}>
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botao Agentes */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <Bot className="h-4 w-4" />
                    <span className="text-xs">{currentAgent?.name || "Agentes"}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Selecionar Agente</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {agents.map((agent) => {
                    const AgentIcon = agentIconMap[agent.id] || Bot;
                    const isSelected = selectedAgent === agent.id;
                    return (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => onAgentChange?.(agent.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <AgentIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            {agent.description && (
                              <div className="text-xs text-muted-foreground">
                                {agent.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-accent" />}
                      </DropdownMenuItem>
                    );
                  })}
                  {onOpenAgentsGallery && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onOpenAgentsGallery}>
                        <Search className="h-4 w-4 mr-2" />
                        Ver todos os agentes
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {docsCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {docsCount} docs
                </span>
              )}
              {toolsCount > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {toolsCount} tools
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
