import { expect, test, type Browser, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const fixtureArticlePath = "/en/learn/casino-basics/navigation-stage2-guide";
// Exact hashes reproduced against the archived Stage 1 base; no other runtime error is ignored.
const preExistingCapturedHandoffStyleViolation = /sha256-(?:jCY3Mj0wz8\/Vp\+NcUmcUIKtIFX0kPOrBioHLmp6\/\+mw=|idsgWSSyppNVus\/sizSpS4eNKjguuD3OpEx1eQJLnPM=)/;

type NavigationTimingWindow = Window & {
  __stage2MobileFeedbackPaint?: Promise<number>;
};

async function marketContext(
  browser: Browser,
  country: "KZ" | "PE",
  options: Parameters<Browser["newContext"]>[0] = {},
) {
  return browser.newContext({
    ...options,
    extraHTTPHeaders: {
      ...options.extraHTTPHeaders,
      "x-vercel-ip-country": country,
    },
  });
}

function observeRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      errors.push(`${message.text()} (${location.url}:${location.lineNumber ?? 0}:${location.columnNumber ?? 0})`);
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

function desktopPrimary(page: Page) {
  return page.locator('nav[aria-label="Primary navigation"]');
}

async function expectCanonicalNavigationDomOrder(page: Page) {
  const hrefs = async (selector: string, attribute: string) => page.locator(selector).evaluateAll(
    (elements, name) => elements.map((element) => element.getAttribute(name)),
    attribute,
  );
  await expect.poll(() => hrefs('nav[aria-label="Primary navigation"] [data-navigation-href]', "data-navigation-href")).toEqual([
    "/best-offers", "/casinos", "/bonuses", "/learn",
  ]);
  await expect.poll(() => hrefs('#public-mobile-navigation nav [data-navigation-href]', "data-navigation-href")).toEqual([
    "/best-offers", "/casinos", "/bonuses", "/learn",
  ]);
  await expect.poll(async () => (await hrefs('footer [data-footer-navigation-href]', "data-footer-navigation-href")).slice(0, 4)).toEqual([
    "/best-offers", "/casinos", "/bonuses", "/learn",
  ]);
}

async function holdPublishedCasinoReads() {
  if (process.env.CI !== "true" || process.env.NAVIGATION_STAGE2_STREAMED_HEADER_DATABASE_LOCK !== "true") {
    test.skip(true, "explicit disposable-database hold fixture is not configured");
  }
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "invalid:");
  const databaseName = databaseUrl.pathname.replace(/^\//, "");
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol)
    || !["127.0.0.1", "localhost"].includes(databaseUrl.hostname)
    || !["5432", "54329"].includes(databaseUrl.port)
    || !databaseName.endsWith("_ci")
  ) {
    throw new Error("Streamed Header database hold requires a disposable localhost _ci database");
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl.toString() });
  let acknowledgeLock!: () => void;
  let releaseLock!: () => void;
  let released = false;
  const lockAcquired = new Promise<void>((resolve) => { acknowledgeLock = resolve; });
  const lockRelease = new Promise<void>((resolve) => { releaseLock = resolve; });
  const transaction = prisma.$transaction(async (client) => {
    await client.$executeRawUnsafe('LOCK TABLE "CasinoVersion" IN ACCESS EXCLUSIVE MODE');
    acknowledgeLock();
    await lockRelease;
  }, { maxWait: 5_000, timeout: 60_000 });
  let transactionSettled = false;
  void transaction.then(
    () => { transactionSettled = true; },
    () => { transactionSettled = true; },
  );
  try {
    await Promise.race([
      lockAcquired,
      transaction.then(() => { throw new Error("Published-Casino hold transaction ended before the lock was acquired"); }),
    ]);
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }

  return {
    assertHeld() {
      expect(released, "the commercial hold must not be released before early interaction").toBe(false);
      expect(transactionSettled, "the lock transaction must still be unresolved").toBe(false);
    },
    async release() {
      if (released) return;
      released = true;
      releaseLock();
      try {
        await transaction;
      } finally {
        await prisma.$disconnect();
      }
    },
  };
}

