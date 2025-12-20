/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * T015: Configuração NextAuth v5 com Keycloak provider
 */

import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

/**
 * Extrai tenant_id do issuer URL do Keycloak
 * Formato esperado: https://idp.servidor.one/realms/{tenant_id}
 */
function extractTenantFromIssuer(issuer: string): string {
  try {
    const match = issuer.match(/\/realms\/([^/]+)/)
    return match ? match[1] : "skills-it" // fallback para tenant padrão
  } catch (error) {
    console.error("Erro ao extrair tenant do issuer:", error)
    return "skills-it"
  }
}

/**
 * Configuração do NextAuth v5 com Keycloak
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    /**
     * Callback JWT: Adiciona claims do Keycloak ao token
     */
    jwt: async ({ token, account, profile }) => {
      if (account && profile) {
        // Adiciona access token do Keycloak
        token.accessToken = account.access_token

        // Extrai grupos do profile (Keycloak Group Mapper)
        token.groups = (profile as any).groups || []

        // Extrai tenant_id do profile ou do issuer
        token.tenantId =
          (profile as any).tenant_id ||
          extractTenantFromIssuer(account.provider || "")

        // Extrai roles do realm_access
        const realmAccess = (profile as any).realm_access
        token.roles = realmAccess?.roles || []

        // Extrai department (custom claim, se configurado)
        token.department = (profile as any).department
      }
      return token
    },

    /**
     * Callback Session: Transfere dados do token para a sessão
     */
    session: async ({ session, token }) => {
      // Dados do usuário
      session.user.id = token.sub!
      session.user.groups = (token.groups as string[]) || []
      session.user.tenantId = (token.tenantId as string) || "skills-it"
      session.user.roles = (token.roles as string[]) || []
      session.user.department = token.department as string | undefined

      // Access token para chamadas ao backend
      session.accessToken = (token.accessToken as string) || ""

      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
})
