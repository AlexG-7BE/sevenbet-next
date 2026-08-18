import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const handoffRoot = process.env.B4GAMBLE_HANDOFF_DIR;
const onlyAsset = process.env.FOUNDER_ACCEPTANCE_ONLY ?? "";
if (!handoffRoot) throw new Error("B4GAMBLE_HANDOFF_DIR must point to the extracted final handoff directory");

const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-acceptance");
const publicSurfaces = [
  ["home", "Home.dc.html", "/"],
  ["best-offers", "Best Offers.dc.html", "/best-offers"],
  ["casinos", "Casinos.dc.html", "/casinos"],
  ["casino-review", "Casino Review.dc.html", "/casino/demo-northstar"],
  ["bonuses", "Bonuses.dc.html", "/bonuses"],
  ["bonus-guide", "Article.dc.html", "/bonus-guide"],
  ["learn", "Learn.dc.html", "/learn"],
  ["help", "Help.dc.html", "/help"],
];
const viewportProfiles = [
  { width: 1440, height: 1000, maxCaptureHeight: 2100, panelWidth: 1040 },
  { width: 390, height: 844, maxCaptureHeight: 2200, panelWidth: 390 },
];

function labelSvg(width, label) {
  return Buffer.from(`<svg width="${width}" height="48" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#100f0f"/><text x="16" y="30" fill="#fafaf7" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">${label}</text></svg>`);
}

async function boundedPanel(buffer, panelWidth, maxCaptureHeight) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const cropHeight = Math.min(metadata.height ?? maxCaptureHeight, maxCaptureHeight);
  return image
    .extract({ left: 0, top: 0, width: metadata.width, height: cropHeight })
    .resize({ width: panelWidth, withoutEnlargement: false })
    .webp({ quality: 64, effort: 5 })
    .toBuffer();
}

async function writeComparison(name, profile, reference, implementation) {
  const [left, right] = await Promise.all([
    boundedPanel(reference, profile.panelWidth, profile.maxCaptureHeight),
    boundedPanel(implementation, profile.panelWidth, profile.maxCaptureHeight),
  ]);
  const [leftMeta, rightMeta] = await Promise.all([sharp(left).metadata(), sharp(right).metadata()]);
  const gap = 16;
  const bodyHeight = Math.max(leftMeta.height ?? 0, rightMeta.height ?? 0);
  const headerHeight = 48;
  const width = profile.panelWidth * 2 + gap;
  const background = { r: 231, g: 228, b: 220, alpha: 1 };
  await sharp({ create: { width, height: bodyHeight + headerHeight, channels: 4, background } })
    .composite([
      { input: labelSvg(profile.panelWidth, "HANDOFF REFERENCE"), left: 0, top: 0 },
      { input: labelSvg(profile.panelWidth, "CURRENT IMPLEMENTATION"), left: profile.panelWidth + gap, top: 0 },
      { input: left, left: 0, top: headerHeight },
      { input: right, left: profile.panelWidth + gap, top: headerHeight },
    ])
    .webp({ quality: 64, effort: 5 })
    .toFile(join(outputRoot, `${name}-${profile.width}.webp`));
}

async function handoffPage(context, file) {
  const page = await context.newPage();
  await page.goto(pathToFileURL(join(handoffRoot, file)).href, { waitUntil: "load" });
  await page.waitForTimeout(250);
  return page;
}

async function screenshotElement(page, selector) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  return element.screenshot({ animations: "disabled" });
}

async function captureProgrammeReference(context, profile, state) {
  const page = await handoffPage(context, "Programme.dc.html");
  let buffer;
  if (state === "intake") {
    buffer = await screenshotElement(page, "section:nth-of-type(1) > div:nth-child(2) > div:nth-child(1)");
  } else if (state === "ready") {
    buffer = await screenshotElement(page, "section:nth-of-type(1) > div:nth-child(2) > div:nth-child(3)");
  } else if (profile.width === 390) {
    buffer = await screenshotElement(page, 'div[style*="width: 375px"][style*="background: rgb(23, 22, 22)"]');
  } else {
    buffer = await screenshotElement(page, "section:nth-of-type(2) > div:nth-child(2)");
  }
  await page.close();
  return buffer;
}

