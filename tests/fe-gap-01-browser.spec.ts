import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

for (const legal of [
  { path: "/privacy", title: /Privacy.*by default\./i, contact: "privacy@7be.io", sections: 5 },
  { path: "/terms", title: /Terms.*of use\./i, contact: "info@7be.io", sections: 5 },
] as const) {
  test(`${legal.path} renders the approved substantive legal document`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(`${baseUrl}${legal.path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
    await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(legal.title);
    await expect(page.locator(`[data-legal-document] main > section`)).toHaveCount(legal.sections);
    await expect(page.getByRole("link", { name: legal.contact, exact: true }).first()).toHaveAttribute("href", `mailto:${legal.contact}`);
    await expect(page.getByText(/7BE Inc\., trading as B4GAMBLE/).first()).toBeVisible();
    await expect(page.getByText(/447 Broadway, 2nd Floor, 1663/).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${legal.path}$`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*follow/i);
    await expect(page.locator("[data-legal-document] main > section").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("Privacy and Terms remain readable without JavaScript", async ({ browser }) => {
  for (const path of ["/privacy", "/terms"]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-legal-document] main > section")).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await context.close();
  }
});

test("retired standalone tools permanently consolidate into Responsible Gambling", async ({ request }) => {
  for (const route of ["/self-check", "/tools/budget-calculator"]) {
    const response = await request.get(`${baseUrl}${route}`, { maxRedirects: 0 });
    expect(response.status(), route).toBe(308);
    expect(response.headers().location, route).toBe("/responsible-gambling");
  }
  const sitemap = await (await request.get(`${baseUrl}/sitemap.xml`)).text();
  const llms = await (await request.get(`${baseUrl}/llms.txt`)).text();
  for (const route of ["/self-check", "/tools/budget-calculator"]) {
    expect(sitemap).not.toContain(`https://b4gamble.com${route}`);
    expect(llms).not.toContain(route);
  }
});

test("final handoff routes have one H1, no overflow and no browser errors", async ({ browser }) => {
  const routes = ["/privacy", "/terms", "/responsible-gambling", "/about"];
  const viewports = [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 430, height: 844 }, { width: 390, height: 844 }, { width: 320, height: 720 }];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = collectErrors(page);
    for (const route of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} at ${viewport.width}`).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${route} overflow at ${viewport.width}`).toBe(false);
    }
    expect(errors, `console errors at ${viewport.width}`).toEqual([]);
    await context.close();
  }
});

test("About preserves the approved final-handoff hero identity", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-about-document] [data-about-section='hero']")).toHaveCount(1);
    await expect(page.locator("[data-about-document] [data-about-section]")).toHaveCount(4);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Built to be.*on your side\./);
    await page.close();
  }
});
