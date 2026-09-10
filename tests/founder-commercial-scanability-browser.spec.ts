import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const widths = [320, 375, 390, 430, 768, 1440] as const;
const routes = [
  { key: "casinos", path: "/en/casinos?visualFixture=true" },
  { key: "best-offers", path: "/en/best-offers?visualFixture=true" },
  { key: "bonuses", path: "/en/bonuses?visualFixture=true" },
  { key: "casino-profile", path: "/en/casino/demo-plume?visualFixture=true" },
] as const;

async function visibleBodyCopy(page: Page) {
  return page.locator("body").innerText();
}

test("Founder commercial routes stay scanable and truthful at every approved width", async ({ browser }, testInfo) => {
  test.setTimeout(180_000);

  for (const width of widths) {
    const mobile = width <= 430;
    const context = await browser.newContext({
      hasTouch: mobile,
      isMobile: mobile,
      reducedMotion: "reduce",
      viewport: { width, height: mobile ? 932 : 1000 },
    });

    for (const route of routes) {
      const page = await context.newPage();
      const runtimeErrors: string[] = [];
      page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
      expect(response?.status(), `${route.key} ${width}px status`).toBe(200);
      expect(await page.locator("h1").count(), `${route.key} ${width}px h1`).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${route.key} ${width}px horizontal overflow`).toBeLessThanOrEqual(1);

      const copy = await visibleBodyCopy(page);
      expect(copy, `${route.key} ${width}px partner-link microcopy`).not.toContain("Partner link available");
      expect(copy, `${route.key} ${width}px repeated affiliate microcopy`).not.toContain("Affiliate link · We may earn commission.");
      expect(runtimeErrors, `${route.key} ${width}px runtime errors`).toEqual([]);

      if (width === 390 || width === 1440) {
        await page.screenshot({ fullPage: true, path: testInfo.outputPath(`${route.key}-${width}.png`) });
      }
      await page.close();
    }
    await context.close();
  }
});

test("listing hierarchy and casino offer gating match the Founder contract", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto(`${baseUrl}/en/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
  const first = page.getByTestId("best-offer-product-card");
  const secondTier = page.getByTestId("ranked-offer-card");
  await expect(first).toHaveCount(1);
  await expect(secondTier).toHaveCount(2);
  const firstColumns = await first.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
  expect(firstColumns).toBe(2);

  await page.goto(`${baseUrl}/en/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  const casinoRows = page.locator('article[class*="casinoCard"]');
  expect(await casinoRows.count()).toBeGreaterThan(0);
  const casinoRowBox = await casinoRows.first().boundingBox();
  expect(casinoRowBox!.width).toBeGreaterThan(900);
  expect(casinoRowBox!.height).toBeLessThan(240);

  await page.goto(`${baseUrl}/en/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  const bonusRows = page.locator("[data-bonus-directory-card]");
  expect(await bonusRows.count()).toBeGreaterThan(0);
  const bonusRowBox = await bonusRows.first().boundingBox();
  expect(bonusRowBox!.width).toBeGreaterThan(900);
  expect(bonusRowBox!.height).toBeLessThan(240);

  await page.goto(`${baseUrl}/en/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  const hero = page.locator('section[aria-labelledby="casino-profile-title"]');
  const offerPanel = hero.locator('aside[data-offer-state]');
  await expect(offerPanel).toBeVisible();
  const desktopGeometry = await hero.evaluate((element) => {
    const panel = element.querySelector<HTMLElement>('aside[data-offer-state]')!;
    const copy = element.querySelector<HTMLElement>('aside[data-offer-state]')!.previousElementSibling as HTMLElement;
    const panelRect = panel.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    return { sideBySide: panelRect.left >= copyRect.right - 1 && panelRect.top < copyRect.bottom, state: panel.dataset.offerState };
  });
  expect(desktopGeometry.sideBySide).toBe(true);
  if (desktopGeometry.state === "unavailable") {
    await expect(offerPanel.locator('a[href^="/r/"]')).toHaveCount(0);
  }

  await page.setViewportSize({ width: 390, height: 932 });
  await page.reload({ waitUntil: "networkidle" });
  const mobileGeometry = await hero.evaluate((element) => {
    const panel = element.querySelector<HTMLElement>('aside[data-offer-state]')!;
    const copy = panel.previousElementSibling as HTMLElement;
    return panel.getBoundingClientRect().top >= copy.getBoundingClientRect().bottom - 1;
  });
  expect(mobileGeometry).toBe(true);
});
