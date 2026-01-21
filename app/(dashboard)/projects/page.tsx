"use client";

import {
  Archive,
  ArrowLeft,
  Clock,
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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CreateProjectDialog } from "@/components/dialogs/create-project-dialog";
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
import { mockProjects, mockWorkspaces } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

function Loading() {
  return null;
}

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get("workspace");

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const workspace = mockWorkspaces.find((w) => w.id === workspaceId);

  const workspaceProjects = useMemo(() => {
    return mockProjects.filter((p) => p.workspaceId === workspaceId);
  }, [workspaceId]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return workspaceProjects;
    return workspaceProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workspaceProjects, searchQuery]);

  const handleCreateProject = (name: string, description: string) => {
    // Mock: create project and redirect to project page
    const newProjectId = `p${Date.now()}`;
    console.log("[v0] Creating project:", { name, description, workspaceId });
    setIsCreateDialogOpen(false);
    // Redirect to the new project page
    router.push(`/projects/${newProjectId}`);
  };

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Workspace nao encontrado</h2>
        <p className="text-muted-foreground mb-4">
          Selecione um workspace na sidebar para ver seus projetos.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Voltar ao inicio</Link>
        </Button>
      </div>
    );
  }

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
              <span className="text-2xl">{workspace.icon}</span>
              <div>
                <h1 className="text-lg font-semibold">{workspace.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {workspaceProjects.length} projeto{workspaceProjects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium mb-1">Nenhum projeto encontrado</h3>
                  <p className="text-sm text-muted-foreground">Tente buscar com outros termos</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-1">Nenhum projeto ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro projeto neste workspace
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Projeto
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProject={handleCreateProject}
        workspaceName={workspace.name}
      />
    </div>
  );
}

interface ProjectCardProps {
  project: (typeof mockProjects)[0];
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
              {project.emoji}
            </div>
            <div>
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
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
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{project.chatsCount} conversas</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{project.docsCount} arquivos</span>
          </div>
        </div>

        {project.customInstructions && (
          <Badge variant="secondary" className="mt-3 text-[10px]">
            Instrucoes personalizadas
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export { Loading };
