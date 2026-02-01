/**
 * Testes de Caracterizacao - ChatContext
 * Documenta o comportamento atual do contexto de chat
 *
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @phase PRESERVE - DDD Characterization Tests
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock agent para useAgent do CopilotKit
// O mock simula o comportamento real do CopilotKit, atualizando messages
const mockAgent = {
  messages: [] as any[],
  isRunning: false,
  threadId: "thread-1",
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  addMessage: vi.fn((msg: any) => {
    // Simula comportamento real do CopilotKit
    mockAgent.messages = [...mockAgent.messages, msg];
  }),
  setMessages: vi.fn((msgs: any[]) => {
    // Simula comportamento real do CopilotKit
    mockAgent.messages = [...msgs];
  }),
  runAgent: vi.fn(async () => {}),
  setState: vi.fn(),
};

// Mock do CopilotKit v2
vi.mock("@copilotkitnext/react", () => ({
  useAgent: vi.fn(() => ({ agent: mockAgent })),
  UseAgentUpdate: {
    OnMessagesChanged: "OnMessagesChanged",
    OnStateChanged: "OnStateChanged",
    OnRunStatusChanged: "OnRunStatusChanged",
  },
}));

// Mock do next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: "user-1", email: "test@test.com", tenant_id: "tenant-1" },
      accessToken: "mock-token",
    },
    status: "authenticated",
  })),
}));

// Mock do next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));

// Mock do sonner toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do api-client
vi.mock("@/lib/api-client", () => ({
  authGet: vi.fn(async () => ({ items: [], has_more: false, next_cursor: null })),
  authPost: vi.fn(async () => ({ id: "conv-123" })),
}));

// Mock do useEffectiveAgent
vi.mock("@/lib/hooks/use-effective-agent", () => ({
  useEffectiveAgent: vi.fn(() => ({ agentId: "skyller", isLoading: false })),
}));

// Mock do useSessionContext
vi.mock("@/lib/hooks/use-session-context", () => ({
  useSessionContext: vi.fn(() => ({
    apiContext: {},
    setConversationId: vi.fn(),
    setThreadId: vi.fn(),
    setAgentId: vi.fn(),
  })),
}));

// Mock do useRateLimit
vi.mock("@/lib/hooks/use-rate-limit", () => ({
  useRateLimit: vi.fn(() => ({
    isLimited: false,
    remaining: 30,
    limit: 30,
    resetAt: null,
    formattedTime: "",
  })),
}));

// Importar apos os mocks
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";

// Wrapper para prover contexto aos hooks
const wrapper = ({ children }: { children: ReactNode }) => <ChatProvider>{children}</ChatProvider>;

describe("ChatContext - Testes de Caracterizacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockAgent state
    mockAgent.messages = [];
    mockAgent.isRunning = false;
    // Setup default fetch mock para retornar array vazio
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Estado Inicial", () => {
    it("deve inicializar com array de mensagens vazio", () => {
      const { result } = renderHook(() => useChat(), { wrapper });
      expect(result.current.messages).toEqual([]);
    });

    it("deve inicializar com currentConversationId como null", () => {
      const { result } = renderHook(() => useChat(), { wrapper });
      expect(result.current.currentConversationId).toBeNull();
    });
  });

  describe("loadConversation", () => {
    it("deve definir currentConversationId quando conversa e carregada", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useChat(), { wrapper });

      await act(async () => {
        result.current.loadConversation("conv-123");
      });

      await waitFor(() => {
        expect(result.current.currentConversationId).toBe("conv-123");
      });
    });

    it("deve carregar mensagens do backend quando conversa e carregada", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          role: "user",
          content: "Ola",
          createdAt: new Date().toISOString(),
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "Oi! Como posso ajudar?",
          createdAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

      const { result } = renderHook(() => useChat(), { wrapper });

      await act(async () => {
        result.current.loadConversation("conv-456");
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
      });
    });

    it("deve limpar mensagens quando erro ao carregar conversa", async () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      // Adiciona uma mensagem primeiro
      await act(async () => {
        result.current.addMessage({
          id: "msg-temp",
          role: "user",
          content: "Mensagem temporaria",
          timestamp: new Date(),
        });
      });

      // Mock fetch com erro
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Carrega nova conversa que vai falhar
      await act(async () => {
        result.current.loadConversation("conv-error");
      });

      await waitFor(() => {
        // Comportamento atual: limpa mensagens em caso de erro
        expect(result.current.messages).toEqual([]);
      });
    });
  });

  describe("startNewConversation", () => {
    it("deve resetar currentConversationId para null", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useChat(), { wrapper });

      // Primeiro carrega uma conversa
      await act(async () => {
        result.current.loadConversation("conv-789");
      });

      // Depois inicia nova conversa
      await act(async () => {
        result.current.startNewConversation();
      });

      expect(result.current.currentConversationId).toBeNull();
    });

    it("deve limpar array de mensagens", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useChat(), { wrapper });

      // Carrega conversa com mensagens
      await act(async () => {
        result.current.loadConversation("conv-abc");
      });

      // Inicia nova conversa
      await act(async () => {
        result.current.startNewConversation();
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  describe("addMessage", () => {
    it("deve delegar addMessage para o CopilotKit agent", async () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      const novaMensagem = {
        id: "msg-001",
        role: "user" as const,
        content: "Ola, mundo!",
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(novaMensagem);
      });

      // Verifica que delegou para o CopilotKit com formato correto
      expect(mockAgent.addMessage).toHaveBeenCalledWith({
        id: novaMensagem.id,
        role: novaMensagem.role,
        content: novaMensagem.content,
        createdAt: novaMensagem.timestamp,
      });
    });

    it("deve chamar addMessage multiplas vezes ao adicionar varias mensagens", async () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      const msg1 = {
        id: "msg-001",
        role: "user" as const,
        content: "Primeira mensagem",
        timestamp: new Date(),
      };

      const msg2 = {
        id: "msg-002",
        role: "assistant" as const,
        content: "Segunda mensagem",
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(msg1);
      });

      await act(async () => {
        result.current.addMessage(msg2);
      });

      // Verifica que o CopilotKit foi chamado duas vezes
      expect(mockAgent.addMessage).toHaveBeenCalledTimes(2);
      expect(mockAgent.addMessage).toHaveBeenNthCalledWith(1, {
        id: msg1.id,
        role: msg1.role,
        content: msg1.content,
        createdAt: msg1.timestamp,
      });
      expect(mockAgent.addMessage).toHaveBeenNthCalledWith(2, {
        id: msg2.id,
        role: msg2.role,
        content: msg2.content,
        createdAt: msg2.timestamp,
      });
    });
  });

  describe("setMessages", () => {
    it("deve delegar setMessages para applyMessages interno", async () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      const novasMensagens = [
        {
          id: "msg-new-1",
          role: "user" as const,
          content: "Nova mensagem 1",
          timestamp: new Date(),
        },
        {
          id: "msg-new-2",
          role: "assistant" as const,
          content: "Nova mensagem 2",
          timestamp: new Date(),
        },
      ];

      await act(async () => {
        result.current.setMessages(novasMensagens);
      });

      // Verifica que o CopilotKit agent.setMessages foi chamado
      // O ChatContext transforma as mensagens antes de passar para o agent
      expect(mockAgent.setMessages).toHaveBeenCalled();
    });
  });

  describe("Erro de Contexto", () => {
    it("deve lancar erro quando useChat e usado fora do Provider", () => {
      // Suprimir erro do console para este teste
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useChat());
      }).toThrow("useChat must be used within a ChatProvider");

      consoleSpy.mockRestore();
    });
  });
});
