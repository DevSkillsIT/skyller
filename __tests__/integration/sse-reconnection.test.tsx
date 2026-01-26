import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectionStatus } from "@/components/chat/connection-status";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";

const mockAgent = {
  messages: [],
  isRunning: false,
  threadId: "thread-1",
  subscribe: vi.fn(),
  addMessage: vi.fn(),
  setMessages: vi.fn(),
  runAgent: vi.fn(async () => {}),
  setState: vi.fn(),
};

let lastSubscriber: any = null;

// Mock do CopilotKit v2
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgent: vi.fn(() => ({ agent: mockAgent })),
  UseAgentUpdate: {
    OnMessagesChanged: "OnMessagesChanged",
    OnStateChanged: "OnStateChanged",
    OnRunStatusChanged: "OnRunStatusChanged",
  },
}));

// Mock do sonner toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock do useRateLimit
vi.mock("@/lib/hooks/use-rate-limit", () => ({
  useRateLimit: () => ({
    isLimited: false,
    remaining: 30,
    limit: 30,
    resetAt: null,
    formattedTime: "",
  }),
}));

// Componente de teste que consome ChatContext
function TestChatComponent() {
  const { isConnected, reconnectAttempt } = useChat();

  return (
    <div>
      <div data-testid="connection-status">{isConnected ? "Conectado" : "Desconectado"}</div>
      <div data-testid="reconnect-attempt">{reconnectAttempt}</div>
      <ConnectionStatus
        isConnected={isConnected}
        reconnectAttempt={reconnectAttempt}
        maxRetries={5}
      />
    </div>
  );
}

describe("Integração: Reconexão SSE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSubscriber = null;
    mockAgent.subscribe.mockImplementation((subscriber: any) => {
      lastSubscriber = subscriber;
      return { unsubscribe: vi.fn() };
    });
  });

  it("deve iniciar conectado por padrão", () => {
    render(
      <ChatProvider>
        <TestChatComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
    expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("0");
  });

  it("deve atualizar estado em eventos de reconexão", () => {
    render(
      <ChatProvider>
        <TestChatComponent />
      </ChatProvider>
    );

    act(() => {
      lastSubscriber?.onCustomEvent?.({ event: { name: "SSE_RECONNECTING" } });
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent("Desconectado");
    expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("1");

    act(() => {
      lastSubscriber?.onCustomEvent?.({ event: { name: "SSE_RECONNECTED" } });
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
    expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("0");

    act(() => {
      lastSubscriber?.onCustomEvent?.({ event: { name: "SSE_MAX_RETRIES_EXCEEDED" } });
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent("Desconectado");
    expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("5");
  });
});
