/**
 * NextAuth Route Handler - Multi-Tenant URL Fix
 *
 * Corrige o AUTH_URL dinamicamente antes de processar a request.
 * Essa abordagem define process.env.AUTH_URL baseado no X-Forwarded-Host.
 *
 * IMPORTANTE: Este handler processa:
 * - /api/auth/callback/[provider] - Callback do OAuth
 * - /api/auth/session - Verificacao de sessao
 * - /api/auth/signout - Logout
 *
 * O AUTH_URL DEVE ser setado corretamente para cada request porque:
 * 1. O callback validation usa AUTH_URL para verificar redirect_uri
 * 2. A sessao e criada com cookies baseados no dominio do AUTH_URL
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import type { NextRequest } from "next/server";
import { handlers } from "@/auth";

/**
 * Tipo para o contexto do App Router com catch-all route.
 */
type RouteContext = { params: Promise<{ nextauth: string[] }> };

/**
 * Define AUTH_URL dinamicamente baseado nos headers de proxy.
 * Isso permite que cada tenant tenha seu proprio AUTH_URL.
 *
 * MULTI-TENANT: Cada subdominio (skills.skyller.ai, wga.skyller.ai)
 * tem seu proprio AUTH_URL, garantindo isolamento de sessoes.
 */
function setDynamicAuthUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  // Priorizar X-Forwarded-Host (vem do nginx proxy)
  const effectiveHost = forwardedHost || host || "localhost:3004";

  if (!effectiveHost.includes("localhost")) {
    const authUrl = `${forwardedProto}://${effectiveHost}`;
    process.env.AUTH_URL = authUrl;
    return authUrl;
  }

  return process.env.AUTH_URL || `http://${effectiveHost}`;
}

/**
 * GET handler - IMPORTANTE: Passar context para o handlers.GET
 * O context contém os params da rota catch-all [...nextauth]
 * que o NextAuth usa para determinar a action (signin, callback, etc).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authUrl = setDynamicAuthUrl(request);
  const params = await context.params;
  const action = params.nextauth?.join("/") || "unknown";

  console.log(`[NextAuth] GET /${action} - AUTH_URL: ${authUrl}`);

  // NextAuth v5 beta handlers aceitam request como primeiro argumento
  // e context como segundo (tipagem pode estar desatualizada)
  return (handlers.GET as (req: NextRequest, ctx: RouteContext) => Promise<Response>)(request, context);
}

/**
 * POST handler - IMPORTANTE: Passar context para o handlers.POST
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const authUrl = setDynamicAuthUrl(request);
  const params = await context.params;
  const action = params.nextauth?.join("/") || "unknown";

  console.log(`[NextAuth] POST /${action} - AUTH_URL: ${authUrl}`);

  // NextAuth v5 beta handlers aceitam request como primeiro argumento
  // e context como segundo (tipagem pode estar desatualizada)
  return (handlers.POST as (req: NextRequest, ctx: RouteContext) => Promise<Response>)(request, context);
}
