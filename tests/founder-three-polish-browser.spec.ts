import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { resolve } from "node:path";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const captureEvidence = process.env.UPDATE_FOUNDER_EVIDENCE === "1";
const evidenceRoot = resolve("docs/02_Product_Design/qa/final-design-handoff");

type Rect = { bottom: number; height: number; left: number; right: number; top: number; width: number };

async function saveWebp(page: Page, path: string) {
  if (!captureEvidence) return;
  const buffer = await page.screenshot({ animations: "disabled" });
  await sharp(buffer).webp({ quality: 88 }).toFile(path);
}

async function saveLocatorWebp(page: Page, selector: string, path: string) {
  if (!captureEvidence) return;
  const buffer = await page.locator(selector).screenshot({ animations: "disabled" });
  await sharp(buffer).webp({ quality: 88 }).toFile(path);
}

async function instantScroll(page: Page, top: number) {
  await page.evaluate((target) => {
    document.documentElement.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
    scrollTo(0, target);
  }, top);
  await page.waitForTimeout(150);
}

async function touchScroll(context: BrowserContext, page: Page, direction: "down" | "up") {
  const viewport = page.viewportSize()!;
  const session = await context.newCDPSession(page);
  const x = Math.round(viewport.width / 2);
  const startY = Math.round(viewport.height * (direction === "down" ? .82 : .18));
  const endY = Math.round(viewport.height * (direction === "down" ? .18 : .82));
  try {
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: Math.round(startY + ((endY - startY) * step) / 8) }],
      });
      await page.waitForTimeout(16);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await session.detach();
  }
  await page.waitForTimeout(650);
}

