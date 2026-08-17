import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-mobile-review");

await mkdir(outputRoot, { recursive: true });

async function saveWebp(page, name) {
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(120);
  const png = await page.screenshot({ animations: "disabled", fullPage: false, type: "png" });
  await sharp(png).webp({ quality: 88, effort: 5 }).toFile(resolve(outputRoot, name));
}

async function assertRuntime(page, renderer) {
  const marker = page.locator(`[data-runtime-renderer="${renderer}"]`);
  await marker.waitFor();
  if (await marker.count() !== 1) throw new Error(`${renderer} runtime marker missing or duplicated`);
  if (await page.locator("[data-handoff-page]").count()) throw new Error(`${renderer} capture used HandoffPage`);
}

async function openRuntime(page, route, renderer) {
  let response = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    if (response?.status() === 200) break;
    await page.waitForTimeout(750);
  }
  if (response?.status() !== 200) throw new Error(`${route} returned ${response?.status()}`);
  if (renderer) await assertRuntime(page, renderer);
}

async function installAnonymousProgramme(page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-07:updated-2026-08-09", privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.mobile" } }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app.", broadContext: "WORK", continuationCue: "Continue from the after-work pause." } } }),
  }));
  await page.addInitScript(() => {
    class FounderMediaRecorder {
      static isTypeSupported(type) { return type === "audio/webm;codecs=opus"; }
      state = "inactive";
      mimeType = "audio/webm;codecs=opus";
      ondataavailable = null;
      onstop = null;
      start() { this.state = "recording"; }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob([new Uint8Array(3)], { type: this.mimeType }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FounderMediaRecorder });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  });
}

async function installDashboardProgramme(page) {
  const now = new Date().toISOString();
  const userId = "founder-mobile-review-user";
  await page.route("**/api/auth/get-session", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      session: { id: "founder-mobile-review-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now },
      user: { id: userId, name: "Founder review", email: "founder-review@example.invalid", emailVerified: true, createdAt: now, updatedAt: now },
    }),
  }));
  const titles = ["Get started", "Set your limits", "Understand your triggers", "Build one boundary", "Reality check", "Decision framework", "Play plan", "Safer play", "Review & adjust", "Long-term control"];
  const missions = titles.map((title, index) => ({
    missionNumber: index + 1,
    title,
    status: index < 3 ? "completed" : index === 3 ? "current" : "locked",
    actionsCompleted: index < 3 ? 1 : index === 3 ? 1 : 0,
    actionsTotal: index < 3 ? 1 : index === 3 ? 5 : 3,
    xpEarnedHere: index < 3 ? 40 : 0,
    completionBonus: index < 3 ? 20 : 25,
  }));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      home: {
        totalXp: 1240,
        activeDays: 18,
        currentStreak: 12,
        achievements: [
          { slug: "first-boundary", title: "First boundary", state: "earned", awardedAt: now },
          { slug: "seven-day-streak", title: "7-day streak", state: "earned", awardedAt: now },
        ],
        currentMission: 4,
        engagementDayBucket: "day_30_plus",
        currentAction: "choose_boundary",
        startingPoint: {
          startingPoint: "Autopilot sessions after work that grow by the weekend. Your plan focuses on catching that moment before it starts.",
          desiredChange: "Build more control around the situation described here.",
          broadContext: "NOT_SPECIFIED",
          continuationCue: "Pick a single limit you can keep this week. Small, specific, yours.",
        },
        missions,
        reviews: [
          { milestone: "first", unlockMission: 3, title: "First Review", maxWords: 200, status: "locked" },
          { milestone: "mid", unlockMission: 6, title: "Mid Review", maxWords: 250, status: "locked" },
          { milestone: "full", unlockMission: 10, title: "Full Review", maxWords: 300, status: "locked" },
        ],
        nextReview: { milestone: "mid", unlockMission: 6, title: "Mid Review", xpRemaining: 125, missionsRemaining: 2 },
        discoveryLinks: [],
      },
    }),
  }));
}

async function captureTop(browser, width, height, route, renderer, name) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await openRuntime(page, route, renderer);
  await saveWebp(page, name);
  await context.close();
}

