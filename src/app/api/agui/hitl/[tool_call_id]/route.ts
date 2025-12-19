/**
 * SPEC-006-skyller - Phase 5: US3 - Human-in-the-Loop (HITL)
 * T033: Proxy para endpoint backend /agui/hitl/{tool_call_id}
 *
 * Next.js API route que faz proxy das requisições HITL para o Nexus Core.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * POST /api/agui/hitl/{tool_call_id}
 *
 * Faz proxy da requisição para o Nexus Core com headers de autenticação.
 * NOTA: NextAuth v5 usa auth() ao invés de getServerSession()
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool_call_id: string }> }
) {
  try {
    // Verificar autenticação (NextAuth v5)
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Extrair dados da sessão
    const { tenantId, id: userId } = session.user

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: "Dados de sessão incompletos" },
        { status: 400 }
      )
    }

    // Obter body da requisição
    const body = await request.json()

    // Extrair tool_call_id do params (Next.js 16 usa Promise)
    const { tool_call_id } = await params

    // URL do Nexus Core (backend)
    const backendUrl = process.env.NEXUS_CORE_URL || "http://localhost:8000"
    const endpoint = `${backendUrl}/agui/hitl/${tool_call_id}`

    // Fazer requisição ao backend
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        "X-User-ID": userId,
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    // Obter resposta do backend
    const data = await response.json()

    // Retornar resposta com mesmo status code
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[HITL API] Erro ao processar requisição:", error)

    return NextResponse.json(
      {
        error: "Erro ao processar requisição",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
