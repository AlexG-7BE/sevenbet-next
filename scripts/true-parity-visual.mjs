import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const referenceBaseUrl = process.env.TRUE_PARITY_REFERENCE_URL ?? "http://127.0.0.1:4180";
const implementationBaseUrl = process.env.TRUE_PARITY_IMPLEMENTATION_URL ?? "http://127.0.0.1:4173";
const phase = process.env.TRUE_PARITY_PHASE ?? "all";
const only = process.env.TRUE_PARITY_ONLY ?? "";
const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/true-parity");

const viewports = [
  { width: 1440, height: 1000 },
  { width: 1024, height: 900 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];

const pages = [
  ["home", "Home.dc.html", "/"],
  ["ten-steps", "10 Steps v2.dc.html", "/10-steps"],
  ["login", "Login.dc.html", "/login"],
  ["best-offers", "Best Offers.dc.html", "/best-offers"],
  ["casinos", "Casinos.dc.html", "/casinos"],
  ["casino-review", "Casino Review.dc.html", "/casino/demo-northstar"],
  ["bonuses", "Bonuses.dc.html", "/bonuses"],
  ["bonus-guide", "Article.dc.html", "/bonus-guide"],
  ["learn", "Learn.dc.html", "/learn"],
  ["learn-article", "Article.dc.html", "/learn/casino-bonuses/welcome-bonus-terms"],
  ["responsible-gambling", "Responsible Gambling.dc.html", "/responsible-gambling"],
  ["help", "Help.dc.html", "/help"],
  ["methodology", "Methodology.dc.html", "/methodology"],
  ["about", "About.dc.html", "/about"],
  ["faq", "FAQ.dc.html", "/faq"],
  ["affiliate-disclosure", "Affiliate Disclosure.dc.html", "/affiliate-disclosure"],
  ["contact", "Contact.dc.html", "/contact"],
  ["privacy", "Privacy.dc.html", "/privacy"],
  ["terms", "Terms.dc.html", "/terms"],
  ["not-found", "404.dc.html", "/true-parity-not-found"],
];

const programmeSurfaces = [
  ["programme-intake", "intake"],
  ["programme-registration", "registration"],
  ["programme-dashboard", "dashboard"],
];

const contextualComparisonSurface = ["contextual-comparison", "Casinos.dc.html", "/casinos"];

const majorPages = new Set([
  "home",
  "programme-intake",
  "programme-registration",
  "programme-dashboard",
  "best-offers",
  "casinos",
  "contextual-comparison",
  "casino-review",
  "bonuses",
  "bonus-guide",
  "learn",
  "help",
]);

function artifactPath(name, width, kind) {
  return join(outputRoot, `${name}-${width}-${kind}.webp`);
}

async function settle(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(400);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(18);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
}

async function captureFullPage(page, url, output, expectedStatus) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  if (expectedStatus && response?.status() !== expectedStatus) {
    throw new Error(`${url} returned ${response?.status() ?? "no response"}; expected ${expectedStatus}`);
  }
  if (!expectedStatus && (!response || response.status() >= 500)) {
    throw new Error(`${url} returned ${response?.status() ?? "no response"}`);
  }
  await settle(page);
  const screenshot = await page.screenshot({ type: "png", animations: "disabled", fullPage: true });
  await sharp(screenshot).webp({ quality: 74, effort: 5 }).toFile(output);
}

async function captureReference(context, name, handoffFile, width) {
  const page = await context.newPage();
  try {
    await captureFullPage(
      page,
      `${referenceBaseUrl}/${encodeURIComponent(handoffFile)}`,
      artifactPath(name, width, "reference"),
    );
  } finally {
    await page.close();
  }
}

async function captureImplementation(context, name, route, width) {
  const page = await context.newPage();
  try {
    await captureFullPage(
      page,
      `${implementationBaseUrl}${route}${route.includes("?") ? "&" : "?"}visualFixture=true`,
      artifactPath(name, width, "implementation"),
      name === "not-found" ? 404 : undefined,
    );
  } finally {
    await page.close();
  }
}

