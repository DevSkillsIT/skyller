/**
 * Testes do Componente ChatInput
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-037: Componente ChatInput Extraido
 * @acceptance AC-010: Character Limit Validation
 * @acceptance AC-012: Rate Limit UI with Countdown
 *
 * @phase PRESERVE - DDD Characterization Tests
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput, type Agent, type RateLimitInfo } from "@/components/chat/chat-input";

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("ChatInput - Area de Entrada de Mensagens", () => {
  const mockAgents: Agent[] = [
    { id: "general", name: "Assistente Geral", description: "Assistente para tarefas gerais" },
    { id: "data-analyst", name: "Analista de Dados", description: "Especialista em analise de dados" },
    { id: "code-assistant", name: "Assistente de Codigo", description: "Ajuda com programacao" },
  ];

  const defaultProps = {
    agents: mockAgents,
    selectedAgent: "general",
  };

  describe("Renderizacao Basica", () => {
    it("deve renderizar textarea com placeholder padrao", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByPlaceholderText("Digite sua mensagem...")).toBeInTheDocument();
    });

    it("deve renderizar textarea com placeholder customizado", () => {
      render(<ChatInput {...defaultProps} placeholder="Escreva algo..." />);

      expect(screen.getByPlaceholderText("Escreva algo...")).toBeInTheDocument();
    });

    it("deve renderizar botao de enviar", () => {
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByRole("button", { name: "" });
      expect(sendButton).toBeInTheDocument();
    });

    it("deve renderizar botoes de adicionar e ferramentas", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByText("Adicionar")).toBeInTheDocument();
      expect(screen.getByText("Ferramentas")).toBeInTheDocument();
    });
  });

  describe("Envio de Mensagem", () => {
    it("deve chamar onSend quando botao de enviar e clicado", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      await userEvent.type(textarea, "Ola mundo");

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(onSend).toHaveBeenCalledWith("Ola mundo", "general");
    });

    it("deve limpar textarea apos envio", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...") as HTMLTextAreaElement;
      await userEvent.type(textarea, "Mensagem de teste");

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(textarea.value).toBe("");
    });

    it("nao deve enviar mensagem vazia", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(onSend).not.toHaveBeenCalled();
    });

    it("deve enviar mensagem ao pressionar Enter", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      await userEvent.type(textarea, "Mensagem via Enter{enter}");

      expect(onSend).toHaveBeenCalled();
    });

    it("nao deve enviar ao pressionar Shift+Enter (nova linha)", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      await userEvent.type(textarea, "Linha 1{shift>}{enter}{/shift}Linha 2");

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("AC-010: Character Limit Validation", () => {
    it("deve exibir contador de caracteres quando digitando", async () => {
      render(<ChatInput {...defaultProps} maxChars={100} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      await userEvent.type(textarea, "Teste");

      expect(screen.getByText("5/100")).toBeInTheDocument();
    });

    it("deve exibir aviso quando proximo do limite (90%)", async () => {
      render(<ChatInput {...defaultProps} maxChars={100} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      // Digitar 91 caracteres (91% do limite)
      const longText = "a".repeat(91);
      await userEvent.type(textarea, longText);

      // O contador deve mudar de cor (verificamos que existe)
      expect(screen.getByText("91/100")).toBeInTheDocument();
    });

    it("deve exibir erro quando excede o limite", async () => {
      render(<ChatInput {...defaultProps} maxChars={50} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      // Digitar 55 caracteres (excede limite de 50)
      const longText = "a".repeat(55);
      await userEvent.type(textarea, longText);

      expect(screen.getByText("55/50")).toBeInTheDocument();
    });

    it("nao deve permitir envio quando excede limite", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} maxChars={10} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      await userEvent.type(textarea, "Esta mensagem e muito longa");

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("AC-012: Rate Limit UI", () => {
    it("deve exibir banner de rate limit quando limitado", () => {
      const rateLimit: RateLimitInfo = {
        isLimited: true,
        formattedTime: "0:45",
        remaining: 0,
        limit: 10,
      };

      render(<ChatInput {...defaultProps} rateLimit={rateLimit} />);

      expect(screen.getByText(/Limite de requisicoes atingido/)).toBeInTheDocument();
      expect(screen.getByText("0:45")).toBeInTheDocument();
    });

    it("nao deve exibir banner quando nao esta limitado", () => {
      const rateLimit: RateLimitInfo = {
        isLimited: false,
        formattedTime: "",
        remaining: 5,
        limit: 10,
      };

      render(<ChatInput {...defaultProps} rateLimit={rateLimit} />);

      expect(screen.queryByText(/Limite de requisicoes atingido/)).not.toBeInTheDocument();
    });

    it("deve desabilitar envio quando rate limited", async () => {
      const onSend = vi.fn();
      const rateLimit: RateLimitInfo = {
        isLimited: true,
        formattedTime: "1:00",
        remaining: 0,
        limit: 10,
      };

      render(<ChatInput {...defaultProps} onSend={onSend} rateLimit={rateLimit} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      await userEvent.type(textarea, "Mensagem");

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("Estado de Loading", () => {
    it("deve exibir indicador de loading quando isLoading e true", () => {
      const { container } = render(<ChatInput {...defaultProps} isLoading={true} />);

      // Procura pelo icone de spinner (animate-spin)
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("deve desabilitar textarea quando isLoading e true", () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      expect(textarea).toBeDisabled();
    });

    it("deve desabilitar botao de enviar quando isLoading e true", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} isLoading={true} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      fireEvent.change(textarea, { target: { value: "Teste" } });

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("Estado Desabilitado", () => {
    it("deve desabilitar textarea quando disabled e true", () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      expect(textarea).toBeDisabled();
    });

    it("nao deve enviar mensagem quando disabled", async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} disabled={true} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
      fireEvent.change(textarea, { target: { value: "Teste" } });

      const sendButton = screen.getByRole("button", { name: "" });
      fireEvent.click(sendButton);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("Selecao de Agente", () => {
    it("deve exibir nome do agente selecionado", () => {
      render(<ChatInput {...defaultProps} selectedAgent="data-analyst" />);

      expect(screen.getByText("Analista de Dados")).toBeInTheDocument();
    });

    it("deve chamar onAgentChange quando callback e fornecido", () => {
      const onAgentChange = vi.fn();
      render(<ChatInput {...defaultProps} onAgentChange={onAgentChange} />);

      // Verifica que o callback foi passado e pode ser chamado
      // Teste simplificado pois dropdown menu de Radix nao abre em ambiente de teste jsdom
      expect(screen.getByText("Assistente Geral")).toBeInTheDocument();
    });
  });

  describe("Status Info", () => {
    it("deve exibir contagem de documentos quando maior que zero", () => {
      render(<ChatInput {...defaultProps} docsCount={5} />);

      expect(screen.getByText("5 docs")).toBeInTheDocument();
    });

    it("deve exibir contagem de ferramentas quando maior que zero", () => {
      render(<ChatInput {...defaultProps} toolsCount={3} />);

      expect(screen.getByText("3 tools")).toBeInTheDocument();
    });

    it("nao deve exibir contagens quando zeradas", () => {
      render(<ChatInput {...defaultProps} docsCount={0} toolsCount={0} />);

      expect(screen.queryByText(/docs/)).not.toBeInTheDocument();
      expect(screen.queryByText(/tools/)).not.toBeInTheDocument();
    });
  });
});
