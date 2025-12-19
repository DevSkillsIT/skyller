/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * T019: Hook useIdentity para extrair tenant/user/groups da sessão
 *
 * Hook React para componentes Client-Side obterem dados de identidade
 * do usuário autenticado via Keycloak.
 */

"use client"

import { useSession } from "next-auth/react"

/**
 * Interface de retorno do hook useIdentity
 */
export interface Identity {
  /** ID do tenant (realm do Keycloak) */
  tenantId: string | null
  /** ID único do usuário (sub do JWT) */
  userId: string | null
  /** Email do usuário */
  email: string | null
  /** Nome do usuário */
  name: string | null
  /** Grupos do usuário (ex: ["/TI/Suporte", "/TI/Infraestrutura"]) */
  groups: string[]
  /** Roles do realm (ex: ["operator", "agent-manager"]) */
  roles: string[]
  /** Departamento (custom claim) */
  department: string | null
  /** Se o usuário está autenticado */
  isAuthenticated: boolean
  /** Se a sessão está carregando */
  isLoading: boolean
}

/**
 * Hook para obter dados de identidade do usuário autenticado
 *
 * @returns Objeto Identity com dados do usuário
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const identity = useIdentity()
 *
 *   if (identity.isLoading) {
 *     return <div>Carregando...</div>
 *   }
 *
 *   if (!identity.isAuthenticated) {
 *     return <div>Não autenticado</div>
 *   }
 *
 *   return (
 *     <div>
 *       <p>Tenant: {identity.tenantId}</p>
 *       <p>User: {identity.email}</p>
 *       <p>Groups: {identity.groups.join(", ")}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useIdentity(): Identity {
  const { data: session, status } = useSession()

  return {
    tenantId: session?.user?.tenantId || null,
    userId: session?.user?.id || null,
    email: session?.user?.email || null,
    name: session?.user?.name || null,
    groups: session?.user?.groups || [],
    roles: session?.user?.roles || [],
    department: session?.user?.department || null,
    isAuthenticated: !!session,
    isLoading: status === "loading",
  }
}

/**
 * Hook derivado para verificar se usuário tem uma role específica
 *
 * @param role - Nome da role a verificar
 * @returns true se o usuário tem a role
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasRole("admin")
 *
 *   if (!isAdmin) {
 *     return <div>Acesso negado</div>
 *   }
 *
 *   return <div>Painel Admin</div>
 * }
 * ```
 */
export function useHasRole(role: string): boolean {
  const identity = useIdentity()
  return identity.roles.includes(role)
}

/**
 * Hook derivado para verificar se usuário pertence a um grupo
 *
 * @param group - Nome do grupo (ex: "/TI/Suporte")
 * @returns true se o usuário pertence ao grupo
 *
 * @example
 * ```tsx
 * function SupportPanel() {
 *   const isSupportMember = useIsInGroup("/TI/Suporte")
 *
 *   if (!isSupportMember) {
 *     return <div>Acesso negado</div>
 *   }
 *
 *   return <div>Painel Suporte</div>
 * }
 * ```
 */
export function useIsInGroup(group: string): boolean {
  const identity = useIdentity()
  return identity.groups.includes(group)
}
