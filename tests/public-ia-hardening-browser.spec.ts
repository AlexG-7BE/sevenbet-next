import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("public hub and Protected Help expose separate routes, shells and discovery", async ({ page, request }) => {
  const hubResponse = await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "networkidle" });
  expect(hubResponse?.status()).toBe(200);
  await expect(page.locator("[data-responsible-gambling-hub]")).toHaveCount(1);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("[data-protected-help-shell]")).toHaveCount(0);
  for (const name of ["Browse education", "Open Self-Check", "Open limit tracker", "Explore 10 Steps", "Open Help"]) {
    await expect(page.getByRole("link", { name: new RegExp(name, "i") }).first()).toBeVisible();
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://b4gamble.com/responsible-gambling");
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
  const supportFooter = page.locator("footer[data-public-shell]").getByRole("heading", { name: "Control & Support" }).locator("..");
  for (const href of ["/responsible-gambling", "/self-check", "/tools/budget-calculator", "/help"]) {
    await expect(supportFooter.locator(`a[href="${href}"]`)).toHaveCount(1);
  }

  const helpResponse = await page.goto(`${baseUrl}/help`, { waitUntil: "networkidle" });
  expect(helpResponse?.status()).toBe(200);
  await expect(page.locator("[data-protected-help-shell]")).toHaveCount(1);
  await expect(page.locator("[data-public-shell]")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://b4gamble.com/help");
  await expect(page.getByText("No casino · No bonus · No affiliate")).toBeVisible();

  const legacy = await request.get(`${baseUrl}/responsible-gambling/cooling-off`, { maxRedirects: 0 });
  expect(legacy.status()).toBe(308);
  expect(legacy.headers().location).toBe("/help/cooling-off");
});

test("SEO identities remain distinct and public article API matches Learn pages", async ({ page, request }) => {
  const identities = [
    ["/responsible-gambling", "https://b4gamble.com/responsible-gambling", /Responsible Gambling: Education, Tools & Support/],
    ["/help", "https://b4gamble.com/help", /Gambling Help & Support/],
    ["/learn/responsible-gambling", "https://b4gamble.com/learn/responsible-gambling", /Responsible Gambling Education/],
    ["/self-check", "https://b4gamble.com/self-check", /Private Gambling Self-Check/],
    ["/tools/budget-calculator", "https://b4gamble.com/tools/budget-calculator", /Personal Gambling Limit Tracker/],
  ] as const;
  for (const [route, canonical, title] of identities) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  }

  const response = await request.get(`${baseUrl}/api/public/articles?limit=100`);
  expect(response.status()).toBe(200);
  const body = await response.json() as { count: number; records: Array<{ status: string; categorySlug: string; slug: string }> };
  expect(body.count).toBe(13);
  expect(body.records.every((record) => record.status === "PUBLISHED")).toBe(true);
  for (const article of body.records) {
    const articleResponse = await request.get(`${baseUrl}/learn/${article.categorySlug}/${article.slug}`);
    expect(articleResponse.status(), article.slug).toBe(200);
  }
});

test("enforced CSP uses matching nonces and representative routes have no violations", async ({ page }) => {
  for (const route of ["/responsible-gambling", "/help", "/login", "/program", "/admin/login", "/definitely-missing"]) {
    const errors = collectBrowserErrors(page);
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    expect([200, 404]).toContain(response?.status());
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toMatch(/script-src [^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/script-src [^;]*'unsafe-eval'/);
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    const scriptNonces = await page.locator("script").evaluateAll((scripts) => scripts.map((script) => (script as HTMLScriptElement).nonce));
    expect(scriptNonces.length).toBeGreaterThan(0);
    expect(scriptNonces.every((value) => value === nonce)).toBe(true);
    expect(errors.filter((message) => /content security policy|refused to|violat/iu.test(message))).toEqual([]);
  }
});

for (const width of [320, 360, 390, 430, 768, 1024, 1440, 1920]) {
  test(`hub and Help reflow at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const route of ["/responsible-gambling", "/help"]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), route).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await context.close();
  });
}

test("no-JS paths stay useful and direct Pexels requests stay absent", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: /Open Help/i }).first()).toHaveAttribute("href", "/help");
  await page.goto(`${baseUrl}/help`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: /Open GamCare/i })).toBeVisible();
  await context.close();

  const requests: string[] = [];
  const mediaPage = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  mediaPage.on("request", (request) => requests.push(request.url()));
  await mediaPage.goto(`${baseUrl}/10-steps`, { waitUntil: "networkidle" });
  await mediaPage.goto(`${baseUrl}/program`, { waitUntil: "networkidle" });
  expect(requests.some((url) => url.includes("images.pexels.com"))).toBe(false);
  await mediaPage.close();
});
