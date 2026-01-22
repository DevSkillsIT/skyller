/**
 * Testes do Componente Message
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-035: Componente Message Extraido com Markdown
 * @acceptance AC-018: Retry Logic para Mensagens Falhas
 * @acceptance AC-034: Timestamp Formatacao Relativa+Absoluta
 *
 * @phase PRESERVE - DDD Characterization Tests
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Message, type MessageData, type Agent } from "@/components/chat/message";

// Mock do Streamdown para evitar problemas com lazy loading em testes
vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: string }) => <div data-testid="streamdown">{children}</div>,
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Message - Componente de Mensagem", () => {
  const mockUserMessage: MessageData = {
    id: "msg-user-001",
    role: "user",
    content: "Ola, como voce esta?",
    timestamp: new Date("2026-01-22T10:00:00"),
  };

  const mockAssistantMessage: MessageData = {
    id: "msg-assistant-001",
    role: "assistant",
    content: "Estou bem, obrigado por perguntar!",
    timestamp: new Date("2026-01-22T10:01:00"),
    agentId: "general",
  };

  const mockAgent: Agent = {
    id: "general",
    name: "Assistente Geral",
    description: "Assistente para tarefas gerais",
  };

  describe("Renderizacao Basica", () => {
    it("deve renderizar mensagem do usuario corretamente", () => {
      render(<Message message={mockUserMessage} />);

      expect(screen.getByText("Ola, como voce esta?")).toBeInTheDocument();
    });

    it("deve renderizar mensagem do assistente corretamente", () => {
      render(<Message message={mockAssistantMessage} agent={mockAgent} />);

      expect(screen.getByText("Estou bem, obrigado por perguntar!")).toBeInTheDocument();
    });

    it("deve exibir nome do agente para mensagens do assistente", () => {
      render(<Message message={mockAssistantMessage} agent={mockAgent} />);

      expect(screen.getByText("Assistente Geral")).toBeInTheDocument();
    });

    it("nao deve exibir nome do agente para mensagens do usuario", () => {
      render(<Message message={mockUserMessage} agent={mockAgent} />);

      expect(screen.queryByText("Assistente Geral")).not.toBeInTheDocument();
    });
  });

  describe("AC-018: Retry Logic", () => {
    it("deve exibir indicador de erro quando mensagem tem erro", () => {
      const errorMessage: MessageData = {
        ...mockUserMessage,
        hasError: true,
        errorMessage: "Falha ao enviar mensagem",
      };

      render(<Message message={errorMessage} />);

      expect(screen.getByText("Falha ao enviar mensagem")).toBeInTheDocument();
    });

    it("deve exibir botao de retry para mensagens do usuario com erro", () => {
      const errorMessage: MessageData = {
        ...mockUserMessage,
        hasError: true,
        errorMessage: "Erro de rede",
      };

      render(<Message message={errorMessage} />);

      expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
    });

    it("deve chamar onRetry quando botao de retry e clicado", () => {
      const onRetry = vi.fn();
      const errorMessage: MessageData = {
        ...mockUserMessage,
        hasError: true,
      };

      render(<Message message={errorMessage} onRetry={onRetry} />);

      const retryButton = screen.getByText("Tentar novamente");
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledWith(errorMessage.id, errorMessage.content);
    });

    it("nao deve exibir botao de retry para mensagens do assistente com erro", () => {
      const errorMessage: MessageData = {
        ...mockAssistantMessage,
        hasError: true,
      };

      render(<Message message={errorMessage} agent={mockAgent} />);

      expect(screen.queryByText("Tentar novamente")).not.toBeInTheDocument();
    });
  });

  describe("Acoes do Assistente", () => {
    it("deve exibir botoes de acao para mensagens do assistente sem erro", () => {
      render(<Message message={mockAssistantMessage} agent={mockAgent} />);

      // Botoes de feedback e acoes
      expect(screen.getByTitle("Feedback positivo")).toBeInTheDocument();
      expect(screen.getByTitle("Feedback negativo")).toBeInTheDocument();
      expect(screen.getByTitle("Copiar")).toBeInTheDocument();
      expect(screen.getByTitle("Regenerar resposta")).toBeInTheDocument();
    });

    it("nao deve exibir botoes de acao para mensagens do usuario", () => {
      render(<Message message={mockUserMessage} />);

      expect(screen.queryByTitle("Feedback positivo")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Feedback negativo")).not.toBeInTheDocument();
    });

    it("deve chamar onFeedbackPositive quando botao e clicado", () => {
      const onFeedbackPositive = vi.fn();

      render(
        <Message
          message={mockAssistantMessage}
          agent={mockAgent}
          onFeedbackPositive={onFeedbackPositive}
        />
      );

      const positiveButton = screen.getByTitle("Feedback positivo");
      fireEvent.click(positiveButton);

      expect(onFeedbackPositive).toHaveBeenCalledWith(mockAssistantMessage.id);
    });

    it("deve chamar onFeedbackNegative quando botao e clicado", () => {
      const onFeedbackNegative = vi.fn();

      render(
        <Message
          message={mockAssistantMessage}
          agent={mockAgent}
          onFeedbackNegative={onFeedbackNegative}
        />
      );

      const negativeButton = screen.getByTitle("Feedback negativo");
      fireEvent.click(negativeButton);

      expect(onFeedbackNegative).toHaveBeenCalledWith(mockAssistantMessage.id);
    });

    it("deve chamar onRegenerate quando botao e clicado", () => {
      const onRegenerate = vi.fn();

      render(
        <Message
          message={mockAssistantMessage}
          agent={mockAgent}
          onRegenerate={onRegenerate}
        />
      );

      const regenerateButton = screen.getByTitle("Regenerar resposta");
      fireEvent.click(regenerateButton);

      expect(onRegenerate).toHaveBeenCalledWith(mockAssistantMessage.id);
    });
  });

  describe("Artifacts", () => {
    it("deve renderizar artifacts quando presentes", () => {
      const messageWithArtifacts: MessageData = {
        ...mockAssistantMessage,
        artifacts: [
          {
            id: "artifact-001",
            title: "Codigo Python",
            type: "code",
            language: "python",
            content: "print('Hello World')",
          },
        ],
      };

      render(<Message message={messageWithArtifacts} agent={mockAgent} />);

      expect(screen.getByText("Codigo Python")).toBeInTheDocument();
    });

    it("deve chamar onOpenArtifact quando artifact e clicado", () => {
      const onOpenArtifact = vi.fn();
      const artifact = {
        id: "artifact-001",
        title: "Documento",
        type: "document" as const,
        content: "Conteudo do documento",
      };
      const messageWithArtifacts: MessageData = {
        ...mockAssistantMessage,
        artifacts: [artifact],
      };

      render(
        <Message
          message={messageWithArtifacts}
          agent={mockAgent}
          onOpenArtifact={onOpenArtifact}
        />
      );

      const artifactElement = screen.getByText("Documento");
      fireEvent.click(artifactElement);

      expect(onOpenArtifact).toHaveBeenCalledWith(artifact);
    });
  });

  describe("Indicador de Streaming", () => {
    it("deve exibir indicador de streaming quando isStreaming e true", () => {
      const streamingMessage: MessageData = {
        ...mockAssistantMessage,
        isStreaming: true,
      };

      const { container } = render(
        <Message message={streamingMessage} agent={mockAgent} />
      );

      // Verifica se existe o elemento de pulse animation
      const pulseElement = container.querySelector(".animate-pulse");
      expect(pulseElement).toBeInTheDocument();
    });

    it("nao deve exibir indicador de streaming quando isStreaming e false", () => {
      const { container } = render(
        <Message message={mockAssistantMessage} agent={mockAgent} />
      );

      const pulseElement = container.querySelector(".animate-pulse");
      expect(pulseElement).not.toBeInTheDocument();
    });
  });
});
