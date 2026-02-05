"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Artifact } from "@/lib/mock/data"

interface PanelContextType {
  isPanelOpen: boolean
  panelContent: 'artifact' | 'knowledge' | 'settings'
  selectedArtifact: Artifact | null
  isPanelExpanded: boolean
  togglePanelExpanded: () => void
  openPanel: (content: 'artifact' | 'knowledge' | 'settings', artifact?: Artifact) => void
  closePanel: () => void
  setIsPanelOpen: (open: boolean) => void
  setPanelContent: (content: 'artifact' | 'knowledge' | 'settings') => void
}

const PanelContext = createContext<PanelContextType | undefined>(undefined)

export function PanelProvider({ children }: { children: ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [panelContent, setPanelContent] = useState<'artifact' | 'knowledge' | 'settings'>('artifact')
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)

  const openPanel = (content: 'artifact' | 'knowledge' | 'settings', artifact?: Artifact) => {
    setPanelContent(content)
    if (artifact) setSelectedArtifact(artifact)
    setIsPanelOpen(true)
  }

  const closePanel = () => {
    setIsPanelOpen(false)
  }

  const togglePanelExpanded = () => {
    setIsPanelExpanded(!isPanelExpanded)
  }

  return (
    <PanelContext.Provider value={{ 
      isPanelOpen, 
      panelContent, 
      selectedArtifact,
      isPanelExpanded,
      togglePanelExpanded,
      openPanel, 
      closePanel,
      setIsPanelOpen,
      setPanelContent 
    }}>
      {children}
    </PanelContext.Provider>
  )
}

export function usePanel() {
  const context = useContext(PanelContext)
  if (!context) {
    throw new Error("usePanel must be used within a PanelProvider")
  }
  return context
}
