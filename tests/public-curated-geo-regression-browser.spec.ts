import { expect, test, type Locator, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function expectEveryVisibleViewHasCards(tablist: Locator, cards: Locator, expectedViews: number, maximumCards: number) {
  const tabs = tablist.getByRole("tab");
  await expect(tabs).toHaveCount(expectedViews);
  for (const tab of await tabs.all()) {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(maximumCards);
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`focused casino and bonus views never expose a known-empty result at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport, isMobile: viewport.width <= 430, hasTouch: viewport.width <= 430 });

    await page.goto(`${baseUrl}/en/casinos?visualFixture=true`, { waitUntil: "networkidle" });
    await expectEveryVisibleViewHasCards(page.getByRole("tablist"), page.locator("[data-commercial-casino-card]"), 3, 10);
    await expectNoHorizontalOverflow(page);

    await page.goto(`${baseUrl}/en/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
    await expectEveryVisibleViewHasCards(page.getByRole("tablist"), page.locator("[data-commercial-bonus-card]"), 5, 8);
    await expectNoHorizontalOverflow(page);

    await page.close();
  });
}

test("a legacy bonus filter cannot reintroduce the retired catalogue state", async ({ page }) => {
  await page.goto(`${baseUrl}/en/bonuses?payment=definitely-not-present&visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page.locator("[data-commercial-bonus-card]")).toHaveCount(8);
  await expect(page.getByRole("tab")).toHaveCount(5);
  await expect(page.locator('[data-public-empty-state="filtered"], [data-active-filter-state="bonuses"]')).toHaveCount(0);
});
