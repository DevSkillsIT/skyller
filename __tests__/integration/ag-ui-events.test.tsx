/**
 * Testes de Integração - Eventos AG-UI
 *
 * Validação da estrutura de contexto:
 * - currentTool/thinkingState disponíveis
 * - estados de visualização (thinking/steps/toolCalls/activities)
 * - runAgent disponível
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";

vi.mock("@/lib/api-client", () => ({
  authPost: vi.fn(async () => ({})),
}));

const mockAgent = {
  messages: [],
  isRunning: false,
  threadId: "thread-1",
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  addMessage: vi.fn(),
  setMessages: vi.fn(),
  runAgent: vi.fn(async () => {}),
  setState: vi.fn(),
};

// Mock do useRouter do Next.js
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock do useAgent do CopilotKit v2
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgent: vi.fn(() => ({ agent: mockAgent })),
  UseAgentUpdate: {
    OnMessagesChanged: "OnMessagesChanged",
    OnStateChanged: "OnStateChanged",
    OnRunStatusChanged: "OnRunStatusChanged",
  },
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Eventos AG-UI - Estrutura do ChatContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve ter estrutura preparada para currentTool", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toHaveProperty("currentTool");
    expect(result.current.currentTool).toBeUndefined();
  });

  it("deve ter estrutura preparada para thinkingState", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toHaveProperty("thinkingState");
    expect(result.current.thinkingState).toBeUndefined();
  });

  it("deve expor estados de visualização", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toHaveProperty("thinking");
    expect(result.current).toHaveProperty("steps");
    expect(result.current).toHaveProperty("toolCalls");
    expect(result.current).toHaveProperty("activities");
  });

  it("deve ter propriedade isRunning disponível", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toHaveProperty("isRunning");
    expect(result.current.isRunning).toBe(false);
  });

  it("deve ter método runAgent disponível", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toHaveProperty("runAgent");
    expect(typeof result.current.runAgent).toBe("function");
  });

  it("deve ter propriedade threadId preparada", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toHaveProperty("threadId");
  });

  it("deve manter backward compatibility com métodos legados", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current.loadConversation).toBeDefined();
    expect(result.current.startNewConversation).toBeDefined();
    expect(result.current.addMessage).toBeDefined();
    expect(result.current.setMessages).toBeDefined();
    expect(result.current.currentConversationId).toBeDefined();

    act(() => {
      result.current.startNewConversation();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it("deve permitir executar runAgent sem erros", async () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await expect(result.current.runAgent("Teste")).resolves.not.toThrow();
    });
  });
});
