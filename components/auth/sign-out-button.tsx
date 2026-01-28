"use client";

import { Loader2, LogOut } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOutFromKeycloak } from "@/lib/auth/actions/sign-out";
import { cn } from "@/lib/utils";

/**
 * Props para o componente SignOutButton
 */
export interface SignOutButtonProps {
  /** URL de callback apos logout */
  callbackUrl?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Conteudo customizado do botao */
  children?: React.ReactNode;
  /** Variante visual do botao */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Tamanho do botao */
  size?: "default" | "sm" | "lg" | "icon";
  /** Exibir confirmacao antes de sair */
  showConfirmation?: boolean;
}

/**
 * Botao de Sign-Out com integracao Keycloak
 *
 * Componente cliente que realiza o logout completo,
 * invalidando a sessao tanto no NextAuth quanto no Keycloak.
 *
 * @example
 * // Uso basico
 * <SignOutButton />
 *
 * @example
 * // Com callback customizado
 * <SignOutButton callbackUrl="/goodbye">
 *   Sair da conta
 * </SignOutButton>
 *
 * @example
 * // Estilo ghost para menus
 * <SignOutButton
 *   variant="ghost"
 *   size="sm"
 *   className="w-full justify-start"
 * />
 */
export function SignOutButton({
  callbackUrl = "/",
  className,
  children,
  variant = "ghost",
  size = "default",
  showConfirmation = false,
}: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    if (showConfirmation) {
      const confirmed = window.confirm("Tem certeza que deseja sair?");
      if (!confirmed) return;
    }

    startTransition(async () => {
      await signOutFromKeycloak(callbackUrl);
    });
  };

  return (
    <Button
      type="button"
      onClick={handleSignOut}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      disabled={isPending}
      aria-label={isPending ? "Saindo..." : "Sair da plataforma"}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Saindo...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{children || "Sair"}</span>
        </>
      )}
    </Button>
  );
}

export default SignOutButton;