async function exerciseHeldMobileHeader(browser: Browser, browserName: string, country: "KZ" | "PE") {
  const commercialHold = await holdPublishedCasinoReads();

  const context = await marketContext(browser, country, {
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = observeRuntimeErrors(page);
  let delayDestination = false;
  let delayedDestination = false;
  let destinationRequested = false;
  const destination = "Casinos";
  const destinationPath = "/en/casinos";
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === destinationPath
      && (request.isNavigationRequest() || request.headers().rsc === "1")
    ) {
      destinationRequested = true;
    }
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (delayDestination && !delayedDestination && url.pathname === destinationPath && request.headers().rsc === "1") {
      delayedDestination = true;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    await route.continue();
  });

  try {
    const response = await page.goto(`${baseUrl}/en`, { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const header = page.locator('[data-public-shell="header"]');
    const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
    const disclosure = page.locator("details[data-public-mobile-disclosure]");
    const mobileNavigation = page.locator("#public-mobile-navigation");
    await expect(header).toHaveCount(1);
    await expect(trigger).toHaveCount(1);
    await expect(disclosure).toHaveCount(1);
    await expect(trigger).toBeVisible();
    await expect(page.getByRole("link", { name: /Best Offers/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Bonuses/ })).toHaveCount(0);
    await expect(page.locator('[href^="/r/"]')).toHaveCount(0);
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(1);
    await expect(page.getByRole("link", { name: "B4GAMBLE home", exact: true }).first()).toHaveAttribute("href", "/en");
    await header.evaluate((element) => { element.setAttribute("data-held-header-node", "open"); });
    await disclosure.evaluate((element) => { element.setAttribute("data-held-menu-node", "open"); });
    commercialHold.assertHeld();
    await trigger.click();
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(mobileNavigation).toBeVisible();
    await expect(mobileNavigation.locator('a[data-navigation-href="/casinos"]')).toBeVisible();
    await expect(mobileNavigation.locator('a[data-navigation-href="/learn"]')).toBeVisible();
    commercialHold.assertHeld();

    delayDestination = true;
    const enhancedBeforeNavigation = await disclosure.getAttribute("data-navigation-enhanced") === "true";
    const casinoLink = mobileNavigation.locator('a[data-navigation-href="/casinos"]');
    const casinoLinkBox = await casinoLink.boundingBox();
    expect(casinoLinkBox).not.toBeNull();
    await page.mouse.click(
      casinoLinkBox!.x + casinoLinkBox!.width / 2,
      casinoLinkBox!.y + casinoLinkBox!.height / 2,
    );
    await expect.poll(() => destinationRequested, "the ordinary destination request must start while commercial state is held").toBe(true);
    if (enhancedBeforeNavigation) {
      await expect(disclosure).not.toHaveAttribute("open", "");
      await expectNeutralNavigationFeedback(page, destination);
    }
    commercialHold.assertHeld();

    await commercialHold.release();
    await expect(page).toHaveURL(`${baseUrl}${destinationPath}`);
    await expect(page.locator("[data-commercial-casino-card]").first()).toBeVisible();
    await expect(header).toHaveCount(1);
    if (enhancedBeforeNavigation) {
      await expect(header).toHaveAttribute("data-held-header-node", "open");
      await expect(disclosure).toHaveAttribute("data-held-menu-node", "open");
    } else {
      await expect(header).not.toHaveAttribute("data-held-header-node", "open");
      await expect(disclosure).not.toHaveAttribute("data-held-menu-node", "open");
    }
    await expect(disclosure).toHaveAttribute("data-navigation-enhanced", "true");
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(0);

    // Once the commercial state resolves both markets reach the destinations:
    // navigation follows the presentation policy, not whether a partner route
    // exists. The route is what still separates them, so KZ arrives at the
    // same pages carrying no /r/ link.
    await expect(header.locator('a[href="/en/best-offers"]')).toHaveCount(2);
    await expect(header.locator('a[href="/en/bonuses"]')).toHaveCount(2);
    if (country === "KZ") await expect(page.locator('[href^="/r/"]')).toHaveCount(0);

    await trigger.click();
    await expect(mobileNavigation).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation", exact: true })).toBeFocused();
    await expect(mobileNavigation.getByRole("button", { name: /Change language: English/ })).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    await expect(mobileNavigation.getByRole("link", { name: /Best Offers/ })).toHaveAttribute("href", "/en/best-offers");
    await expect(mobileNavigation.getByRole("link", { name: /Bonuses/ })).toHaveAttribute("href", "/en/bonuses");

    await page.keyboard.press("Escape");
    await expect(mobileNavigation).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    const openTrigger = page.getByRole("button", { name: "Open navigation", exact: true });
    await openTrigger.click();
    await expect(mobileNavigation).toBeVisible();
    await page.getByRole("button", { name: "Close navigation", exact: true }).click();
    await expect(mobileNavigation).not.toBeVisible();
    await expect(openTrigger).toBeFocused();
    await openTrigger.click();
    await expect(mobileNavigation).toBeVisible();
    await expect(disclosure).toHaveAttribute("role", "dialog");
    await expect(disclosure).toHaveAttribute("aria-modal", "true");
    await expect(page.locator("main#main-content")).toHaveAttribute("inert", "");
    await expect(page.locator("footer")).toHaveAttribute("inert", "");
    const containedFocus = disclosure.locator('summary:visible, a[href]:visible, button:not([disabled]):visible, input:not([disabled]):visible, select:not([disabled]):visible, textarea:not([disabled]):visible, [tabindex]:not([tabindex="-1"]):visible');
    const lastContainedFocus = containedFocus.last();
    await lastContainedFocus.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close navigation", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastContainedFocus).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(disclosure).not.toHaveAttribute("open", "");
    await expect(page.locator("main#main-content")).not.toHaveAttribute("inert", "");
    await expect(page.locator("footer")).not.toHaveAttribute("inert", "");
    if (browserName === "chromium") expect(delayedDestination).toBe(true);
    expect(enhancedBeforeNavigation || browserName === "webkit").toBe(true);
    expect(errors.filter((error) => !preExistingCapturedHandoffStyleViolation.test(error))).toEqual([]);
  } finally {
    await commercialHold.release();
    await context.close();
  }
}

test("held commercial resolution leaves restricted KZ navigation usable before hydration", async ({ browser, browserName }) => {
  test.setTimeout(60_000);
  await exerciseHeldMobileHeader(browser, browserName, "KZ");
});

test("held commercial resolution leaves supported PE navigation usable before hydration", async ({ browser, browserName }) => {
  test.setTimeout(60_000);
  await exerciseHeldMobileHeader(browser, browserName, "PE");
});

test("open native navigation preserves identity, focus and scroll while commercial state streams", async ({ browser, browserName }) => {
  test.setTimeout(60_000);
  const commercialHold = await holdPublishedCasinoReads();
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    viewport: { width: 390, height: 600 },
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(`${baseUrl}/de`, { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const header = page.locator('[data-public-shell="header"]');
    const disclosure = page.locator("details[data-public-mobile-disclosure]");
    const menu = page.locator("#public-mobile-navigation");
    await header.evaluate((element) => { element.setAttribute("data-stable-header", "true"); });
    await disclosure.evaluate((element) => { element.setAttribute("data-stable-disclosure", "true"); });
    if (browserName === "chromium") {
      await expect(disclosure).toHaveAttribute("data-navigation-enhanced", "true");
    }
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(1);
    commercialHold.assertHeld();

    await disclosure.locator(":scope > summary").click();
    const stableCasinoLink = menu.locator('a[data-navigation-href="/casinos"]');
    await stableCasinoLink.focus();
    await expect(stableCasinoLink).toBeFocused();
    await menu.evaluate((element) => { element.scrollTop = 120; });
    const scrollBefore = await menu.evaluate((element) => element.scrollTop);
    expect(scrollBefore).toBeGreaterThan(0);

    await commercialHold.release();
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(0);
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(header).toHaveAttribute("data-stable-header", "true");
    await expect(disclosure).toHaveAttribute("data-stable-disclosure", "true");
    await expect(stableCasinoLink).toBeFocused();
    await expect(menu.locator('a[data-navigation-href="/best-offers"]')).toHaveAttribute("href", "/de/best-offers");
    await expect(menu.locator('a[data-navigation-href="/bonuses"]')).toHaveAttribute("href", "/de/bonuses");
    await expect(menu.getByRole("button", { name: /Sprache ändern: Deutsch/ })).toBeVisible();
    await expect(disclosure).toHaveAttribute("data-navigation-enhanced", "true");
    const scrollAfter = await menu.evaluate((element) => element.scrollTop);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(2);
    await page.keyboard.press("Escape");
    await expect(disclosure).not.toHaveAttribute("open", "");
  } finally {
    await commercialHold.release();
    await context.close();
  }
});

test("held commercial resolution times out once and recovers without replacing open navigation", async ({ browser }) => {
  test.setTimeout(60_000);
  const commercialHold = await holdPublishedCasinoReads();
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    viewport: { width: 390, height: 600 },
  });
  const page = await context.newPage();
  let homeRefreshes = 0;
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/en"
      && request.headers().rsc === "1"
      && request.headers()["next-router-prefetch"] !== "1"
    ) {
      homeRefreshes += 1;
    }
  });

  try {
    const response = await page.goto(`${baseUrl}/en`, { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const header = page.locator('[data-public-shell="header"]');
    const disclosure = page.locator("details[data-public-mobile-disclosure]");
    const menu = page.locator("#public-mobile-navigation");
    await header.evaluate((element) => { element.setAttribute("data-timeout-header", "stable"); });
    await disclosure.evaluate((element) => { element.setAttribute("data-timeout-menu", "stable"); });
    await disclosure.locator(":scope > summary").click();
    const stableCasinoLink = menu.locator('a[data-navigation-href="/casinos"]');
    await stableCasinoLink.focus();
    await menu.evaluate((element) => { element.scrollTop = 120; });
    const scrollBefore = await menu.evaluate((element) => element.scrollTop);
    expect(scrollBefore).toBeGreaterThan(0);
    commercialHold.assertHeld();

    await expect(page.locator('[data-commercial-navigation-timed-out]')).toHaveCount(1);
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(0);
    await expect(menu.locator('a[data-navigation-href="/best-offers"]')).toHaveCount(0);
    commercialHold.assertHeld();

    await commercialHold.release();
    await expect(menu.locator('a[data-navigation-href="/best-offers"]')).toHaveAttribute("href", "/en/best-offers");
    await expect(menu.locator('a[data-navigation-href="/bonuses"]')).toHaveAttribute("href", "/en/bonuses");
    await expect(page.locator('[data-commercial-navigation-timed-out]')).toHaveCount(0);
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(header).toHaveAttribute("data-timeout-header", "stable");
    await expect(disclosure).toHaveAttribute("data-timeout-menu", "stable");
    await expect(stableCasinoLink).toBeFocused();
    const scrollAfter = await menu.evaluate((element) => element.scrollTop);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(2);
    await expect.poll(() => homeRefreshes).toBe(1);
    await page.waitForTimeout(1_800);
    expect(homeRefreshes, "the bounded commercial recovery must not become a refresh loop").toBe(1);

  } finally {
    await commercialHold.release();
    await context.close();
  }
});

