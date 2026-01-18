/**
 * Type Augmentation para NextAuth (Auth.js v5)
 *
 * Este arquivo estende os tipos padrao do NextAuth para incluir
 * claims customizados do Keycloak utilizados pelo Skyller.
 *
 * IMPORTANTE: Este arquivo usa "module augmentation" do TypeScript,
 * estendendo os tipos originais sem sobrescreve-los.
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.6
 */

import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

/**
 * Claims customizados do Keycloak presentes no token JWT
 */
interface KeycloakClaims {
  /** ID unico do tenant no sistema */
  tenant_id: string;
  /** Slug do tenant para URLs (ex: "ramada", "wink") */
  tenant_slug: string;
  /** Nome amigavel do tenant para exibicao */
  tenant_name: string;
  /** Organizations (Keycloak Organizations) - array de aliases (ex: ["skills", "ramada"]) */
  organization: string[];
  /** Grupos do usuario no Keycloak (ex: ["/MCP/whm", "/Admin"]) */
  groups: string[];
  /** Roles do usuario (realm + client roles combinadas) */
  roles: string[];
  /** Departamento do usuario (sincronizado do Active Directory) */
  department: string;
  /** Empresa do usuario (sincronizado do Active Directory) */
  company: string;
  /** Identificador do client OAuth utilizado (skyller ou nexus-admin) */
  clientId: string;
}

declare module "next-auth" {
  /**
   * Interface Session estendida com dados do usuario do Keycloak
   *
   * Acessivel via:
   * - Server Components: await auth()
   * - Client Components: useSession()
   */
  interface Session {
    user: {
      /** ID unico do usuario (sub claim) */
      id: string;
      /** ID do tenant */
      tenant_id: string;
      /** Slug do tenant */
      tenant_slug: string;
      /** Nome do tenant */
      tenant_name: string;
      /** Organizations (Keycloak Organizations) - array de aliases */
      organization: string[];
      /** Grupos do Keycloak */
      groups: string[];
      /** Roles combinadas (realm + client) */
      roles: string[];
      /** Departamento (AD) */
      department: string;
      /** Empresa (AD) */
      company: string;
      /** Client OAuth utilizado */
      clientId: string;
    } & DefaultSession["user"];

    /** Access token para chamadas ao backend (BFF pattern) */
    accessToken?: string;

    /** Erro de autenticacao, se houver */
    error?: string;
  }

  /**
   * Interface User estendida com claims do Keycloak
   *
   * Usada durante o processo de autenticacao antes de
   * popular a session.
   */
  interface User extends DefaultUser {
    /** ID do tenant */
    tenant_id?: string;
    /** Slug do tenant */
    tenant_slug?: string;
    /** Nome do tenant */
    tenant_name?: string;
    /** Organizations (Keycloak Organizations) - array de aliases */
    organization?: string[];
    /** Grupos do Keycloak */
    groups?: string[];
    /** Roles do usuario */
    roles?: string[];
    /** Departamento */
    department?: string;
    /** Empresa */
    company?: string;
    /** Client OAuth */
    clientId?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Interface JWT estendida para armazenar claims entre requests
   *
   * O JWT e armazenado em cookie e usado para reconstruir
   * a session em cada request.
   */
  interface JWT extends DefaultJWT {
    /** ID do tenant */
    tenant_id?: string;
    /** Slug do tenant */
    tenant_slug?: string;
    /** Nome do tenant */
    tenant_name?: string;
    /** Organizations (Keycloak Organizations) - array de aliases */
    organization?: string[];
    /** Grupos do Keycloak */
    groups?: string[];
    /** Roles do usuario */
    roles?: string[];
    /** Departamento */
    department?: string;
    /** Empresa */
    company?: string;
    /** Client OAuth utilizado */
    clientId?: string;
    /** Access token para API calls */
    accessToken?: string;
    /** Refresh token para renovacao */
    refreshToken?: string;
    /** Timestamp de expiracao do access token */
    expiresAt?: number;
    /** Erro de autenticacao/refresh */
    error?: string;
  }
}

/**
 * Interface para o token decodificado do Keycloak
 * Usado na extracao de claims do access_token
 */
export interface KeycloakToken {
  /** Subject (ID do usuario) */
  sub: string;
  /** Email do usuario */
  email?: string;
  /** Nome de usuario preferido */
  preferred_username?: string;
  /** Nome completo */
  name?: string;
  /** ID do tenant customizado */
  tenant_id?: string;
  /** Slug do tenant */
  tenant_slug?: string;
  /** Nome do tenant */
  tenant_name?: string;
  /** Organizations (Keycloak Organizations) - array de aliases */
  organization?: string[];
  /** Grupos do usuario */
  groups?: string[];
  /** Departamento */
  department?: string;
  /** Empresa */
  company?: string;
  /** Acesso a recursos por client */
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
  /** Roles do realm */
  realm_access?: {
    roles: string[];
  };
  /** Timestamp de expiracao */
  exp?: number;
  /** Timestamp de emissao */
  iat?: number;
}
