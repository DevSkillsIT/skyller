// app/api/copilot/[...path]/route.ts
// Catch-all route para sub-rotas do CopilotKit (/info, /agent/:id/run, etc.)
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)

import { AgnoAgent } from "@ag-ui/agno";
import { CopilotRuntime, createCopilotEndpoint } from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import type { NextRequest } from "next/server";
import { forbidden, unauthorized } from "@/lib/error-handling";
import { auth } from "../../../../auth";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

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
 */
function extractContextHeaders(req: NextRequest): Record<string, string> {
  const contextHeaders: Record<string, string> = {};

  for (const headerName of CONTEXT_HEADERS) {
    const value = req.headers.get(headerName);
    if (value) {
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
 * Cria AgnoAgent dinamicamente com headers de autenticação.
 */
function createAuthenticatedAgent(
  accessToken: string | undefined,
  tenantId: string,
  userId: string,
  contextHeaders: Record<string, string> = {}
) {
  const headers: Record<string, string> = {
    "X-Tenant-ID": tenantId,
    "X-User-ID": userId,
    ...contextHeaders,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return new AgnoAgent({
    url: NEXUS_AGUI_URL,
    headers,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

/**
 * Cria runtime e app Hono com AgnoAgent autenticado
 */
async function createCopilotApp(_req: NextRequest, session: Awaited<ReturnType<typeof auth>>) {
  const accessToken = session?.accessToken;
  const tenantId = session?.user?.tenant_id || "";
  const userId = session?.user?.id || "";

  if (process.env.NODE_ENV === "development") {
    console.log("[Copilot Route] Auth context:", {
      hasSession: !!session,
      hasToken: !!accessToken,
      tenantId,
      userId,
    });
  }

  const contextHeaders = extractContextHeaders(_req);
  const authenticatedAgent = createAuthenticatedAgent(
    accessToken,
    tenantId,
    userId,
    contextHeaders
  );

  const runtime = new CopilotRuntime({
    agents: {
      skyller: authenticatedAgent,
    },
  });

  return createCopilotEndpoint({
    runtime,
    basePath: "/api/copilot",
  });
}

// Endpoint GET para /info e outras rotas GET
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

// Endpoint POST para JSON-RPC e outras rotas POST
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