test("commercial completion before application JavaScript preserves the native open state through hydration", async ({ browser, browserName }) => {
  test.setTimeout(60_000);
  const commercialHold = await holdPublishedCasinoReads();
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  let releaseScripts!: () => void;
  const scriptsReleased = new Promise<void>((resolve) => { releaseScripts = resolve; });
  let heldScriptRequests = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      heldScriptRequests += 1;
      await scriptsReleased;
    }
    await route.continue();
  });
  try {
    const response = await page.goto(`${baseUrl}/en`, { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const disclosure = page.locator("details[data-public-mobile-disclosure]");
    const menu = page.locator("#public-mobile-navigation");
    await expect.poll(() => heldScriptRequests).toBeGreaterThan(0);
    await expect(disclosure).not.toHaveAttribute("data-navigation-enhanced", "true");
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(1);
    await disclosure.locator(":scope > summary").click();
    const stableCasinoLink = menu.locator('a[data-navigation-href="/casinos"]');
    if (browserName === "webkit") {
      await stableCasinoLink.focus();
    } else {
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
    }
    await expect(stableCasinoLink).toBeFocused();
    commercialHold.assertHeld();

    await commercialHold.release();
    await expect(page.locator('[data-commercial-navigation-pending="mobile"]')).toHaveCount(0);
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(stableCasinoLink).toBeFocused();
    await expect(menu.locator('a[data-navigation-href="/best-offers"]')).toBeVisible();

    releaseScripts();
    await expect(disclosure).toHaveAttribute("data-navigation-enhanced", "true");
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(stableCasinoLink).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(disclosure).not.toHaveAttribute("open", "");
  } finally {
    releaseScripts();
    await commercialHold.release();
    await context.close();
  }
});

