/**
 * Constantes de Autenticacao e Autorizacao
 *
 * Este arquivo centraliza todas as constantes relacionadas a
 * autenticacao, roles, permissoes e rotas do sistema Skyller.
 *
 * @see SPEC-SKYLLER-ADMIN-001 Secao 6.3 e 6.6
 */

// =============================================================================
// ROTAS PUBLICAS (nao requerem autenticacao)
// =============================================================================

/**
 * Lista de rotas publicas que nao requerem autenticacao.
 * O middleware permite acesso sem sessao ativa.
 */
export const PUBLIC_ROUTES = [
  // WHITE-LABEL: Rotas de auth agora sao tratadas via /api/auth/login
  // A pagina /auth/signin foi removida - redirect direto para Keycloak
  "/auth/signout",
  "/auth/error",
  "/auth/verify-request",
] as const;

/**
 * Prefixos de rotas publicas (match por startsWith)
 */
export const PUBLIC_ROUTE_PREFIXES = [
  "/api/auth", // Todas as rotas de autenticacao do NextAuth
  "/realms", // WHITE-LABEL: Proxy para Keycloak (nginx -> idp.servidor.one)
  "/resources", // WHITE-LABEL: Assets do Keycloak
  "/js", // WHITE-LABEL: JS adapter do Keycloak
  "/api/branding/public", // API de branding publica (logos, cores)
  "/api/health", // Health checks
  "/static", // Arquivos estaticos
  "/public", // Pasta publica
] as const;

/**
 * Verifica se uma rota e publica
 *
 * @param pathname - Caminho da rota a verificar
 * @returns true se a rota for publica
 */
