/**
 * OrganizationSelector Component
 *
 * @description Permite ao usuario trocar entre organizations quando possui acesso a multiplas.
 * Baseado em SPEC-ORGS-001 - Single Realm Multi-Organization Architecture.
 *
 * Features:
 * - Exibe dropdown apenas se usuario tiver 2+ organizations
 * - Persiste organization selecionada em cookie (active-organization)
 * - Atualiza session com organization selecionada
 * - Redireciona para subdomain correto (host/org coherence)
 * - Esconde automaticamente se usuario tem apenas 1 org
 */

"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  getActiveOrganization,
  setActiveOrganization as setActiveOrgCookie,
} from "@/lib/api-client"

export function OrganizationSelector() {
  const { data: session, update } = useSession()
  const [activeOrg, setActiveOrg] = useState<string | undefined>()
  const [isChanging, setIsChanging] = useState(false)

  const organizations = session?.user?.organizations || []
  const orgObject = session?.user?.organizationObject || {}

  // Inicializar activeOrg com prioridade: session > cookie > hostname
  useEffect(() => {
    if (session) {
      setActiveOrg(getActiveOrganization(session))
    }
  }, [session])

  // Esconder se usuario tem apenas 1 organization
  if (organizations.length <= 1) {
    return null
  }

  const handleChange = async (orgAlias: string) => {
    if (isChanging) return
    setIsChanging(true)
    setActiveOrg(orgAlias)

    try {
      // 1. Persistir no cookie
      setActiveOrgCookie(orgAlias)

      // 2. Atualizar session
      await update({ activeOrganization: orgAlias })

      // 3. Redirecionar para subdomain correto (host/org coherence)
      const currentHost = window.location.host
      const currentSubdomain = currentHost.split(".")[0]

      // Nao redirecionar se for admin.skyller.ai (admin ve todas orgs)
      if (currentSubdomain === "admin") {
        window.location.reload()
        return
      }

      if (currentSubdomain !== orgAlias && !currentHost.includes("localhost")) {
        const newHost = currentHost.replace(currentSubdomain, orgAlias)
        window.location.href = `${window.location.protocol}//${newHost}${window.location.pathname}`
      } else {
        // Reload para aplicar mudancas em localhost
        window.location.reload()
      }
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <select
      value={activeOrg || ""}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isChanging}
      className="px-3 py-2 rounded-md border bg-background disabled:opacity-50"
      data-testid="org-selector"
    >
      {organizations.map((org) => (
        <option key={org} value={org}>
          {orgObject[org]?.name || org.charAt(0).toUpperCase() + org.slice(1)}
        </option>
      ))}
    </select>
  )
}
