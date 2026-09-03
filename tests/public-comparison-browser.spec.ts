import { expect, test, type Page } from "@playwright/test";

import { productPageMessages } from "../lib/i18n/product-pages-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const messages = productPageMessages("en-GB");
const fixtureDirectoryUrl = `${baseUrl}/en/casinos?visualFixture=true`;

async function clearComparison(page: Page) {
  await page.goto(fixtureDirectoryUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.removeItem("b4gamble:public-comparison:v1"));
  await page.reload({ waitUntil: "networkidle" });
  const toggles = page.locator('[data-comparison-toggle][aria-pressed="false"]');
  await expect(toggles.first()).toBeVisible();
  expect(await toggles.count()).toBeGreaterThanOrEqual(3);
}

test("legacy Compare route permanently consolidates into the casino directory", async ({ page, request }) => {
  const response = await request.get(`${baseUrl}/compare?casino=demo-northstar&casino=demo-summit&country=GB`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/en/casinos?casino=demo-northstar&casino=demo-summit");

  await page.goto(`${baseUrl}/compare?casino=demo-northstar&casino=demo-summit&country=GB`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/en\/casinos\?casino=demo-northstar&casino=demo-summit/);
  await expect(page.getByRole("heading", { name: messages.comparison.title })).toBeVisible();
  await expect(page.getByRole("link", { name: messages.comparison.add, exact: true })).toHaveCount(0);
});

test("comparison stays contextual and opens automatically on the second selection", async ({ page }) => {
  await clearComparison(page);
  const toggles = page.locator('[data-comparison-toggle][aria-pressed="false"]');
  const tray = page.locator("[data-comparison-tray]");
  const dialog = page.locator('dialog[data-runtime-renderer="contextual-comparison"]');
  await toggles.first().click();
  await expect(tray).toHaveAttribute("data-comparison-count", "1");
  await expect(dialog).not.toBeVisible();

  const autoOpenInvoker = toggles.first();
  await autoOpenInvoker.evaluate((element) => element.setAttribute("data-comparison-focus-probe", "auto"));
  await autoOpenInvoker.click();
  await expect(dialog).toBeVisible();
  await expect(tray).toHaveAttribute("data-comparison-count", "2");
  await expect(page).toHaveURL(/casino=[a-z0-9-]+.*casino=[a-z0-9-]+/);
  await expect(dialog.getByRole("heading", { name: messages.comparison.title })).toBeVisible();
  await expect(dialog).toContainText(messages.comparison.subtitle);
  await expect(dialog).toContainText(messages.comparison.footer);
  await dialog.getByRole("button", { name: messages.comparison.close }).click();
  await expect(page.locator('[data-comparison-focus-probe="auto"]')).toBeFocused();
  const reopenInvoker = tray.getByRole("button", { name: messages.comparison.open });
  await reopenInvoker.click();
  await dialog.getByRole("button", { name: messages.comparison.close }).click();
  await expect(reopenInvoker).toBeFocused();

  await reopenInvoker.click();
  await dialog.getByRole("button", { name: messages.comparison.remove, exact: true }).first().click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[data-comparison-toggle][aria-pressed="true"]').first()).toBeFocused();
});

test("selection is capped at three, removable, clearable and session-persistent", async ({ page }) => {
  await clearComparison(page);
  const toggles = page.locator('[data-comparison-toggle][aria-pressed="false"]');
  const tray = page.locator("[data-comparison-tray]");
  const dialog = page.locator('dialog[data-runtime-renderer="contextual-comparison"]');
  for (let index = 0; index < 2; index += 1) await toggles.first().click();
  await dialog.getByRole("button", { name: messages.comparison.close }).click();
  await toggles.first().click();
  await expect(tray).toHaveAttribute("data-comparison-count", "3");

  const selectedBefore = await page.evaluate(() => JSON.parse(sessionStorage.getItem("b4gamble:public-comparison:v1") || "[]"));
  expect(selectedBefore).toHaveLength(3);
  await expect(toggles.first()).toBeDisabled();
  expect(Object.keys(await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage))))).toEqual(["b4gamble:public-comparison:v1"]);

  await page.reload({ waitUntil: "networkidle" });
  await expect(tray).toHaveAttribute("data-comparison-count", "3");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: messages.comparison.remove, exact: true }).first().click();
  await expect(tray).toHaveAttribute("data-comparison-count", "2");
  await expect(toggles.first()).toBeEnabled();
  await dialog.getByRole("button", { name: messages.comparison.close }).click();
  await page.locator("[data-comparison-clear]").click();
  await expect(tray).toHaveCount(0);
  await expect(page).not.toHaveURL(/casino=/);
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

test("comparison review links keep deterministic fixture transport", async ({ page }) => {
  await page.goto(`${baseUrl}/casinos?casino=demo-northstar&casino=demo-summit&country=GB&visualFixture=true`, { waitUntil: "networkidle" });
  const dialog = page.locator('dialog[data-runtime-renderer="contextual-comparison"]');
  const reviews = dialog.getByRole("link", { name: messages.comparison.fullReview, exact: true });
  await expect(reviews).toHaveCount(2);
  await expect(reviews.first()).toHaveAttribute("href", "/en/casino/demo-plume?visualFixture=true");
  await reviews.first().click();
  await expect(page).toHaveURL(`${baseUrl}/en/casino/demo-plume?visualFixture=true`);
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
});

test("desktop modal and mobile sheet avoid page-level horizontal overflow", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width <= 430 });
    await page.goto(`${baseUrl}/casinos?casino=demo-northstar&casino=demo-summit&country=GB&visualFixture=true`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: messages.comparison.title })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(true);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
    await page.close();
  }
});
