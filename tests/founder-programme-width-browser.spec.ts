import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

const publicRoutes = [
  "/",
  "/10-steps",
  "/login",
  "/best-offers",
  "/casinos",
  "/casino/demo-northstar",
  "/bonuses",
  "/bonus-guide",
  "/learn",
  "/learn/casino-bonuses/welcome-bonus-terms",
  "/responsible-gambling",
  "/help",
  "/methodology",
  "/about",
  "/faq",
  "/affiliate-disclosure",
  "/contact",
  "/privacy",
  "/terms",
] as const;

const viewports = [
  { width: 1440, height: 900, gutter: 72 },
  { width: 1024, height: 768, gutter: 51.2 },
  { width: 430, height: 932, gutter: 24 },
  { width: 390, height: 844, gutter: 24 },
] as const;

async function standardEdges(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: rect.left + Number.parseFloat(style.paddingLeft || "0"),
      right: innerWidth - rect.right + Number.parseFloat(style.paddingRight || "0"),
    };
  });
}

function publicFrameSelector(route: string) {
  if (route === "/help") return '[data-protected-help="header"]';
  if (route === "/login") return "[data-login-page] > header";
  if (route === "/faq") return "article > header > div";
  if (route === "/contact") return "[data-contact-page] > header > div";
  return '[data-public-shell="header"] > div';
}

async function installAnonymousProgramme(page: Page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON() as { journeyId: string };
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-07:updated-2026-08-09", privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.width" } }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

async function completeAccess(page: Page) {
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await expect(page.locator('[data-programme-presentation="mission-01-intake"]')).toBeVisible();
}

for (const viewport of viewports) {
  test(`the shared outer frame is stable across every public destination at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(3 * 60_000);
    await page.setViewportSize(viewport);
    for (const route of publicRoutes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBe(200);
      const frameSelector = publicFrameSelector(route);
      const headerFrame = page.locator(frameSelector).first();
      await expect(headerFrame, `${route} shared header frame`).toBeVisible();
      const edges = await standardEdges(page, frameSelector);
      expect(Math.abs(edges.left - viewport.gutter), `${route} left edge`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(edges.right - viewport.gutter), `${route} right edge`).toBeLessThanOrEqual(1.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${route} overflow`).toBe(true);
    }

    await installAnonymousProgramme(page);
    const programmeResponse = await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    expect(programmeResponse?.status()).toBe(200);
    await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toBeVisible();
    await expect(page.locator('[data-handoff-page]')).toHaveCount(0);
    await expect(page.locator('[data-programme-presentation="access"]')).toBeVisible();
    const programmeEdges = await standardEdges(page, '[data-programme-presentation="access"] [data-site-frame="standard"]');
    expect(Math.abs(programmeEdges.left - viewport.gutter), "Programme left edge").toBeLessThanOrEqual(1.5);
    expect(Math.abs(programmeEdges.right - viewport.gutter), "Programme right edge").toBeLessThanOrEqual(1.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "Programme overflow").toBe(true);
  });
}

for (const entry of ["/program", "/program?entry=start", "home", "ten-steps"] as const) {
  test(`${entry} reaches the canonical voice-first Mission 01 renderer`, async ({ page }) => {
    await installAnonymousProgramme(page);
    if (entry === "home") {
      await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
      await page.getByRole("link", { name: "Start Programme" }).first().click();
    } else if (entry === "ten-steps") {
      await page.goto(`${baseUrl}/10-steps`, { waitUntil: "domcontentloaded" });
      await page.getByRole("link", { name: "Start Mission 01" }).first().click();
    } else {
      await page.goto(`${baseUrl}${entry}`, { waitUntil: "domcontentloaded" });
    }
    await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toBeVisible();
    await expect(page.locator('[data-runtime-renderer="programme"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Three checks before you begin." })).toBeVisible();
    await completeAccess(page);
    await expect(page.getByRole("button", { name: "Tap to speak" })).toBeVisible();
    await expect(page.getByRole("button", { name: "I'd rather type" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toHaveCount(0);
  });
}
