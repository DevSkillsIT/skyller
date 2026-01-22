import { redirect } from "next/navigation";

/**
 * Pagina de Signin - REDIRECT IMEDIATO
 * NAO RENDERIZA NADA - apenas redireciona para /api/auth/login
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  // SEMPRE redireciona - NUNCA renderiza UI
  redirect(`/api/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
