// app/api/copilot/route.ts
// Integracao Skyller <-> Nexus Core via AG-UI Protocol (Agno)
// @spec SPEC-COPILOT-INTEGRATION-001
// @acceptance AC-001: Route handler POST /api/copilot funcional
// @acceptance FE-001 + BE-001: Headers Multi-Tenant
// @acceptance CC-07: Separacao de Autenticacao (401) vs Autorizacao (403)

import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getAgnoAgentUrl } from "@/lib/env-validation";
import { forbidden, handleApiError, unauthorized } from "@/lib/error-handling";

// Service adapter para single-agent (ExperimentalEmptyAdapter e o padrao oficial para agentes remotos)
const serviceAdapter = new ExperimentalEmptyAdapter();

// HttpAgent conectado ao Nexus Core (Agno)
// O HttpAgent e compativel com AgnoAgent e implementa o protocolo AG-UI
// biome-ignore lint/suspicious/noExplicitAny: HttpAgent type compatibility with AgnoAgent protocol
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nexusAgent = new HttpAgent({ url: getAgnoAgentUrl() }) as any;

// Runtime com HttpAgent conectado ao Nexus Core (Agno)
const runtime = new CopilotRuntime({
  agents: {
    skyller: nexusAgent, // Renomeado para 'skyller' conforme SPEC
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
 * @acceptance FE-001 + BE-001: Headers Multi-Tenant obrigatorios
 * @acceptance CC-07: Separacao 401 (autenticacao) vs 403 (autorizacao)
 * @acceptance AC-012: Retornar 429 com retry_after header quando limite excedido
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

  try {
    // ======================================
    // 1. AUTENTICACAO: Sem sessao = 401
    // ======================================
    const session = await auth();

    if (!session) {
      console.error("[copilot] Tentativa de acesso sem sessao", {
        ip: req.headers.get("x-forwarded-for"),
        timestamp: new Date().toISOString(),
      });
      return unauthorized("Nao autenticado - faca login para continuar");
    }

    // ======================================
    // 2. AUTORIZACAO: Sem tenant = 403
    // ======================================
    if (!session.user?.tenant_id) {
      console.error("[copilot] Usuario autenticado mas sem tenant", {
        userId: session.user?.id,
        email: session.user?.email,
        timestamp: new Date().toISOString(),
      });
      return forbidden("Tenant nao selecionado - acesso negado");
    }

    // ======================================
    // 3. VALIDACAO DO TOKEN JWT
    // ======================================
    if (!session.accessToken) {
      console.error("[copilot] Sessao sem accessToken valido", {
        userId: session.user.id,
        tenantId: session.user.tenant_id,
        timestamp: new Date().toISOString(),
      });
      return unauthorized("Token de acesso invalido - faca login novamente");
    }

    // ======================================
    // 4. ENRIQUECER REQUEST COM HEADERS MULTI-TENANT
    // FE-001 + BE-001: Injetar Authorization e X-Tenant-ID
    // ======================================
    const headersWithAuth = new Headers(req.headers);
    headersWithAuth.set("Authorization", `Bearer ${session.accessToken}`);
    headersWithAuth.set("X-Tenant-ID", session.user.tenant_id);

    // Headers opcionais para contexto adicional
    if (session.user.id) {
      headersWithAuth.set("X-User-ID", session.user.id);
    }

    const enrichedRequest = new NextRequest(req.url, {
      method: req.method,
      headers: headersWithAuth,
      body: req.body,
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilot",
    });

    // Processar requisicao com CopilotKit usando request enriquecido
    const response = await handleRequest(enrichedRequest);

    // Adicionar headers CORS a resposta
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (value) {
        response.headers.set(key, value);
      }
    }

    return response;
  } catch (error) {
    // ======================================
    // 5. ERRO DE AUTENTICACAO/PROCESSAMENTO
    // ======================================
    console.error("[copilot] Erro no servico", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return handleApiError(error, {
      path: req.nextUrl.pathname,
    });
  }
};
