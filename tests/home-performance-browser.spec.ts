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

for (const viewport of [{ height: 900, width: 1440 }, { height: 768, width: 1024 }]) {
  test(`desktop Home scrolls freely and the chapters open under the reader's scroll — ${viewport.width}x${viewport.height}`, async ({ page, browserName }) => {
    // Founder, 11 Oct 2026: with a mouse or a trackpad nothing pages Home and nothing snaps it.
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await bridgeLocalWebKitUpgrade(page, browserName);
    await page.goto("/", { waitUntil: "networkidle" });

    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
    const home = page.locator('[data-handoff-page="home"]');
    await expect(home).toHaveAttribute("data-home-interactions", "ready");
    await expect(home).not.toHaveAttribute("data-home-wheel-controller", /.*/);
    const initialState = await snapState(page);
    expect(initialState.targets.map(({ label }) => label)).toEqual([
      "Hero", "Recognition", "A plan you can see", "Missions 01-03", "Missions 04-07",
      "Missions 08-10", "Built from evidence", "Why trust", "Final CTA",
    ]);
    expect(initialState.targets.slice(0, 8).map(({ position }, index) => (
      Math.abs(position - initialState.targets[index === 0 ? 0 : index - 1].position - (index === 0 ? 0 : viewport.height)) <= 20
    ))).toEqual([true, true, true, true, true, true, true, true]);
    expect(await page.locator('[data-public-shell="header"]').evaluate((element) => ({
      height: Math.round(element.getBoundingClientRect().height),
      position: getComputedStyle(element).position,
    }))).toEqual({ height: 81, position: "fixed" });
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

    // The wheel moves the page by what it asks for and the page stays there.
    await page.mouse.move(Math.round(viewport.width / 2), Math.round(viewport.height / 2));
    await page.mouse.wheel(0, 300);
    expect(await waitForScrollIdle(page)).toBe(300);
    await page.mouse.wheel(0, 120);
    expect(await waitForScrollIdle(page)).toBe(420);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(420);
    await page.mouse.wheel(0, -420);
    expect(await waitForScrollIdle(page)).toBe(0);

    // The first chapter grows out of "A plan you can see". Sticky positioning holds it in the
    // middle of the screen wherever the reader stops; its words arrive as the photo fills it.
    const plan = initialState.targets[2].position;
    const firstMission = page.locator('[data-screen-label="Missions 01-03"]');
    const opening = async (share: number) => {
      await page.evaluate((top) => window.scrollTo({ behavior: "instant", top }), plan + Math.round(viewport.height * share));
      await page.waitForTimeout(650);
      return firstMission.evaluate((panel) => {
        const rect = panel.getBoundingClientRect();
        const matrix = new DOMMatrixReadOnly(getComputedStyle(panel).transform);
        return {
          centre: Math.round(rect.top + rect.height / 2),
          copy: getComputedStyle(panel.querySelector<HTMLElement>('[data-mob="chapter"]')!).opacity,
          opacity: getComputedStyle(panel).opacity,
          scale: Number(matrix.a.toFixed(2)),
          shift: Math.round(Math.hypot(matrix.e, matrix.f)),
        };
      });
    };
    const centre = Math.round(viewport.height / 2);
    expect(await opening(0)).toEqual({ centre, copy: "0", opacity: "0", scale: 1, shift: 0 });
    const quarter = await opening(0.25);
    expect(quarter).toEqual({ centre, copy: "0", opacity: "1", scale: quarter.scale, shift: 0 });
    expect(quarter.scale).toBeGreaterThan(0.3);
    expect(quarter.scale).toBeLessThan(0.45);
    const half = await opening(0.5);
    expect(half).toEqual({ centre, copy: "0", opacity: "1", scale: 0.62, shift: 0 });
    const nearlyOpen = await opening(0.92);
    expect(nearlyOpen).toEqual({ centre, copy: "1", opacity: "1", scale: nearlyOpen.scale, shift: 0 });
    expect(nearlyOpen.scale).toBeGreaterThan(0.97);

    // Each chapter is whole where its anchor is, and the next one slides over it.
    for (const label of ["Missions 01-03", "Missions 04-07", "Missions 08-10"]) {
      const position = initialState.targets.find((target) => target.label === label)!.position;
      await page.evaluate((top) => window.scrollTo({ behavior: "instant", top }), position);
      await page.waitForTimeout(650);
      const mission = page.locator(`[data-screen-label="${label}"]`);
      await expect(mission.locator('[data-mob="chapter"]')).toHaveCSS("opacity", "1");
      await expect(mission.locator("[data-stackind]")).toHaveCSS("opacity", "1");
      expect(await mission.evaluate((panel) => ({
        borderRadius: getComputedStyle(panel).borderRadius,
        height: Math.round(panel.getBoundingClientRect().height),
        top: Math.round(panel.getBoundingClientRect().top),
        transform: getComputedStyle(panel).transform,
      }))).toEqual({ borderRadius: "0px", height: viewport.height, top: 0, transform: "none" });
    }
    await expect(firstMission.getByText("01–03 · Understand", { exact: true })).toBeAttached();

    await page.evaluate(() => window.scrollTo({ behavior: "instant", top: 0 }));
    await waitForScrollIdle(page);
    await page.keyboard.press("End");
    await waitForScrollIdle(page);
    const ending = await page.evaluate(() => ({
      documentHeight: document.documentElement.scrollHeight,
      footerVisible: (() => {
        const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')?.getBoundingClientRect();
        return footer ? Math.max(0, Math.min(innerHeight, footer.bottom) - Math.max(0, footer.top)) : 0;
      })(),
      viewportBottom: scrollY + innerHeight,
    }));
    expect(ending.viewportBottom).toBeGreaterThanOrEqual(ending.documentHeight - 2);
    expect(ending.footerVisible).toBeGreaterThan(0);
    await page.keyboard.press("Home");
    expect(await waitForScrollIdle(page)).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("phones scroll Home freely through compact chapters and snap state does not leak to other routes", async ({ browser, browserName }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });
  const page = await context.newPage();
  await bridgeLocalWebKitUpgrade(page, browserName);
  await page.goto("/", { waitUntil: "networkidle" });
  // Founder, 24 Sep 2026: below 760px the three chapters are compact cards in normal flow,
  // so the page neither snaps nor pins them, and one primary action follows them.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  const chapters = page.locator('[data-handoff-page="home"] [data-stackpanel]');
  await expect(chapters).toHaveCount(3);
  expect(await chapters.evaluateAll((panels) => panels.map((panel) => {
    const style = getComputedStyle(panel);
    return { opacity: style.opacity, position: style.position, shorterThanScreen: panel.getBoundingClientRect().height < innerHeight };
  }))).toEqual(Array.from({ length: 3 }, () => ({ opacity: "1", position: "relative", shorterThanScreen: true })));
  await expect(page.locator("[data-home-chapters-cta] a")).toBeVisible();
  await expect(page.locator('[data-stackpanel] [data-mob="chapter"] > a').first()).toBeHidden();
  await page.goto("/casinos", { waitUntil: "networkidle" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  await context.close();
});

test("a fresh visit opens Home at the top and nothing snaps behind the loading frame", async ({ page, browserName }) => {
  // Founder, 5 Oct 2026: a fresh visit opened Home about one frame-height down. The streamed
  // page's snap rules applied while its loading frame was on screen, and the footer was the
  // only snap area left.
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.addInitScript(() => {
    const tracked = window as typeof window & { __homeMaxScrollY?: number };
    tracked.__homeMaxScrollY = 0;
    window.addEventListener("scroll", () => {
      tracked.__homeMaxScrollY = Math.max(tracked.__homeMaxScrollY ?? 0, window.scrollY);
    }, { passive: true });
  });
  await bridgeLocalWebKitUpgrade(page, browserName);
  await page.goto("/", { waitUntil: "networkidle" });
  await waitForScrollIdle(page);
  expect(await page.evaluate(() => ({
    maximum: (window as typeof window & { __homeMaxScrollY?: number }).__homeMaxScrollY,
    now: window.scrollY,
  }))).toEqual({ maximum: 0, now: 0 });

  expect(await page.evaluate(() => {
    const frame = document.createElement("div");
    frame.setAttribute("data-route-loading", "");
    document.body.append(frame);
    const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    const behindFrame = {
      footerAlign: footer ? getComputedStyle(footer).scrollSnapAlign : "missing",
      rootType: getComputedStyle(document.documentElement).scrollSnapType,
    };
    frame.remove();
    return { afterFrame: getComputedStyle(document.documentElement).scrollSnapType, behindFrame };
  })).toEqual({ afterFrame: "none", behindFrame: { footerAlign: "none", rootType: "none" } });
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
