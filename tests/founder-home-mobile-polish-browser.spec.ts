import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

const mobileViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
] as const;

async function stopNativeScrollAnimation(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
  });
}

for (const viewport of mobileViewports) {
  test(`Home mobile composition is controlled at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ isMobile: true, viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await stopNativeScrollAnimation(page);

    await expect(page.locator('[data-handoff-page="home"]')).toHaveAttribute("data-home-interactions", "ready");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

    const hero = await page.locator('[data-screen-label="Hero"]').evaluate((element) => {
      const visiblePhotos = [...element.querySelectorAll<HTMLElement>("[data-tphoto]")]
        .filter((photo) => getComputedStyle(photo).display !== "none");
      const description = element.querySelector<HTMLElement>("h1 + p")!;
      const cta = element.querySelector<HTMLElement>('a[href^="/program"]')!;
      const kicker = element.querySelector<HTMLElement>("h1")!.previousElementSibling as HTMLElement;
      const rect = (target: Element) => target.getBoundingClientRect();
      const intersectionArea = (first: DOMRect, second: DOMRect) => (
        Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
        * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
      );
      const photoRects = visiblePhotos.map(rect);
      const descriptionRect = rect(description);
      const ctaRect = rect(cta);
      return {
        ctaHeight: ctaRect.height,
        ctaWidth: ctaRect.width,
        descriptionIntersections: photoRects.map((photo) => intersectionArea(photo, descriptionRect)),
        ctaIntersections: photoRects.map((photo) => intersectionArea(photo, ctaRect)),
        photoKickerGap: rect(kicker).top - Math.max(...photoRects.map((photo) => photo.bottom)),
      };
    });
    expect(hero.descriptionIntersections).toEqual([0, 0]);
    expect(hero.ctaIntersections).toEqual([0, 0]);
    expect(hero.photoKickerGap).toBeGreaterThanOrEqual(16);
    expect(hero.ctaWidth).toBeGreaterThanOrEqual(44);
    expect(hero.ctaHeight).toBeGreaterThanOrEqual(44);

    const contentGap = await page.evaluate(() => {
      const recognition = document.querySelector<HTMLElement>('[data-screen-label="Recognition"]')!;
      const finalSignal = recognition.querySelector<HTMLElement>(":scope > div > div > div:last-child > div:last-child")!;
      const productEyebrow = document.querySelector<HTMLElement>('[data-screen-label="A plan you can see"]')!.firstElementChild as HTMLElement;
      return productEyebrow.getBoundingClientRect().top - finalSignal.getBoundingClientRect().bottom;
    });
    expect(contentGap).toBeGreaterThanOrEqual(170);
    expect(contentGap).toBeLessThanOrEqual(220);

    const evidence = await page.locator('[data-screen-label="Built from evidence"]').evaluate((section) => {
      const heading = section.querySelector<HTMLElement>(":scope > div > div:first-child")!;
      const grid = section.querySelector<HTMLElement>(":scope > div > div:last-child")!;
      const cards = [...grid.children] as HTMLElement[];
      return {
        height: section.getBoundingClientRect().height,
        headingMarginBottom: Number.parseFloat(getComputedStyle(heading).marginBottom),
        gap: Number.parseFloat(getComputedStyle(grid).gap),
        cards: cards.map((card) => ({
          height: card.getBoundingClientRect().height,
          paddingTop: Number.parseFloat(getComputedStyle(card).paddingTop),
          paddingRight: Number.parseFloat(getComputedStyle(card).paddingRight),
        })),
      };
    });
    expect(evidence.height).toBeLessThanOrEqual(1_000);
    expect(evidence.headingMarginBottom).toBeLessThanOrEqual(36);
    expect(evidence.gap).toBeLessThanOrEqual(12);
    expect(Math.max(...evidence.cards.map((card) => card.height))).toBeLessThanOrEqual(185);
    expect(evidence.cards.every((card) => card.paddingTop <= 24 && card.paddingRight <= 22)).toBe(true);

    const trust = await page.locator('[data-screen-label="Why trust"]').evaluate((section) => {
      const left = section.querySelector<HTMLElement>('[data-mob="trustL"]')!;
      const right = section.querySelector<HTMLElement>('[data-mob="trustR"]')!;
      const rightRows = [...right.querySelectorAll<HTMLElement>(":scope > div:last-child > div")];
      return {
        columns: getComputedStyle(left.parentElement!).gridTemplateColumns.split(" ").length,
        leftBorderRight: Number.parseFloat(getComputedStyle(left).borderRightWidth),
        leftBorderBottom: Number.parseFloat(getComputedStyle(left).borderBottomWidth),
        rightTextAlign: getComputedStyle(right).textAlign,
        reviewChecksLead: rightRows.every((row) => {
          const check = row.querySelector<HTMLElement>(":scope > span:last-child")!;
          return Math.abs(check.getBoundingClientRect().left - row.getBoundingClientRect().left) <= 1;
        }),
      };
    });
    expect(trust.columns).toBe(1);
    expect(trust.leftBorderRight).toBe(0);
    expect(trust.leftBorderBottom).toBeGreaterThanOrEqual(1);
    expect(trust.rightTextAlign).toBe("left");
    expect(trust.reviewChecksLead).toBe(true);

    await context.close();
  });
}

for (const viewport of mobileViewports.filter(({ width }) => width === 390 || width === 430)) {
  test(`Home photo sequence holds one focal scene at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ isMobile: true, viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await stopNativeScrollAnimation(page);
    const firstPanelTop = await page.locator("[data-stackpanel]").first().evaluate((panel) => panel.getBoundingClientRect().top + scrollY);
    await page.evaluate((target) => {
      document.documentElement.style.setProperty("scroll-snap-type", "none", "important");
      scrollTo(0, target);
    }, firstPanelTop + viewport.height * .25);
    await page.waitForTimeout(250);

    const panels = await page.locator("[data-stackpanel]").evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        marginTop: Number.parseFloat(getComputedStyle(element).marginTop),
        snapAlign: getComputedStyle(element).scrollSnapAlign,
        snapStop: getComputedStyle(element).scrollSnapStop,
        visibleHeight: Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)),
      };
    }));
    expect(panels[0].visibleHeight).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(panels[1].visibleHeight).toBeLessThanOrEqual(viewport.height * .05);
    expect(panels[1].marginTop).toBeGreaterThanOrEqual(180);
    expect(panels.every((panel) => panel.snapAlign === "start" && panel.snapStop === "always")).toBe(true);
    await context.close();
  });
}

