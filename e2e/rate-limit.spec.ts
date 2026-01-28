/**
 * Teste E2E - Rate Limiting
 *
 * Validação da implementação GAP-CRIT-06:
 * - Backend retorna 429 após 30 requisições por minuto (AC-012/RU-005)
 * - UI exibe banner de rate limiting com countdown
 * - Botão de envio fica desabilitado quando limitado
 * - Banner desaparece após reset do rate limit
 */

import { expect, test } from "@playwright/test";

test.describe("Rate Limiting - GAP-CRIT-06 (AC-012/RU-005)", () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página principal
    await page.goto("/");

    // Aguardar página carregar completamente
    await page.waitForLoadState("networkidle");
  });

  test("deve respeitar rate limit de 30 RPM e exibir banner de bloqueio", async ({ page }) => {
    // Enviar 31 mensagens rapidamente para exceder o limite de 30 RPM
    for (let i = 1; i <= 31; i++) {
      const input = page.locator('[data-testid="chat-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');

      // Preencher input
      await input.fill(`Mensagem de teste ${i}`);

      // Clicar no botão de enviar
      await sendButton.click();

      // Aguardar um pouco entre mensagens (simular interação real)
      await page.waitForTimeout(100);
    }

    // Verificar que o banner de rate limiting aparece
    const rateLimitBanner = page.locator('[data-testid="rate-limit-banner"]');
    await expect(rateLimitBanner).toBeVisible({ timeout: 10000 });

    // Verificar que o banner contém mensagem de limite atingido
    await expect(rateLimitBanner).toContainText("Limite de requisições atingido");

    // Verificar que o banner contém o limite de 30 requisições
    await expect(rateLimitBanner).toContainText("30 requisições por minuto");

    // Verificar que o countdown está presente (formato: "Xs" ou "Xm Ys")
    await expect(rateLimitBanner).toContainText(/\d+[ms]/);
  });

  test("deve desabilitar botão de envio quando rate limit atingido", async ({ page }) => {
    // Configurar interceptação de requisições para simular 429 imediatamente
    await page.route("**/api/copilot/**", (route) => {
      route.fulfill({
        status: 429,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
          "Retry-After": "60",
        },
        body: JSON.stringify({ error: "Too Many Requests" }),
      });
    });

    // Tentar enviar uma mensagem
    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill("Mensagem de teste");
    await sendButton.click();

    // Aguardar banner aparecer
    const rateLimitBanner = page.locator('[data-testid="rate-limit-banner"]');
    await expect(rateLimitBanner).toBeVisible({ timeout: 5000 });

    // Verificar que o botão de envio está desabilitado
    await expect(sendButton).toBeDisabled();
  });

  test("deve exibir countdown que decrementa a cada segundo", async ({ page }) => {
    // Configurar interceptação para retornar 429 com reset em 10 segundos
    await page.route("**/api/copilot/**", (route) => {
      route.fulfill({
        status: 429,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 10),
          "Retry-After": "10",
        },
        body: JSON.stringify({ error: "Too Many Requests" }),
      });
    });

    // Enviar mensagem para disparar rate limit
    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill("Teste countdown");
    await sendButton.click();

    // Aguardar banner aparecer
    const rateLimitBanner = page.locator('[data-testid="rate-limit-banner"]');
    await expect(rateLimitBanner).toBeVisible({ timeout: 5000 });

    // Capturar valor inicial do countdown
    const initialText = await rateLimitBanner.textContent();
    const initialMatch = initialText?.match(/(\d+)s/);
    const initialSeconds = initialMatch ? parseInt(initialMatch[1], 10) : 0;

    expect(initialSeconds).toBeGreaterThan(0);

    // Aguardar 2 segundos
    await page.waitForTimeout(2000);

    // Capturar novo valor do countdown
    const updatedText = await rateLimitBanner.textContent();
    const updatedMatch = updatedText?.match(/(\d+)s/);
    const updatedSeconds = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;

    // Verificar que countdown decrementou
    expect(updatedSeconds).toBeLessThan(initialSeconds);
  });

  test("deve remover banner e reabilitar envio após reset", async ({ page }) => {
    // Configurar interceptação para retornar 429 com reset curto (3 segundos)
    let requestCount = 0;
    await page.route("**/api/copilot/**", (route) => {
      requestCount++;

      if (requestCount === 1) {
        // Primeira requisição: retornar 429
        route.fulfill({
          status: 429,
          headers: {
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3),
            "Retry-After": "3",
          },
          body: JSON.stringify({ error: "Too Many Requests" }),
        });
      } else {
        // Após reset: retornar 200
        route.fulfill({
          status: 200,
          headers: {
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "29",
            "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
          },
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Enviar primeira mensagem (dispara 429)
    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill("Teste reset");
    await sendButton.click();

    // Aguardar banner aparecer
    const rateLimitBanner = page.locator('[data-testid="rate-limit-banner"]');
    await expect(rateLimitBanner).toBeVisible({ timeout: 5000 });

    // Aguardar reset (3 segundos + margem)
    await page.waitForTimeout(4000);

    // Verificar que banner desapareceu
    await expect(rateLimitBanner).not.toBeVisible();

    // Verificar que botão está habilitado novamente
    await expect(sendButton).toBeEnabled();
  });

  test("deve exibir aviso quando remaining <= 5", async ({ page }) => {
    // Configurar interceptação para retornar 200 com remaining baixo
    await page.route("**/api/copilot/**", (route) => {
      route.fulfill({
        status: 200,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "3",
          "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
        },
        body: JSON.stringify({ success: true }),
      });
    });

    // Enviar mensagem
    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill("Teste aviso");
    await sendButton.click();

    // Aguardar indicador de aviso aparecer
    // Nota: O componente RateLimitIndicator usa Alert com className mb-4
    // mas sem data-testid específico para estado de aviso
    const warningAlert = page.locator(".border-yellow-500\\/50");

    await expect(warningAlert).toBeVisible({ timeout: 5000 });

    // Verificar que contém mensagem de poucas requisições
    await expect(warningAlert).toContainText("Poucas requisições disponíveis");

    // Verificar que mostra quantidade restante
    await expect(warningAlert).toContainText(/\d+ de 30 requisições/);
  });

  test("deve sincronizar remaining com headers do backend em requisições bem-sucedidas", async ({
    page,
  }) => {
    let requestNumber = 0;

    // Configurar interceptação para decrementar remaining a cada requisição
    await page.route("**/api/copilot/**", (route) => {
      requestNumber++;
      const remaining = Math.max(30 - requestNumber, 0);

      route.fulfill({
        status: 200,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
        },
        body: JSON.stringify({ success: true }),
      });
    });

    // Enviar 5 mensagens
    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    for (let i = 1; i <= 5; i++) {
      await input.fill(`Mensagem ${i}`);
      await sendButton.click();
      await page.waitForTimeout(200);
    }

    // Verificar que remaining foi atualizado (deve ser 25 após 5 requisições)
    // Como não temos um indicador visual sempre visível do remaining,
    // vamos enviar mais algumas mensagens até atingir o threshold de aviso (<=5)
    for (let i = 6; i <= 26; i++) {
      await input.fill(`Mensagem ${i}`);
      await sendButton.click();
      await page.waitForTimeout(100);
    }

    // Agora remaining deve ser <= 5, o aviso deve aparecer
    const warningAlert = page.locator(".border-yellow-500\\/50");
    await expect(warningAlert).toBeVisible({ timeout: 5000 });
  });
});
