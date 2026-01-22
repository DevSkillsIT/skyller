/**
 * Testes de Caracterizacao - ChatContext
 * Documenta o comportamento atual do contexto de chat
 *
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @phase PRESERVE - DDD Characterization Tests
 */
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";

// Wrapper para prover contexto aos hooks
const wrapper = ({ children }: { children: ReactNode }) => <ChatProvider>{children}</ChatProvider>;

describe("ChatContext - Testes de Caracterizacao", () => {
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
    it("deve definir currentConversationId quando conversa e carregada", () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      act(() => {
        result.current.loadConversation("conv-123");
      });

      expect(result.current.currentConversationId).toBe("conv-123");
    });

    it("deve limpar mensagens quando conversa e carregada", () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      // Adiciona uma mensagem primeiro
      act(() => {
        result.current.addMessage({
          id: "msg-temp",
          role: "user",
          content: "Mensagem temporaria",
          timestamp: new Date(),
        });
      });

      // Carrega nova conversa
      act(() => {
        result.current.loadConversation("conv-456");
      });

      // Comportamento atual: limpa mensagens para carregar do backend (TODO)
      expect(result.current.messages).toEqual([]);
    });
  });

  describe("startNewConversation", () => {
    it("deve resetar currentConversationId para null", () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      // Primeiro carrega uma conversa
      act(() => {
        result.current.loadConversation("conv-789");
      });

      // Depois inicia nova conversa
      act(() => {
        result.current.startNewConversation();
      });

      expect(result.current.currentConversationId).toBeNull();
    });

    it("deve limpar array de mensagens", () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      // Carrega conversa com mensagens
      act(() => {
        result.current.loadConversation("conv-abc");
      });

      // Inicia nova conversa
      act(() => {
        result.current.startNewConversation();
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  describe("addMessage", () => {
    it("deve adicionar mensagem ao array existente", () => {
      const { result } = renderHook(() => useChat(), { wrapper });

      const novaMensagem = {
        id: "msg-001",
        role: "user" as const,
        content: "Ola, mundo!",
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(novaMensagem);
      });

      expect(result.current.messages).toContainEqual(novaMensagem);
    });

    it("deve preservar mensagens existentes ao adicionar nova", () => {
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

      act(() => {
        result.current.addMessage(msg1);
      });

      act(() => {
        result.current.addMessage(msg2);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toEqual(msg1);
      expect(result.current.messages[1]).toEqual(msg2);
    });
  });

  describe("setMessages", () => {
    it("deve substituir todas as mensagens", () => {
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

      act(() => {
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
