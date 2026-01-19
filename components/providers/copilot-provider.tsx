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
  const { status } = useSession();

  // Renderiza CopilotKit durante "loading" e "authenticated"
  // Durante loading: servidor ja validou sessao, hidratacao em andamento
  // Durante authenticated: sessao confirmada no cliente
  // Apenas "unauthenticated" nao renderiza CopilotKit
  if (status === "loading" || status === "authenticated") {
    return <CopilotKit runtimeUrl={runtimeUrl}>{children}</CopilotKit>;
  }

  // Somente unauthenticated - paginas publicas sem CopilotKit
  return <>{children}</>;
}

export default CopilotProvider;
