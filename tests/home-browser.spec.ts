import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function localizedChapterTitleGeometry(page: Page, chapter: "04-07" | "08-10") {
  const title = page.locator(`[data-home-chapter="${chapter}"] [data-home-chapter-title]`);
  await expect(title).toBeVisible();
  return title.evaluate((element) => {
    const panel = element.closest<HTMLElement>("[data-home-chapter]");
    if (!panel) throw new Error("Home chapter title has no chapter panel");
    const range = document.createRange();
    range.selectNodeContents(element);
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    const panelRect = panel.getBoundingClientRect();
    return {
      clientWidth: element.clientWidth,
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      panelLeft: panelRect.left,
      panelRight: panelRect.right,
      scrollWidth: element.scrollWidth,
      textLeft: Math.min(...rects.map((rect) => rect.left)),
      textRight: Math.max(...rects.map((rect) => rect.right)),
      viewportWidth: window.innerWidth,
    };
  });
}

async function homeHeroPhotoTextOverlaps(page: Page) {
  const hero = page.locator('[data-screen-label="Hero"]');
  await expect(hero).toBeVisible();
  return hero.evaluate((root) => {
    const photos = Array.from(root.querySelectorAll<HTMLElement>("[data-tphoto]"));
    const copy = Array.from(root.querySelectorAll<HTMLElement>(
      "[data-home-hero-kicker], [data-home-hero-title], [data-home-hero-copy], [data-home-hero-cta]",
    ));
    return photos.flatMap((photo) => {
      const photoRect = photo.getBoundingClientRect();
      if (photoRect.width <= 0 || photoRect.height <= 0) return [];
      return copy.flatMap((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const intersections = Array.from(range.getClientRects()).map((textRect) => (
          Math.max(0, Math.min(photoRect.right, textRect.right) - Math.max(photoRect.left, textRect.left))
          * Math.max(0, Math.min(photoRect.bottom, textRect.bottom) - Math.max(photoRect.top, textRect.top))
        ));
        const area = Math.max(0, ...intersections);
        return area > 1 ? [{
          area,
          copy: element.getAttribute("data-home-hero-kicker") !== null
            ? "kicker"
            : element.getAttribute("data-home-hero-title") !== null
              ? "title"
              : element.getAttribute("data-home-hero-copy") !== null
                ? "body"
                : "cta",
          photo: photo.getAttribute("data-tphoto"),
        }] : [];
      });
    });
  });
}

async function assertHomeStructure(page: import("@playwright/test").Page) {
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/control\s*starts here/i);
  await expect(page.locator('[data-handoff-page="home"]')).toHaveCount(1);
  await expect(page.locator('[data-handoff-page="home"] [data-screen-label]')).toHaveCount(9);
  await expect(page.getByText("Need support now?", { exact: true })).toHaveCount(0);
}

test("Home critical content is visible before hydration and without IntersectionObserver", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await assertHomeStructure(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Built from evidence/i })).toBeVisible();
  const opacity = await page.getByRole("heading", { level: 1 }).evaluate((element) => getComputedStyle(element).opacity);
  expect(opacity).toBe("1");
  await context.close();
});

test("Home remains visible with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Built from evidence/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Home hero survives delayed hydration, missing IntersectionObserver and immediate capture", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined });
  });
  const page = await context.newPage();
  await page.route("**/_next/static/chunks/**", (route) => route.abort());
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  await page.screenshot({ animations: "disabled" });
  await context.close();
});

