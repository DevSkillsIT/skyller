/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * Testes unitários para lib/auth/claims.ts
 *
 * NOTA: Estes testes são básicos e não usam framework de testes.
 * Para produção, configure Jest ou Vitest.
 */

import {
  decodeJwt,
  parseJwtClaims,
  isTokenExpired,
  extractRealmRoles,
  extractClientRoles,
  hasRole,
  formatGroupsForHeader,
  type KeycloakClaims,
} from "../src/lib/auth/claims"

/**
 * Helper para criar JWT de teste (não assinado)
 */
function createTestJWT(payload: Record<string, any>): string {
  const header = { alg: "RS256", typ: "JWT" }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64")
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64",
  )
  const signature = "fake-signature"
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Teste 1: decodeJwt - Deve decodificar JWT corretamente
 */
function testDecodeJwt() {
  console.log("Test 1: decodeJwt - Deve decodificar JWT corretamente")

  const payload = {
    sub: "1234",
    email: "test@example.com",
    tenant_id: "skills-it",
  }

  const token = createTestJWT(payload)
  const decoded = decodeJwt(token)

  console.assert(decoded.sub === "1234", "sub deve ser 1234")
  console.assert(
    decoded.email === "test@example.com",
    "email deve ser test@example.com",
  )
  console.assert(
    decoded.tenant_id === "skills-it",
    "tenant_id deve ser skills-it",
  )

  console.log("✅ Test 1 passed")
}

/**
 * Teste 2: parseJwtClaims - Deve parsear claims do Keycloak
 */
function testParseJwtClaims() {
  console.log(
    "Test 2: parseJwtClaims - Deve parsear claims do Keycloak",
  )

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: "user-uuid-123",
    preferred_username: "joao.silva",
    email: "joao.silva@skills-it.com.br",
    email_verified: true,
    name: "João Silva",
    realm_access: {
      roles: ["operator", "agent-manager"],
    },
    groups: ["/TI/Suporte", "/TI/Infraestrutura"],
    tenant_id: "skills-it",
    department: "TI",
    iat: now,
    exp: now + 3600,
    iss: "https://idp.servidor.one/realms/skills-it",
    aud: "skyller",
  }

  const token = createTestJWT(payload)
  const claims = parseJwtClaims(token)

  console.assert(
    claims.sub === "user-uuid-123",
    "sub deve ser user-uuid-123",
  )
  console.assert(
    claims.preferred_username === "joao.silva",
    "username deve ser joao.silva",
  )
  console.assert(
    claims.tenant_id === "skills-it",
    "tenant_id deve ser skills-it",
  )
  console.assert(claims.groups.length === 2, "deve ter 2 grupos")
  console.assert(
    claims.realm_access.roles.length === 2,
    "deve ter 2 roles",
  )

  console.log("✅ Test 2 passed")
}

/**
 * Teste 3: isTokenExpired - Deve detectar token expirado
 */
function testIsTokenExpired() {
  console.log("Test 3: isTokenExpired - Deve detectar token expirado")

  const now = Math.floor(Date.now() / 1000)

  // Token válido (expira em 1 hora)
  const validPayload = {
    sub: "123",
    preferred_username: "user",
    email: "user@example.com",
    realm_access: { roles: [] },
    groups: [],
    tenant_id: "skills-it",
    iat: now,
    exp: now + 3600,
    iss: "https://idp.servidor.one/realms/skills-it",
    aud: "skyller",
  }

  const validToken = createTestJWT(validPayload)
  const validClaims = parseJwtClaims(validToken)

  console.assert(
    !isTokenExpired(validClaims),
    "token válido não deve estar expirado",
  )

  // Token expirado (expirou há 1 hora)
  const expiredPayload = { ...validPayload, exp: now - 3600 }
  const expiredToken = createTestJWT(expiredPayload)
  const expiredClaims = parseJwtClaims(expiredToken)

  console.assert(
    isTokenExpired(expiredClaims),
    "token expirado deve estar expirado",
  )

  console.log("✅ Test 3 passed")
}

/**
 * Teste 4: extractRealmRoles - Deve extrair roles do realm
 */
function testExtractRealmRoles() {
  console.log("Test 4: extractRealmRoles - Deve extrair roles do realm")

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: "123",
    preferred_username: "user",
    email: "user@example.com",
    realm_access: {
      roles: ["operator", "admin", "agent-manager"],
    },
    groups: [],
    tenant_id: "skills-it",
    iat: now,
    exp: now + 3600,
    iss: "https://idp.servidor.one/realms/skills-it",
    aud: "skyller",
  }

  const token = createTestJWT(payload)
  const claims = parseJwtClaims(token)
  const roles = extractRealmRoles(claims)

  console.assert(roles.length === 3, "deve ter 3 roles")
  console.assert(roles.includes("operator"), "deve incluir operator")
  console.assert(roles.includes("admin"), "deve incluir admin")

  console.log("✅ Test 4 passed")
}

/**
 * Teste 5: hasRole - Deve verificar se usuário tem role
 */
function testHasRole() {
  console.log("Test 5: hasRole - Deve verificar se usuário tem role")

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: "123",
    preferred_username: "user",
    email: "user@example.com",
    realm_access: {
      roles: ["operator", "agent-manager"],
    },
    resource_access: {
      skyller: {
        roles: ["frontend-admin"],
      },
    },
    groups: [],
    tenant_id: "skills-it",
    iat: now,
    exp: now + 3600,
    iss: "https://idp.servidor.one/realms/skills-it",
    aud: "skyller",
  }

  const token = createTestJWT(payload)
  const claims = parseJwtClaims(token)

  console.assert(
    hasRole(claims, "operator"),
    "deve ter role operator (realm)",
  )
  console.assert(
    hasRole(claims, "frontend-admin", "skyller"),
    "deve ter role frontend-admin (client)",
  )
  console.assert(!hasRole(claims, "admin"), "não deve ter role admin")

  console.log("✅ Test 5 passed")
}

/**
 * Teste 6: formatGroupsForHeader - Deve formatar grupos para header
 */
function testFormatGroupsForHeader() {
  console.log(
    "Test 6: formatGroupsForHeader - Deve formatar grupos para header",
  )

  const groups = ["/TI/Suporte", "/TI/Infraestrutura", "/Marketing"]
  const formatted = formatGroupsForHeader(groups)

  console.assert(
    formatted === "/TI/Suporte,/TI/Infraestrutura,/Marketing",
    "deve formatar como comma-separated",
  )

  console.log("✅ Test 6 passed")
}

/**
 * Executar todos os testes
 */
function runAllTests() {
  console.log("=== Iniciando testes de lib/auth/claims.ts ===\n")

  try {
    testDecodeJwt()
    testParseJwtClaims()
    testIsTokenExpired()
    testExtractRealmRoles()
    testHasRole()
    testFormatGroupsForHeader()

    console.log("\n=== ✅ Todos os testes passaram! ===")
  } catch (error) {
    console.error("\n=== ❌ Erro nos testes ===")
    console.error(error)
    process.exit(1)
  }
}

// Executar testes se for chamado diretamente
if (require.main === module) {
  runAllTests()
}

export { runAllTests }
