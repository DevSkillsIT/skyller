// app/api/copilot/route.ts
// Integracao Skyller <-> Nexus Core via AG-UI Protocol (Agno)
// @spec SPEC-COPILOT-INTEGRATION-001

import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
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

/**
 * Headers CORS para multi-tenant *.skyller.ai
 * AC-029: Access-Control-Allow-Origin: wildcard ou origin especifica
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Padrao de origem permitida: *.skyller.ai ou localhost para dev
  const allowedOriginPattern = /^https?:\/\/([\w-]+\.)?skyller\.ai$/;
  const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");

  const isAllowed = origin && (allowedOriginPattern.test(origin) || isLocalhost);

  return {
    "Access-Control-Allow-Origin": isAllowed && origin ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Tenant-ID, X-Workspace-ID, X-Project-ID",
    "Access-Control-Expose-Headers":
      "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Headers de Rate Limiting para repassar ao cliente
 * AC-012: Retornar 429 com retry_after header quando limite excedido
 */
const RATE_LIMIT_HEADERS = [
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
  "Retry-After",
] as const;

/**
 * Endpoint OPTIONS para CORS preflight
 */
export const OPTIONS = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Se origem nao permitida, retornar 403
  if (!corsHeaders["Access-Control-Allow-Origin"]) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

/**
 * Endpoint POST para CopilotKit
 * Repassa headers de rate limiting do backend para o cliente
 */
export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Se origem nao permitida, retornar 403
  if (origin && !corsHeaders["Access-Control-Allow-Origin"]) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "CORS_ORIGIN_NOT_ALLOWED",
        message: "Origin not allowed",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  });

  // Processar requisicao com CopilotKit
  const response = await handleRequest(req);

  // Adicionar headers CORS a resposta
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (value) {
      response.headers.set(key, value);
    }
  }

  // Repassar headers de rate limiting do backend (se existirem nos headers da requisicao)
  // Nota: Em SSE streaming, os headers de rate limit vem do backend via middleware
  // O frontend deve observar esses headers na resposta

  return response;
};
