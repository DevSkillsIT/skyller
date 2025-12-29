/**
 * SPEC-006-skyller - Phase 5: US3 - Human-in-the-Loop (HITL)
 * Proxy para endpoint backend /agui/hitl/{tool_call_id}
 *
 * NOTA: Auth desabilitado temporariamente
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool_call_id: string }> }
) {
  try {
    const body = await request.json()
    const { tool_call_id } = await params

    const backendUrl = process.env.NEXUS_CORE_URL || "http://localhost:8000"
    const endpoint = `${backendUrl}/agui/hitl/${tool_call_id}`

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[HITL API] Erro:", error)
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}
