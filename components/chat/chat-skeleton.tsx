"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-muted">
          <Skeleton className="h-4 w-4 rounded" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-16 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function ChatInputSkeleton() {
  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="border border-border rounded-3xl bg-background p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <ChatMessageSkeleton key={i} />
        ))}
      </div>
      <ChatInputSkeleton />
    </div>
  );
}
