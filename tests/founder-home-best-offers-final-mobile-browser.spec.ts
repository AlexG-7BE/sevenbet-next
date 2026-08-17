import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { resolve } from "node:path";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const captureEvidence = process.env.UPDATE_FOUNDER_EVIDENCE === "1";
const homeEvidenceRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-home-mobile-polish");
const offersEvidenceRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-best-offers-mobile-polish");
const mobileViewports = [
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
] as const;

async function saveWebp(buffer: Buffer, path: string) {
  if (!captureEvidence) return;
  await sharp(buffer).webp({ quality: 86 }).toFile(path);
}

async function capturePage(page: Page, path: string, fullPage = false) {
  await saveWebp(await page.screenshot({ animations: "disabled", fullPage }), path);
}

async function captureLocator(locator: Locator, path: string) {
  await saveWebp(await locator.screenshot({ animations: "disabled" }), path);
}

async function withEvidenceChromeHidden(page: Page, capture: () => Promise<void>) {
  if (!captureEvidence) return;
  const chrome = page.locator('[data-public-shell="header"],a[href="#main-content"]');
  const hiddenStates = await chrome.evaluateAll((elements) => elements.map((element) => (element as HTMLElement).hidden));
  await chrome.evaluateAll((elements) => elements.forEach((element) => { (element as HTMLElement).hidden = true; }));
  try {
    await capture();
  } finally {
    await chrome.evaluateAll((elements, states) => elements.forEach((element, index) => { (element as HTMLElement).hidden = states[index] ?? false; }), hiddenStates);
  }
}

async function captureLocatorWithoutChrome(page: Page, locator: Locator, path: string) {
  await withEvidenceChromeHidden(page, () => captureLocator(locator, path));
}

async function captureViewportAtWithoutChrome(page: Page, locator: Locator, path: string) {
  if (!captureEvidence) return;
  await locator.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(250);
  await withEvidenceChromeHidden(page, () => capturePage(page, path));
}

async function touchScroll(context: BrowserContext, page: Page, direction: "down" | "up") {
  const viewport = page.viewportSize()!;
  const session = await context.newCDPSession(page);
  await session.send("Input.synthesizeScrollGesture", {
    x: Math.round(viewport.width / 2),
    y: direction === "down" ? viewport.height - 110 : 110,
    yDistance: direction === "down" ? -Math.round(viewport.height * .72) : Math.round(viewport.height * .72),
    speed: 900,
    gestureSourceType: "touch",
  });
  await session.detach();
  await page.waitForTimeout(450);
}

async function isInViewport(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  });
}

test("Home coarse-pointer snap sequence escapes the final CTA into the complete footer", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const finalCta = page.locator('[data-screen-label="Final CTA"]');
  const footer = page.locator('[data-public-shell="footer"]');
  const footerBottom = page.locator("[data-public-footer-bottom]");

  await expect(page.locator('[data-handoff-page="home"]')).toHaveAttribute("data-home-interactions", "ready");
  await expect(finalCta).toBeAttached();
  expect(await footer.evaluate((element) => getComputedStyle(element).scrollSnapAlign)).toBe("start");
  expect(await footerBottom.evaluate((element) => getComputedStyle(element).scrollSnapAlign)).toBe("end");

  for (let index = 0; index < 28 && !(await isInViewport(finalCta)); index += 1) await touchScroll(context, page, "down");
  expect(await isInViewport(finalCta)).toBe(true);
  await finalCta.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(450);
  await capturePage(page, resolve(homeEvidenceRoot, "home-final-cta-390.webp"));

  for (let index = 0; index < 5 && !(await isInViewport(footer)); index += 1) await touchScroll(context, page, "down");
  expect(await isInViewport(footer)).toBe(true);
  await footer.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(450);
  await capturePage(page, resolve(homeEvidenceRoot, "home-footer-reachable-390.webp"));

  for (let index = 0; index < 5; index += 1) {
    const atBottom = await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2);
    if (atBottom) break;
    await touchScroll(context, page, "down");
  }
  const bottomState = await page.evaluate(() => ({
    atBottom: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    scrollY,
  }));
  expect(bottomState.atBottom).toBe(true);
  expect(bottomState.horizontalOverflow).toBe(0);
  await capturePage(page, resolve(homeEvidenceRoot, "home-footer-bottom-390.webp"));

  await touchScroll(context, page, "up");
  expect(await page.evaluate((bottomY) => scrollY < bottomY - 20, bottomState.scrollY)).toBe(true);
  await context.close();
});

