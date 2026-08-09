import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("desktop and mobile Public Shell expose B4GAMBLE without wordmark overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const desktopBrand = page.getByRole("link", { name: "B4GAMBLE home" });
  await expect(desktopBrand).toHaveText("B4GAMBLE");
  await expect(page.locator("footer[data-public-shell]")).toContainText("B4GAMBLE");
  await expect(page.locator("footer[data-public-shell]")).toContainText("Know your limits before you play.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/methodology`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog.getByRole("link", { name: "B4GAMBLE" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Programme, protected Help, legal and unavailable states expose the current brand", async ({ page }) => {
  await page.goto(`${baseUrl}/program`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "B4GAMBLE" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/SevenBet|SEVENBET/);

  await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "B4GAMBLE Help home" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/SevenBet|SEVENBET/);

  for (const route of ["/privacy", "/terms"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/7BE Inc\., trading as B4GAMBLE/).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/SevenBet|SEVENBET/);
  }

  await page.goto(`${baseUrl}/outbound/unavailable`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Return to B4GAMBLE" })).toBeVisible();
});

test("representative current public HTML contains no legacy active consumer brand", async ({ request }) => {
  for (const route of [
    "/",
    "/10-steps",
    "/program",
    "/self-check",
    "/responsible-gambling",
    "/tools/budget-calculator",
    "/methodology",
    "/affiliate-disclosure",
    "/privacy",
    "/terms",
    "/about",
    "/faq",
    "/learn",
    "/outbound/unavailable",
  ]) {
    const response = await request.get(`${baseUrl}${route}`);
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    expect(html, route).toContain("B4GAMBLE");
    expect(html, route).not.toMatch(/SevenBet|SEVENBET/);
  }
});
