/**
 * SPEC-006-skyller - Integracoes de Agentes AG-UI
 *
 * Define os agentes disponiveis para o Skyller.
 * Versao SIMPLIFICADA para build standalone com dependencias minimas.
 *
 * NOTA: Muitos pacotes do AG-UI Dojo original nao estao disponiveis no npm
 * pois sao pacotes internos do monorepo. Esta versao usa apenas @ag-ui/client
 * com HttpAgent para integracao generica.
 *
 * Para habilitar mais integracoes, instale os pacotes do monorepo AG-UI:
 * - @ag-ui/agno (npm)
 * - @ag-ui/langgraph (npm)
 * - @ag-ui/crewai (npm)
 * - @ag-ui/pydantic-ai (npm)
 * - @ag-ui/mastra (npm) + @mastra/client-js + @mastra/libsql/dynamodb
 * - @copilotkitnext/* (interno, nao disponivel)
 */

import "server-only";

import type { AgentsMap } from "./types/agents";
import { mapAgents } from "./utils/agents";
import getEnvVars from "./env";
import { HttpAgent } from "@ag-ui/client";

// Pacotes @ag-ui disponiveis no npm (importar conforme necessario):
// import { AgnoAgent } from "@ag-ui/agno";
// import { LangGraphAgent, LangGraphHttpAgent } from "@ag-ui/langgraph";
// import { CrewAIAgent } from "@ag-ui/crewai";
// import { LlamaIndexAgent } from "@ag-ui/llamaindex";
// import { PydanticAIAgent } from "@ag-ui/pydantic-ai";
// import { SpringAiAgent } from "@ag-ui/spring-ai";
// import { A2AAgent } from "@ag-ui/a2a";
// import { A2AMiddlewareAgent } from "@ag-ui/a2a-middleware";
// import { LangChainAgent } from "@ag-ui/langchain";
// import { MastraAgent } from "@ag-ui/mastra";

const envVars = getEnvVars();

/**
 * Integracoes de agentes usando HttpAgent (generico)
 *
 * HttpAgent funciona com qualquer backend que implemente o protocolo AG-UI.
 * E a forma mais simples e compativel de conectar com backends.
 */
