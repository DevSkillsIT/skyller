/**
 * SPEC-006-skyller - CopilotKit API Route
 *
 * NOTA: Versao simplificada - @copilotkitnext nao esta disponivel no npm.
 * Esta rota usa @copilotkit/runtime padrao (ja instalado) ao inves de @copilotkitnext.
 *
 * Para usar a versao vNext com agentes avancados, instale @copilotkitnext do monorepo AG-UI.
 * O arquivo original foi salvo em route.ts.original
 */

import { NextRequest, NextResponse } from "next/server";

// @copilotkit/runtime padrao (disponivel no npm via @copilotkit/runtime)
// Usando handler simples ate @copilotkitnext estar disponivel

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "CopilotKit API - versao simplificada",
    note: "@copilotkitnext nao disponivel, usando handler basico",
    version: "1.0.0"
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Por enquanto, retorna erro indicando que vNext nao esta configurado
    // Integracoes reais devem usar /api/copilotkit/[integrationId]
    return NextResponse.json({
      error: "CopilotKit vNext nao configurado",
      message: "Use /api/copilotkit/[integrationId] para acessar integrações",
      receivedBody: body
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json({
      error: "Erro ao processar requisicao",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}
