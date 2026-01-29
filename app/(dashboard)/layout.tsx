"use client";

import { PanelLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SearchDialog } from "@/components/dialogs/search-dialog";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ArtifactPanel } from "@/components/layout/artifact-panel";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CopilotProvider } from "@/components/providers/copilot-provider";
import { Button } from "@/components/ui/button";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";
import { PanelProvider, usePanel } from "@/lib/contexts/panel-context";
import { mockProjects, mockWorkspaces } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

function DashboardInner({ children }: { children: React.ReactNode }) {
  // All hooks MUST be called unconditionally at the top
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [currentWorkspace, setCurrentWorkspace] = useState<(typeof mockWorkspaces)[0] | null>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("currentWorkspaceId");
        if (saved) {
          return mockWorkspaces.find((w) => w.id === saved) || null;
        }
      }
      return null;
    }
  );
  const [currentProject, setCurrentProject] = useState<(typeof mockProjects)[0] | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { loadConversation, startNewConversation } = useChat();
  const { isPanelOpen, panelContent, isPanelExpanded, setPanelContent, setIsPanelOpen } =
    usePanel();
  const { open, toggleSidebar } = useSidebar();

  // GAP-IMP-04: Wrapper para "Nova Conversa" que limpa o chat e navega para /
  const handleNewConversation = useCallback(() => {
    startNewConversation();
    router.push("/");
  }, [startNewConversation, router]);

  // Persist workspace to localStorage
  const handleWorkspaceChange = useCallback((workspace: (typeof mockWorkspaces)[0] | null) => {
    setCurrentWorkspace(workspace);
    if (typeof window !== "undefined") {
      if (workspace) {
        localStorage.setItem("currentWorkspaceId", workspace.id);
      } else {
        localStorage.removeItem("currentWorkspaceId");
      }
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/login");
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  const isChatRoute = pathname === "/" || pathname === "/suporte" || pathname.startsWith("/chat/");

  return (
    <div className="flex h-screen w-full bg-background pb-16 md:pb-0">
      {/* Sidebar - 240px expandido, 64px colapsado */}
      <Suspense fallback={<div>Loading Sidebar...</div>}>
        <AppSidebar
          workspaces={mockWorkspaces}
          currentWorkspace={currentWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
          projects={mockProjects}
          currentProject={currentProject}
          onProjectChange={setCurrentProject}
          onConversationSelect={loadConversation}
          onNewConversation={handleNewConversation}
          onSearchOpen={() => setIsSearchOpen(true)}
        />
      </Suspense>

      {/* Logo Skyller quando sidebar colapsada + botão expand no hover */}
      {!open && (
        <div className="group fixed left-2 top-3 z-50">
          {/* Logo Skyller */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-primary text-white font-bold text-sm shadow-md group-hover:opacity-0 transition-opacity">
            S
          </div>
          {/* Botão expand aparece no hover */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="absolute inset-0 h-9 w-9 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
            title="Abrir barra lateral"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Clean, minimal */}
        <AppHeader
          onOpenPanel={(content) => {
            setPanelContent(content);
            setIsPanelOpen(true);
          }}
        />

        {/* Main Area + Artifact Split View */}
        <div className="flex flex-1 overflow-hidden">
          {/* IMPORTANTE: no chat principal, o scroll deve ficar somente no
              container do StickToBottom para garantir auto-scroll correto. */}
          <main className={cn("flex-1 min-h-0", isChatRoute ? "overflow-hidden" : "overflow-auto")}>
            {children}
          </main>

          {/* Artifact Panel - Inline like ChatGPT/Claude */}
          {isPanelOpen && (
            <div
              className={`${isPanelExpanded ? "w-[70%]" : "w-[50%]"} border-l border-border flex-shrink-0 transition-all duration-300`}
            >
              <ArtifactPanel content={panelContent} onClose={() => setIsPanelOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={<div>Loading Mobile Nav...</div>}>
        <MobileNav />
      </Suspense>

      {/* Search Dialog */}
      <Suspense fallback={<div>Loading Search Dialog...</div>}>
        <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </Suspense>
    </div>
  );
}

/**
 * DashboardLayout - Layout principal do dashboard
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-001: CopilotProvider Configurado
 *
 * Providers na ordem correta:
 * 1. CopilotProvider - CopilotKit para integracao com agentes
 * 2. ChatProvider - Gerenciamento de estado do chat
 * 3. PanelProvider - Gerenciamento de paineis laterais
 * 4. SidebarProvider - Controle da sidebar
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CopilotProvider>
      <ChatProvider>
        <PanelProvider>
          <SidebarProvider defaultOpen={true}>
            <Suspense fallback={<div>Loading Dashboard...</div>}>
              <DashboardInner>{children}</DashboardInner>
            </Suspense>
          </SidebarProvider>
        </PanelProvider>
      </ChatProvider>
    </CopilotProvider>
  );
}
