import { expect, test, type Locator, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1024, height: 900 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
] as const;
const publicRoutes = [
  "/",
  "/program",
  "/best-offers?visualFixture=true",
  "/casinos?visualFixture=true",
  "/casino/demo-northstar?visualFixture=true",
  "/bonuses?visualFixture=true",
  "/learn/casino-bonuses/welcome-bonus-terms?visualFixture=true",
  "/help",
  "/casinos?casino=demo-northstar&casino=demo-summit&country=GB&visualFixture=true",
] as const;
const decorativeClassFragments = ["heroKicker", "cardEyebrow", "miniScreen", "compactPosition"];

async function waitForFonts(page: Page) {
  await page.evaluate(() => Promise.race([
    document.fonts?.ready,
    new Promise((resolve) => window.setTimeout(resolve, 2_000)),
  ]));
}

async function visibleTextBelowTwelve(page: Page) {
  return page.evaluate((allowedFragments) => Array.from(document.querySelectorAll<HTMLElement>("body *"))
    .filter((element) => {
      if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(element.tagName)) return false;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      if (!element.getClientRects().length) return false;
      const rawClassName = element.className as unknown;
      const className = typeof rawClassName === "string" ? rawClassName : (rawClassName as { baseVal?: string })?.baseVal ?? "";
      if (allowedFragments.some((fragment) => className.includes(fragment))) return false;
      const hasDirectText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!hasDirectText) return false;
      const size = Number.parseFloat(style.fontSize);
      return size > 0 && size < 12;
    })
    .slice(0, 12)
    .map((element) => ({
      className: element.className,
      fontSize: getComputedStyle(element).fontSize,
      tag: element.tagName,
      text: element.textContent?.trim().slice(0, 100),
    })), decorativeClassFragments);
}

async function expectMinimum(locator: Locator, minimum: number, description: string) {
  const measurements = await locator.evaluateAll((elements) => elements
    .filter((element) => {
      const html = element as HTMLElement;
      const style = getComputedStyle(html);
      return style.display !== "none" && style.visibility !== "hidden" && html.getClientRects().length > 0;
    })
    .map((element) => ({
      className: (element as HTMLElement).className,
      size: Number.parseFloat(getComputedStyle(element).fontSize),
      text: element.textContent?.trim().slice(0, 80),
    })));
  expect(measurements.length, `${description} must resolve visible elements`).toBeGreaterThan(0);
  expect(measurements.filter((item) => item.size < minimum), description).toEqual([]);
}

async function expectNoOverflow(page: Page, description: string) {
  await page.evaluate(() => {
    document.documentElement.style.scrollbarGutter = "stable";
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
  const overflowing = await page.evaluate(() => {
    if (document.documentElement.scrollWidth <= document.documentElement.clientWidth) return [];
    return Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.position === "fixed" || style.position === "sticky" || style.display === "none") return false;
        const rect = element.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
      })
      .slice(0, 10)
      .map((element) => ({ className: element.className, tag: element.tagName, text: element.textContent?.trim().slice(0, 80) }));
  });
  expect(overflowing, description).toEqual([]);
}

async function installAnonymousProgramme(page: Page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON() as { journeyId: string };
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-07:updated-2026-08-09", privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.typography.audit" } }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

async function installDashboard(page: Page) {
  const now = new Date().toISOString();
  const userId = "typography-review-user";
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: { id: "typography-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Typography review", email: "typography@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } }) }));
  const titles = ["Get started", "Set your limits", "Understand your triggers", "Build one boundary", "Reality check", "Decision framework", "Play plan", "Safer play", "Review & adjust", "Long-term control"];
  const missions = titles.map((title, index) => ({ missionNumber: index + 1, title, status: index < 3 ? "completed" : index === 3 ? "current" : "locked", actionsCompleted: index < 3 ? 1 : 0, actionsTotal: index < 3 ? 1 : 3, xpEarnedHere: index < 3 ? 40 : 0, completionBonus: index < 3 ? 20 : 25 }));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ home: { totalXp: 1240, activeDays: 18, currentStreak: 12, achievements: [{ slug: "first-boundary", title: "First boundary", state: "earned", awardedAt: now }], currentMission: 4, engagementDayBucket: "day_30_plus", currentAction: "choose_boundary", startingPoint: { startingPoint: "Autopilot sessions after work that grow by the weekend.", desiredChange: "Build more control.", broadContext: "NOT_SPECIFIED", continuationCue: "Pick one boundary." }, missions, reviews: [{ milestone: "first", unlockMission: 3, title: "First Review", maxWords: 200, status: "locked" }], nextReview: { milestone: "mid", unlockMission: 6, title: "Mid Review", xpRemaining: 125, missionsRemaining: 2 }, discoveryLinks: [] } }) }));
}

