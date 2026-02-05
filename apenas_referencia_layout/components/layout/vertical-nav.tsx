"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  FolderKanban,
  LayoutGrid,
  FileText,
  FileSearch,
  Bot,
  Presentation,
  Search,
  Settings,
  Users,
  FolderOpen,
  Building2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { name: "Chats", href: "/", icon: MessageSquare },
  { name: "Workspaces", href: "/workspaces", icon: Building2 },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
  { name: "Agentes", href: "/agents", icon: Bot },
  { name: "Documentos", href: "/knowledge", icon: FileText },
  { name: "Kanban", href: "/kanban", icon: FolderKanban },
  { name: "Canvas", href: "/canvas", icon: LayoutGrid },
  { name: "Analise", href: "/analysis", icon: FileSearch },
  { name: "Apresentacoes", href: "/presentations", icon: Presentation },
  { name: "Pesquisa", href: "/research", icon: Search },
]

interface VerticalNavProps {
  showLabels?: boolean
  showExpandButton?: boolean
  onExpandSidebar?: () => void
}

export function VerticalNav({ showLabels = true, showExpandButton = false, onExpandSidebar }: VerticalNavProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex h-full flex-col items-center gap-2 border-r py-4 px-2 bg-slate-50 border-slate-300">
        {/* Logo/Brand */}
        <div className="mb-4 flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              S
            </div>
          </Link>
          {showExpandButton && onExpandSidebar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExpandSidebar}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir conversas</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return showLabels ? (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-blue-600 hover:text-white",
                  isActive ? "bg-blue-600 text-white" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] leading-none">{item.name}</span>
              </Link>
            ) : (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-blue-600 hover:text-white",
                      isActive ? "bg-blue-600 text-white" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-accent",
                  pathname === "/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  )
}