export function isPublicRoute(pathname: string): boolean {
  // Verificar rotas exatas
  if ((PUBLIC_ROUTES as readonly string[]).includes(pathname)) {
    return true;
  }

  // Verificar prefixos
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// ROTAS PROTEGIDAS (patterns)
// =============================================================================

/**
 * Patterns de rotas protegidas que requerem autenticacao.
 * Usados para validacao adicional alem do middleware.
 */
export const PROTECTED_ROUTE_PATTERNS = [
  "/dashboard", // Area principal do usuario
  "/dashboard/*", // Todas as subrotas do dashboard
  "/settings", // Configuracoes do usuario
  "/settings/*", // Subrotas de configuracoes
  "/admin", // Area administrativa
  "/admin/*", // Subrotas administrativas
  "/api/v1", // APIs internas v1
  "/api/v1/*", // Todas as APIs v1
] as const;

/**
 * Verifica se uma rota e protegida
 *
 * @param pathname - Caminho da rota a verificar
 * @returns true se a rota for protegida
 */
export function isProtectedRoute(pathname: string): boolean {
  for (const pattern of PROTECTED_ROUTE_PATTERNS) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (pathname.startsWith(prefix)) {
        return true;
      }
    } else if (pathname === pattern) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// ROLES DO SISTEMA
// =============================================================================

/**
 * Roles disponiveis no sistema Skyller.
 *
 * Hierarquia de permissoes (maior para menor):
 * 1. PLATFORM_ADMIN - Acesso total a plataforma (multi-tenant)
 * 2. ADMIN - Administrador do tenant
 * 3. AGENT_MANAGER - Gerencia agentes e MCPs
 * 4. OPERATOR - Opera o sistema com acesso limitado
 * 5. VIEWER - Apenas visualizacao
 */
export const ROLES = {
  /** Administrador da plataforma (super admin multi-tenant) */
  PLATFORM_ADMIN: "platform-admin",

  /** Administrador do tenant */
  ADMIN: "admin",

  /** Gerente de agentes e MCPs */
  AGENT_MANAGER: "agent-manager",

  /** Operador com acesso limitado */
  OPERATOR: "operator",

  /** Apenas visualizacao */
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Lista de todas as roles validas
 */
export const ALL_ROLES: Role[] = Object.values(ROLES);

/**
 * Roles que tem acesso administrativo
 */
export const ADMIN_ROLES: Role[] = [ROLES.PLATFORM_ADMIN, ROLES.ADMIN];

/**
 * Roles que podem gerenciar agentes
 */
export const AGENT_MANAGER_ROLES: Role[] = [ROLES.PLATFORM_ADMIN, ROLES.ADMIN, ROLES.AGENT_MANAGER];

// =============================================================================
// MAPEAMENTO DE PERMISSOES
// =============================================================================

/**
 * Permissoes granulares do sistema
 */
export const PERMISSIONS = {
  // Tenants
  TENANT_CREATE: "tenant:create",
  TENANT_READ: "tenant:read",
  TENANT_UPDATE: "tenant:update",
  TENANT_DELETE: "tenant:delete",

  // Users
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_MANAGE_ROLES: "user:manage-roles",

  // Agents
  AGENT_CREATE: "agent:create",
  AGENT_READ: "agent:read",
  AGENT_UPDATE: "agent:update",
  AGENT_DELETE: "agent:delete",
  AGENT_DEPLOY: "agent:deploy",

  // MCPs
  MCP_CREATE: "mcp:create",
  MCP_READ: "mcp:read",
  MCP_UPDATE: "mcp:update",
  MCP_DELETE: "mcp:delete",
  MCP_CONNECT: "mcp:connect",

  // Tools
  TOOL_READ: "tool:read",
  TOOL_MANAGE: "tool:manage",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",

  // Audit
  AUDIT_VIEW: "audit:view",
  AUDIT_EXPORT: "audit:export",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_UPDATE: "settings:update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Mapeamento de roles para permissoes
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.PLATFORM_ADMIN]: Object.values(PERMISSIONS), // Todas as permissoes

  [ROLES.ADMIN]: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.AGENT_CREATE,
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.AGENT_UPDATE,
    PERMISSIONS.AGENT_DELETE,
    PERMISSIONS.AGENT_DEPLOY,
    PERMISSIONS.MCP_CREATE,
    PERMISSIONS.MCP_READ,
    PERMISSIONS.MCP_UPDATE,
    PERMISSIONS.MCP_DELETE,
    PERMISSIONS.MCP_CONNECT,
    PERMISSIONS.TOOL_READ,
    PERMISSIONS.TOOL_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
  ],

  [ROLES.AGENT_MANAGER]: [
    PERMISSIONS.AGENT_CREATE,
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.AGENT_UPDATE,
    PERMISSIONS.AGENT_DELETE,
    PERMISSIONS.AGENT_DEPLOY,
    PERMISSIONS.MCP_READ,
    PERMISSIONS.MCP_CONNECT,
    PERMISSIONS.TOOL_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [ROLES.OPERATOR]: [
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.MCP_READ,
    PERMISSIONS.MCP_CONNECT,
    PERMISSIONS.TOOL_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.MCP_READ,
    PERMISSIONS.TOOL_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

// =============================================================================
// FUNCOES AUXILIARES
// =============================================================================

/**
 * Verifica se um usuario tem uma role especifica
 *
 * @param userRoles - Lista de roles do usuario
 * @param requiredRole - Role requerida
 * @returns true se o usuario tem a role
 */
export function hasRole(userRoles: string[], requiredRole: Role): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Verifica se um usuario tem alguma das roles especificadas
 *
 * @param userRoles - Lista de roles do usuario
 * @param requiredRoles - Lista de roles aceitas
 * @returns true se o usuario tem pelo menos uma das roles
 */
export function hasAnyRole(userRoles: string[], requiredRoles: Role[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Verifica se um usuario tem todas as roles especificadas
 *
 * @param userRoles - Lista de roles do usuario
 * @param requiredRoles - Lista de roles requeridas
 * @returns true se o usuario tem todas as roles
 */
export function hasAllRoles(userRoles: string[], requiredRoles: Role[]): boolean {
  return requiredRoles.every((role) => userRoles.includes(role));
}

/**
 * Verifica se um usuario tem uma permissao especifica
 *
 * @param userRoles - Lista de roles do usuario
 * @param permission - Permissao requerida
 * @returns true se alguma role do usuario tem a permissao
 */
export function hasPermission(userRoles: string[], permission: Permission): boolean {
  for (const userRole of userRoles) {
    const rolePermissions = ROLE_PERMISSIONS[userRole as Role];
    if (rolePermissions?.includes(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Obtem todas as permissoes de um usuario baseado em suas roles
 *
 * @param userRoles - Lista de roles do usuario
 * @returns Lista de permissoes unicas
 */
export function getUserPermissions(userRoles: string[]): Permission[] {
  const permissions = new Set<Permission>();

  for (const userRole of userRoles) {
    const rolePermissions = ROLE_PERMISSIONS[userRole as Role];
    if (rolePermissions) {
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }
  }

  return Array.from(permissions);
}

/**
 * Verifica se o usuario e um administrador (platform-admin ou admin)
 *
 * @param userRoles - Lista de roles do usuario
 * @returns true se o usuario e admin
 */
export function isAdmin(userRoles: string[]): boolean {
  return hasAnyRole(userRoles, ADMIN_ROLES);
}

/**
 * Verifica se o usuario e platform-admin (super admin)
 *
 * @param userRoles - Lista de roles do usuario
 * @returns true se o usuario e platform-admin
 */
export function isPlatformAdmin(userRoles: string[]): boolean {
  return hasRole(userRoles, ROLES.PLATFORM_ADMIN);
}

// =============================================================================
// KEYCLOAK CLIENTS
// =============================================================================

/**
 * Identificadores dos clients OAuth do Keycloak
 */
export const KEYCLOAK_CLIENTS = {
  /** Client para o Chat (usuarios finais) */
  SKYLLER: "skyller",

  /** Client para o Admin (administradores) */
  NEXUS_ADMIN: "nexus-admin",
} as const;

export type KeycloakClient = (typeof KEYCLOAK_CLIENTS)[keyof typeof KEYCLOAK_CLIENTS];

// =============================================================================
// MENSAGENS DE ERRO
// =============================================================================

/**
 * Mensagens de erro padronizadas para autenticacao
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED: "Voce precisa estar autenticado para acessar este recurso.",
  FORBIDDEN: "Voce nao tem permissao para acessar este recurso.",
  SESSION_EXPIRED: "Sua sessao expirou. Por favor, faca login novamente.",
  INVALID_TOKEN: "Token de autenticacao invalido.",
  ROLE_REQUIRED: "Voce nao possui a role necessaria para esta acao.",
  PERMISSION_DENIED: "Permissao negada para esta operacao.",
} as const;
