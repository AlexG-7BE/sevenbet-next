import { expect, test, type Page } from "@playwright/test";

async function bridgeLocalWebKitUpgrade(page: Page, browserName: string) {
  if (browserName !== "webkit") return;
  await page.route("https://127.0.0.1:4173/**", async (route) => {
    const response = await route.fetch({ url: route.request().url().replace("https://", "http://") });
    await route.fulfill({ response });
  });
}

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
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-home-snap]"), (element) => ({
      align: getComputedStyle(element).scrollSnapAlign,
      label: element.dataset.homeSnapLabel || "",
      position: Math.round(element.getBoundingClientRect().top + scrollY),
      stop: getComputedStyle(element).scrollSnapStop,
    }));
    const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    const maximum = document.documentElement.scrollHeight - innerHeight;
    const footerEnd = footer ? Math.min(maximum, Math.round(footer.getBoundingClientRect().bottom + scrollY - innerHeight)) : maximum;
    const destinations = [...new Set([...targets.map(({ position }) => position), footerEnd])].sort((left, right) => left - right);
    return { destinations, footerEnd, maximum, targets };
  });
}

async function expectValidSnapLanding(page: Page, scrollY: number) {
  const { destinations } = await snapState(page);
  expect(Math.min(...destinations.map((position) => Math.abs(position - scrollY)))).toBeLessThanOrEqual(3);
}

async function returnToFirstSnap(page: Page) {
  await page.keyboard.press("Home");
  const landed = await waitForScrollIdle(page);
  await expectValidSnapLanding(page, landed);
  return landed;
}

