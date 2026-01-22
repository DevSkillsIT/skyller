/**
 * Testes para useRateLimit hook
 * @spec SPEC-COPILOT-INTEGRATION-001
 * AC-012: Rate limiting com countdown UI
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";

describe("useRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Estado Inicial", () => {
    it("deve inicializar com valores padrao", () => {
      const { result } = renderHook(() => useRateLimit());

      expect(result.current.limit).toBe(30);
      expect(result.current.remaining).toBe(30);
      expect(result.current.resetSeconds).toBe(0);
      expect(result.current.isLimited).toBe(false);
    });

    it("deve aceitar limite customizado", () => {
      const { result } = renderHook(() => useRateLimit({ defaultLimit: 50 }));

      expect(result.current.limit).toBe(50);
      expect(result.current.remaining).toBe(50);
    });
  });

  describe("updateFromHeaders", () => {
    it("deve atualizar estado a partir de headers de resposta", () => {
      const { result } = renderHook(() => useRateLimit());

      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "25",
        "X-RateLimit-Reset": "0",
      });

      act(() => {
        result.current.updateFromHeaders(headers);
      });

      expect(result.current.limit).toBe(30);
      expect(result.current.remaining).toBe(25);
      expect(result.current.isLimited).toBe(false);
    });

    it("deve detectar rate limit excedido (remaining = 0)", () => {
      const onLimitExceeded = vi.fn();
      const { result } = renderHook(() => useRateLimit({ onLimitExceeded }));

      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "Retry-After": "45",
      });

      act(() => {
        result.current.updateFromHeaders(headers);
      });

      expect(result.current.isLimited).toBe(true);
      expect(result.current.resetSeconds).toBe(45);
      expect(onLimitExceeded).toHaveBeenCalledWith(45);
    });

    it("deve usar Retry-After header quando disponivel", () => {
      const { result } = renderHook(() => useRateLimit());

      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "Retry-After": "60",
      });

      act(() => {
        result.current.updateFromHeaders(headers);
      });

      expect(result.current.resetSeconds).toBe(60);
    });
  });

  describe("Countdown automatico", () => {
    it("deve decrementar resetSeconds a cada segundo", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          isLimited: true,
          resetSeconds: 5,
          remaining: 0,
        });
      });

      expect(result.current.resetSeconds).toBe(5);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.resetSeconds).toBe(4);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.resetSeconds).toBe(2);
    });

    it("deve chamar onLimitRestored quando countdown termina", () => {
      const onLimitRestored = vi.fn();
      const { result } = renderHook(() => useRateLimit({ onLimitRestored }));

      act(() => {
        result.current.updateRateLimit({
          isLimited: true,
          resetSeconds: 2,
          remaining: 0,
        });
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isLimited).toBe(false);
      expect(onLimitRestored).toHaveBeenCalled();
    });
  });

  describe("formattedTime", () => {
    it("deve formatar tempo corretamente (segundos)", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({ resetSeconds: 45 });
      });

      expect(result.current.formattedTime).toBe("0:45");
    });

    it("deve formatar tempo corretamente (minutos e segundos)", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({ resetSeconds: 125 });
      });

      expect(result.current.formattedTime).toBe("2:05");
    });
  });

  describe("reset", () => {
    it("deve resetar estado para valores iniciais", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          isLimited: true,
          resetSeconds: 30,
          remaining: 0,
        });
      });

      expect(result.current.isLimited).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLimited).toBe(false);
      expect(result.current.remaining).toBe(30);
      expect(result.current.resetSeconds).toBe(0);
    });
  });
});
