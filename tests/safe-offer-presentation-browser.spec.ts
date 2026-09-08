import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const enabled = process.env.SAFE_OFFER_KZ_BROWSER === "1";

test.skip(!enabled, "Set SAFE_OFFER_KZ_BROWSER=1 only when the deployment request is trusted as KZ.");

async function openOk(page: import("@playwright/test").Page, pathname: string) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  expect(response?.status(), pathname).toBe(200);
  await expect(page.locator("main")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), pathname).toBeLessThanOrEqual(1);
  expect(await page.content(), `${pathname}: runtime error`).not.toMatch(/Application error|Internal Server Error|This page could not be found/i);
}

test("trusted KZ presentation shows published fallback offer knowledge without creating actions", async ({ page }) => {
  for (const [slug, relation] of [
    ["rizk", "ROW"],
    ["nordicbet", "ROW"],
    ["inkabet", "OTHER_MARKET"],
    ["betsafe", "OTHER_MARKET"],
    ["supercasino", "OTHER_MARKET"],
    ["starcasino", "OTHER_MARKET"],
  ] as const) {
    await openOk(page, `/en/casino/${slug}`);
    const offer = page.locator(`[data-offer-relation="${relation}"]`).first();
    await expect(offer, slug).toBeVisible();
    await expect(offer.locator('a[href^="/r/"]'), `${slug}: no transferred action`).toHaveCount(0);
    if (relation === "ROW") {
      await expect(offer, `${slug}: global editorial qualification`).toContainText(/Global editorial evidence.*partner-link availability/i);
    } else {
      await expect(offer, `${slug}: current-market qualification`).toContainText(/Kazakhstan.*not.*verified|KZ.*not.*verified/i);
    }
  }

  const catalogResponse = await page.request.get(`${baseUrl}/api/public/casinos?limit=100`);
  expect(catalogResponse.status()).toBe(200);
  const catalog = await catalogResponse.json() as {
    records: Array<{
      slug: string;
      countries: unknown[];
      licenses: unknown[];
      offerPresentation?: { relation?: string; affiliate?: { available?: boolean | null } };
    }>;
  };
  for (const [slug, relation] of [
    ["rizk", "ROW"],
    ["nordicbet", "ROW"],
    ["inkabet", "OTHER_MARKET"],
    ["betsafe", "OTHER_MARKET"],
    ["supercasino", "OTHER_MARKET"],
    ["starcasino", "OTHER_MARKET"],
  ] as const) {
    const record = catalog.records.find((entry) => entry.slug === slug);
    expect(record?.countries, `${slug}: no foreign market profile`).toEqual([]);
    expect(record?.licenses, `${slug}: no foreign market licence`).toEqual([]);
    expect(record?.offerPresentation?.relation, `${slug}: offer relation`).toBe(relation);
    expect(record?.offerPresentation?.affiliate?.available, `${slug}: no transferred action`).toBeFalsy();
  }

  await openOk(page, "/en/bonuses");
  const fallbackCards = page.locator('[data-bonus-directory-card][data-offer-relation="OTHER_MARKET"]');
  expect(await fallbackCards.count()).toBeGreaterThanOrEqual(4);
  for (const card of await fallbackCards.all()) await expect(card.locator('a[href^="/r/"]')).toHaveCount(0);
  const rowCards = page.locator('[data-bonus-directory-card][data-offer-relation="ROW"]');
  expect(await rowCards.count()).toBeGreaterThanOrEqual(2);
  for (const card of await rowCards.all()) await expect(card.locator('a[href^="/r/"]')).toHaveCount(0);
});
