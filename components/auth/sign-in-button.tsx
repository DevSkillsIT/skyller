"use client";

import { Loader2, LogIn } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signInWithKeycloak, type ClientKey } from "@/lib/auth/actions/sign-in";
import { cn } from "@/lib/utils";

/**
 * Props para o componente SignInButton
 */
export interface SignInButtonProps {
  /** Cliente Keycloak a ser usado para autenticacao (obrigatorio) */
  clientKey: ClientKey;
  /** URL de callback apos login bem-sucedido */
  callbackUrl?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Conteudo customizado do botao */
  children?: React.ReactNode;
  /** Variante visual do botao */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Tamanho do botao */
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Botao de Sign-In com integracao Keycloak
 *
 * Componente cliente que inicia o fluxo de autenticacao OAuth
 * via server action. Exibe estado de loading durante o redirect.
 *
 * @example
 * // Uso basico
 * <SignInButton />
 *
 * @example
 * // Com client especifico e callback
 * <SignInButton
 *   clientKey="nexus-admin"
 *   callbackUrl="/dashboard"
 * >
 *   Entrar como Admin
 * </SignInButton>
 *
 * @example
 * // Estilo customizado
 * <SignInButton
 *   variant="outline"
 *   size="lg"
 *   className="w-full"
 * />
 */
export function SignInButton({
  clientKey,
  callbackUrl,
  className,
  children,
  variant = "default",
  size = "default",
}: SignInButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignIn = () => {
    startTransition(async () => {
      await signInWithKeycloak(clientKey, callbackUrl);
    });
  };

  return (
    <form action={handleSignIn}>
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        disabled={isPending}
        aria-label={isPending ? "Entrando..." : "Entrar na plataforma"}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Entrando...</span>
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{children || "Entrar"}</span>
          </>
        )}
      </Button>
    </form>
  );
}

export default SignInButton;
