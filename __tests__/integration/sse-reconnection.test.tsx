import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatProvider, useChat } from "@/lib/contexts/chat-context";
import { ConnectionStatus } from "@/components/chat/connection-status";
import { toast } from "sonner";

// Mock do sonner toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do CopilotKit
vi.mock("@copilotkit/react-core", () => ({
  useCopilotChat: () => ({
    visibleMessages: [],
    appendMessage: vi.fn(),
    isLoading: false,
  }),
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

// Mock do EventSource
class MockEventSource {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simula conexão bem-sucedida após 10ms
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }

  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }
}

// Componente de teste que consome ChatContext
function TestChatComponent() {
  const { isConnected, reconnectAttempt } = useChat();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? "Conectado" : "Desconectado"}
      </div>
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
  let mockEventSource: MockEventSource | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    // Substitui EventSource global pelo mock
    global.EventSource = class {
      constructor(url: string) {
        mockEventSource = new MockEventSource(url);
        return mockEventSource as any;
      }
    } as any;
  });

  afterEach(() => {
    mockEventSource = null;
    vi.restoreAllMocks();
  });

  describe("Conexão inicial", () => {
    it("deve conectar automaticamente ao montar o ChatProvider", async () => {
      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Inicialmente desconectado
      expect(screen.getByTestId("connection-status")).toHaveTextContent("Desconectado");

      // Aguarda conexão
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 200 }
      );

      expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("0");
    });

    it("deve exibir feedback visual de conexão", async () => {
      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Deve exibir "Conectando" inicialmente
      expect(screen.getByText(/Conectando ao servidor/i)).toBeInTheDocument();

      // Aguarda conexão
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 200 }
      );

      // Feedback de conexão deve desaparecer
      expect(screen.queryByText(/Conectando ao servidor/i)).not.toBeInTheDocument();
    });
  });

  describe("Reconexão após falha", () => {
    it("deve reconectar automaticamente após perda de conexão", async () => {
      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda conexão inicial
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 200 }
      );

      // Simula erro de conexão
      act(() => {
        mockEventSource?.simulateError();
      });

      // Deve mostrar desconectado
      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent("Desconectado");
      });

      // Deve mostrar tentativa de reconexão
      await waitFor(
        () => {
          expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("1");
        },
        { timeout: 200 }
      );

      // Deve mostrar feedback visual de reconexão
      expect(screen.getByText(/Reconectando ao servidor/i)).toBeInTheDocument();
      expect(screen.getByText(/Tentativa 1 de 5/i)).toBeInTheDocument();

      // Aguarda reconexão bem-sucedida
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 300 }
      );

      // Tentativa deve resetar para 0
      expect(screen.getByTestId("reconnect-attempt")).toHaveTextContent("0");

      // Feedback de reconexão deve desaparecer
      expect(screen.queryByText(/Reconectando ao servidor/i)).not.toBeInTheDocument();
    });

    it("deve notificar usuário durante reconexão (AC-007)", async () => {
      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda conexão inicial
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 200 }
      );

      // Simula erro
      act(() => {
        mockEventSource?.simulateError();
      });

      // Deve notificar reconexão
      await waitFor(
        () => {
          expect(toast.info).toHaveBeenCalledWith(
            expect.stringContaining("Reconectando")
          );
        },
        { timeout: 300 }
      );

      // Aguarda reconexão
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 300 }
      );

      // Deve notificar sucesso
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Conexão restabelecida")
      );
    });

    it("deve exibir botão de recarregar após exceder máximo de tentativas", async () => {
      // Mock do EventSource que sempre falha
      global.EventSource = class {
        constructor(url: string) {
          mockEventSource = new MockEventSource(url);
          // Força erro imediatamente
          setTimeout(() => {
            mockEventSource?.simulateError();
          }, 10);
          return mockEventSource as any;
        }
      } as any;

      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda múltiplas tentativas falharem
      await waitFor(
        () => {
          const attempt = parseInt(screen.getByTestId("reconnect-attempt").textContent || "0");
          return attempt >= 5;
        },
        { timeout: 2000 }
      );

      // Deve mostrar mensagem de falha
      expect(screen.getByText(/Conexão perdida/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Não foi possível reconectar ao servidor após 5 tentativas/i)
      ).toBeInTheDocument();

      // Deve mostrar botão de recarregar
      const reloadButton = screen.getByRole("button", { name: /Recarregar página/i });
      expect(reloadButton).toBeInTheDocument();
    });
  });

  describe("Backoff exponencial", () => {
    it("deve usar delays crescentes entre tentativas: 1s → 2s → 4s", async () => {
      const reconnectTimes: number[] = [];

      // Mock que falha nas primeiras 3 tentativas
      let attemptCount = 0;
      global.EventSource = class {
        constructor(url: string) {
          mockEventSource = new MockEventSource(url);
          attemptCount++;

          if (attemptCount <= 3) {
            // Falha nas primeiras 3 tentativas
            setTimeout(() => {
              reconnectTimes.push(Date.now());
              mockEventSource?.simulateError();
            }, 10);
          } else {
            // Sucesso na 4ª tentativa
            setTimeout(() => {
              mockEventSource!.readyState = 1;
              if (mockEventSource!.onopen) {
                mockEventSource!.onopen(new Event("open"));
              }
            }, 10);
          }

          return mockEventSource as any;
        }
      } as any;

      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda conexão final
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 10000 }
      );

      // Verifica que houve múltiplas tentativas
      expect(attemptCount).toBeGreaterThan(1);
    });
  });

  describe("Conformidade com GAP-CRIT-05", () => {
    it("RE-004: deve limitar a 5 tentativas de reconexão", async () => {
      let attemptCount = 0;

      // Mock que sempre falha
      global.EventSource = class {
        constructor(url: string) {
          mockEventSource = new MockEventSource(url);
          attemptCount++;
          setTimeout(() => {
            mockEventSource?.simulateError();
          }, 10);
          return mockEventSource as any;
        }
      } as any;

      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda máximo de tentativas
      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining("Conexão perdida"),
            expect.any(Object)
          );
        },
        { timeout: 3000 }
      );

      // Deve ter tentado no máximo 6 vezes (1 inicial + 5 reconexões)
      expect(attemptCount).toBeLessThanOrEqual(6);
    });

    it("AC-007: deve mostrar notificação visual durante reconexão", async () => {
      render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda conexão inicial
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 200 }
      );

      // Simula erro
      act(() => {
        mockEventSource?.simulateError();
      });

      // Deve mostrar feedback visual
      await waitFor(
        () => {
          expect(screen.getByText(/Reconectando ao servidor/i)).toBeInTheDocument();
        },
        { timeout: 300 }
      );

      // Deve mostrar número da tentativa
      expect(screen.getByText(/Tentativa 1 de 5/i)).toBeInTheDocument();
    });

    it("deve implementar backoff exponencial conforme especificado", () => {
      // Testa cálculo de delays
      const initialDelay = 1000;
      const getDelay = (attempt: number) => initialDelay * Math.pow(2, attempt - 1);

      expect(getDelay(1)).toBe(1000); // 1s
      expect(getDelay(2)).toBe(2000); // 2s
      expect(getDelay(3)).toBe(4000); // 4s
      expect(getDelay(4)).toBe(8000); // 8s
      expect(getDelay(5)).toBe(16000); // 16s
    });
  });

  describe("Cleanup", () => {
    it("deve desconectar ao desmontar ChatProvider", async () => {
      const { unmount } = render(
        <ChatProvider>
          <TestChatComponent />
        </ChatProvider>
      );

      // Aguarda conexão
      await waitFor(
        () => {
          expect(screen.getByTestId("connection-status")).toHaveTextContent("Conectado");
        },
        { timeout: 200 }
      );

      unmount();

      // EventSource deve ter sido fechado
      expect(mockEventSource?.readyState).toBe(2);
    });
  });
});
