/**
 * Auth.js Edge-Compatible Configuration - Single Realm Multi-Organization
 *
 * @description Configuration for single-realm multi-organization architecture.
 * Uses Keycloak 26 Organizations feature with only 2 static providers.
 *
 * Based on SPEC-ORGS-001
 */

import type { NextAuthConfig } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

/**
 * Auth.js configuration for Edge runtime compatibility.
 *
 * Single realm "skyller" with Organizations:
 * - keycloak-skyller: Provider principal para usuarios
 * - keycloak-admin: Provider para administradores da plataforma
 */
export const authConfig: NextAuthConfig = {
  providers: [
    KeycloakProvider({
      id: "keycloak-skyller",
      name: "Skyller",
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: { params: { scope: "openid email profile organization" } },
    }),
    KeycloakProvider({
      id: "keycloak-admin",
      name: "Admin",
      clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: { params: { scope: "openid email profile organization" } },
    }),
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
        process.env.NODE_ENV === "production" ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
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
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.state" : "authjs.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes (OAuth flow timeout)
      },
    },
    nonce: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.nonce" : "authjs.nonce",
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
