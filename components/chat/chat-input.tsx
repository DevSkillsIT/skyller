"use client";

import {
  Bot,
  ChevronDown,
  Code2,
  Cloud,
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
import { useRef, useEffect } from "react";
import { toast } from "sonner";
import { AgentsGalleryDialog } from "@/components/dialogs/agents-gallery-dialog";
import { RateLimitIndicator } from "@/components/chat/rate-limit-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAgents, type Agent } from "@/lib/hooks/use-agents";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  rateLimit: {
    isLimited: boolean;
    remaining: number;
    resetTime?: number;
  };
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  isAgentsGalleryOpen: boolean;
  setIsAgentsGalleryOpen: (open: boolean) => void;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  rateLimit,
  selectedAgentId,
  setSelectedAgentId,
  isAgentsGalleryOpen,
  setIsAgentsGalleryOpen,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Hook para buscar agentes da API
  const { agents, globalAgents, companyAgents, isLoading: agentsLoading } = useAgents();
  const currentAgent = agents.find((a) => a.id === selectedAgentId);
  const CurrentAgentIcon = currentAgent?.icon || Bot;

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* Rate Limit Indicator */}
        <RateLimitIndicator />

        {/* Input Box */}
        <div className="relative border border-border rounded-3xl bg-background shadow-sm hover:shadow-md transition-shadow">
          {/* Input area with textarea */}
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2 p-3 pb-1">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none py-2 px-2"
                  disabled={isLoading || rateLimit.isLimited}
                  data-testid="chat-input"
                />
              </div>

              <Button
                size="icon"
                className="h-10 w-10 rounded-full flex-shrink-0"
                onClick={onSend}
                disabled={!input.trim() || isLoading || rateLimit.isLimited || rateLimit.remaining === 0 || input.trim().length > 10000}
                data-testid="send-button"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Contador de caracteres */}
            <div className="text-xs px-5 pb-2">
              <span className={input.length > 10000 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {input.length.toLocaleString()}/10.000 caracteres
              </span>
            </div>
          </div>

          {/* Bottom bar with buttons */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border/50">
            <div className="flex items-center gap-1">
              {/* Botão + (Anexar, Drive, Código) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Adicionar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => toast.info("Enviar arquivos")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar arquivos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Adicionar do Drive")}>
                    <Cloud className="h-4 w-4 mr-2" />
                    Adicionar do Drive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Importar código")}>
                    <Code2 className="h-4 w-4 mr-2" />
                    Importar código
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão Ferramentas */}
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
                    Análise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/presentations")}>
                    <Presentation className="h-4 w-4 mr-2" />
                    Apresentações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/research")}>
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão Agentes */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <CurrentAgentIcon className="h-4 w-4" />
                    <span className="text-xs">
                      {currentAgent?.name || "Agentes"}
                    </span>
                    {currentAgent && (
                      <div className={`h-1.5 w-1.5 rounded-full ${currentAgent.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Selecionar Agente</span>
                    {agentsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Agentes Globais */}
                  {globalAgents.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">
                        Globais
                      </DropdownMenuLabel>
                      {globalAgents.slice(0, 3).map((agent) => {
                        const AgentIcon = agent.icon;
                        const isSelected = selectedAgentId === agent.id;
                        return (
                          <DropdownMenuItem
                            key={agent.id}
                            onClick={() => setSelectedAgentId(agent.id)}
                            className="flex items-center justify-between"
                            disabled={!agent.isActive}
                          >
                            <div className="flex items-center gap-2">
                              <AgentIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium flex items-center gap-1.5">
                                  {agent.name}
                                  <div className={`h-1.5 w-1.5 rounded-full ${agent.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {agent.description}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Send className="h-4 w-4 text-accent" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}

                  {/* Agentes da Empresa */}
                  {companyAgents.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">
                        Empresa
                      </DropdownMenuLabel>
                      {companyAgents.slice(0, 3).map((agent) => {
                        const AgentIcon = agent.icon;
                        const isSelected = selectedAgentId === agent.id;
                        return (
                          <DropdownMenuItem
                            key={agent.id}
                            onClick={() => setSelectedAgentId(agent.id)}
                            className="flex items-center justify-between"
                            disabled={!agent.isActive}
                          >
                            <div className="flex items-center gap-2">
                              <AgentIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium flex items-center gap-1.5">
                                  {agent.name}
                                  <div className={`h-1.5 w-1.5 rounded-full ${agent.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {agent.description}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Send className="h-4 w-4 text-accent" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAgentsGalleryOpen(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Ver todos os agentes ({agents.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                12 docs
              </span>
              <span className="flex items-center gap-1">
                <FileSearch className="h-3 w-3" />
                3 tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Gallery Dialog */}
      <AgentsGalleryDialog
        open={isAgentsGalleryOpen}
        onOpenChange={setIsAgentsGalleryOpen}
        selectedAgent={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
      />
    </div>
  );
}
