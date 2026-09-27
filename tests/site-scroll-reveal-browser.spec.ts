import { devices, expect, test, type Browser, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const phone = devices["Pixel 7"];
// Offers, reviews and partner actions are what earn: they never wait for motion.
const COMMERCIAL_SURFACES = "[data-commercial-best-offer-card], [data-commercial-bonus-card], [data-commercial-casino-card], [data-review-primary], [data-commercial-action-placement], a[href^='/r/']";

async function revealStates(page: Page) {
  return page.locator("[data-motion-reveal]").evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return {
      duration: style.transitionDuration,
      opacity: Number(style.opacity),
      state: element.getAttribute("data-motion-state"),
      top: element.getBoundingClientRect().top,
      transform: style.transform,
    };
  }));
}

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top <= height; top += 360) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(700);
}

test("sections rise once on a phone, never hide the first screen and keep offers static", async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext(phone);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-site-motion", "ready");

  const initial = await revealStates(page);
  expect(initial.length).toBeGreaterThanOrEqual(8);
  const viewportHeight = page.viewportSize()!.height;
  expect(initial.filter((state) => state.state === "pending" && state.top < viewportHeight * .9), "first screen hidden").toHaveLength(0);
  const pending = initial.filter((state) => state.state === "pending");
  expect(pending.length).toBeGreaterThan(0);
  expect(pending.every((state) => state.opacity === 0 && state.transform === "matrix(1, 0, 0, 1, 0, 16)")).toBe(true);

  // The offer panel and every outbound action are never gated behind motion.
  expect(await page.locator("#current-offer > div").evaluate((element) => element.closest("[data-motion-reveal]"))).toBeNull();
  expect(await page.locator(`[data-motion-reveal] :is(${COMMERCIAL_SURFACES})`).count()).toBe(0);

  // A visitor who reads the first screen for a while still gets the rise further down.
  await page.waitForTimeout(4_500);
  expect((await revealStates(page)).filter((state) => state.state === "pending")).toHaveLength(pending.length);

  await scrollThrough(page);
  const revealed = await revealStates(page);
  expect(revealed.every((state) => state.state === "visible" && state.opacity > .99), "every section revealed").toBe(true);
  expect(revealed.every((state) => state.duration === "0.45s")).toBe(true);
  await context.close();
});

test("offer pages never place an offer card or partner action inside a rising block", async ({ page }) => {
  for (const path of ["/best-offers", "/bonuses", "/casinos"]) {
    await page.goto(`${baseUrl}${path}?visualFixture=true&qaMarket=DK`, { waitUntil: "networkidle" });
    expect(await page.locator("[data-motion-reveal]").count(), path).toBeGreaterThan(0);
    const surfaces = await page.locator(COMMERCIAL_SURFACES).evaluateAll((elements) => elements.map((element) => Boolean(element.closest("[data-motion-reveal]"))));
    expect(surfaces.length, `${path} renders offer surfaces`).toBeGreaterThan(0);
    expect(surfaces.filter(Boolean), `${path} offer surfaces inside a rising block`).toHaveLength(0);
  }
});

async function expectFailVisible(browser: Browser, options: { noObserver?: boolean; reducedMotion?: "reduce" }) {
  const context = await browser.newContext({ ...phone, reducedMotion: options.reducedMotion });
  if (options.noObserver) await context.addInitScript(() => Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined }));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
  const states = await revealStates(page);
  expect(states.length).toBeGreaterThan(4);
  expect(states.every((state) => state.opacity > .99 && state.state !== "pending")).toBe(true);
  await context.close();
}

test("rising headings fail visible without IntersectionObserver and under reduced motion", async ({ browser }) => {
  await expectFailVisible(browser, { noObserver: true });
  await expectFailVisible(browser, { reducedMotion: "reduce" });
});
