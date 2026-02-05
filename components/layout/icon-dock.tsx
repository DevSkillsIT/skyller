"use client";

import {
  Bot,
  Building2,
  FileSearch,
  FileText,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Presentation,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Chats", href: "/", icon: MessageSquare },
  { name: "Workspaces", href: "/workspaces", icon: Building2 },
  { name: "Agentes", href: "/agents", icon: Bot },
  { name: "Docs", href: "/knowledge", icon: FileText },
  { name: "Kanban", href: "/kanban", icon: FolderKanban },
  { name: "Canvas", href: "/canvas", icon: LayoutGrid },
  { name: "Análise", href: "/analysis", icon: FileSearch },
  { name: "Slides", href: "/presentations", icon: Presentation },
  { name: "Pesquisa", href: "/research", icon: Search },
];

interface IconDockProps {
  className?: string;
}

export function IconDock({ className }: IconDockProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/chat");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        className={cn(
          "flex h-full flex-col items-center gap-2 border-r py-4 px-2 bg-slate-50 border-slate-300",
          className
        )}
      >
        {/* Logo/Brand */}
        <div className="mb-4 flex items-center justify-center">
          <Link href="/" className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              S
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-blue-600 hover:text-white",
                      active ? "bg-blue-600 text-white" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] leading-none">{item.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Actions - Settings */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-blue-600 hover:text-white",
                  pathname === "/settings" ? "bg-blue-600 text-white" : "text-muted-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="text-[10px] leading-none">Config</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Config</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
}
