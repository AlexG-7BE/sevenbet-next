import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const enabled = process.env.CASINO_COMMERCIAL_VISIBILITY_BROWSER === "1";
const realCasinos = [
  ["betsson", "Betsson"],
  ["skol-casino", "Skol Casino"],
  ["hello-casino", "Hello Casino"],
  ["gday-casino", "G'day Casino"],
  ["diamond7", "Diamond7"],
  ["dragonbet", "DragonBet"],
  ["21-prive", "21 Privé"],
  ["slotnite", "Slotnite"],
] as const;

test.skip(!enabled, "Set CASINO_COMMERCIAL_VISIBILITY_BROWSER=1 for deployment acceptance.");

async function openOk(page: import("@playwright/test").Page, pathname: string) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  expect(response?.status(), pathname).toBe(200);
  await expect(page.locator("main")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), pathname).toBeLessThanOrEqual(1);
  const html = await page.content();
  expect(html, `${pathname}: raw Superfly route`).not.toMatch(/go\.superflypartners\.net/i);
  expect(html, `${pathname}: runtime error`).not.toMatch(/Application error|Internal Server Error|This page could not be found/i);
}

test("live catalog, bonuses and Best Offers contain real records without synthetic identities", async ({ page }) => {
  await openOk(page, "/en");
  await openOk(page, "/en/casinos");
  for (const [, name] of realCasinos) await expect(page.getByText(name, { exact: false }).first(), name).toBeVisible();
  await expect(page.getByText(/gentleman jim/i)).toHaveCount(0);
  await expect(page.getByText(/demo casino|fictional casino/i)).toHaveCount(0);

  await openOk(page, "/en/bonuses");
  for (const [, name] of realCasinos.filter(([slug]) => !["betsson", "dragonbet"].includes(slug))) {
    await expect(page.getByText(name, { exact: false }).first(), `${name} bonus`).toBeVisible();
  }

  await openOk(page, "/en/best-offers");
  await expect(page.locator('[data-runtime-renderer="best-offers"]')).toBeVisible();
  await expect(page.getByTestId("best-offer-product-card")).toHaveCount(1);
  expect(await page.locator('main a[href^="http"]').count()).toBe(0);
});

test("all eight live profiles expose scores, reviews and populated global facts", async ({ page }) => {
  for (const [slug, name] of realCasinos) {
    await openOk(page, `/en/casino/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible();
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
    await expect(page.getByText(/editor score/i).first()).toBeVisible();
    await expect(page.getByText(/published review/i).first()).toBeVisible();
    if (slug !== "betsson" && slug !== "dragonbet") {
      await expect(page.getByText(/payment records/i).first()).toBeVisible();
      await expect(page.getByText(/providers/i).first()).toBeVisible();
      await expect(page.getByText(/offer terms/i).first()).toBeVisible();
    }
    if (slug === "hello-casino") {
      await expect(page.getByText("Bonus expires after 30 days; spins expire after 10 days.", { exact: true })).toBeVisible();
    }
  }
});

test("catalog surfaces and profiles remain usable at 390px", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  for (const pathname of [
    "/en",
    "/en/casinos",
    "/en/bonuses",
    "/en/best-offers",
    ...realCasinos.map(([slug]) => `/en/casino/${slug}`),
  ]) await openOk(page, pathname);
  await page.close();
});
