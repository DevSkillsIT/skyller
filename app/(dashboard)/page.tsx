"use client";

import {
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Copy,
  DollarSign,
  FileSearch,
  FileText,
  FolderKanban,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Palette,
  Paperclip,
  Plus,
  Presentation,
  RefreshCw,
  Scale,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AgentsGalleryDialog } from "@/components/dialogs/agents-gallery-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/lib/contexts/chat-context";
import { usePanel } from "@/lib/contexts/panel-context";
import {
  type Artifact,
  conversationSuggestions,
  type Message,
  mockAgents,
  mockMessages,
} from "@/lib/mock/data";

const agentIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  general: Bot,
  "data-analyst": BarChart3,
  "doc-analyst": FileText,
  "code-assistant": Code2,
};

export default function ChatPage() {
  const { messages, addMessage, setMessages } = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("general");
  const [isAgentsGalleryOpen, setIsAgentsGalleryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `m${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    // Simulate AI response with streaming effect
    setTimeout(() => {
      const aiMessage: Message = {
        id: `m${Date.now() + 1}`,
        role: "assistant",
        content:
          "Entendi sua solicitação. Estou analisando os dados disponíveis e processando sua requisição...\n\nCom base nas informações do projeto, posso fornecer uma análise detalhada. Aguarde enquanto gero o relatório completo.",
        timestamp: new Date(),
        agentId: "general",
      };
      addMessage(aiMessage);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
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
                Pergunte qualquer coisa. Posso ajudar com pesquisa, escrita, codigo, analise de
                dados e mais.
              </p>

              {/* Conversation Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {conversationSuggestions.map((suggestion) => {
                  const SuggestionIcon =
                    suggestion.icon === "TrendingUp"
                      ? TrendingUp
                      : suggestion.icon === "FileSearch"
                        ? FileSearch
                        : suggestion.icon === "Code2"
                          ? Code2
                          : FileText;
                  return (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        setInput(suggestion.title);
                        setSelectedAgent(suggestion.agentId);
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-accent/30 transition-colors text-left"
                    >
                      <SuggestionIcon className="h-4 w-4 text-accent flex-shrink-0" />
                      <span className="text-sm">{suggestion.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => {
            const agent = message.agentId ? mockAgents.find((a) => a.id === message.agentId) : null;
            const AgentIcon = message.agentId ? agentIconMap[message.agentId] || Bot : Bot;

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
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">Skyller está pensando...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Gemini Style */}
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
                  placeholder="Digite sua mensagem..."
                  className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none py-2 px-2"
                  disabled={isLoading}
                />
              </div>

              <Button
                size="icon"
                className="h-10 w-10 rounded-full flex-shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Bottom bar with buttons - Gemini style */}
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

                {/* Botão Ferramentas (Kanban, Canvas, etc) */}
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
                      <Bot className="h-4 w-4" />
                      <span className="text-xs">
                        {mockAgents.find((a) => a.id === selectedAgent)?.name || "Agentes"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Selecionar Agente</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {mockAgents.map((agent) => {
                      const AgentIcon = agentIconMap[agent.id] || Bot;
                      const isSelected = selectedAgent === agent.id;
                      return (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent.id)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <AgentIcon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {agent.description}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsAgentsGalleryOpen(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Ver todos os agentes
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
                  <BarChart3 className="h-3 w-3" />3 tools
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Gallery Dialog */}
      <AgentsGalleryDialog
        open={isAgentsGalleryOpen}
        onOpenChange={setIsAgentsGalleryOpen}
        selectedAgent={selectedAgent}
        onSelectAgent={setSelectedAgent}
      />
    </div>
  );
}

// Artifact Preview Component
function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  const { openPanel } = usePanel();

  return (
    <Card
      className="border-dashed hover:border-accent/50 transition-colors cursor-pointer"
      onClick={() => openPanel("artifact", artifact)}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            {artifact.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openPanel("artifact", artifact);
                }}
              >
                Abrir em Painel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(artifact.content);
                  toast.success("Conteudo copiado!");
                }}
              >
                Copiar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                Salvar no Projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {artifact.content.slice(0, 150)}...
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              openPanel("artifact", artifact);
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            Abrir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(artifact.content);
              toast.success("Copiado!");
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