async function screenshotWebp(locator, output) {
  const buffer = await locator.screenshot({ type: "png", animations: "disabled" });
  await sharp(buffer).webp({ quality: 74, effort: 5 }).toFile(output);
}

async function screenshotViewportWebp(page, output) {
  const buffer = await page.screenshot({ type: "png", animations: "disabled", fullPage: false });
  await sharp(buffer).webp({ quality: 74, effort: 5 }).toFile(output);
}

async function captureComparisonReference(context, width) {
  const page = await context.newPage();
  try {
    await page.goto(`${referenceBaseUrl}/${encodeURIComponent(contextualComparisonSurface[1])}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    const choices = page.getByText("+ Compare", { exact: true });
    await choices.nth(0).click();
    await page.getByText("+ Compare", { exact: true }).nth(0).click();
    await page.getByRole("button", { name: /Compare 2 casinos/ }).click();
    await page.locator('[data-screen-label="Compare overlay"]').waitFor();
    await page.waitForTimeout(180);
    await screenshotViewportWebp(page, artifactPath(contextualComparisonSurface[0], width, "reference"));
  } finally {
    await page.close();
  }
}

async function captureComparisonImplementation(context, width) {
  const page = await context.newPage();
  try {
    await page.goto(`${implementationBaseUrl}${contextualComparisonSurface[2]}?casino=demo-northstar&casino=demo-summit&country=GB&visualFixture=true`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Side by side" }).waitFor();
    await page.locator('[data-screen-label="Compare overlay"]').waitFor({ timeout: 10_000 });
    await page.waitForTimeout(180);
    await screenshotViewportWebp(page, artifactPath(contextualComparisonSurface[0], width, "implementation"));
  } finally {
    await page.close();
  }
}

async function captureProgrammeReference(context, name, state, width) {
  const page = await context.newPage();
  try {
    await page.goto(`${referenceBaseUrl}/${encodeURIComponent("Programme.dc.html")}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    await page.waitForTimeout(300);
    const selector = state === "intake"
      ? "section:nth-of-type(1) > div:nth-child(2) > div:nth-child(1)"
      : state === "registration"
        ? "section:nth-of-type(1) > div:nth-child(2) > div:nth-child(3)"
        : width <= 430
          ? 'div[style*="width: 375px"][style*="background: rgb(23, 22, 22)"]'
          : "section:nth-of-type(2) > div:nth-child(2)";
    await screenshotWebp(page.locator(selector), artifactPath(name, width, "reference"));
  } finally {
    await page.close();
  }
}

async function installAnonymousProgrammeRoutes(page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const requestBody = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: requestBody.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-07:updated-2026-08-09", privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.visual.proof" } }) });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

async function enterProgrammeIntake(page) {
  await page.goto(`${implementationBaseUrl}/program`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  const sensitiveConsent = page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ });
  await sensitiveConsent.waitFor({ timeout: 5_000 }).catch(async () => {
    throw new Error(`Programme intake did not open: ${(await page.locator("body").innerText()).slice(0, 1200)}`);
  });
  await sensitiveConsent.check();
}

