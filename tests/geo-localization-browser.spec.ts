import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("canonical market homes expose route-owned language, SEO and selector state", async ({ page }) => {
  for (const [path, locale, trigger] of [
    ["/en-gb", "en-GB", "EN · GB"],
    ["/sv-se", "sv-SE", "SV · SE"],
    ["/es-pe", "es-PE", "ES · PE"],
  ] as const) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator('[data-public-shell="header"] button[aria-haspopup="menu"]').first()).toContainText(trigger);
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(path);
    if (locale !== "en-GB") await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  }
});

test("Peru public core, safety routes and locale alternates are coherent", async ({ page }) => {
  for (const path of ["/es-pe/casinos", "/es-pe/best-offers", "/es-pe/bonuses", "/es-pe/help", "/es-pe/responsible-gambling"] as const) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
    expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count()).toBe(0);
  }
  await expect(page.locator('link[rel="alternate"][hreflang="sv-SE"]')).toHaveAttribute("href", /\/sv-se\/responsible-gambling$/);
  await expect(page.locator("main")).toContainText("MINCETUR");
  await expect(page.locator("main")).not.toContainText(/GAMSTOP|GamCare|Spelpaus|Stödlinjen/);
});

test("selector persists Peru and keeps the equivalent path on desktop and mobile", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }] as const) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 600 });
    await page.goto(`${baseUrl}/sv-se/casinos`, { waitUntil: "domcontentloaded" });
    if (viewport.width < 600) {
      await page.locator('[data-public-shell="header"] button[aria-haspopup="dialog"]').click();
    }
    const trigger = page.locator('button[aria-haspopup="menu"]').filter({ hasText: "SV · SE" }).first();
    await trigger.click();
    await page.locator('button[value="PE|es-PE"]:visible').first().click();
    await expect(page).toHaveURL(/\/es-pe\/casinos$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
    await page.close();
  }
});

test("legacy URLs canonicalize in exactly one hop without retaining country", async ({ request }) => {
  for (const [legacy, canonical] of [
    ["/casinos?country=PE&sort=score", "/es-pe/casinos?sort=score"],
    ["/se/casinos?country=PE", "/sv-se/casinos"],
    ["/gb/en/", "/en-gb"],
  ] as const) {
    const response = await request.get(`${baseUrl}${legacy}`, { maxRedirects: 0 });
    expect(response.status(), legacy).toBe(308);
    expect(response.headers().location, legacy).toBe(canonical);
    expect((await request.get(`${baseUrl}${canonical}`, { maxRedirects: 0 })).status(), canonical).toBe(200);
  }
});

test("canonical shells do not overflow on representative mobile and desktop widths", async ({ browser }) => {
  for (const width of [360, 390, 430, 768, 1024, 1440] as const) {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 900 : 1_000 }, isMobile: width < 600 });
    const response = await page.goto(`${baseUrl}/es-pe/casinos`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px`).toBe(0);
    await page.close();
  }
});

test("hosted Preview keeps exact Peru and Sweden casino data isolated and non-commercial", async ({ page }) => {
  test.skip(process.env.GEO_REAL_DATA_EXPECTED !== "true", "Real-data assertions run only against the hosted Preview deployment.");

  const peruDirectory = await page.goto(`${baseUrl}/es-pe/casinos`, { waitUntil: "networkidle" });
  expect(peruDirectory?.status()).toBe(200);
  await expect(page.locator("main")).toContainText("Betsson");
  await expect(page.locator("main")).not.toContainText("Demo Prism");

  const peruProfile = await page.goto(`${baseUrl}/es-pe/casino/betsson`, { waitUntil: "networkidle" });
  expect(peruProfile?.status()).toBe(200);
  await expect(page.locator("main")).toContainText(/PEN|S\//);
  await expect(page.locator("main")).toContainText("Yape");
  await expect(page.locator("main")).toContainText("MINCETUR");
  await expect(page.locator("main")).toContainText("11002586010000");
  await expect(page.locator("main")).toContainText("21002586010000");
  await expect(page.locator("main")).not.toContainText(/SEK|Swish|Spelinspektionen|23Si2176/);
  expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count()).toBe(0);

  const swedenProfile = await page.goto(`${baseUrl}/sv-se/casino/betsson`, { waitUntil: "networkidle" });
  expect(swedenProfile?.status()).toBe(200);
  await expect(page.locator("main")).toContainText("SEK");
  await expect(page.locator("main")).toContainText("Swish");
  await expect(page.locator("main")).toContainText("Spelinspektionen");
  await expect(page.locator("main")).toContainText("23Si2176");
  await expect(page.locator("main")).not.toContainText(/PEN|Yape|MINCETUR|11002586010000|21002586010000/);
  expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count()).toBe(0);
});
