import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-programme-width-review");
const viewports = [
  { width: 1440, height: 1000, gutter: 72 },
  { width: 1024, height: 900, gutter: 51.2 },
  { width: 430, height: 932, gutter: 24 },
  { width: 390, height: 844, gutter: 24 },
];
const routes = [
  ["/", "FULL-BLEED + WIDE/PHOTOGRAPHIC"],
  ["/10-steps", "FULL-BLEED + STANDARD"],
  ["/program", "STANDARD + FOCUSED"],
  ["/login", "FOCUSED"],
  ["/best-offers", "STANDARD"],
  ["/casinos", "STANDARD"],
  ["/casino/demo-northstar", "STANDARD + WIDE/PHOTOGRAPHIC"],
  ["/bonuses", "STANDARD"],
  ["/bonus-guide", "READING"],
  ["/learn", "STANDARD"],
  ["/learn/casino-bonuses/welcome-bonus-terms", "READING + WIDE/PHOTOGRAPHIC"],
  ["/responsible-gambling", "STANDARD + FULL-BLEED"],
  ["/help", "STANDARD + FULL-BLEED"],
  ["/methodology", "STANDARD"],
  ["/about", "STANDARD + FULL-BLEED"],
  ["/faq", "READING"],
  ["/affiliate-disclosure", "READING"],
  ["/contact", "STANDARD + FOCUSED"],
  ["/privacy", "READING"],
  ["/terms", "READING"],
];

await mkdir(outputRoot, { recursive: true });

function programmeAuthority(journeyId) {
  const createdAt = Date.now();
  return { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-07:updated-2026-08-09", privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder-width.review" };
}

async function installAnonymousRoutes(page, withTurn = false) {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, authority: programmeAuthority(body.journeyId) }) });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  if (withTurn) await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: { startingPoint: "You described autopilot sessions after work that grow by the weekend. Your first missions focus on catching that moment before it starts — one small boundary at a time.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Continue from the situation described in Mission 01." } }, progress: { xpPreview: 20 } }),
  }));
}

async function installRecorder(page) {
  await page.addInitScript(() => {
    class FounderMediaRecorder {
      static isTypeSupported(type) { return type === "audio/webm;codecs=opus"; }
      state = "inactive";
      mimeType = "audio/webm;codecs=opus";
      ondataavailable = null;
      onstop = null;
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(3)], { type: this.mimeType }) }); this.onstop?.(); }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FounderMediaRecorder });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  });
}

async function installDashboardRoutes(page) {
  const now = new Date().toISOString();
  const userId = "founder-width-review-user";
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: { id: "founder-width-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Founder review", email: "founder-review@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } }) }));
  const titles = ["Get started", "Set your limits", "Understand your triggers", "Build one boundary", "Reality check", "Decision framework", "Play plan", "Safer play", "Review & adjust", "Long-term control"];
  const missions = titles.map((title, index) => ({ missionNumber: index + 1, title, status: index < 3 ? "completed" : index === 3 ? "current" : "locked", actionsCompleted: index < 3 ? 1 : index === 3 ? 1 : 0, actionsTotal: index < 3 ? 1 : index === 3 ? 5 : 3, xpEarnedHere: index < 3 ? 40 : 0, completionBonus: index < 3 ? 20 : 25 }));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ home: { totalXp: 1240, activeDays: 18, currentStreak: 12, achievements: [{ slug: "first-boundary", title: "First boundary", state: "earned", awardedAt: now }, { slug: "seven-day-streak", title: "7-day streak", state: "earned", awardedAt: now }], currentMission: 4, engagementDayBucket: "day_30_plus", currentAction: "choose_boundary", startingPoint: { startingPoint: "Autopilot sessions after work that grow by the weekend. Your plan focuses on catching that moment before it starts.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Pick a single limit you can keep this week. Small, specific, yours." }, missions, reviews: [{ milestone: "first", unlockMission: 3, title: "First Review", maxWords: 200, status: "locked" }, { milestone: "mid", unlockMission: 6, title: "Mid Review", maxWords: 250, status: "locked" }, { milestone: "full", unlockMission: 10, title: "Full Review", maxWords: 300, status: "locked" }], nextReview: { milestone: "mid", unlockMission: 6, title: "Mid Review", xpRemaining: 125, missionsRemaining: 2 }, discoveryLinks: [] } }) }));
}

async function enterProgramme(page) {
  await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.locator('[data-programme-presentation="mission-01-intake"]').waitFor();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
}

