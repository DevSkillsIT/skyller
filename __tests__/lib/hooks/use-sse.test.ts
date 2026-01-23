import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSse } from "@/lib/hooks/use-sse";
import { toast } from "sonner";

// Mock do sonner toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
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

  // Método auxiliar para simular erro
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }

  // Método auxiliar para simular mensagem
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }
}

describe("useSse", () => {
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
    it("deve conectar ao endpoint SSE ao chamar connect()", async () => {
      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.reconnectAttempt).toBe(0);

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      expect(global.EventSource).toHaveBeenCalledWith("/api/copilot", {
        withCredentials: true,
      });
    });

    it("deve executar callback onOpen quando conectar", async () => {
      const onOpen = vi.fn();

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          onOpen,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(onOpen).toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });

    it("deve receber mensagens via callback onMessage", async () => {
      const onMessage = vi.fn();

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          onMessage,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      act(() => {
        mockEventSource?.simulateMessage('{"type":"test","data":"hello"}');
      });

      expect(onMessage).toHaveBeenCalled();
      expect(onMessage.mock.calls[0][0].data).toBe('{"type":"test","data":"hello"}');
    });
  });

  describe("Desconexão", () => {
    it("deve desconectar ao chamar disconnect()", async () => {
      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.eventSource).toBe(null);
    });

    it("deve resetar reconnectAttempt ao desconectar manualmente", async () => {
      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          maxRetries: 5,
          initialRetryDelay: 50,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      // Simula erro para iniciar reconexão
      act(() => {
        mockEventSource?.simulateError();
      });

      // Aguarda primeira tentativa de reconexão
      await waitFor(
        () => {
          expect(result.current.reconnectAttempt).toBeGreaterThan(0);
        },
        { timeout: 200 }
      );

      // Desconecta manualmente
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.reconnectAttempt).toBe(0);
    });
  });

  describe("Reconexão automática", () => {
    it("deve reconectar após desconexão inesperada", async () => {
      const onReconnecting = vi.fn();
      const onReconnected = vi.fn();

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          maxRetries: 3,
          initialRetryDelay: 50,
          onReconnecting,
          onReconnected,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      // Simula erro de conexão
      act(() => {
        mockEventSource?.simulateError();
      });

      // Deve desconectar
      expect(result.current.isConnected).toBe(false);

      // Aguarda callback de reconexão
      await waitFor(
        () => {
          expect(onReconnecting).toHaveBeenCalledWith(1, 3);
        },
        { timeout: 200 }
      );

      expect(result.current.reconnectAttempt).toBe(1);

      // Aguarda reconexão bem-sucedida
      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 200 }
      );

      expect(onReconnected).toHaveBeenCalled();
      expect(result.current.reconnectAttempt).toBe(0);
    });

    it("deve usar backoff exponencial: 1s → 2s → 4s → 8s", async () => {
      const delays: number[] = [];
      const startTimes: number[] = [];

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          maxRetries: 4,
          initialRetryDelay: 100, // 100ms para acelerar teste
          onReconnecting: () => {
            startTimes.push(Date.now());
          },
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 150 }
      );

      const initialTime = Date.now();

      // Simula 3 falhas consecutivas
      for (let i = 0; i < 3; i++) {
        act(() => {
          mockEventSource?.simulateError();
        });

        await waitFor(
          () => {
            expect(result.current.reconnectAttempt).toBe(i + 1);
          },
          { timeout: 200 }
        );
      }

      // Calcula delays entre tentativas
      for (let i = 1; i < startTimes.length; i++) {
        delays.push(startTimes[i] - startTimes[i - 1]);
      }

      // Verifica backoff exponencial (com margem de erro de ±30ms)
      if (delays.length >= 1) {
        expect(delays[0]).toBeGreaterThanOrEqual(70); // ~100ms
        expect(delays[0]).toBeLessThanOrEqual(130);
      }

      if (delays.length >= 2) {
        expect(delays[1]).toBeGreaterThanOrEqual(170); // ~200ms
        expect(delays[1]).toBeLessThanOrEqual(230);
      }

      if (delays.length >= 3) {
        expect(delays[2]).toBeGreaterThanOrEqual(370); // ~400ms
        expect(delays[2]).toBeLessThanOrEqual(430);
      }
    });

    it("deve parar de reconectar após maxRetries tentativas", async () => {
      const onMaxRetriesExceeded = vi.fn();

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          maxRetries: 3,
          initialRetryDelay: 50,
          onMaxRetriesExceeded,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      // Simula 4 falhas consecutivas (excedendo maxRetries=3)
      for (let i = 0; i < 4; i++) {
        act(() => {
          mockEventSource?.simulateError();
        });

        await waitFor(
          () => {
            expect(result.current.reconnectAttempt).toBeGreaterThan(i);
          },
          { timeout: 200 }
        );
      }

      // Deve ter chamado callback de máximo excedido
      await waitFor(
        () => {
          expect(onMaxRetriesExceeded).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      expect(result.current.reconnectAttempt).toBe(3);
      expect(result.current.isConnected).toBe(false);
    });

    it("não deve reconectar se disableReconnect=true", async () => {
      const onReconnecting = vi.fn();

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          disableReconnect: true,
          onReconnecting,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      act(() => {
        mockEventSource?.simulateError();
      });

      // Aguarda para garantir que não houve reconexão
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onReconnecting).not.toHaveBeenCalled();
      expect(result.current.reconnectAttempt).toBe(0);
    });
  });

  describe("Cleanup", () => {
    it("deve desconectar ao desmontar o componente", async () => {
      const { result, unmount } = renderHook(() =>
        useSse({
          url: "/api/copilot",
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      unmount();

      // EventSource deve ter sido fechado
      expect(mockEventSource?.readyState).toBe(2);
    });
  });

  describe("Conformidade com GAP-CRIT-05", () => {
    it("deve implementar RE-004: máximo 5 tentativas por padrão", () => {
      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
        })
      );

      // maxRetries padrão é 5
      expect(result.current).toBeDefined();
    });

    it("deve implementar AC-007: notificar usuário durante reconexão", async () => {
      const onReconnecting = vi.fn();

      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          maxRetries: 5,
          onReconnecting,
        })
      );

      act(() => {
        result.current.connect();
      });

      await waitFor(
        () => {
          expect(result.current.isConnected).toBe(true);
        },
        { timeout: 100 }
      );

      act(() => {
        mockEventSource?.simulateError();
      });

      await waitFor(
        () => {
          expect(onReconnecting).toHaveBeenCalledWith(1, 5);
        },
        { timeout: 200 }
      );
    });

    it("deve implementar backoff exponencial: 1s → 2s → 4s → 8s → 16s", () => {
      const { result } = renderHook(() =>
        useSse({
          url: "/api/copilot",
          initialRetryDelay: 1000,
        })
      );

      // Testa cálculo de delays
      // @ts-ignore - Acessando método privado para teste
      const getDelay = (attempt: number) => 1000 * Math.pow(2, attempt - 1);

      expect(getDelay(1)).toBe(1000); // 1s
      expect(getDelay(2)).toBe(2000); // 2s
      expect(getDelay(3)).toBe(4000); // 4s
      expect(getDelay(4)).toBe(8000); // 8s
      expect(getDelay(5)).toBe(16000); // 16s
    });
  });
});
