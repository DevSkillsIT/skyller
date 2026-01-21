"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Tipo de usuario autenticado (client-safe, sem dependencia de next/headers)
 */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  tenant_id: string;
  tenant_name?: string;
  roles: string[];
  permissions?: string[];
}

/**
 * Roles disponiveis no sistema
 */
export type UserRole = "admin" | "manager" | "user" | "viewer" | "tenant-admin" | "super-admin";

import { cn } from "@/lib/utils";

/**
 * Props para o componente AuthGuard
 */
export interface AuthGuardProps {
  /** Conteudo a ser protegido */
  children: React.ReactNode;
  /** Usuario autenticado (passado do server component pai) */
  user?: AuthUser | null;
  /** Roles requeridas (qualquer uma das roles) */
  requiredRoles?: UserRole[];
  /** Componente de fallback quando nao autorizado */
  fallback?: React.ReactNode;
  /** URL de redirect quando nao autenticado */
  redirectTo?: string;
  /** Exibir loading durante verificacao */
  showLoading?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de fallback padrao para acesso negado
 */
function DefaultUnauthorizedFallback({
  onGoBack,
  onGoHome,
}: {
  onGoBack: () => void;
  onGoHome: () => void;
}) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <CardTitle>Acesso Negado</CardTitle>
        <CardDescription>
          Voce nao tem permissao para acessar este recurso. Entre em contato com o administrador se
          acredita que isso e um erro.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-2">
        <Button variant="outline" onClick={onGoBack}>
          Voltar
        </Button>
        <Button onClick={onGoHome}>Ir para Inicio</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de loading padrao
 */
function DefaultLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Verificando permissoes...</span>
    </div>
  );
}

/**
 * Guard de autenticacao e autorizacao
 *
 * Componente cliente que protege conteudo baseado em:
 * - Autenticacao: verifica se o usuario esta logado
 * - Autorizacao: verifica se o usuario tem as roles necessarias
 *
 * @example
 * // Proteger conteudo para usuarios autenticados
 * <AuthGuard user={user}>
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * @example
 * // Proteger conteudo para admins
 * <AuthGuard user={user} requiredRoles={["admin", "super-admin"]}>
 *   <AdminPanel />
 * </AuthGuard>
 *
 * @example
 * // Com fallback customizado
 * <AuthGuard
 *   user={user}
 *   requiredRoles={["manager"]}
 *   fallback={<UpgradePrompt />}
 * >
 *   <ManagerDashboard />
 * </AuthGuard>
 *
 * @example
 * // Com redirect automatico
 * <AuthGuard
 *   user={user}
 *   redirectTo="/api/auth/login"
 * >
 *   <ProtectedPage />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  user,
  requiredRoles,
  fallback,
  redirectTo,
  showLoading = true,
  className,
}: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = () => {
      // Se nao temos usuario, nao esta autorizado
      if (!user) {
        if (redirectTo) {
          router.push(redirectTo);
          return;
        }
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Se nao requer roles especificas, apenas autenticacao
      if (!requiredRoles || requiredRoles.length === 0) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Verificar se usuario tem alguma das roles requeridas (verificacao local)
      const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

      if (!hasRequiredRole) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuthorization();
  }, [user, requiredRoles, redirectTo, router]);

  // Exibir loading durante verificacao
  if (isChecking && showLoading) {
    return <DefaultLoading />;
  }

  // Usuario nao autenticado (sem redirect)
  if (!user) {
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }

    return (
      <div className={cn("p-4", className)}>
        <DefaultUnauthorizedFallback
          onGoBack={() => router.back()}
          onGoHome={() => router.push("/")}
        />
      </div>
    );
  }

  // Usuario autenticado mas nao autorizado
  if (!isAuthorized) {
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }

    return (
      <div className={cn("p-4", className)}>
        <DefaultUnauthorizedFallback
          onGoBack={() => router.back()}
          onGoHome={() => router.push("/")}
        />
      </div>
    );
  }

  // Usuario autorizado - renderizar conteudo
  return <div className={className}>{children}</div>;
}

export default AuthGuard;
