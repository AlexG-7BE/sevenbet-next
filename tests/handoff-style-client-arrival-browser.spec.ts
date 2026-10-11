import { devices, expect, test, type Page } from "@playwright/test";

// Home and the Learn hub carry their stylesheet inline, under the Content-Security-Policy nonce.
// The nonce belongs to the document; a page that arrives by client transition was rendered by a
// later request. Until 11 October 2026 the browser refused its stylesheet: Home reached from
// another page showed the full-screen pinned chapters on a phone and lost its paging on desktop.

type MarkedWindow = Window & { __handoffStyleDocument?: string };

async function hydrated(page: Page) {
  await expect(page.locator("[data-public-shell='header'][data-theme-controller='ready']")).toHaveCount(1);
}

function observePolicyErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Content Security Policy")) errors.push(message.text());
  });
  return errors;
}

async function homeFacts(page: Page) {
  return page.evaluate(() => {
    const style = (element: Element | null) => (element ? getComputedStyle(element) : null);
    const theatre = document.querySelector<HTMLElement>('[data-handoff-page="home"] [data-screen-label="A plan you can see"]');
    return {
      loading: Boolean(document.querySelector("[data-route-loading]")),
      rules: document.querySelector<HTMLStyleElement>('[data-handoff-page="home"] > style')?.sheet?.cssRules.length ?? 0,
      pageHeight: document.documentElement.scrollHeight,
      scrollSnap: style(document.documentElement)?.scrollSnapType ?? null,
      chaptersPosition: style(theatre)?.position ?? null,
      chaptersHeight: theatre ? Math.round(theatre.getBoundingClientRect().height) : null,
      chaptersAction: style(document.querySelector("[data-home-chapters-cta]"))?.display ?? null,
      firstChapter: style(document.querySelector("[data-stackpanel]"))?.position ?? null,
    };
  });
}

async function openLearn(page: Page, phone: boolean) {
  if (phone) {
    await page.locator("details[data-public-mobile-disclosure] > summary").click();
    await page.locator('#public-mobile-navigation a[data-navigation-href="/learn"]').first().click();
  } else {
    await page.locator('nav[aria-label="Primary navigation"] a[data-navigation-href="/learn"]').click();
  }
  await expect(page.locator('[data-handoff-page="learn"]')).toBeVisible();
}

for (const viewport of [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }]) {
  test(`${viewport.name}: Home and Learn look the same after a client transition as on a document load`, async ({ page }) => {
    const phone = viewport.name === "phone";
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const policyErrors = observePolicyErrors(page);

    // The reference: both pages as a document load renders them.
    await page.goto("/en", { waitUntil: "load" });
    await hydrated(page);
    await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
    await expect.poll(async () => (await homeFacts(page)).loading).toBe(false);
    const loadedHome = await homeFacts(page);
    expect(loadedHome.rules).toBeGreaterThan(0);
    expect(loadedHome.scrollSnap).toBe(phone ? "none" : "y mandatory");
    expect(loadedHome.chaptersPosition).toBe(phone ? "relative" : "sticky");

    await page.goto("/en/learn", { waitUntil: "load" });
    await hydrated(page);
    await expect(page.locator('[data-handoff-page="learn"]')).toBeVisible();
    const loadedLearnRules = await page.evaluate(() => document.querySelector<HTMLStyleElement>('[data-handoff-page="learn"] > style')?.sheet?.cssRules.length ?? 0);
    expect(loadedLearnRules).toBeGreaterThan(0);
    await page.evaluate(() => { (window as MarkedWindow).__handoffStyleDocument = "learn"; });

    // Learn -> Home through the logo, inside the client router.
    await page.locator("header a[translate='no']:visible").first().click();
    await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
    await expect.poll(() => homeFacts(page), { timeout: 10_000 }).toEqual(loadedHome);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => (window as MarkedWindow).__handoffStyleDocument), "the document did not change").toBe("learn");

    // Home -> Learn the same way: Learn has its stylesheet, and Home's page-level rules leave with Home.
    await openLearn(page, phone);
    await expect(page.locator('[data-handoff-page="home"]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLStyleElement>('[data-handoff-page="learn"] > style')?.sheet?.cssRules.length ?? 0)).toBe(loadedLearnRules);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
    expect(await page.evaluate(() => (window as MarkedWindow).__handoffStyleDocument)).toBe("learn");
    expect(policyErrors, "no stylesheet was refused").toEqual([]);
  });
}

// A touch browser keeps :hover on the element that was tapped, and the header stays mounted
// across a client transition. The captured pages colour every hovered link, so without a pointer
// that can hover the tapped logo must not arrive on Home in its hover colour.
test("a tapped logo arrives on Home looking as it does on a Home that was opened directly", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"], locale: "en-GB" });
  const page = await context.newPage();
  const logo = page.locator("header[data-public-shell] a[translate='no']:visible").first();
  const logoLook = () => logo.evaluate((link) => {
    const style = getComputedStyle(link);
    return { color: style.color, decoration: style.textDecorationLine };
  });

  await page.goto("/en", { waitUntil: "load" });
  await hydrated(page);
  const untouched = await logoLook();

  await page.goto("/en/learn", { waitUntil: "load" });
  await hydrated(page);
  await page.evaluate(() => { (window as MarkedWindow).__handoffStyleDocument = "learn"; });
  await logo.tap();
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  expect(await page.evaluate(() => (window as MarkedWindow).__handoffStyleDocument)).toBe("learn");
  expect(await page.evaluate(() => document.querySelector<HTMLStyleElement>('[data-handoff-page="home"] > style')?.sheet?.cssRules.length ?? 0)).toBeGreaterThan(0);
  await expect.poll(logoLook).toEqual(untouched);
  await context.close();
});
