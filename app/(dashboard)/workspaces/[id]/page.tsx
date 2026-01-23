"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Github,
  Globe,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { WorkspaceInstructionsDialog } from "@/components/dialogs/workspace-instructions-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getWorkspaceConversations, getWorkspaceProjects, mockWorkspaces } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const workspace = mockWorkspaces.find((w) => w.id === workspaceId);
  const workspaceConversations = getWorkspaceConversations(workspaceId);
  const workspaceProjects = getWorkspaceProjects(workspaceId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [instructions, setInstructions] = useState(workspace?.customInstructions || "");
  const [isMemoryOpen, setIsMemoryOpen] = useState(true);
  const [isInstructionsSectionOpen, setIsInstructionsSectionOpen] = useState(true);
  const [isFilesOpen, setIsFilesOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins} minutos`;
    if (diffHours < 24) return `${diffHours} horas`;
    if (diffDays < 30) return `${diffDays} dias`;
    return `${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? "es" : ""}`;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: `Entendi! Voce esta trabalhando no workspace "${workspace?.name}". Posso ajudar com qualquer projeto ou tarefa deste workspace.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveInstructions = (newInstructions: string) => {
    setInstructions(newInstructions);
    setIsInstructionsOpen(false);
  };

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Workspace nao encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O workspace que voce esta procurando nao existe.
        </p>
        <Button variant="outline" asChild>
          <Link href="/workspaces">Voltar aos workspaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/workspaces" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Todos os workspaces</span>
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Renomear</DropdownMenuItem>
                  <DropdownMenuItem>Arquivar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Star className={cn("h-4 w-4", isFavorite && "fill-yellow-400 text-yellow-400")} />
              </Button>
            </div>
          </div>

          {/* Workspace Title */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{workspace.icon}</span>
              <h1 className="text-2xl font-semibold">{workspace.name}</h1>
            </div>
            {workspace.description && (
              <p className="text-muted-foreground mt-1">{workspace.description}</p>
            )}
          </div>
        </div>

        {/* Messages / Empty State */}
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col h-full">
              {/* Chat Input at Top for Empty State */}
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-6">
                      <div className="relative">
                        <Textarea
                          ref={textareaRef}
                          placeholder="Responder..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="min-h-[100px] resize-none pr-12 border-none shadow-none focus-visible:ring-0"
                        />
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Globe className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={handleSend}
                            disabled={!input.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hint */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
                    <p className="text-sm text-center text-muted-foreground">
                      Inicie uma conversa no nivel do workspace para discutir temas gerais ou
                      acessar o conhecimento compartilhado entre todos os projetos.
                    </p>
                  </div>

                  {/* Workspace Conversation History */}
                  {workspaceConversations.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                        Conversas recentes do workspace
                      </h3>
                      <div className="space-y-1">
                        {workspaceConversations.map((conversation) => (
                          <Link
                            key={conversation.id}
                            href={`/chat/${conversation.id}`}
                            className="block p-3 rounded-lg hover:bg-accent/50 transition-colors border-b last:border-b-0"
                          >
                            <div className="font-medium text-sm">{conversation.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Ultima mensagem ha {formatRelativeTime(conversation.updatedAt)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 max-w-[80%]",
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Chat Input for Active Conversation */}
        {messages.length > 0 && (
          <div className="flex-shrink-0 border-t p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl p-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  placeholder="Enviar mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[40px] max-h-[200px] resize-none border-none shadow-none focus-visible:ring-0 bg-transparent"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full flex-shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Workspace Settings (esconde quando chat ativo, igual Claude) */}
      {messages.length === 0 && (
        <div className="w-80 border-l bg-muted/20 flex-shrink-0 hidden lg:block">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Projetos do Workspace - DIFERENÇA PRINCIPAL */}
              <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2">
                    <h3 className="font-medium text-sm">Projetos</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {workspaceProjects.length}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isProjectsOpen && "rotate-180"
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-2">
                    {workspaceProjects.length > 0 ? (
                      <>
                        {workspaceProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg flex-shrink-0">{project.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{project.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {project.chatsCount} conversas
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                          onClick={() => router.push(`/projects?workspace=${workspaceId}`)}
                        >
                          <Plus className="h-4 w-4" />
                          Novo projeto
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <FolderOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-2">
                          Nenhum projeto neste workspace
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => router.push(`/projects?workspace=${workspaceId}`)}
                        >
                          <Plus className="h-4 w-4" />
                          Criar projeto
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Memoria */}
              <Collapsible open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2">
                    <h3 className="font-medium text-sm">Memoria</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Lock className="h-3 w-3" />
                        Apenas voce
                      </Badge>
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", isMemoryOpen && "rotate-180")}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-xs text-muted-foreground mt-2">
                    A memoria do workspace aparecera aqui apos alguns chats.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Instrucoes */}
              <Collapsible
                open={isInstructionsSectionOpen}
                onOpenChange={setIsInstructionsSectionOpen}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2">
                    <h3 className="font-medium text-sm">Instrucoes</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsInstructionsOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isInstructionsSectionOpen && "rotate-180"
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {instructions ? (
                    <div
                      className="mt-2 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => setIsInstructionsOpen(true)}
                    >
                      <p className="text-xs text-muted-foreground line-clamp-3">{instructions}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Adicionar instrucoes para personalizar as respostas do Skyller neste
                      workspace.
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Arquivos */}
              <Collapsible open={isFilesOpen} onOpenChange={setIsFilesOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2">
                    <h3 className="font-medium text-sm">Arquivos</h3>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem>
                            <Upload className="h-4 w-4 mr-2" />
                            Carregar do aparelho
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Adicionar conteudo de texto
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
                              />
                            </svg>
                            Google Drive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", isFilesOpen && "rotate-180")}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4 p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-12 bg-muted rounded border flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="w-10 h-12 bg-muted rounded border flex items-center justify-center -ml-4">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="w-10 h-12 bg-muted rounded border flex items-center justify-center -ml-4">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adicione PDFs, documentos ou outros textos para usar como referencia em todo o
                      workspace.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Instructions Dialog */}
      <WorkspaceInstructionsDialog
        open={isInstructionsOpen}
        onOpenChange={setIsInstructionsOpen}
        workspaceName={workspace.name}
        currentInstructions={instructions}
        onSave={handleSaveInstructions}
      />
    </div>
  );
}