async function captureProgrammeImplementation(context, name, state, width) {
  const page = await context.newPage();
  try {
    if (state === "dashboard") {
      const now = new Date().toISOString();
      const userId = "true-parity-user";
      await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: { id: "true-parity-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Visual review", email: "visual-review@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } }) }));
      const titles = ["Create your Starting Point", "Set a 7-day goal", "Map the urge sequence", "Build one boundary", "Add friction", "Create a support route", "Read offers clearly", "Rehearse a pressure moment", "Assemble your plan", "Keep the plan current"];
      const missions = titles.map((title, index) => ({ missionNumber: index + 1, title, status: index === 0 ? "completed" : index === 1 ? "current" : "locked", actionsCompleted: index === 0 ? 1 : 0, actionsTotal: index === 0 ? 1 : 3, xpEarnedHere: index === 0 ? 40 : 0, completionBonus: index === 0 ? 20 : 25 }));
      await page.route("**/api/program/program-ai/home", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ home: { totalXp: 40, activeDays: 1, currentStreak: 1, achievements: [], currentMission: 2, engagementDayBucket: "day_1", currentAction: "choose_direction", startingPoint: { startingPoint: "After difficult work days I keep opening betting apps late at night.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Continue from the situation described in Mission 01." }, missions, reviews: [{ milestone: "first", unlockMission: 3, title: "First Review", maxWords: 200, status: "locked" }, { milestone: "mid", unlockMission: 6, title: "Mid Review", maxWords: 250, status: "locked" }, { milestone: "full", unlockMission: 10, title: "Full Review", maxWords: 300, status: "locked" }], nextReview: { milestone: "first", unlockMission: 3, title: "First Review", xpRemaining: 125, missionsRemaining: 2 }, discoveryLinks: [] } }) }));
      await page.goto(`${implementationBaseUrl}/program`, { waitUntil: "domcontentloaded" });
      await page.locator('[data-programme-phase="home"]').waitFor();
    } else {
      await installAnonymousProgrammeRoutes(page);
      await enterProgrammeIntake(page);
      if (state === "registration") {
        await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: { startingPoint: "After difficult work days I keep opening betting apps late at night.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Continue from the situation described in Mission 01." } }, progress: { xpPreview: 20 } }) }));
        await page.getByRole("button", { name: "I'd rather type" }).click();
        await page.getByLabel("Your situation").fill("After difficult work days I keep opening betting apps late at night.");
        await page.getByRole("button", { name: "Create my Starting Point" }).click();
        await page.locator('[data-programme-phase="registration"]').waitFor();
      }
    }
    await settle(page);
    const screenshot = await page.screenshot({ type: "png", animations: "disabled", fullPage: true });
    await sharp(screenshot).webp({ quality: 74, effort: 5 }).toFile(artifactPath(name, width, "implementation"));
  } finally {
    await page.close();
  }
}

async function normalize(buffer, width, height, background) {
  const meta = await sharp(buffer).metadata();
  return sharp(buffer)
    .extend({
      top: 0,
      left: 0,
      right: Math.max(0, width - (meta.width ?? width)),
      bottom: Math.max(0, height - (meta.height ?? height)),
      background,
    })
    .webp({ quality: 72, effort: 5 })
    .toBuffer();
}

