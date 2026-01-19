/**
 * Type-safe environment variable access for Skyller
 *
 * Este modulo fornece acesso seguro e tipado as variaveis de ambiente,
 * com validacao e mensagens de erro claras.
 *
 * @module lib/env
 */

// ==============================================================================
// Tipos
// ==============================================================================

/**
 * Variaveis de ambiente obrigatorias (server-side)
 */
interface ServerEnv {
  // NextAuth
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;

  // Keycloak
  KEYCLOAK_URL: string;
  KEYCLOAK_CLIENT_ID: string;

  // Client Secrets por Realm
  KEYCLOAK_CLIENT_SECRET_SKILLS: string;
  KEYCLOAK_CLIENT_SECRET_RAMADA: string;
  KEYCLOAK_CLIENT_SECRET_LINDACOR: string;
  KEYCLOAK_CLIENT_SECRET_WGA: string;

  // Nexus Admin
  KEYCLOAK_ADMIN_CLIENT_ID: string;
  KEYCLOAK_ADMIN_CLIENT_SECRET?: string;

  // API
  NEXUS_API_URL: string;
}

/**
 * Variaveis de ambiente publicas (client-side)
 */
interface PublicEnv {
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_DEFAULT_TENANT: string;
}

/**
 * Tenant IDs suportados
 */
type TenantId = "skills" | "ramada" | "lindacor" | "wga";

// ==============================================================================
// Validacao
// ==============================================================================

/**
 * Valida se uma variavel de ambiente existe
 * @throws Error com mensagem clara se a variavel nao existir
 */
function requireEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[ENV ERROR] Variavel de ambiente "${key}" nao configurada.\n` +
        `Por favor, adicione ${key} ao arquivo .env.local\n` +
        `Veja env.sample para referencia.`
    );
  }
  return value;
}

/**
 * Obtem uma variavel de ambiente opcional com valor padrao
 */
function optionalEnv(
  key: string,
  value: string | undefined,
  defaultValue: string
): string {
  return value && value.trim() !== "" ? value : defaultValue;
}

// ==============================================================================
// Funcoes de Acesso
// ==============================================================================

/**
 * Obtem uma variavel de ambiente server-side
 *
 * @param key - Nome da variavel
 * @returns Valor da variavel
 * @throws Error se a variavel obrigatoria nao existir
 *
 * @example
 * ```ts
 * const apiUrl = getEnv("NEXUS_API_URL");
 * ```
 */
export function getEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  const value = process.env[key];

  // Variaveis opcionais
  const optionalKeys: (keyof ServerEnv)[] = ["KEYCLOAK_ADMIN_CLIENT_SECRET"];

  if (optionalKeys.includes(key)) {
    return (value ?? "") as ServerEnv[K];
  }

  return requireEnv(key, value) as ServerEnv[K];
}

/**
 * Obtem uma variavel de ambiente publica (client-side)
 *
 * @param key - Nome da variavel (com prefixo NEXT_PUBLIC_)
 * @returns Valor da variavel
 *
 * @example
 * ```ts
 * const appName = getPublicEnv("NEXT_PUBLIC_APP_NAME");
 * ```
 */
export function getPublicEnv<K extends keyof PublicEnv>(key: K): PublicEnv[K] {
  const defaults: PublicEnv = {
    NEXT_PUBLIC_APP_NAME: "Skyller",
    NEXT_PUBLIC_DEFAULT_TENANT: "skills",
  };

  return optionalEnv(key, process.env[key], defaults[key]) as PublicEnv[K];
}

/**
 * Obtem o client secret do Keycloak para um tenant especifico
 *
 * @param tenantId - ID do tenant
 * @returns Client secret do tenant
 * @throws Error se o secret nao estiver configurado
 *
 * @example
 * ```ts
 * const secret = getKeycloakSecret("skills");
 * ```
 */
export function getKeycloakSecret(tenantId: TenantId): string {
  const secretMap: Record<TenantId, keyof ServerEnv> = {
    skills: "KEYCLOAK_CLIENT_SECRET_SKILLS",
    ramada: "KEYCLOAK_CLIENT_SECRET_RAMADA",
    lindacor: "KEYCLOAK_CLIENT_SECRET_LINDACOR",
    wga: "KEYCLOAK_CLIENT_SECRET_WGA",
  };

  const envKey = secretMap[tenantId];
  if (!envKey) {
    throw new Error(
      `[ENV ERROR] Tenant "${tenantId}" nao suportado.\n` +
        `Tenants validos: ${Object.keys(secretMap).join(", ")}`
    );
  }

  return getEnv(envKey);
}

/**
 * Obtem a URL do issuer Keycloak para um tenant
 *
 * @param tenantId - ID do tenant (usado como realm)
 * @returns URL completa do issuer
 *
 * @example
 * ```ts
 * const issuer = getKeycloakIssuer("skills");
 * // => "https://idp.servidor.one/realms/skills"
 * ```
 */
export function getKeycloakIssuer(tenantId: TenantId): string {
  const baseUrl = getEnv("KEYCLOAK_URL");
  return `${baseUrl}/realms/${tenantId}`;
}

/**
 * Obtem a configuracao completa do Keycloak para um tenant
 *
 * @param tenantId - ID do tenant
 * @returns Configuracao completa do Keycloak
 *
 * @example
 * ```ts
 * const config = getKeycloakConfig("ramada");
 * // => { clientId: "skyller", clientSecret: "...", issuer: "..." }
 * ```
 */
export function getKeycloakConfig(tenantId: TenantId) {
  return {
    clientId: getEnv("KEYCLOAK_CLIENT_ID"),
    clientSecret: getKeycloakSecret(tenantId),
    issuer: getKeycloakIssuer(tenantId),
  };
}

// ==============================================================================
// Validacao em Tempo de Build
// ==============================================================================

/**
 * Valida todas as variaveis de ambiente obrigatorias
 * Chamar no inicio da aplicacao para falhar rapido
 *
 * @throws Error se alguma variavel obrigatoria estiver faltando
 *
 * @example
 * ```ts
 * // Em app/layout.tsx ou middleware.ts
 * validateEnv();
 * ```
 */
export function validateEnv(): void {
  const requiredVars: (keyof ServerEnv)[] = [
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "KEYCLOAK_URL",
    "KEYCLOAK_CLIENT_ID",
    "KEYCLOAK_CLIENT_SECRET_SKILLS",
    "NEXUS_API_URL",
  ];

  const missing: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[ENV ERROR] Variaveis de ambiente obrigatorias nao configuradas:\n` +
        missing.map((k) => `  - ${k}`).join("\n") +
        `\n\nPor favor, configure essas variaveis no arquivo .env.local\n` +
        `Veja env.sample para referencia.`
    );
  }
}

// ==============================================================================
// Exportacoes de Conveniencia
// ==============================================================================

/**
 * Objeto com todas as variaveis de ambiente (lazy-loaded)
 * Use apenas em server components/actions
 */
export const env = {
  get nextAuthUrl() {
    return getEnv("NEXTAUTH_URL");
  },
  get nextAuthSecret() {
    return getEnv("NEXTAUTH_SECRET");
  },
  get keycloakUrl() {
    return getEnv("KEYCLOAK_URL");
  },
  get keycloakClientId() {
    return getEnv("KEYCLOAK_CLIENT_ID");
  },
  get nexusApiUrl() {
    return getEnv("NEXUS_API_URL");
  },
  get adminClientId() {
    return getEnv("KEYCLOAK_ADMIN_CLIENT_ID");
  },
} as const;

/**
 * Variaveis publicas (safe para client-side)
 */
export const publicEnv = {
  appName: getPublicEnv("NEXT_PUBLIC_APP_NAME"),
  defaultTenant: getPublicEnv("NEXT_PUBLIC_DEFAULT_TENANT"),
} as const;
