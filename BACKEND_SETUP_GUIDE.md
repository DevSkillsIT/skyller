# Backend Agent Setup Guide

This guide explains how to set up backend agents with different frameworks for your multi-agent application.

## Architecture Overview

\`\`\`
Frontend (Next.js) → CopilotKit Runtime → Agent Backends
                      ↓ C1 Gateway
                      ↓ AG-UI Protocol
\`\`\`

Each of the 9 agents can run on different backend frameworks:
- **Agents 1-3**: LangGraph (Python)
- **Agents 4-6**: CrewAI (Python)
- **Agents 7-9**: Custom (Go/Rust/Java/Node.js)

## Current Status

Currently, all agents use the **C1 Gateway** directly from the Next.js API route. This works perfectly for:
- Generative UI generation
- Single-agent conversations
- Prototyping and MVP

To enable **multi-framework backends**, follow the setup instructions below.

---

## Option 1: LangGraph Backend (Python)

### Setup

1. Create a new directory for your agents:
\`\`\`bash
mkdir -p agents/langgraph
cd agents/langgraph
\`\`\`

2. Install dependencies:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install copilotkit langgraph langchain openai python-dotenv fastapi uvicorn
\`\`\`

3. Create `agent1.py`:
\`\`\`python
import os
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from copilotkit.sdk import CopilotKitSDK
from typing import TypedDict

load_dotenv()

# Define agent state
class AgentState(TypedDict):
    messages: list
    current_task: str

# Create LangGraph workflow
def research_node(state: AgentState):
    """Research agent node"""
    llm = ChatOpenAI(
        base_url="https://api.thesys.dev/v1/embed",
        api_key=os.getenv("THESYS_API_KEY"),
        model="c1/anthropic/claude-sonnet-4/v-20250815"
    )
    
    response = llm.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}

# Build graph
workflow = StateGraph(AgentState)
workflow.add_node("research", research_node)
workflow.set_entry_point("research")
workflow.add_edge("research", END)
graph = workflow.compile()

# Expose via CopilotKit
copilot = CopilotKitSDK(
    agent=graph,
    agent_name="Agent 1 - Research",
    agent_description="Research and data analysis specialist"
)

if __name__ == "__main__":
    copilot.run(port=8000, path="/agent1")
\`\`\`

4. Create similar files for `agent2.py` and `agent3.py` with different specializations

5. Run the agents:
\`\`\`bash
# Terminal 1
python agent1.py

# Terminal 2
python agent2.py

# Terminal 3
python agent3.py
\`\`\`

6. Update `.env.local`:
\`\`\`bash
AGENT_1_ENDPOINT=http://localhost:8000/agent1
AGENT_2_ENDPOINT=http://localhost:8000/agent2
AGENT_3_ENDPOINT=http://localhost:8000/agent3
\`\`\`

---

## Option 2: CrewAI Backend (Python)

### Setup

1. Create directory:
\`\`\`bash
mkdir -p agents/crewai
cd agents/crewai
\`\`\`

2. Install dependencies:
\`\`\`bash
python -m venv venv
source venv/bin/activate
pip install copilotkit crewai crewai-tools openai python-dotenv fastapi uvicorn
\`\`\`

3. Create `agent4.py`:
\`\`\`python
import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew
from copilotkit.sdk import CopilotKitSDK
from langchain_openai import ChatOpenAI

load_dotenv()

# Create LLM
llm = ChatOpenAI(
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY"),
    model="c1/anthropic/claude-sonnet-4/v-20250815"
)

# Define CrewAI agents
writer = Agent(
    role="Content Writer",
    goal="Write engaging marketing content",
    backstory="Expert content creator with 10 years experience",
    llm=llm
)

editor = Agent(
    role="Editor",
    goal="Edit and improve content",
    backstory="Senior editor specializing in marketing copy",
    llm=llm
)

# Create crew
crew = Crew(
    agents=[writer, editor],
    verbose=True
)

# Expose via CopilotKit
copilot = CopilotKitSDK(
    agent=crew,
    agent_name="Agent 4 - Content Team",
    agent_description="Content writing and editing team"
)

if __name__ == "__main__":
    copilot.run(port=8001, path="/agent4")
\`\`\`

4. Create `agent5.py` and `agent6.py` for other CrewAI teams

5. Run:
\`\`\`bash
python agent4.py  # Port 8001
python agent5.py  # Port 8001, different path
python agent6.py  # Port 8001, different path
\`\`\`

6. Update `.env.local`:
\`\`\`bash
AGENT_4_ENDPOINT=http://localhost:8001/agent4
AGENT_5_ENDPOINT=http://localhost:8001/agent5
AGENT_6_ENDPOINT=http://localhost:8001/agent6
\`\`\`

---

## Option 3: Custom Backend (Any Language)

### Node.js Example

\`\`\`typescript
// agents/custom/agent7.ts
import express from 'express';
import { CopilotRuntime, OpenAIAdapter } from '@copilotkit/runtime';
import OpenAI from 'openai';

const app = express();
app.use(express.json());

const openai = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: "c1/anthropic/claude-sonnet-4/v-20250815",
});

const runtime = new CopilotRuntime();

app.post('/agent7', async (req, res) => {
  // Custom agent logic
  const response = await runtime.process(req.body, serviceAdapter);
  res.json(response);
});

app.listen(8002, () => {
  console.log('Agent 7 running on port 8002');
});
\`\`\`

### Go Example

\`\`\`go
// agents/custom/agent8.go
package main

import (
    "encoding/json"
    "net/http"
    "github.com/sashabaranov/go-openai"
)

type AgentRequest struct {
    Message string \`json:"message"\`
}

func handleAgent8(w http.ResponseWriter, r *http.Request) {
    var req AgentRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    config := openai.DefaultConfig(os.Getenv("THESYS_API_KEY"))
    config.BaseURL = "https://api.thesys.dev/v1/embed"
    
    client := openai.NewClientWithConfig(config)
    
    // Agent logic here
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func main() {
    http.HandleFunc("/agent8", handleAgent8)
    http.ListenAndServe(":8002", nil)
}
\`\`\`

---

## Enabling Backend Routing in Frontend

Once your backend agents are running, update the frontend API route:

\`\`\`typescript
// app/api/copilot/route.ts
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime"
import { LangGraphAdapter } from "@copilotkit/runtime/langgraph"
import { CrewAIAdapter } from "@copilotkit/runtime/crewai"

export const POST = async (req: NextRequest) => {
  const body = await req.json()
  const agentId = body.agentId || 1

  // Determine which adapter to use based on agentId
  let serviceAdapter

  if (agentId >= 1 && agentId <= 3) {
    // LangGraph agents
    serviceAdapter = new LangGraphAdapter({
      endpoint: process.env[\`AGENT_\${agentId}_ENDPOINT\`]
    })
  } else if (agentId >= 4 && agentId <= 6) {
    // CrewAI agents
    serviceAdapter = new CrewAIAdapter({
      endpoint: process.env[\`AGENT_\${agentId}_ENDPOINT\`]
    })
  } else {
    // Custom agents (7-9)
    serviceAdapter = new OpenAIAdapter({
      endpoint: process.env[\`AGENT_\${agentId}_ENDPOINT\`]
    })
  }

  const runtime = new CopilotRuntime()
  
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  })

  return handleRequest(req)
}
\`\`\`

---

## Testing

1. **Start Backend Agents**:
\`\`\`bash
# Terminal 1-3: LangGraph
python agents/langgraph/agent1.py
python agents/langgraph/agent2.py
python agents/langgraph/agent3.py

# Terminal 4-6: CrewAI
python agents/crewai/agent4.py
python agents/crewai/agent5.py
python agents/crewai/agent6.py

# Terminal 7-9: Custom
node agents/custom/agent7.js
go run agents/custom/agent8.go
node agents/custom/agent9.js
\`\`\`

2. **Start Frontend**:
\`\`\`bash
npm run dev
\`\`\`

3. **Test Each Agent**:
- Open http://localhost:3000
- Click each agent tab (1-9)
- Send a message
- Verify responses come from correct backend

---

## Deployment

### Development
- Keep all agents running locally on different ports
- Use localhost endpoints in `.env.local`

### Production
- Deploy each agent as a separate service (Docker, Kubernetes, etc.)
- Update environment variables with production URLs
- Use internal networking for agent-to-agent communication

### Example Docker Compose

\`\`\`yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AGENT_1_ENDPOINT=http://langgraph:8000/agent1
      - AGENT_4_ENDPOINT=http://crewai:8001/agent4
      - AGENT_7_ENDPOINT=http://custom:8002/agent7

  langgraph:
    build: ./agents/langgraph
    ports:
      - "8000:8000"

  crewai:
    build: ./agents/crewai
    ports:
      - "8001:8001"

  custom:
    build: ./agents/custom
    ports:
      - "8002:8002"
\`\`\`

---

## Troubleshooting

### Agent not responding
- Check agent is running: `curl http://localhost:8000/agent1`
- Verify endpoint in `.env.local`
- Check agent logs for errors

### C1 UI not generating
- Ensure THESYS_API_KEY is set in agent backend
- Verify agent is using C1 model string correctly
- Check response format matches C1 DSL

### CORS errors
- Add CORS headers to agent backends
- Use proxy or same-origin deployment in production

---

## Next Steps

1. Start with **LangGraph** for agents 1-3 (easiest Python setup)
2. Add **CrewAI** for team-based agents 4-6
3. Build **custom** agents 7-9 for specialized tasks
4. Monitor performance and scale independently
5. Add observability (logging, metrics, tracing)

For questions, see `MULTI_AGENT_ARCHITECTURE.md` or open an issue.
\`\`\`
