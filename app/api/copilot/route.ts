// app/api/copilot/route.ts
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import type { NextRequest } from "next/server";

// URL do backend Nexus Core (AG-UI Protocol)
const NEXUS_AGUI_URL = process.env.NEXUS_API_URL
  ? `${process.env.NEXUS_API_URL}/agui`
  : "http://localhost:8000/agui";

// Service adapter para single-agent
const serviceAdapter = new ExperimentalEmptyAdapter();

// HttpAgent conectado ao Nexus Core (Agno)
// O HttpAgent e compativel com a interface esperada pelo CopilotRuntime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nexusAgent = new HttpAgent({ url: NEXUS_AGUI_URL }) as any;

// Runtime com HttpAgent conectado ao Nexus Core (Agno)
const runtime = new CopilotRuntime({
  agents: {
    nexus_agent: nexusAgent,
  },
});

// Endpoint POST para CopilotKit
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  });

  return handleRequest(req);
};
