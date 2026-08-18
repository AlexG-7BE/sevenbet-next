import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-interaction-review");
await mkdir(outputRoot, { recursive: true });

async function save(page, name, options = {}) {
  const buffer = await page.screenshot({ animations: "disabled", type: "png", ...options });
  await sharp(buffer).webp({ quality: 88, effort: 5 }).toFile(resolve(outputRoot, name));
}

async function runtimePage(context, route, renderer) {
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  if (!response || response.status() >= 400) throw new Error(`${route} returned ${response?.status() ?? "no response"}`);
  await page.locator(`[data-runtime-renderer="${renderer}"]`).waitFor();
  if (await page.locator("[data-handoff-page]").count()) throw new Error(`${route} switched to HandoffPage`);
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  return page;
}

async function placeUnderHeader(page, selector) {
  await page.locator(selector).first().evaluate((element) => {
    const headerHeight = document.querySelector('[data-public-shell="header"]')?.getBoundingClientRect().height ?? 81;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - headerHeight + 2, behavior: "instant" });
  });
  await page.waitForTimeout(520);
}

async function settleFullPageReveals(page) {
  const viewportHeight = page.viewportSize()?.height ?? 800;
  let position = 0;
  while (position < await page.evaluate(() => document.documentElement.scrollHeight)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), position);
    await page.waitForTimeout(90);
    position += Math.max(320, viewportHeight - 120);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(520);
  const pending = await page.locator('[data-motion-state="pending"]').count();
  if (pending) throw new Error(`${pending} reveal regions remained pending after the mobile evidence sweep`);
}

async function installProgrammeRoutes(page) {
  await page.addInitScript(() => {
    class ReviewMediaRecorder {
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
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: ReviewMediaRecorder });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  });
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", async (route) => {
    const body = route.request().postDataJSON();
    const createdAt = Date.now();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-07:updated-2026-08-09", privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.interaction" } }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const review = await runtimePage(desktop, "/casino/demo-northstar?visualFixture=true", "casino-review");
  if (await review.locator("#editorial-review").count() !== 1) throw new Error("Casino Review visual data fixture did not supply the structured editorial document");
  await save(review, "casino-review-hero-1440.webp");
  await placeUnderHeader(review, "#overview");
  await save(review, "casino-review-overview-1440.webp");
  await placeUnderHeader(review, "#offer-evidence");
  await save(review, "casino-review-offer-1440.webp");
  await placeUnderHeader(review, "#editorial-review");
  await save(review, "casino-review-editorial-1440.webp");
  await placeUnderHeader(review, "#verdict");
  await save(review, "casino-review-score-1440.webp");
  await placeUnderHeader(review, "#faq [data-nav-theme='dark']");
  await save(review, "casino-review-final-1440.webp");
  await review.close();

  const bonuses = await runtimePage(desktop, "/bonuses?visualFixture=true", "bonuses");
  await save(bonuses, "bonuses-header-dark-1440.webp");
  await placeUnderHeader(bonuses, '[aria-labelledby="bonus-shortlist-title"]');
  await save(bonuses, "bonuses-header-light-1440.webp");
  await placeUnderHeader(bonuses, "#bonus-calculator-title");
  await save(bonuses, "bonuses-header-dark-again-1440.webp");
  await bonuses.getByLabel("Bonus amount").fill("100");
  await bonuses.getByRole("radio", { name: "Deposit + bonus" }).locator("..").click();
  await bonuses.getByRole("radio", { name: "Blackjack · 10%" }).locator("..").click();
  await bonuses.locator("output").waitFor();
  await save(bonuses, "bonuses-calculator-1440.webp");
  await bonuses.close();

  const casinos = await runtimePage(desktop, "/casinos?visualFixture=true", "casinos");
  await casinos.evaluate(() => sessionStorage.removeItem("b4gamble:public-comparison:v1"));
  await casinos.reload({ waitUntil: "networkidle" });
  await casinos.getByRole("button", { name: "Compare", exact: true }).first().click();
  await casinos.locator("[data-comparison-tray]").waitFor();
  await save(casinos, "casinos-comparison-closed-1440.webp");
  await casinos.getByRole("button", { name: "Compare", exact: true }).first().click();
  await casinos.locator('dialog[data-runtime-renderer="contextual-comparison"][open]').waitFor();
  await casinos.locator('dialog[data-runtime-renderer="contextual-comparison"] article').first().waitFor();
  await save(casinos, "casinos-comparison-open-1440.webp");
  await casinos.close();
  await desktop.close();

  const programmeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const programme = await programmeContext.newPage();
  await installProgrammeRoutes(programme);
  await programme.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await programme.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await programme.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await programme.getByRole("button", { name: "Enter Mission 01" }).click();
  try {
    await programme.locator('[data-programme-presentation="mission-01-intake"]').waitFor();
  } catch (error) {
    const state = (await programme.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1200);
    throw new Error(`Programme did not enter Mission 01. Visible state: ${state}`, { cause: error });
  }
  await programme.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
  await programme.getByRole("button", { name: "Tap to speak" }).click();
  await programme.locator('[data-voice-state="recording"]').waitFor();
  if (await programme.locator('[data-public-programme-renderer="program-ai"]').count() !== 1 || await programme.locator("[data-handoff-page]").count()) throw new Error("Programme screenshot is not the canonical runtime renderer");
  await save(programme, "programme-recording-state-1440.webp");
  await programme.close();
  await programmeContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobileReview = await runtimePage(mobile, "/casino/demo-northstar?visualFixture=true", "casino-review");
  await settleFullPageReveals(mobileReview);
  await save(mobileReview, "casino-review-390.webp", { fullPage: true });
  await mobileReview.close();
  await mobile.close();
} finally {
  await browser.close();
}

console.log(`Founder interaction review written to ${outputRoot}`);
