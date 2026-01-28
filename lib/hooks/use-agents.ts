"use client";

/**
 * Hook useAgents - Busca agentes da API /api/v1/agents
 *
 * @description Substitui os dados mockados por dados reais do backend.
 * Separa agentes em globais (is_default=true) e da empresa (tenant-specific).
 */

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Brain,
  Code2,
  Database,
  DollarSign,
  FileText,
  Globe,
  Palette,
  Scale,
  Search,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { authGet } from "@/lib/api-client";

// ==============================================================================
// Types
// ==============================================================================

/**
 * Resposta da API /api/v1/agents (AgentDetails do backend)
 */
export interface AgentApiResponse {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  tools: string[];
  knowledge: string[];
  instructions: string | null;
  is_default: boolean;
  is_active: boolean;
}

/**
 * Agente formatado para uso no frontend
 * Compativel com a interface Agent do mock existente
 */
export interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
  iconName: string;
  description: string;
  capabilities: string[];
  category: string;
  isDefault: boolean;
  isActive: boolean;
  knowledgeBases: string[];
  tasksCompleted: number; // Metricas de uso (placeholder ate ter dados reais)
  // Campos extras da API (todos os campos do backend)
  model?: string;
  modelTier?: string; // Tier do modelo (tier1-default, tier2-advanced, etc)
  temperature?: number;
  maxTokens?: number;
  instructions?: string;
}

/**
 * Estado do hook useAgents
 */
export interface UseAgentsState {
  agents: Agent[];
  globalAgents: Agent[];
  companyAgents: Agent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ==============================================================================
// Helpers
// ==============================================================================

/**
 * Mapa de icones por categoria/nome do agente
 * Usado para determinar o icone baseado no agent_id ou tools
 */
const iconMap: Record<string, LucideIcon> = {
  // Por agent_id
  general: Bot,
  "assistant-default": Bot,
  skyller: Brain,
  "data-analyst": BarChart3,
  "code-assistant": Code2,
  "doc-analyst": FileText,
  financial: DollarSign,
  "web-researcher": Search,
  legal: Scale,
  "legal-compliance": Scale,
  "brand-designer": Palette,
  "custom-ai": Sparkles,
  "dns-specialist": Globe,
  "glpi-helper": Wrench,
  security: Shield,
  database: Database,
  // Fallback por categoria (em português para match com getCategoryFromAgent)
  dados: BarChart3,
  desenvolvimento: Code2,
  documentos: FileText,
  financas: DollarSign,
  // "legal" já existe acima (agent_id) - não duplicar
  design: Palette,
  pesquisa: Search,
  seguranca: Shield,
  geral: Bot,
  infraestrutura: Globe,
  suporte: Wrench,
};

/**
 * Determina a categoria do agente baseado nas tools ou nome
 */
function getCategoryFromAgent(agent: AgentApiResponse): string {
  const id = agent.agent_id.toLowerCase();
  const tools = agent.tools.map((t) => t.toLowerCase());
  const name = agent.name.toLowerCase();

  // Mapear por agent_id
  if (id.includes("data") || id.includes("analyst")) return "Dados";
  if (id.includes("code") || id.includes("dev")) return "Desenvolvimento";
  if (id.includes("doc") || id.includes("document")) return "Documentos";
  if (id.includes("financial") || id.includes("finance")) return "Financas";
  if (id.includes("legal") || id.includes("compliance")) return "Legal";
  if (id.includes("design") || id.includes("brand")) return "Design";
  if (id.includes("research") || id.includes("web")) return "Pesquisa";
  if (id.includes("security") || id.includes("shield")) return "Seguranca";
  if (id.includes("dns") || id.includes("network")) return "Infraestrutura";
  if (id.includes("glpi") || id.includes("helpdesk")) return "Suporte";

  // Mapear por tools
  if (tools.some((t) => t.includes("sql") || t.includes("database"))) return "Dados";
  if (tools.some((t) => t.includes("code") || t.includes("git"))) return "Desenvolvimento";
  if (tools.some((t) => t.includes("pdf") || t.includes("doc"))) return "Documentos";

  // Mapear por nome
  if (name.includes("assistente geral") || name.includes("general")) return "Geral";

  return "Geral";
}

/**
 * Determina o icone do agente baseado no agent_id ou categoria
 */
function getIconForAgent(agent: AgentApiResponse): { icon: LucideIcon; iconName: string } {
  const id = agent.agent_id.toLowerCase();

  // Tentar match direto pelo agent_id
  for (const [key, icon] of Object.entries(iconMap)) {
    if (id.includes(key)) {
      return { icon, iconName: key };
    }
  }

  // Fallback por categoria
  const category = getCategoryFromAgent(agent).toLowerCase();
  const categoryIcon = iconMap[category];
  if (categoryIcon) {
    return { icon: categoryIcon, iconName: category };
  }

  // Fallback padrao
  return { icon: Bot, iconName: "bot" };
}

/**
 * Formata o nome do tier do modelo para exibicao
 */
function formatModelTier(tier: string | null): string {
  if (!tier) return "Padrao";
  const tierMap: Record<string, string> = {
    "tier1-default": "GPT-4o Mini",
    "tier2-advanced": "GPT-4o",
    "tier3-premium": "GPT-4 Turbo",
    "claude-sonnet": "Claude Sonnet",
    "claude-opus": "Claude Opus",
  };
  return tierMap[tier] || tier;
}

/**
 * Converte resposta da API para formato do frontend
 */
function apiToAgent(api: AgentApiResponse): Agent {
  const { icon, iconName } = getIconForAgent(api);

  return {
    id: api.agent_id,
    name: api.name,
    icon,
    iconName,
    description: api.description || "",
    capabilities: api.tools.length > 0 ? api.tools : ["Conversacao geral"],
    category: getCategoryFromAgent(api),
    isDefault: api.is_default,
    isActive: api.is_active,
    knowledgeBases: api.knowledge,
    tasksCompleted: 0, // Placeholder - sera substituido quando backend tiver metricas de uso
    // Campos extras do backend
    model: formatModelTier(api.model),
    modelTier: api.model || undefined,
    temperature: api.temperature || undefined,
    maxTokens: api.max_tokens || undefined,
    instructions: api.instructions || undefined,
  };
}

// ==============================================================================
// Hook
// ==============================================================================

/**
 * Hook para buscar e gerenciar agentes do backend
 *
 * @example
 * const { agents, globalAgents, companyAgents, isLoading, error } = useAgents();
 *
 * // Usar agentes globais
 * globalAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)
 *
 * // Usar agentes da empresa
 * companyAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)
 */
export function useAgents(): UseAgentsState {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar agentes da API usando helper centralizado de autenticacao
      // authGet adiciona automaticamente: Authorization, X-Tenant-ID, X-User-ID
      const response = await authGet<AgentApiResponse[]>("/api/v1/agents", session);

      // Converter para formato do frontend
      const formattedAgents = response.map(apiToAgent);
      setAgents(formattedAgents);
    } catch (err) {
      console.error("[useAgents] Erro ao buscar agentes:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar agentes");

      // Em caso de erro, usar array vazio (fallback pode ser adicionado)
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Buscar agentes ao montar ou quando session mudar
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Separar agentes em globais e da empresa
  const globalAgents = agents.filter((a) => a.isDefault);
  const companyAgents = agents.filter((a) => !a.isDefault);

  return {
    agents,
    globalAgents,
    companyAgents,
    isLoading,
    error,
    refetch: fetchAgents,
  };
}

export default useAgents;