test("rejected commercial resolution keeps truthful basic navigation usable", async ({ browser }) => {
  test.skip(
    process.env.NAVIGATION_STAGE2_REJECT_COMMERCIAL_STATE !== "true",
    "isolated commercial-state rejection seam is not configured",
  );
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = observeRuntimeErrors(page);
  const response = await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-public-shell="header"]')).toHaveCount(1);
  await expect(page.locator('a[data-navigation-href="/best-offers"]')).toHaveCount(0);
  await expect(page.locator('a[data-navigation-href="/bonuses"]')).toHaveCount(0);
  await expect(page.locator('[href^="/r/"]')).toHaveCount(0);
  const disclosure = page.locator("details[data-public-mobile-disclosure]");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect(disclosure).toHaveAttribute("open", "");
  const menu = page.locator("#public-mobile-navigation");
  await expect(menu.locator('a[data-navigation-href="/casinos"]')).toBeVisible();
  await expect(menu.locator('a[data-navigation-href="/learn"]')).toBeVisible();
  await menu.locator('a[data-navigation-href="/learn"]').click();
  await expect(page).toHaveURL(`${baseUrl}/en/learn`);
  await expect(page.locator('[data-handoff-page="learn"]')).toBeVisible();
  expect(errors.filter((error) => !preExistingCapturedHandoffStyleViolation.test(error))).toEqual([]);
  await context.close();
});

