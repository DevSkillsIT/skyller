/**
 * CopilotProvider - Wrapper para CopilotKit com AG-UI Protocol
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-001: CopilotProvider Configurado
 *
 * Conecta o frontend Skyller ao backend Nexus Core via /api/copilot
 * que implementa HttpAgent para comunicacao AG-UI.
 *
 * Configuracao:
 * - runtimeUrl: /api/copilot (endpoint do CopilotKit)
 * - agent: nexus_agent (agente padrao)
 * - showDevConsole: apenas em desenvolvimento
 */
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import type React from "react";

export interface CopilotProviderProps {
  /** Componentes filhos */
  children: React.ReactNode;
  /** URL do runtime CopilotKit (padrao: /api/copilot) */
  runtimeUrl?: string;
  /** Nome do agente padrao (padrao: nexus_agent) */
  agent?: string;
}

/**
 * CopilotProvider - Provider principal do CopilotKit
 *
 * Fornece acesso aos hooks do CopilotKit:
 * - useCopilotChat: Para interacao de chat
 * - useCopilotAction: Para acoes do agente
 * - useCopilotReadable: Para contexto legivel
 *
 * @example
 * ```tsx
 * <CopilotProvider>
 *   <ChatInterface />
 * </CopilotProvider>
 * ```
 */
export function CopilotProvider({
  children,
  runtimeUrl = "/api/copilot",
  agent = "nexus_agent",
}: CopilotProviderProps) {
  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      agent={agent}
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      {children}
    </CopilotKit>
  );
}

export default CopilotProvider;
