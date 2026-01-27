"use client";

/**
 * Componente para proteger conteudo que requer autenticacao
 *
 * Exibe loading enquanto verifica sessao e redireciona para login
 * se o usuario nao estiver autenticado.
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type React from "react";
import { useEffect } from "react";

interface ProtectedContentProps {
  children: React.ReactNode;
  /** URL para redirecionar se nao autenticado */
  redirectTo?: string;
  /** Componente de loading customizado */
  loadingComponent?: React.ReactNode;
}

/**
 * Loading padrao exibido enquanto verifica sessao
 */
function DefaultLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Verificando autenticacao...</p>
      </div>
    </div>
  );
}

/**
 * Protege conteudo que requer autenticacao
 *
 * @example
 * // Na pagina
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedContent>
 *       <Dashboard />
 *     </ProtectedContent>
 *   );
 * }
 */
export function ProtectedContent({
  children,
  redirectTo = "/api/auth/login",
  loadingComponent,
}: ProtectedContentProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(window.location.href);
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, redirectTo]);

  // Enquanto carrega ou nao autenticado, mostra loading
  if (status !== "authenticated") {
    return loadingComponent ? loadingComponent : <DefaultLoading />;
  }

  // Usuario autenticado - renderiza conteudo
  return <>{children}</>;
}

export default ProtectedContent;