async function expectNeutralNavigationFeedback(page: Page, destination: string) {
  const feedback = page.locator(`[data-navigation-pending-destination="${destination}"]`);
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveCSS("background-color", "rgb(16, 15, 15)");
  await expect(feedback).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(feedback.locator("span")).toHaveCSS("background-color", "rgb(228, 226, 78)");
  await expect(feedback.locator('[href^="/r/"]')).toHaveCount(0);
  await expect(feedback.locator("[data-commercial-best-offer-card], [data-commercial-bonus-card], [data-commercial-casino-card]")).toHaveCount(0);
}

test("keyboard focus does not prefetch request-specific primary routes", async ({ browser }) => {
  const context = await marketContext(browser, "PE", { viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const primaryPaths = ["/en/best-offers", "/en/casinos", "/en/bonuses", "/en/learn"];
  const prefetched: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (request.headers().rsc === "1" && primaryPaths.includes(pathname)) prefetched.push(pathname);
  });

  await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  await page.waitForTimeout(500);
  expect(prefetched, "there must be no viewport prefetch fan-out").toEqual([]);

  for (const path of primaryPaths) await desktopPrimary(page).locator(`a[href="${path}"]`).focus();
  await page.waitForTimeout(500);
  expect(prefetched, "keyboard focus must not cache request-specific GEO/action payloads").toEqual([]);
  await context.close();
});

