import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockChatMessages = vi.fn();
const mockChatInput = vi.fn();

// Mock the chat context to avoid provider requirement
vi.mock("@/lib/contexts/chat-context", () => ({
  useChat: () => ({
    messages: [],
    addMessage: vi.fn(),
    setMessages: vi.fn(),
    rateLimit: {
      isLimited: false,
      formattedTime: "",
      remaining: 30,
      limit: 30,
      resetAt: null,
    },
    runAgent: vi.fn(),
    isRunning: false,
    selectedAgentId: "skyller",
    setSelectedAgentId: vi.fn(),
    thinking: undefined,
    steps: [],
    toolCalls: [],
    activities: [],
  }),
}));

// Mock panel context
vi.mock("@/components/chat/chat-messages", () => ({
  ChatMessages: (props: unknown) => {
    mockChatMessages(props);
    return null;
  },
}));

vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: (props: unknown) => {
    mockChatInput(props);
    return null;
  },
}));

import ChatPage from "@/app/(dashboard)/page";

describe("ChatPage - rate limit configuration", () => {
  it("passa rateLimit do contexto para ChatInput", () => {
    render(<ChatPage />);
    expect(mockChatInput).toHaveBeenCalled();
    const props = mockChatInput.mock.calls[0][0] as { rateLimit?: { limit?: number } };
    expect(props.rateLimit?.limit).toBe(30);
  });
});