async function installAnonymousRoutes(page) {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

async function enterProgrammeIntake(page) {
  await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
}

async function captureProgrammeImplementation(context, state) {
  const page = await context.newPage();
  if (state === "dashboard") {
    const now = new Date().toISOString();
    const userId = "founder-visual-user";
    await page.route("**/api/auth/get-session", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: { id: "founder-visual-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now },
        user: { id: userId, name: "Founder review", email: "founder-review@example.invalid", emailVerified: true, createdAt: now, updatedAt: now },
      }),
    }));
    const titles = ["Create your Starting Point", "Set a 7-day goal", "Map the urge sequence", "Build one boundary", "Add friction", "Create a support route", "Read offers clearly", "Rehearse a pressure moment", "Assemble your plan", "Keep the plan current"];
    const missions = titles.map((title, index) => ({
      missionNumber: index + 1,
      title,
      status: index === 0 ? "completed" : index === 1 ? "current" : "locked",
      actionsCompleted: index === 0 ? 1 : 0,
      actionsTotal: index === 0 ? 1 : 3,
      xpEarnedHere: index === 0 ? 40 : 0,
      completionBonus: index === 0 ? 20 : 25,
    }));
    await page.route("**/api/program/program-ai/home", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ home: {
        totalXp: 40,
        activeDays: 1,
        currentStreak: 1,
        achievements: [],
        currentMission: 2,
        engagementDayBucket: "day_1",
        currentAction: "choose_direction",
        startingPoint: { startingPoint: "After difficult work days I keep opening betting apps late at night.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Continue from the situation described in Mission 01." },
        missions,
        reviews: [
          { milestone: "first", unlockMission: 3, title: "First Review", maxWords: 200, status: "locked" },
          { milestone: "mid", unlockMission: 6, title: "Mid Review", maxWords: 250, status: "locked" },
          { milestone: "full", unlockMission: 10, title: "Full Review", maxWords: 300, status: "locked" },
        ],
        nextReview: { milestone: "first", unlockMission: 3, title: "First Review", xpRemaining: 125, missionsRemaining: 2 },
        discoveryLinks: [],
      } }),
    }));
    await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-programme-phase="home"]').waitFor();
  } else {
    await installAnonymousRoutes(page);
    await enterProgrammeIntake(page);
    if (state === "ready") {
      await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: { startingPoint: "After difficult work days I keep opening betting apps late at night.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Continue from the situation described in Mission 01." } }, progress: { xpPreview: 20 } }),
      }));
      await page.getByRole("button", { name: "I'd rather type" }).click();
      await page.getByLabel("Your situation").fill("After difficult work days I keep opening betting apps late at night.");
      await page.getByRole("button", { name: "Create my Starting Point" }).click();
      await page.locator('[data-programme-phase="registration"]').waitFor();
    }
  }
  const buffer = await page.screenshot({ animations: "disabled", fullPage: true });
  await page.close();
  return buffer;
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const profile of viewportProfiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height } });
    for (const [name, handoffFile, route] of publicSurfaces) {
      if (onlyAsset && onlyAsset !== `${name}-${profile.width}`) continue;
      const referencePage = await handoffPage(context, handoffFile);
      const reference = await referencePage.screenshot({ animations: "disabled", fullPage: true });
      await referencePage.close();
      const implementationPage = await context.newPage();
      const response = await implementationPage.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      if (!response || response.status() >= 500) throw new Error(`${route} returned ${response?.status() ?? "no response"}`);
      await implementationPage.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
      const implementation = await implementationPage.screenshot({ animations: "disabled", fullPage: true });
      await implementationPage.close();
      if (name === "casinos" || name === "bonuses") {
        await sharp(implementation).png({ compressionLevel: 9 }).toFile(join(outputRoot, "..", String(profile.width), `${name}.png`));
      }
      await writeComparison(name, profile, reference, implementation);
    }
    for (const state of ["intake", "ready", "dashboard"]) {
      const assetName = `programme-${state === "ready" ? "starting-point-registration" : state}`;
      if (onlyAsset && onlyAsset !== `${assetName}-${profile.width}`) continue;
      const [reference, implementation] = await Promise.all([
        captureProgrammeReference(context, profile, state),
        captureProgrammeImplementation(context, state),
      ]);
      await writeComparison(assetName, profile, reference, implementation);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`Founder acceptance assets written to ${outputRoot}`);
