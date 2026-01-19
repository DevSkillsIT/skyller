// tests/setup.ts
// Configuracao global para testes Vitest

import "@testing-library/jest-dom/vitest";

// Mock do next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock do next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
  }),
}));
