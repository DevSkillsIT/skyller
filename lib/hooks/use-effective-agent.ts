"use client";

/**
 * SPEC-AGENT-MANAGEMENT-001: Hook useEffectiveAgent
 *
 * @description Resolve o agente efetivo baseado na hierarquia:
 * User > Project > Workspace > Tenant > Fallback
 *
 * Utiliza o endpoint GET /api/v1/settings/effective-agent
 */

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { authGet } from "@/lib/api-client";

// ==============================================================================
// Types
// ==============================================================================

/**
 * Resposta da API /api/v1/settings/effective-agent
 */
interface EffectiveAgentResponse {
  agent_id: string;
  agent_name: string;
  resolution_source: string; // "user", "project", "workspace", "tenant", "fallback"
}

/**
 * Opcoes para o hook useEffectiveAgent
 */
interface UseEffectiveAgentOptions {
  workspaceId?: string;
  projectId?: string;
}

/**
 * Estado retornado pelo hook
 */
interface UseEffectiveAgentState {
  effectiveAgent: EffectiveAgentResponse | null;
  agentId: string | undefined;
  agentName: string | undefined;
  resolutionSource: string | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ==============================================================================
// Hook
// ==============================================================================

/**
 * Hook para resolver o agente efetivo do usuario.
 *
 * @param options - Opcoes com workspaceId e/ou projectId
 * @returns Estado com agente efetivo, loading e funcao refetch
 *
 * @example
 * const { agentId, agentName, isLoading } = useEffectiveAgent({
 *   workspaceId: "123",
 *   projectId: "456",
 * });
 *
 * // Usar agentId para inicializar chat
 * useEffect(() => {
 *   if (agentId) {
 *     setSelectedAgentId(agentId);
 *   }
 * }, [agentId]);
 */
export function useEffectiveAgent(options: UseEffectiveAgentOptions = {}): UseEffectiveAgentState {
  const { data: session } = useSession();
  const [effectiveAgent, setEffectiveAgent] = useState<EffectiveAgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEffectiveAgent = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir query params
      const params = new URLSearchParams();
      if (options.workspaceId) {
        params.append("workspace_id", options.workspaceId);
      }
      if (options.projectId) {
        params.append("project_id", options.projectId);
      }

      const queryString = params.toString();
      const url = `/api/v1/settings/effective-agent${queryString ? `?${queryString}` : ""}`;

      // Buscar agente efetivo usando helper de autenticacao
      const response = await authGet<EffectiveAgentResponse>(url, session);
      setEffectiveAgent(response);
    } catch (err) {
      console.error("[useEffectiveAgent] Erro ao resolver agente:", err);
      setError(err instanceof Error ? err.message : "Erro ao resolver agente efetivo");
      setEffectiveAgent(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, options.workspaceId, options.projectId]);

  // Buscar agente ao montar ou quando dependencias mudarem
  useEffect(() => {
    fetchEffectiveAgent();
  }, [fetchEffectiveAgent]);

  return {
    effectiveAgent,
    agentId: effectiveAgent?.agent_id,
    agentName: effectiveAgent?.agent_name,
    resolutionSource: effectiveAgent?.resolution_source,
    isLoading,
    error,
    refetch: fetchEffectiveAgent,
  };
}

export default useEffectiveAgent;
