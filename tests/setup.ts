import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { vi } from "vitest";

// Mock ResizeObserver para use-stick-to-bottom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock MutationObserver
class MutationObserverMock {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
global.MutationObserver = MutationObserverMock;

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));
