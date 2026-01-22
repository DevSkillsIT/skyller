/**
 * API Route: /api/conversations/[id]
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-008: Carregar historico de mensagens
 *
 * Proxy para GET/PUT/DELETE /api/v1/conversations/{id} do backend Nexus Core
 * Implementa validacao de sessao e headers multi-tenant
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBackendBaseUrl } from "@/lib/env-validation";
import { forbidden, handleApiError, unauthorized } from "@/lib/error-handling";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/[id]
 * Obtem conversa especifica
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/conversations/${id}`, {
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
    const { id } = await params;
    return handleApiError(error, {
      conversationId: id,
      path: `/api/conversations/${id}`,
    });
  }
}

/**
 * PUT /api/conversations/[id]
 * Atualiza/renomeia conversa
 *
 * Body:
 * - title: string (novo titulo)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    const body = await request.json();

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/conversations/${id}`, {
      method: "PUT",
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
    return NextResponse.json(data);
  } catch (error) {
    const { id } = await params;
    return handleApiError(error, {
      conversationId: id,
      path: `/api/conversations/${id}`,
    });
  }
}

/**
 * DELETE /api/conversations/[id]
 * Remove conversa
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return unauthorized();
    }

    if (!session.user?.tenant_id || !session.accessToken) {
      return forbidden("Tenant nao selecionado");
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/conversations/${id}`, {
      method: "DELETE",
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { id } = await params;
    return handleApiError(error, {
      conversationId: id,
      path: `/api/conversations/${id}`,
    });
  }
}
