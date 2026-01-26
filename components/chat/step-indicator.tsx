"use client";

import { CheckCircle2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { StepState } from "@/lib/types/agui";

interface StepIndicatorProps {
  steps: StepState[];
}

const STEP_LABELS: Record<string, string> = {
  reasoning: "Analisando",
  processing: "Processando",
  searching: "Pesquisando",
  tool_execution: "Executando ferramenta",
  planning: "Planejando",
};

function formatStepName(stepName: string) {
  if (stepName.startsWith("tool:")) {
    const [, rawToolName] = stepName.split(":");
    const label = rawToolName ? rawToolName.replace(/[_-]+/g, " ") : "ferramenta";
    return `Ferramenta: ${label.replace(/\b\w/g, (char) => char.toUpperCase())}`;
  }
  if (STEP_LABELS[stepName]) {
    return STEP_LABELS[stepName];
  }
  return stepName.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDuration(startedAt: number, endedAt?: number) {
  const end = endedAt ?? Date.now();
  const elapsed = Math.max(end - startedAt, 0);
  if (elapsed < 1000) {
    return `${elapsed}ms`;
  }
  return `${(elapsed / 1000).toFixed(1)}s`;
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const hasRunningStep = useMemo(() => steps.some((step) => step.status === "running"), [steps]);
  const allStepsComplete = useMemo(
    () => steps.length > 0 && steps.every((step) => step.status === "completed"),
    [steps]
  );

  useEffect(() => {
    if (hasRunningStep) {
      setOpen(true);
    } else if (allStepsComplete && !userToggled) {
      // Auto-collapse após 2s quando todos steps terminarem (só se usuário não abriu manualmente)
      const timer = setTimeout(() => setOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasRunningStep, allStepsComplete, userToggled]);

  const handleToggle = (newOpen: boolean) => {
    setOpen(newOpen);
    setUserToggled(true);
  };

  if (!steps.length) {
    return null;
  }

  const handleStepClick = (stepName: string) => {
    if (!stepName.startsWith("tool:")) return;
    const parts = stepName.split(":");
    const toolCallId = parts.length >= 3 ? parts[2] : null;
    if (!toolCallId) return;
    const target = document.getElementById(`toolcall-${toolCallId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleToggle}
      className="rounded-lg border border-border bg-muted/30 px-3 py-2"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">Etapas</div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="collapsible-content">
        <div className="flex flex-wrap gap-2 pt-2">
          {steps.map((step) => {
            const isRunning = step.status === "running";
            const isToolStep = step.stepName.startsWith("tool:");
            const StepTag = isToolStep ? "button" : "div";
            return (
              <StepTag
                key={step.stepName}
                {...(isToolStep
                  ? {
                      type: "button",
                      onClick: () => handleStepClick(step.stepName),
                    }
                  : {})}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-foreground ${
                  isToolStep
                    ? "border-border bg-background hover:bg-muted cursor-pointer"
                    : "border-border bg-background"
                }`}
                title={isToolStep ? "Clique para ver a ferramenta" : undefined}
              >
                {isRunning ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
                <span className="font-medium">{formatStepName(step.stepName)}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDuration(step.startedAt, step.endedAt)}
                </span>
              </StepTag>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
