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

test("Peru public core and safety routes are coherent without noindex hreflang", async ({ page }) => {
  for (const path of ["/es-pe/casinos", "/es-pe/best-offers", "/es-pe/bonuses", "/es-pe/help", "/es-pe/responsible-gambling"] as const) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
    expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count()).toBe(0);
  }
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator("main")).toContainText("MINCETUR");
  await expect(page.locator("main")).not.toContainText(/GAMSTOP|GamCare|Spelpaus|Stödlinjen/);
});

test("selector persists Peru and keeps the equivalent path on desktop and mobile", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }] as const) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 600 });
    await page.goto(`${baseUrl}/sv-se/casinos`, { waitUntil: "domcontentloaded" });
    if (viewport.width < 600) {
      await page.locator('[data-public-shell="header"] button[aria-controls="public-mobile-navigation"]').click();
    }
    const trigger = page.locator('button[aria-haspopup="menu"]:visible').filter({ hasText: "SV · SE" }).first();
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

test("hosted real data keeps exact Peru and Sweden casino facts isolated and non-commercial", async ({ request }) => {
  const dataOrigin = process.env.GEO_REAL_DATA_API_ORIGIN?.replace(/\/$/, "");
  test.skip(!dataOrigin, "Real-data assertions require an explicit read-only public API origin.");

  const [peruResponse, swedenResponse] = await Promise.all([
    request.get(`${dataOrigin}/api/public/casinos?country=PE&limit=10`),
    request.get(`${dataOrigin}/api/public/casinos?country=SE&limit=10`),
  ]);
  expect(peruResponse.status()).toBe(200);
  expect(swedenResponse.status()).toBe(200);
  const peruPayload = await peruResponse.json() as { records: Array<Record<string, unknown>> };
  const swedenPayload = await swedenResponse.json() as { records: Array<Record<string, unknown>> };
  const peru = peruPayload.records.find((record) => record.slug === "betsson");
  const sweden = swedenPayload.records.find((record) => record.slug === "betsson");
  expect(peru).toBeTruthy();
  expect(sweden).toBeTruthy();

  const peruJson = JSON.stringify(peru);
  const swedenJson = JSON.stringify(sweden);
  expect(peruJson).toContain("PEN");
  expect(peruJson).toContain("Yape");
  expect(peruJson).toContain("MINCETUR");
  expect(peruJson).toContain("11002586010000");
  expect(peruJson).toContain("21002586010000");
  expect(peruJson).toContain('"classification":"UNKNOWN"');
  expect(peruJson).toContain('"classification":"CONTRADICTION"');
  expect(peruJson).not.toMatch(/SEK|Swish|Spelinspektionen|23Si2176/);

  expect(swedenJson).toContain("SEK");
  expect(swedenJson).toContain("Swish");
  expect(swedenJson).toContain("Spelinspektionen");
  expect(swedenJson).toContain("23Si2176");
  expect(swedenJson).not.toMatch(/PEN|Yape|MINCETUR|11002586010000|21002586010000/);
  for (const record of [peru, sweden]) {
    expect(record?.affiliate).toEqual({ href: null, available: false });
  }
});
