/**
 * Testes de Melhorias UX - Chat Components
 *
 * Valida as 5 melhorias implementadas:
 * 1. Smart auto-scroll (chat-messages.tsx)
 * 2. Auto-collapse steps (step-indicator.tsx)
 * 3. Auto-open thinking (thinking-panel.tsx)
 * 4. Tool result preview (tool-call-card.tsx)
 * 5. Processing vs Responding visual (chat-messages.tsx)
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatMessages } from "@/components/chat/chat-messages";
import { StepIndicator } from "@/components/chat/step-indicator";
import { ThinkingPanel } from "@/components/chat/thinking-panel";
import { ToolCallCard } from "@/components/chat/tool-call-card";

// Mock dos contextos
vi.mock("@/lib/contexts/panel-context", () => ({
  usePanel: () => ({ openPanel: vi.fn() }),
}));

vi.mock("@/lib/hooks/use-agents", () => ({
  useAgents: () => ({ agents: [] }),
}));

describe("UX Improvements - Smart Auto-scroll", () => {
  it("deve usar StickToBottom para auto-scroll (componente configurado corretamente)", async () => {
    const messages = [
      {
        id: "1",
        role: "user" as const,
        content: "Mensagem 1",
        timestamp: new Date(),
      },
    ];

    const { rerender } = render(
      <ChatMessages messages={messages} isLoading={false} selectedAgentId="skyller" />
    );

    // Verifica que o container de scroll existe
    const viewport = screen.getByTestId("chat-scroll");
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveClass("overflow-y-scroll");

    // Adiciona nova mensagem
    const newMessages = [
      ...messages,
      {
        id: "2",
        role: "assistant" as const,
        content: "Resposta",
        timestamp: new Date(),
      },
    ];

    rerender(<ChatMessages messages={newMessages} isLoading={false} selectedAgentId="skyller" />);

    // Deve exibir a nova mensagem (o scroll é gerenciado pela biblioteca use-stick-to-bottom)
    expect(screen.getByText("Resposta")).toBeInTheDocument();
  });
});

describe("UX Improvements - Auto-collapse Steps", () => {
  it("deve abrir automaticamente quando há step running", () => {
    render(
      <StepIndicator
        steps={[
          {
            stepName: "processing",
            status: "running",
            startedAt: Date.now(),
          },
        ]}
      />
    );

    // Deve estar aberto e mostrar o step
    expect(screen.getByText(/Processando/)).toBeInTheDocument();
  });

  it("deve fechar automaticamente após 2s quando todos steps completarem", async () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <StepIndicator
        steps={[
          {
            stepName: "processing",
            status: "running",
            startedAt: Date.now(),
          },
        ]}
      />
    );

    // Inicialmente aberto
    expect(screen.getByText(/Processando/)).toBeInTheDocument();

    // Atualiza para completo
    act(() => {
      rerender(
        <StepIndicator
          steps={[
            {
              stepName: "processing",
              status: "completed",
              startedAt: Date.now() - 1000,
              endedAt: Date.now(),
            },
          ]}
        />
      );
    });

    // Aguarda 2s para auto-collapse
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Deve ter fechado - botão mostra ChevronRight quando fechado
    const toggleButton = screen.getByRole("button");
    expect(toggleButton.querySelector(".lucide-chevron-right")).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe("UX Improvements - Auto-open Thinking", () => {
  it("deve abrir automaticamente quando thinking está ativo (Glass Box AI)", () => {
    render(
      <ThinkingPanel
        thinking={{
          status: "active",
          title: "Analisando",
          content: "Pensando sobre a resposta...",
          startedAt: Date.now(),
        }}
      />
    );

    // Deve estar aberto e mostrar conteúdo
    expect(screen.getByText("Analisando")).toBeInTheDocument();
  });

  it("deve fechar automaticamente quando thinking termina", () => {
    const { rerender } = render(
      <ThinkingPanel
        thinking={{
          status: "active",
          title: "Analisando",
          content: "Pensando...",
          startedAt: Date.now(),
        }}
      />
    );

    // Inicialmente aberto - deve mostrar o conteúdo expandido
    expect(screen.getByText("Analisando")).toBeInTheDocument();
    expect(screen.getByText("Pensando...")).toBeInTheDocument();

    // Atualiza para completed
    rerender(
      <ThinkingPanel
        thinking={{
          status: "completed",
          title: "Analisando",
          content: "Pensando...",
          startedAt: Date.now() - 1000,
        }}
      />
    );

    // Título ainda visível mas collapsible fechado (ChevronRight indica fechado)
    expect(screen.getByText("Analisando")).toBeInTheDocument();
    const toggleButton = screen.getByRole("button");
    expect(toggleButton.querySelector(".lucide-chevron-right")).toBeInTheDocument();
  });
});

describe("UX Improvements - Tool Result Preview", () => {
  it("deve truncar resultado grande e mostrar botão 'Ver completo'", () => {
    const longResult = "A".repeat(1100); // 1100 caracteres (> 1000)

    render(
      <ToolCallCard
        toolCall={{
          toolCallId: "tc-1",
          toolCallName: "search",
          status: "completed",
          args: '{"query":"test"}',
          result: longResult,
          startedAt: Date.now() - 1000,
          endedAt: Date.now(),
        }}
      />
    );

    // Abre o collapsible
    const toggleButton = screen.getByRole("button", { name: /Ver detalhes técnicos/i });
    fireEvent.click(toggleButton);

    // Deve mostrar botão "Ver completo"
    const expandButton = screen.getByRole("button", { name: /Ver completo/i });
    expect(expandButton).toBeInTheDocument();

    // Clica para expandir
    fireEvent.click(expandButton);

    // Botão muda para "Ver menos"
    expect(screen.getByRole("button", { name: /Ver menos/i })).toBeInTheDocument();
  });

  it("não deve mostrar botão de truncamento para resultado pequeno", () => {
    render(
      <ToolCallCard
        toolCall={{
          toolCallId: "tc-2",
          toolCallName: "search",
          status: "completed",
          args: '{"query":"test"}',
          result: "Resultado curto",
          startedAt: Date.now() - 1000,
          endedAt: Date.now(),
        }}
      />
    );

    // Abre o collapsible
    const toggleButton = screen.getByRole("button", { name: /Ver detalhes técnicos/i });
    fireEvent.click(toggleButton);

    // Não deve mostrar botão de expansão
    expect(screen.queryByRole("button", { name: /Ver completo/i })).not.toBeInTheDocument();
  });

  it("deve aplicar max-height em resultados JSON", () => {
    render(
      <ToolCallCard
        toolCall={{
          toolCallId: "tc-3",
          toolCallName: "search",
          status: "completed",
          args: '{"query":"test"}',
          result: '{"users": [1, 2, 3, 4, 5]}',
          startedAt: Date.now() - 1000,
          endedAt: Date.now(),
        }}
      />
    );

    // Abre o collapsible
    const toggleButton = screen.getByRole("button", { name: /Ver detalhes técnicos/i });
    fireEvent.click(toggleButton);

    // Deve ter o elemento <pre> com max-h-60
    const preElement = document.querySelector("pre.max-h-60");
    expect(preElement).toBeInTheDocument();
  });
});

describe("UX Improvements - Processing vs Responding Visual", () => {
  it("deve exibir 'Processando...' quando há tools/thinking ativos", () => {
    render(
      <ChatMessages
        messages={[]}
        isLoading={true}
        selectedAgentId="skyller"
        thinking={{
          status: "active",
          title: "Pensando",
          content: "Analisando...",
          startedAt: Date.now(),
        }}
      />
    );

    // Deve mostrar "Processando..."
    expect(screen.getByText(/Processando\.\.\./)).toBeInTheDocument();
  });

  it("deve exibir 'Respondendo...' quando apenas está escrevendo", () => {
    render(<ChatMessages messages={[]} isLoading={true} selectedAgentId="skyller" />);

    // Deve mostrar "Respondendo..." (sem thinking/tools ativos)
    expect(screen.getByText(/Respondendo\.\.\./)).toBeInTheDocument();
  });

  it("deve usar cor azul no spinner quando está processando", () => {
    render(
      <ChatMessages
        messages={[]}
        isLoading={true}
        selectedAgentId="skyller"
        steps={[
          {
            stepName: "tool:search",
            status: "running",
            startedAt: Date.now(),
          },
        ]}
      />
    );

    // Deve ter spinner com cor azul
    const spinner = document.querySelector(".text-blue-500");
    expect(spinner).toBeInTheDocument();
  });

  it("deve usar cor accent no spinner quando está respondendo", () => {
    render(<ChatMessages messages={[]} isLoading={true} selectedAgentId="skyller" />);

    // Deve ter spinner com cor accent
    const spinner = document.querySelector(".text-accent");
    expect(spinner).toBeInTheDocument();
  });
});
