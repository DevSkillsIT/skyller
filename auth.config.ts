/**
 * Auth.js Edge-Compatible Configuration - Multi-Tenant
 *
 * @description Configuration that can be used in Edge Runtime (middleware).
 * Registers ALL tenant providers for multi-tenant authentication.
 *
 * Based on SPEC-SKYLLER-ADMIN-001 Section 6.6
 * @see KEYCLOAK-MULTI-TENANT-AD.md
 */

import type { NextAuthConfig } from "next-auth";
import {
  createAllKeycloakProviders,
  createKeycloakProvider,
} from "@/lib/auth/providers/keycloak-factory";

/**
 * Auth.js configuration for Edge runtime compatibility.
 *
 * Registers providers for ALL tenants:
 * - keycloak-skills
 * - keycloak-ramada
 * - keycloak-lindacor
 * - keycloak-wga
 * - keycloak-grupowink
 * - keycloak-gsantoexpedito
 * - keycloak-servcont
 * - nexus-admin (platform admin)
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // Todos os providers de tenant (7 tenants)
    ...createAllKeycloakProviders(),
    // Client para administradores da plataforma
    createKeycloakProvider("nexus-admin"),
  ],

  pages: {
    // WHITE-LABEL: /auth/signin redireciona para /api/auth/login
    // que faz signIn direto no Keycloak. Pagina existe apenas para erros.
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Trust reverse proxy headers for HTTPS
  trustHost: true,

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Cookie configuration for multi-tenant
  // IMPORTANTE: NAO definir 'domain' para garantir que cookies sejam
  // especificos por hostname (skills.skyller.ai vs wga.skyller.ai)
  // Isso permite multiplos tenants no mesmo navegador sem conflito.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // NAO definir domain - sera especifico do hostname
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.callback-url"
          : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.pkce.code_verifier"
          : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes (OAuth flow timeout)
      },
    },
    state: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.state"
          : "authjs.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes (OAuth flow timeout)
      },
    },
    nonce: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.nonce"
          : "authjs.nonce",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export default authConfig;
