import { expect, test, type Page } from "@playwright/test";

const denied = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

type MarkedWindow = Window & { __programmeBoundaryDocument?: string };
type PolicyDocument = Document & { featurePolicy?: { allowsFeature(feature: string): boolean } };

// A value on `window` lives exactly as long as its document: it survives a client transition
// and is gone after a document load.
async function markDocument(page: Page, name: string) {
  await page.evaluate((value) => { (window as MarkedWindow).__programmeBoundaryDocument = value; }, name);
}

async function documentMark(page: Page) {
  return page.evaluate(() => (window as MarkedWindow).__programmeBoundaryDocument ?? null);
}

/** Links are driven by the client router only after hydration; the header's theme controller mounts with it. */
async function hydrated(page: Page) {
  await expect(page.locator("[data-public-shell='header'][data-theme-controller='ready']")).toHaveCount(1);
}

function observe(page: Page, programmePath: string) {
  const seen = { documents: [] as string[], programmePages: [] as string[], policyErrors: [] as string[] };
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.resourceType() === "document") seen.documents.push(url.pathname);
    if (url.pathname === programmePath && request.headers().rsc === "1") seen.programmePages.push(url.pathname);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Content Security Policy")) seen.policyErrors.push(message.text());
  });
  return seen;
}

async function expectProgrammeOpenedInPlace(page: Page, seen: ReturnType<typeof observe>, programmePath: string, locale: string) {
  await expect(page).toHaveURL(new RegExp(`${programmePath}$`));
  const screen = page.locator('[data-programme-phase="access"]');
  await expect(screen).toBeVisible();
  expect(await documentMark(page), "the public document is still the one on screen").toBe("public");
  expect(seen.documents, "no document was requested for the Programme").toEqual([]);
  expect(seen.programmePages, "the Programme was fetched once, ahead of the tap").toHaveLength(1);
  await expect(screen, "focus lands on the Programme screen").toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: "the Programme opens at its top" }).toBe(0);
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("[data-public-shell='header']")).toHaveCount(1);
  await expect(page.locator("details[data-public-mobile-disclosure][open]")).toHaveCount(0);
  await expect(page.locator("[data-handoff-page]"), "nothing of the public page stays behind").toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  // The document's policy is the one it was loaded with; the Programme's own document sends the same.
  expect(await page.evaluate(() => (document as PolicyDocument).featurePolicy?.allowsFeature("microphone"))).toBe(false);
  expect((await page.request.get(programmePath)).headers()["permissions-policy"]).toBe(denied);
  expect(seen.policyErrors).toEqual([]);
}

for (const viewport of [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }]) {
  test(`${viewport.name}: the header button opens the Programme without a document load`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const seen = observe(page, "/es/program");
    const response = await page.goto("/es", { waitUntil: "load" });
    expect(response?.status()).toBe(200);
    expect(response?.headers()["permissions-policy"]).toBe(denied);
    await hydrated(page);
    // The Programme loads in the background once the page has settled.
    await expect.poll(() => seen.programmePages.length, { timeout: 15_000 }).toBe(1);

    await markDocument(page, "public");
    seen.documents.length = 0;
    await page.mouse.wheel(0, 700);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.locator("header a[data-programme-entry]:visible").first().click();

    await expectProgrammeOpenedInPlace(page, seen, "/es/program", "es-ES");

    // Back returns to the page the Programme was opened from, with its own stylesheet.
    await page.goBack();
    await expect(page).toHaveURL(/\/es$/);
    await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
    expect(await page.evaluate(() => document.querySelector<HTMLStyleElement>('[data-handoff-page="home"] > style')?.sheet?.cssRules.length ?? 0)).toBeGreaterThan(0);
    expect(seen.policyErrors).toEqual([]);
  });
}

test("the Home hero button and the drawer button open the Programme without a document load", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const seen = observe(page, "/program");
  await page.goto("/en", { waitUntil: "load" });
  await hydrated(page);
  await expect.poll(() => seen.programmePages.length, { timeout: 15_000 }).toBe(1);
  await markDocument(page, "public");
  seen.documents.length = 0;
  await page.locator("a[data-home-hero-cta]").click();
  await expectProgrammeOpenedInPlace(page, seen, "/program", "en-GB");

  await page.goto("/en/learn", { waitUntil: "load" });
  await hydrated(page);
  await expect.poll(() => seen.programmePages.length, { timeout: 15_000 }).toBe(2);
  seen.programmePages.length = 1;
  await markDocument(page, "public");
  seen.documents.length = 0;
  await page.locator("details[data-public-mobile-disclosure] > summary").click();
  await page.locator("#public-mobile-navigation [data-mobile-menu-account] a[data-programme-entry]").click();
  await expectProgrammeOpenedInPlace(page, seen, "/program", "en-GB");
});