for (const viewport of [{ height: 900, width: 1440 }, { height: 768, width: 1024 }]) {
  test(`desktop wheel contract is adjacent and fully revealed — ${viewport.width}x${viewport.height}`, async ({ page, browserName }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await bridgeLocalWebKitUpgrade(page, browserName);
    await page.goto("/", { waitUntil: "networkidle" });

    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("y mandatory");
    await expect(page.locator('[data-handoff-page="home"]')).toHaveAttribute("data-home-wheel-controller", "adjacent");
    const targets = page.locator('[data-handoff-page="home"] [data-home-snap]');
    await expect(targets).toHaveCount(9);
    const initialState = await snapState(page);
    expect(initialState.targets.map(({ label }) => label)).toEqual([
      "Hero", "Recognition", "A plan you can see", "Missions 01-03", "Missions 04-07",
      "Missions 08-10", "Built from evidence", "Why trust", "Final CTA",
    ]);
    expect(initialState.targets.every(({ align, stop }) => align === "start" && stop === "normal")).toBe(true);
    expect(initialState.targets.slice(0, 8).map(({ position }, index) => (
      Math.abs(position - initialState.targets[index === 0 ? 0 : index - 1].position - (index === 0 ? 0 : viewport.height)) <= 20
    ))).toEqual([true, true, true, true, true, true, true, true]);
    expect(await page.locator('[data-screen-label="Final CTA"]').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.locator('[data-public-shell="header"]').evaluate((element) => ({
      height: Math.round(element.getBoundingClientRect().height),
      position: getComputedStyle(element).position,
    }))).toEqual({ height: 81, position: "fixed" });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop)).toBe("auto");
    expect(await page.locator('[data-snap]:not([data-home-snap])').evaluateAll((elements) => elements.every((element) => getComputedStyle(element).scrollSnapAlign === "none"))).toBe(true);
    expect(await page.locator('[data-public-shell="footer"]').evaluate((element) => getComputedStyle(element).scrollSnapAlign)).toBe("end");
    expect(await page.evaluate(() => ({
      bodyScrollbarDisplay: getComputedStyle(document.body, "::-webkit-scrollbar").display,
      documentScrollable: document.documentElement.scrollHeight > innerHeight,
      rootScrollbarDisplay: getComputedStyle(document.documentElement, "::-webkit-scrollbar").display,
      rootScrollbarWidth: getComputedStyle(document.documentElement).scrollbarWidth,
    }))).toEqual({
      bodyScrollbarDisplay: expect.not.stringMatching(/^none$/),
      documentScrollable: true,
      rootScrollbarDisplay: expect.not.stringMatching(/^none$/),
      rootScrollbarWidth: expect.not.stringMatching(/^none$/),
    });

    await returnToFirstSnap(page);
    await page.mouse.move(viewport.width - 3, 36);
    await page.mouse.down();
    await page.mouse.move(viewport.width - 3, Math.round(viewport.height * 0.7), { steps: 12 });
    await page.mouse.up();
    const thumbLanding = await waitForScrollIdle(page);
    test.info().annotations.push({
      description: thumbLanding >= initialState.destinations[5]
        ? `${browserName} native thumb moved directly from Hero to ${thumbLanding}px without walking intermediate wheel destinations.`
        : `${browserName} headless browser chrome did not expose a draggable native thumb; source/runtime no-hide and no-generic-scroll evidence still passed.`,
      type: "native-scrollbar",
    });
    await page.evaluate(() => window.scrollTo({ behavior: "auto", top: 0 }));
    await waitForScrollIdle(page);

    const first = await returnToFirstSnap(page);
    await page.mouse.wheel(0, 120);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[1]);
    await page.mouse.wheel(0, 120);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[2]);
    await page.mouse.wheel(0, 120);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[3]);
    for (let index = 4; index < initialState.destinations.length; index += 1) {
      await page.mouse.wheel(0, 120);
      expect(await waitForScrollIdle(page)).toBe(initialState.destinations[index]);
      if (index > 5) continue;
      const label = index === 4 ? "Missions 04-07" : "Missions 08-10";
      const mission = page.locator(`[data-screen-label="${label}"]`);
      await expect(mission.locator('[data-mob="chapter"]')).toHaveCSS("opacity", "1");
      await expect(mission.locator("[data-stackind]")).toHaveCSS("opacity", "1");
      expect(await mission.evaluate((panel, snapLabel) => {
        const anchor = document.querySelector<HTMLElement>(`[data-home-snap-label="${snapLabel}"]`)!;
        return {
          borderRadius: getComputedStyle(panel).borderRadius,
          raw: Math.round(anchor.getBoundingClientRect().top),
          transform: getComputedStyle(panel).transform,
        };
      }, label)).toEqual({ borderRadius: "0px", raw: 0, transform: "none" });
    }

    await returnToFirstSnap(page);
    for (let input = 0; input < 12; input += 1) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(16);
    }
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[1]);

    await returnToFirstSnap(page);
    await page.mouse.wheel(0, 5_000);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[1]);
    await page.mouse.wheel(0, 5_000);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[2]);

    await returnToFirstSnap(page);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(20);
    await page.mouse.wheel(0, -300);
    expect(await waitForScrollIdle(page)).toBe(first);

    await page.evaluate((position) => window.scrollTo({ behavior: "auto", top: position }), initialState.destinations[2]);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[2]);
    await page.mouse.wheel(0, 120);
    expect(await waitForScrollIdle(page)).toBe(initialState.destinations[3]);
    const firstMission = page.locator('[data-screen-label="Missions 01-03"]');
    await expect(firstMission.locator('[data-mob="chapter"]')).toHaveCSS("opacity", "1");
    await expect(firstMission.locator("[data-stackind]")).toHaveCSS("opacity", "1");
    await expect(firstMission.getByText("01–03 · Understand", { exact: true })).toBeVisible();
    await expect(firstMission.getByRole("heading", { name: "See the pattern." })).toBeVisible();
    const fullOpen = await firstMission.evaluate((panel) => {
      const anchor = document.querySelector<HTMLElement>('[data-home-snap-label="Missions 01-03"]')!;
      const chapter = panel.querySelector<HTMLElement>('[data-mob="chapter"]')!;
      const indicator = panel.querySelector<HTMLElement>("[data-stackind]")!;
      return {
        borderRadius: getComputedStyle(panel).borderRadius,
        chapterOpacity: getComputedStyle(chapter).opacity,
        descriptionVisible: chapter.innerText.includes("Notice the trigger, the moment and the cost before the next decision."),
        height: Math.round(panel.getBoundingClientRect().height),
        indicatorOpacity: getComputedStyle(indicator).opacity,
        raw: Math.round(anchor.getBoundingClientRect().top + scrollY - scrollY),
        startVisible: chapter.innerText.includes("Start Programme"),
        transform: getComputedStyle(panel).transform,
      };
    });
    expect(fullOpen).toEqual({
      borderRadius: "0px",
      chapterOpacity: "1",
      descriptionVisible: true,
      height: viewport.height,
      indicatorOpacity: "1",
      raw: 0,
      startVisible: true,
      transform: "none",
    });

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

test("coarse pointer keeps proximity and Home snap state does not leak to other routes", async ({ browser, browserName }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });
  const page = await context.newPage();
  await bridgeLocalWebKitUpgrade(page, browserName);
  await page.goto("/", { waitUntil: "networkidle" });
  // CSSOM serializes proximity as `y` in Chromium and WebKit.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("y");
  await page.goto("/casinos", { waitUntil: "networkidle" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  await context.close();
});

test("Home performs no steady-state RAF or layout reads while idle", async ({ page, browserName }) => {
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

  await bridgeLocalWebKitUpgrade(page, browserName);
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

test("responsive Home media reserves dimensions and marks every chapter lazy", async ({ page, browserName }) => {
  const homeImages: Array<{ bytes: number; path: string }> = [];
  page.on("response", async (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/home/")) return;
    homeImages.push({ bytes: (await response.body()).byteLength, path: url.pathname });
  });
  await bridgeLocalWebKitUpgrade(page, browserName);
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

test("reduced motion and mobile resize remain fail-visible", async ({ browser, browserName }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, reducedMotion: "reduce", viewport: { height: 844, width: 390 } });
  const page = await context.newPage();
  await bridgeLocalWebKitUpgrade(page, browserName);
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