for (const viewport of mobileViewports) {
  test(`Home final CTA and footer stay usable at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-screen-label="Final CTA"]').evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(250);
    const footer = page.locator('[data-public-shell="footer"]');
    for (let index = 0; index < 5 && !(await isInViewport(footer)); index += 1) await touchScroll(context, page, "down");
    expect(await isInViewport(footer)).toBe(true);
    for (let index = 0; index < 8; index += 1) {
      if (await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2)) break;
      await touchScroll(context, page, "down");
    }
    expect(await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight))).toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await context.close();
  });
}

for (const viewport of mobileViewports) {
  test(`Best Offers mobile decision hierarchy is compact and complete at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-runtime-renderer="best-offers"]')).toHaveCount(1);
    await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

    const hero = page.locator('[data-runtime-renderer="best-offers"] > section').first();
    await expect(hero.getByRole("heading", { level: 1 })).toContainText("Three picks.Not thirty.");
    expect(await hero.getByText("50+", { exact: true }).isVisible()).toBe(false);
    await expect(hero.getByRole("link", { name: "How we test →" })).toBeVisible();
    expect(await hero.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(viewport.height * .72);

    const topThree = page.locator("#shortlist");
    const featured = page.getByTestId("best-offer-product-card");
    const alternatives = page.getByTestId("ranked-offer-card");
    await expect(featured).toBeVisible();
    await expect(alternatives).toHaveCount(2);
    expect(await featured.locator('[aria-hidden="true"]').filter({ hasText: "media" }).isVisible()).toBe(false);

    const featuredTerms = featured.locator("dl[aria-label$='material offer terms']");
    await expect(featuredTerms.locator("dt")).toHaveCount(4);
    await expect(featuredTerms).toBeVisible();
    const topGeometry = await featured.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const terms = element.querySelector<HTMLElement>("dl[aria-label$='material offer terms']")!;
      const actions = [...element.querySelectorAll<HTMLElement>("a,button,[class*='unavailableAction']")].filter((item) => item.getClientRects().length);
      return {
        left: rect.left,
        right: rect.right,
        termsBottom: terms.getBoundingClientRect().bottom,
        firstActionTop: Math.min(...actions.map((item) => item.getBoundingClientRect().top)),
      };
    });
    expect(topGeometry.left).toBeGreaterThanOrEqual(23);
    expect(topGeometry.right).toBeLessThanOrEqual(viewport.width - 23);
    expect(topGeometry.firstActionTop).toBeGreaterThanOrEqual(topGeometry.termsBottom - 1);

    for (let index = 0; index < 2; index += 1) {
      const card = alternatives.nth(index);
      await expect(card.locator("dl[aria-label$='material offer terms']")).toBeVisible();
      expect(await card.locator('[aria-hidden="true"]').filter({ hasText: "media" }).isVisible()).toBe(false);
      expect(await card.evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(viewport.width - 48);
    }

    const visibleTermDefects = await topThree.locator("dl[aria-label$='material offer terms'] dt,dl[aria-label$='material offer terms'] dd").evaluateAll((elements) => elements
      .filter((element) => element.getClientRects().length)
      .filter((element) => {
        const style = getComputedStyle(element);
        return Number.parseFloat(style.fontSize) < 14 || style.textOverflow === "ellipsis" || style.whiteSpace === "nowrap" || element.scrollWidth > element.clientWidth + 1;
      })
      .map((element) => ({ text: element.textContent, style: getComputedStyle(element).cssText })));
    expect(visibleTermDefects).toEqual([]);

    const controls = page.locator("#shortlist a,#shortlist button");
    const undersizedControls = await controls.evaluateAll((elements) => elements
      .filter((element) => element.getClientRects().length)
      .map((element) => ({ height: element.getBoundingClientRect().height, text: element.textContent?.trim() }))
      .filter((item) => item.height < 44));
    expect(undersizedControls).toEqual([]);

    const sequence = await page.evaluate(() => {
      const top = document.querySelector<HTMLElement>("#shortlist")!;
      const why = [...document.querySelectorAll<HTMLElement>("section")].find((section) => section.textContent?.includes("Why we picked these"))!;
      const faq = [...document.querySelectorAll<HTMLElement>("section")].find((section) => section.textContent?.includes("Before you click"))!;
      const visibleDemoNotices = [...top.querySelectorAll<HTMLElement>("p")].filter((item) => item.textContent?.includes("DEMONSTRATION DATA") && item.getClientRects().length).length;
      return {
        faqAfterMethod: faq.offsetTop > why.offsetTop,
        methodAfterChoices: why.offsetTop > top.offsetTop + top.offsetHeight - 2,
        visibleDemoNotices,
      };
    });
    expect(sequence).toEqual({ faqAfterMethod: true, methodAfterChoices: true, visibleDemoNotices: 0 });
    await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
    await expect(page.locator("#shortlist p").filter({ hasText: "Affiliate compensation does not determine Editor Score or natural editorial ranking." })).toBeVisible();
    await expect(page.locator("details").first()).not.toHaveAttribute("open", "");
    await expect(page.locator('[data-runtime-renderer="best-offers"] section').last()).toBeHidden();

    if (captureEvidence && viewport.width === 390) {
      await page.evaluate(() => scrollTo(0, 0));
      await capturePage(page, resolve(offersEvidenceRoot, "01-hero-390.webp"));
      await captureLocatorWithoutChrome(page, featured, resolve(offersEvidenceRoot, "02-top1-390.webp"));
      await captureLocatorWithoutChrome(page, alternatives.nth(0), resolve(offersEvidenceRoot, "03-top2-390.webp"));
      await captureLocatorWithoutChrome(page, alternatives.nth(1), resolve(offersEvidenceRoot, "04-top3-390.webp"));
      await captureViewportAtWithoutChrome(page, page.locator("#shortlist section").last(), resolve(offersEvidenceRoot, "05-worth-a-look-390.webp"));
      const methodology = page.locator("section").filter({ hasText: "Why we picked these" }).first();
      await captureLocatorWithoutChrome(page, methodology, resolve(offersEvidenceRoot, "06-methodology-390.webp"));
    }
    if (captureEvidence && (viewport.width === 360 || viewport.width === 430)) {
      await withEvidenceChromeHidden(page, () => capturePage(page, resolve(offersEvidenceRoot, `best-offers-${viewport.width}.webp`), true));
    }
    await context.close();
  });
}

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
] as const) {
  test(`Best Offers desktop/tablet information architecture remains present at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-runtime-renderer="best-offers"]')).toHaveCount(1);
    await expect(page.locator(".does-not-exist")).toHaveCount(0);
    await expect(page.getByText("50+", { exact: true })).toBeVisible();
    await expect(page.getByText("Tested with real money — our own", { exact: true })).toBeVisible();
    await expect(page.locator("#shortlist").getByText("Fast payouts", { exact: true })).toBeVisible();
    await expect(page.locator("section").filter({ hasText: "Still here? The answer hasn't changed." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
