import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Skyller/i);
  });

  test("should display the chat interface", async ({ page }) => {
    await page.goto("/");
    // Verifica se o componente de chat existe
    const chatArea = page.locator('[class*="ScrollArea"]');
    await expect(chatArea).toBeVisible();
  });

  test("should have a message input", async ({ page }) => {
    await page.goto("/");
    const textarea = page.getByPlaceholder(/enter your message/i);
    await expect(textarea).toBeVisible();
  });
});
