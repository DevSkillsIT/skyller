/**
 * Testes E2E - CORS e Rate Limiting
 * @spec SPEC-COPILOT-INTEGRATION-001
 *
 * AC-012: Rate Limiting - 30 RPM, 429 + retry_after
 * AC-029: CORS - Access-Control-Allow-Origin para *.skyller.ai
 */
import { expect, test } from "@playwright/test";

test.describe("API Copilot CORS", () => {
  test("AC-029: deve permitir CORS para skyller.ai", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://skyller.ai",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("https://skyller.ai");
    expect(response.headers()["access-control-allow-methods"]).toContain("POST");
  });

  test("AC-029: deve permitir CORS para subdominios de skyller.ai", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://tenant1.skyller.ai",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("https://tenant1.skyller.ai");
  });

  test("AC-029: deve permitir localhost para desenvolvimento", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  test("AC-029: deve rejeitar origem nao permitida", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://malicious-site.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("AC-029: deve expor headers de rate limiting", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://skyller.ai",
        "Access-Control-Request-Method": "POST",
      },
    });

    const exposeHeaders = response.headers()["access-control-expose-headers"];
    expect(exposeHeaders).toContain("X-RateLimit-Limit");
    expect(exposeHeaders).toContain("X-RateLimit-Remaining");
    expect(exposeHeaders).toContain("X-RateLimit-Reset");
    expect(exposeHeaders).toContain("Retry-After");
  });
});

test.describe("API Copilot Rate Limiting", () => {
  /**
   * AC-012: Teste E2E para validar rate limiting
   * Envia 31 mensagens e verifica que a 31a retorna 429 + retry_after
   *
   * NOTA: Este teste requer backend com rate limiting habilitado
   * Em ambiente de CI, pode ser necessario mockar o backend
   */
  test.skip("AC-012: deve retornar 429 com Retry-After apos exceder limite", async ({
    request,
  }) => {
    // Este teste esta marcado como skip porque requer:
    // 1. Backend real rodando com rate limiting
    // 2. Redis configurado
    // 3. Tempo para executar 31 requests
    //
    // Para executar em CI, configure:
    // - Mock do backend com rate limiting simulado
    // - Ou teste de integracao separado

    const responses: number[] = [];

    // Envia 31 mensagens
    for (let i = 0; i < 31; i++) {
      const response = await request.post("/api/copilot", {
        headers: {
          Origin: "https://skyller.ai",
          "Content-Type": "application/json",
        },
        data: {
          message: `Test message ${i + 1}`,
        },
      });

      responses.push(response.status());

      // Se recebeu 429, verifica headers
      if (response.status() === 429) {
        expect(response.headers()["retry-after"]).toBeDefined();
        expect(parseInt(response.headers()["retry-after"])).toBeGreaterThan(0);
        break;
      }
    }

    // Verifica que pelo menos uma resposta foi 429
    expect(responses).toContain(429);
  });

  test("AC-012: endpoint deve incluir headers de rate limit na resposta", async ({ request }) => {
    // Teste simplificado que verifica se os headers CORS expoe os headers de rate limit
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://skyller.ai",
      },
    });

    // Verifica que os headers de rate limit estao expostos
    const exposeHeaders = response.headers()["access-control-expose-headers"] || "";
    expect(exposeHeaders).toContain("X-RateLimit-Limit");
    expect(exposeHeaders).toContain("Retry-After");
  });
});

test.describe("API Copilot Headers", () => {
  test("POST deve incluir headers CORS na resposta", async ({ request }) => {
    // Nota: Este teste pode falhar se o backend nao estiver disponivel
    // O teste verifica apenas os headers CORS, nao o conteudo da resposta

    try {
      const response = await request.post("/api/copilot", {
        headers: {
          Origin: "https://app.skyller.ai",
          "Content-Type": "application/json",
        },
        data: {},
        timeout: 5000,
      });

      // Se a resposta for bem sucedida ou erro controlado, verifica CORS
      if (response.status() !== 502 && response.status() !== 503) {
        expect(response.headers()["access-control-allow-origin"]).toBe("https://app.skyller.ai");
      }
    } catch {
      // Backend nao disponivel - teste passa com skip implicito
      test.skip();
    }
  });

  test("OPTIONS deve retornar metodos permitidos", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://skyller.ai",
      },
    });

    expect(response.headers()["access-control-allow-methods"]).toContain("POST");
    expect(response.headers()["access-control-allow-methods"]).toContain("OPTIONS");
  });

  test("OPTIONS deve permitir headers necessarios", async ({ request }) => {
    const response = await request.fetch("/api/copilot", {
      method: "OPTIONS",
      headers: {
        Origin: "https://skyller.ai",
      },
    });

    const allowHeaders = response.headers()["access-control-allow-headers"] || "";
    expect(allowHeaders).toContain("Content-Type");
    expect(allowHeaders).toContain("Authorization");
    expect(allowHeaders).toContain("X-Tenant-ID");
  });
});