test("supported PE fixture covers all primary, detail, article, history and prefetch journeys without document reloads", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await marketContext(browser, "PE", { viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const errors = observeRuntimeErrors(page);
  const documentNavigations: string[] = [];
  const analyticsRequests: string[] = [];
  const primaryPrefetchRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentNavigations.push(request.url());
    if (new URL(request.url()).pathname === "/api/analytics/events") analyticsRequests.push(request.url());
    const pathname = new URL(request.url()).pathname;
    if (["/en/best-offers", "/en/casinos", "/en/bonuses", "/en/learn"].includes(pathname)
      && request.headers().rsc === "1") primaryPrefetchRequests.push(pathname);
  });

  const response = await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  await expect(desktopPrimary(page).getByRole("link", { name: "Best Offers", exact: true })).toBeVisible();
  await expectCanonicalNavigationDomOrder(page);
  documentNavigations.length = 0;
  analyticsRequests.length = 0;
  primaryPrefetchRequests.length = 0;

  await page.waitForTimeout(700);
  expect(primaryPrefetchRequests, "primary navigation must not fan out before explicit intent").toEqual([]);
  await desktopPrimary(page).getByRole("link", { name: "Best Offers", exact: true }).hover();
  await page.waitForTimeout(500);
  expect(primaryPrefetchRequests, "hover must not cache request-specific GEO/action payloads").toEqual([]);
  expect(analyticsRequests, "hover must not emit product analytics").toEqual([]);
  await desktopPrimary(page).getByRole("link", { name: "Best Offers", exact: true }).click();
  await expect(page.locator("[data-commercial-best-offer-card]").first()).toBeVisible();
  await expect(page).toHaveURL(`${baseUrl}/en/best-offers`);

  const bestDetail = page.locator('[data-commercial-best-offer-card] a[href*="/casino/"]').first();
  await bestDetail.click();
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  await expect(page).toHaveURL(`${baseUrl}/en/casino/navigation-stage2-casino`);
  await page.goBack();
  await expect(page.locator("[data-commercial-best-offer-card]").first()).toBeVisible();
  await page.goForward();
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  await page.goBack();

  await desktopPrimary(page).getByRole("link", { name: "Casinos", exact: true }).click();
  await expect(page.locator("[data-commercial-casino-card]").first()).toBeVisible();
  const casinoDetail = page.locator('[data-commercial-casino-card] a[href*="/casino/"]').first();
  await casinoDetail.click();
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  await page.goBack();

  await desktopPrimary(page).getByRole("link", { name: "Bonuses", exact: true }).click();
  await expect(page.locator("[data-commercial-bonus-card]").first()).toBeVisible();
  await desktopPrimary(page).getByRole("link", { name: "Learn", exact: true }).click();
  await expect(page.locator('[data-handoff-page="learn"]')).toBeVisible();
  await page.locator('button[data-learn-topic="casinos"]').click();
  const articleLink = page.locator(`a[href="${fixtureArticlePath}"]`).first();
  await expect(articleLink).toBeVisible();
  const categoryResponse = await page.goto(`${baseUrl}/en/learn/casino-basics`, { waitUntil: "domcontentloaded" });
  expect(categoryResponse?.status()).toBe(200);
  await expect(page).toHaveURL(`${baseUrl}/en/learn?category=casino-basics`);
  await expect(articleLink).toBeVisible();
  documentNavigations.length = 0;
  await articleLink.click();
  await expect(page.locator('[data-runtime-renderer="postgresql-learn-article"]')).toContainText("Navigation Stage 2 Published Guide");
  await page.goBack();
  await expect(page.locator('[data-handoff-page="learn"]')).toBeVisible();
  await page.goForward();
  await expect(page.locator('[data-runtime-renderer="postgresql-learn-article"]')).toBeVisible();

  const notFoundPage = await context.newPage();
  const missingCategory = await notFoundPage.goto(`${baseUrl}/en/learn/not-a-category`, { waitUntil: "domcontentloaded" });
  expect(missingCategory?.status()).toBe(404);
  const missingArticle = await notFoundPage.goto(`${baseUrl}/en/learn/casino-basics/not-an-article`, { waitUntil: "domcontentloaded" });
  expect(missingArticle?.status()).toBe(404);
  await notFoundPage.close();

  await page.getByRole("link", { name: "B4GAMBLE home", exact: true }).first().click();
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  expect(documentNavigations, "hydrated internal journeys should stay inside the App Router").toEqual([]);
  expect(errors.filter((error) => !preExistingCapturedHandoffStyleViolation.test(error))).toEqual([]);
  await context.close();
});

test("restricted KZ and supported PE remain isolated across direct localized routes", async ({ browser }) => {
  const supported = await marketContext(browser, "PE");
  const supportedPage = await supported.newPage();
  await supportedPage.goto(`${baseUrl}/en/best-offers`, { waitUntil: "domcontentloaded" });
  await expect(supportedPage.locator("[data-commercial-best-offer-card]").first()).toBeVisible();
  await expect(supportedPage.locator('[href^="/r/"]').first()).toBeVisible();

  const restricted = await marketContext(browser, "KZ");
  const restrictedPage = await restricted.newPage();
  const restrictedResponse = await restrictedPage.goto(`${baseUrl}/en/best-offers`, { waitUntil: "domcontentloaded" });
  expect(restrictedResponse?.status()).toBe(200);
  // KZ has no partner route, and that is no longer a reason to withhold the
  // offers themselves: published offers are presented wherever advertising is
  // not prohibited, and the missing route means no visit button rather than no
  // page. The isolation this test protects is the one that matters — no /r/
  // destination ever reaches a reader whose market has no governed route —
  // and it is now checked against a populated page rather than an empty one.
  await expect(restrictedPage.locator('[href^="/r/"]')).toHaveCount(0);
  await expect(desktopPrimary(restrictedPage).getByRole("link", { name: "Best Offers", exact: true })).toHaveCount(1);
  await expect(desktopPrimary(restrictedPage).getByRole("link", { name: "Bonuses", exact: true })).toHaveCount(1);

  await restrictedPage.goto(`${baseUrl}/en/bonuses`, { waitUntil: "domcontentloaded" });
  await expect(restrictedPage.locator('[href^="/r/"]')).toHaveCount(0);
  await supportedPage.goto(`${baseUrl}/en/casinos`, { waitUntil: "domcontentloaded" });
  await expect(supportedPage.locator("[data-commercial-casino-card]").first()).toBeVisible();
  await supported.close();
  await restricted.close();
});

