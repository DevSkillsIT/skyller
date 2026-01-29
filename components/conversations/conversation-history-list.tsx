/**
 * ConversationHistoryList - Lista de conversas com dados reais
 * @spec SPEC-CHAT-HISTORY-INTEGRATION-001
 */
"use client";

import { Archive, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { type ConversationSummary, useConversations } from "@/lib/hooks/use-conversations";

interface ConversationHistoryListProps {
  limit?: number;
  /** GAP-IMP-06: Mostrar apenas N conversas inicialmente */
  visibleLimit?: number;
  /** GAP-IMP-06: Exibir botão "Ver mais" quando há mais conversas */
  showExpandButton?: boolean;
  onSelect?: (conversationId: string) => void;
  onNewConversation?: () => void;
  selectedId?: string | null;
  className?: string;
  /** GAP-IMP-07: Layout compacto para sidebar */
  compact?: boolean;
  /** GAP-IMP-05: ID do workspace para filtrar conversas */
  workspaceId?: string;
  /** GAP-IMP-05: ID do projeto para filtrar conversas */
  projectId?: string;
}

export function ConversationHistoryList({
  limit = 50, // BUG-IMP-01: Corrigido de 15 para 50 conforme SPEC
  visibleLimit, // GAP-IMP-06: Mostrar apenas N conversas inicialmente
  showExpandButton = false, // GAP-IMP-06: Exibir botão "Ver mais"
  onSelect,
  onNewConversation,
  selectedId,
  className,
  compact = false, // GAP-IMP-07: Layout compacto para sidebar
  workspaceId, // GAP-IMP-05: Filtro de workspace
  projectId, // GAP-IMP-05: Filtro de projeto
}: ConversationHistoryListProps) {
  const router = useRouter();
  // GAP-IMP-05: Passar filtros de workspace/project para o hook
  const { conversations, isLoading, error, rename, remove, refresh } = useConversations({
    limit,
    workspaceId,
    projectId,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [expanded, setExpanded] = useState(false); // GAP-IMP-06: Estado de expansão

  // GAP-IMP-06: Calcular conversas visíveis baseado em visibleLimit e estado de expansão
  const visibleConversations =
    expanded || !visibleLimit ? conversations : conversations.slice(0, visibleLimit);

  // Formata tempo relativo
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
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

  const handleSelect = (conversation: ConversationSummary) => {
    onSelect?.(conversation.id);
    router.push(`/chat/${conversation.id}`);
  };

  const handleRename = async (id: string) => {
    if (editTitle.trim()) {
      await rename(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    if (selectedId === id) {
      onNewConversation?.();
    }
  };

  const startEdit = (conversation: ConversationSummary) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || "");
  };

  // Loading state
  if (isLoading) {
    return (
      <SidebarMenu className={className}>
        {[...Array(3)].map((_, i) => (
          <SidebarMenuItem key={`skeleton-${i}`}>
            <div className="flex items-center gap-2 p-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Erro ao carregar conversas.{" "}
        <Button variant="link" size="sm" onClick={refresh} className="p-0 h-auto">
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Nenhuma conversa ainda. Inicie uma nova!
      </div>
    );
  }

  return (
    <SidebarMenu className={className}>
      {visibleConversations.map((conversation) => {
        const isSelected = selectedId === conversation.id;
        const isEditing = editingId === conversation.id;

        return (
          <SidebarMenuItem key={conversation.id}>
            <SidebarMenuButton
              onClick={() => !isEditing && handleSelect(conversation)}
              isActive={isSelected}
              className={`group h-auto ${compact ? "py-1" : "py-1.5"}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(conversation.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(conversation.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditTitle("");
                      }
                    }}
                    autoFocus
                    className="h-6 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">
                        {conversation.title || "Nova Conversa"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatRelativeTime(conversation.created_at)}
                      </span>
                    </div>
                    {/* GAP-IMP-07: Ocultar contador em modo compacto */}
                    {!compact && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {conversation.message_count} mensagens
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Context menu */}
              {!isEditing && (
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
                    <DropdownMenuItem onClick={() => startEdit(conversation)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(conversation.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}

      {/* GAP-IMP-06: Botão "Ver mais" quando há conversas ocultas */}
      {showExpandButton && !expanded && visibleLimit && conversations.length > visibleLimit && (
        <SidebarMenuItem>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
          >
            Ver mais ({conversations.length - visibleLimit})
          </Button>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
