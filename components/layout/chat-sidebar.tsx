"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Search,
  SlidersHorizontal,
  CheckSquare,
  Plus,
  Building2,
  Folder,
  ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConversationHistoryList } from "@/components/conversations";
import type { Workspace } from "@/lib/mock/data";
import { mockProjects } from "@/lib/mock/data";

interface ChatSidebarProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onNewConversation: () => void;
  onConversationSelect: (id: string) => void;
  onCollapse?: () => void;
  selectedConversationId?: string | null;
}

export function ChatSidebar({
  workspaces,
  currentWorkspace,
  onNewConversation,
  onConversationSelect,
  onCollapse,
  selectedConversationId,
}: ChatSidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [workspacesExpanded, setWorkspacesExpanded] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  // Agrupar projetos por workspace
  const workspaceGroups = workspaces
    .map((workspace) => {
      const workspaceProjects = mockProjects.filter(
        (p) => p.workspaceId === workspace.id
      );
      return {
        workspace,
        projects: workspaceProjects,
        totalCount: workspaceProjects.reduce((acc, p) => acc + p.chatsCount, 0),
      };
    })
    .filter((wg) => wg.totalCount > 0 || wg.projects.length > 0);

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) =>
      prev.includes(workspaceId)
        ? prev.filter((id) => id !== workspaceId)
        : [...prev, workspaceId]
    );
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleNewChat = () => {
    onNewConversation();
    router.push("/");
  };

  return (
    <div data-chat-sidebar className="flex h-full w-[320px] flex-col border-r bg-slate-50 border-slate-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <Button
          onClick={handleNewChat}
          className="flex-1 h-9 border-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
          size="sm"
        >
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filtros</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Selecao multipla</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-2">
          {/* WORKSPACES SECTION (colapsavel) */}
          <Collapsible
            open={workspacesExpanded}
            onOpenChange={setWorkspacesExpanded}
          >
            <div className="group flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors">
              <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    workspacesExpanded && "rotate-90"
                  )}
                />
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold flex-1 text-left">
                  Workspaces
                </span>
                <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                  {workspaceGroups.length}
                </Badge>
              </CollapsibleTrigger>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add workspace action
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Novo workspace</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <CollapsibleContent>
              <div className="ml-2 mt-1 space-y-0.5">
                {workspaceGroups.map((group) => (
                  <div key={group.workspace.id}>
                    <Collapsible
                      open={expandedWorkspaces.includes(group.workspace.id)}
                      onOpenChange={() => toggleWorkspace(group.workspace.id)}
                    >
                      <div className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0",
                              expandedWorkspaces.includes(group.workspace.id) &&
                                "rotate-90"
                            )}
                          />
                          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm flex-1 text-left truncate">
                            {group.workspace.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[9px] flex-shrink-0"
                          >
                            {group.projects.length}
                          </Badge>
                        </CollapsibleTrigger>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Add project action
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Novo projeto</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <CollapsibleContent>
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {/* Projects within workspace */}
                          {group.projects.map((project) => (
                            <div key={project.id}>
                              <Collapsible
                                open={expandedProjects.includes(project.id)}
                                onOpenChange={() => toggleProject(project.id)}
                              >
                                <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
                                  <ChevronRight
                                    className={cn(
                                      "h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0",
                                      expandedProjects.includes(project.id) &&
                                        "rotate-90"
                                    )}
                                  />
                                  <span className="text-sm flex-shrink-0">
                                    {project.emoji}
                                  </span>
                                  <span className="text-sm flex-1 text-left truncate">
                                    {project.name}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="h-4 px-1.5 text-[9px] flex-shrink-0"
                                  >
                                    {project.chatsCount}
                                  </Badge>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <div className="ml-4 mt-0.5">
                                    {/* Conversas do projeto - dados reais */}
                                    <ConversationHistoryList
                                      limit={10}
                                      compact={true}
                                      projectId={project.id}
                                      onSelect={onConversationSelect}
                                      selectedId={selectedConversationId}
                                      onNewConversation={onNewConversation}
                                    />
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* CONVERSAS RECENTES (historico real) */}
          <div className="pt-2">
            <ConversationHistoryList
              limit={50}
              visibleLimit={15}
              showExpandButton={true}
              compact={true}
              onSelect={onConversationSelect}
              onNewConversation={onNewConversation}
              selectedId={selectedConversationId}
              workspaceId={currentWorkspace?.id}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
