"use client";

import { CopilotKitProvider } from "@copilotkitnext/react";
import { CopilotSidebar } from "@copilotkitnext/react";
import type React from "react";
import "@copilotkitnext/react/styles.css";

/**
 * CopilotProvider - Wrapper para CopilotKit com AG-UI Protocol
 *
 * Conecta o frontend Skyller ao backend Nexus Core via /api/copilot
 * que implementa AgnoAgent para comunicação AG-UI.
 *
 * MIGRAÇÃO @copilotkitnext/react:
 * - Usa JSON-RPC em vez de GraphQL (compatível com AgnoAgent via AbstractAgent)
 * - A seleção do agent é feita no backend (route.ts) via CopilotRuntime
 * - CopilotSidebar renderizado em paralelo ao children
 * - Suporte completo a AG-UI Protocol (THINKING, STEPS, TOOL_CALLS, ACTIVITY)
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilot"
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      {children}
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          modalHeaderTitle: "Skyller AI Assistant",
          chatInputPlaceholder: "Como posso ajudar você hoje?",
        }}
      />
    </CopilotKitProvider>
  );
}