async function writeDiffAndComparison(name, width) {
  const referencePath = artifactPath(name, width, "reference");
  const implementationPath = artifactPath(name, width, "implementation");
  const [reference, implementation] = await Promise.all([
    readFile(referencePath),
    readFile(implementationPath),
  ]);
  const [referenceMeta, implementationMeta] = await Promise.all([
    sharp(reference).metadata(),
    sharp(implementation).metadata(),
  ]);
  const canvasWidth = Math.max(referenceMeta.width ?? width, implementationMeta.width ?? width);
  const canvasHeight = Math.max(referenceMeta.height ?? 1, implementationMeta.height ?? 1);
  const background = { r: 244, g: 241, b: 235, alpha: 1 };
  const [left, right] = await Promise.all([
    normalize(reference, canvasWidth, canvasHeight, background),
    normalize(implementation, canvasWidth, canvasHeight, background),
  ]);
  const [leftPixels, rightPixels] = await Promise.all([
    sharp(left).ensureAlpha().raw().toBuffer(),
    sharp(right).ensureAlpha().raw().toBuffer(),
  ]);
  let absoluteDifference = 0;
  let changedPixels = 0;
  const pixelCount = leftPixels.length / 4;
  for (let index = 0; index < leftPixels.length; index += 4) {
    const red = Math.abs(leftPixels[index] - rightPixels[index]);
    const green = Math.abs(leftPixels[index + 1] - rightPixels[index + 1]);
    const blue = Math.abs(leftPixels[index + 2] - rightPixels[index + 2]);
    absoluteDifference += red + green + blue;
    if (Math.max(red, green, blue) > 24) changedPixels += 1;
  }

  await sharp(left)
    .composite([{ input: right, blend: "difference" }])
    .linear(2.8, 0)
    .webp({ quality: 78, effort: 5 })
    .toFile(artifactPath(name, width, "diff"));

  if (majorPages.has(name)) {
    const gap = 12;
    const sideWidth = width * 2 + gap;
    const maxSideHeight = Math.min(canvasHeight, 5200);
    const [leftSide, rightSide] = await Promise.all([
      sharp(left).extract({ left: 0, top: 0, width, height: maxSideHeight }).toBuffer(),
      sharp(right).extract({ left: 0, top: 0, width, height: maxSideHeight }).toBuffer(),
    ]);
    await sharp({ create: { width: sideWidth, height: maxSideHeight, channels: 4, background } })
      .composite([{ input: leftSide, left: 0, top: 0 }, { input: rightSide, left: width + gap, top: 0 }])
      .webp({ quality: 68, effort: 5 })
      .toFile(artifactPath(name, width, "side-by-side"));
  }

  return {
    name,
    width,
    canvasHeight,
    meanAbsoluteDifference: Number((absoluteDifference / (pixelCount * 3 * 255)).toFixed(6)),
    changedPixelRatio: Number((changedPixels / pixelCount).toFixed(6)),
  };
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const visualMetrics = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    for (const [name, handoffFile, route] of pages) {
      if (only && !`${name}-${viewport.width}`.includes(only)) continue;
      if (phase === "all" || phase === "reference") {
        await captureReference(context, name, handoffFile, viewport.width);
      }
      if (phase === "all" || phase === "implementation") {
        await captureImplementation(context, name, route, viewport.width);
      }
      if (phase === "all" || phase === "diff") {
        visualMetrics.push(await writeDiffAndComparison(name, viewport.width));
      }
    }
    for (const [name, state] of programmeSurfaces) {
      if (only && !`${name}-${viewport.width}`.includes(only)) continue;
      if (phase === "all" || phase === "reference") await captureProgrammeReference(context, name, state, viewport.width);
      if (phase === "all" || phase === "implementation") await captureProgrammeImplementation(context, name, state, viewport.width);
      if (phase === "all" || phase === "diff") visualMetrics.push(await writeDiffAndComparison(name, viewport.width));
    }
    if (!only || `${contextualComparisonSurface[0]}-${viewport.width}`.includes(only)) {
      if (phase === "all" || phase === "reference") await captureComparisonReference(context, viewport.width);
      if (phase === "all" || phase === "implementation") await captureComparisonImplementation(context, viewport.width);
      if (phase === "all" || phase === "diff") visualMetrics.push(await writeDiffAndComparison(contextualComparisonSurface[0], viewport.width));
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  join(outputRoot, "capture-manifest.json"),
  `${JSON.stringify({ phase, referenceBaseUrl, implementationBaseUrl, pages: [...pages.map(([name, file, route]) => ({ name, file: basename(file), route })), ...programmeSurfaces.map(([name, state]) => ({ name, file: "Programme.dc.html", state, route: "/program" })), { name: contextualComparisonSurface[0], file: basename(contextualComparisonSurface[1]), state: "overlay", route: contextualComparisonSurface[2] }], widths: viewports.map(({ width }) => width) }, null, 2)}\n`,
);

if ((phase === "all" || phase === "diff") && !only) {
  await writeFile(
    join(outputRoot, "visual-diff-metrics.json"),
    `${JSON.stringify({ thresholdPerChannel: 24, metrics: visualMetrics }, null, 2)}\n`,
  );
}

console.log(`True-parity ${phase} assets written to ${outputRoot}`);
