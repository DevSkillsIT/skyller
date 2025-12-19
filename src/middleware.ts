/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * T017: Middleware de proteção de rotas com NextAuth v5
 *
 * Este middleware protege todas as rotas da aplicação,
 * redirecionando usuários não autenticados para o login Keycloak.
 */

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Middleware de autenticação NextAuth v5
 * - Protege todas as rotas exceto /api/auth/*
 * - Redireciona para Keycloak se não autenticado
 */
export default auth((req) => {
  const { auth: session, nextUrl } = req

  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    "/api/auth",
    "/_next",
    "/favicon.ico",
    "/icon.png",
    "/health",
  ]

  // Verifica se é rota pública
  const isPublicPath = publicPaths.some(path =>
    nextUrl.pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Se não está autenticado, redireciona para login
  if (!session) {
    const signInUrl = new URL("/api/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Usuário autenticado, continua
  return NextResponse.next()
})

/**
 * Matcher: Define quais rotas o middleware deve processar
 * Exclui arquivos estáticos e imagens para performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Arquivos de imagem (svg, png, jpg, etc)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
