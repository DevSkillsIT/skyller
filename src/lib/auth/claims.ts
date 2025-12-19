/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * T018: Parser de claims JWT do Keycloak
 *
 * Utilitários para extrair e validar claims do JWT retornado pelo Keycloak
 */

/**
 * Interface dos claims esperados no JWT do Keycloak
 */
export interface KeycloakClaims {
  // Claims padrão OIDC
  sub: string // ID único do usuário
  preferred_username: string // Username do usuário
  email: string // Email do usuário
  email_verified?: boolean // Se o email foi verificado
  name?: string // Nome completo

  // Claims do Keycloak
  realm_access: {
    roles: string[] // Roles do realm
  }
  resource_access?: {
    [client: string]: {
      roles: string[] // Roles específicas do client
    }
  }

  // Claims customizados (configurados no Keycloak Mapper)
  groups: string[] // Grupos do usuário (ex: ["/TI/Suporte", "/TI/Infraestrutura"])
  tenant_id: string // Tenant do usuário (ex: "skills-it")
  department?: string // Departamento (custom claim opcional)

  // Claims de controle
  iat: number // Issued at timestamp
  exp: number // Expiration timestamp
  iss: string // Issuer (URL do Keycloak)
  aud: string | string[] // Audience
}

/**
 * Decodifica um JWT sem validar a assinatura
 * ATENÇÃO: Use apenas para debug ou em contextos onde a validação já foi feita
 *
 * @param token - JWT token string
 * @returns Payload decodificado
 * @throws Error se o token for inválido
 */
export function decodeJwt(token: string): Record<string, any> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      throw new Error("Token JWT inválido: formato incorreto")
    }

    const payload = parts[1]
    const decoded = Buffer.from(payload, "base64").toString("utf-8")
    return JSON.parse(decoded)
  } catch (error) {
    throw new Error(
      `Erro ao decodificar JWT: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    )
  }
}

/**
 * Parseia claims do Keycloak a partir de um JWT token
 *
 * @param token - JWT token string do Keycloak
 * @returns Claims tipados do Keycloak
 * @throws Error se o token for inválido ou faltar claims obrigatórios
 */
export function parseJwtClaims(token: string): KeycloakClaims {
  const decoded = decodeJwt(token)

  // Validação de claims obrigatórios
  if (!decoded.sub) {
    throw new Error("Claim 'sub' (user ID) não encontrado no token")
  }
  if (!decoded.preferred_username) {
    throw new Error("Claim 'preferred_username' não encontrado no token")
  }
  if (!decoded.email) {
    throw new Error("Claim 'email' não encontrado no token")
  }

  return {
    sub: decoded.sub,
    preferred_username: decoded.preferred_username,
    email: decoded.email,
    email_verified: decoded.email_verified,
    name: decoded.name,
    realm_access: decoded.realm_access || { roles: [] },
    resource_access: decoded.resource_access,
    groups: decoded.groups || [],
    tenant_id: decoded.tenant_id || extractTenantFromIssuer(decoded.iss),
    department: decoded.department,
    iat: decoded.iat,
    exp: decoded.exp,
    iss: decoded.iss,
    aud: decoded.aud,
  }
}

/**
 * Extrai tenant_id do issuer (URL do realm)
 * Formato esperado: https://idp.servidor.one/realms/{tenant_id}
 */
function extractTenantFromIssuer(issuer: string): string {
  try {
    const match = issuer.match(/\/realms\/([^/]+)/)
    return match ? match[1] : "skills-it"
  } catch {
    return "skills-it"
  }
}

/**
 * Verifica se o token está expirado
 *
 * @param claims - Claims do JWT
 * @returns true se o token expirou
 */
export function isTokenExpired(claims: KeycloakClaims): boolean {
  const now = Math.floor(Date.now() / 1000)
  return claims.exp < now
}

/**
 * Extrai roles do realm do token
 *
 * @param claims - Claims do JWT
 * @returns Array de roles do realm
 */
export function extractRealmRoles(claims: KeycloakClaims): string[] {
  return claims.realm_access?.roles || []
}

/**
 * Extrai roles de um client específico
 *
 * @param claims - Claims do JWT
 * @param clientId - ID do client (ex: "skyller")
 * @returns Array de roles do client
 */
export function extractClientRoles(
  claims: KeycloakClaims,
  clientId: string,
): string[] {
  return claims.resource_access?.[clientId]?.roles || []
}

/**
 * Verifica se o usuário tem uma role específica (realm ou client)
 *
 * @param claims - Claims do JWT
 * @param role - Nome da role
 * @param clientId - ID do client (opcional, se omitido busca apenas no realm)
 * @returns true se o usuário tem a role
 */
export function hasRole(
  claims: KeycloakClaims,
  role: string,
  clientId?: string,
): boolean {
  const realmRoles = extractRealmRoles(claims)
  if (realmRoles.includes(role)) {
    return true
  }

  if (clientId) {
    const clientRoles = extractClientRoles(claims, clientId)
    return clientRoles.includes(role)
  }

  return false
}

/**
 * Formata grupos para envio ao backend (comma-separated)
 *
 * @param groups - Array de grupos
 * @returns String no formato "group1,group2,group3"
 */
export function formatGroupsForHeader(groups: string[]): string {
  return groups.join(",")
}
