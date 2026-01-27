// app/api/copilot/[...path]/route.ts
// Catch-all route para sub-rotas do CopilotKit (/info, /agent/:id/run, etc.)
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)

import { AgnoAgent } from "@ag-ui/agno";
import { CopilotRuntime, createCopilotEndpoint } from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import type { NextRequest } from "next/server";
import { auth } from "../../../../auth";

// URL do backend Nexus Core (AG-UI Protocol)
const NEXUS_AGUI_URL = process.env.NEXUS_API_URL
  ? `${process.env.NEXUS_API_URL}/agui`
  : "http://localhost:8000/agui";

/**
 * Cria AgnoAgent dinamicamente com headers de autenticação.
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
async function createCopilotApp(_req: NextRequest) {
  const session = await auth();
  const accessToken = session?.accessToken;
  const tenantId = session?.user?.tenant_id || "default";
  const userId = session?.user?.id || "anonymous";

  if (process.env.NODE_ENV === "development") {
    console.log("[Copilot Route] Auth context:", {
      hasSession: !!session,
      hasToken: !!accessToken,
      tenantId,
      userId,
    });
  }

  const authenticatedAgent = createAuthenticatedAgent(accessToken, tenantId, userId);

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
  const app = await createCopilotApp(req);
  const handler = handle(app);
  return handler(req);
};

// Endpoint POST para JSON-RPC e outras rotas POST
export const POST = async (req: NextRequest) => {
  const app = await createCopilotApp(req);
  const handler = handle(app);
  return handler(req);
};
