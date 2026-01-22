/**
 * API Route: /api/conversations
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-008: Carregar historico de mensagens
 *
 * Proxy para GET/POST /api/v1/conversations do backend Nexus Core
 * Implementa validacao de sessao e headers multi-tenant
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBackendBaseUrl } from "@/lib/env-validation";
import { forbidden, handleApiError, unauthorized } from "@/lib/error-handling";

/**
 * GET /api/conversations
 * Lista conversas do usuario autenticado
 *
 * Query params:
 * - page: numero da pagina (default: 1)
 * - limit: itens por pagina (default: 20)
 * - workspace_id: filtrar por workspace (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const workspaceId = searchParams.get("workspace_id");

    // Construir query string
    let queryString = `page=${page}&limit=${limit}`;
    if (workspaceId) {
      queryString += `&workspace_id=${workspaceId}`;
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/conversations?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant-ID": session.user.tenant_id,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, {
      path: "/api/conversations",
    });
  }
}

/**
 * POST /api/conversations
 * Cria nova conversa
 *
 * Body:
 * - title: string (opcional)
 * - workspace_id: string (opcional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    const body = await request.json();

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant-ID": session.user.tenant_id,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: "/api/conversations",
    });
  }
}
