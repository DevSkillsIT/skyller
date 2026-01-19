import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Agent configurations (TODO: move to env variables)
const AGENT_CONFIGS = {
  1: {
    endpoint: process.env.AGENT_1_ENDPOINT || "http://localhost:8000/agent1",
    framework: "langgraph",
  },
  2: {
    endpoint: process.env.AGENT_2_ENDPOINT || "http://localhost:8000/agent2",
    framework: "langgraph",
  },
  3: {
    endpoint: process.env.AGENT_3_ENDPOINT || "http://localhost:8000/agent3",
    framework: "langgraph",
  },
  4: {
    endpoint: process.env.AGENT_4_ENDPOINT || "http://localhost:8001/agent4",
    framework: "crewai",
  },
  5: {
    endpoint: process.env.AGENT_5_ENDPOINT || "http://localhost:8001/agent5",
    framework: "crewai",
  },
  6: {
    endpoint: process.env.AGENT_6_ENDPOINT || "http://localhost:8001/agent6",
    framework: "crewai",
  },
  7: {
    endpoint: process.env.AGENT_7_ENDPOINT || "http://localhost:8002/agent7",
    framework: "custom",
  },
  8: {
    endpoint: process.env.AGENT_8_ENDPOINT || "http://localhost:8002/agent8",
    framework: "custom",
  },
  9: {
    endpoint: process.env.AGENT_9_ENDPOINT || "http://localhost:8002/agent9",
    framework: "custom",
  },
};

// C1 Gateway for Generative UI
const c1Client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY || "demo-key",
});

const c1Adapter = new OpenAIAdapter({
  openai: c1Client,
  model: "c1/anthropic/claude-sonnet-4/v-20250815",
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const agentId = body.agentId || 1;

    console.log(`[v0] Routing to Agent ${agentId}`);

    // Get agent configuration
    const agentConfig = AGENT_CONFIGS[agentId as keyof typeof AGENT_CONFIGS];

    if (!agentConfig) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    // TODO: Implement framework-specific adapters
    // For now, all agents use C1 adapter (Generative UI)
    // In production, you would route to actual agent backends:
    //
    // if (agentConfig.framework === "langgraph") {
    //   serviceAdapter = new LangGraphAdapter({ endpoint: agentConfig.endpoint })
    // } else if (agentConfig.framework === "crewai") {
    //   serviceAdapter = new CrewAIAdapter({ endpoint: agentConfig.endpoint })
    // } else {
    //   serviceAdapter = new OpenAIAdapter({ endpoint: agentConfig.endpoint })
    // }

    const runtime = new CopilotRuntime();

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter: c1Adapter, // All use C1 for now (Generative UI)
      endpoint: "/api/agents",
    });

    return handleRequest(req);
  } catch (error) {
    console.error("[v0] Agent routing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
