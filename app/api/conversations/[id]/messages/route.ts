/**
 * API Route: /api/conversations/[id]/messages
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-008: Carregar historico de mensagens
 * @acceptance CC-03: Hidratacao de historico com agent.setMessages()
 *
 * Proxy para GET /api/v1/conversations/{id}/messages do backend Nexus Core
 * Retorna historico de mensagens para hidratacao do CopilotKit useAgent
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBackendBaseUrl } from "@/lib/env-validation";
import { forbidden, handleApiError, unauthorized } from "@/lib/error-handling";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/[id]/messages
 * Obtem historico de mensagens de uma conversa
 *
 * Query params:
 * - page: numero da pagina (default: 1)
 * - limit: itens por pagina (default: 50)
 *
 * Response: Array de mensagens no formato:
 * {
 *   id: string;
 *   role: "user" | "assistant" | "system";
 *   content: string;
 *   created_at: string;
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const response = await fetch(
      `${getBackendBaseUrl()}/api/v1/conversations/${id}/messages?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant-ID": session.user.tenant_id,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    // Normalizar resposta para formato esperado pelo frontend
    // Backend pode retornar { data: [...], total: N } ou array direto
    const messages = Array.isArray(data) ? data : data.data || [];

    return NextResponse.json(messages);
  } catch (error) {
    const { id } = await params;
    return handleApiError(error, {
      conversationId: id,
      path: `/api/conversations/${id}/messages`,
    });
  }
}
