// app/api/copilot/route.ts
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)
// MIGRADO: @copilotkit/runtime → @copilotkitnext/runtime (JSON-RPC)
// FIX: Headers dinâmicos com token JWT do usuário autenticado
// GAP-CONTEXT-HEADERS: Encaminha headers de contexto (session, conversation, etc.)

import { AgnoAgent } from "@ag-ui/agno";
import { CopilotRuntime, createCopilotEndpoint } from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import type { NextRequest } from "next/server";
import { createAuthHeaders, isUuid } from "@/lib/api/auth-headers";
import { forbidden, unauthorized } from "@/lib/error-handling";
import { auth } from "../../../auth";

// URL do backend Nexus Core (AG-UI Protocol)
const NEXUS_AGUI_URL = process.env.NEXUS_API_URL
  ? `${process.env.NEXUS_API_URL}/agui`
  : "http://localhost:8000/agui";

// Headers de contexto que devem ser encaminhados ao backend
const CONTEXT_HEADERS = [
  "x-session-id",
  "x-conversation-id",
  "x-thread-id",
  "x-workspace-id",
  "x-agent-id",
] as const;

/**
 * Extrai headers de contexto do request do cliente.
 *
 * GAP-CONTEXT-HEADERS: O CopilotKit envia headers customizados
 * configurados no CopilotKitProvider. Esta funcao extrai esses
 * headers para encaminhar ao backend.
 */
function extractContextHeaders(req: NextRequest): Record<string, string> {
  const contextHeaders: Record<string, string> = {};

  for (const headerName of CONTEXT_HEADERS) {
    const value = req.headers.get(headerName);
    if (value) {
      // Converter para formato padrao (X-Header-Name)
      const normalizedName = headerName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-");
      contextHeaders[normalizedName] = value;
    }
  }

  return contextHeaders;
}

/**
 * Cria AgnoAgent dinamicamente com headers de autenticação e contexto.
 *
 * O backend Nexus Core (/agui) exige autenticação via:
 * - Authorization: Bearer <jwt_token>
 * - X-Tenant-ID: tenant UUID
 * - X-User-ID: user id
 *
 * GAP-CONTEXT-HEADERS: Tambem encaminha headers de contexto:
 * - X-Session-ID: ID unico da sessao do navegador
 * - X-Conversation-ID: ID da conversa atual
 * - X-Thread-ID: Thread ID do AG-UI (alternativa ao conversation_id)
 * - X-Workspace-ID: ID do workspace atual
 * - X-Agent-ID: ID do agente sendo usado
 *
 * Essa função cria o AgnoAgent com os headers corretos extraídos
 * da sessão do usuário autenticado via NextAuth e do request do cliente.
 */
function createAuthenticatedAgent(
  session: Awaited<ReturnType<typeof auth>>,
  contextHeaders: Record<string, string> = {}
) {
  const headers: Record<string, string> = {
    ...createAuthHeaders(session),
    ...contextHeaders,
  };

  return new AgnoAgent({
    url: NEXUS_AGUI_URL,
    headers,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

/**
 * Cria runtime e app Hono com AgnoAgent autenticado
 */
async function createCopilotApp(req: NextRequest, session: Awaited<ReturnType<typeof auth>>) {
  // Sessão já validada no handler

  // Extrair dados de autenticação da sessão
  const accessToken = session?.accessToken;
  const tenantId = session?.user?.tenant_id || "";
  const userId = session?.user?.id || "";

  // GAP-CONTEXT-HEADERS: Extrair headers de contexto do request
  const contextHeaders = extractContextHeaders(req);

  // Log para debug (remover em produção)
  if (process.env.NODE_ENV === "development") {
    console.log("[Copilot Route] Auth context:", {
      hasSession: !!session,
      hasToken: !!accessToken,
      tenantId,
      userId,
      contextHeaders,
    });
  }

  // Criar AgnoAgent com headers de autenticação + contexto
  const authenticatedAgent = createAuthenticatedAgent(session, contextHeaders);

  // Criar runtime com o agente autenticado
  const runtime = new CopilotRuntime({
    agents: {
      skyller: authenticatedAgent,
    },
  });

  // Criar endpoint Hono com multi-route (inclui /info, /agent/:agentId/run, etc.)
  return createCopilotEndpoint({
    runtime,
    basePath: "/api/copilot",
  });
}

// Endpoint GET para runtime info (/api/copilot/info)
export const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session) {
    return unauthorized();
  }
  if (!session.user?.tenant_id || !session.user?.id || !session.accessToken) {
    return forbidden("Tenant nao selecionado");
  }
  if (!isUuid(session.user.tenant_id)) {
    return new Response(
      JSON.stringify({
        error: "invalid_tenant_id",
        message: "tenant_id deve ser UUID valido",
        spec: "SPEC-TENANT-SLUG-001 REQ-L03",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const app = await createCopilotApp(req, session);
  const handler = handle(app);
  return handler(req);
};

// Endpoint POST para CopilotKit (JSON-RPC via Hono)
export const POST = async (req: NextRequest) => {
  const session = await auth();
  if (!session) {
    return unauthorized();
  }
  if (!session.user?.tenant_id || !session.user?.id || !session.accessToken) {
    return forbidden("Tenant nao selecionado");
  }
  if (!isUuid(session.user.tenant_id)) {
    return new Response(
      JSON.stringify({
        error: "invalid_tenant_id",
        message: "tenant_id deve ser UUID valido",
        spec: "SPEC-TENANT-SLUG-001 REQ-L03",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const app = await createCopilotApp(req, session);
  const handler = handle(app);
  return handler(req);
};
