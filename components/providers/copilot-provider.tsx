"use client";

import { CopilotKitProvider, CopilotChatConfigurationProvider } from "@copilotkitnext/react";
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
 * - A seleção do agent é feita via CopilotChatConfigurationProvider (agentId="skyller")
 * - CopilotSidebar movido para rota dedicada (/lite-chat)
 * - Suporte completo a AG-UI Protocol (THINKING, STEPS, TOOL_CALLS, ACTIVITY)
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilot"
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      <CopilotChatConfigurationProvider agentId="skyller">{children}</CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}
