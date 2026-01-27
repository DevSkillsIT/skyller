"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import {
  Archive,
  ArrowLeft,
  Building2,
  FileText,
  FolderOpen,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CreateWorkspaceDialog } from "@/components/dialogs/create-workspace-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockWorkspaces } from "@/lib/mock/data";

export default function WorkspacesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery) return mockWorkspaces;
    return mockWorkspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleCreateWorkspace = (name: string, description: string) => {
    // Mock: create workspace and redirect to workspace page
    const newWorkspaceId = `ws${Date.now()}`;
    console.log("[v0] Creating workspace:", { name, description });
    setIsCreateDialogOpen(false);
    // Redirect to the new workspace page
    router.push(`/workspaces/${newWorkspaceId}`);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Voltar</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-muted-foreground" />
              <div>
                <h1 className="text-lg font-semibold">Workspaces</h1>
                <p className="text-xs text-muted-foreground">
                  {mockWorkspaces.length} workspace{mockWorkspaces.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Workspace
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Workspaces Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredWorkspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium mb-1">Nenhum workspace encontrado</h3>
                  <p className="text-sm text-muted-foreground">Tente buscar com outros termos</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-1">Nenhum workspace ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro workspace para organizar seus projetos
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Workspace
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onClick={() => router.push(`/workspaces/${workspace.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
}

interface WorkspaceCardProps {
  workspace: (typeof mockWorkspaces)[0];
  onClick: () => void;
}

function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
              {workspace.icon}
            </div>
            <div>
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                {workspace.name}
              </h3>
              {workspace.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Star className="h-4 w-4 mr-2" />
                Favoritar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Pencil className="h-4 w-4 mr-2" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FolderOpen className="h-3.5 w-3.5" />
            <span>{workspace.projectsCount} projetos</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{workspace.chatsCount} conversas</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{workspace.docsCount} arquivos</span>
          </div>
        </div>

        {workspace.customInstructions && (
          <Badge variant="secondary" className="mt-3 text-[10px]">
            Instrucoes personalizadas
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
