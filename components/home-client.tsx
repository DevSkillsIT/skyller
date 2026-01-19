"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { AgentChat } from "@/components/agent-chat";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

/**
 * Componente cliente da pagina Home
 *
 * Contem toda a logica de estado e interatividade.
 * So e renderizado apos verificacao de sessao no servidor.
 */
export function HomeClient() {
  const [activeAgent, setActiveAgent] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="dark min-h-screen bg-black text-foreground flex">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-emerald-500 hover:bg-emerald-400 text-black"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <AgentChat agentId={activeAgent} />
      </main>

      {/* Right Sidebar - Desktop and Mobile */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        activeAgent={activeAgent}
        onAgentChange={setActiveAgent}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
    </div>
  );
}

export default HomeClient;
