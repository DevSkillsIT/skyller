/**
 * Testes de Caracterizacao - API Copilot Route
 * Documenta o comportamento atual do endpoint /api/copilot
 *
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @phase PRESERVE - DDD Characterization Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock classes para @copilotkitnext/runtime (nova versao)
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

// Mock para AgnoAgent do @ag-ui/agno
class MockAgnoAgent {
  url: string;
  headers: Record<string, string>;
  constructor(config: { url: string; headers?: Record<string, string> }) {
    this.url = config.url;
    this.headers = config.headers || {};
    MockAgnoAgent.lastInstance = this;
    MockAgnoAgent.calls.push(config);
  }
  static lastInstance: MockAgnoAgent | null = null;
  static calls: Array<{ url: string; headers?: Record<string, string> }> = [];
  static reset() {
    MockAgnoAgent.lastInstance = null;
    MockAgnoAgent.calls = [];
  }
}

// Mock para Hono app retornado por createCopilotEndpoint
const mockHonoApp = {
  fetch: vi.fn().mockResolvedValue(new Response("OK", { status: 200 })),
};

const mockCreateCopilotEndpoint = vi.fn().mockReturnValue(mockHonoApp);

// Mock do handle do hono/vercel
const mockHandle = vi
  .fn()
  .mockReturnValue(vi.fn().mockResolvedValue(new Response("OK", { status: 200 })));

// Mock do @copilotkitnext/runtime
vi.mock("@copilotkitnext/runtime", () => ({
  CopilotRuntime: MockCopilotRuntime,
  createCopilotEndpoint: mockCreateCopilotEndpoint,
}));

// Mock do @ag-ui/agno
vi.mock("@ag-ui/agno", () => ({
  AgnoAgent: MockAgnoAgent,
}));

// Mock do hono/vercel
vi.mock("hono/vercel", () => ({
  handle: mockHandle,
}));

// Mock do auth - sessao valida por padrao
const mockAuth = vi.fn().mockResolvedValue({
  user: {
    id: "user-123",
    email: "test@skyller.ai",
    tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // UUID valido
  },
  accessToken: "mock-access-token",
});

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock das funcoes de error handling
vi.mock("@/lib/error-handling", () => ({
  unauthorized: vi.fn(
    () =>
      new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
  ),
  forbidden: vi.fn(
    () =>
      new Response(JSON.stringify({ success: false, error: "FORBIDDEN" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
  ),
}));

// Mock do auth-headers
vi.mock("@/lib/api/auth-headers", () => ({
  createAuthHeaders: vi.fn(() => ({
    Authorization: "Bearer mock-token",
    "X-Tenant-ID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "X-User-ID": "user-123",
  })),
  isUuid: vi.fn((id: string) => {
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }),
}));

describe("API Copilot Route - Testes de Caracterizacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockCopilotRuntime.reset();
    MockAgnoAgent.reset();
    mockCreateCopilotEndpoint.mockClear();
    mockHandle.mockClear();
    // Reset auth para sessao valida com UUID
    mockAuth.mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@skyller.ai",
        tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      },
      accessToken: "mock-access-token",
    });
  });

  describe("POST Handler", () => {
    it("deve exportar funcao POST", async () => {
      vi.resetModules();
      const module = await import("@/app/api/copilot/route");

      expect(module.POST).toBeDefined();
      expect(typeof module.POST).toBe("function");
    });
  });

  describe("Session Validation - CC-07", () => {
    it("deve retornar 401 quando nao ha sessao", async () => {
      vi.resetModules();
      mockAuth.mockResolvedValueOnce(null);
      const { POST } = await import("@/app/api/copilot/route");

      const mockRequest = new Request("http://localhost:3004/api/copilot", {
        method: "POST",
        headers: {
          origin: "https://skyller.ai",
        },
        body: JSON.stringify({ message: "test" }),
      });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(401);
    });

    it("deve retornar 403 quando sessao nao tem tenant_id", async () => {
      vi.resetModules();
      mockAuth.mockResolvedValueOnce({
        user: {
          id: "user-123",
          email: "test@skyller.ai",
          tenant_id: null, // Sem tenant
        },
        accessToken: "mock-token",
      });
      const { POST } = await import("@/app/api/copilot/route");

      const mockRequest = new Request("http://localhost:3004/api/copilot", {
        method: "POST",
        headers: {
          origin: "https://skyller.ai",
        },
        body: JSON.stringify({ message: "test" }),
      });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(403);
    });
  });
});

// NOTA: Testes de CORS e OPTIONS foram removidos.
// A rota atual (/app/api/copilot/route.ts) nao implementa:
// - Headers CORS personalizados na resposta
// - Handler OPTIONS para preflight
// CORS e gerenciado pelo Next.js middleware ou configuracao do servidor.
// Se CORS for necessario nesta rota, implemente primeiro e depois adicione os testes.
