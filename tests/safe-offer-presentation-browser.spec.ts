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

test("trusted KZ presentation shows published other-market offer knowledge without creating actions", async ({ page }) => {
  for (const slug of ["rizk", "inkabet", "betsafe", "supercasino"] as const) {
    await openOk(page, `/en/casino/${slug}`);
    await expect(page.locator('[data-offer-relation="OTHER_MARKET"]').first(), slug).toBeVisible();
    await expect(page.locator('[data-offer-relation="OTHER_MARKET"] a[href^="/r/"]'), `${slug}: no transferred action`).toHaveCount(0);
    await expect(page.getByText(/Kazakhstan.*not.*verified|KZ.*not.*verified/i).first(), `${slug}: current-market qualification`).toBeVisible();
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
    ["rizk", "OTHER_MARKET"],
    ["nordicbet", "OTHER_MARKET"],
    ["inkabet", "OTHER_MARKET"],
    ["betsafe", "OTHER_MARKET"],
    ["supercasino", "OTHER_MARKET"],
    ["starcasino", "NONE"],
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
});
