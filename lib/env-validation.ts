/**
 * Validacao de variaveis de ambiente em build-time
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance CI-07: Build-time Environment Validation
 *
 * Valida NEXUS_API_URL usando Zod em module-level para detectar
 * configuracao incorreta em build-time ao inves de runtime.
 */

import { z } from "zod";

/**
 * Schema de validacao das variaveis de ambiente obrigatorias
 */
const envSchema = z.object({
  NEXUS_API_URL: z
    .string()
    .url("NEXUS_API_URL deve ser uma URL valida (ex: http://ia.servidor.one:8000)"),
});

/**
 * Tipo inferido do schema de ambiente
 */
export type EnvSchema = z.infer<typeof envSchema>;

/**
 * Valida variaveis de ambiente usando Zod
 * @throws Error se variaveis estiverem ausentes ou invalidas
 */
export function validateEnv(): EnvSchema {
  try {
    return envSchema.parse({
      NEXUS_API_URL: process.env.NEXUS_API_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Variaveis de ambiente invalidas:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Ambiente validado em module-level (executa em build-time para rotas server)
 * Se a variavel nao estiver configurada, usa fallback para desenvolvimento
 */
let env: EnvSchema;

try {
  env = validateEnv();
} catch {
  // Em desenvolvimento, usar fallback se nao configurado
  if (process.env.NODE_ENV === "development") {
    console.warn("[env-validation] NEXUS_API_URL nao configurado, usando http://localhost:8000");
    env = { NEXUS_API_URL: "http://localhost:8000" };
  } else {
    // Em producao, falhar se nao configurado
    throw new Error("NEXUS_API_URL e obrigatorio em producao");
  }
}

/**
 * Retorna a URL do endpoint AgnoAgent (/agui)
 * @returns URL completa do endpoint /agui
 */
export function getAgnoAgentUrl(): string {
  const normalizedUrl = env.NEXUS_API_URL.endsWith("/")
    ? env.NEXUS_API_URL.slice(0, -1)
    : env.NEXUS_API_URL;

  return `${normalizedUrl}/agui`;
}

/**
 * Retorna a URL base do backend
 * @returns URL base do backend sem trailing slash
 */
export function getBackendBaseUrl(): string {
  return env.NEXUS_API_URL.endsWith("/") ? env.NEXUS_API_URL.slice(0, -1) : env.NEXUS_API_URL;
}

export { env };
