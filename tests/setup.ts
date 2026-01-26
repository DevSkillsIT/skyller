import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));
