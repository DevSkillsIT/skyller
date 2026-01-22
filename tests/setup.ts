/**
 * Vitest Setup File
 * Configuracao global para testes do Skyller
 *
 * @spec SPEC-COPILOT-INTEGRATION-001
 */
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock para fetch global (necessario para testes de API)
global.fetch = vi.fn();

// Mock para ResizeObserver (necessario para componentes UI)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para matchMedia (necessario para temas e responsividade)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Limpar mocks apos cada teste
afterEach(() => {
  vi.clearAllMocks();
});
