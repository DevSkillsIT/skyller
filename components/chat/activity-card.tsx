"use client";

import { useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import type { ActivityState } from "@/lib/types/agui";
import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_MERMAID,
  STREAMDOWN_PLUGINS,
  STREAMDOWN_REMEND,
  STREAMDOWN_SHIKI_THEMES,
} from "@/lib/streamdown-config";

interface ActivityCardProps {
  activity: ActivityState;
}

function tryParseJson(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const [open, setOpen] = useState(true);

  const contentJson = useMemo(() => {
    if (typeof activity.content === "string") {
      return tryParseJson(activity.content);
    }
    return null;
  }, [activity.content]);

  const badgeVariant: "success" | "destructive" | "secondary" = activity.status === "completed"
    ? "success"
    : activity.status === "failed"
      ? "destructive"
      : "secondary";

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{activity.activityType}</span>
        {activity.status && <Badge variant={badgeVariant}>{activity.status}</Badge>}
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      {/* Classe utilitária para animar abertura/fechamento do Collapsible */}
      <CollapsibleContent className="collapsible-content">
        <div className="border-t border-border px-3 py-2">
          {typeof activity.content === "string" ? (
            contentJson ? (
              <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto">
                {JSON.stringify(contentJson, null, 2)}
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
                {activity.content}
              </Streamdown>
            )
          ) : (
            <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto">
              {JSON.stringify(activity.content, null, 2)}
            </pre>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
