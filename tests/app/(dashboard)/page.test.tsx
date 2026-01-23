import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

// Mock the hook module
const mockUseRateLimit = vi.fn(() => ({
  isLimited: false,
  formattedTime: "",
  remaining: 30,
  limit: 30,
}));

vi.mock("@/lib/hooks/use-rate-limit", () => ({
  useRateLimit: (...args: any[]) => mockUseRateLimit(...args),
}));

// Mock the chat context to avoid provider requirement
vi.mock("@/lib/contexts/chat-context", () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    isLoading: false,
    isThinking: false,
    regenerateLastResponse: vi.fn(),
    retryMessage: vi.fn(),
  }),
}));

// Mock panel context
vi.mock("@/lib/contexts/panel-context", () => ({
  usePanel: () => ({
    openPanel: vi.fn(),
  }),
}));

import ChatPage from "@/app/(dashboard)/page";

describe("ChatPage - rate limit configuration", () => {
  it("calls useRateLimit with defaultLimit 30", () => {
    render(<ChatPage />);
    // Expect the hook to have been called with an options object containing defaultLimit:30
    expect(mockUseRateLimit).toHaveBeenCalled();
    const callArgs = mockUseRateLimit.mock.calls[0][0] || {};
    expect(callArgs.defaultLimit).toBe(30);
  });
});