export const agentsIntegrations = {
  // ===================================
  // Integracao principal: Nexus Core (Agno backend)
  // ===================================
  "nexus-core": async () =>
    mapAgents(
      (path) => new HttpAgent({
        url: `${envVars.agnoUrl || "http://localhost:7777"}/${path}/agui`,
      }),
      {
        agentic_chat: "agentic_chat",
        tool_based_generative_ui: "tool_based_generative_ui",
        backend_tool_rendering: "backend_tool_rendering",
        human_in_the_loop: "human_in_the_loop",
      }
    ),

  // ===================================
  // Integracoes via HttpAgent (generico)
  // ===================================

  "agent-spec-langgraph": async () =>
    mapAgents(
      (path) => new HttpAgent({
        url: `${envVars.agentSpecUrl}/langgraph/${path}`,
      }),
      {
        agentic_chat: "agentic_chat",
        backend_tool_rendering: "backend_tool_rendering",
        human_in_the_loop: "human_in_the_loop",
        tool_based_generative_ui: "tool_based_generative_ui",
      }
    ),

  "agent-spec-wayflow": async () =>
    mapAgents(
      (path) => new HttpAgent({
        url: `${envVars.agentSpecUrl}/wayflow/${path}`,
      }),
      {
        agentic_chat: "agentic_chat",
        backend_tool_rendering: "backend_tool_rendering",
        tool_based_generative_ui: "tool_based_generative_ui",
        human_in_the_loop: "human_in_the_loop",
      }
    ),

  "microsoft-agent-framework-python": async () =>
    mapAgents(
      (path) => new HttpAgent({ url: `${envVars.agentFrameworkPythonUrl}/${path}` }),
      {
        agentic_chat: "agentic_chat",
        backend_tool_rendering: "backend_tool_rendering",
        human_in_the_loop: "human_in_the_loop",
        agentic_generative_ui: "agentic_generative_ui",
        shared_state: "shared_state",
        tool_based_generative_ui: "tool_based_generative_ui",
        predictive_state_updates: "predictive_state_updates",
      }
    ),

  "microsoft-agent-framework-dotnet": async () =>
    mapAgents(
      (path) => new HttpAgent({ url: `${envVars.agentFrameworkDotnetUrl}/${path}` }),
      {
        agentic_chat: "agentic_chat",
        backend_tool_rendering: "backend_tool_rendering",
        human_in_the_loop: "human_in_the_loop",
        agentic_generative_ui: "agentic_generative_ui",
        shared_state: "shared_state",
        tool_based_generative_ui: "tool_based_generative_ui",
        predictive_state_updates: "predictive_state_updates",
      }
    ),

  // ===================================
  // Integracoes comentadas (requerem pacotes extras)
  // ===================================

  /*
  // Requer: pnpm add @ag-ui/agno
  agno: async () =>
    mapAgents(
      (path) => new AgnoAgent({ url: `${envVars.agnoUrl}/${path}/agui` }),
      {
        agentic_chat: "agentic_chat",
        tool_based_generative_ui: "tool_based_generative_ui",
        backend_tool_rendering: "backend_tool_rendering",
        human_in_the_loop: "human_in_the_loop",
      }
    ),

  // Requer: pnpm add @ag-ui/pydantic-ai
  "pydantic-ai": async () =>
    mapAgents(
      (path) => new PydanticAIAgent({ url: `${envVars.pydanticAIUrl}/${path}` }),
      {
        agentic_chat: "agentic_chat",
        agentic_generative_ui: "agentic_generative_ui",
        human_in_the_loop: "human_in_the_loop",
        shared_state: "shared_state",
        tool_based_generative_ui: "tool_based_generative_ui",
        backend_tool_rendering: "backend_tool_rendering",
      }
    ),

  // Requer: pnpm add @ag-ui/langgraph
  langgraph: async () => ({
    ...mapAgents(
      (graphId) => new LangGraphAgent({ deploymentUrl: envVars.langgraphPythonUrl, graphId }),
      {
        agentic_chat: "agentic_chat",
        backend_tool_rendering: "backend_tool_rendering",
        agentic_generative_ui: "agentic_generative_ui",
        human_in_the_loop: "human_in_the_loop",
        predictive_state_updates: "predictive_state_updates",
        shared_state: "shared_state",
        tool_based_generative_ui: "tool_based_generative_ui",
        subgraphs: "subgraphs",
      }
    ),
    agentic_chat_reasoning: new LangGraphHttpAgent({
      url: `${envVars.langgraphPythonUrl}/agent/agentic_chat_reasoning`,
    }),
  }),

  // Requer: pnpm add @ag-ui/crewai
  crewai: async () =>
    mapAgents(
      (path) => new CrewAIAgent({ url: `${envVars.crewAiUrl}/${path}` }),
      {
        agentic_chat: "agentic_chat",
        human_in_the_loop: "human_in_the_loop",
        tool_based_generative_ui: "tool_based_generative_ui",
        agentic_generative_ui: "agentic_generative_ui",
        shared_state: "shared_state",
        predictive_state_updates: "predictive_state_updates",
      }
    ),

  // Requer: pnpm add @ag-ui/llamaindex
  "llama-index": async () =>
    mapAgents(
      (path) => new LlamaIndexAgent({ url: `${envVars.llamaIndexUrl}/${path}/run` }),
      {
        agentic_chat: "agentic_chat",
        human_in_the_loop: "human_in_the_loop",
        agentic_generative_ui: "agentic_generative_ui",
        shared_state: "shared_state",
        backend_tool_rendering: "backend_tool_rendering",
      }
    ),

  // Requer: pnpm add @ag-ui/spring-ai
  "spring-ai": async () =>
    mapAgents(
      (path) => new SpringAiAgent({ url: `${envVars.springAiUrl}/${path}/agui` }),
      {
        agentic_chat: "agentic_chat",
        shared_state: "shared_state",
        tool_based_generative_ui: "tool_based_generative_ui",
        human_in_the_loop: "human_in_the_loop",
        agentic_generative_ui: "agentic_generative_ui",
      }
    ),

  // Requer: pnpm add @ag-ui/mastra @mastra/client-js
  mastra: async () => {
    const mastraClient = new MastraClient({ baseUrl: envVars.mastraUrl });
    return MastraAgent.getRemoteAgents({ mastraClient });
  },

  // Requer: pnpm add @ag-ui/langchain @langchain/openai
  langchain: async () => {
    const { ChatOpenAI } = await import("@langchain/openai");
    const chatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
    const agent = new LangChainAgent({
      chainFn: async ({ messages, tools, threadId }) => {
        const model = chatOpenAI.bindTools(tools, { strict: true });
        return model.stream(messages, { tools, metadata: { conversation_id: threadId } });
      },
    });
    return { agentic_chat: agent, tool_based_generative_ui: agent };
  },

  // Requer: pnpm add @ag-ui/a2a @ag-ui/a2a-middleware
  a2a: async () => {
    const agentUrls = [
      envVars.a2aMiddlewareBuildingsManagementUrl,
      envVars.a2aMiddlewareFinanceUrl,
      envVars.a2aMiddlewareItUrl,
    ];
    const orchestrationAgent = new HttpAgent({ url: envVars.a2aMiddlewareOrchestratorUrl });
    return {
      a2a_chat: new A2AMiddlewareAgent({
        description: "Middleware that connects to remote A2A agents",
        agentUrls,
        orchestrationAgent,
        instructions: "You are an HR agent for hiring employees.",
      }),
    };
  },
  */

  // ===================================
  // Pacotes nao disponiveis no npm (internos do monorepo AG-UI):
  // ===================================
  // - @ag-ui/middleware-starter
  // - @ag-ui/server-starter
  // - @ag-ui/server-starter-all-features
  // - @ag-ui/adk
  // - @ag-ui/aws-strands
  // - @a2a-js/sdk/client
  // - @copilotkitnext/* (CopilotKit vNext)

} satisfies AgentsMap;