test("mobile feedback survives menu close, stays neutral while slow, and honors reduced motion", async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = observeRuntimeErrors(page);
  let delayBonuses = false;
  let delayed = false;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (delayBonuses && !delayed && url.pathname.endsWith("/en/bonuses") && request.headers().rsc === "1") {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    }
    await route.continue();
  });
  await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();

  const menuButton = page.getByRole("button", { name: "Open navigation", exact: true });
  await menuButton.click();
  const mobileNavigation = page.locator("#public-mobile-navigation");
  await expect(mobileNavigation).toBeVisible();
  delayBonuses = true;
  await page.evaluate(() => {
    const startedAt = performance.now();
    (window as NavigationTimingWindow).__stage2MobileFeedbackPaint = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-navigation-pending-destination="Bonuses"]')) return;
        observer.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - startedAt)));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });
  await mobileNavigation.getByRole("link", { name: /Bonuses/ }).click();
  await expect(mobileNavigation).not.toBeVisible();
  await expectNeutralNavigationFeedback(page, "Bonuses");
  const mobileFeedbackPaintMs = await page.evaluate(
    () => (window as NavigationTimingWindow).__stage2MobileFeedbackPaint!,
  );
  expect(mobileFeedbackPaintMs).toBeLessThan(200);
  const loadingAnimation = await page.locator('[data-navigation-pending-destination="Bonuses"] span').evaluate((element) => getComputedStyle(element).animationName);
  expect(loadingAnimation).toBe("none");
  await expect(page.locator("[data-commercial-bonus-card]").first()).toBeVisible();
  expect(delayed).toBe(true);

  await menuButton.click();
  await expect(mobileNavigation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mobileNavigation).not.toBeVisible();
  await expect(menuButton).toBeFocused();
  expect(errors.filter((error) => !preExistingCapturedHandoffStyleViolation.test(error))).toEqual([]);
  await context.close();
});

test("enhanced disclosure respects modifiers, new tabs, hashes and desktop resize", async ({ browser }) => {
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  const disclosure = page.locator("details[data-public-mobile-disclosure]");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  const learn = page.locator('#public-mobile-navigation a[data-navigation-href="/learn"]');
  const newTabModifier = process.platform === "darwin" ? "Meta" : "Control";

  await trigger.click();
  const [modifiedPage] = await Promise.all([
    context.waitForEvent("page"),
    learn.click({ modifiers: [newTabModifier] }),
  ]);
  await modifiedPage.waitForLoadState("domcontentloaded");
  await expect(disclosure).toHaveAttribute("open", "");
  await modifiedPage.close();

  await learn.evaluate((element) => {
    const anchor = element as HTMLAnchorElement;
    anchor.target = "_blank";
  });
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    learn.click(),
  ]);
  await newTab.waitForLoadState("domcontentloaded");
  await expect(disclosure).toHaveAttribute("open", "");
  await newTab.close();

  const hashLink = page.locator("#navigation-stage2-hash-link");
  await page.locator("#public-mobile-navigation").evaluate((menu) => {
    const anchor = document.createElement("a");
    anchor.id = "navigation-stage2-hash-link";
    anchor.href = "#main-content";
    anchor.textContent = "Skip to content in this page";
    menu.append(anchor);
  });
  await hashLink.click();
  await expect(page).toHaveURL(`${baseUrl}/en#main-content`);
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");

  await trigger.click();
  await page.setViewportSize({ width: 1000, height: 700 });
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await expect(disclosure).toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Close navigation", exact: true }).click();
  await expect(trigger).toBeFocused();
  await context.close();
});