// The automatic cookie choice never shows in the Programme. It lives in the root layout, which a
// client transition keeps mounted, so one that opened on the public page must not come along.
test("a cookie choice that opened on the public page does not follow the visitor into the Programme", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => window.sessionStorage.setItem("b4g_privacy_choice_under_automation", "1"));
  const page = await context.newPage();
  await page.goto("/en", { waitUntil: "load" });
  await hydrated(page);
  await page.mouse.wheel(0, 400);
  const choice = page.getByRole("dialog", { name: "Cookie settings" });
  await expect(choice).toBeVisible();
  await markDocument(page, "public");

  await page.locator("header a[data-programme-entry]:visible").first().click();
  await expect(page.locator('[data-programme-phase="access"]')).toBeVisible();
  expect(await documentMark(page)).toBe("public");
  await expect(choice).toHaveCount(0);
  expect((await context.cookies()).find((cookie) => cookie.name === "b4g_analytics_consent"), "no choice was recorded").toBeUndefined();

  // The visitor can still open it there themselves.
  await page.locator("footer [data-privacy-choices-trigger]").first().click();
  await expect(choice).toBeVisible();
  await context.close();
});

// Leaving the Programme keeps its document load: the root layout sets `<html lang>` once per
// document, and the Programme's menu can lead to a page in another language.
test("leaving the Programme loads a fresh document: the page language and the Home stylesheet are right", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
    extraHTTPHeaders: { "x-vercel-ip-country": "US" },
  });
  const page = await context.newPage();
  await page.goto("/es/program", { waitUntil: "load" });
  await hydrated(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  await markDocument(page, "programme");

  // A visitor whose country has no published market gets the menu in their own language.
  await page.locator("details[data-public-mobile-disclosure] > summary").click();
  const learnLink = page.locator('#public-mobile-navigation a[data-navigation-href="/learn"]').first();
  await expect(learnLink).toHaveAttribute("href", "/en/learn");
  const learnNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await learnLink.click();
  const learnResponse = await learnNavigation;

  expect(new URL(page.url()).pathname).toBe("/en/learn");
  expect(learnResponse?.headers()["permissions-policy"]).toBe(denied);
  expect(await documentMark(page)).toBeNull();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");

  await page.goto("/program", { waitUntil: "load" });
  await hydrated(page);
  await markDocument(page, "programme");
  const homeNavigation = page.waitForNavigation({ waitUntil: "load" });
  await page.locator("header a[translate='no']:visible").first().click();
  await homeNavigation;

  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  expect(await documentMark(page)).toBeNull();
  expect(await page.evaluate(() => document.querySelector<HTMLStyleElement>('[data-handoff-page="home"] > style')?.sheet?.cssRules.length ?? 0)).toBeGreaterThan(0);
  await context.close();
});

test("a link into the Programme in another language than the page's loads a fresh document", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const seen = observe(page, "/program");
  await page.goto("/de", { waitUntil: "load" });
  await hydrated(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.locator("header a[data-programme-entry]:visible").first()).toHaveAttribute("href", "/de/program");
  await markDocument(page, "public");

  // Home drives its own links through the client router; a link to the English Programme must not
  // go that way. The link joins Home's own markup once Home has taken over its links.
  await expect(page.locator('[data-handoff-page="home"][data-home-interactions]')).toHaveCount(1);
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/program";
    link.textContent = "English Programme";
    link.setAttribute("data-foreign-programme-link", "");
    link.style.cssText = "position:fixed;left:16px;top:160px;z-index:2147483647;padding:16px;background:#fff;color:#000";
    document.querySelector('[data-handoff-page="home"] > div')?.append(link);
  });
  const navigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.locator("[data-foreign-programme-link]").click();
  const response = await navigation;

  expect(new URL(page.url()).pathname).toBe("/program");
  expect(response?.headers()["permissions-policy"]).toBe(denied);
  expect(await documentMark(page)).toBeNull();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  expect(seen.programmePages, "no client transition was started for the English Programme").toEqual([]);
});
