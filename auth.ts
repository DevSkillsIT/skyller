/**
 * Auth.js Main Configuration
 *
 * @description Main authentication configuration with callbacks and events.
 * Exports handlers, auth, signIn, and signOut functions.
 *
 * Based on SPEC-SKYLLER-ADMIN-001 Section 6.6
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { jwtCallback, sessionCallback } from "@/lib/auth/callbacks";

/**
 * NextAuth.js configuration with all callbacks and events.
 *
 * Exports:
 * - handlers: Route handlers for /api/auth/[...nextauth]
 * - auth: Server-side session getter
 * - signIn: Server action for sign-in
 * - signOut: Server action for sign-out
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Callbacks for JWT and session handling
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,

    // Redirect callback para corrigir URL baseada no X-Forwarded-Host
    redirect({ url, baseUrl }) {
      // Se a URL contem localhost, substituir pelo baseUrl correto
      const urlObj = new URL(url, baseUrl);

      // Se for redirect para dominio skyller.ai, permitir
      if (urlObj.hostname.endsWith(".skyller.ai")) {
        return url;
      }

      // Se a URL é relativa ou do mesmo dominio, usar o path
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      return url;
    },

    /**
     * Authorized callback - SEMPRE retorna true.
     *
     * WHITE-LABEL: A verificacao de autenticacao e feita pelo proxy.ts
     * que redireciona para /api/auth/login (signIn direto no Keycloak).
     *
     * NAO usamos o authorized para bloquear porque o NextAuth v5
     * redireciona para /api/auth/signin (pagina padrao) quando retorna false,
     * ignorando a configuracao pages.signIn.
     */
    authorized() {
      // Sempre permite - proxy.ts faz a verificacao
      return true;
    },
  },

  // Events for logging and side effects
  events: {
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Auth] ${profile?.preferred_username || user.email} logged in via ${account?.provider}`
        );
      }
    },
    async signOut(message) {
      if (process.env.NODE_ENV === "development") {
        const token = "token" in message ? message.token : null;
        const email = (token as { email?: string } | null)?.email || "unknown";
        console.log(`[Auth] User ${email} signed out`);
      }
    },
    async session({ session }) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auth] Session accessed for ${session.user?.email}`);
      }
    },
  },
});
