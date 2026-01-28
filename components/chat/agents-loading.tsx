"use client";

import { Bot, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AgentsLoading() {
  return (
    <div className="flex items-center gap-2 p-2">
      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Carregando agentes...</span>
    </div>
  );
}

export function AgentSelectorSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3 w-16 rounded" />
      <Skeleton className="h-1.5 w-1.5 rounded-full" />
      <Skeleton className="h-3 w-3 rounded" />
    </div>
  );
}

export function WelcomeMessageSkeleton() {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-3 animate-pulse">
        <Bot className="w-7 h-7 text-muted-foreground" />
      </div>
      <Skeleton className="h-6 w-48 mx-auto mb-2 rounded" />
      <Skeleton className="h-4 w-64 mx-auto mb-6 rounded" />

      {/* Conversation Suggestions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted animate-pulse"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
