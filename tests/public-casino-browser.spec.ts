import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("desktop discovery renders accessible SSR controls without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Find a casino review/ })).toBeVisible();
  await expect(page.getByLabel("Search casinos")).toBeVisible();
  await expect(page.getByText("Availability", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/casino/);
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "/tmp/sevenbet-casinos-desktop.png", fullPage: true });
});

test("mobile filters and empty state fit the viewport", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/casinos?q=definitely-no-match`, { waitUntil: "networkidle" });
  await expect(page.getByText("No casinos match these filters")).toBeVisible();
  await expect(page.getByText("Filters", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: "/tmp/sevenbet-casinos-mobile.png", fullPage: true });
  await page.close();
});

test("legacy catalog permanently redirects and drops unsupported parameters", async ({ page }) => {
  const response = await page.request.get(`${baseUrl}/catalog?q=alpha&junk=unsafe`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/casinos?q=alpha");
});
