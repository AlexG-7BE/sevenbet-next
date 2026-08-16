import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

const formerResponsibleGamblingRoutes = {
  budgeting: "/learn/responsible-gambling/responsible-gambling-tools",
  "time-management": "/learn/responsible-gambling/responsible-gambling-tools",
  "bonus-terms": "/learn/casino-bonuses/welcome-bonus-terms",
  "self-exclusion": "/help/self-exclusion",
  "deposit-limits": "/help/deposit-limits",
  "cooling-off": "/help/cooling-off",
  "reality-checks": "/help/reality-checks",
  "casino-licenses": "/learn/licensing/casino-licenses-explained",
  "payment-safety": "/learn/payments/casino-payment-methods",
  faq: "/learn/responsible-gambling",
} as const;

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("final public Responsible Gambling hub and Protected Help remain separate", async ({ page, request }) => {
  const hubResponse = await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "networkidle" });
  expect(hubResponse?.status()).toBe(200);
  await expect(page.locator("[data-responsible-gambling-hub]")).toHaveCount(1);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("[data-protected-help-shell]")).toHaveCount(0);
  for (const name of ["Read the guides", "Start Programme", "Open Help"]) {
    await expect(page.getByRole("link", { name: new RegExp(name, "i") }).first()).toBeVisible();
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://b4gamble.com/responsible-gambling");
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Help" })).toHaveCount(0);
  await expect(page.locator('footer[data-public-shell] a[href="/responsible-gambling"]')).toHaveCount(1);
  await expect(page.locator('footer[data-public-shell] a[href="/self-check"]')).toHaveCount(0);
  await expect(page.locator('footer[data-public-shell] a[href="/tools/budget-calculator"]')).toHaveCount(0);
  await expect(page.locator('footer[data-public-shell] a[href="/help"]')).toHaveCount(2);

  const helpResponse = await page.goto(`${baseUrl}/help`, { waitUntil: "networkidle" });
  expect(helpResponse?.status()).toBe(200);
  await expect(page.locator("[data-protected-help-shell]")).toHaveCount(1);
  await expect(page.locator("[data-public-shell]")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://b4gamble.com/help");
  await expect(page.getByText(/Casino, bonus and affiliate prompts do not appear in this area/)).toBeVisible();

  for (const [slug, destination] of Object.entries(formerResponsibleGamblingRoutes)) {
    const legacy = await request.get(`${baseUrl}/responsible-gambling/${slug}`, { maxRedirects: 0 });
    expect(legacy.status(), slug).toBe(308);
    expect(legacy.headers().location, slug).toBe(destination);
    const resolved = await request.get(`${baseUrl}${destination}`);
    expect(resolved.status(), destination).toBe(200);
  }
  for (const slug of ["self-exclusion", "deposit-limits", "cooling-off", "reality-checks", "unknown-help-child"]) {
    const child = await request.get(`${baseUrl}/help/${slug}`, { maxRedirects: 0 });
    expect(child.status(), slug).toBe(308);
    expect(child.headers().location, slug).toBe(slug === "unknown-help-child" ? "/help" : `/help#${slug}`);
  }
});

test("retired destinations are redirects and absent from canonical discovery", async ({ request }) => {
  const redirects = [
    ["/self-check", "/responsible-gambling"],
    ["/tools/budget-calculator", "/responsible-gambling"],
    ["/compare", "/casinos"],
  ] as const;
  for (const [route, destination] of redirects) {
    const response = await request.get(`${baseUrl}${route}`, { maxRedirects: 0 });
    expect(response.status(), route).toBe(308);
    expect(response.headers().location, route).toBe(destination);
  }
  const sitemap = await (await request.get(`${baseUrl}/sitemap.xml`)).text();
  const llms = await (await request.get(`${baseUrl}/llms.txt`)).text();
  for (const [route] of redirects) {
    expect(sitemap).not.toContain(`https://b4gamble.com${route}`);
    expect(llms).not.toContain(route);
  }
  expect(sitemap).toContain("https://b4gamble.com/bonus-guide");
});

test("SEO identities remain distinct and public article API matches Learn pages", async ({ page, request }) => {
  const identities = [
    ["/responsible-gambling", "/responsible-gambling", /Responsible Gambling: Education, Tools & Support/],
    ["/help", "/help", /Gambling Help & Support/],
    ["/learn/responsible-gambling", "/learn?category=responsible-gambling", /Learn/],
  ] as const;
  for (const [route, destination, title] of identities) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(`${baseUrl}${destination}`);
    await expect(page).toHaveTitle(title);
  }

  const response = await request.get(`${baseUrl}/api/public/articles?limit=100`);
  expect(response.status()).toBe(200);
  const body = await response.json() as { count: number; records: Array<{ status: string; categorySlug: string; slug: string }> };
  expect(body.count).toBeGreaterThan(0);
  expect(body.records.every((record) => record.status === "PUBLISHED")).toBe(true);
  for (const article of body.records) {
    const articleResponse = await request.get(`${baseUrl}/learn/${article.categorySlug}/${article.slug}`);
    expect(articleResponse.status(), article.slug).toBe(200);
  }
});

test("enforced CSP uses matching nonces and representative routes have no violations", async ({ page }) => {
  for (const route of ["/responsible-gambling", "/help", "/learn", "/login", "/program", "/admin/login", "/definitely-missing"]) {
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
    const unexpected = route === "/definitely-missing" ? errors.filter((message) => !message.includes("status of 404")) : errors;
    expect(unexpected.filter((message) => /content security policy|refused to|violat/iu.test(message))).toEqual([]);
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

test("no-JS safety paths stay useful and direct Pexels requests stay absent", async ({ browser }) => {
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
