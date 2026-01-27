"use client";

import { ChevronDown, ChevronRight, Loader2, Wrench, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_MERMAID,
  STREAMDOWN_PLUGINS,
  STREAMDOWN_REMEND,
  STREAMDOWN_SHIKI_THEMES,
} from "@/lib/streamdown-config";
import type { ToolCallState } from "@/lib/types/agui";

interface ToolCallCardProps {
  toolCall: ToolCallState;
}

function tryParseJson(value?: string) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDuration(startedAt: number, endedAt?: number, isRunning?: boolean) {
  if (!startedAt) return null;
  // Se não está rodando e não tem endedAt, não usar Date.now()
  // Evita timer "rodando" após conclusão
  if (!isRunning && !endedAt) return null;
  const end = endedAt ?? Date.now();
  const elapsed = Math.max(end - startedAt, 0);
  if (elapsed < 1000) {
    return `${elapsed}ms`;
  }
  return `${(elapsed / 1000).toFixed(1)}s`;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [open, setOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const [showFullResult, setShowFullResult] = useState(false);

  useEffect(() => {
    if (!userToggled) {
      setOpen(false);
    }
  }, [userToggled]);

  const argsJson = useMemo(() => tryParseJson(toolCall.args), [toolCall.args]);
  const resultJson = useMemo(() => tryParseJson(toolCall.result), [toolCall.result]);
  const isRunning = toolCall.status === "running";
  const duration = toolCall.startedAt
    ? formatDuration(toolCall.startedAt, toolCall.endedAt, isRunning)
    : null;
  const hasDetails = Boolean(toolCall.args || toolCall.result);

  const statusBadge =
    toolCall.status === "running"
      ? { label: "Executando", variant: "warning" as const }
      : toolCall.status === "failed"
        ? { label: "Falhou", variant: "destructive" as const }
        : { label: "Concluído", variant: "success" as const };

  return (
    <Collapsible
      id={`toolcall-${toolCall.toolCallId}`}
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-border bg-background"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{toolCall.toolCallName}</span>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        {toolCall.status === "running" && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
        {duration && <span className="ml-auto text-xs text-muted-foreground">{duration}</span>}
        {hasDetails && (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-1"
              onClick={() => setUserToggled(true)}
              title={open ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
      {hasDetails && (
        // Classe utilitária para animar abertura/fechamento do Collapsible.
        <CollapsibleContent className="collapsible-content">
          <div className="border-t border-border px-3 py-2 space-y-3">
            {toolCall.args && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Argumentos</div>
                <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto">
                  {argsJson ? JSON.stringify(argsJson, null, 2) : toolCall.args}
                </pre>
              </div>
            )}
            {toolCall.result && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Resultado</div>
                {resultJson ? (
                  <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto max-h-60">
                    {JSON.stringify(resultJson, null, 2)}
                  </pre>
                ) : (
                  (() => {
                    // Considera "grande" se > 1000 chars OU > 20 linhas
                    const lines = toolCall.result.split("\n");
                    const isTruncated = toolCall.result.length > 1000 || lines.length > 20;
                    const previewLines = lines.slice(0, 20).join("\n");
                    const previewText =
                      previewLines.length > 1000
                        ? `${previewLines.slice(0, 1000)}...`
                        : previewLines;
                    const shouldShowPreview = isTruncated && !showFullResult;

                    return (
                      <>
                        {shouldShowPreview ? (
                          <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto max-h-60 whitespace-pre-wrap">
                            {previewText}
                          </pre>
                        ) : (
                          <Streamdown
                            plugins={STREAMDOWN_PLUGINS}
                            controls={STREAMDOWN_CONTROLS}
                            remend={STREAMDOWN_REMEND}
                            shikiTheme={STREAMDOWN_SHIKI_THEMES}
                            mermaid={STREAMDOWN_MERMAID}
                            mode="static"
                          >
                            {toolCall.result}
                          </Streamdown>
                        )}
                        {isTruncated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            onClick={() => setShowFullResult(!showFullResult)}
                          >
                            {showFullResult ? "Ver menos" : "Ver completo"}
                          </Button>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            )}
            {toolCall.status === "failed" && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <XCircle className="h-3 w-3" />
                Falha ao executar ferramenta.
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
