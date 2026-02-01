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
import { createAuthHeaders, isUuid } from "@/lib/api/auth-headers";
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
 * - after: cursor timestamp (ms) para paginação (opcional)
 * - limit: itens por pagina (default: 50)
 *
 * Response: MessageListResponse do backend (items, total, next_cursor, has_more)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.user?.id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    if (!isUuid(session.user.tenant_id)) {
      return NextResponse.json(
        {
          error: "invalid_tenant_id",
          message: "tenant_id deve ser UUID valido",
          spec: "SPEC-TENANT-SLUG-001 REQ-L03",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const limit = searchParams.get("limit") || "50";

    const params = new URLSearchParams();
    params.set("limit", limit);
    if (after) {
      params.set("after", after);
    }

    const response = await fetch(
      `${getBackendBaseUrl()}/api/v1/conversations/${id}/messages?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(session),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const { id } = await params;
    return handleApiError(error, {
      conversationId: id,
      path: `/api/conversations/${id}/messages`,
    });
  }
}
