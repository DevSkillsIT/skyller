"use client";

import { CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkitnext/react";
import type React from "react";
import { useEffect, useState } from "react";
import "@copilotkitnext/react/styles.css";

// Constantes para sessionStorage (sincronizado com use-session-context.ts)
const SESSION_ID_KEY = "skyller_session_id";
const SESSION_ID_PREFIX = "sess_";

/**
 * Gera um session ID unico (fallback se nao houver no storage)
 */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${SESSION_ID_PREFIX}${crypto.randomUUID()}`;
  }
  return `${SESSION_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Obtem ou cria session ID do sessionStorage
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return generateSessionId();
  }

  try {
    const stored = sessionStorage.getItem(SESSION_ID_KEY);
    if (stored?.startsWith(SESSION_ID_PREFIX)) {
      return stored;
    }

    const newId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  } catch {
    return generateSessionId();
  }
}

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
 *
 * GAP-CONTEXT-HEADERS:
 * - Passa X-Session-ID para rastreamento de sessao do navegador
 * - Headers dinamicos (conversationId, agentId) sao enviados via forwardedProps
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  // Estado para session ID (hidratado no client)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Hidratar session ID no client
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Headers de contexto para CopilotKit
  // Nota: Apenas headers estaticos podem ser passados aqui
  // Headers dinamicos (conversationId, etc.) sao enviados via forwardedProps
  const contextHeaders: Record<string, string> = {};

  if (sessionId) {
    contextHeaders["X-Session-ID"] = sessionId;
  }

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilot"
      showDevConsole={process.env.NODE_ENV === "development"}
      headers={contextHeaders}
    >
      <CopilotChatConfigurationProvider agentId="skyller">
        {children}
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}
