// app/api/copilot/route.ts
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)
// MIGRADO: HttpAgent → AgnoAgent (Stack "Agentic v2")
// FIX: Headers dinâmicos com token JWT do usuário autenticado

import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { AgnoAgent } from "@ag-ui/agno";
import type { NextRequest } from "next/server";
import { auth } from "../../../auth";

// Service adapter para single-agent (ExperimentalEmptyAdapter e o padrao oficial para agentes remotos)
const serviceAdapter = new ExperimentalEmptyAdapter();

/**
 * Cria AgnoAgent dinamicamente com headers de autenticação.
 *
 * O backend Nexus Core (/agui) exige autenticação via:
 * - Authorization: Bearer <jwt_token>
 * - X-Tenant-ID: tenant slug
 * - X-User-ID: user id
 *
 * Essa função cria o AgnoAgent com os headers corretos extraídos
 * da sessão do usuário autenticado via NextAuth.
 */
function createAuthenticatedAgent(
  accessToken: string | undefined,
  tenantId: string,
  userId: string
) {
  const headers: Record<string, string> = {
    "X-Tenant-ID": tenantId,
    "X-User-ID": userId,
  };

  // Adicionar token JWT se disponível
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return new AgnoAgent({
    url: NEXUS_AGUI_URL,
    headers,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

// Endpoint POST para CopilotKit
export const POST = async (req: NextRequest) => {
  // Obter sessão do usuário autenticado via NextAuth
  const session = await auth();

  // Extrair dados de autenticação da sessão
  const accessToken = session?.accessToken;
  const tenantId = session?.user?.tenant_id || "default";
  const userId = session?.user?.id || "anonymous";

  // Log para debug (remover em produção)
  if (process.env.NODE_ENV === "development") {
    console.log("[Copilot Route] Auth context:", {
      hasSession: !!session,
      hasToken: !!accessToken,
      tenantId,
      userId,
    });
  }

  // Criar AgnoAgent com headers de autenticação dinâmicos
  const authenticatedAgent = createAuthenticatedAgent(
    accessToken,
    tenantId,
    userId
  );

  // Criar runtime com o agente autenticado
  const runtime = new CopilotRuntime({
    agents: {
      skyller: authenticatedAgent,
    },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  });

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
