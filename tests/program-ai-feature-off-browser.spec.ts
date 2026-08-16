import { expect, test } from "@playwright/test";

test("feature-off preserves the approved legacy Programme", async ({ page }) => {
  await page.goto("/program");

  await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toBeVisible();
  await expect(page.getByText("Three checks before you begin")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Start with what is happening now." })).toHaveCount(0);
  await expect(page.getByText("PROGRAMME-AI", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Compare casinos", exact: true })).toHaveAttribute("href", "/casinos");
});
