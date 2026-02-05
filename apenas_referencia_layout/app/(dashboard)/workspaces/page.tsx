"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Building2, FolderOpen, MessageSquare, MoreHorizontal, Star, Archive, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockWorkspaces, mockProjects, mockConversations } from "@/lib/mock/data"

export default function WorkspacesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery) return mockWorkspaces
    return mockWorkspaces.filter(w => 
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-semibold">Workspaces</h1>
              <p className="text-xs text-muted-foreground">
                {mockWorkspaces.length} workspace{mockWorkspaces.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button className="gap-2">
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
              <h3 className="text-lg font-medium mb-1">Nenhum workspace encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente buscar com outros termos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces.map((workspace) => (
                <WorkspaceCard 
                  key={workspace.id} 
                  workspace={workspace}
                  onClick={() => router.push(`/projects?workspace=${workspace.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface WorkspaceCardProps {
  workspace: typeof mockWorkspaces[0]
  onClick: () => void
}

function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  const workspaceProjects = mockProjects.filter(p => p.workspaceId === workspace.id)
  const workspaceConversations = mockConversations.filter(c => c.workspaceId === workspace.id)
  
  return (
    <Card 
      className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ backgroundColor: workspace.color }}
            >
              {workspace.icon}
            </div>
            <div>
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                {workspace.name}
              </h3>
            </div>
          </div>
          <DropdownMenu modal={false}>
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
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
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
            <span>{workspaceProjects.length} projetos</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{workspaceConversations.length} conversas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