const browser = await chromium.launch();
try {
  const mobile390 = { width: 390, height: 844 };

  await captureTop(browser, 390, 844, "/", null, "01-home-390.webp");
  await captureTop(browser, 390, 844, "/best-offers?visualFixture=true", "best-offers", "02-best-offers-390.webp");
  await captureTop(browser, 390, 844, "/casinos?visualFixture=true", "casinos", "03-casinos-390.webp");
  await captureTop(browser, 390, 844, "/casino/demo-northstar?visualFixture=true", "casino-review", "04-casino-review-top-390.webp");

  {
    const context = await browser.newContext({ viewport: mobile390, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await openRuntime(page, "/casino/demo-northstar?visualFixture=true", "casino-review");
    await page.locator("#editorial-review").evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 80);
    });
    await saveWebp(page, "05-casino-review-editorial-390.webp");
    await context.close();
  }

  await captureTop(browser, 390, 844, "/bonuses?visualFixture=true", "bonuses", "06-bonuses-top-390.webp");
  {
    const context = await browser.newContext({ viewport: mobile390, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await openRuntime(page, "/bonuses?visualFixture=true", "bonuses");
    const trigger = page.getByRole("button", { name: /Open bonus filters/i });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await page.locator("#bonus-filter-dialog").waitFor();
    await saveWebp(page, "07-bonuses-filters-390.webp");
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: mobile390, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await openRuntime(page, "/bonuses?visualFixture=true", "bonuses");
    await page.locator('[aria-labelledby="bonus-calculator-title"]').scrollIntoViewIfNeeded();
    await page.getByLabel("Bonus amount").fill("100");
    await page.getByRole("radio", { name: "Deposit + bonus" }).check({ force: true });
    await page.getByRole("radio", { name: "Blackjack · 10%" }).check({ force: true });
    await saveWebp(page, "08-bonuses-calculator-390.webp");
    await context.close();
  }

  await captureTop(browser, 390, 844, "/learn", null, "09-learn-390.webp");

  {
    const context = await browser.newContext({ viewport: mobile390, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await installAnonymousProgramme(page);
    await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    await assertRuntime(page, "programme");
    await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
    await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
    await page.getByRole("button", { name: "Enter Mission 01" }).click();
    await page.locator('[data-programme-presentation="mission-01-intake"]').waitFor();
    await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
    await page.getByRole("button", { name: "Tap to speak" }).click();
    await page.locator('[data-voice-state="recording"]').waitFor();
    await saveWebp(page, "10-programme-voice-390.webp");
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: mobile390, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await installDashboardProgramme(page);
    await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    await assertRuntime(page, "programme");
    await page.locator('[data-programme-presentation="dashboard"]').waitFor();
    await saveWebp(page, "11-programme-dashboard-390.webp");
    await context.close();
  }

  await captureTop(browser, 390, 844, "/10-steps", null, "12-ten-steps-390.webp");

  for (const [width, height] of [[360, 800], [430, 932]]) {
    const suffix = `${width}.webp`;
    await captureTop(browser, width, height, "/best-offers?visualFixture=true", "best-offers", `best-offers-${suffix}`);
    await captureTop(browser, width, height, "/casinos?visualFixture=true", "casinos", `casinos-${suffix}`);
    await captureTop(browser, width, height, "/casino/demo-northstar?visualFixture=true", "casino-review", `casino-review-${suffix}`);
    await captureTop(browser, width, height, "/bonuses?visualFixture=true", "bonuses", `bonuses-${suffix}`);
    if (width === 360) await captureTop(browser, width, height, "/program", "programme", `programme-${suffix}`);
  }

  const files = [
    "01-home-390.webp", "02-best-offers-390.webp", "03-casinos-390.webp", "04-casino-review-top-390.webp",
    "05-casino-review-editorial-390.webp", "06-bonuses-top-390.webp", "07-bonuses-filters-390.webp",
    "08-bonuses-calculator-390.webp", "09-learn-390.webp", "10-programme-voice-390.webp",
    "11-programme-dashboard-390.webp", "12-ten-steps-390.webp", "best-offers-360.webp", "casinos-360.webp",
    "casino-review-360.webp", "bonuses-360.webp", "programme-360.webp", "best-offers-430.webp", "casinos-430.webp",
    "casino-review-430.webp", "bonuses-430.webp",
  ];
  await writeFile(resolve(outputRoot, "capture-manifest.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl,
    renderer: "REAL_RUNTIME",
    handoffPageForDynamicRoutes: false,
    fixtureBoundary: "Local data-only fixture; renderer, component tree, CSS and interactions unchanged",
    files,
  }, null, 2)}\n`);
} finally {
  await browser.close();
}
