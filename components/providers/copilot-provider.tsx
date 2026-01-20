"use client";

/**
 * CopilotKit Provider com verificacao de autenticacao
 *
 * Este provider carrega o CopilotKit apenas quando o usuario esta autenticado.
 * Paginas que usam CopilotKit devem ser protegidas com ProtectedContent.
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import { CopilotKit } from "@copilotkit/react-core";
import { useSession } from "next-auth/react";
import type React from "react";

interface CopilotProviderProps {
  children: React.ReactNode;
  runtimeUrl?: string;
}

/**
 * Provider que carrega CopilotKit para usuarios autenticados
 *
 * NOTA: Durante a hidratacao do cliente, useSession() pode estar em estado
 * "loading" brevemente. Como as paginas protegidas ja validam autenticacao
 * no servidor (via auth() em page.tsx), renderizamos CopilotKit para
 * "loading" e "authenticated" para evitar erro de hooks CopilotKit sendo
 * chamados fora do provider durante a hidratacao.
 *
 * @example
 * // No layout.tsx
 * <SessionProvider>
 *   <CopilotProvider>
 *     {children}
 *   </CopilotProvider>
 * </SessionProvider>
 */
export function CopilotProvider({
  children,
  runtimeUrl = "/api/copilot",
}: CopilotProviderProps) {
  const { status, data: session } = useSession();

  // Renderiza CopilotKit apenas quando temos sessao valida com accessToken
  // IMPORTANTE: Durante loading inicial (redirect para login), session pode ser null
  // Nao renderizamos CopilotKit sem accessToken para evitar erro 401 do backend
  const hasValidSession = session?.accessToken != null;

  if (status === "authenticated" && hasValidSession) {
    return <CopilotKit runtimeUrl={runtimeUrl}>{children}</CopilotKit>;
  }

  // Loading sem sessao valida ou unauthenticated - nao renderiza CopilotKit
  return <>{children}</>;
}

export default CopilotProvider;
