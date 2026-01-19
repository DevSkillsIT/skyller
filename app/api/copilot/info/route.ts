// app/api/copilot/info/route.ts
// Endpoint para CopilotKit agent discovery
// Retorna informacoes sobre os agentes registrados

import { NextResponse } from "next/server";

/**
 * GET /api/copilot/info
 *
 * Retorna informacoes sobre os agentes disponiveis para o CopilotKit.
 * Este endpoint e necessario para o agent discovery funcionar.
 */
export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    agents: {
      default: {
        name: "default",
        description: "Nexus Core AI Agent via AG-UI Protocol",
      },
    },
  });
}

export const runtime = "nodejs";