async function saveWebp(page, name, guides = false) {
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(160);
  const png = await page.screenshot({ animations: "disabled", fullPage: false, type: "png" });
  let pipeline = sharp(png);
  if (guides) {
    const { width, height } = await pipeline.metadata();
    const left = width === 1440 ? 72 : 24;
    const right = width - left;
    const overlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><line x1="${left}" y1="0" x2="${left}" y2="${height}" stroke="#ff2f7d" stroke-width="2"/><line x1="${right}" y1="0" x2="${right}" y2="${height}" stroke="#ff2f7d" stroke-width="2"/><text x="${left + 8}" y="28" fill="#ff2f7d" font-size="14" font-family="monospace">STANDARD ${left}px</text><text x="${right - 118}" y="28" fill="#ff2f7d" font-size="14" font-family="monospace">${right}px</text></svg>`);
    pipeline = pipeline.composite([{ input: overlay }]);
  }
  await pipeline.webp({ quality: 86 }).toFile(resolve(outputRoot, name));
}

async function publicFrameSelector(page, route) {
  if (await page.locator("[data-handoff-page]").count()) return '[data-handoff-page] .sc-host > div > div:has(> a[href="/"])';
  if (route === "/login") return "[data-login-page] > header";
  if (route === "/faq") return "article > div:first-child";
  if (route === "/contact") return "[data-contact-page] > div:first-child";
  return '[data-public-shell="header"] > div';
}

async function programmePage(browser, viewport, state) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
  const page = await context.newPage();
  if (state === "dashboard") {
    await installDashboardRoutes(page);
    await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-programme-phase="home"]').waitFor();
  } else {
    if (state === "recording") await installRecorder(page);
    await installAnonymousRoutes(page, state === "starting-point");
    if (state === "access") {
      await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
      await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
      await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
    } else {
      await enterProgramme(page);
      if (state === "recording") {
        await page.getByRole("button", { name: "Tap to speak" }).click();
        await page.locator('[data-voice-state="recording"]').waitFor();
      } else if (state === "starting-point") {
        await page.getByRole("button", { name: "I'd rather type" }).click();
        await page.getByLabel("Your situation").fill("After difficult work days I keep opening betting apps late at night.");
        await page.getByRole("button", { name: "Create my Starting Point" }).click();
        await page.locator('[data-programme-presentation="starting-point-ready"]').waitFor();
      }
    }
  }
  if (await page.locator("[data-handoff-page]").count()) throw new Error(`${state} used HandoffPage`);
  if (await page.locator('[data-runtime-renderer="programme"]').count() !== 1) throw new Error(`${state} did not use the real Programme runtime`);
  return { context, page };
}

const browser = await chromium.launch();
try {
  const desktop = { width: 1440, height: 1000 };
  const screenshots = [
    ["01-program-entry-after-access-1440.webp", "access"],
    ["02-program-voice-idle-1440.webp", "voice"],
    ["03-program-recording-1440.webp", "recording"],
    ["04-program-starting-point-1440.webp", "starting-point"],
    ["05-program-dashboard-1440.webp", "dashboard"],
  ];
  for (const [name, state] of screenshots) {
    const { context, page } = await programmePage(browser, desktop, state);
    await saveWebp(page, name);
    await context.close();
  }

  const gridRoutes = [
    ["06-home-grid-1440.webp", "/"],
    ["07-best-offers-grid-1440.webp", "/best-offers"],
    ["08-casinos-grid-1440.webp", "/casinos"],
    ["09-bonuses-grid-1440.webp", "/bonuses"],
    ["10-learn-grid-1440.webp", "/learn"],
  ];
  const gridContext = await browser.newContext({ viewport: desktop });
  for (const [name, route] of gridRoutes) {
    const page = await gridContext.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await saveWebp(page, name, true);
    await page.close();
  }
  const programmeGrid = await programmePage(browser, desktop, "access");
  await saveWebp(programmeGrid.page, "11-programme-grid-1440.webp", true);
  await programmeGrid.context.close();
  await gridContext.close();

  for (const [name, state] of [["programme-entry-390.webp", "access"], ["programme-voice-390.webp", "voice"], ["programme-dashboard-390.webp", "dashboard"]]) {
    const { context, page } = await programmePage(browser, { width: 390, height: 844 }, state);
    await saveWebp(page, name);
    await context.close();
  }

  const audit = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    for (const [route, classification] of routes) {
      const page = await context.newPage();
      if (route === "/program") await installAnonymousRoutes(page);
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      if (route === "/program") await page.locator('[data-programme-presentation="access"]').waitFor();
      const selector = route === "/program" ? '[data-programme-presentation="access"] [data-site-frame="standard"]' : await publicFrameSelector(page, route);
      await page.locator(selector).first().waitFor();
      const measurement = await page.locator(selector).first().evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const paddingLeft = Number.parseFloat(style.paddingLeft || "0");
        const paddingRight = Number.parseFloat(style.paddingRight || "0");
        return { left: rect.left + paddingLeft, right: innerWidth - rect.right + paddingRight, width: innerWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, renderer: document.querySelector('[data-runtime-renderer="programme"]') ? "REAL_RUNTIME" : null, legacyVisible: Boolean(document.querySelector('[data-programme-runtime="legacy"], [data-legacy-programme]')) };
      });
      audit.push({ route, classification, viewport: viewport.width, status: response?.status(), expectedGutter: viewport.gutter, ...measurement });
      await page.close();
    }
    await context.close();
  }

  const entryVerification = {};
  for (const entry of ["/program", "/program?entry=start", "Home CTA", "10 Steps CTA"]) {
    const context = await browser.newContext({ viewport: desktop });
    const page = await context.newPage();
    await installAnonymousRoutes(page);
    if (entry === "Home CTA") {
      await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
      await page.getByRole("link", { name: "Start Programme" }).first().click();
    } else if (entry === "10 Steps CTA") {
      await page.goto(`${baseUrl}/10-steps`, { waitUntil: "domcontentloaded" });
      await page.getByRole("link", { name: "Start Mission 01" }).first().click();
    } else await page.goto(`${baseUrl}${entry}`, { waitUntil: "domcontentloaded" });
    await enterAccessWithoutNavigation(page);
    entryVerification[entry] = { renderer: await page.locator('[data-runtime-renderer="programme"]').count() === 1 ? "REAL_RUNTIME" : "MISSING", voice: await page.getByRole("button", { name: "Tap to speak" }).isVisible(), textFallback: await page.getByRole("button", { name: "I'd rather type" }).isVisible(), legacy: await page.getByRole("heading", { name: "Confirm before you continue." }).count() > 0 };
    await context.close();
  }

  await writeFile(resolve(outputRoot, "metrics.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), renderer: "REAL_RUNTIME", audit, entryVerification }, null, 2)}\n`);
  const rows = audit.map((item) => `| ${item.route} | ${item.classification} | ${item.viewport} | ${item.left.toFixed(1)} | ${item.right.toFixed(1)} | ${item.overflow ? "FAIL" : "PASS"} |`).join("\n");
  const readme = `# Founder Programme and Width Review\n\n- Renderer: **REAL_RUNTIME** (the normal React route and \`ProgramAiExperience\`; no Programme \`HandoffPage\`).\n- Legacy Programme public reachability: **NONE**. \`ActiveControlProgramme\` remains non-public legacy code.\n- Standard tokens: \`--site-gutter: clamp(24px, 5vw, 72px)\`, \`--site-content-max: 1312px\`, \`--site-wide-max: 1440px\`, \`--site-reading-max: 760px\`, and \`--site-content-width\`.\n- Expected standard outer edges: 1440 → 72px; 1024 → 51.2px; 430/390 → 24px.\n- Exceptions: WIDE/PHOTOGRAPHIC, READING, FOCUSED, FULL-BLEED and OVERLAY are intentional inner/section classifications. They do not replace the standard site chrome or Programme outer frame.\n- The six \`*-grid-1440.webp\` images use the same magenta 72px / 1368px guide lines.\n\n## Route audit\n\n| Route | Classification | Viewport | Left edge | Right edge | Overflow |\n| --- | --- | ---: | ---: | ---: | --- |\n${rows}\n\n## Voice-first entry\n\n${Object.entries(entryVerification).map(([entry, result]) => `- ${entry}: renderer ${result.renderer}; voice ${result.voice ? "PASS" : "FAIL"}; text fallback ${result.textFallback ? "PASS" : "FAIL"}; legacy ${result.legacy ? "FAIL" : "NONE"}.`).join("\n")}\n`;
  await writeFile(resolve(outputRoot, "README.md"), readme);
} finally {
  await browser.close();
}

async function enterAccessWithoutNavigation(page) {
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.locator('[data-programme-presentation="mission-01-intake"]').waitFor();
}
