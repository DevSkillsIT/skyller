"use client"

import { SidebarProvider } from "@/components/ui/sidebar"

import { PanelProvider, usePanel } from "@/lib/contexts/panel-context"
import { ChatProvider, useChat } from "@/lib/contexts/chat-context"
import React, { Suspense, useCallback, useState } from "react"
import { usePathname } from "next/navigation"
import { VerticalNav } from "@/components/layout/vertical-nav"
import { ChatSidebar } from "@/components/layout/chat-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { ArtifactPanel } from "@/components/layout/artifact-panel"
import { MobileNav } from "@/components/layout/mobile-nav"
import { mockWorkspaces, mockProjects } from "@/lib/mock/data"
import { SearchDialog } from "@/components/dialogs/search-dialog"

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const [isChatSidebarCollapsed, setIsChatSidebarCollapsed] = useState(false)
  
  // Initialize workspace from localStorage if available
  const [currentWorkspace, setCurrentWorkspace] = useState<typeof mockWorkspaces[0] | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentWorkspaceId')
      if (saved) {
        return mockWorkspaces.find(w => w.id === saved) || null
      }
    }
    return null
  })
  const [currentProject, setCurrentProject] = useState<typeof mockProjects[0] | null>(null)
  
  // Persist workspace to localStorage
  const handleWorkspaceChange = useCallback((workspace: typeof mockWorkspaces[0] | null) => {
    setCurrentWorkspace(workspace)
    if (typeof window !== 'undefined') {
      if (workspace) {
        localStorage.setItem('currentWorkspaceId', workspace.id)
      } else {
        localStorage.removeItem('currentWorkspaceId')
      }
    }
  }, [])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { loadConversation, startNewConversation } = useChat()
  const { isPanelOpen, panelContent, isPanelExpanded, setPanelContent, setIsPanelOpen } = usePanel()
  return (
    <div className="flex h-screen w-full bg-background pb-16 md:pb-0">
      {/* Vertical Navigation (sempre visível com labels) */}
      <VerticalNav 
        showLabels={true} 
        showExpandButton={isHomePage && isChatSidebarCollapsed}
        onExpandSidebar={() => setIsChatSidebarCollapsed(false)}
      />

      {/* Chat Sidebar (apenas na home/chat) */}
      {isHomePage && !isChatSidebarCollapsed && (
        <Suspense fallback={<div className="w-64 border-r">Loading...</div>}>
          <ChatSidebar
            workspaces={mockWorkspaces}
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onNewConversation={startNewConversation}
            onConversationSelect={loadConversation}
            onCollapse={() => setIsChatSidebarCollapsed(true)}
          />
        </Suspense>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header (apenas em páginas não-home) */}
        {!isHomePage && (
          <Suspense fallback={<div>Loading Header...</div>}>
            <AppHeader
              currentWorkspace={currentWorkspace}
              currentProject={currentProject}
              onSearchOpen={() => setIsSearchOpen(true)}
            />
          </Suspense>
        )}

        {/* Main Area + Artifact Split View */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">
            {children}
          </main>

          {/* Artifact Panel - Inline like ChatGPT/Claude */}
          {isPanelOpen && (
            <div className={`${isPanelExpanded ? 'w-[70%]' : 'w-[50%]'} border-l border-border flex-shrink-0 transition-all duration-300`}>
              <ArtifactPanel
                content={panelContent}
                onClose={() => setIsPanelOpen(false)}
              />
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
        <SearchDialog 
          open={isSearchOpen} 
          onOpenChange={setIsSearchOpen}
        />
      </Suspense>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <PanelProvider>
        <Suspense fallback={<div>Loading Dashboard...</div>}>
          <DashboardInner>{children}</DashboardInner>
        </Suspense>
      </PanelProvider>
    </ChatProvider>
  )
}