async function learnAnchors(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
    const hero = rect('[data-learn-hero-axis] h1');
    const meta = rect('[data-learn-meta-axis] > span:first-child');
    const updated = rect('[data-learn-meta-axis] > span:last-child');
    const startHeading = rect('[data-learn-start-axis] h2');
    const startSection = rect("[data-learn-start-axis]");
    return {
      heroContentLeft: hero.left,
      heroMetaLeft: meta.left,
      metaRight: updated.right,
      startHereLeft: startHeading.left,
      startHereSectionRight: startSection.right,
    };
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
] as const) {
  test(`Learn hero shares the rendered START HERE axis at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
    const anchors = await learnAnchors(page);
    expect(Math.abs(anchors.heroContentLeft - anchors.startHereLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(anchors.heroMetaLeft - anchors.startHereLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(anchors.metaRight - anchors.startHereSectionRight)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

    if (captureEvidence && viewport.width === 1440) {
      await instantScroll(page, 0);
      await saveWebp(page, resolve(evidenceRoot, "founder-learn-alignment-review/learn-hero-1440.webp"));
      await page.locator("[data-learn-start-section]").evaluate((element) => element.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(200);
      await saveWebp(page, resolve(evidenceRoot, "founder-learn-alignment-review/learn-hero-start-here-1440.webp"));
    }
    if (captureEvidence && viewport.width === 1024) {
      await instantScroll(page, 0);
      await saveWebp(page, resolve(evidenceRoot, "founder-learn-alignment-review/learn-hero-1024.webp"));
    }
  });
}

test("Learn mobile keeps the existing 24px frame", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
  const anchors = await learnAnchors(page);
  expect(anchors.heroContentLeft).toBeCloseTo(24, 0);
  expect(anchors.heroMetaLeft).toBeCloseTo(24, 0);
  expect(anchors.startHereLeft).toBeCloseTo(24, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await instantScroll(page, 0);
  await saveWebp(page, resolve(evidenceRoot, "founder-learn-alignment-review/learn-mobile-390.webp"));
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
] as const) {
  test(`Casino final demonstration block is one centered runtime stack at ${viewport.width}px`, async ({ browser }) => {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
    await expect(page.locator("[data-handoff-page]")).toHaveCount(0);

    const finalOffer = page.locator('[data-demo-state="fictional"]');
    await finalOffer.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const final = document.querySelector<HTMLElement>('[data-demo-state="fictional"]')!;
      const inner = final.querySelector<HTMLElement>('[class*="finalOfferInner"]')!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      const verdictCopy = document.querySelector<HTMLElement>("#verdict > div:first-child")!;
      const score = document.querySelector<HTMLElement>('#verdict [class*="scorePanel"]')!;
      const finalRect = final.getBoundingClientRect();
      const center = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return rect.left + rect.width / 2;
      };
      return {
        childCenters: [...inner.children].map(center),
        finalCenter: center(final),
        footerGap: footer.getBoundingClientRect().top - finalRect.bottom,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        innerWidth: inner.getBoundingClientRect().width,
        scoreGap: score.getBoundingClientRect().top - verdictCopy.getBoundingClientRect().bottom,
      };
    });
    expect(geometry.childCenters.every((center) => Math.abs(center - geometry.finalCenter) <= 1)).toBe(true);
    expect(geometry.innerWidth).toBeLessThanOrEqual(960.5);
    expect(Math.abs(geometry.footerGap)).toBeLessThanOrEqual(1);
    expect(geometry.horizontalOverflow).toBe(0);
    if (mobile) expect(geometry.scoreGap).toBeGreaterThanOrEqual(40);

    if (captureEvidence && (viewport.width === 1440 || viewport.width === 390)) {
      const suffix = viewport.width === 1440 ? "1440" : "390";
      await saveLocatorWebp(page, '[data-demo-state="fictional"]', resolve(evidenceRoot, `founder-casino-final-block-review/casino-final-demo-${suffix}.webp`));
      await instantScroll(page, await page.evaluate(() => document.documentElement.scrollHeight));
      await saveWebp(page, resolve(evidenceRoot, `founder-casino-final-block-review/casino-final-demo-footer-${suffix}.webp`));
    }
    await context.close();
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
] as const) {
  test(`Home fine-pointer ending advances from narrative to one CTA/footer scene at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: false, viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    const finalCta = page.locator('[data-home-final-composition]');
    const footer = page.locator('[data-public-shell="footer"]');
    await expect(page.locator('[data-handoff-page="home"]')).toHaveAttribute("data-home-interactions", "ready");
    await expect(page.locator('[data-public-shell="footer"]')).toHaveCount(1);
    await expect(finalCta).not.toHaveAttribute("data-snap", "");

    await page.locator('[data-screen-label="Why trust"]').evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(700);
    expect(await footer.evaluate((element) => element.getBoundingClientRect().top >= innerHeight)).toBe(true);
    for (let index = 0; index < 6; index += 1) {
      if (await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2)) break;
      await page.mouse.wheel(0, 920);
      await page.waitForTimeout(750);
    }

    const closing = await page.evaluate(() => {
      const cta = document.querySelector<HTMLElement>('[data-home-final-composition]')!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      const heading = cta.querySelector<HTMLElement>("h2")!;
      const action = cta.querySelector<HTMLElement>('a[href^="/program"]')!;
      const rect = (element: Element): Rect => element.getBoundingClientRect().toJSON();
      const visible = (element: Element) => {
        const value = element.getBoundingClientRect();
        return Math.max(0, Math.min(innerHeight, value.bottom) - Math.max(0, value.top));
      };
      return {
        actionVisible: visible(action),
        atBottom: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2,
        cta: rect(cta),
        ctaVisible: visible(cta),
        footer: rect(footer),
        footerVisible: visible(footer),
        headingVisible: visible(heading),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollY,
      };
    });
    expect(closing.atBottom).toBe(true);
    expect(closing.footerVisible).toBeGreaterThan(0);
    expect(closing.ctaVisible).toBeGreaterThanOrEqual(Math.min(320, closing.cta.height * .65));
    expect(closing.headingVisible).toBeGreaterThan(40);
    expect(closing.actionVisible).toBeGreaterThanOrEqual(44);
    expect(Math.abs(closing.footer.top - closing.cta.bottom)).toBeLessThanOrEqual(1);
    expect(closing.horizontalOverflow).toBe(0);

    if (captureEvidence && viewport.width === 1440) {
      await instantScroll(page, Math.max(0, closing.scrollY - 48));
      await saveWebp(page, resolve(evidenceRoot, "founder-header-home-responsive-review/home-final-desktop-1440.webp"));
    }

    const previousCanonicalDestination = await page.evaluate(() => {
      const maximum = document.documentElement.scrollHeight - innerHeight;
      const positions = Array.from(document.querySelectorAll<HTMLElement>("[data-home-snap]"), (element) => (
        Math.min(maximum, Math.round(element.getBoundingClientRect().top + scrollY))
      ));
      const destinations = [...new Set([...positions, maximum])].sort((left, right) => left - right);
      return destinations.at(-2) ?? 0;
    });
    await page.mouse.wheel(0, -920);
    await page.waitForTimeout(750);
    expect(Math.abs(await page.evaluate(() => scrollY) - previousCanonicalDestination)).toBeLessThanOrEqual(3);
    await context.close();
  });
}

