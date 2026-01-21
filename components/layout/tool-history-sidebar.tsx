"use client";

import {
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Presentation,
  Search as SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  type: "research" | "presentation" | "analysis";
}

interface ToolHistorySidebarProps {
  toolType: "research" | "presentation" | "analysis";
  isOpen: boolean;
  onToggle: () => void;
  onSelectItem?: (id: string) => void;
  onNewItem?: () => void;
}

const mockHistory: HistoryItem[] = [
  { id: "1", title: "Analise de Mercado Q4", timestamp: new Date(2025, 0, 19), type: "analysis" },
  {
    id: "2",
    title: "Estrategia de Marketing",
    timestamp: new Date(2025, 0, 18),
    type: "presentation",
  },
  { id: "3", title: "Competidores no Setor", timestamp: new Date(2025, 0, 17), type: "research" },
  { id: "4", title: "Relatorio Financeiro", timestamp: new Date(2025, 0, 16), type: "analysis" },
];

export function ToolHistorySidebar({
  toolType,
  isOpen,
  onToggle,
  onSelectItem,
  onNewItem,
}: ToolHistorySidebarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredHistory = mockHistory.filter((item) => item.type === toolType);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Hoje";
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays} dias atras`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getIcon = () => {
    switch (toolType) {
      case "research":
        return SearchIcon;
      case "presentation":
        return Presentation;
      case "analysis":
        return FileText;
    }
  };

  const Icon = getIcon();

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute left-2 top-2 h-8 w-8 z-10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="w-64 border-r border-border bg-muted/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Historico</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
      </div>

      {/* New Item Button */}
      {onNewItem && (
        <div className="p-2 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={onNewItem}
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
      )}

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                onSelectItem?.(item.id);
              }}
              className={cn(
                "w-full text-left p-2 rounded-md transition-colors hover:bg-muted",
                selectedId === item.id && "bg-muted"
              )}
            >
              <div className="font-medium text-sm truncate">{item.title}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                {formatDate(item.timestamp)}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
