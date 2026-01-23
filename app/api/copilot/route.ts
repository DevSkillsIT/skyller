// app/api/copilot/route.ts
// Integração Skyller ↔ Nexus Core via AG-UI Protocol (Agno)
// MIGRADO: HttpAgent → AgnoAgent (Stack "Agentic v2")
// FIX: Headers dinâmicos com token JWT do usuário autenticado

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { AgnoAgent } from "@ag-ui/agno";
import type { NextRequest } from "next/server";
import { auth } from "../../../auth";

// URL do backend Nexus Core (AG-UI Protocol)
const NEXUS_AGUI_URL = process.env.NEXUS_API_URL
  ? `${process.env.NEXUS_API_URL}/agui`
  : "http://localhost:8000/agui";

// Service adapter para single-agent
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

  return handleRequest(req);
};
