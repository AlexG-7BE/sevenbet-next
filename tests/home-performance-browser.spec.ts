import { expect, test, type Page } from "@playwright/test";

async function waitForScrollIdle(page: Page) {
  let previous = await page.evaluate(() => window.scrollY);
  let stableReads = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.waitForTimeout(50);
    const current = await page.evaluate(() => window.scrollY);
    stableReads = Math.abs(current - previous) <= 1 ? stableReads + 1 : 0;
    if (stableReads >= 4) return current;
    previous = current;
  }
  return previous;
}

async function snapState(page: Page) {
  return page.evaluate(() => {
    const targetPositions = Array.from(document.querySelectorAll<HTMLElement>("[data-home-snap]"), (element) => (
      Math.round(element.getBoundingClientRect().top + scrollY)
    ));
    const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    const maximum = document.documentElement.scrollHeight - innerHeight;
    const footerEnd = footer ? Math.min(maximum, Math.round(footer.getBoundingClientRect().bottom + scrollY - innerHeight)) : maximum;
    return { footerEnd, maximum, targetPositions };
  });
}

async function expectValidSnapLanding(page: Page, scrollY: number) {
  const { footerEnd, targetPositions } = await snapState(page);
  expect(Math.min(...[...targetPositions, footerEnd].map((position) => Math.abs(position - scrollY)))).toBeLessThanOrEqual(3);
}

async function returnToFirstSnap(page: Page) {
  await page.keyboard.press("Home");
  const landed = await waitForScrollIdle(page);
  await expectValidSnapLanding(page, landed);
  return landed;
}

for (const viewport of [{ height: 900, width: 1440 }, { height: 768, width: 1024 }]) {
  test(`desktop mandatory snap lands native input at valid screens — ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/", { waitUntil: "networkidle" });

    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("y mandatory");
    const targets = page.locator('[data-handoff-page="home"] [data-home-snap]');
    await expect(targets).toHaveCount(9);
    expect(await targets.evaluateAll((elements) => elements.map((element) => ({
      align: getComputedStyle(element).scrollSnapAlign,
      height: Math.round(element.getBoundingClientRect().height),
      label: element.getAttribute("data-screen-label"),
      marginTop: getComputedStyle(element).scrollMarginTop,
      stop: getComputedStyle(element).scrollSnapStop,
    })))).toEqual([
      { align: "start", height: viewport.height, label: "Hero", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "Recognition", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "A plan you can see", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "Missions 01-03", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "Missions 04-07", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "Missions 08-10", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "Built from evidence", marginTop: "0px", stop: "normal" },
      { align: "start", height: viewport.height, label: "Why trust", marginTop: "0px", stop: "normal" },
      { align: "start", height: expect.any(Number), label: "Final CTA", marginTop: "0px", stop: "normal" },
    ]);
    expect(await targets.last().evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.locator('[data-public-shell="header"]').evaluate((element) => ({
      height: Math.round(element.getBoundingClientRect().height),
      position: getComputedStyle(element).position,
    }))).toEqual({ height: 81, position: "fixed" });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop)).toBe("auto");
    expect(await page.locator('[data-snap]:not([data-home-snap])').evaluateAll((elements) => elements.every((element) => getComputedStyle(element).scrollSnapAlign === "none"))).toBe(true);
    expect(await page.locator('[data-public-shell="footer"]').evaluate((element) => getComputedStyle(element).scrollSnapAlign)).toBe("end");

    const first = await returnToFirstSnap(page);
    await page.evaluate(() => {
      (window as typeof window & { __homeWheelPrevented?: boolean }).__homeWheelPrevented = false;
      window.addEventListener("wheel", (event) => {
        (window as typeof window & { __homeWheelPrevented?: boolean }).__homeWheelPrevented = event.defaultPrevented;
      }, { once: true });
    });
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(20);
    expect(await page.evaluate(() => window.scrollY)).not.toBe(first);
    const small = await waitForScrollIdle(page);
    await expectValidSnapLanding(page, small);
    expect(await page.evaluate(() => (window as typeof window & { __homeWheelPrevented?: boolean }).__homeWheelPrevented)).toBe(false);

    await returnToFirstSnap(page);
    for (let input = 0; input < 3; input += 1) {
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(50);
    }
    await expectValidSnapLanding(page, await waitForScrollIdle(page));

    await returnToFirstSnap(page);
    await page.mouse.wheel(0, 420);
    await expectValidSnapLanding(page, await waitForScrollIdle(page));

    await returnToFirstSnap(page);
    await page.mouse.wheel(0, 1_200);
    const large = await waitForScrollIdle(page);
    await expectValidSnapLanding(page, large);
    expect(large).toBeGreaterThan(first);

    await returnToFirstSnap(page);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(20);
    const beforeReverse = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(20);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(beforeReverse);
    const reversed = await waitForScrollIdle(page);
    await expectValidSnapLanding(page, reversed);
    expect(reversed).toBeLessThanOrEqual(first + 3);

    await returnToFirstSnap(page);
    await page.keyboard.press("PageDown");
    const pageDown = await waitForScrollIdle(page);
    await expectValidSnapLanding(page, pageDown);
    expect(pageDown).toBeGreaterThan(first);
    await page.keyboard.press("PageUp");
    const pageUp = await waitForScrollIdle(page);
    await expectValidSnapLanding(page, pageUp);
    expect(pageUp).toBeLessThan(pageDown);

    await page.keyboard.press("End");
    const end = await waitForScrollIdle(page);
    const ending = await page.evaluate(() => ({
      documentHeight: document.documentElement.scrollHeight,
      footerVisible: (() => {
        const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')?.getBoundingClientRect();
        return footer ? Math.max(0, Math.min(innerHeight, footer.bottom) - Math.max(0, footer.top)) : 0;
      })(),
      viewportBottom: scrollY + innerHeight,
    }));
    expect(end).toBe((await snapState(page)).footerEnd);
    expect(ending.viewportBottom).toBeGreaterThanOrEqual(ending.documentHeight - 2);
    expect(ending.footerVisible).toBeGreaterThan(0);

    await page.keyboard.press("Home");
    expect(await waitForScrollIdle(page)).toBe(first);
    expect(errors).toEqual([]);
  });
}

test("coarse pointer keeps proximity and Home snap state does not leak to other routes", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  // CSSOM serializes proximity as `y` in Chromium and WebKit.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("y");
  await page.getByRole("link", { name: "Casinos", exact: true }).first().click();
  await expect(page).toHaveURL(/\/casinos$/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  await context.close();
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
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  // Development hot reload emits nonce/hydration diagnostics before the page is
  // ready. This assertion covers the resize and scroll interaction under test.
  errors.length = 0;
  await page.setViewportSize({ height: 900, width: 430 });
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
  await context.close();
});
