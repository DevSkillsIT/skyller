# Multi-Agent Protocol Integration Guide
**For LLM & CLI Agent/Coder Assistants**

---

## Executive Summary

This document provides a comprehensive technical guide for integrating three complementary agent-to-UI protocols in a multi-agent application:

1. **C1 by Thesys** - Generative UI Gateway (PRIMARY - IMPLEMENTED)
2. **AG-UI by CopilotKit** - Real-time Event Streaming (COMPLEMENTARY - IMPLEMENTED)
3. **MCP UI by Idosal** - Rich Embedded Widgets (OPTIONAL - NOT IMPLEMENTED)

**Current Architecture**: C1 + AG-UI (Recommended)

---

## Table of Contents

1. [Protocol Architecture Overview](#protocol-architecture-overview)
2. [C1 by Thesys - Deep Dive](#c1-by-thesys-deep-dive)
3. [AG-UI Protocol - Deep Dive](#ag-ui-protocol-deep-dive)
4. [MCP UI - Deep Dive](#mcp-ui-deep-dive)
5. [Integration Patterns & Decision Matrix](#integration-patterns--decision-matrix)
6. [Implementation Status](#implementation-status)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [AI Gateway Comparison: C1 vs Vercel AI Gateway vs CopilotKit](#ai-gateway-comparison-c1-vs-vercel-ai-gateway-vs-copilotkit)
11. [Backend Framework Flexibility](#backend-framework-flexibility)
12. [Conclusion: What to Use](#conclusion-what-to-use)

---

## Protocol Architecture Overview

### The Three-Layer Stack

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                    │
├─────────────────────────────────────────────────────────────┤
│  C1 DSL Renderer │ AG-UI Event Stream │ MCP UIResource      │
│  (@thesysai/     │ (useAGUI hook)     │ (UIResourceRenderer)│
│   genui-sdk)     │                    │                      │
├─────────────────────────────────────────────────────────────┤
│                    PROTOCOL LAYER                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ C1 Protocol  │ │ AG-UI Events │ │ MCP UI Resources     ││
│  │ (JSON-based  │ │ (SSE Stream) │ │ (JSON Payload)       ││
│  │  UI Schema)  │ │              │ │                      ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    BACKEND / GATEWAY                         │
│  ┌──────────────────────────────────────────────────────────┤
│  │ C1 Gateway LLM (Primary Router)                          │
│  │ - Receives all user requests                             │
│  │ - Orchestrates multi-agent communication                 │
│  │ - Generates C1 DSL for UI                                │
│  │ - Streams AG-UI events for real-time updates            │
│  │ - Can invoke MCP servers as tools                        │
│  └──────────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────────┤
│                    AGENT LAYER                               │
│  Agent 1 │ Agent 2 │ ... │ Agent 9                          │
│  (Each agent can use MCP for context, C1 for UI generation) │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## C1 by Thesys - Deep Dive

### What is C1?

**C1** is a **Generative UI API** that acts as middleware between LLMs and frontends. It augments LLMs to respond with **interactive UI components** instead of plain text.

#### Key Characteristics

- **Type**: API Service (Hosted by Thesys)
- **Protocol**: OpenAI-Compatible REST API
- **Output Format**: C1 DSL (JSON-based UI Schema wrapped in XML tags)
- **Framework Support**: React (official SDK), Vue/Angular (community)
- **Model Agnostic**: Supports Claude Sonnet 4, GPT-5, and custom models

### Architecture

\`\`\`
User Prompt → Backend → C1 API (https://api.thesys.dev/v1/embed)
                ↓
        C1 LLM + UI Generation Engine
                ↓
        C1 Response (C1 DSL)
                ↓
        Frontend <C1Component /> renders UI
\`\`\`

### C1 Response Structure

\`\`\`xml
<c1-thinking>
  <!-- Real-time thinking states -->
  {"state": "analyzing", "progress": 0.3}
</c1-thinking>

<c1-ui>
  <!-- C1 DSL JSON Schema -->
  {
    "type": "container",
    "layout": "vertical",
    "children": [
      {
        "type": "card",
        "title": "Sales Dashboard",
        "children": [...]
      },
      {
        "type": "chart",
        "chartType": "line",
        "data": [...]
      }
    ]
  }
</c1-ui>

<c1-artifact>
  <!-- Document-style content (reports, slides) -->
  {...}
</c1-artifact>
\`\`\`

### C1 DSL Component Library

C1 provides a **structured component library**:

- **Layout**: Container, Stack, Grid, Flex
- **Data Display**: Card, Table, List, Metric
- **Charts**: Line, Bar, Pie, Area, Scatter
- **Input**: Form, Input, Select, Checkbox, Radio
- **Feedback**: Alert, Modal, Toast, Progress
- **Interactive**: Button, Tabs, Accordion, Stepper
- **Media**: Image, Video, Audio

### Integration Patterns

#### 1. **Gateway LLM Pattern** (RECOMMENDED - IMPLEMENTED)

C1 is the **primary entry point** for all user requests.

\`\`\`typescript
// Backend (Next.js Route Handler)
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const response = await openai.chat.completions.create({
    model: "c1/anthropic/claude-sonnet-4/v-20250815",
    messages,
    stream: true,
  });
  
  return new Response(response);
}
\`\`\`

\`\`\`tsx
// Frontend (React)
import { C1Component } from "@thesysai/genui-sdk";

<C1Component 
  response={c1Response} 
  onAction={(action) => {
    // Handle user interactions
    console.log(action);
  }}
/>
\`\`\`

**Pros**:
- Zero latency overhead (C1 is the gateway)
- Full context awareness (tools, state, history)
- Most flexible and powerful

**Cons**:
- Requires Thesys API key
- Model selection limited to C1-supported models

#### 2. **Presentation Layer Pattern**

Your existing LLM generates text → C1 converts text to UI.

**Pros**: Can use any custom LLM
**Cons**: 2x latency (sequential calls), less context for C1

#### 3. **Tool Call Pattern**

Your gateway LLM invokes C1 as a tool when UI generation is needed.

**Pros**: Selective UI generation
**Cons**: Error-prone tool calling, additional latency

---

## AG-UI Protocol - Deep Dive

### What is AG-UI?

**AG-UI** (Agent-User Interaction) is an **open-source event-based protocol** for real-time, bidirectional communication between AI agents and user interfaces.

#### Key Characteristics

- **Type**: Open Protocol Specification
- **Architecture**: Event-driven (Server-Sent Events - SSE)
- **Framework Support**: React (CopilotKit), Angular (in dev), Community clients (Go, Rust, Java)
- **Model Agnostic**: YES (protocol is independent of LLM)
- **State Management**: Built-in shared state + human-in-the-loop (HITL)

### Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ useAGUI() hook                                      ││
│  │ - Subscribes to event stream                        ││
│  │ - Updates UI in real-time                           ││
│  │ - Sends user actions back to agent                  ││
│  └─────────────────────────────────────────────────────┘│
└────────────────────────┬────────────────────────────────┘
                         │ SSE Stream (AG-UI Events)
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Backend (AG-UI Server)                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ AG-UI Event Emitter                                 ││
│  │ - agent.message(token)                              ││
│  │ - agent.toolCall(name, args)                        ││
│  │ - agent.setState(key, value)                        ││
│  │ - agent.lifecycle("thinking" | "done")              ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
\`\`\`

### 16 Standardized Event Types

1. **message** - Token-by-token text streaming
2. **tool_call** - Agent invokes a tool
3. **tool_result** - Tool execution result
4. **state_update** - Shared state changes
5. **lifecycle** - Agent state (thinking, working, done)
6. **error** - Error events
7. **interrupt** - Human-in-the-loop requests
8. **resume** - Resume after HITL
9. **agent_start** - Multi-agent: agent started
10. **agent_end** - Multi-agent: agent finished
11. **ui_component** - Declarative UI component rendered
12. **confirmation_request** - Ask user approval
13. **confirmation_response** - User approved/rejected
14. **metrics** - Performance metrics
15. **metadata** - Additional context
16. **ping** - Keep-alive

### AG-UI with CopilotKit

\`\`\`tsx
import { useAGUI } from "@copilotkit/react-core";

function AgentInterface() {
  const { agent, ui, state } = useAGUI({
    agentId: "agent-1",
    onStateChange: (newState) => {
      console.log("Agent state updated:", newState);
    },
    onToolCall: (toolName, args) => {
      console.log(`Tool called: ${toolName}`, args);
    },
  });

  return (
    <div>
      <p>Agent Status: {agent.status}</p>
      <div>{ui.render()}</div>
      <button onClick={() => agent.interrupt("Wait, I need to clarify...")}>
        Interrupt
      </button>
    </div>
  );
}
\`\`\`

### AG-UI Use Cases

- **Real-time collaboration** (Google Docs-like AI interaction)
- **Multi-agent orchestration** (9 agents in your app)
- **Low-latency streaming** (token-by-token updates)
- **HITL workflows** (approval gates, confirmations)
- **Shared state management** (sync state across components)

---

## MCP UI - Deep Dive

### What is MCP UI?

**MCP UI** is an extension of the **Model Context Protocol (MCP)** that enables **rich, interactive UI resources** to be delivered from MCP servers and rendered client-side.

#### Key Characteristics

- **Type**: Protocol Extension (MCP + UI Resources)
- **Architecture**: Resource-based (UIResource JSON payloads)
- **Rendering**: Sandboxed iframes or Shopify Remote DOM
- **Framework Support**: React, Web Components
- **Creator**: Ido Salomon + Liad Yosef

### Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ <UIResourceRenderer resource={mcpResource} />       ││
│  │ - Renders HTML/JS in sandboxed iframe              ││
│  │ - Handles postMessage communication                 ││
│  └─────────────────────────────────────────────────────┘│
└────────────────────────┬────────────────────────────────┘
                         │ UIResource JSON
                         ↓
┌─────────────────────────────────────────────────────────┐
│  MCP Server (Backend)                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ createUIResource({                                  ││
│  │   uri: 'ui://widget/shopify-product',              ││
│  │   content: { type: 'rawHtml', htmlString: '...' }  ││
│  │ })                                                  ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
\`\`\`

### UIResource Structure

\`\`\`typescript
import { createUIResource } from '@mcp-ui/server';

const uiResource = createUIResource({
  uri: 'ui://dashboard/sales',
  content: {
    type: 'rawHtml', // or 'remoteDom' for Shopify Remote DOM
    htmlString: `
      <div class="sales-widget">
        <h2>Monthly Sales</h2>
        <div id="chart"></div>
        <button id="refresh">Refresh</button>
      </div>
      <script>
        document.getElementById('refresh').addEventListener('click', () => {
          // Communicate back to host via postMessage
          window.parent.postMessage({
            type: 'tool',
            payload: { toolName: 'refreshSales', params: {} }
          }, '*');
        });
      </script>
    `
  },
  encoding: 'text'
});
\`\`\`

### MCP UI Use Cases

- **E-commerce**: Product carousels, checkout forms, shopping widgets
- **Data Visualizations**: Interactive charts, dashboards
- **CMS Tools**: Content editors, media galleries
- **Forms & Surveys**: Complex multi-step forms, quizzes
- **Embedded Apps**: Mini-apps within chat (calculator, timer, etc.)

### MCP UI Limitations

- **Sandboxing Overhead**: iframes introduce latency
- **Security Concerns**: Arbitrary HTML/JS execution
- **Limited Real-time**: Not designed for streaming updates
- **Complexity**: Requires MCP server infrastructure

---

## Integration Patterns & Decision Matrix

### Pattern 1: C1 Gateway + AG-UI Streaming (IMPLEMENTED)

**Architecture**:
\`\`\`
User → C1 (Gateway LLM) → Agents
         ↓
    C1 DSL (UI Schema)
         +
    AG-UI Events (Real-time)
         ↓
    Frontend (React)
\`\`\`

**When to Use**:
- Multi-agent orchestration (your 9 agents)
- Real-time streaming required
- Need declarative UI generation
- Want lowest latency

**Implementation**:
\`\`\`typescript
// Backend: C1 as Gateway with AG-UI events
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

const serviceAdapter = new OpenAIAdapter({ openai });
const runtime = new CopilotRuntime();

// C1 generates UI, AG-UI handles streaming
\`\`\`

\`\`\`tsx
// Frontend: Render C1 UI with AG-UI state
import { C1Component } from "@thesysai/genui-sdk";
import { useAGUI } from "@copilotkit/react-core";

function AgentChat() {
  const { agent, ui } = useAGUI();
  
  return (
    <C1Component 
      response={agent.response}
      onAction={(action) => {
        // User interaction → send via AG-UI
        agent.sendMessage(action);
      }}
    />
  );
}
\`\`\`

**Pros**:
- Best of both worlds
- C1 handles UI generation (structured, safe)
- AG-UI handles real-time streaming
- Multi-agent support built-in

**Cons**:
- Requires both Thesys API key and CopilotKit setup
- Slight learning curve for integration

---

### Pattern 2: C1 + MCP UI Widgets

**Architecture**:
\`\`\`
User → C1 (Gateway) → Detects "show shopify products"
         ↓
    Tool Call: getMCPWidget("shopify-products")
         ↓
    Returns UIResource (MCP UI)
         ↓
    C1 Response includes <UIResourceRenderer />
\`\`\`

**When to Use**:
- Need rich embedded widgets (e-commerce, dashboards)
- Already have MCP servers
- Want isolated interactive mini-apps

**Implementation**:
\`\`\`typescript
// Backend: C1 calls MCP as tool
const response = await openai.chat.completions.create({
  model: "c1/anthropic/claude-sonnet-4/v-20250815",
  messages,
  tools: [
    {
      type: "function",
      function: {
        name: "show_shopify_products",
        description: "Display Shopify product carousel",
        parameters: { ... }
      }
    }
  ]
});

// When tool is called, invoke MCP server
if (response.tool_calls?.includes("show_shopify_products")) {
  const mcpResource = await mcpClient.getUIResource("shopify-products");
  // Return MCP UIResource in C1 response
}
\`\`\`

\`\`\`tsx
// Frontend: Render MCP widget inside C1 component
import { UIResourceRenderer } from "@mcp-ui/client";

<C1Component 
  response={c1Response}
  customRenderers={{
    mcpWidget: (props) => <UIResourceRenderer resource={props.resource} />
  }}
/>
\`\`\`

**Pros**:
- Leverage existing MCP ecosystem
- Rich interactive widgets
- Isolated security context

**Cons**:
- Added complexity (3 protocols)
- iframe/Remote DOM overhead
- Not real-time streaming

---

### Pattern 3: AG-UI + MCP Context + Manual UI

**Architecture**:
\`\`\`
User → AG-UI (Event Stream) → Agents use MCP for context
         ↓
    Agents emit AG-UI events
         ↓
    Frontend renders custom components
\`\`\`

**When to Use**:
- Don't want managed UI generation
- Full control over UI components
- Already have component library
- MCP for context/tools only (not UI)

**Pros**:
- Maximum flexibility
- No vendor lock-in for UI
- MCP provides rich context

**Cons**:
- Manual UI development required
- No automatic UI generation
- More code to maintain

---

## Decision Matrix

| Need | Use C1 | Use AG-UI | Use MCP UI |
|------|--------|-----------|------------|
| Automatic UI generation | ✅ YES | ❌ NO | ❌ NO |
| Real-time streaming | ⚠️ Yes via SSE | ✅ YES | ❌ NO |
| Multi-agent orchestration | ⚠️ Via gateway | ✅ YES | ❌ NO |
| Embedded rich widgets | ⚠️ Limited | ❌ NO | ✅ YES |
| E-commerce UIs | ⚠️ Basic | ❌ NO | ✅ YES |
| Low latency | ✅ YES | ✅ YES | ❌ NO |
| Security (sandboxed) | ✅ YES | ✅ YES | ⚠️ iframe |
| Framework agnostic | ❌ React only | ⚠️ Mostly React | ✅ YES |
| Open source | ❌ API only | ✅ YES | ✅ YES |
| Custom LLM support | ⚠️ Limited | ✅ YES | ✅ YES |

---

## Implementation Status

### Currently Implemented

#### ✅ C1 by Thesys (Gateway LLM Pattern)
- **Status**: IMPLEMENTED
- **Config**: `THESYS_API_KEY` required
- **Model**: `c1/anthropic/claude-sonnet-4/v-20250815`
- **Endpoint**: `https://api.thesys.dev/v1/embed`
- **Frontend**: `@thesysai/genui-sdk` React SDK
- **Use Cases**: Primary UI generation for all 9 agents

#### ✅ AG-UI Protocol (CopilotKit)
- **Status**: IMPLEMENTED
- **Config**: `@copilotkit/react-core` + `@copilotkit/runtime`
- **Integration**: C1 responses rendered via CopilotKit components
- **Use Cases**: Real-time streaming, multi-agent state management
- **Features**:
  - `useAGUI()` hook for agent communication
  - Shared state management
  - Human-in-the-loop (HITL) support
  - Multi-agent orchestration

### Not Implemented (Optional)

#### ❌ MCP UI by Idosal
- **Status**: NOT IMPLEMENTED
- **Reason**: Not required for MVP; can be added later for specialized widgets
- **Future Use Cases**:
  - Shopify product widgets
  - Klaviyo email builders
  - Google Drive file pickers
  - Notion database viewers

**Implementation Plan (if needed)**:
1. Install MCP UI SDKs: `npm install @mcp-ui/server @mcp-ui/client`
2. Create MCP server with UIResource exports
3. Integrate MCP server as C1 tool
4. Add `<UIResourceRenderer>` to C1 custom renderers

---

## Code Examples

### Complete Integration Example

\`\`\`typescript
// app/api/copilot/route.ts
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

// C1 as Gateway LLM
const openai = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: "c1/anthropic/claude-sonnet-4/v-20250815",
});

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  });

  return handleRequest(req);
};
\`\`\`

\`\`\`tsx
// app/layout.tsx
import { CopilotKit } from "@copilotkit/react-core";
import { ThemeProvider } from "@thesysai/genui-sdk";
import "@copilotkit/react-ui/styles.css";
import "@crayonai/react-ui/styles/index.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CopilotKit runtimeUrl="/api/copilot">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </CopilotKit>
      </body>
    </html>
  );
}
\`\`\`

\`\`\`tsx
// components/agent-chat.tsx
"use client";

import { C1Component } from "@thesysai/genui-sdk";
import { useCopilotChat } from "@copilotkit/react-core";
import { MessageRole, TextMessage } from "@copilotkit/runtime-client-gql";

export function AgentChat({ agentId }: { agentId: string }) {
  const { messages, appendMessage, isLoading } = useCopilotChat();

  return (
    <div className="flex flex-col h-full">
      {messages.map((message) => {
        if (message.role === MessageRole.Assistant) {
          // Render C1 generative UI
          return (
            <C1Component
              key={message.id}
              response={message.content}
              isGenerating={isLoading}
              onAction={(action) => {
                // User interacted with C1 UI → send back via AG-UI
                appendMessage(
                  new TextMessage({
                    role: MessageRole.User,
                    content: JSON.stringify(action),
                  })
                );
              }}
            />
          );
        }
        
        // User message
        return (
          <div key={message.id} className="user-message">
            {message.content}
          </div>
        );
      })}
    </div>
  );
}
\`\`\`

### Multi-Agent Orchestration

\`\`\`typescript
// lib/agents.ts
import { CopilotRuntime } from "@copilotkit/runtime";

export const agents = [
  { id: "agent-1", name: "Research Agent", systemPrompt: "..." },
  { id: "agent-2", name: "Writing Agent", systemPrompt: "..." },
  // ... 9 agents total
];

export async function routeToAgent(userMessage: string, runtime: CopilotRuntime) {
  // C1 as gateway decides which agent to invoke
  const response = await runtime.chat({
    messages: [
      {
        role: "system",
        content: `You are a routing agent. Decide which of these agents should handle the request: ${agents.map(a => a.name).join(", ")}`
      },
      { role: "user", content: userMessage }
    ],
    tools: agents.map(agent => ({
      name: `invoke_${agent.id}`,
      description: `Invoke ${agent.name}`,
      parameters: { type: "object", properties: {} }
    }))
  });

  // Extract tool call to determine which agent
  const agentId = response.tool_calls?.[0]?.function.name.replace("invoke_", "");
  return agents.find(a => a.id === agentId);
}
\`\`\`

---

## Best Practices

### C1 Best Practices

1. **Use Gateway LLM Pattern** for lowest latency
2. **Guide UI generations** with system prompts:
   \`\`\`
   When displaying data, use tables for tabular data and charts for trends.
   Always include a summary card at the top.
   Use modals sparingly, prefer inline forms.
   \`\`\`
3. **Stream responses** for real-time feedback
4. **Custom components**: Define your own if C1 library is insufficient
5. **Error handling**: Wrap `<C1Component>` in error boundaries

### AG-UI Best Practices

1. **Use shared state** for cross-component sync:
   \`\`\`tsx
   const { state, setState } = useAGUI();
   setState("selectedProduct", product);
   \`\`\`
2. **HITL for critical actions**:
   \`\`\`tsx
   agent.requestConfirmation("Delete 100 records?", async (approved) => {
     if (approved) await deleteRecords();
   });
   \`\`\`
3. **Multi-agent handoff**:
   \`\`\`tsx
   agent.handoff("agent-2", { context: "User wants detailed analysis" });
   \`\`\`
4. **Optimize event frequency**: Don't emit state updates on every token

### MCP UI Best Practices (If Implemented)

1. **Sanitize HTML**: Always validate/sanitize user-provided HTML
2. **CSP headers**: Configure Content Security Policy for iframe security
3. **Limit widget complexity**: Keep widgets focused and lightweight
4. **Fallback UI**: Provide fallback if UIResource fails to render
5. **Communication protocol**: Use structured postMessage, not eval()

---

## Troubleshooting

### C1 Issues

**Problem**: "Invalid C1 response format"
- **Solution**: Ensure `baseURL` is `https://api.thesys.dev/v1/embed`
- **Check**: `THESYS_API_KEY` is valid

**Problem**: "Model not found"
- **Solution**: Use exact model string: `c1/anthropic/claude-sonnet-4/v-20250815`

**Problem**: "UI not rendering"
- **Solution**: Verify `@thesysai/genui-sdk` is installed and `<C1Component>` is used

### AG-UI Issues

**Problem**: "Events not streaming"
- **Solution**: Check CopilotKit runtime is running at `/api/copilot`
- **Check**: `runtimeUrl` prop in `<CopilotKit>` is correct

**Problem**: "Shared state not syncing"
- **Solution**: Ensure all components use the same `useAGUI()` hook within `<CopilotKit>` provider

**Problem**: "Multi-agent handoff failing"
- **Solution**: Verify agent IDs are registered in runtime

### MCP UI Issues (If Implemented)

**Problem**: "UIResource not rendering"
- **Solution**: Check `UIResourceRenderer` is imported from `@mcp-ui/client`

**Problem**: "postMessage not working"
- **Solution**: Ensure `window.parent.postMessage` targets correct origin

**Problem**: "iframe CORS errors"
- **Solution**: Configure MCP server to allow frontend origin

---

## Environment Variables

\`\`\`bash
# Required for C1
THESYS_API_KEY=your_thesys_api_key

# Optional: Custom C1 endpoint (default: https://api.thesys.dev/v1/embed)
THESYS_API_URL=https://api.thesys.dev/v1/embed

# CopilotKit (no API key needed for self-hosted)
# Only needed if using CopilotKit Cloud
COPILOT_CLOUD_API_KEY=your_copilot_cloud_key
\`\`\`

---

## Package Dependencies

\`\`\`json
{
  "dependencies": {
    "@copilotkit/react-core": "latest",
    "@copilotkit/react-ui": "latest",
    "@copilotkit/runtime": "latest",
    "@thesysai/genui-sdk": "latest",
    "@crayonai/react-ui": "latest",
    "openai": "^4.85.1"
  },
  "devDependencies": {
    "@types/node": "latest",
    "typescript": "latest"
  }
}
\`\`\`

---

## Future Enhancements

### Phase 1 (Current - MVP)
- ✅ C1 Gateway LLM
- ✅ AG-UI real-time streaming
- ✅ 9 agents with individual tabs
- ✅ Basic chat interface

### Phase 2 (Next)
- ⬜ MCP UI integration for Shopify/Klaviyo widgets
- ⬜ Advanced multi-agent orchestration
- ⬜ Persistent conversation history
- ⬜ Agent-to-agent communication logs

### Phase 3 (Advanced)
- ⬜ Custom C1 components library
- ⬜ Agent performance analytics
- ⬜ A/B testing for agent prompts
- ⬜ Voice interface (speech-to-text → C1)

---

## Additional Resources

### Documentation Links

- **C1 by Thesys**: https://docs.thesys.dev
- **CopilotKit AG-UI**: https://www.copilotkit.ai/ag-ui
- **MCP UI**: https://github.com/idosal/mcp-ui (community project)
- **Model Context Protocol**: https://modelcontextprotocol.io

### Community & Support

- **C1 Discord**: https://discord.gg/Pbv5PsqUSv
- **CopilotKit Discord**: https://discord.gg/copilotkit
- **MCP Specification**: https://spec.modelcontextprotocol.io

### Example Repositories

- **C1 + CopilotKit Example**: https://github.com/thesysdev/examples/tree/main/copilotkit
- **AG-UI Protocol Spec**: https://github.com/CopilotKit/ag-ui-protocol
- **MCP UI Examples**: https://github.com/idosal/mcp-ui/tree/main/examples

---

## Conclusion

This multi-agent application leverages **C1 by Thesys** as the primary UI generation gateway, integrated with **AG-UI by CopilotKit** for real-time streaming and multi-agent orchestration. This combination provides:

1. **Automatic UI Generation**: C1 converts agent responses into structured, interactive UIs
2. **Real-time Streaming**: AG-UI events provide low-latency, token-by-token updates
3. **Multi-Agent Support**: AG-UI's event architecture handles 9 concurrent agents seamlessly
4. **Extensibility**: MCP UI can be added later for specialized rich widgets

**Recommendation**: Stay with C1 + AG-UI for MVP. Add MCP UI only when specific embedded widget needs arise (e.g., Shopify product carousels, complex forms).

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Maintained By**: Multi-Agent Development Team  
**For Questions**: Contact via project Discord or GitHub Issues

## AI Gateway Comparison: C1 vs Vercel AI Gateway vs CopilotKit

### Overview

There are **three gateway solutions** to consider when building multi-agent applications:

1. **C1 Gateway** (Thesys) - Generative UI Gateway
2. **Vercel AI Gateway** - Model Router & Infrastructure
3. **CopilotKit Runtime** - Agent Framework Gateway

**IMPORTANT**: These are **NOT mutually exclusive** and serve different purposes. You can use all three together.

---

### Vercel AI Gateway

#### What it Does
Infrastructure layer for AI model access with unified API, routing, and billing.

#### Key Features
- **100+ Models**: OpenAI, Anthropic, Google, AWS Bedrock, Groq, xAI, etc.
- **Unified API**: Switch models without code changes
- **Provider Routing**: Load balancing, fallbacks, A/B testing
- **No Markup**: $5/month free tier, pay-as-you-go with no Vercel fees
- **Built into AI SDK**: Works seamlessly with `@ai-sdk/openai`, etc.
- **Usage Tracking**: Dashboard for monitoring and billing

#### What it Does NOT Do
- ❌ UI generation
- ❌ Agent orchestration
- ❌ Tool calling logic
- ❌ State management

**Use For**: Model access, failover, cost optimization

---

### C1 Gateway (Thesys)

#### What it Does
LLM middleware that converts text responses into structured UI components.

#### Key Features
- **Generative UI**: Returns C1 DSL (JSON UI schema) instead of text
- **OpenAI-Compatible**: Drop-in replacement for OpenAI API
- **Gateway Mode**: Can be the primary LLM routing all requests
- **Thinking States**: Real-time `<c1-thinking>` progress updates
- **Multi-Format**: Supports chat, artifacts, documents
- **Model Support**: Claude Sonnet 4, GPT-5, custom models (via Thesys)

#### What it Does NOT Do
- ❌ Direct access to 100+ models (limited to Thesys-supported models)
- ❌ Multi-provider fallbacks (only Thesys infrastructure)
- ❌ Free tier (requires paid API key)
- ❌ Event streaming protocol (uses SSE but not AG-UI events)

**Use For**: Automatic UI generation, declarative interfaces

---

### CopilotKit Runtime

#### What it Does
Full-stack framework for building agent UIs with AG-UI protocol support.

#### Key Features
- **AG-UI Protocol**: 16 standardized event types for real-time communication
- **Multi-Agent Orchestration**: Built-in support for coordinating agents
- **State Management**: Shared state across agents and UI
- **HITL Support**: Human-in-the-loop, confirmations, interrupts
- **Backend Agnostic**: Python (LangGraph, CrewAI), Node.js, any language
- **Framework Support**: Works with any LLM or model gateway

#### What it Does NOT Do
- ❌ UI generation (you build components or use C1)
- ❌ Model access (you provide your own LLM)
- ❌ Billing/routing (not a gateway)

**Use For**: Real-time agent communication, multi-agent systems

---

### Comparison Table

| Feature | Vercel AI Gateway | C1 Gateway | CopilotKit Runtime |
|---------|-------------------|------------|-------------------|
| **Purpose** | Model access layer | UI generation | Agent framework |
| **Model Access** | 100+ models | Limited (Thesys) | Any (you provide) |
| **Provider Routing** | ✅ YES | ❌ NO | ❌ NO |
| **Fallback/Load Balancing** | ✅ YES | ❌ NO | ❌ NO |
| **UI Generation** | ❌ NO | ✅ YES (C1 DSL) | ❌ NO |
| **Real-time Streaming** | ⚠️ Token streaming | ✅ SSE | ✅ AG-UI Events |
| **Multi-Agent** | ❌ NO | ⚠️ Via gateway | ✅ YES |
| **State Management** | ❌ NO | ❌ NO | ✅ YES |
| **HITL Support** | ❌ NO | ❌ NO | ✅ YES |
| **Pricing** | $5 free + PAYG | Paid API | Free (OSS) |
| **Framework** | AI SDK | React SDK | React + Python/Node |
| **Open Source** | Partial (SDK) | ❌ NO | ✅ YES |

---

### The Optimal Stack (RECOMMENDED)

**Use ALL THREE together** for maximum flexibility:

\`\`\`typescript
// Stack Architecture
┌─────────────────────────────────────────────────────────┐
│  Frontend: CopilotKit + C1 SDK                          │
│  - CopilotKit handles AG-UI events, state, HITL        │
│  - C1Component renders generated UI                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Gateway Layer: C1 (Thesys)                             │
│  - Primary LLM for UI generation                        │
│  - Returns C1 DSL + streams via AG-UI                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Model Access: Vercel AI Gateway                        │
│  - When C1 calls tools/sub-agents                       │
│  - Fallback for non-UI tasks                            │
│  - Cost optimization via model routing                  │
└─────────────────────────────────────────────────────────┘
\`\`\`

#### Implementation

\`\`\`typescript
// app/api/copilot/route.ts
import { OpenAI } from "openai";
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";

// C1 as primary gateway (UI generation)
const c1Client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

// Vercel AI Gateway as fallback (model access)
const vercelClient = new OpenAI({
  baseURL: "https://api.vercel.com/v1/ai",
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY,
});

const serviceAdapter = new OpenAIAdapter({
  openai: c1Client, // Primary: C1 for UI
  model: "c1/anthropic/claude-sonnet-4/v-20250815",
});

// Tool: Use Vercel Gateway for specific models
const tools = [
  {
    name: "analyze_with_gpt5",
    handler: async (args) => {
      // Use Vercel AI Gateway to access GPT-5
      const response = await vercelClient.chat.completions.create({
        model: "openai/gpt-5-mini",
        messages: [{ role: "user", content: args.query }],
      });
      return response.choices[0].message.content;
    },
  },
];

const runtime = new CopilotRuntime({ tools });

export const POST = async (req) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
  });
  return handleRequest(req);
};
\`\`\`

#### Benefits of Combined Stack

1. **C1 handles UI generation** - Automatic, structured, safe
2. **Vercel Gateway provides model flexibility** - 100+ models via tools
3. **CopilotKit manages real-time communication** - AG-UI events, state, HITL
4. **Cost Optimization** - Use C1 for UI, Vercel Gateway for cheap inference
5. **Reliability** - Vercel Gateway fallbacks if C1 has issues

---

### When to Use Each Individually

#### Use ONLY Vercel AI Gateway When:
- Building traditional chat (no generative UI)
- Need maximum model flexibility
- Want lowest cost (free tier + no markup)
- Don't need UI generation

#### Use ONLY C1 Gateway When:
- UI generation is primary goal
- OK with limited model selection
- Don't need multi-agent orchestration
- Want simplest setup

#### Use ONLY CopilotKit When:
- Building custom UI (no automatic generation)
- Need advanced agent features (HITL, state)
- Want full control over models
- Open-source requirement

---

## Backend Framework Flexibility

### Can You Use Different Agent Frameworks?

**YES! All three protocols support multiple backend frameworks.**

---

### C1 Backend Support

C1 is **OpenAI-compatible**, so it works with **any language/framework** that supports OpenAI API:

#### Officially Supported
- **Node.js**: OpenAI SDK, LangChain.js
- **Python**: OpenAI SDK, LangChain, LlamaIndex
- **Any Language**: Just call `POST https://api.thesys.dev/v1/embed`

#### Example: Python + FastAPI + LangChain
\`\`\`python
# backend.py
from fastapi import FastAPI
from langchain.chat_models import ChatOpenAI
from langchain.agents import initialize_agent

app = FastAPI()

# C1 as Gateway LLM
llm = ChatOpenAI(
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY"),
    model="c1/anthropic/claude-sonnet-4/v-20250815"
)

agent = initialize_agent(
    tools=[...],
    llm=llm,
    agent="zero-shot-react-description"
)

@app.post("/chat")
async def chat(message: str):
    response = await agent.arun(message)
    return {"response": response}
\`\`\`

#### Example: Go + OpenAI SDK
\`\`\`go
// main.go
package main

import (
    "context"
    openai "github.com/sashabaranov/go-openai"
)

func main() {
    config := openai.DefaultConfig(os.Getenv("THESYS_API_KEY"))
    config.BaseURL = "https://api.thesys.dev/v1/embed"
    
    client := openai.NewClientWithConfig(config)
    
    resp, err := client.CreateChatCompletion(
        context.Background(),
        openai.ChatCompletionRequest{
            Model: "c1/anthropic/claude-sonnet-4/v-20250815",
            Messages: []openai.ChatCompletionMessage{
                {Role: "user", Content: "Hello!"},
            },
        },
    )
}
\`\`\`

---

### AG-UI (CopilotKit) Backend Support

AG-UI is a **protocol**, so you can implement it in any language. CopilotKit provides official SDKs:

#### Official SDKs
- **Node.js**: `@copilotkit/runtime` (TypeScript)
- **Python**: `copilotkit` (Python SDK)

#### Framework Examples

##### Python + LangGraph
\`\`\`python
from copilotkit import CopilotRuntime, LangGraphAdapter
from langgraph.graph import StateGraph

# Define LangGraph workflow
workflow = StateGraph(...)
workflow.add_node("analyst", analyst_node)
workflow.add_node("researcher", researcher_node)
graph = workflow.compile()

# Expose via AG-UI
adapter = LangGraphAdapter(graph=graph)
runtime = CopilotRuntime(adapter=adapter)

@app.post("/copilot")
async def copilot_endpoint(request: Request):
    return await runtime.handle_request(request)
\`\`\`

##### Python + CrewAI
\`\`\`python
from copilotkit import CopilotRuntime
from crewai import Crew, Agent, Task

# Define CrewAI agents
researcher = Agent(role="Researcher", goal="Research topics")
writer = Agent(role="Writer", goal="Write articles")

crew = Crew(agents=[researcher, writer])

runtime = CopilotRuntime()

@app.post("/copilot")
async def run_crew(task: str):
    result = crew.kickoff(inputs={"task": task})
    return {"result": result}
\`\`\`

##### Node.js + Custom Agent
\`\`\`typescript
import { CopilotRuntime } from "@copilotkit/runtime";

const runtime = new CopilotRuntime();

runtime.registerAgent({
  name: "analyst",
  handler: async (message, ctx) => {
    // Custom agent logic
    const result = await yourCustomLogic(message);
    
    // Emit AG-UI events
    ctx.emit({ type: "message", content: result });
    ctx.emit({ type: "tool_call", name: "analyze", args: {...} });
    
    return result;
  },
});
\`\`\`

#### Community Implementations
- **Go**: `copilotkit-go` (community)
- **Rust**: `copilotkit-rs` (community)
- **Java**: `copilotkit-java` (community)

---

### MCP UI Backend Support

MCP UI has **official SDKs** for multiple languages:

#### Official SDKs
- **TypeScript**: `@mcp-ui/server`
- **Python**: `mcp-ui-python`
- **Ruby**: `mcp-ui-ruby`

#### Example: Python + Flask
\`\`\`python
from mcp_ui import create_ui_resource
from flask import Flask

app = Flask(__name__)

@app.route("/ui/dashboard")
def dashboard_ui():
    ui = create_ui_resource(
        uri="ui://dashboard/sales",
        content={
            "type": "rawHtml",
            "htmlString": """
                <div class="dashboard">
                    <h1>Sales Dashboard</h1>
                    <div id="chart"></div>
                </div>
            """
        },
        encoding="text"
    )
    return ui.to_json()
\`\`\`

---

### Multi-Framework Architecture

You can **mix and match** frameworks for different agents:

\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Frontend: React + CopilotKit + C1 SDK                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬────────────────┐
        │                         │                 │
        ↓                         ↓                 ↓
┌───────────────┐      ┌──────────────────┐  ┌────────────┐
│ Agent 1-3     │      │ Agent 4-6        │  │ Agent 7-9  │
│ (Node.js +    │      │ (Python +        │  │ (Go +      │
│  LangChain.js)│      │  LangGraph)      │  │  Custom)   │
└───────────────┘      └──────────────────┘  └────────────┘
\`\`\`

**Each agent can use**:
- Different language (Python, Node.js, Go, Rust)
- Different framework (LangChain, LangGraph, CrewAI, custom)
- Different LLM provider (via Vercel AI Gateway)
- Shared AG-UI protocol for communication

#### Example: Heterogeneous Multi-Agent Setup

\`\`\`typescript
// app/api/copilot/route.ts
import { CopilotRuntime } from "@copilotkit/runtime";

const runtime = new CopilotRuntime();

// Agent 1: Node.js (local)
runtime.registerAgent({
  name: "agent-1",
  handler: localNodeAgent,
});

// Agent 2-4: Python LangGraph (remote service)
runtime.registerRemoteAgent({
  name: "agent-2",
  url: "http://python-service:8000/agent-2",
  protocol: "ag-ui",
});

// Agent 5-7: Go custom agents (remote service)
runtime.registerRemoteAgent({
  name: "agent-5",
  url: "http://go-service:9000/agent-5",
  protocol: "ag-ui",
});

// All communicate via AG-UI protocol
export const POST = async (req) => {
  return runtime.handleRequest(req);
};
\`\`\`

---

### Summary: Backend Flexibility

| Protocol | Backend Flexibility | Languages | Frameworks |
|----------|-------------------|-----------|------------|
| **C1** | ✅ **Very High** | Any (OpenAI-compatible) | LangChain, LlamaIndex, custom |
| **AG-UI** | ✅ **High** | Node.js, Python, Go*, Rust* | LangGraph, CrewAI, custom |
| **MCP UI** | ✅ **High** | TypeScript, Python, Ruby | Any (protocol-based) |

**Asterisk (*)** = Community-maintained

---

## Conclusion: What to Use

### For Your 9-Agent App (Current Implementation)

**Recommended Stack**:
1. **C1 Gateway** (Primary) - Automatic UI generation
2. **AG-UI** (CopilotKit) - Real-time streaming, multi-agent orchestration
3. **Vercel AI Gateway** (Optional tool) - Model flexibility, cost optimization

**Backend Flexibility**:
- Agents 1-3: Node.js + LangChain.js
- Agents 4-6: Python + LangGraph
- Agents 7-9: Python + CrewAI (or any mix you want)

**Add MCP UI Later If You Need**:
- Shopify product widgets
- Klaviyo email builders
- Google Drive/Notion embedded viewers
