"use client";

import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MessageSquare,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ConversationHistoryList } from "@/components/conversations";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Project, Workspace } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

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
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Filtra projetos do workspace atual
  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === currentWorkspace?.id),
    [projects, currentWorkspace]
  );

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="p-2">
          {/* Header com Toggle e Ações */}
          <div className="flex items-center justify-between mb-2">
            {open && <SidebarTrigger className="h-7 w-7" />}
          </div>

          {/* Botões: Nova Conversa + Busca */}
          {open && (
            <div className="flex flex-col gap-1.5">
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => {
                  onNewConversation?.();
                  setSelectedConversation(null);
                  router.push("/");
                }}
              >
                <Plus className="h-4 w-4" />
                New chat
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2 justify-start text-muted-foreground bg-transparent"
                size="sm"
                onClick={() => onSearchOpen?.()}
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search chats</span>
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
                      router.push("/");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New chat</TooltipContent>
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
                <TooltipContent side="right">Search</TooltipContent>
              </Tooltip>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="flex-1">
            {/* Workspace Selector */}
            {open && (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>Workspace</span>
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
                            <span className="text-muted-foreground">Select workspace...</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                        Switch Workspace
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {currentWorkspace && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              onWorkspaceChange(null);
                              onProjectChange(null);
                            }}
                            className="text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-2" />
                            None
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Navegação do Workspace */}
            {open && currentWorkspace && (
              <SidebarGroup className="py-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/workspaces/${currentWorkspace.id}`}
                      >
                        <Link href={`/workspaces/${currentWorkspace.id}`}>
                          <Building2 className="h-4 w-4" />
                          <span>Overview</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/projects" || pathname.startsWith("/projects/")}
                      >
                        <Link href={`/projects?workspace=${currentWorkspace.id}`}>
                          <FolderOpen className="h-4 w-4" />
                          <span>Projects</span>
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

            {/* Folders / Conversations */}
            {open && (
              <Collapsible open={foldersExpanded} onOpenChange={setFoldersExpanded}>
                <SidebarGroup className="py-1">
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md flex items-center justify-between pr-2 mb-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Chats</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-all text-muted-foreground",
                          foldersExpanded && "rotate-90"
                        )}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <ConversationHistoryList
                        limit={50}
                        visibleLimit={10}
                        showExpandButton={true}
                        compact={true}
                        onSelect={(id) => {
                          setSelectedConversation(id);
                          onConversationSelect?.(id);
                        }}
                        onNewConversation={() => {
                          onNewConversation?.();
                          setSelectedConversation(null);
                          router.push("/");
                        }}
                        selectedId={selectedConversation}
                        workspaceId={currentWorkspace?.id}
                        projectId={currentProject?.id}
                      />
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-0" />
      </Sidebar>
    </TooltipProvider>
  );
}
