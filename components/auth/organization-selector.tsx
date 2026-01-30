"use client";

/**
 * OrganizationSelector Component
 *
 * SPEC-ORGS-001: Multi-Organization Support
 *
 * Permite usuários com múltiplas organizations (organization.length > 1)
 * selecionarem qual organization desejam usar no contexto atual.
 *
 * Features:
 * - Dropdown com lista de organizations do usuário
 * - Persiste seleção em localStorage
 * - Atualiza header X-Tenant-ID para chamadas API
 * - Visual feedback da organization ativa
 */

import { Building2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizationSelectorProps {
  /**
   * Classe CSS adicional para estilização
   */
  className?: string;

  /**
   * Callback quando organization é alterada
   */
  onOrganizationChange?: (orgAlias: string) => void;
}

/**
 * Componente OrganizationSelector para usuários multi-org.
 *
 * Automaticamente oculto quando usuário tem apenas 1 organization.
 */
export function OrganizationSelector({
  className,
  onOrganizationChange,
}: OrganizationSelectorProps) {
  const { data: session, status } = useSession();
  const [selectedOrg, setSelectedOrg] = useState<string>("");

  // Extrair organizations da session
  const organizations = session?.user?.organization || [];
  const isMultiOrg = organizations.length > 1;

  // Inicializar selectedOrg do localStorage ou session
  useEffect(() => {
    if (status === "authenticated" && organizations.length > 0) {
      // Tentar carregar preferência do localStorage
      const stored = localStorage.getItem("selected_organization");

      // Verificar se organization armazenada ainda é válida
      if (stored && organizations.includes(stored)) {
        setSelectedOrg(stored);
      } else {
        // Fallback para tenant_id atual (organization[0] da session)
        const currentTenantSlug = session?.user?.tenant_slug || organizations[0];
        setSelectedOrg(currentTenantSlug);
      }
    }
  }, [status, organizations, session?.user?.tenant_slug]);

  // Handler para mudança de organization
  const handleOrganizationChange = (orgAlias: string) => {
    setSelectedOrg(orgAlias);

    // Persistir no localStorage
    localStorage.setItem("selected_organization", orgAlias);

    // Callback externo
    onOrganizationChange?.(orgAlias);

    // TODO: Atualizar X-Tenant-ID header para próximas chamadas API
    // Isso pode ser feito via Context API ou hook customizado
    console.log("[OrganizationSelector] Organization changed to:", orgAlias);
  };

  // Não renderizar se não autenticado ou se tem apenas 1 organization
  if (status !== "authenticated" || !isMultiOrg) {
    return null;
  }

  return (
    <div className={className}>
      <Select value={selectedOrg} onValueChange={handleOrganizationChange}>
        <SelectTrigger className="w-[200px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Selecione organização" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org} value={org}>
              <div className="flex items-center">
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{org}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Organizations: {organizations.join(", ")}</p>
          <p>Selected: {selectedOrg}</p>
          <p>Session tenant_slug: {session?.user?.tenant_slug}</p>
        </div>
      )}
    </div>
  );
}
