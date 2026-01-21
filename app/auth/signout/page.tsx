import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sair | Skyller",
  description: "Confirmacao de logout da plataforma Skyller",
};

/**
 * Props da pagina
 */
interface SignOutPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

/**
 * Pagina de confirmacao de Sign-Out
 *
 * Features:
 * - Confirmacao visual antes de sair
 * - Exibe informacoes do usuario atual
 * - Opcao de cancelar e voltar
 * - Redirect apos logout
 */
export default async function SignOutPage({ searchParams }: SignOutPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  // Se nao esta logado, redirecionar para home
  if (!session?.user) {
    redirect("/");
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Branding */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Skyller</h1>
        </div>

        {/* Card de Logout */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LogOut className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <CardTitle>Sair da sua conta?</CardTitle>
            <CardDescription>
              Voce esta prestes a encerrar sua sessao na plataforma Skyller.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Info do Usuario */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Aviso */}
            <p className="text-center text-sm text-muted-foreground">
              Voce precisara fazer login novamente para acessar seus projetos e agentes.
            </p>
          </CardContent>

          <CardFooter className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/">Cancelar</Link>
            </Button>

            <SignOutButton callbackUrl={callbackUrl} variant="destructive" className="flex-1">
              Sair
            </SignOutButton>
          </CardFooter>
        </Card>

        {/* Link de Ajuda */}
        <p className="text-center text-sm text-muted-foreground">
          Precisa de ajuda?{" "}
          <Link
            href="/support"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            Entre em contato com o suporte
          </Link>
        </p>
      </div>
    </div>
  );
}
