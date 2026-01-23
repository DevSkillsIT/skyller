/**
 * Testes Unitários - Hook useAgentEvents (GAP-CRIT-03)
 *
 * Validação do processamento de eventos AG-UI:
 * - THINKING_START/END: Estado de pensamento
 * - TOOL_CALL_START/END: Execução de ferramentas
 * - RUN_ERROR: Erros de execução
 *
 * Requisitos SPEC:
 * - AC-023: Tool calls processados corretamente
 * - AC-024: Thinking state processado corretamente
 * - AC-027: Erros processados corretamente
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentEvents, useToolCallMessage, type Agent, type AgentEvent } from "@/lib/hooks/use-agent-events";

describe("useAgentEvents Hook", () => {
  let mockAgent: Agent;
  let eventCallback: ((event: AgentEvent) => void) | null = null;

  beforeEach(() => {
    eventCallback = null;
    mockAgent = {
      subscribe: vi.fn((callback) => {
        eventCallback = callback;
        return vi.fn(); // unsubscribe function
      }),
    };
  });

  describe("Inicialização", () => {
    it("deve inicializar com estado padrão", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      expect(result.current.isThinking).toBe(false);
      expect(result.current.thinkingMessage).toBe("");
      expect(result.current.currentTool).toBeUndefined();
      expect(result.current.lastError).toBeUndefined();
    });

    it("deve se inscrever em eventos do agente", () => {
      renderHook(() => useAgentEvents(mockAgent));

      expect(mockAgent.subscribe).toHaveBeenCalledTimes(1);
      expect(mockAgent.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it("não deve quebrar se agente for null", () => {
      const { result } = renderHook(() => useAgentEvents(null));

      expect(result.current.isThinking).toBe(false);
      expect(result.current.currentTool).toBeUndefined();
    });

    it("não deve quebrar se agente não tiver subscribe", () => {
      const agentWithoutSubscribe = {} as Agent;
      const { result } = renderHook(() => useAgentEvents(agentWithoutSubscribe));

      expect(result.current.isThinking).toBe(false);
      expect(result.current.currentTool).toBeUndefined();
    });
  });

  describe("AC-024: THINKING_START Event", () => {
    it("deve processar THINKING_START corretamente", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({ type: "THINKING_START" });
      });

      expect(result.current.isThinking).toBe(true);
      expect(result.current.thinkingMessage).toBe("🧠 Analisando sua solicitação...");
    });
  });

  describe("AC-024: THINKING_END Event", () => {
    it("deve processar THINKING_END corretamente", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      // Primeiro inicia thinking
      act(() => {
        eventCallback?.({ type: "THINKING_START" });
      });

      expect(result.current.isThinking).toBe(true);

      // Depois finaliza
      act(() => {
        eventCallback?.({ type: "THINKING_END" });
      });

      expect(result.current.isThinking).toBe(false);
      expect(result.current.thinkingMessage).toBe("");
    });
  });

  describe("AC-023: TOOL_CALL_START Event", () => {
    it("deve processar TOOL_CALL_START com nome da ferramenta", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({
          type: "TOOL_CALL_START",
          toolName: "search_docs",
        });
      });

      expect(result.current.currentTool).toBeDefined();
      expect(result.current.currentTool?.name).toBe("search_docs");
      expect(result.current.currentTool?.status).toBe("running");
      expect(result.current.currentTool?.startedAt).toBeInstanceOf(Date);
    });

    it("não deve quebrar se toolName não for fornecido", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({ type: "TOOL_CALL_START" });
      });

      // Não deve ter currentTool definido
      expect(result.current.currentTool).toBeUndefined();
    });
  });

  describe("AC-023: TOOL_CALL_END Event", () => {
    it("deve limpar currentTool ao receber TOOL_CALL_END", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      // Primeiro inicia tool call
      act(() => {
        eventCallback?.({
          type: "TOOL_CALL_START",
          toolName: "analyze_data",
        });
      });

      expect(result.current.currentTool).toBeDefined();

      // Depois finaliza
      act(() => {
        eventCallback?.({ type: "TOOL_CALL_END" });
      });

      expect(result.current.currentTool).toBeUndefined();
    });
  });

  describe("AC-027: RUN_ERROR Event", () => {
    it("deve processar RUN_ERROR com mensagem e código", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({
          type: "RUN_ERROR",
          error: {
            message: "Erro ao executar ferramenta",
            code: "TOOL_EXECUTION_FAILED",
          },
        });
      });

      expect(result.current.lastError).toBeDefined();
      expect(result.current.lastError?.message).toBe("Erro ao executar ferramenta");
      expect(result.current.lastError?.code).toBe("TOOL_EXECUTION_FAILED");
      expect(result.current.lastError?.timestamp).toBeInstanceOf(Date);
    });

    it("deve usar código UNKNOWN se não fornecido", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({
          type: "RUN_ERROR",
          error: {
            message: "Erro sem código",
          },
        });
      });

      expect(result.current.lastError?.code).toBe("UNKNOWN");
    });

    it("deve limpar thinking e tool call ao receber erro", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      // Configurar estado com thinking e tool call
      act(() => {
        eventCallback?.({ type: "THINKING_START" });
        eventCallback?.({
          type: "TOOL_CALL_START",
          toolName: "test_tool",
        });
      });

      expect(result.current.isThinking).toBe(true);
      expect(result.current.currentTool).toBeDefined();

      // Enviar erro
      act(() => {
        eventCallback?.({
          type: "RUN_ERROR",
          error: { message: "Erro" },
        });
      });

      expect(result.current.isThinking).toBe(false);
      expect(result.current.currentTool).toBeUndefined();
    });

    it("não deve quebrar se error não for fornecido", () => {
      const { result } = renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({ type: "RUN_ERROR" });
      });

      // Não deve ter lastError definido
      expect(result.current.lastError).toBeUndefined();
    });
  });

  describe("Lifecycle e Cleanup", () => {
    it("deve fazer unsubscribe ao desmontar", () => {
      const unsubscribeMock = vi.fn();
      mockAgent.subscribe = vi.fn(() => unsubscribeMock);

      const { unmount } = renderHook(() => useAgentEvents(mockAgent));

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });

    it("deve reinscrever se agente mudar", () => {
      const { rerender } = renderHook(
        ({ agent }) => useAgentEvents(agent),
        { initialProps: { agent: mockAgent } }
      );

      expect(mockAgent.subscribe).toHaveBeenCalledTimes(1);

      // Criar novo agente
      const newMockAgent: Agent = {
        subscribe: vi.fn((callback) => {
          eventCallback = callback;
          return vi.fn();
        }),
      };

      rerender({ agent: newMockAgent });

      expect(newMockAgent.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("Eventos Desconhecidos", () => {
    it("deve logar warning para evento desconhecido", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderHook(() => useAgentEvents(mockAgent));

      act(() => {
        eventCallback?.({ type: "UNKNOWN_EVENT" as any });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Evento desconhecido: UNKNOWN_EVENT")
      );

      consoleWarnSpy.mockRestore();
    });
  });
});

describe("useToolCallMessage Hook", () => {
  it("deve retornar mensagem amigável para search_docs", () => {
    const message = useToolCallMessage("search_docs");
    expect(message).toBe("Consultando documentação...");
  });

  it("deve retornar mensagem amigável para search_database", () => {
    const message = useToolCallMessage("search_database");
    expect(message).toBe("Pesquisando no banco de dados...");
  });

  it("deve retornar mensagem amigável para analyze_data", () => {
    const message = useToolCallMessage("analyze_data");
    expect(message).toBe("Analisando dados...");
  });

  it("deve retornar mensagem genérica para ferramenta desconhecida", () => {
    const message = useToolCallMessage("unknown_tool");
    expect(message).toBe("Executando unknown_tool...");
  });

  it("deve retornar string vazia se toolName for undefined", () => {
    const message = useToolCallMessage(undefined);
    expect(message).toBe("");
  });
});
