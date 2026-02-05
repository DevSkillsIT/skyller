/**
 * ConversationHistoryList - Lista de conversas com dados reais
 * @spec SPEC-CHAT-HISTORY-INTEGRATION-001
 */
"use client";


import { Archive, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
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

  // FIX: Prefixo único para keys baseado no contexto (evita conflitos entre múltiplas listas)
  const keyPrefix = projectId ? `p-${projectId}` : workspaceId ? `w-${workspaceId}` : "global";

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
    <div className={`space-y-0.5 ${className || ""}`}>
      {visibleConversations.map((conversation) => {
        const isSelected = selectedId === conversation.id;
        const isEditing = editingId === conversation.id;

        return (
          <BlurFade key={`${keyPrefix}-${conversation.id}`} delay={0.05} inView>
            <div
              onClick={() => !isEditing && handleSelect(conversation)}
              className={`group relative flex cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 transition-colors ${
                isSelected ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              {/* Avatar circular com gradiente - igual referência */}
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">AI</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
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
                    {/* Título */}
                    <h4
                      className={`truncate text-sm leading-tight ${
                        isSelected ? "font-semibold" : "font-normal text-foreground/90"
                      }`}
                    >
                      {conversation.title || "Nova Conversa"}
                    </h4>
                    {/* Preview */}
                    <p className="text-xs text-muted-foreground/70 leading-tight truncate">
                      {conversation.message_count > 0
                        ? `${conversation.message_count} mensagens`
                        : "Conversa vazia"}
                    </p>
                    {/* Tempo */}
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatRelativeTime(conversation.created_at)}
                    </span>
                  </>
                )}
              </div>

              {/* Context menu no hover */}
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
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
            </div>
          </BlurFade>
        );
      })}

      {/* Botão "Ver mais" quando há conversas ocultas */}
      {showExpandButton && !expanded && visibleLimit && conversations.length > visibleLimit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
        >
          Ver mais ({conversations.length - visibleLimit})
        </Button>
      )}
    </div>
  );
}
