"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  CheckSquare,
  Plus,
  Star,
  Trash2,
  MoreHorizontal,
  Edit3,
  Tag,
  FolderInput,
  Building2,
  Archive,
  Share2,
  Download,
  ChevronDown,
  Folder,
  ChevronsLeft // Added import
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getRecentConversations, mockProjects, mockWorkspaces } from "@/lib/mock/data"
import { formatRelativeTime } from "@/lib/utils"

interface ChatSidebarProps {
  workspaces: Array<{ id: string; name: string; emoji: string; color: string }>
  currentWorkspace: any
  onWorkspaceChange: (workspace: any) => void
  onNewConversation: () => void
  onConversationSelect: (id: string) => void
  onCollapse?: () => void
}

export function ChatSidebar({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  onNewConversation,
  onConversationSelect,
  onCollapse,
}: ChatSidebarProps) {

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [workspacesExpanded, setWorkspacesExpanded] = useState(false)
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>([])
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    localStorage.setItem("chatSidebarCollapsed", isCollapsed.toString())
  }, [isCollapsed])

  const allConversations = getRecentConversations(100)

  // Group by workspace
  const workspaceGroups = workspaces
    .map((workspace) => {
      const workspaceProjects = mockProjects.filter((p) => p.workspaceId === workspace.id)

      const projectGroups = workspaceProjects.map((project) => {
        const projectConvs = allConversations.filter((conv) => conv.projectId === project.id)
        return {
          project,
          conversations: projectConvs,
        }
      })

      return {
        workspace,
        projects: projectGroups.filter((pg) => pg.conversations.length > 0),
        totalCount: projectGroups.reduce((acc, pg) => acc + pg.conversations.length, 0),
      }
    })
    .filter((wg) => wg.totalCount > 0)

  // Recent conversations for bottom section
  const recentConversations = allConversations.slice(0, 10)

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) =>
      prev.includes(workspaceId) ? prev.filter((id) => id !== workspaceId) : [...prev, workspaceId]
    )
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const handleConversationClick = (convId: string) => {
    setSelectedConversation(convId)
    onConversationSelect(convId)
  }

  // Check if conversation belongs to workspace/project
  const getConversationContext = (conv: any) => {
    if (conv.projectId) {
      const project = mockProjects.find((p) => p.id === conv.projectId)
      const workspace = project ? mockWorkspaces.find((w) => w.id === project.workspaceId) : null
      return { workspace, project }
    }
    return { workspace: null, project: null }
  }

  if (isCollapsed) {
    return null
  }

  return (
    <div className="flex h-full w-[360px] flex-col border-r bg-slate-50 border-slate-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <Button onClick={onNewConversation} className="flex-1 h-9 border-0 shadow-none focus-visible:border-0 focus-visible:ring-0" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo chat
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCollapse?.()}
                className="h-10 w-10 flex-shrink-0 transition-all"
              >
                <ChevronsLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Recolher</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search */}
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-sm border-0 shadow-none focus-visible:border-0 focus-visible:ring-0 bg-white"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filtros</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Seleção múltipla</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-2">
          {/* 1. WORKSPACES SECTION (no topo, colapsável) */}
          <Collapsible open={workspacesExpanded} onOpenChange={setWorkspacesExpanded}>
            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors">
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  workspacesExpanded && "rotate-90"
                )}
              />
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold flex-1 text-left">Workspaces</span>
              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                {workspaceGroups.length}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Add workspace action
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Novo workspace</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-2 mt-1 space-y-0.5">
                {workspaceGroups.map((group) => (
                  <div key={group.workspace.id}>
                    <Collapsible
                      open={expandedWorkspaces.includes(group.workspace.id)}
                      onOpenChange={() => toggleWorkspace(group.workspace.id)}
                    >
                      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0",
                            expandedWorkspaces.includes(group.workspace.id) && "rotate-90"
                          )}
                        />
                        <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm flex-1 text-left truncate">
                          {group.workspace.name}
                        </span>
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px] flex-shrink-0">
                          {group.totalCount}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Add project action
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Novo projeto</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {/* Projects within workspace */}
                          {group.projects.map((projectGroup) => (
                            <div key={projectGroup.project.id}>
                              <Collapsible
                                open={expandedProjects.includes(projectGroup.project.id)}
                                onOpenChange={() => toggleProject(projectGroup.project.id)}
                              >
                                <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                                  <ChevronRight
                                    className={cn(
                                      "h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0",
                                      expandedProjects.includes(projectGroup.project.id) && "rotate-90"
                                    )}
                                  />
                                  <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm flex-1 text-left truncate">
                                    {projectGroup.project.name}
                                  </span>
                                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] flex-shrink-0">
                                    {projectGroup.conversations.length}
                                  </Badge>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            // Add conversation to project action
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Nova conversa</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <div className="ml-4 mt-0.5 space-y-0.5">
                                    {/* Conversations in project */}
                                    {projectGroup.conversations.map((conversation) => (
                                      <WorkspaceConversationItem
                                        key={conversation.id}
                                        conversation={conversation}
                                        isActive={selectedConversation === conversation.id}
                                        onClick={() => handleConversationClick(conversation.id)}
                                        workspaceName={group.workspace.name}
                                        workspaceColor={group.workspace.color}
                                        projectName={projectGroup.project.name}
                                      />
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}

                          {/* Direct conversations in workspace (no project) */}
                          {group.directConversations && group.directConversations.length > 0 && (
                            <div className="mt-2 space-y-0.5">
                              {group.directConversations.map((conversation) => (
                                <WorkspaceConversationItem
                                  key={conversation.id}
                                  conversation={conversation}
                                  isActive={selectedConversation === conversation.id}
                                  onClick={() => handleConversationClick(conversation.id)}
                                  workspaceName={group.workspace.name}
                                  workspaceColor={group.workspace.color}
                                  projectName=""
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 2. RECENT CONVERSATIONS (abaixo dos workspaces) */}
          <div className="space-y-0.5 pt-2">
            {recentConversations.map((conversation) => {
              const context = getConversationContext(conversation)

              if (context.workspace && context.project) {
                // Has workspace/project: show with tags
                return (
                  <RecentConversationWithTags
                    key={conversation.id}
                    conversation={conversation}
                    isActive={selectedConversation === conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    workspaceName={context.workspace.name}
                    workspaceColor={context.workspace.color}
                    projectName={context.project.name}
                  />
                )
              } else {
                // Standalone: show with preview
                return (
                  <StandaloneConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={selectedConversation === conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                  />
                )
              }
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// Conversation inside workspace/project (with tags)
interface WorkspaceConversationItemProps {
  conversation: any
  isActive: boolean
  onClick: () => void
  workspaceName: string
  workspaceColor: string
  projectName: string
}

function WorkspaceConversationItem({
  conversation,
  isActive,
  onClick,
  workspaceName,
  workspaceColor,
  projectName,
}: WorkspaceConversationItemProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1.5 rounded-md px-2 py-2 pr-24 transition-colors",
        isActive ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "truncate text-sm leading-tight",
            isActive ? "font-semibold" : "font-normal text-foreground/90"
          )}
        >
          {conversation.title}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground truncate leading-tight">
          {conversation.lastMessage || "Sem mensagens ainda"}
        </p>
      </div>

      {/* Hover Actions - Always reserve space */}
      <div className="absolute right-1.5 top-2 flex items-center gap-0.5">
        {isHovered ? (
          <div className="flex items-center gap-0.5 bg-background rounded-md shadow-sm border px-1 py-0.5">
            <ConversationActions isFavorite={isFavorite} onFavoriteToggle={() => setIsFavorite(!isFavorite)} />
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/70">
            {formatRelativeTime(conversation.updatedAt)}
          </span>
        )}
      </div>
    </div>
  )
}

// Recent conversation with tags
function RecentConversationWithTags({
  conversation,
  isActive,
  onClick,
  workspaceName,
  workspaceColor,
  projectName,
}: WorkspaceConversationItemProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 transition-colors",
        isActive ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">AI</span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h4
          className={cn(
            "truncate text-sm leading-tight",
            isActive ? "font-semibold" : "font-normal text-foreground/90"
          )}
        >
          {conversation.title}
        </h4>
        <div className="flex items-center gap-1">
          <Badge
            className="h-4 px-1.5 text-[9px] font-medium border-0"
            style={{
              backgroundColor: workspaceColor,
              color: "white",
            }}
          >
            {workspaceName}
          </Badge>
          <span className="text-[10px] text-muted-foreground/60">•</span>
          <span className="text-[10px] text-muted-foreground/70">
            {formatRelativeTime(conversation.updatedAt)}
          </span>
        </div>
      </div>

      {isHovered && (
        <div className="flex items-center gap-0.5">
          <ConversationActions isFavorite={isFavorite} onFavoriteToggle={() => setIsFavorite(!isFavorite)} />
        </div>
      )}
    </div>
  )
}

// Standalone conversation (with preview)
interface StandaloneConversationItemProps {
  conversation: any
  isActive: boolean
  onClick: () => void
}

function StandaloneConversationItem({ conversation, isActive, onClick }: StandaloneConversationItemProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 transition-colors",
        isActive ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">AI</span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h4
          className={cn(
            "truncate text-sm leading-tight",
            isActive ? "font-semibold" : "font-normal text-foreground/90"
          )}
        >
          {conversation.title}
        </h4>
        <p className="text-xs text-muted-foreground/70 leading-tight truncate">
          {conversation.preview || "É um manual que padroniza as regras..."}
        </p>
        <span className="text-[10px] text-muted-foreground/60">
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>

      {isHovered && (
        <div className="flex items-center gap-0.5">
          <ConversationActions isFavorite={isFavorite} onFavoriteToggle={() => setIsFavorite(!isFavorite)} />
        </div>
      )}
    </div>
  )
}

// Shared action buttons
function ConversationActions({
  isFavorite,
  onFavoriteToggle,
}: {
  isFavorite: boolean
  onFavoriteToggle: () => void
}) {
  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteToggle()
              }}
            >
              <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-500 text-yellow-500")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Favoritar</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-destructive hover:bg-destructive/10"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Deletar</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem>
            <Edit3 className="mr-2 h-4 w-4" />
            Editar Título
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Tag className="mr-2 h-4 w-4" />
            Adicionar Tags
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <FolderInput className="mr-2 h-4 w-4" />
            Mover para Projeto
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Building2 className="mr-2 h-4 w-4" />
            Mover para Workspace
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Archive className="mr-2 h-4 w-4" />
            Arquivar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
