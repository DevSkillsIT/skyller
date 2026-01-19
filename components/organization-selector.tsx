/**
 * OrganizationSelector Component
 *
 * @description Permite ao usuario trocar entre organizations quando possui acesso a multiplas.
 * Baseado em SPEC-ORGS-001 - Single Realm Multi-Organization Architecture.
 *
 * Features:
 * - Exibe dropdown apenas se usuario tiver 2+ organizations
 * - Atualiza session com organization selecionada
 * - Redireciona para subdomain correto (host/org coherence)
 * - Esconde automaticamente se usuario tem apenas 1 org
 */

"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"

export function OrganizationSelector() {
  const { data: session, update } = useSession()
  const [activeOrg, setActiveOrg] = useState(session?.user?.activeOrganization)

  const organizations = session?.user?.organizations || []
  const orgObject = session?.user?.organizationObject || {}

  // Esconder se usuario tem apenas 1 organization
  if (organizations.length <= 1) {
    return null
  }

  const handleChange = async (orgAlias: string) => {
    setActiveOrg(orgAlias)

    // 1. Atualizar session
    await update({ activeOrganization: orgAlias })

    // 2. Redirecionar para subdomain correto (host/org coherence)
    const currentHost = window.location.host
    const currentSubdomain = currentHost.split(".")[0]

    if (currentSubdomain !== orgAlias && !currentHost.includes("localhost")) {
      const newHost = currentHost.replace(currentSubdomain, orgAlias)
      window.location.href = `${window.location.protocol}//${newHost}${window.location.pathname}`
    } else {
      // Reload para aplicar mudancas em localhost
      window.location.reload()
    }
  }

  return (
    <select
      value={activeOrg || ""}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 rounded-md border bg-background"
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
