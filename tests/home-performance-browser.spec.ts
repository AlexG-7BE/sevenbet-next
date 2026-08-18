import { expect, test } from "@playwright/test";

test("desktop wheel and keyboard scrolling remain browser controlled", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    (window as typeof window & { __homeWheelPrevented?: boolean }).__homeWheelPrevented = false;
    window.addEventListener("wheel", (event) => {
      (window as typeof window & { __homeWheelPrevented?: boolean }).__homeWheelPrevented = event.defaultPrevented;
    }, { once: true });
  });

  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(120);
  const immediate = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(650);
  const settled = await page.evaluate(() => ({
    prevented: (window as typeof window & { __homeWheelPrevented?: boolean }).__homeWheelPrevented,
    scrollY: window.scrollY,
  }));

  expect(immediate).toBeGreaterThan(0);
  expect(settled.prevented).toBe(false);
  expect(Math.abs(settled.scrollY - immediate)).toBeLessThan(80);

  const beforeKeyboard = settled.scrollY;
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeKeyboard + 100);
});

test("Home performs no steady-state RAF or layout reads while idle", async ({ page }) => {
  await page.addInitScript(() => {
    const counters = { height: 0, raf: 0, rect: 0, style: 0 };
    (window as typeof window & { __homePerfCounters?: typeof counters }).__homePerfCounters = counters;
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
      counters.rect += 1;
      return rect.call(this);
    };
    const computedStyle = window.getComputedStyle;
    window.getComputedStyle = function getComputedStyle(...args) {
      counters.style += 1;
      return computedStyle.apply(this, args);
    };
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    if (height?.get) {
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        configurable: true,
        get() {
          counters.height += 1;
          return height.get?.call(this);
        },
      });
    }
    const requestFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = function requestAnimationFrame(callback) {
      return requestFrame.call(this, (time) => {
        counters.raf += 1;
        callback(time);
      });
    };
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1_000);
  await page.evaluate(() => {
    const counters = (window as typeof window & { __homePerfCounters?: { height: number; raf: number; rect: number; style: number } }).__homePerfCounters;
    if (counters) Object.assign(counters, { height: 0, raf: 0, rect: 0, style: 0 });
  });
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as typeof window & { __homePerfCounters?: object }).__homePerfCounters)).toEqual({
    height: 0,
    raf: 0,
    rect: 0,
    style: 0,
  });
});

test("responsive Home media reserves dimensions and marks every chapter lazy", async ({ page }) => {
  const homeImages: Array<{ bytes: number; path: string }> = [];
  page.on("response", async (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/home/")) return;
    homeImages.push({ bytes: (await response.body()).byteLength, path: url.pathname });
  });
  await page.goto("/", { waitUntil: "networkidle" });

  const opening = page.locator('[data-home-media="opening"] img');
  const chapters = page.locator('[data-home-media="chapter"] img');
  await expect(opening).toHaveCount(4);
  await expect(chapters).toHaveCount(3);
  expect(await opening.evaluateAll((images) => images.every((image) => (
    (image as HTMLImageElement).loading === "eager"
    && Number(image.getAttribute("width")) > 0
    && Number(image.getAttribute("height")) > 0
  )))).toBe(true);
  expect(await chapters.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).loading === "lazy"))).toBe(true);
  expect(homeImages.some(({ path }) => path.endsWith(".jpg"))).toBe(false);
  expect(homeImages.reduce((total, image) => total + image.bytes, 0)).toBeLessThan(1_000_000);
});

test("reduced motion and mobile resize remain fail-visible", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, reducedMotion: "reduce", viewport: { height: 844, width: 390 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator('[data-handoff-page="home"]')).toHaveAttribute("data-home-interactions", "fallback");
  expect(await page.locator("[data-rise]").evaluateAll((elements) => elements.every((element) => getComputedStyle(element).opacity === "1"))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).not.toContain("mandatory");
  // Development hot reload emits nonce/hydration diagnostics before the page is
  // ready. This assertion covers the resize and scroll interaction under test.
  errors.length = 0;
  await page.setViewportSize({ height: 900, width: 430 });
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
  await context.close();
});
