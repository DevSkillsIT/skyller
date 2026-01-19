// app/api/copilot/route.ts
// ══════════════════════════════════════════════════════════════════════════════
// INTEGRACAO SKYLLER <-> NEXUS CORE VIA AG-UI PROTOCOL
// ══════════════════════════════════════════════════════════════════════════════
//
// Este arquivo conecta o frontend Skyller ao backend Nexus Core usando
// o AG-UI Protocol (Agno + CopilotKit).
//
// Fluxo:
// 1. Usuario envia mensagem no chat
// 2. CopilotKit intercepta e envia para este endpoint
// 3. HttpAgent encaminha para Nexus Core (/agui)
// 4. Nexus Core processa com Agno e retorna via SSE
// 5. CopilotKit renderiza a resposta no chat
//
// ══════════════════════════════════════════════════════════════════════════════

import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";

// URL do Nexus Core (backend)
// Em desenvolvimento: http://localhost:8000
// Em producao: URL do servidor Nexus Core
const NEXUS_API_URL = process.env.NEXUS_API_URL || "http://localhost:8000";
const NEXUS_AGUI_URL = `${NEXUS_API_URL}/agui`;

// Configuracao do agente Nexus Core
const nexusAgent = new HttpAgent({
  url: NEXUS_AGUI_URL,
  // Headers adicionais podem ser configurados aqui
  // Ex: headers: { "X-Custom-Header": "value" }
});

// Runtime do CopilotKit com agente configurado
const copilotRuntime = new CopilotRuntime({
  agents: {
    // Agente padrao - CopilotKit procura por "default"
    // Conectado ao Nexus Core via AG-UI Protocol
    default: nexusAgent,
  },
});

// Endpoint POST para CopilotKit
// Recebe mensagens do chat e encaminha para o Nexus Core
export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotRuntime,
    serviceAdapter: nexusAgent,
    endpoint: "/api/copilot",
  });

  return handleRequest(req);
};

// Configuracao de runtime do Next.js
// Node.js runtime (Edge nao suporta modulos nativos usados pelo @ag-ui/client)
export const runtime = "nodejs";

// Timeout maximo para respostas longas
export const maxDuration = 60; // 60 segundos
