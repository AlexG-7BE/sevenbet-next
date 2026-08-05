import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("signed-out desktop public shell has one semantic chrome and approved destinations", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Casinos", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toHaveAttribute("href", "/program?auth=sign-in");
  await expect(page.getByRole("link", { name: "Open Help", exact: true })).toHaveAttribute("href", "/responsible-gambling");
  await expect(page.getByText(/Some outbound links may compensate SevenBet/i)).toBeVisible();
});

test("mobile menu is modal, Escape-closeable and restores focus", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.focus();
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site navigation" })).not.toBeVisible();
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.close();
});

test("Programme and protected Help never receive the commercial public shell", async ({ page }) => {
  for (const route of ["/program", "/responsible-gambling", "/responsible-gambling/cooling-off"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-public-shell]")).toHaveCount(0);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 800 },
]) {
  test(`public shell fits ${viewport.width}px without horizontal overflow`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.close();
  });
}

test("public shell remains usable at 200% zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
});
