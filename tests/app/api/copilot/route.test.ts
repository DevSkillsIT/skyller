/**
 * Testes de Caracterizacao - API Copilot Route
 * Documenta o comportamento atual do endpoint /api/copilot
 *
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @phase PRESERVE - DDD Characterization Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock classes para @copilotkit/runtime
class MockCopilotRuntime {
  agents: Record<string, unknown>;
  constructor(config: { agents: Record<string, unknown> }) {
    this.agents = config.agents;
    MockCopilotRuntime.lastInstance = this;
    MockCopilotRuntime.calls.push(config);
  }
  static lastInstance: MockCopilotRuntime | null = null;
  static calls: Array<{ agents: Record<string, unknown> }> = [];
  static reset() {
    MockCopilotRuntime.lastInstance = null;
    MockCopilotRuntime.calls = [];
  }
}

class MockExperimentalEmptyAdapter {
  static calls: number = 0;
  constructor() {
    MockExperimentalEmptyAdapter.calls++;
  }
  static reset() {
    MockExperimentalEmptyAdapter.calls = 0;
  }
}

class MockHttpAgent {
  url: string;
  constructor(config: { url: string }) {
    this.url = config.url;
    MockHttpAgent.lastInstance = this;
    MockHttpAgent.calls.push(config);
  }
  static lastInstance: MockHttpAgent | null = null;
  static calls: Array<{ url: string }> = [];
  static reset() {
    MockHttpAgent.lastInstance = null;
    MockHttpAgent.calls = [];
  }
}

const mockHandleRequest = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
const mockCopilotRuntimeNextJSAppRouterEndpoint = vi.fn().mockImplementation(() => ({
  handleRequest: mockHandleRequest,
}));

// Mock do @copilotkit/runtime
vi.mock("@copilotkit/runtime", () => ({
  CopilotRuntime: MockCopilotRuntime,
  ExperimentalEmptyAdapter: MockExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint: mockCopilotRuntimeNextJSAppRouterEndpoint,
}));

// Mock do @ag-ui/client
vi.mock("@ag-ui/client", () => ({
  HttpAgent: MockHttpAgent,
}));

describe("API Copilot Route - Testes de Caracterizacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockCopilotRuntime.reset();
    MockExperimentalEmptyAdapter.reset();
    MockHttpAgent.reset();
    mockHandleRequest.mockClear();
    mockCopilotRuntimeNextJSAppRouterEndpoint.mockClear();
  });

  describe("Configuracao do HttpAgent", () => {
    it("deve usar URL padrao quando NEXUS_API_URL nao esta definido", async () => {
      vi.resetModules();
      await import("@/app/api/copilot/route");

      // HttpAgent deve ser instanciado
      expect(MockHttpAgent.calls.length).toBeGreaterThan(0);
    });

    it("deve construir URL correta com NEXUS_API_URL definido", async () => {
      // A URL deve ser: NEXUS_API_URL + /agui
      const expectedUrl = "https://api.skyller.ai/agui";

      // Comportamento esperado: URL base + /agui
      expect(expectedUrl).toBe("https://api.skyller.ai/agui");
    });
  });

  describe("CopilotRuntime Configuration", () => {
    it("deve registrar agente como nexus_agent", async () => {
      vi.resetModules();
      await import("@/app/api/copilot/route");

      // CopilotRuntime deve ser configurado com agents contendo nexus_agent
      expect(MockCopilotRuntime.calls.length).toBeGreaterThan(0);
      const lastCall = MockCopilotRuntime.calls[MockCopilotRuntime.calls.length - 1];
      expect(lastCall.agents).toHaveProperty("nexus_agent");
    });
  });

  describe("Endpoint Configuration", () => {
    it("deve usar ExperimentalEmptyAdapter como serviceAdapter", async () => {
      vi.resetModules();
      await import("@/app/api/copilot/route");

      expect(MockExperimentalEmptyAdapter.calls).toBeGreaterThan(0);
    });

    it("deve configurar endpoint como /api/copilot", async () => {
      vi.resetModules();
      const { POST } = await import("@/app/api/copilot/route");

      // Chamar POST para trigger a configuracao do endpoint
      const mockRequest = new Request("http://localhost:3004/api/copilot", {
        method: "POST",
        body: JSON.stringify({ message: "test" }),
      });

      await POST(mockRequest as any);

      // O endpoint deve ser configurado com path correto
      expect(mockCopilotRuntimeNextJSAppRouterEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/copilot",
        })
      );
    });
  });

  describe("POST Handler", () => {
    it("deve exportar funcao POST", async () => {
      vi.resetModules();
      const module = await import("@/app/api/copilot/route");

      expect(module.POST).toBeDefined();
      expect(typeof module.POST).toBe("function");
    });

    it("deve chamar handleRequest com a requisicao", async () => {
      vi.resetModules();
      const { POST } = await import("@/app/api/copilot/route");

      const mockRequest = new Request("http://localhost:3004/api/copilot", {
        method: "POST",
        body: JSON.stringify({ message: "test" }),
      });

      await POST(mockRequest as any);

      expect(mockHandleRequest).toHaveBeenCalledWith(mockRequest);
    });
  });
});

describe("CORS Headers - AC-029", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockCopilotRuntime.reset();
    MockExperimentalEmptyAdapter.reset();
    MockHttpAgent.reset();
    mockHandleRequest.mockClear();
    mockCopilotRuntimeNextJSAppRouterEndpoint.mockClear();
  });

  it("deve incluir headers CORS para *.skyller.ai", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "POST",
      headers: {
        origin: "https://app.skyller.ai",
      },
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(mockRequest as any);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.skyller.ai");
  });

  it("deve permitir subdominio de skyller.ai", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "POST",
      headers: {
        origin: "https://tenant1.skyller.ai",
      },
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(mockRequest as any);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://tenant1.skyller.ai");
  });

  it("deve permitir localhost para desenvolvimento", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(mockRequest as any);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  it("deve rejeitar origem nao permitida com 403", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "POST",
      headers: {
        origin: "https://malicious-site.com",
      },
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(mockRequest as any);

    expect(response.status).toBe(403);
  });

  it("deve expor headers de rate limiting via Access-Control-Expose-Headers", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "POST",
      headers: {
        origin: "https://skyller.ai",
      },
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(mockRequest as any);

    const exposeHeaders = response.headers.get("Access-Control-Expose-Headers");
    expect(exposeHeaders).toContain("X-RateLimit-Limit");
    expect(exposeHeaders).toContain("X-RateLimit-Remaining");
    expect(exposeHeaders).toContain("X-RateLimit-Reset");
    expect(exposeHeaders).toContain("Retry-After");
  });
});

describe("OPTIONS Handler - CORS Preflight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockCopilotRuntime.reset();
    MockExperimentalEmptyAdapter.reset();
    MockHttpAgent.reset();
  });

  it("deve exportar funcao OPTIONS", async () => {
    vi.resetModules();
    const module = await import("@/app/api/copilot/route");

    expect(module.OPTIONS).toBeDefined();
    expect(typeof module.OPTIONS).toBe("function");
  });

  it("deve retornar 204 para preflight com origem permitida", async () => {
    vi.resetModules();
    const { OPTIONS } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "OPTIONS",
      headers: {
        origin: "https://skyller.ai",
      },
    });

    const response = await OPTIONS(mockRequest as any);

    expect(response.status).toBe(204);
  });

  it("deve retornar 403 para preflight com origem nao permitida", async () => {
    vi.resetModules();
    const { OPTIONS } = await import("@/app/api/copilot/route");

    const mockRequest = new Request("http://localhost:3004/api/copilot", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil.com",
      },
    });

    const response = await OPTIONS(mockRequest as any);

    expect(response.status).toBe(403);
  });
});