test("final public routes keep sub-12 text decorative-only and remain overflow-free", async ({ browser }) => {
  test.setTimeout(12 * 60_000);
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    for (const route of publicRoutes) {
      const page = await context.newPage();
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      expect(response?.status(), `${route} at ${viewport.width}px`).toBe(200);
      await waitForFonts(page);
      expect(await visibleTextBelowTwelve(page), `${route} sub-12px text at ${viewport.width}px`).toEqual([]);
      await expectNoOverflow(page, `${route} overflow at ${viewport.width}px`);
      await page.close();
    }
    await context.close();
  }
});

test("Bonuses decision UI uses the functional scale at every Founder viewport", async ({ browser }) => {
  test.setTimeout(6 * 60_000);
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-runtime-renderer="bonuses"]')).toHaveCount(1);
    await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
    await expectMinimum(page.locator('section[aria-labelledby="bonus-shortlist-title"] dl div'), 14, `Top 3 terms at ${viewport.width}px`);
    await expectMinimum(page.locator('section[aria-labelledby="bonus-shortlist-title"] [class*="actions"] :is(a,button,span)'), 14, `Top 3 actions at ${viewport.width}px`);
    await expectMinimum(page.locator('[class*="calculatorControls"] :is(legend,label)'), 14, `calculator controls at ${viewport.width}px`);
    await expectMinimum(page.locator('[class*="calculatorOutput"] dt'), 14, `calculator result labels at ${viewport.width}px`);
    await expectMinimum(page.locator('[class*="calculatorOutput"] > p'), 14, `calculator explanation at ${viewport.width}px`);
    if (viewport.width <= 430) {
      await page.getByRole("button", { name: /Filters/i }).click();
      await expectMinimum(page.getByRole("dialog", { name: /Filter Bonuses/i }).locator("select,input"), 16, `mobile bonus fields at ${viewport.width}px`);
      await page.keyboard.press("Escape");
    } else {
      await expectMinimum(page.locator('form[action="/bonuses"]').first().locator("select,input"), 15, `desktop bonus fields at ${viewport.width}px`);
    }
    await expectMinimum(page.locator('article[class*="comparisonRow"] [class*="compactTerms"] dt'), 13, `bonus comparison labels at ${viewport.width}px`);
    await expectMinimum(page.locator('article[class*="comparisonRow"] [class*="compactTerms"] dd'), 14, `bonus comparison values at ${viewport.width}px`);
    await expectNoOverflow(page, `Bonuses overflow at ${viewport.width}px`);
    await context.close();
  }
});

test("Programme Mission 01 and Dashboard retain readable functional text", async ({ browser }) => {
  test.setTimeout(6 * 60_000);
  for (const viewport of viewports) {
    const missionContext = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    const missionPage = await missionContext.newPage();
    await installAnonymousProgramme(missionPage);
    await missionPage.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    await missionPage.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
    await missionPage.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
    await missionPage.getByRole("button", { name: "Enter Mission 01" }).click();
    await expect(missionPage.locator('[data-programme-presentation="mission-01-intake"]')).toBeVisible();
    expect(await visibleTextBelowTwelve(missionPage), `Mission 01 sub-12px at ${viewport.width}px`).toEqual([]);
    await expectMinimum(missionPage.locator('[data-programme-presentation="mission-01-intake"] button'), 14, `Mission 01 controls at ${viewport.width}px`);
    await expectNoOverflow(missionPage, `Mission 01 overflow at ${viewport.width}px`);
    await missionContext.close();

    const dashboardContext = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    const dashboardPage = await dashboardContext.newPage();
    await installDashboard(dashboardPage);
    await dashboardPage.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    await expect(dashboardPage.locator('[data-programme-phase="home"]')).toBeVisible();
    expect(await visibleTextBelowTwelve(dashboardPage), `Dashboard sub-12px at ${viewport.width}px`).toEqual([]);
    await expectMinimum(dashboardPage.locator('[data-programme-phase="home"] button'), 14, `Dashboard controls at ${viewport.width}px`);
    await expectNoOverflow(dashboardPage, `Dashboard overflow at ${viewport.width}px`);
    await dashboardContext.close();
  }
});