test("Home mobile remains fail-visible without JavaScript and with reduced motion", async ({ browser }) => {
  const noJavaScript = await browser.newContext({ javaScriptEnabled: false, isMobile: true, viewport: { width: 390, height: 844 } });
  const noJavaScriptPage = await noJavaScript.newPage();
  await noJavaScriptPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await expect(noJavaScriptPage.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(noJavaScriptPage.locator('[data-screen-label="Built from evidence"] h2')).toContainText("Built from evidence.");
  expect(await noJavaScriptPage.locator("[data-rise], [data-stackpanel]").evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return Number(style.opacity) === 1 && style.visibility === "visible";
  }))).toBe(true);
  expect(await noJavaScriptPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await noJavaScript.close();

  const reducedMotion = await browser.newContext({ reducedMotion: "reduce", isMobile: true, viewport: { width: 390, height: 844 } });
  const reducedMotionPage = await reducedMotion.newPage();
  await reducedMotionPage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await expect(reducedMotionPage.locator('[data-handoff-page="home"]')).toHaveAttribute("data-home-interactions", "fallback");
  expect(await reducedMotionPage.locator("[data-rise], [data-stackpanel]").evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return Number(style.opacity) === 1 && style.visibility === "visible";
  }))).toBe(true);
  await reducedMotion.close();
});

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`Home desktop/tablet geometry is not affected at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    const cardPadding = await page.locator('[data-screen-label="Built from evidence"] > div > div:last-child > div').first().evaluate((card) => ({
      left: Number.parseFloat(getComputedStyle(card).paddingLeft),
      top: Number.parseFloat(getComputedStyle(card).paddingTop),
    }));
    expect(cardPadding).toEqual({ left: 42, top: 46 });
    await expect(page.locator('[data-screen-label="Hero"]')).toBeVisible();
    await expect(page.locator('[data-screen-label="Why trust"]')).toBeAttached();
  });
}
