"use client";

import { PanelLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SearchDialog } from "@/components/dialogs/search-dialog";
import { AppHeader } from "@/components/layout/app-header";
import { ChatSidebar } from "@/components/layout/chat-sidebar";
import { ArtifactPanel } from "@/components/layout/artifact-panel";
import { IconDock } from "@/components/layout/icon-dock";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CopilotProvider } from "@/components/providers/copilot-provider";
import { Button } from "@/components/ui/button";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";
import { PanelProvider, usePanel } from "@/lib/contexts/panel-context";
import { mockWorkspaces } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

function DashboardInner({ children }: { children: React.ReactNode }) {
  // All hooks MUST be called unconditionally at the top
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [currentWorkspace] = useState<(typeof mockWorkspaces)[0] | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("currentWorkspaceId");
      if (saved) {
        return mockWorkspaces.find((w) => w.id === saved) || null;
      }
    }
    return null;
  });
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
      {/* Icon Dock - Navegação principal estilo TypingMind */}
      <IconDock className="hidden md:flex flex-shrink-0" />

      {/* Sidebar de Conversas */}
      <Suspense fallback={<div>Loading Sidebar...</div>}>
        <ChatSidebar
          workspaces={mockWorkspaces}
          currentWorkspace={currentWorkspace}
          onConversationSelect={loadConversation}
          onNewConversation={handleNewConversation}
          onCollapse={toggleSidebar}
          selectedConversationId={null}
        />
      </Suspense>

      {/* Botão expand sidebar quando colapsada */}
      {!open && (
        <div className="group fixed left-[112px] top-3 z-50 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            title="Abrir lista de conversas"
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
