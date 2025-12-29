/**
 * SPEC-006-skyller - Provider para tema do tenant
 * NOTA: Auth desabilitado temporariamente - usando tenant default
 */

"use client"

import React, { useEffect, useMemo } from "react"
import {
  getTenantTheme,
  applyThemeToDocument,
  DEFAULT_THEME,
  type TenantTheme,
} from "@/lib/theme/tenantTheme"

export interface TenantThemeProviderProps {
  children: React.ReactNode
  overrideTenantId?: string
}

export const TenantThemeContext = React.createContext<TenantTheme>(DEFAULT_THEME)

export function useTenantThemeContext(): TenantTheme {
  return React.useContext(TenantThemeContext)
}

export function TenantThemeProvider({
  children,
  overrideTenantId,
}: TenantThemeProviderProps) {
  // Sem auth, usar tenant default
  const tenantId = overrideTenantId || "skills-it"

  const theme = useMemo(() => {
    return getTenantTheme(tenantId)
  }, [tenantId])

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

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
