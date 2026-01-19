"use client";

import { Calendar, ChevronRight, Folder, User, X } from "lucide-react";
import { useState } from "react";
import { IntegrationSettings } from "@/components/integration-settings";
import { ProjectManager } from "@/components/project-manager";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  activeAgent: number;
  onAgentChange: (agent: number) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed,
  onCollapse,
  activeAgent,
  onAgentChange,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [activeView, setActiveView] = useState<"projects" | "calendar">("projects");

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          "bg-zinc-950 border-l border-zinc-800 flex flex-col transition-all duration-300 relative",
          "hidden md:flex",
          collapsed ? "w-0" : "w-96",
          "md:relative fixed right-0 top-0 h-full z-50",
          mobileOpen && "!flex w-[85vw] max-w-sm"
        )}
      >
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="absolute right-4 top-4 z-50 md:hidden text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Collapse Toggle - Desktop only */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="absolute -left-3 top-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-black w-6 h-6 rounded-sm md:flex items-center justify-center transition-all hidden"
        >
          <ChevronRight
            className={cn("w-4 h-4 transition-transform", !collapsed && "rotate-180")}
          />
        </button>

        {(mobileOpen || !collapsed) && (
          <div className="flex flex-col h-full">
            {/* Top Section: Project Management / Calendar */}
            <div className="border-b border-zinc-800 p-4 pt-16 md:pt-4">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                  <TabsTrigger
                    value="projects"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-xs md:text-sm"
                  >
                    <Folder className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Projects
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-xs md:text-sm"
                  >
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Schedule
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-4">
                {activeView === "projects" ? <ProjectManager /> : <CalendarView />}
              </div>
            </div>

            {/* Middle Section: Agent Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col border-b border-zinc-800">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                  AI Agents
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((agent) => (
                    <button
                      key={agent}
                      onClick={() => {
                        onAgentChange(agent);
                        onMobileClose?.();
                      }}
                      className={cn(
                        "w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-sm transition-all font-mono text-xs md:text-sm",
                        "border border-transparent hover:border-zinc-700",
                        activeAgent === agent
                          ? "bg-emerald-500 text-black font-bold"
                          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      AGENT_{agent.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Bottom Section: Settings & Account */}
            <div className="p-4 space-y-2">
              <IntegrationSettings />

              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 text-sm"
              >
                <User className="w-4 h-4 mr-2" />
                Account
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function CalendarView() {
  return (
    <div className="space-y-2">
      <div className="text-xs text-zinc-500 font-mono">SCHEDULED TASKS</div>
      <div className="space-y-2">
        {["Deploy Model v2", "Train Agent 3", "Data Sync"].map((task, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-3 rounded-sm">
            <div className="text-xs md:text-sm text-zinc-200">{task}</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              {new Date(Date.now() + i * 86400000).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
