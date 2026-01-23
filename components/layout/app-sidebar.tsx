"use client";

import {
  Archive,
  Bot,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  File,
  FileSearch,
  FileText,
  FolderKanban,
  FolderOpen,
  LayoutGrid,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Conversation, Project, Workspace } from "@/lib/mock/data";
import { getRecentConversations } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Kanban", href: "/kanban", icon: FolderKanban },
  { name: "Canvas", href: "/canvas", icon: LayoutGrid },
  { name: "Documentos", href: "/knowledge", icon: FileText },
  { name: "Analise", href: "/analysis", icon: FileSearch },
  { name: "Agentes", href: "/agents", icon: Bot },
  { name: "Apresentacoes", href: "/presentations", icon: Presentation },
  { name: "Pesquisa", href: "/research", icon: Search },
];

interface AppSidebarProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onWorkspaceChange: (workspace: Workspace | null) => void;
  projects: Project[];
  currentProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  onConversationSelect?: (conversationId: string) => void;
  onNewConversation?: () => void;
  onSearchOpen?: () => void;
}

export function AppSidebar({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  projects,
  currentProject,
  onProjectChange,
  onConversationSelect,
  onNewConversation,
  onSearchOpen,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSidebar();
  const [recentsExpanded, setRecentsExpanded] = useState(true);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [showAllRecents, setShowAllRecents] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [toolsHovered, setToolsHovered] = useState(false);
  const [conversationsHovered, setConversationsHovered] = useState(false);

  // Filtra projetos do workspace atual
  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === currentWorkspace?.id),
    [projects, currentWorkspace]
  );

  // Conversas recentes (todas, ordenadas por data)
  const recentConversations = useMemo(() => getRecentConversations(15), []);

  const getProjectById = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId);
  };

  // Formata tempo relativo
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  // Limite de itens visiveis
  const VISIBLE_RECENTS = 3;
  const visibleRecents = showAllRecents
    ? recentConversations
    : recentConversations.slice(0, VISIBLE_RECENTS);

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="border-b border-border p-2">
          {/* Logo + Collapse Toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-primary text-white font-bold text-sm flex-shrink-0">
                S
              </div>
              {open && <span className="font-semibold text-lg tracking-tight">SKYLLER</span>}
            </div>
            {open && <SidebarTrigger className="h-7 w-7" />}
          </div>

          {/* Botoes: Nova Conversa + Busca */}
          {open && (
            <div className="flex flex-col gap-1.5 mt-2">
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => {
                  onNewConversation?.();
                  setSelectedConversation(null);
                }}
              >
                <Plus className="h-4 w-4" />
                Nova Conversa
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2 justify-start text-muted-foreground bg-transparent"
                size="sm"
                onClick={() => onSearchOpen?.()}
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Buscar...</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ⌘K
                </kbd>
              </Button>
            </div>
          )}

          {!open && (
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="w-full"
                    onClick={() => {
                      onNewConversation?.();
                      setSelectedConversation(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Nova Conversa</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full bg-transparent"
                    onClick={() => onSearchOpen?.()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Buscar (⌘K)</TooltipContent>
              </Tooltip>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="flex-1">
            {/* WORKSPACE - Projetos e Chat (PRIMEIRO!) */}
            {open && (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>Workspace - Projetos e Chat</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 text-sm font-normal bg-transparent"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {currentWorkspace ? (
                            <>
                              <span>{currentWorkspace.icon}</span>
                              <span className="truncate">{currentWorkspace.name}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Selecionar workspace...</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                        Trocar Workspace
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {currentWorkspace && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              onWorkspaceChange(null as any);
                              onProjectChange(null);
                            }}
                            className="text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Nenhum workspace
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {workspaces.map((workspace) => (
                        <DropdownMenuItem
                          key={workspace.id}
                          onClick={() => {
                            onWorkspaceChange(workspace);
                            onProjectChange(null);
                            // Navega para a página de detalhe do workspace
                            router.push(`/workspaces/${workspace.id}`);
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span>{workspace.icon}</span>
                            <span>{workspace.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] px-1.5">
                              {workspace.projectsCount}
                            </Badge>
                            {currentWorkspace?.id === workspace.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-muted-foreground"
                        onClick={() => router.push("/workspaces")}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Ver todos os workspaces
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-muted-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* NAVEGACAO DO WORKSPACE */}
            {open && currentWorkspace && (
              <SidebarGroup className="py-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* Link para detalhe do workspace */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === `/workspaces/${currentWorkspace.id}`}>
                        <Link href={`/workspaces/${currentWorkspace.id}`}>
                          <Building2 className="h-4 w-4" />
                          <span>Visao Geral</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* Link para projetos do workspace */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/projects" || pathname.startsWith("/projects/")}>
                        <Link href={`/projects?workspace=${currentWorkspace.id}`}>
                          <FolderOpen className="h-4 w-4" />
                          <span>Projetos</span>
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-auto">
                            {workspaceProjects.length}
                          </Badge>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* LINK PARA TODOS OS WORKSPACES - Quando não há workspace selecionado */}
            {open && !currentWorkspace && (
              <SidebarGroup className="py-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/workspaces"}>
                        <Link href="/workspaces">
                          <Building2 className="h-4 w-4" />
                          <span>Ver todos os Workspaces</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* FERRAMENTAS - Colapsável */}
            {open && (
              <Collapsible open={toolsExpanded} onOpenChange={setToolsExpanded}>
                <SidebarGroup className="py-1">
                  {/* Wrapper para hover - isolado do Radix Collapsible */}
                  <div
                    onMouseEnter={() => setToolsHovered(true)}
                    onMouseLeave={() => setToolsHovered(false)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md flex items-center justify-between pr-2 mb-1">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="h-4 w-4" />
                          <span>Ferramentas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!toolsHovered && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                              {navigation.length}
                            </Badge>
                          )}
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-all",
                              toolsExpanded ? "rotate-90" : "",
                              toolsHovered ? "opacity-60" : "opacity-0"
                            )}
                          />
                        </div>
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {navigation.map((item) => (
                          <SidebarMenuItem key={item.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton asChild isActive={pathname === item.href}>
                                  <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              {!open && <TooltipContent side="right">{item.name}</TooltipContent>}
                            </Tooltip>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )}

            {/* SUAS CONVERSAS - Movido para baixo, sempre visível */}
            {open && (
              <Collapsible open={recentsExpanded} onOpenChange={setRecentsExpanded}>
                <SidebarGroup className="py-1">
                  {/* Wrapper para hover - isolado do Radix Collapsible */}
                  <div
                    onMouseEnter={() => setConversationsHovered(true)}
                    onMouseLeave={() => setConversationsHovered(false)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md flex items-center justify-between pr-2 mb-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Suas Conversas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!conversationsHovered && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                              {recentConversations.length}
                            </Badge>
                          )}
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-all",
                              recentsExpanded ? "rotate-90" : "",
                              conversationsHovered ? "opacity-60" : "opacity-0"
                            )}
                          />
                        </div>
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {visibleRecents.map((chat) => {
                          const project = getProjectById(chat.projectId);
                          const isSelected = selectedConversation === chat.id;

                          return (
                            <SidebarMenuItem key={chat.id}>
                              <SidebarMenuButton
                                onClick={() => {
                                  setSelectedConversation(chat.id);
                                  onConversationSelect?.(chat.id);
                                }}
                                isActive={isSelected}
                                className="group h-auto py-1.5"
                              >
                                {/* Icone do projeto ou chat solto */}
                                <div className="flex-shrink-0">
                                  {project ? (
                                    <span className="text-sm">{project.emoji}</span>
                                  ) : (
                                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                      <Sparkles className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm truncate">{chat.title}</span>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                      {formatRelativeTime(chat.updatedAt)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {project ? project.name : "Chat rapido"}
                                  </div>
                                </div>

                                {/* Menu de contexto */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0 bg-transparent"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Renomear
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Arquivar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}

                        {/* Botao Ver mais/menos */}
                        {recentConversations.length > VISIBLE_RECENTS && (
                          <div className="px-2 py-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground justify-start bg-transparent"
                              onClick={() => setShowAllRecents(!showAllRecents)}
                            >
                              {showAllRecents ? (
                                <>
                                  <ChevronRight className="h-3 w-3 mr-1.5 -rotate-90" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="h-3 w-3 mr-1.5 rotate-90" />
                                  Ver mais {recentConversations.length - VISIBLE_RECENTS} conversas
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )}
          </ScrollArea>
        </SidebarContent>

        {/* Footer vazio - Configurações e Ajuda movidos para topbar */}
        <SidebarFooter className="p-0" />
      </Sidebar>
    </TooltipProvider>
  );
}
