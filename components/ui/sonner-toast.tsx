"use client";

import { X } from "lucide-react";
import * as React from "react";
import * as Sonner from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ToasterProps = React.ComponentProps<typeof Sonner.Toaster>;

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner.Toaster
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toast]:border-green-500/20 group-[.toast]:bg-green-50 dark:group-[.toast]:bg-green-950/20",
          error:
            "group-[.toast]:border-red-500/20 group-[.toast]:bg-red-50 dark:group-[.toast]:bg-red-950/20",
          warning:
            "group-[.toast]:border-yellow-500/20 group-[.toast]:bg-yellow-50 dark:group-[.toast]:bg-yellow-950/20",
          info: "group-[.toast]:border-blue-500/20 group-[.toast]:bg-blue-50 dark:group-[.toast]:bg-blue-950/20",
        },
      }}
      {...props}
    />
  );
};

// Toast customizado com botão de fechar
export const CustomToast = ({
  title,
  description,
  action,
  onDismiss,
  ...props
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border"
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <div className="text-sm font-semibold leading-none tracking-tight">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      {action}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 rounded-md p-0 text-foreground/50 opacity-0 transition-opacity hover:text-foreground group-[.toast]:opacity-100"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      )}
    </div>
  );
};

export { Toaster };
