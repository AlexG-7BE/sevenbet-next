import { expect, test } from "@playwright/test";

test("feature-off preserves the canonical Programme presentation and exposes no legacy UI", async ({ page }) => {
  await page.goto("/program");

  await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toBeVisible();
  await expect(page.locator('[data-runtime-renderer="programme"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toHaveCount(0);
  await expect(page.locator('[data-handoff-page]')).toHaveCount(0);
});