for (const viewport of [
  { width: 430, height: 932 },
  { width: 412, height: 915 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
] as const) {
  test(`Home coarse-pointer ending remains naturally reachable at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    const finalCta = page.locator('[data-home-final-composition]');
    await finalCta.evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(650);

    let entryState: {
      ctaHeight: number;
      ctaTop: number;
      ctaVisible: number;
      footerVisible: number;
      horizontalOverflow: number;
      viewportHeight: number;
    } | null = null;
    for (let index = 0; index < 8; index += 1) {
      entryState = await page.evaluate(() => {
        const cta = document.querySelector<HTMLElement>("[data-home-final-composition]")!.getBoundingClientRect();
        const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!.getBoundingClientRect();
        const visible = (rect: DOMRect) => Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
        return {
          ctaHeight: cta.height,
          ctaTop: cta.top,
          ctaVisible: visible(cta),
          footerVisible: visible(footer),
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          viewportHeight: innerHeight,
        };
      });
      if (Math.abs(entryState.ctaTop) <= 1 && entryState.ctaVisible >= entryState.viewportHeight - 1) break;
      await touchScroll(context, page, "down");
    }
    expect(entryState).not.toBeNull();
    expect(Math.abs(entryState!.ctaTop)).toBeLessThanOrEqual(1);
    expect(entryState!.ctaHeight).toBeGreaterThanOrEqual(entryState!.viewportHeight - 1);
    expect(entryState!.ctaVisible).toBeGreaterThanOrEqual(entryState!.viewportHeight - 1);
    expect(entryState!.footerVisible).toBeLessThanOrEqual(1);
    expect(entryState!.horizontalOverflow).toBe(0);

    if (captureEvidence && viewport.width === 390) {
      await saveWebp(page, resolve(evidenceRoot, "founder-header-home-responsive-review/home-final-mobile-390.webp"));
    }

    let footerVisible = 0;
    for (let index = 0; index < 8; index += 1) {
      await touchScroll(context, page, "down");
      footerVisible = await page.locator('[data-public-shell="footer"]').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
      });
      if (footerVisible > 0) break;
    }
    expect(footerVisible).toBeGreaterThan(0);

    for (let index = 0; index < 8; index += 1) {
      if (await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2)) break;
      await touchScroll(context, page, "down");
    }
    const bottom = await page.evaluate(() => {
      const cta = document.querySelector<HTMLElement>("[data-home-final-composition]")!.getBoundingClientRect();
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!.getBoundingClientRect();
      return {
        atBottom: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2,
        footerBottom: footer.bottom,
        gap: footer.top - cta.bottom,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        lastFooterItemBottom: document.querySelector<HTMLElement>("[data-public-footer-bottom]")!.getBoundingClientRect().bottom,
        scrollY,
        viewportHeight: innerHeight,
      };
    });
    expect(bottom.atBottom).toBe(true);
    expect(Math.abs(bottom.gap)).toBeLessThanOrEqual(1);
    expect(bottom.horizontalOverflow).toBe(0);
    expect(bottom.footerBottom).toBeLessThanOrEqual(bottom.viewportHeight + 1);
    expect(bottom.lastFooterItemBottom).toBeLessThanOrEqual(bottom.viewportHeight + 1);
    expect(bottom.lastFooterItemBottom).toBeGreaterThanOrEqual(0);
    expect(await page.locator('[data-public-shell="footer"]').count()).toBe(1);
    if (captureEvidence && viewport.width === 390) {
      await saveWebp(page, resolve(evidenceRoot, "founder-header-home-responsive-review/home-mobile-footer-390.webp"));
    }
    await touchScroll(context, page, "up");
    expect(await page.evaluate((bottomY) => scrollY < bottomY - 20, bottom.scrollY)).toBe(true);
    await context.close();
  });
}