test("Home hero remains visible through client navigation and browser history", async ({ page }) => {
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "B4GAMBLE home" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.goForward({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("Home chapter actions remain keyboard operable", async ({ page }) => {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const chapters = page.locator("[data-stackpanel]");
  await expect(chapters).toHaveCount(3);
  const firstAction = chapters.first().getByRole("link", { name: "Start Programme" });
  await firstAction.focus();
  await expect(firstAction).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/program$/);
});

test("Home renders all four canonical hero crops and the primary CTA works", async ({ page }) => {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const hero = page.locator('[data-screen-label="Hero"]');
  await expect(hero.locator('[data-home-media="opening"]')).toHaveCount(4);
  expect(await hero.locator('[data-home-media="opening"] img').evaluateAll((images) => images.map((image) => ({
    complete: (image as HTMLImageElement).complete,
    naturalWidth: (image as HTMLImageElement).naturalWidth,
  })))).toEqual([
    expect.objectContaining({ complete: true, naturalWidth: expect.any(Number) }),
    expect.objectContaining({ complete: true, naturalWidth: expect.any(Number) }),
    expect.objectContaining({ complete: true, naturalWidth: expect.any(Number) }),
    expect.objectContaining({ complete: true, naturalWidth: expect.any(Number) }),
  ]);
  expect(await hero.locator('[data-home-media="opening"] img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);

  const cta = hero.getByRole("link", { name: "Start Programme" });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/program$/);
});

test("localized Home chapter titles remain inside the shared responsive mask at full display scale", async ({ page }) => {
  test.setTimeout(60_000);
  const cases = [
    { chapter: "04-07" as const, height: 700, path: "/de", width: 320 },
    { chapter: "04-07" as const, height: 768, path: "/de", width: 1366 },
    { chapter: "04-07" as const, height: 900, path: "/de", width: 1440 },
    { chapter: "04-07" as const, height: 960, path: "/de", width: 1536 },
    { chapter: "04-07" as const, height: 1080, path: "/de", width: 1920 },
    { chapter: "08-10" as const, height: 700, path: "/el", width: 320 },
    { chapter: "08-10" as const, height: 800, path: "/el", width: 360 },
  ];

  for (const item of cases) {
    await page.setViewportSize({ width: item.width, height: item.height });
    const response = await page.goto(`${baseUrl}${item.path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${item.path} at ${item.width}px`).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await localizedChapterTitleGeometry(page, item.chapter);
    expect(geometry.fontSize, `${item.path} at ${item.width}px preserves display type`).toBeGreaterThanOrEqual(43.5);
    expect(geometry.scrollWidth - geometry.clientWidth, `${item.path} at ${item.width}px title layout overflow`).toBeLessThanOrEqual(1);
    expect(geometry.textLeft, `${item.path} at ${item.width}px left mask containment`).toBeGreaterThanOrEqual(geometry.panelLeft - 1);
    expect(geometry.textRight, `${item.path} at ${item.width}px right mask containment`).toBeLessThanOrEqual(geometry.panelRight + 1);
    expect(geometry.textLeft, `${item.path} at ${item.width}px left viewport containment`).toBeGreaterThanOrEqual(-1);
    expect(geometry.textRight, `${item.path} at ${item.width}px right viewport containment`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  }
});

test("localized tablet Home hero keeps opening photos outside the copy plane", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const response = await page.goto(`${baseUrl}/el`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  expect(await homeHeroPhotoTextOverlaps(page)).toEqual([]);
});

test("Home hydrates without browser errors and keeps accessible action targets", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

  const undersizedTargets = await page.locator('main a[style*="padding"], main button').evaluateAll((targets) => targets
    .filter((target) => {
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    })
    .map((target) => ({ text: target.textContent?.trim(), rect: target.getBoundingClientRect().toJSON() })));

  expect(undersizedTargets).toEqual([]);
  expect(browserErrors).toEqual([]);
});

for (const route of [
  "/10-steps",
  "/program",
  "/responsible-gambling",
  "/casinos",
  "/bonuses",
  "/best-offers",
  "/methodology",
  "/affiliate-disclosure",
  "/about",
  "/learn",
  "/bonus-guide",
]) {
  test(`${route} remains reachable after the Home migration`, async ({ page }) => {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    expect(await page.locator("main").count()).toBeGreaterThan(0);
  });
}

test("the retired Compare destination consolidates into Casinos", async ({ page }) => {
  await page.goto(`${baseUrl}/compare?casino=demo-northstar&country=GB`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/casinos\?casino=demo-northstar&country=GB/);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 640, height: 800 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 800 },
  { width: 320, height: 720 },
]) {
  test(`Home follows the approved order and reflows at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await assertHomeStructure(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const order = await page.locator('[data-handoff-page="home"] [data-screen-label]').evaluateAll((sections) => sections.map((section) => section.getAttribute("data-screen-label")));
    expect(order).toEqual(["Hero", "Recognition", "A plan you can see", "Missions 01-03", "Missions 04-07", "Missions 08-10", "Built from evidence", "Why trust", "Final CTA"]);
    if (viewport.width === 375) {
      await expect(page.locator('[data-screen-label="Hero"]').getByRole("link", { name: "Start Programme" })).toBeVisible();
    }
    await page.close();
  });
}

test("Home uses the Public Shell mobile menu without duplicating navigation", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site navigation" })).not.toBeVisible();
  await expect(menu).toBeFocused();
  await page.close();
});
