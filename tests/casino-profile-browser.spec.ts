import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("demo profile renders one disclosed SSR review without governed actions", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino" })).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { exact: true, name: "Demo Northstar Casino" })).toBeVisible();
  expect(await page.locator("h1").count()).toBe(1);
  const profile = page.locator('[data-runtime-renderer="casino-review"]');
  expect(await profile.locator('a[href^="http"]').count()).toBe(0);
  expect(await profile.locator('a[href^="/r/"]').count()).toBe(0);
  const visibleCopy = await page.locator("body").innerText();
  for (const falsePublicationClaim of [
    "Published review",
    "Published bonus",
    "Published detail",
    "Published source",
    "Published control tools",
    "Published evidence",
    "Published facts",
  ]) expect(visibleCopy).not.toContain(falsePublicationClaim);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(errors).toEqual([]);
});

test("casino profile has no horizontal overflow across approved and defensive widths", async ({ browser }) => {
  for (const width of [1440, 1280, 900, 768, 430, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 }, isMobile: width <= 430 });
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
  await expect(page.getByRole("heading", { level: 1, name: "Demo Meadow Casino" })).toBeVisible();
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: /Help — protected support/ })).toBeVisible();
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
  const hero = page.getByRole("region", { exact: true, name: "Demo Northstar Casino" });
  await expect(hero.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(hero.getByText("Offer unavailable")).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await page.close();
});

test("every rendered Best Offers demo detail action resolves to a disclosed review-only page", async ({ page }) => {
  const shortlist = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(shortlist?.status()).toBe(200);
  const hrefs = [...new Set(await page.locator('a[href^="/casino/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href))))];
  expect(hrefs.length).toBeGreaterThanOrEqual(3);
  expect(hrefs.every((href) => /^\/casino\/demo-/.test(href))).toBe(true);
  const shortlistCopy = await page.locator("body").textContent() ?? "";
  for (const falsePublicationClaim of [
    "Published ranking method",
    "Only active, current records explicitly available",
    "important conditions must all be published",
    "exact published signal behind the result",
    "Withdrawal timing is a published signal",
    "The operator’s current terms control the final decision",
    "strongest balance under the published method",
    "Published terms are a comparison snapshot",
    "latest published, non-archived snapshots",
    "The evidence behind the headline",
    "It is a set of facts a user can compare",
    "Read the evidence",
  ]) expect(shortlistCopy).not.toContain(falsePublicationClaim);

  for (const href of hrefs) {
    const response = await page.goto(`${baseUrl}${href}`, { waitUntil: "networkidle" });
    expect(response?.status(), href).toBe(200);
    await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
    expect(await page.locator('[data-runtime-renderer="casino-review"] a[href^="http"], [data-runtime-renderer="casino-review"] a[href^="/r/"]').count()).toBe(0);
  }
});

test("server HTML remains useful with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino" })).toBeVisible();
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
