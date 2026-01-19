import { auth } from "@/auth";
import { cn } from "@/lib/utils";

import { SignInButton } from "./sign-in-button";
import { UserMenu } from "./user-menu";

/**
 * Props para o componente AuthStatus
 */
export interface AuthStatusProps {
  /** Classes CSS adicionais */
  className?: string;
  /** Mostrar badge do tenant no UserMenu */
  showTenantBadge?: boolean;
  /** Mostrar indicador de role no UserMenu */
  showRoleIndicator?: boolean;
}

/**
 * Componente de status de autenticacao para header
 *
 * Server Component que verifica a sessao atual e renderiza:
 * - SignInButton quando nao autenticado
 * - UserMenu quando autenticado
 *
 * @example
 * // No header da aplicacao
 * <header className="flex items-center justify-between">
 *   <Logo />
 *   <AuthStatus />
 * </header>
 *
 * @example
 * // Com customizacao
 * <AuthStatus
 *   showTenantBadge
 *   showRoleIndicator
 *   className="ml-auto"
 * />
 */
export async function AuthStatus({
  className,
  showTenantBadge = true,
  showRoleIndicator = true,
}: AuthStatusProps) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className={cn("flex items-center", className)}>
        <SignInButton variant="default" size="sm" />
      </div>
    );
  }

  // Mapear campos da sessao para o formato AuthUser
  // Usar type assertion via unknown para evitar erros de TypeScript
  const sessionUser = session.user as unknown as {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    tenant_id?: string;
    tenant_name?: string;
    tenant_slug?: string;
    groups?: string[];
    roles?: string[];
    department?: string;
    company?: string;
    clientId?: string;
  };

  const user = {
    id: sessionUser.id || "",
    name: sessionUser.name || "Usuario",
    email: sessionUser.email || "",
    image: sessionUser.image,
    tenant_id: sessionUser.tenant_id || "default",
    tenant_name: sessionUser.tenant_name || "Default",
    tenant_slug: sessionUser.tenant_slug || "default",
    groups: sessionUser.groups || [],
    roles: sessionUser.roles || [],
    department: sessionUser.department || "",
    company: sessionUser.company || "",
    clientId: sessionUser.clientId || "skyller",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <UserMenu
        user={user}
        showTenantBadge={showTenantBadge}
        showRoleIndicator={showRoleIndicator}
      />
    </div>
  );
}

export default AuthStatus;
