/**
 * Testes de UI - Exibição de Tool Calls e Thinking State
 *
 * Validação da migração GAP-CRIT-01:
 * - UI exibe tool calls corretamente
 * - UI exibe thinking state corretamente
 * - Indicadores visuais funcionam
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Message } from "@/components/chat/message";

describe("Message UI - Thinking, Steps e Tool Calls", () => {
  it("deve exibir painel de thinking", () => {
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
        thinking={{
          status: "active",
          title: "Analisando...",
          content: "Raciocinando sobre a resposta...",
          startedAt: Date.now(),
        }}
      />
    );

    // Deve exibir o título do painel de thinking
    expect(screen.getByText("Analisando...")).toBeInTheDocument();
  });

  it("deve exibir etapas de execução", () => {
    const message = {
      id: "msg-2",
      role: "assistant" as const,
      content: "Executando fluxo...",
      timestamp: new Date(),
    };

    render(
      <Message
        message={message}
        isStreaming={false}
        steps={[
          {
            stepName: "processing",
            status: "running",
            startedAt: Date.now(),
          },
        ]}
      />
    );

    // Deve exibir o indicador de etapas
    expect(screen.getByText(/Etapas/)).toBeInTheDocument();
    expect(screen.getByText(/Processando/)).toBeInTheDocument();
  });

  it("deve exibir tool call concluído com resultado", () => {
    const message = {
      id: "msg-3",
      role: "assistant" as const,
      content: "Encontrei os resultados",
      timestamp: new Date(),
    };

    render(
      <Message
        message={message}
        isStreaming={false}
        toolCalls={[
          {
            toolCallId: "tc-1",
            toolCallName: "search_database",
            status: "completed",
            args: "{\"query\":\"users\"}",
            result: "3 usuários encontrados",
            startedAt: Date.now(),
            endedAt: Date.now(),
          },
        ]}
      />
    );

    const toggle = screen.getByRole("button");

    fireEvent.click(toggle);

    // Deve exibir o resultado
    expect(screen.getByText("3 usuários encontrados")).toBeInTheDocument();
    expect(screen.getByText(/Concluído/)).toBeInTheDocument();
  });

  it("deve exibir activity card", () => {
    const message = {
      id: "msg-4",
      role: "assistant" as const,
      content: "Atividade em progresso",
      timestamp: new Date(),
    };

    render(
      <Message
        message={message}
        isStreaming={false}
        activities={[
          {
            messageId: "activity-1",
            activityType: "SEARCH",
            content: { query: "AG-UI", results: 5 },
            updatedAt: Date.now(),
          },
        ]}
      />
    );

    // Deve exibir a activityType
    expect(screen.getByText(/SEARCH/)).toBeInTheDocument();
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

  it("não deve exibir blocos auxiliares quando não há eventos", () => {
    const message = {
      id: "msg-7",
      role: "assistant" as const,
      content: "Mensagem simples",
      timestamp: new Date(),
    };

    render(<Message message={message} isStreaming={false} />);

    // Não deve exibir blocos auxiliares
    expect(screen.queryByText(/Etapas/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pensando/)).not.toBeInTheDocument();
  });
});
