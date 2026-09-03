import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

const publishedLanguages = [
  ["/en", "en-GB", "EN", false],
  ["/de", "de-DE", "DE", true],
  ["/es", "es-ES", "ES", true],
  ["/el", "el-GR", "EL", true],
  ["/sv", "sv-SE", "SV", true],
  ["/da", "da-DK", "DA", true],
] as const;

test("published language homes own canonical identity without a country selector", async ({ page }) => {
  for (const [path, locale, code, noindex] of publishedLanguages) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const selector = page.locator('[data-public-shell="header"] button[aria-haspopup="menu"]').first();
    await expect(selector).toContainText(code);
    expect((await selector.innerText()).trim()).toBe(code);
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(path);
    if (noindex) await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  }
});

test("language switch preserves path and safe query while persisting language only", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }] as const) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 600 });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/sv/casinos?q=slot&country=PE`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sv\/casinos\?q=slot$/);
    if (viewport.width < 600) {
      await page.locator('[data-public-shell="header"] button[aria-controls="public-mobile-navigation"]').click();
    }
    const trigger = page.locator('button[aria-haspopup="menu"]:visible').filter({ hasText: "SV" }).first();
    await trigger.click();
    const menu = page.locator('[role="menu"]:visible').first();
    await expect(menu.locator('button[value="sv"]')).toHaveAttribute("aria-checked", "true");
    await menu.locator('button[value="de"]').click();
    await expect(page).toHaveURL(/\/de\/casinos\?q=slot$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
    const cookie = (await context.cookies()).find((entry) => entry.name === "b4gamble_presentation");
    expect(cookie?.value).toBe("v2.de");
    expect(cookie?.value).not.toMatch(/GB|DE|ES|PE|GR|SE|DK/);
    await context.close();
  }
});

test("legacy country-qualified URLs migrate in one permanent hop and strip country", async ({ request }) => {
  for (const [legacy, canonical] of [
    ["/es-es/casinos?country=PE&sort=score", "/es/casinos?sort=score"],
    ["/es-pe/casinos?country=PE", "/es/casinos"],
    ["/se/casinos?country=PE", "/sv/casinos"],
    ["/gb/en/", "/en"],
    ["/es/casinos?country=PE&q=slot", "/es/casinos?q=slot"],
  ] as const) {
    const response = await request.get(`${baseUrl}${legacy}`, { maxRedirects: 0 });
    expect(response.status(), legacy).toBe(308);
    expect(response.headers().location, legacy).toBe(canonical);
    const destination = await request.get(`${baseUrl}${canonical}`, { maxRedirects: 0 });
    expect(destination.status(), canonical).toBe(200);
    expect(destination.headers().location, canonical).toBeUndefined();
  }
});

test("unprefixed resolution is private, strips country and never treats query state as market", async ({ request }) => {
  const response = await request.get(`${baseUrl}/casinos?country=PE&q=slot`, {
    headers: { "accept-language": "de-DE,de;q=0.9" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/de/casinos?q=slot");
  expect(response.headers()["cache-control"]).toMatch(/private.*no-store/i);
  expect(response.headers().vary).toMatch(/X-Vercel-IP-Country/i);
  expect(response.headers().vary).toMatch(/Accept-Language/i);
  expect(response.headers().vary).toMatch(/Cookie/i);
});

test("market-sensitive language routes isolate caches and expose no commercial fallback without trusted GEO", async ({ page, request }) => {
  for (const pathname of ["/es/casinos", "/es/bonuses", "/es/best-offers", "/es/help", "/es/responsible-gambling"] as const) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
    expect(response?.headers()["cache-control"], pathname).toMatch(/private.*no-store/i);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
    expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count(), pathname).toBe(0);
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(pathname);
  }

  const response = await request.get(`${baseUrl}/es/casinos`, { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toMatch(/private.*no-store/i);
  expect(response.headers()["content-language"]).toBe("es-ES");
});

test("global catalogue remains neutral, excludes demos and keeps detail/comparison safe", async ({ page, request }) => {
  await page.goto(`${baseUrl}/es/casinos`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).not.toContainText(/Demo Northstar|Demo Solvane|Fictional casino/i);
  expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count()).toBe(0);

  const profileHref = await page.locator('main a[href^="/es/casino/"]').first().getAttribute("href").catch(() => null);
  if (profileHref) {
    const response = await page.goto(`${baseUrl}${profileHref}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count()).toBe(0);
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(profileHref);
  }

  const comparison = await request.get(`${baseUrl}/es/compare?casino=alpha&casino=beta&country=PE&differences=true`, { maxRedirects: 0 });
  expect(comparison.status()).toBe(308);
  expect(comparison.headers().location).toBe("/es/casinos?casino=alpha&casino=beta&differences=true");
});

test("public API ignores country query and returns an isolated non-commercial projection", async ({ request }) => {
  const withSpoof = await request.get(`${baseUrl}/api/public/casinos?country=PE&limit=10`);
  const withoutSpoof = await request.get(`${baseUrl}/api/public/casinos?limit=10`);
  expect(withSpoof.status()).toBe(200);
  expect(withoutSpoof.status()).toBe(200);
  const spoofPayload = await withSpoof.json();
  const neutralPayload = await withoutSpoof.json();
  expect(spoofPayload).toEqual(neutralPayload);
  expect(withSpoof.headers()["cache-control"]).toMatch(/private.*no-store/i);
  expect(withSpoof.headers().vary).toMatch(/X-Vercel-IP-Country/i);
  expect(JSON.stringify(spoofPayload)).not.toMatch(/"href":"\/r\/|"available":true/);
});

test("published language shells and Programme boundary do not overflow or cross-contaminate", async ({ browser }) => {
  for (const [width, pathname] of [[360, "/el/casinos"], [390, "/de/program?entry=start"], [768, "/es/bonuses"], [1440, "/sv/best-offers"]] as const) {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 900 : 1_000 }, isMobile: width < 600 });
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${pathname} at ${width}px`).toBe(0);
    expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count(), pathname).toBe(0);
    expect(runtimeErrors, pathname).toEqual([]);
    await page.close();
  }
});
