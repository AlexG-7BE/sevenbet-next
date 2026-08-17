import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("desktop and mobile final handoff expose B4GAMBLE without wordmark overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const desktopBrand = page.getByRole("link", { name: "B4GAMBLE", exact: true }).first();
  await expect(desktopBrand).toHaveText("B4GAMBLE");
  await expect(page.locator('[data-handoff-page="home"]')).toContainText("Keep gambling your decision, not a habit");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play.",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/methodology`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "B4GAMBLE", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Casinos", exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Programme, protected Help, legal and unavailable states expose the current brand", async ({ page }) => {
  await page.goto(`${baseUrl}/program`, { waitUntil: "networkidle" });
  await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toBeVisible();
  await expect(page.locator("body")).toContainText("B4GAMBLE");
  await expect(page.locator("body")).not.toContainText(/SevenBet|SEVENBET/);

  await page.goto(`${baseUrl}/help`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("We're here");
  await expect(page.getByRole("link", { name: "Back to site" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/SevenBet|SEVENBET/);

  for (const route of ["/privacy", "/terms"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/7BE Inc\., trading as B4GAMBLE/).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/SevenBet|SEVENBET/);
    if (route === "/terms") {
      await expect(page.locator('[data-legal-document="terms"]')).toContainText("Effective 7 August 2026");
      await expect(page.locator('[data-legal-document="terms"]')).toContainText("Legal · Updated 9 August 2026");
    }
  }

  await page.goto(`${baseUrl}/outbound/unavailable`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Return to B4GAMBLE" })).toBeVisible();
});

test("Terms exposes only the B4GAMBLE section identity in the compact handoff document", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/terms`, { waitUntil: "networkidle" });

  await expect(page.locator('[id="about-b4gamble"]')).toHaveCount(1);
  await expect(page.locator('a[href="#about-sevenbet"]')).toHaveCount(0);
  await expect(page.locator('section[id="about-sevenbet"]')).toHaveCount(0);
  await expect(page.locator('[data-legal-document="terms"]')).toContainText("Section 05");
  await expect(page.getByText(/^Section 0[1-5]$/)).toHaveCount(5);
});

test("representative current public HTML contains no legacy active consumer brand", async ({ request }) => {
  for (const route of [
    "/",
    "/10-steps",
    "/program",
    "/self-check",
    "/responsible-gambling",
    "/help",
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
