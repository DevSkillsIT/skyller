/**
 * Testes de Integração - MessageList Component (GAP-CRIT-03)
 *
 * Validação da exibição de eventos AG-UI na UI:
 * - AC-023: Tool calls exibidos corretamente
 * - AC-024: Thinking state exibido corretamente
 * - AC-027: Erros exibidos (via contexto)
 *
 * Features testadas:
 * - Renderização de mensagens
 * - Indicadores visuais de thinking
 * - Indicadores visuais de tool calls
 * - Auto-scroll para última mensagem
 * - Acessibilidade (ARIA)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList, EmptyMessageList, MessageListSkeleton } from "@/components/chat/message-list";
import type { Message } from "@/lib/mock/data";

// Mock do componente Message
vi.mock("@/components/chat/message", () => ({
  Message: ({ message }: { message: Message }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content}
    </div>
  ),
}));

// Mock do hook useToolCallMessage
vi.mock("@/lib/hooks/use-agent-events", () => ({
  useToolCallMessage: (toolName?: string) => {
    const messages: Record<string, string> = {
      search_docs: "Consultando documentação...",
      search_database: "Pesquisando no banco de dados...",
      analyze_data: "Analisando dados...",
    };
    return messages[toolName || ""] || `Executando ${toolName}...`;
  },
}));

// Mock scrollIntoView (não disponível em jsdom)
Element.prototype.scrollIntoView = vi.fn();

describe("MessageList Component", () => {
  const mockMessages: Message[] = [
    {
      id: "msg-1",
      role: "user",
      content: "Olá, como você está?",
      timestamp: new Date("2024-01-01T10:00:00Z"),
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "Estou bem, obrigado!",
      timestamp: new Date("2024-01-01T10:00:05Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar lista de mensagens", () => {
      render(<MessageList messages={mockMessages} />);

      expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-2")).toBeInTheDocument();
    });

    it("deve renderizar sem quebrar quando não há mensagens", () => {
      render(<MessageList messages={[]} />);

      // Não deve quebrar, apenas não renderiza mensagens
      expect(screen.queryByTestId(/message-/)).not.toBeInTheDocument();
    });

    it("deve aplicar className customizada", () => {
      const { container } = render(
        <MessageList messages={mockMessages} className="custom-class" />
      );

      const listDiv = container.firstChild as HTMLElement;
      expect(listDiv.className).toContain("custom-class");
    });
  });

  describe("AC-024: Indicador de Thinking State", () => {
    it("deve exibir indicador quando isThinking=true", () => {
      render(
        <MessageList
          messages={mockMessages}
          isThinking={true}
          thinkingMessage="Analisando sua solicitação..."
        />
      );

      // Deve exibir o indicador de thinking
      expect(screen.getByText("Analisando sua solicitação...")).toBeInTheDocument();
      expect(screen.getByRole("status", { name: /agente pensando/i })).toBeInTheDocument();
    });

    it("deve exibir mensagem padrão se thinkingMessage não fornecido", () => {
      render(
        <MessageList
          messages={mockMessages}
          isThinking={true}
        />
      );

      expect(screen.getByText(/🧠 Analisando sua solicitação.../)).toBeInTheDocument();
    });

    it("não deve exibir indicador quando isThinking=false", () => {
      render(
        <MessageList
          messages={mockMessages}
          isThinking={false}
        />
      );

      expect(screen.queryByRole("status", { name: /agente pensando/i })).not.toBeInTheDocument();
    });

    it("deve ter atributos ARIA corretos no indicador de thinking", () => {
      render(
        <MessageList
          messages={mockMessages}
          isThinking={true}
          thinkingMessage="Processando..."
        />
      );

      const indicator = screen.getByRole("status", { name: /agente pensando/i });
      expect(indicator).toHaveAttribute("aria-live", "polite");
      expect(indicator).toHaveAttribute("aria-label", "Agente pensando");
    });
  });

  describe("AC-023: Indicador de Tool Call", () => {
    it("deve exibir indicador quando currentTool está definido", () => {
      render(
        <MessageList
          messages={mockMessages}
          currentTool="search_docs"
        />
      );

      // Deve exibir o nome da ferramenta
      expect(screen.getByText(/🔧 Ferramenta: search_docs/i)).toBeInTheDocument();
      expect(screen.getByRole("status", { name: /executando ferramenta: search_docs/i })).toBeInTheDocument();
    });

    it("deve exibir mensagem contextual da ferramenta", () => {
      render(
        <MessageList
          messages={mockMessages}
          currentTool="search_docs"
        />
      );

      // Deve exibir a mensagem amigável do hook useToolCallMessage
      expect(screen.getByText("Consultando documentação...")).toBeInTheDocument();
    });

    it("deve exibir mensagem para diferentes ferramentas", () => {
      const { rerender } = render(
        <MessageList
          messages={mockMessages}
          currentTool="search_database"
        />
      );

      expect(screen.getByText("Pesquisando no banco de dados...")).toBeInTheDocument();

      rerender(
        <MessageList
          messages={mockMessages}
          currentTool="analyze_data"
        />
      );

      expect(screen.getByText("Analisando dados...")).toBeInTheDocument();
    });

    it("não deve exibir indicador quando currentTool não está definido", () => {
      render(
        <MessageList
          messages={mockMessages}
          currentTool={undefined}
        />
      );

      expect(screen.queryByText(/🔧 Ferramenta:/)).not.toBeInTheDocument();
    });

    it("não deve exibir tool call indicator se isThinking=true", () => {
      render(
        <MessageList
          messages={mockMessages}
          isThinking={true}
          currentTool="search_docs"
        />
      );

      // Thinking tem prioridade, então tool call não deve aparecer
      expect(screen.queryByText(/🔧 Ferramenta:/)).not.toBeInTheDocument();
    });

    it("deve ter atributos ARIA corretos no indicador de tool call", () => {
      render(
        <MessageList
          messages={mockMessages}
          currentTool="search_docs"
        />
      );

      const indicator = screen.getByRole("status", { name: /executando ferramenta: search_docs/i });
      expect(indicator).toHaveAttribute("aria-live", "polite");
      expect(indicator).toHaveAttribute("aria-label", "Executando ferramenta: search_docs");
    });
  });

  describe("Combinações de Estados", () => {
    it("deve exibir apenas thinking quando ambos thinking e tool call estão ativos", () => {
      render(
        <MessageList
          messages={mockMessages}
          isThinking={true}
          thinkingMessage="Pensando..."
          currentTool="search_docs"
        />
      );

      // Thinking deve estar visível
      expect(screen.getByText("Pensando...")).toBeInTheDocument();

      // Tool call NÃO deve estar visível
      expect(screen.queryByText(/🔧 Ferramenta:/)).not.toBeInTheDocument();
    });

    it("deve exibir tool call após thinking terminar", () => {
      const { rerender } = render(
        <MessageList
          messages={mockMessages}
          isThinking={true}
          currentTool="search_docs"
        />
      );

      // Apenas thinking visível
      expect(screen.queryByText(/🔧 Ferramenta:/)).not.toBeInTheDocument();

      // Thinking termina
      rerender(
        <MessageList
          messages={mockMessages}
          isThinking={false}
          currentTool="search_docs"
        />
      );

      // Agora tool call deve estar visível
      expect(screen.getByText(/🔧 Ferramenta: search_docs/i)).toBeInTheDocument();
    });
  });

  describe("Auto-scroll Behavior", () => {
    it("deve ter elemento de referência para scroll", () => {
      const { container } = render(<MessageList messages={mockMessages} />);

      // Deve ter um div vazio para scroll (messagesEndRef)
      const scrollRef = container.querySelector("div:last-child");
      expect(scrollRef).toBeInTheDocument();
    });
  });
});

describe("EmptyMessageList Component", () => {
  it("deve renderizar estado vazio", () => {
    render(<EmptyMessageList />);

    expect(screen.getByText("Nenhuma mensagem ainda")).toBeInTheDocument();
    expect(screen.getByText(/Comece uma conversa/i)).toBeInTheDocument();
  });

  it("deve exibir emoji decorativo", () => {
    render(<EmptyMessageList />);

    expect(screen.getByText("💬")).toBeInTheDocument();
  });
});

describe("MessageListSkeleton Component", () => {
  it("deve renderizar skeleton loading", () => {
    render(<MessageListSkeleton />);

    // Deve ter 3 itens de skeleton (conforme implementação)
    const skeletons = screen.getAllByRole("status", { name: /carregando mensagens/i });
    expect(skeletons).toHaveLength(3);
  });

  it("deve ter classe de animação pulse", () => {
    const { container } = render(<MessageListSkeleton />);

    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});
