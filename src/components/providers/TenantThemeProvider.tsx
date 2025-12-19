/**
 * SPEC-006-skyller - Phase 6: US4 - Multi-Tenancy e Branding
 * T042: Provider para aplicar tema do tenant no layout
 *
 * Provider React que aplica o tema baseado no tenant do usuario autenticado.
 */

"use client"

import React, { useEffect, useMemo } from "react"
import { useIdentity } from "@/hooks/useIdentity"
import {
  getTenantTheme,
  applyThemeToDocument,
  DEFAULT_THEME,
  type TenantTheme,
} from "@/lib/theme/tenantTheme"

/**
 * Props do TenantThemeProvider
 */
export interface TenantThemeProviderProps {
  /** Elementos filhos */
  children: React.ReactNode
  /** Tenant ID override (para preview/admin) */
  overrideTenantId?: string
}

/**
 * Contexto do tema do tenant
 */
export const TenantThemeContext = React.createContext<TenantTheme>(DEFAULT_THEME)

/**
 * Hook para acessar o tema do tenant atual
 *
 * @returns Tema do tenant
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useTenantThemeContext()
 *
 *   return (
 *     <div style={{ color: theme.primaryColor }}>
 *       {theme.pageTitle}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTenantThemeContext(): TenantTheme {
  return React.useContext(TenantThemeContext)
}

/**
 * Provider que aplica tema do tenant no documento
 *
 * Features:
 * - Detecta tenant do usuario autenticado
 * - Aplica CSS variables no :root
 * - Atualiza titulo da pagina
 * - Atualiza favicon se disponivel
 *
 * @example
 * ```tsx
 * // No layout principal
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TenantThemeProvider>
 *           {children}
 *         </TenantThemeProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function TenantThemeProvider({
  children,
  overrideTenantId,
}: TenantThemeProviderProps) {
  const { tenantId: userTenantId, isLoading } = useIdentity()

  // Determinar tenant ID (override > usuario > default)
  const tenantId = overrideTenantId || userTenantId || "skills-it"

  // Obter tema para o tenant
  const theme = useMemo(() => {
    return getTenantTheme(tenantId)
  }, [tenantId])

  // Aplicar tema no documento quando mudar
  useEffect(() => {
    if (!isLoading) {
      applyThemeToDocument(theme)
    }
  }, [theme, isLoading])

  return (
    <TenantThemeContext.Provider value={theme}>
      <div
        style={theme.cssVariables as React.CSSProperties}
        className="min-h-screen"
      >
        {children}
      </div>
    </TenantThemeContext.Provider>
  )
}

/**
 * HOC para envolver componente com tema do tenant
 *
 * @param Component - Componente a ser envolvido
 * @returns Componente com tema aplicado
 */
export function withTenantTheme<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithTenantTheme(props: P) {
    return (
      <TenantThemeProvider>
        <Component {...props} />
      </TenantThemeProvider>
    )
  }
}