test("rapid transitions resolve to the last destination and failed raw Learn navigation cannot leave pending UI stuck", async ({ browser }) => {
  test.setTimeout(45_000);
  const context = await marketContext(browser, "PE", { viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Primary navigation"]');
    const links = Array.from(nav?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    links.find((link) => link.textContent?.trim() === "Best Offers")?.click();
    links.find((link) => link.textContent?.trim() === "Casinos")?.click();
  });
  await expect(page).toHaveURL(`${baseUrl}/en/casinos`);
  await expect(page.locator("[data-commercial-casino-card]").first()).toBeVisible();
  await expect(page.locator('[data-navigation-pending-destination="Best Offers"]')).toHaveCount(0);

  await desktopPrimary(page).getByRole("link", { name: "Learn", exact: true }).click();
  await expect(page.locator('[data-handoff-page="learn"]')).toBeVisible();
  let failArticle = true;
  await page.route(`**${fixtureArticlePath}**`, async (route) => {
    if (failArticle && route.request().headers().rsc === "1") {
      failArticle = false;
      await route.fulfill({ body: "isolated navigation failure", contentType: "text/plain", status: 503 });
      return;
    }
    await route.continue();
  });
  await page.locator(`a[href="${fixtureArticlePath}"]`).first().click();
  await expect(page.locator("[data-navigation-pending]")).toHaveCount(0, { timeout: 7_000 });
  expect(failArticle).toBe(false);
  await page.unroute(`**${fixtureArticlePath}**`);
  await page.goto(`${baseUrl}/en/learn`, { waitUntil: "domcontentloaded" });
  await page.locator(`a[href="${fixtureArticlePath}"]`).first().click();
  await expect(page.locator('[data-runtime-renderer="postgresql-learn-article"]')).toBeVisible();
  await context.close();
});

test("language switching preserves query state, and native mobile navigation works without JavaScript", async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await marketContext(browser, "PE");
  const page = await context.newPage();
  await page.goto(`${baseUrl}/en/casinos?q=stage2`, { waitUntil: "domcontentloaded" });
  const language = page.getByRole("button", { name: /Change language: English/ }).first();
  await expect(language).toBeVisible();
  await page.waitForTimeout(300);
  await language.click();
  const languageMenu = page.locator('[role="menu"]:visible');
  await expect(languageMenu).toBeVisible();
  await languageMenu.locator('button[value="de"]').click();
  await expect(page).toHaveURL(`${baseUrl}/de/casinos?q=stage2`);
  await page.goto(`${baseUrl}/de/learn`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-learn-empty]")).toBeVisible();
  await context.close();

  const noJavaScript = await marketContext(browser, "PE", {
    isMobile: true,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const noJavaScriptPage = await noJavaScript.newPage();
  const noJavaScriptResponse = await noJavaScriptPage.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  expect(noJavaScriptResponse?.status()).toBe(200);
  const nativeDisclosure = noJavaScriptPage.locator("details[data-public-mobile-disclosure]");
  await expect(nativeDisclosure).not.toHaveAttribute("data-navigation-enhanced", "true");
  await noJavaScriptPage.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect(nativeDisclosure).toHaveAttribute("open", "");
  const nativeMenu = noJavaScriptPage.locator("#public-mobile-navigation");
  await expect(nativeMenu.locator('a[data-navigation-href="/learn"]')).toHaveAttribute("href", "/en/learn");
  await nativeMenu.getByRole("button", { name: /Change language: English/ }).click();
  const germanChoice = nativeMenu.locator('button[name="choice"][value="de"]');
  await expect(germanChoice).toBeVisible();
  await germanChoice.focus();
  await noJavaScriptPage.keyboard.press("Enter");
  await expect(noJavaScriptPage).toHaveURL(`${baseUrl}/de`);
  await noJavaScriptPage.locator("details[data-public-mobile-disclosure] > summary").click();
  await noJavaScriptPage.locator('#public-mobile-navigation a[data-navigation-href="/learn"]').click();
  await expect(noJavaScriptPage).toHaveURL(`${baseUrl}/de/learn`);
  await expect(noJavaScriptPage.locator("[data-learn-empty]")).toBeVisible();
  await noJavaScript.close();
});

test("nested Programme language Escape closes only the topmost disclosure", async ({ browser }) => {
  const context = await marketContext(browser, "PE", {
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  const navigation = page.locator("details[data-public-mobile-disclosure]");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const language = page.locator("#public-mobile-navigation [data-programme-language-selector] details");
  await language.locator(":scope > summary").click();
  await expect(language).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(language).not.toHaveAttribute("open", "");
  await expect(navigation).toHaveAttribute("open", "");
  await expect(language.locator(":scope > summary")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(navigation).not.toHaveAttribute("open", "");
  await context.close();
});
