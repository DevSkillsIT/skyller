/**
 * Testes do Componente ChatErrorBoundary
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-038: ChatErrorBoundary Criado
 *
 * @phase PRESERVE - DDD Characterization Tests
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary";

// Componente que lanca erro no render
class BrokenComponent extends React.Component {
  render(): React.ReactNode {
    throw new Error("Componente quebrado!");
  }
}

// Componente que lanca erro condicionalmente
class ConditionalErrorComponent extends React.Component<{ shouldThrow: boolean }> {
  render(): React.ReactNode {
    if (this.props.shouldThrow) {
      throw new Error("Erro condicional!");
    }
    return <div>Conteudo normal</div>;
  }
}

describe("ChatErrorBoundary - Error Boundary do Chat", () => {
  // Suprime erros do console durante os testes de erro
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Comportamento Normal (Sem Erros)", () => {
    it("deve renderizar filhos quando nao ha erro", () => {
      render(
        <ChatErrorBoundary>
          <div>Conteudo do chat</div>
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Conteudo do chat")).toBeInTheDocument();
    });

    it("deve renderizar multiplos filhos corretamente", () => {
      render(
        <ChatErrorBoundary>
          <div>Primeiro filho</div>
          <div>Segundo filho</div>
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Primeiro filho")).toBeInTheDocument();
      expect(screen.getByText("Segundo filho")).toBeInTheDocument();
    });
  });

  describe("Captura de Erros", () => {
    it("deve capturar erro e exibir UI de fallback", () => {
      render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();
    });

    it("deve exibir mensagem de orientacao ao usuario", () => {
      render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(
        screen.getByText(/Algo deu errado ao carregar o chat/i)
      ).toBeInTheDocument();
    });

    it("deve exibir botao de tentar novamente", () => {
      render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByRole("button", { name: /Tentar Novamente/i })).toBeInTheDocument();
    });

    it("deve exibir botao de recarregar pagina", () => {
      render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByRole("button", { name: /Recarregar Pagina/i })).toBeInTheDocument();
    });

    it("deve chamar callback onError quando erro ocorre", () => {
      const onError = vi.fn();

      render(
        <ChatErrorBoundary onError={onError}>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Componente quebrado!",
        }),
        expect.any(Object)
      );
    });

    it("deve exibir icone de alerta quando erro ocorre", () => {
      const { container } = render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      // Verifica se ha um SVG com a classe do icone de alerta
      const alertIcon = container.querySelector("svg");
      expect(alertIcon).toBeInTheDocument();
    });

    it("deve recuperar de erro com botao retry", () => {
      const { rerender } = render(
        <ChatErrorBoundary>
          <ConditionalErrorComponent shouldThrow={true} />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();

      // Re-render com shouldThrow=false
      rerender(
        <ChatErrorBoundary>
          <ConditionalErrorComponent shouldThrow={false} />
        </ChatErrorBoundary>
      );

      // Deve recuperar e renderizar o conteudo normal
      expect(screen.getByText("Conteudo normal")).toBeInTheDocument();
      expect(screen.queryByText("Ocorreu um erro no chat")).not.toBeInTheDocument();
    });

    it("deve exibir detalhes do erro em desenvolvimento", () => {
      const { container } = render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      // Em desenvolvimento, deve mostrar a mensagem do erro em um elemento mono
      const errorDetail = container.querySelector("p[class*='font-mono']");
      expect(errorDetail).toBeInTheDocument();
      if (errorDetail) {
        expect(errorDetail.textContent).toContain("Componente quebrado!");
      }
    });

    it("deve manter estado de erro mesmo apos re-render", () => {
      const { rerender } = render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();

      rerender(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();
    });

    it("deve capturar multiplos erros consecutivos", () => {
      const onError = vi.fn();

      const { rerender } = render(
        <ChatErrorBoundary onError={onError}>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();
      expect(onError).toHaveBeenCalledTimes(1);

      rerender(
        <ChatErrorBoundary onError={onError}>
          <ConditionalErrorComponent shouldThrow={true} />
        </ChatErrorBoundary>
      );

      // O error boundary continua em estado de erro
      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();
    });

    it("deve ter estilos de destaque visual para erros", () => {
      const { container } = render(
        <ChatErrorBoundary>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      // Verifica se ha um elemento com classes de fundo destrutor
      const errorBox = container.querySelector("div[class*='bg-destructive']");
      expect(errorBox).toBeInTheDocument();
    });

    it("deve suportar callbacks customizados", () => {
      const onError = vi.fn();

      render(
        <ChatErrorBoundary onError={onError}>
          <BrokenComponent />
        </ChatErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      const [error, errorInfo] = onError.mock.calls[0];
      expect(error).toBeInstanceOf(Error);
      expect(errorInfo).toHaveProperty("componentStack");
    });
  });

  describe("Recuperacao de Erros", () => {
    it("deve permitir retry apos erro", () => {
      let shouldThrow = true;

      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error("Erro temporario");
        }
        return <div>Conteudo recuperado</div>;
      };

      const { rerender } = render(
        <ChatErrorBoundary>
          <TestComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Ocorreu um erro no chat")).toBeInTheDocument();

      shouldThrow = false;
      rerender(
        <ChatErrorBoundary>
          <TestComponent />
        </ChatErrorBoundary>
      );

      expect(screen.getByText("Conteudo recuperado")).toBeInTheDocument();
    });
  });
});
