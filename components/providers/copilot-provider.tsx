"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import type React from "react";
import "@copilotkit/react-ui/styles.css";

/**
 * CopilotProvider - Wrapper para CopilotKit com AG-UI Protocol
 *
 * Conecta o frontend Skyller ao backend Nexus Core via /api/copilot
 * que implementa HttpAgent para comunicação AG-UI.
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilot"
      agent="skyller"
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      <CopilotSidebar
        defaultOpen={false}
        clickOutsideToClose={true}
        labels={{
          title: "Skyller AI Assistant",
          initial: "Como posso ajudar você hoje?",
        }}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
