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
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Wrapper para prover contexto aos hooks
const wrapper = ({ children }: { children: ReactNode }) => <ChatProvider>{children}</ChatProvider>;

describe("ChatContext - Testes de Caracterizacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    it("deve adicionar mensagem ao array existente", async () => {
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

      expect(result.current.messages).toContainEqual(novaMensagem);
    });

    it("deve preservar mensagens existentes ao adicionar nova", async () => {
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

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toEqual(msg1);
      expect(result.current.messages[1]).toEqual(msg2);
    });
  });

  describe("setMessages", () => {
    it("deve substituir todas as mensagens", async () => {
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

      expect(result.current.messages).toEqual(novasMensagens);
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
