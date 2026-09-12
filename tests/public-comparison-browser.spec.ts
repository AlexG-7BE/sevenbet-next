import { expect, test, type Page } from "@playwright/test";

import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const messages = productPageMessages("en-GB");
const fixtureDirectoryUrl = `${baseUrl}/en/casinos?visualFixture=true`;

async function expectFocusedCollection(page: Page) {
  await page.goto(fixtureDirectoryUrl, { waitUntil: "networkidle" });
  await expect(page.locator('[data-runtime-renderer="casinos"]')).toBeVisible();
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(page.locator('[data-comparison-toggle], [data-comparison-tray], [data-runtime-renderer="contextual-comparison"]')).toHaveCount(0);
}

test("legacy Compare route permanently consolidates into the casino directory", async ({ page, request }) => {
  const response = await request.get(`${baseUrl}/compare?casino=demo-northstar&casino=demo-summit&country=GB`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/en/casinos?casino=demo-northstar&casino=demo-summit");

  await page.goto(`${baseUrl}/compare?casino=demo-northstar&casino=demo-summit&country=GB`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/en\/casinos\?casino=demo-northstar&casino=demo-summit/);
  await expect(page.locator('[data-runtime-renderer="casinos"]')).toBeVisible();
  await expect(page.locator('[data-comparison-toggle], [data-comparison-tray], [data-runtime-renderer="contextual-comparison"]')).toHaveCount(0);
});

test("legacy comparison state cannot recreate a tray or modal", async ({ page }) => {
  await expectFocusedCollection(page);
  await page.evaluate(() => sessionStorage.setItem("b4gamble:public-comparison:v1", JSON.stringify(["demo-northstar", "demo-summit"])));
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
  await expect(page.locator('[data-comparison-toggle], [data-comparison-tray], [data-runtime-renderer="contextual-comparison"]')).toHaveCount(0);

  await page.goto(`${fixtureDirectoryUrl}&casino=demo-northstar&casino=demo-summit`, { waitUntil: "networkidle" });
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
  await expect(page.locator('[data-comparison-toggle], [data-comparison-tray], [data-runtime-renderer="contextual-comparison"]')).toHaveCount(0);
});

test("the focused collection exposes only decision views and name search", async ({ page }) => {
  await expectFocusedCollection(page);
  const copy = commercialUxMessages("en-GB");
  await expect(page.getByRole("tab", { name: copy.topRated, exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: copy.fastPayouts, exact: true }).click();
  await expect(page.getByRole("tab", { name: copy.fastPayouts, exact: true })).toHaveAttribute("aria-selected", "true");
  const search = page.getByRole("searchbox", { name: copy.searchCasinos });
  await search.fill("Solvane");
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(1);
  await search.fill("");
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
});

test("comparison projection is private, no-store, noindex and validates slugs", async ({ request }) => {
  const available = await request.get(`${baseUrl}/api/public/comparison?casino=demo-northstar&casino=demo-summit&country=GB&presentationLocale=en-GB&visualFixture=true`);
  expect(available.status()).toBe(200);
  expect(available.headers()["cache-control"]).toContain("private, no-store");
  expect(available.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  const body = await available.json();
  expect(body.status).toBe("available");
  expect(body.selectedSlugs).toEqual(["demo-northstar", "demo-summit"]);
  expect(body.casinos.map((casino: { reviewHref: string }) => casino.reviewHref)).toEqual([
    "/casino/demo-plume?visualFixture=true",
    "/casino/demo-plume?visualFixture=true",
  ]);
  expect(JSON.stringify(body)).not.toMatch(/destinationUrl|trackingUrl|email|programme/i);

  const malformed = await request.get(`${baseUrl}/api/public/comparison?casino=..%2Funsafe&casino=demo-northstar&country=GBR&presentationLocale=en-GB&visualFixture=true`);
  expect(malformed.status()).toBe(200);
  expect((await malformed.json()).selectedSlugs).toEqual(["demo-northstar"]);
});

test("the governed fixture review link keeps deterministic profile transport", async ({ page }) => {
  await expectFocusedCollection(page);
  const reviews = page.getByRole("link", { name: messages.common.viewDemonstration, exact: true });
  await expect(reviews).toHaveCount(1);
  await expect(reviews).toHaveAttribute("href", "/en/casino/demo-plume?visualFixture=true");
  await reviews.click();
  await expect(page).toHaveURL(`${baseUrl}/en/casino/demo-plume?visualFixture=true`);
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
});

test("legacy comparison parameters leave the focused collection bounded at every viewport", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width <= 430 });
    await page.goto(`${baseUrl}/casinos?casino=demo-northstar&casino=demo-summit&country=GB&visualFixture=true`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
    await expect(page.locator('[data-comparison-toggle], [data-comparison-tray], [data-runtime-renderer="contextual-comparison"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(true);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
    await page.close();
  }
});
