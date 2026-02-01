import { headers } from "next/headers";
import { auth } from "@/auth";

/**
 * Tipos de usuario autenticado com campos customizados do Keycloak.
 */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  /** UUID canonico do tenant (nunca slug) */
  tenant_id: string;
  tenant_slug?: string;
  tenant_name?: string;
  roles: string[];
  permissions?: string[];
}

/**
 * Erro lancado quando autenticacao e requerida mas nao existe sessao.
 */
export class AuthenticationError extends Error {
  constructor(message = "Autenticacao requerida") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Erro lancado quando usuario nao tem a role necessaria.
 */
export class AuthorizationError extends Error {
  constructor(message = "Permissao negada") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Extrai o tenant_slug do hostname (subdominio).
 *
 * Em ambiente multi-tenant, o slug e identificado pelo subdominio:
 * - ramada.skyller.ai -> tenant_slug: "ramada"
 * - wink.skyller.ai -> tenant_slug: "wink"
 * - localhost:3004 -> tenant_slug: "default" (desenvolvimento)
 *
 * @returns O tenant_slug extraido do hostname
 *
 * @example
 * // Em ramada.skyller.ai
 * const tenant = await getTenantFromHost();
 * console.log(tenant); // "ramada"
 */
export async function getTenantFromHost(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";

  // Em desenvolvimento local, retornar slug padrao
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return process.env.DEFAULT_TENANT || "default";
  }

  // Extrair subdominio: tenant.skyller.ai -> tenant_slug
  const parts = host.split(".");

  // Se temos pelo menos 3 partes (tenant.skyller.ai), o primeiro e o slug
  if (parts.length >= 3) {
    return parts[0];
  }

  // Fallback para slug padrao
  return process.env.DEFAULT_TENANT || "default";
}

/**
 * Constroi a URL do issuer do Keycloak baseado no tenant atual.
 *
 * Em ambiente white-label, cada tenant acessa o Keycloak via seu proprio
 * subdominio atraves do reverse proxy Nginx:
 * - ramada.skyller.ai/auth/realms/skyller
 * - wink.skyller.ai/auth/realms/skyller
 *
 * @returns URL do issuer do Keycloak para o tenant atual
 *
 * @example
 * const issuer = getIssuer();
 * // Em producao: "https://ramada.skyller.ai/auth/realms/skyller"
 * // Em desenvolvimento: "http://localhost:8080/auth/realms/skyller"
 */
export function getIssuer(): string {
  // Em desenvolvimento, usar issuer direto do Keycloak
  if (process.env.NODE_ENV === "development") {
    return process.env.KEYCLOAK_ISSUER || "http://localhost:8080/auth/realms/skyller";
  }

  // Em producao, usar o template com tenant dinamico
  // O tenant sera resolvido pelo reverse proxy
  const issuerTemplate =
    process.env.KEYCLOAK_ISSUER_TEMPLATE || "https://${TENANT_HOST}/auth/realms/skyller";

  // O issuer final sera resolvido em runtime pelo Nginx
  // que faz proxy de /auth/* para o Keycloak
  return process.env.KEYCLOAK_ISSUER || issuerTemplate;
}

/**
 * Obtem o usuario atual da sessao com type safety.
 *
 * @returns O usuario autenticado ou null se nao houver sessao
 *
 * @example
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log(`Ola, ${user.name}!`);
 *   console.log(`Tenant: ${user.tenant_id}`);
 * }
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  if (!session.user.tenant_id) {
    return null;
  }

  // Mapear campos da sessao para AuthUser com type safety
  return {
    id: session.user.id || "",
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image,
    tenant_id: (session.user as AuthUser).tenant_id,
    tenant_slug: (session.user as AuthUser).tenant_slug,
    tenant_name: (session.user as AuthUser).tenant_name,
    roles: (session.user as AuthUser).roles || [],
    permissions: (session.user as AuthUser).permissions,
  };
}

/**
 * Requer autenticacao, lancando erro se nao autenticado.
 *
 * Use esta funcao em Server Components ou Server Actions que
 * requerem usuario autenticado.
 *
 * @returns O usuario autenticado
 * @throws {AuthenticationError} Se nao houver sessao ativa
 *
 * @example
 * export async function protectedAction() {
 *   const user = await requireAuth();
 *   // Codigo que requer autenticacao
 *   return await createResource(user.id);
 * }
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError("Voce precisa estar logado para acessar este recurso");
  }

  return user;
}

/**
 * Verifica se o usuario tem uma role especifica.
 *
 * Roles sao extraidas do token JWT do Keycloak e incluem:
 * - Realm roles: roles globais do realm
 * - Client roles: roles especificas do cliente (skyller ou nexus-admin)
 *
 * @param role - Role a ser verificada (ex: "admin", "user", "manager")
 * @returns O usuario autenticado
 * @throws {AuthenticationError} Se nao houver sessao ativa
 * @throws {AuthorizationError} Se o usuario nao tiver a role
 *
 * @example
 * export async function adminOnlyAction() {
 *   const user = await requireRole("admin");
 *   // Codigo restrito a admins
 * }
 *
 * @example
 * // Verificar multiplas roles (OR)
 * try {
 *   await requireRole("admin");
 * } catch {
 *   await requireRole("manager"); // Fallback para manager
 * }
 */
export async function requireRole(role: string): Promise<AuthUser> {
  const user = await requireAuth();

  if (!user.roles.includes(role)) {
    throw new AuthorizationError(`Acesso negado. Role necessaria: ${role}`);
  }

  return user;
}

/**
 * Verifica se o usuario tem uma permissao especifica.
 *
 * Permissoes sao mais granulares que roles e podem ser usadas
 * para controle de acesso baseado em recursos:
 * - "users:read" - Pode ler usuarios
 * - "users:write" - Pode criar/editar usuarios
 * - "agents:execute" - Pode executar agentes
 *
 * @param permission - Permissao a ser verificada
 * @returns true se o usuario tem a permissao, false caso contrario
 *
 * @example
 * if (await hasPermission("users:delete")) {
 *   // Mostrar botao de delete
 * }
 *
 * @example
 * // Em guard de rota
 * if (!await hasPermission("agents:execute")) {
 *   redirect("/unauthorized");
 * }
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Verificar se a permissao existe no array de permissoes
  if (user.permissions?.includes(permission)) {
    return true;
  }

  // Fallback: verificar se alguma role implica na permissao
  // Admin tem todas as permissoes
  if (user.roles.includes("admin")) {
    return true;
  }

  return false;
}

/**
 * Helper para verificar se usuario esta autenticado (sem lancar erro).
 *
 * @returns true se ha sessao ativa, false caso contrario
 *
 * @example
 * const isLoggedIn = await isAuthenticated();
 * if (!isLoggedIn) {
 *   redirect("/login");
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Helper para verificar se usuario tem uma das roles especificadas.
 *
 * @param roles - Array de roles aceitaveis
 * @returns true se usuario tem pelo menos uma das roles
 *
 * @example
 * if (await hasAnyRole(["admin", "manager", "supervisor"])) {
 *   // Usuario pode acessar area administrativa
 * }
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return roles.some((role) => user.roles.includes(role));
}
