import { expect, test, type Browser, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const fixtureArticlePath = "/en/learn/casino-basics/navigation-stage2-guide";
// Exact hashes reproduced against the archived Stage 1 base; no other runtime error is ignored.
const preExistingCapturedHandoffStyleViolation = /sha256-(?:jCY3Mj0wz8\/Vp\+NcUmcUIKtIFX0kPOrBioHLmp6\/\+mw=|G8QZbiPNraJ1x4oUVRtou34vPnkDbD3X78lAPSvIiBs=)/;

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

async function expectNeutralNavigationFeedback(page: Page, destination: string) {
  const feedback = page.locator(`[data-navigation-pending-destination="${destination}"]`);
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveCSS("background-color", "rgb(16, 15, 15)");
  await expect(feedback).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(feedback.locator("span")).toHaveCSS("background-color", "rgb(228, 226, 78)");
  await expect(feedback.locator('[href^="/r/"]')).toHaveCount(0);
  await expect(feedback.locator("[data-commercial-best-offer-card], [data-commercial-bonus-card], [data-commercial-casino-card]")).toHaveCount(0);
}

test("supported PE fixture covers all primary, detail, article, history and prefetch journeys without document reloads", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await marketContext(browser, "PE", { viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const errors = observeRuntimeErrors(page);
  const documentNavigations: string[] = [];
  const analyticsRequests: string[] = [];
  const speculativeBestOfferRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentNavigations.push(request.url());
    if (new URL(request.url()).pathname === "/api/analytics/events") analyticsRequests.push(request.url());
    if (new URL(request.url()).pathname.endsWith("/en/best-offers") && request.headers().rsc === "1") speculativeBestOfferRequests.push(request.url());
  });

  const response = await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-handoff-page="home"]')).toBeVisible();
  await expect(desktopPrimary(page).getByRole("link", { name: "Best Offers", exact: true })).toBeVisible();
  documentNavigations.length = 0;
  analyticsRequests.length = 0;
  speculativeBestOfferRequests.length = 0;

  await desktopPrimary(page).getByRole("link", { name: "Best Offers", exact: true }).hover();
  await page.waitForTimeout(700);
  expect(analyticsRequests, "automatic prefetch must not emit product analytics").toEqual([]);
  expect(speculativeBestOfferRequests, "measured-unhelpful primary route prefetch stays disabled").toEqual([]);
  await desktopPrimary(page).getByRole("link", { name: "Best Offers", exact: true }).click();
  await expect(page.locator("[data-commercial-best-offer-card]")).toBeVisible();
  await expect(page).toHaveURL(`${baseUrl}/en/best-offers`);

  const bestDetail = page.locator('[data-commercial-best-offer-card] a[href*="/casino/"]').first();
  await bestDetail.click();
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  await expect(page).toHaveURL(`${baseUrl}/en/casino/navigation-stage2-casino`);
  await page.goBack();
  await expect(page.locator("[data-commercial-best-offer-card]")).toBeVisible();
  await page.goForward();
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  await page.goBack();

  await desktopPrimary(page).getByRole("link", { name: "Casinos", exact: true }).click();
  await expect(page.locator("[data-commercial-casino-card]")).toBeVisible();
  const casinoDetail = page.locator('[data-commercial-casino-card] a[href*="/casino/"]').first();
  await casinoDetail.click();
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  await page.goBack();

  await desktopPrimary(page).getByRole("link", { name: "Bonuses", exact: true }).click();
  await expect(page.locator("[data-commercial-bonus-card]")).toBeVisible();
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
  await expect(supportedPage.locator("[data-commercial-best-offer-card]")).toBeVisible();
  await expect(supportedPage.locator('[href^="/r/"]').first()).toBeVisible();

  const restricted = await marketContext(browser, "KZ");
  const restrictedPage = await restricted.newPage();
  const restrictedResponse = await restrictedPage.goto(`${baseUrl}/en/best-offers`, { waitUntil: "domcontentloaded" });
  expect(restrictedResponse?.status()).toBe(200);
  await expect(restrictedPage.locator('[data-commercial-market-state="editorial-only"]')).toBeVisible();
  await expect(restrictedPage.locator('[href^="/r/"]')).toHaveCount(0);
  await expect(desktopPrimary(restrictedPage).getByRole("link", { name: "Best Offers", exact: true })).toHaveCount(0);
  await expect(desktopPrimary(restrictedPage).getByRole("link", { name: "Bonuses", exact: true })).toHaveCount(0);

  await restrictedPage.goto(`${baseUrl}/en/bonuses`, { waitUntil: "domcontentloaded" });
  await expect(restrictedPage.locator('[data-commercial-market-state="editorial-only"]')).toBeVisible();
  await expect(restrictedPage.locator('[href^="/r/"]')).toHaveCount(0);
  await supportedPage.goto(`${baseUrl}/en/casinos`, { waitUntil: "domcontentloaded" });
  await expect(supportedPage.locator("[data-commercial-casino-card]")).toBeVisible();
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
  const dialog = page.getByRole("dialog", { name: "Site navigation", exact: true });
  await expect(dialog).toBeVisible();
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
  await dialog.getByRole("link", { name: /Bonuses/ }).click();
  await expect(dialog).not.toBeVisible();
  await expectNeutralNavigationFeedback(page, "Bonuses");
  const mobileFeedbackPaintMs = await page.evaluate(
    () => (window as NavigationTimingWindow).__stage2MobileFeedbackPaint!,
  );
  expect(mobileFeedbackPaintMs).toBeLessThan(200);
  const loadingAnimation = await page.locator('[data-navigation-pending-destination="Bonuses"] span').evaluate((element) => getComputedStyle(element).animationName);
  expect(loadingAnimation).toBe("none");
  await expect(page.locator("[data-commercial-bonus-card]")).toBeVisible();
  expect(delayed).toBe(true);

  await menuButton.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(menuButton).toBeFocused();
  expect(errors.filter((error) => !preExistingCapturedHandoffStyleViolation.test(error))).toEqual([]);
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
  await expect(page.locator("[data-commercial-casino-card]")).toBeVisible();
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

test("language switching preserves query state, non-English empty state is truthful, and Learn links work without JavaScript", async ({ browser }) => {
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

  const noJavaScript = await marketContext(browser, "PE", { javaScriptEnabled: false });
  const publicOrigin = new URL(baseUrl);
  const directOrigin = `${publicOrigin.protocol}//127.0.0.1:${publicOrigin.port}`;
  const directHeaders = { Host: publicOrigin.host };
  const learnResponse = await noJavaScript.request.get(`${directOrigin}/en/learn`, { headers: directHeaders });
  expect(learnResponse.status()).toBe(200);
  expect(await learnResponse.text()).toContain(`href="${fixtureArticlePath}"`);
  const articleResponse = await noJavaScript.request.get(`${directOrigin}${fixtureArticlePath}`, { headers: directHeaders });
  expect(articleResponse.status()).toBe(200);
  expect(await articleResponse.text()).toContain("Navigation Stage 2 Published Guide");
  await noJavaScript.close();
});
