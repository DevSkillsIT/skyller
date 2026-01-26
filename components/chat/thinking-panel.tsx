"use client";

import { useEffect, useState } from "react";
import { Brain, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import type { ThinkingState } from "@/lib/types/agui";
import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_MERMAID,
  STREAMDOWN_PLUGINS,
  STREAMDOWN_REMEND,
  STREAMDOWN_SHIKI_THEMES,
} from "@/lib/streamdown-config";

interface ThinkingPanelProps {
  thinking: ThinkingState;
  isStreaming?: boolean;
}

export function ThinkingPanel({ thinking, isStreaming = false }: ThinkingPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (thinking.status !== "active") {
      setOpen(false);
    }
  }, [thinking.status]);

  const hasContent = Boolean(thinking.content.trim());
  if (!hasContent && thinking.status !== "active") {
    return null;
  }

  const title = thinking.title || "Pensando";

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{title}</span>
          {thinking.status === "active" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processando
            </span>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      {/* Classe utilitária para animar abertura/fechamento do Collapsible */}
      <CollapsibleContent className="collapsible-content">
        <div className="border-t border-border px-3 py-2">
          {hasContent ? (
            <Streamdown
              plugins={STREAMDOWN_PLUGINS}
              controls={STREAMDOWN_CONTROLS}
              remend={STREAMDOWN_REMEND}
              shikiTheme={STREAMDOWN_SHIKI_THEMES}
              mermaid={STREAMDOWN_MERMAID}
              mode={thinking.status === "active" || isStreaming ? "streaming" : "static"}
              parseIncompleteMarkdown
              isAnimating={thinking.status === "active" || isStreaming}
            >
              {thinking.content}
            </Streamdown>
          ) : (
            <div className="text-xs text-muted-foreground italic">Pensando...</div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
