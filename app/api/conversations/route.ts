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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

/**
 * GET /api/conversations
 * Lista conversas do usuario autenticado
 *
 * Query params:
 * - offset: deslocamento (default: 0)
 * - limit: itens por pagina (default: 20)
 * - workspace_id: filtrar por workspace (opcional)
 * - project_id: filtrar por projeto (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

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
    const limit = searchParams.get("limit") || "20";
    const offsetParam = searchParams.get("offset");
    const page = searchParams.get("page");
    const workspaceId = searchParams.get("workspace_id");
    const projectId = searchParams.get("project_id");

    // Construir query string (offset preferencial, page como fallback)
    const offset = offsetParam ?? (page ? String((Number(page) - 1) * Number(limit)) : "0");
    const params = new URLSearchParams({
      limit,
      offset,
    });
    if (workspaceId) {
      params.set("workspace_id", workspaceId);
    }
    if (projectId) {
      params.set("project_id", projectId);
    }

    const response = await fetch(
      `${getBackendBaseUrl()}/api/v1/conversations?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant-ID": session.user.tenant_id,
          "X-User-ID": session.user.id,
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

    const body = await request.json();

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant-ID": session.user.tenant_id,
        "X-User-ID": session.user.id,
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
