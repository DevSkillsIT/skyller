/**
 * SPEC-006-skyller - Phase 6: US4 - Multi-Tenancy e Branding
 * T041: Funcao getTenantTheme para obter configuracoes de branding
 *
 * Utilitarios para personalizar tema visual baseado no tenant.
 */

/**
 * Interface de configuracao de tema do tenant
 */
export interface TenantTheme {
  /** ID do tenant */
  tenantId: string
  /** URL do logo */
  logoUrl: string | null
  /** URL do favicon */
  faviconUrl: string | null
  /** Cor primaria (hex) */
  primaryColor: string
  /** Cor secundaria (hex) */
  secondaryColor: string
  /** Titulo da pagina */
  pageTitle: string | null
  /** CSS variables para aplicar */
  cssVariables: Record<string, string>
}

/**
 * Tema padrao (Skills AI Nexus)
 */
export const DEFAULT_THEME: TenantTheme = {
  tenantId: "default",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#3B82F6", // blue-500
  secondaryColor: "#1E40AF", // blue-800
  pageTitle: "Skyller - Skills AI Nexus",
  cssVariables: {
    "--color-primary": "#3B82F6",
    "--color-primary-dark": "#2563EB",
    "--color-primary-light": "#60A5FA",
    "--color-secondary": "#1E40AF",
    "--color-secondary-dark": "#1E3A8A",
    "--color-secondary-light": "#3B82F6",
    "--color-accent": "#8B5CF6",
  },
}

/**
 * Temas por tenant (hardcoded para desenvolvimento)
 * Em producao, sera buscado do banco de dados
 */
const TENANT_THEMES: Record<string, Partial<TenantTheme>> = {
  "skills-it": {
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    pageTitle: "Skyller - Skills IT",
  },
  "grupo-wink": {
    primaryColor: "#22C55E", // green
    secondaryColor: "#166534",
    pageTitle: "Skyller - Grupo Wink",
  },
  "ramada": {
    primaryColor: "#EF4444", // red
    secondaryColor: "#B91C1C",
    pageTitle: "Skyller - Ramada Atacadista",
  },
  "gsm": {
    primaryColor: "#F59E0B", // amber
    secondaryColor: "#B45309",
    pageTitle: "Skyller - GSM Transportes",
  },
}

/**
 * URL base da API
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_AGUI_URL || "http://localhost:7777"

/**
 * Converte cor hex para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Gera variantes de cor (mais clara e mais escura)
 */
function generateColorVariants(hex: string): {
  base: string
  light: string
  dark: string
} {
  const rgb = hexToRgb(hex)
  if (!rgb) return { base: hex, light: hex, dark: hex }

  // Versao mais clara (+20%)
  const light = `#${Math.min(255, Math.round(rgb.r * 1.2))
    .toString(16)
    .padStart(2, "0")}${Math.min(255, Math.round(rgb.g * 1.2))
    .toString(16)
    .padStart(2, "0")}${Math.min(255, Math.round(rgb.b * 1.2))
    .toString(16)
    .padStart(2, "0")}`

  // Versao mais escura (-20%)
  const dark = `#${Math.round(rgb.r * 0.8)
    .toString(16)
    .padStart(2, "0")}${Math.round(rgb.g * 0.8)
    .toString(16)
    .padStart(2, "0")}${Math.round(rgb.b * 0.8)
    .toString(16)
    .padStart(2, "0")}`

  return { base: hex, light, dark }
}

/**
 * Gera CSS variables a partir das cores do tema
 */
function generateCssVariables(
  primaryColor: string,
  secondaryColor: string
): Record<string, string> {
  const primary = generateColorVariants(primaryColor)
  const secondary = generateColorVariants(secondaryColor)

  return {
    "--color-primary": primary.base,
    "--color-primary-dark": primary.dark,
    "--color-primary-light": primary.light,
    "--color-secondary": secondary.base,
    "--color-secondary-dark": secondary.dark,
    "--color-secondary-light": secondary.light,
    "--color-accent": primary.light,
  }
}

/**
 * Busca tema do tenant da API
 *
 * @param tenantId - ID do tenant
 * @param headers - Headers de autenticacao
 * @returns Tema do tenant
 */
export async function fetchTenantTheme(
  tenantId: string,
  headers: Record<string, string>
): Promise<TenantTheme> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/branding`, {
      method: "GET",
      headers: {
        ...headers,
        "X-Tenant-ID": tenantId,
      },
    })

    if (!response.ok) {
      console.warn(
        `[tenantTheme] Falha ao buscar tema para ${tenantId}, usando padrao`
      )
      return getTenantTheme(tenantId)
    }

    const data = await response.json()

    return {
      tenantId: data.tenant_id,
      logoUrl: data.logo_url,
      faviconUrl: data.favicon_url,
      primaryColor: data.primary_color || DEFAULT_THEME.primaryColor,
      secondaryColor: data.secondary_color || DEFAULT_THEME.secondaryColor,
      pageTitle: data.page_title,
      cssVariables: generateCssVariables(
        data.primary_color || DEFAULT_THEME.primaryColor,
        data.secondary_color || DEFAULT_THEME.secondaryColor
      ),
    }
  } catch (error) {
    console.error("[tenantTheme] Erro ao buscar tema:", error)
    return getTenantTheme(tenantId)
  }
}

/**
 * Obtem tema do tenant (sync, usando cache local)
 *
 * @param tenantId - ID do tenant
 * @returns Tema do tenant
 *
 * @example
 * ```tsx
 * function Layout({ tenantId }: { tenantId: string }) {
 *   const theme = getTenantTheme(tenantId)
 *
 *   return (
 *     <div style={theme.cssVariables as React.CSSProperties}>
 *       {children}
 *     </div>
 *   )
 * }
 * ```
 */
export function getTenantTheme(tenantId: string): TenantTheme {
  // Buscar tema especifico do tenant
  const tenantOverrides = TENANT_THEMES[tenantId]

  if (!tenantOverrides) {
    return {
      ...DEFAULT_THEME,
      tenantId,
    }
  }

  const primaryColor = tenantOverrides.primaryColor || DEFAULT_THEME.primaryColor
  const secondaryColor =
    tenantOverrides.secondaryColor || DEFAULT_THEME.secondaryColor

  return {
    tenantId,
    logoUrl: tenantOverrides.logoUrl || DEFAULT_THEME.logoUrl,
    faviconUrl: tenantOverrides.faviconUrl || DEFAULT_THEME.faviconUrl,
    primaryColor,
    secondaryColor,
    pageTitle: tenantOverrides.pageTitle || DEFAULT_THEME.pageTitle,
    cssVariables: generateCssVariables(primaryColor, secondaryColor),
  }
}

/**
 * Aplica tema no document (client-side)
 *
 * @param theme - Tema a ser aplicado
 */
export function applyThemeToDocument(theme: TenantTheme): void {
  if (typeof document === "undefined") return

  const root = document.documentElement

  // Aplicar CSS variables
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // Atualizar titulo da pagina
  if (theme.pageTitle) {
    document.title = theme.pageTitle
  }

  // Atualizar favicon se disponivel
  if (theme.faviconUrl) {
    const link =
      (document.querySelector('link[rel="icon"]') as HTMLLinkElement) ||
      document.createElement("link")
    link.rel = "icon"
    link.href = theme.faviconUrl
    document.head.appendChild(link)
  }
}

/**
 * Hook para usar tema do tenant (client-side)
 */
export function useTenantTheme(tenantId: string | null): TenantTheme {
  if (!tenantId) return DEFAULT_THEME
  return getTenantTheme(tenantId)
}
