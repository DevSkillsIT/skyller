// app/api/copilot/route.ts
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)
// MIGRADO: @copilotkit/runtime → @copilotkitnext/runtime (JSON-RPC)
// FIX: Headers dinâmicos com token JWT do usuário autenticado

import { AgnoAgent } from "@ag-ui/agno";
import { CopilotRuntime, createCopilotEndpointSingleRoute } from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import type { NextRequest } from "next/server";
import { auth } from "../../../auth";

// URL do backend Nexus Core (AG-UI Protocol)
const NEXUS_AGUI_URL = process.env.NEXUS_API_URL
  ? `${process.env.NEXUS_API_URL}/agui`
  : "http://localhost:8000/agui";

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

// Endpoint POST para CopilotKit (JSON-RPC via Hono)
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
  const authenticatedAgent = createAuthenticatedAgent(accessToken, tenantId, userId);

  // Criar runtime com o agente autenticado
  const runtime = new CopilotRuntime({
    agents: {
      skyller: authenticatedAgent,
    },
  });

  // Criar endpoint Hono com single-route (JSON-RPC)
  const app = createCopilotEndpointSingleRoute({
    runtime,
    basePath: "/api/copilot",
  });

  // Adaptar Hono para Next.js App Router
  const handler = handle(app);
  return handler(req);
};
