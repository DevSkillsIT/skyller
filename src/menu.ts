/**
 * SPEC-006-skyller - Menu de Integracoes
 *
 * VERSAO SIMPLIFICADA para build standalone.
 * Apenas integracoes disponiveis via HttpAgent estao listadas.
 *
 * O arquivo original foi salvo em menu.ts.original
 *
 * Para habilitar mais integracoes:
 * 1. Instale os pacotes necessarios (ex: pnpm add @ag-ui/agno)
 * 2. Adicione a integracao aqui
 * 3. Adicione o handler em agents.ts
 */

import type { MenuIntegrationConfig } from "./types/integration";
export * from "./types/integration";

/**
 * Integration configuration - SINGLE SOURCE OF TRUTH
 *
 * This file defines all integrations and their available features.
 * Used by:
 * - UI menu components
 * - proxy.ts (for route validation)
 * - agents.ts validates agent keys against these features
 */

export const menuIntegrations = [
  // ===================================
  // Integracao principal: Nexus Core (Skills AI)
  // ===================================
  {
    id: "nexus-core",
    name: "Nexus Core (Skills AI)",
    features: [
      "agentic_chat",
      "tool_based_generative_ui",
      "backend_tool_rendering",
      "human_in_the_loop",
    ],
  },

  // ===================================
  // Integracoes via HttpAgent (generico)
  // ===================================
  {
    id: "agent-spec-langgraph",
    name: "Open Agent Spec (LangGraph)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "tool_based_generative_ui",
    ],
  },
  {
    id: "agent-spec-wayflow",
    name: "Open Agent Spec (Wayflow)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "tool_based_generative_ui",
      "human_in_the_loop",
    ],
  },
  {
    id: "microsoft-agent-framework-python",
    name: "Microsoft Agent Framework (Python)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "agentic_generative_ui",
      "shared_state",
      "tool_based_generative_ui",
      "predictive_state_updates",
    ],
  },
  {
    id: "microsoft-agent-framework-dotnet",
    name: "Microsoft Agent Framework (.NET)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "agentic_generative_ui",
      "shared_state",
      "tool_based_generative_ui",
      "predictive_state_updates",
    ],
  },

  // ===================================
  // Integracoes desabilitadas (requerem pacotes @ag-ui/* extras)
  // Descomente e adicione em agents.ts quando os pacotes estiverem instalados
  // ===================================

  /*
  // Requer: pnpm add @ag-ui/agno
  {
    id: "agno",
    name: "Agno",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "tool_based_generative_ui",
    ],
  },

  // Requer: pnpm add @ag-ui/langgraph
  {
    id: "langgraph",
    name: "LangGraph (Python)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "agentic_generative_ui",
      "predictive_state_updates",
      "shared_state",
      "tool_based_generative_ui",
      "subgraphs",
    ],
  },
  {
    id: "langgraph-fastapi",
    name: "LangGraph (FastAPI)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "agentic_chat_reasoning",
      "agentic_generative_ui",
      "predictive_state_updates",
      "shared_state",
      "tool_based_generative_ui",
      "subgraphs",
    ],
  },
  {
    id: "langgraph-typescript",
    name: "LangGraph (Typescript)",
    features: [
      "agentic_chat",
      "human_in_the_loop",
      "agentic_generative_ui",
      "predictive_state_updates",
      "shared_state",
      "tool_based_generative_ui",
      "subgraphs",
    ],
  },

  // Requer: pnpm add @ag-ui/mastra @mastra/client-js @mastra/libsql
  {
    id: "mastra",
    name: "Mastra",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "tool_based_generative_ui",
    ],
  },
  {
    id: "mastra-agent-local",
    name: "Mastra Agent (Local)",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "shared_state",
      "tool_based_generative_ui",
    ],
  },

  // Requer: pnpm add @ag-ui/pydantic-ai
  {
    id: "pydantic-ai",
    name: "Pydantic AI",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "agentic_generative_ui",
      "shared_state",
      "tool_based_generative_ui",
    ],
  },

  // Requer: pnpm add @ag-ui/spring-ai
  {
    id: "spring-ai",
    name: "Spring AI",
    features: [
      "agentic_chat",
      "shared_state",
      "tool_based_generative_ui",
      "human_in_the_loop",
      "agentic_generative_ui",
    ],
  },

  // Requer: pnpm add @ag-ui/crewai
  {
    id: "crewai",
    name: "CrewAI",
    features: [
      "agentic_chat",
      "human_in_the_loop",
      "agentic_generative_ui",
      "predictive_state_updates",
      "shared_state",
      "tool_based_generative_ui",
    ],
  },

  // Requer: pnpm add @ag-ui/llamaindex
  {
    id: "llama-index",
    name: "LlamaIndex",
    features: [
      "agentic_chat",
      "backend_tool_rendering",
      "human_in_the_loop",
      "agentic_generative_ui",
      "shared_state",
    ],
  },

  // Pacotes nao disponiveis no npm:
  // - middleware-starter (@ag-ui/middleware-starter)
  // - server-starter (@ag-ui/server-starter)
  // - server-starter-all-features (@ag-ui/server-starter-all-features)
  // - adk-middleware (@ag-ui/adk)
  // - a2a, a2a-basic (@a2a-js/sdk)
  // - aws-strands (@ag-ui/aws-strands)
  */

] as const satisfies readonly MenuIntegrationConfig[];
