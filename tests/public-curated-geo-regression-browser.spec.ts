import { expect, test, type Locator, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function expectEveryVisibleSelectorHasCards(section: Locator) {
  const selectors = section.locator('[role="group"] button');
  expect(await selectors.count()).toBeGreaterThan(0);
  for (const selector of await selectors.all()) {
    await selector.click();
    await expect(selector).toHaveAttribute("aria-pressed", "true");
    const count = await section.locator("article").count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
    await expect(section.locator('[role="status"]')).toHaveCount(0);
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`curated casino and bonus navigation never exposes a known-empty result at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport, isMobile: viewport.width <= 430, hasTouch: viewport.width <= 430 });

    await page.goto(`${baseUrl}/en/casinos?visualFixture=true`, { waitUntil: "networkidle" });
    const casinos = page.locator('section[aria-labelledby="curated-title"]');
    await expect(casinos).toBeVisible();
    await expectEveryVisibleSelectorHasCards(casinos);
    await expectNoHorizontalOverflow(page);

    await page.goto(`${baseUrl}/en/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
    const bonuses = page.locator('section[aria-labelledby="bonus-shortlist-title"]');
    await expect(bonuses).toBeVisible();
    await expectEveryVisibleSelectorHasCards(bonuses);
    await expectNoHorizontalOverflow(page);

    await page.close();
  });
}

test("an explicit full-directory bonus filter may still render its recovery empty state", async ({ page }) => {
  await page.goto(`${baseUrl}/en/bonuses?payment=definitely-not-present`, { waitUntil: "networkidle" });
  await expect(page.locator('[data-public-empty-state="filtered"][data-result-count="0"]')).toBeVisible();
  await expect(page.locator('section[aria-labelledby="bonus-shortlist-title"]')).toHaveCount(0);
});
