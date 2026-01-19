"use client";

import { Building2, ChevronDown, LogOut, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutFromKeycloak } from "@/lib/auth/actions/sign-out";
import type { AuthUser } from "@/components/auth/auth-guard";
import { cn } from "@/lib/utils";

/**
 * Props para o componente UserMenu
 */
export interface UserMenuProps {
  /** Usuario autenticado */
  user: AuthUser;
  /** Classes CSS adicionais */
  className?: string;
  /** Mostrar badge do tenant */
  showTenantBadge?: boolean;
  /** Mostrar indicador de role */
  showRoleIndicator?: boolean;
}

/**
 * Obtem as iniciais do nome do usuario
 */
function getInitials(name: string | null): string {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Obtem a role principal do usuario para exibicao
 */
function getPrimaryRole(roles: string[]): string | null {
  const roleOrder = ["super-admin", "admin", "tenant-admin", "manager", "user", "viewer"];

  for (const role of roleOrder) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] || null;
}

/**
 * Obtem a cor do badge baseado na role
 */
function getRoleBadgeVariant(
  role: string | null
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (role) {
    case "super-admin":
    case "admin":
      return "destructive";
    case "tenant-admin":
    case "manager":
      return "warning";
    case "user":
      return "success";
    default:
      return "secondary";
  }
}

/**
 * Menu de usuario com dropdown
 *
 * Exibe avatar, nome, email e opcoes do usuario em um dropdown menu.
 * Inclui links para perfil, configuracoes e botao de logout.
 *
 * @example
 * // Uso basico
 * <UserMenu user={session.user} />
 *
 * @example
 * // Com badges de tenant e role
 * <UserMenu
 *   user={session.user}
 *   showTenantBadge
 *   showRoleIndicator
 * />
 */
export function UserMenu({
  user,
  className,
  showTenantBadge = true,
  showRoleIndicator = true,
}: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  const initials = getInitials(user.name);
  const primaryRole = getPrimaryRole(user.roles);
  const roleBadgeVariant = getRoleBadgeVariant(primaryRole);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutFromKeycloak("/");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none",
          "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          "transition-colors",
          className
        )}
        aria-label="Menu do usuario"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || undefined} alt={user.name || "Avatar do usuario"} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden flex-col items-start text-left md:flex">
          <span className="text-sm font-medium leading-none">{user.name}</span>
          {showTenantBadge && user.tenant_name && (
            <span className="text-xs text-muted-foreground">{user.tenant_name}</span>
          )}
        </div>

        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        {(showTenantBadge || showRoleIndicator) && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-wrap gap-1 px-2 py-1.5">
              {showTenantBadge && user.tenant_name && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Building2 className="h-3 w-3" aria-hidden="true" />
                  {user.tenant_name}
                </Badge>
              )}
              {showRoleIndicator && primaryRole && (
                <Badge variant={roleBadgeVariant} className="gap-1 text-xs">
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  {primaryRole}
                </Badge>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex cursor-pointer items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex cursor-pointer items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Configuracoes</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{isPending ? "Saindo..." : "Sair"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
