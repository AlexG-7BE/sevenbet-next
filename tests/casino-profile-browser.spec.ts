import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("demo profile renders one disclosed SSR review without governed actions", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino review" })).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  expect(await page.locator("h1").count()).toBe(1);
  expect(await page.locator('a[href^="http"]').count()).toBe(0);
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(errors).toEqual([]);
});

test("casino profile has no horizontal overflow across approved and defensive widths", async ({ browser }) => {
  for (const width of [1440, 1280, 900, 768, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 }, isMobile: width <= 390 });
    const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px`).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${width}px`).toBe(false);
    expect(await page.locator("h1").count(), `${width}px`).toBe(1);
    await page.close();
  }
});

test("commercially unavailable state keeps editorial review and removes visit actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-meadow`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Meadow Casino review" })).toBeVisible();
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  await expect(page.getByRole("link", { name: "Open protected Help" })).toBeVisible();
});

test("demo profile suppresses review, FAQ and commercial structured data", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-lantern`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")));
  expect(schemas.some((schema) => ["Review", "FAQPage", "Offer", "Product"].includes(schema["@type"]))).toBe(false);
});

test("outbound confirmation is absent while market authority denies referral", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  const hero = page.getByRole("complementary", { name: "Published bonus and visit action" });
  await expect(hero.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(hero.getByText("Offer unavailable")).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await page.close();
});

test("server HTML remains useful with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino review" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  await context.close();
});

test("unknown profiles fail closed and are noindex", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/not-a-published-profile`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "This review is not available." })).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content") ?? ""));
  expect(robots.length).toBeGreaterThan(0);
  expect(robots.every((value) => value.includes("noindex"))).toBe(true);
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});
