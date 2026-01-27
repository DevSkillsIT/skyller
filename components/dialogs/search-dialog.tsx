"use client";

import { Bot, FileText, FolderKanban, MessageSquare, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "chat" | "document" | "agent" | "project";
  title: string;
  subtitle?: string;
  timestamp?: Date;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "chat",
    title: "Análise Q4 2025",
    subtitle: "Skyller MVP",
    timestamp: new Date(),
  },
  { id: "2", type: "chat", title: "Código auth", subtitle: "Skyller MVP", timestamp: new Date() },
  { id: "3", type: "document", title: "Relatório de Vendas Q4 2025", subtitle: "12 páginas" },
  { id: "4", type: "document", title: "Contrato de Prestação de Serviços", subtitle: "8 páginas" },
  { id: "5", type: "agent", title: "Analista de Dados", subtitle: "856 tarefas completadas" },
  { id: "6", type: "project", title: "Skyller MVP", subtitle: "15 conversas, 12 documentos" },
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectResult?: (result: SearchResult) => void;
}

export function SearchDialog({ open, onOpenChange, onSelectResult }: SearchDialogProps) {
  const [query, setQuery] = useState("");

  const filteredResults =
    query.length > 0
      ? mockResults.filter(
          (r) =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.subtitle?.toLowerCase().includes(query.toLowerCase())
        )
      : mockResults;

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "chat":
        return MessageSquare;
      case "document":
        return FileText;
      case "agent":
        return Bot;
      case "project":
        return FolderKanban;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "chat":
        return "Conversa";
      case "document":
        return "Documento";
      case "agent":
        return "Agente";
      case "project":
        return "Projeto";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar conversas, documentos, agentes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-4"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {filteredResults.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum resultado encontrado</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((result) => {
                  const Icon = getIcon(result.type);
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        onSelectResult?.(result);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                        "hover:bg-muted transition-colors"
                      )}
                    >
                      <div className="p-2 rounded-md bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase shrink-0">
                        {getTypeLabel(result.type)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
          <span>{filteredResults.length} resultados</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">↑↓</kbd>
            <span>navegar</span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">↵</kbd>
            <span>selecionar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
