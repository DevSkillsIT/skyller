/**
 * Testes de Integração - MessageList Component (GAP-CRIT-03)
 *
 * Validação da exibição de eventos AG-UI na UI:
 * - Propagação de thinking/steps/tool calls/activities para a última mensagem
 * - Renderização básica da lista
 * - Acessibilidade/estrutura base
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList, EmptyMessageList, MessageListSkeleton } from "@/components/chat/message-list";
import type { Message } from "@/lib/mock/data";
import type { ActivityState, StepState, ThinkingState, ToolCallState } from "@/lib/types/agui";

const messageSpy = vi.fn();

// Mock do componente Message
vi.mock("@/components/chat/message", () => ({
  Message: (props: any) => {
    messageSpy(props);
    return (
      <div data-testid={`message-${props.message.id}`}>
        {props.message.content}
      </div>
    );
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

  it("deve renderizar lista de mensagens", () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
    expect(screen.getByTestId("message-msg-2")).toBeInTheDocument();
  });

  it("deve renderizar sem quebrar quando não há mensagens", () => {
    render(<MessageList messages={[]} />);

    expect(screen.queryByTestId(/message-/)).not.toBeInTheDocument();
  });

  it("deve aplicar className customizada", () => {
    const { container } = render(
      <MessageList messages={mockMessages} className="custom-class" />
    );

    const listDiv = container.firstChild as HTMLElement;
    expect(listDiv.className).toContain("custom-class");
  });

  it("deve repassar eventos AG-UI para a última mensagem", () => {
    const thinking: ThinkingState = {
      status: "active",
      title: "Analisando...",
      content: "Pensando",
      startedAt: Date.now(),
    };
    const steps: StepState[] = [
      { stepName: "processing", status: "running", startedAt: Date.now() },
    ];
    const toolCalls: ToolCallState[] = [
      {
        toolCallId: "tc-1",
        toolCallName: "search_docs",
        status: "running",
        args: "{}",
        startedAt: Date.now(),
      },
    ];
    const activities: ActivityState[] = [
      {
        messageId: "activity-1",
        activityType: "SEARCH",
        content: { query: "AG-UI" },
        updatedAt: Date.now(),
      },
    ];

    render(
      <MessageList
        messages={mockMessages}
        thinking={thinking}
        steps={steps}
        toolCalls={toolCalls}
        activities={activities}
      />
    );

    const lastCall = messageSpy.mock.calls.find((call) => call[0].message.id === "msg-2");
    expect(lastCall).toBeDefined();
    expect(lastCall?.[0].thinking).toEqual(thinking);
    expect(lastCall?.[0].steps).toEqual(steps);
    expect(lastCall?.[0].toolCalls).toEqual(toolCalls);
    expect(lastCall?.[0].activities).toEqual(activities);
  });

  it("não deve repassar eventos AG-UI para mensagens anteriores", () => {
    const thinking: ThinkingState = {
      status: "active",
      title: "Analisando...",
      content: "Pensando",
      startedAt: Date.now(),
    };

    render(<MessageList messages={mockMessages} thinking={thinking} />);

    const firstCall = messageSpy.mock.calls.find((call) => call[0].message.id === "msg-1");
    expect(firstCall?.[0].thinking).toBeUndefined();
  });
});

describe("EmptyMessageList Component", () => {
  it("deve renderizar estado vazio", () => {
    render(<EmptyMessageList />);
    expect(screen.getByText(/Nenhuma mensagem ainda/i)).toBeInTheDocument();
  });
});

describe("MessageListSkeleton Component", () => {
  it("deve renderizar skeletons", () => {
    const { container } = render(<MessageListSkeleton />);
    expect(container.querySelectorAll("[role='status']").length).toBeGreaterThan(0);
  });
});
