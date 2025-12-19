/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * Extensões de tipos para NextAuth v5 com suporte a Keycloak
 */

import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  /**
   * Interface estendida de User incluindo dados do Keycloak
   */
  interface User {
    id: string
    email: string
    name?: string
    groups?: string[]
    tenantId?: string
    roles?: string[]
    department?: string
  }

  /**
   * Interface estendida de Session incluindo tenant e grupos
   */
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      groups: string[]
      tenantId: string
      roles: string[]
      department?: string
    }
    accessToken: string
  }
}

declare module "next-auth/jwt" {
  /**
   * Interface estendida de JWT Token
   */
  interface JWT {
    accessToken?: string
    groups?: string[]
    tenantId?: string
    roles?: string[]
    department?: string
  }
}
