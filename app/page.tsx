import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HomeClient } from "@/components/home-client";

/**
 * Forca renderizacao dinamica no servidor
 * Isso garante que a verificacao de sessao acontece ANTES de enviar HTML
 */
export const dynamic = "force-dynamic";

/**
 * Pagina Home protegida por autenticacao (Server Component)
 *
 * A verificacao de sessao acontece no servidor, antes de qualquer
 * HTML ser enviado ao cliente. Isso elimina o flash de conteudo.
 */
export default async function Home() {
  const session = await auth();

  // WHITE-LABEL: Redirect direto para /api/auth/login
  // que faz signIn automatico no Keycloak sem pagina intermediaria
  if (!session?.user) {
    redirect("/api/auth/login");
  }

  // Usuario autenticado - renderiza o cliente
  return <HomeClient />;
}
