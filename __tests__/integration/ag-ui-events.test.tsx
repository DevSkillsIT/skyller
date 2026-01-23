/**
 * Testes de Integração - Eventos AG-UI
 *
 * Validação da migração GAP-CRIT-01:
 * - Estrutura preparada para eventos TOOL_CALL
 * - Estrutura preparada para eventos THINKING
 * - AgentState disponível no contexto
 * - Backward compatibility mantida
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";

// Mock do useRouter do Next.js
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock do useCopilotChat da CopilotKit
vi.mock("@copilotkit/react-core", () => ({
  useCopilotChat: vi.fn(() => ({
    visibleMessages: [],
    appendMessage: vi.fn(async () => {}),
    isLoading: false,
  })),
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Eventos AG-UI - GAP-CRIT-01 (Preparação)", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve ter estrutura AgentState preparada para currentTool", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Estrutura preparada para eventos TOOL_CALL
    expect(result.current).toHaveProperty("currentTool");
    expect(result.current.currentTool).toBeUndefined();
  });

  it("deve ter estrutura AgentState preparada para thinkingState", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Estrutura preparada para eventos THINKING
    expect(result.current).toHaveProperty("thinkingState");
    expect(result.current.thinkingState).toBeUndefined();
  });

  it("deve ter propriedade isRunning disponível", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Estrutura preparada para eventos RUN_STARTED/RUN_FINISHED
    expect(result.current).toHaveProperty("isRunning");
    expect(result.current.isRunning).toBe(false);
  });

  it("deve ter método runAgent disponível", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Método para executar agente
    expect(result.current).toHaveProperty("runAgent");
    expect(typeof result.current.runAgent).toBe("function");
  });

  it("deve ter propriedade threadId preparada", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Estrutura preparada para threadId (será implementado quando API suportar)
    expect(result.current).toHaveProperty("threadId");
  });

  it("deve manter backward compatibility com métodos legados", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Métodos legados devem existir
    expect(result.current.loadConversation).toBeDefined();
    expect(result.current.startNewConversation).toBeDefined();
    expect(result.current.addMessage).toBeDefined();
    expect(result.current.setMessages).toBeDefined();
    expect(result.current.currentConversationId).toBeDefined();

    // Deve ser possível usar startNewConversation
    act(() => {
      result.current.startNewConversation();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it("deve permitir executar runAgent sem erros", async () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    // Deve ser possível chamar runAgent
    await act(async () => {
      await expect(result.current.runAgent("Teste")).resolves.not.toThrow();
    });
  });
});
