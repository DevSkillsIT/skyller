/**
 * Testes Unitários - Hook useRateLimit
 *
 * Validação da implementação GAP-CRIT-06:
 * - Extração de headers X-RateLimit-* do backend (AC-012/RU-005)
 * - Sincronização com limite de 30 RPM do backend
 * - Countdown automático até reset
 * - Desabilitação de envio quando remaining = 0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";

describe("useRateLimit - GAP-CRIT-06 (AC-012/RU-005)", () => {
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    originalFetch = window.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("deve inicializar com valores padrão conforme SPEC (30 RPM)", () => {
    const { result } = renderHook(() => useRateLimit());

    expect(result.current.isLimited).toBe(false);
    expect(result.current.remaining).toBe(30);
    expect(result.current.limit).toBe(30);
    expect(result.current.resetAt).toBeNull();
    expect(result.current.formattedTime).toBe("");
  });

  it("deve interceptar fetch e extrair headers X-RateLimit-* em resposta 200", async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "25",
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    // Fazer uma requisição para disparar interceptação
    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.remaining).toBe(25);
      expect(result.current.limit).toBe(30);
    });
  });

  it("deve detectar resposta 429 e ativar rate limiting", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 60; // Reset em 60 segundos

    const mockResponse = new Response(
      JSON.stringify({ error: "Too Many Requests" }),
      {
        status: 429,
        headers: new Headers({
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetTimestamp),
          "Retry-After": "60",
        }),
      }
    );

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    // Disparar fetch que retorna 429
    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
      expect(result.current.remaining).toBe(0);
      expect(result.current.limit).toBe(30);
      expect(result.current.resetAt).not.toBeNull();
      expect(result.current.formattedTime).toMatch(/\d+s/);
    });
  });

  it("deve formatar tempo restante corretamente (segundos)", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 45; // Reset em 45 segundos

    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTimestamp),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.formattedTime).toMatch(/\d+s/);
    });
  });

  it("deve formatar tempo restante corretamente (minutos e segundos)", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 90; // Reset em 1m 30s

    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTimestamp),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.formattedTime).toMatch(/1m \d+s/);
    });
  });

  it("deve decrementar countdown a cada segundo", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 5; // Reset em 5 segundos

    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTimestamp),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
    });

    // Avançar 1 segundo
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(result.current.formattedTime).toMatch(/[0-4]s/);
    });
  });

  it("deve resetar isLimited quando countdown chegar a zero", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 2; // Reset em 2 segundos

    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTimestamp),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
    });

    // Avançar 3 segundos (passando do reset)
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(result.current.isLimited).toBe(false);
      expect(result.current.remaining).toBe(30);
      expect(result.current.resetAt).toBeNull();
      expect(result.current.formattedTime).toBe("");
    });
  });

  it("deve usar Retry-After quando X-RateLimit-Reset não estiver disponível", async () => {
    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "Retry-After": "60", // Usar Retry-After como fallback
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
      expect(result.current.resetAt).not.toBeNull();
      expect(result.current.formattedTime).toMatch(/\d+s/);
    });
  });

  it("deve usar valores padrão quando headers não estiverem disponíveis", async () => {
    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers(), // Sem headers
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
      expect(result.current.limit).toBe(30); // Valor padrão
      expect(result.current.remaining).toBe(0);
      expect(result.current.resetAt).not.toBeNull(); // Calculado com Retry-After padrão
    });
  });

  it("deve limpar intervalo quando componente for desmontado", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 60;

    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTimestamp),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result, unmount } = renderHook(() => useRateLimit());

    await fetch("/api/test");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
    });

    // Desmonta o componente
    unmount();

    // Avançar tempo - não deve causar erro
    expect(() => {
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  it("deve restaurar fetch original ao desmontar", () => {
    const { unmount } = renderHook(() => useRateLimit());

    const fetchAfterMount = window.fetch;

    unmount();

    expect(window.fetch).toBe(originalFetch);
  });

  it("deve lidar com múltiplas respostas 429 sem duplicar intervalos", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 60;

    const mockResponse = new Response(null, {
      status: 429,
      headers: new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTimestamp),
      }),
    });

    window.fetch = vi.fn(async () => mockResponse);

    const { result } = renderHook(() => useRateLimit());

    // Primeira 429
    await fetch("/api/test1");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
    });

    // Segunda 429 (deve limpar intervalo anterior)
    await fetch("/api/test2");

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true);
    });

    // Avançar tempo - deve funcionar normalmente
    vi.advanceTimersByTime(1000);

    // Não deve causar problemas
    expect(result.current.isLimited).toBe(true);
  });
});
