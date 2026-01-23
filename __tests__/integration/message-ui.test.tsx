/**
 * Testes de UI - Exibição de Tool Calls e Thinking State
 *
 * Validação da migração GAP-CRIT-01:
 * - UI exibe tool calls corretamente
 * - UI exibe thinking state corretamente
 * - Indicadores visuais funcionam
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Message } from "@/components/chat/message";

describe("Message UI - Tool Calls e Thinking State", () => {
  it("deve exibir indicador de thinking state", () => {
    const message = {
      id: "msg-1",
      role: "assistant" as const,
      content: "Analisando os dados...",
      timestamp: new Date(),
    };

    render(
      <Message
        message={message}
        isStreaming={false}
        thinkingState="Analisando..."
      />
    );

    // Deve exibir o texto do thinking state
    expect(screen.getByText("Analisando...")).toBeInTheDocument();
  });

  it("deve exibir indicador de tool call em execução", () => {
    const message = {
      id: "msg-2",
      role: "assistant" as const,
      content: "Pesquisando no banco de dados...",
      timestamp: new Date(),
      toolCall: {
        name: "search_database",
        status: "running" as const,
      },
    };

    render(<Message message={message} isStreaming={false} />);

    // Deve exibir o nome da ferramenta
    expect(screen.getByText(/search_database/)).toBeInTheDocument();
    expect(screen.getByText(/Ferramenta:/)).toBeInTheDocument();
  });

  it("deve exibir tool call concluído com resultado", () => {
    const message = {
      id: "msg-3",
      role: "assistant" as const,
      content: "Encontrei os resultados",
      timestamp: new Date(),
      toolCall: {
        name: "search_database",
        status: "completed" as const,
        result: "3 usuários encontrados",
      },
    };

    render(<Message message={message} isStreaming={false} />);

    // Deve exibir o resultado
    expect(screen.getByText("3 usuários encontrados")).toBeInTheDocument();
    expect(screen.getByText(/Concluído/)).toBeInTheDocument();
  });

  it("deve exibir tool call que falhou", () => {
    const message = {
      id: "msg-4",
      role: "assistant" as const,
      content: "Erro ao executar",
      timestamp: new Date(),
      toolCall: {
        name: "invalid_tool",
        status: "failed" as const,
      },
    };

    render(<Message message={message} isStreaming={false} />);

    // Deve exibir indicador de falha
    expect(screen.getByText(/Falhou/)).toBeInTheDocument();
  });

  it("deve exibir tool call via currentTool prop", () => {
    const message = {
      id: "msg-5",
      role: "assistant" as const,
      content: "Processando...",
      timestamp: new Date(),
    };

    render(
      <Message
        message={message}
        isStreaming={true}
        currentTool="analyze_data"
      />
    );

    // Deve exibir o currentTool
    expect(screen.getByText(/analyze_data/)).toBeInTheDocument();
  });

  it("deve renderizar conteúdo com Streamdown", () => {
    const message = {
      id: "msg-6",
      role: "assistant" as const,
      content: "# Título\n\nConteúdo **importante**",
      timestamp: new Date(),
    };

    render(<Message message={message} isStreaming={false} />);

    // Deve renderizar o conteúdo
    expect(screen.getByText(/Título/)).toBeInTheDocument();
    expect(screen.getByText(/importante/)).toBeInTheDocument();
  });

  it("não deve exibir indicadores quando não há tool call ou thinking", () => {
    const message = {
      id: "msg-7",
      role: "assistant" as const,
      content: "Mensagem simples",
      timestamp: new Date(),
    };

    render(<Message message={message} isStreaming={false} />);

    // Não deve exibir indicadores
    expect(screen.queryByText(/Ferramenta:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Analisando/)).not.toBeInTheDocument();
  });
});
