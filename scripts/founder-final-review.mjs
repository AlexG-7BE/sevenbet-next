import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const implementationBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const handoffRoot = process.env.B4GAMBLE_HANDOFF_DIR;
const phase = process.env.FOUNDER_FINAL_REVIEW_PHASE ?? "all";
const only = new Set((process.env.FOUNDER_FINAL_REVIEW_ONLY ?? "").split(",").map((value) => value.trim()).filter(Boolean));

if (!handoffRoot) throw new Error("B4GAMBLE_HANDOFF_DIR must point to the extracted final handoff directory");

const stateRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/programme-state-parity");
const finalRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-final-review");
const temporaryRoot = resolve(tmpdir(), "b4gamble-founder-final-review");
const profiles = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

const programmeStates = ["access", "intake", "recording", "text", "registration", "dashboard"];
const commercialSurfaces = [
  { name: "best-offers", file: "Best Offers.dc.html", route: "/best-offers", renderer: "best-offers" },
  { name: "casino-review", file: "Casino Review.dc.html", route: "/casino/demo-northstar", renderer: "casino-review" },
  { name: "bonuses", file: "Bonuses.dc.html", route: "/bonuses", renderer: "bonuses" },
];
const commercialNames = new Set(commercialSurfaces.map((surface) => surface.name));
const commercialOnly = only.size > 0 && [...only].every((value) => commercialNames.has(value.replace(/-(390|430)$/, "")));

function selected(name, width) {
  return !only.size || only.has(`${name}-${width}`) || only.has(name);
}

function artifactPath(name, width, kind) {
  return join(commercialNames.has(name) ? temporaryRoot : stateRoot, `${name}-${width}-${kind}.webp`);
}

async function handoffPage(context, file) {
  const page = await context.newPage();
  await page.goto(pathToFileURL(join(handoffRoot, file)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(250);
  return page;
}

function programmeReferenceFrame(state, width) {
  if (state === "dashboard") {
    return width === 390
      ? { selector: 'div[style*="width: 375px"][style*="background: rgb(23, 22, 22)"]', wrapper: true, removeLast: true, canvas: "#171616" }
      : { selector: "section:nth-of-type(2) > div:nth-child(2)", wrapper: true, removeLast: false, canvas: "#060708" };
  }
  if ((state === "access" || state === "intake") && width === 390) {
    return { selector: 'div[style*="width: 375px"][style*="background: rgb(6, 7, 8)"]', wrapper: true, removeLast: true, canvas: "#060708" };
  }
  const index = state === "recording" || state === "text" ? 2 : state === "registration" ? 3 : 1;
  return {
    selector: `section:nth-of-type(1) > div:nth-child(2) > div:nth-child(${index}) > div:nth-child(1)`,
    wrapper: false,
    removeLast: false,
    canvas: "#060708",
  };
}

async function captureProgrammeReference(context, state, profile) {
  const page = await handoffPage(context, "Programme.dc.html");
  const frame = programmeReferenceFrame(state, profile.width);
  await page.locator(frame.selector).waitFor();
  await page.evaluate(({ frame, profile, state }) => {
    const source = document.querySelector(frame.selector);
    if (!(source instanceof HTMLElement)) throw new Error(`Missing Programme reference frame: ${state}`);
    const product = source.cloneNode(true);
    if (!(product instanceof HTMLElement)) throw new Error(`Could not clone Programme reference frame: ${state}`);
    if (frame.removeLast) product.lastElementChild?.remove();
    document.body.replaceChildren(product);
    document.documentElement.style.cssText = `margin:0;width:${profile.width}px;height:${profile.height}px;overflow:hidden;background:${frame.canvas}`;
    document.body.style.cssText = `margin:0;width:${profile.width}px;height:${profile.height}px;overflow:hidden;background:${frame.canvas};font-family:'Archivo',sans-serif`;
    product.style.width = "100vw";
    product.style.maxWidth = "none";
    product.style.minHeight = "100vh";
    product.style.margin = "0";
    product.style.border = "0";
    product.style.borderRadius = "0";
    product.style.boxSizing = "border-box";
    product.style.overflow = "hidden";
    if (state !== "dashboard") {
      product.style.display = "flex";
      product.style.flexDirection = "column";
      product.style.alignItems = "center";
      product.style.justifyContent = "center";
      product.style.textAlign = "center";
      product.style.background = "#060708";
      product.style.color = "#FAFAF7";
      product.style.gap = profile.width === 390 ? "16px" : "18px";
      product.style.padding = profile.width === 390 ? "64px 28px 48px" : "56px 40px";
    } else if (profile.width === 390) {
      product.style.background = "#171616";
    }
  }, { frame, profile, state });
  const buffer = await page.screenshot({ animations: "disabled", fullPage: false, type: "png" });
  await page.close();
  return buffer;
}

async function installAnonymousRoutes(page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-19:updated-2026-08-19", privacyVersion: "privacy:effective-2026-08-19:updated-2026-08-19", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.visual" } }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

async function enterIntake(page) {
  await page.goto(`${implementationBaseUrl}/program`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  const authority = page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ });
  await authority.waitFor();
  await authority.check();
}

async function installRecorder(page) {
  await page.addInitScript(() => {
    class FounderMediaRecorder {
      static isTypeSupported(type) { return type === "audio/webm;codecs=opus"; }
      state = "inactive";
      mimeType = "audio/webm;codecs=opus";
      ondataavailable = null;
      onstop = null;
      onerror = null;
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

async function installDashboardRoutes(page) {
  const now = new Date().toISOString();
  const userId = "founder-final-review-user";
  await page.route("**/api/auth/get-session", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ session: { id: "founder-final-review-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Founder review", email: "founder-review@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } }),
  }));
  const titles = ["Map the moment", "Set a 7-day goal", "Understand the urge", "Build one boundary", "Check before deciding", "Add friction", "Prepare support", "Research responsibly", "Rehearse the decision", "Make the plan reviewable"];
  const missions = titles.map((title, index) => ({ missionNumber: index + 1, title, status: index < 3 ? "completed" : index === 3 ? "current" : "locked", actionsCompleted: index === 0 ? 2 : index < 3 ? 3 : index === 3 ? 1 : 0, actionsTotal: index === 0 ? 2 : 3, xpEarnedHere: index === 0 ? 40 : index < 3 ? 75 : index === 3 ? 15 : 0, completionBonus: index === 0 ? 0 : 25 }));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ home: { totalXp: 205, activeDays: 18, currentStreak: 12, achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }, { slug: "boundary-built", title: "Boundary Built", state: "locked", awardedAt: null }], currentMission: 4, primaryAction: "resume-mission", engagementDayBucket: "day_30_plus", currentAction: "build_boundary_rule", startingPoint: { startingPoint: "Autopilot sessions after work that grow by the weekend. Your plan focuses on catching that moment before it starts.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Pick a single limit you can keep this week. Small, specific, yours." }, missions, reviews: [{ milestone: "first", unlockMission: 3, title: "First Personal Review", maxWords: 250, status: "available" }, { milestone: "mid", unlockMission: 6, title: "Mid-Programme Personal Review", maxWords: 300, status: "locked" }, { milestone: "full", unlockMission: 10, title: "Full Programme Personal Review", maxWords: 450, status: "locked" }], nextReview: { milestone: "mid", unlockMission: 6, title: "Mid-Programme Personal Review", xpRemaining: 210, missionsRemaining: 3 }, discoveryLinks: [{ href: "/casinos", label: "Compare casinos" }, { href: "/bonuses", label: "Bonuses" }, { href: "/best-offers", label: "Best offers" }] } }),
  }));
}

async function captureProgrammeImplementation(context, state) {
  const page = await context.newPage();
  if (state === "recording") await installRecorder(page);
  if (state === "dashboard") {
    await installDashboardRoutes(page);
    await page.goto(`${implementationBaseUrl}/program`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-programme-phase="home"]').waitFor();
  } else {
    await installAnonymousRoutes(page);
    if (state === "access") {
      await page.goto(`${implementationBaseUrl}/program`, { waitUntil: "domcontentloaded" });
      await page.locator('[data-programme-presentation="access"]').waitFor();
    } else {
      await enterIntake(page);
      if (state === "recording") {
        await page.getByRole("button", { name: "Tap to speak" }).click();
        await page.locator('[data-voice-state="recording"]').waitFor();
      } else if (state === "text" || state === "registration") {
        await page.getByRole("button", { name: "I'd rather type" }).click();
        await page.getByLabel("Your situation").fill("After difficult work days I keep opening betting apps late at night.");
        if (state === "registration") {
          await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: { startingPoint: "You described autopilot sessions after work that grow by the weekend. Your first missions focus on catching that moment before it starts — one small boundary at a time.", desiredChange: "Build more control around the situation described here.", broadContext: "NOT_SPECIFIED", continuationCue: "Continue from the situation described in Mission 01." } }, progress: { xpPreview: 20 } }),
          }));
          await page.getByRole("button", { name: "Create my Starting Point" }).click();
          await page.locator('[data-programme-phase="registration"]').waitFor();
        }
      }
    }
  }
  if (await page.locator("[data-handoff-page]").count()) throw new Error(`${state} switched to HandoffPage`);
  if (await page.locator('[data-runtime-renderer="programme"]').count() !== 1) throw new Error(`${state} did not render the real Programme runtime`);
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(180);
  const buffer = await page.screenshot({ animations: "disabled", fullPage: false, type: "png" });
  await page.close();
  return buffer;
}

async function captureCommercialReference(context, surface) {
  const page = await handoffPage(context, surface.file);
  const buffer = await page.screenshot({ animations: "disabled", fullPage: true, type: "png" });
  await page.close();
  return buffer;
}

async function captureCommercialImplementation(context, surface) {
  const page = await context.newPage();
  const response = await page.goto(`${implementationBaseUrl}${surface.route}?visualFixture=true`, { waitUntil: "domcontentloaded" });
  if (!response || response.status() >= 500) throw new Error(`${surface.route} returned ${response?.status() ?? "no response"}`);
  await page.locator(`[data-runtime-renderer="${surface.renderer}"]`).waitFor();
  if (await page.locator("[data-handoff-page]").count()) throw new Error(`${surface.name} switched to HandoffPage`);
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(180);
  const buffer = await page.screenshot({ animations: "disabled", fullPage: true, type: "png" });
  await page.close();
  return buffer;
}

async function saveWebp(buffer, path) {
  await sharp(buffer).webp({ quality: 78, effort: 5 }).toFile(path);
}

async function normalize(buffer, width, height, background = { r: 6, g: 7, b: 8, alpha: 1 }) {
  const metadata = await sharp(buffer).metadata();
  const sourceWidth = metadata.width ?? width;
  const sourceHeight = metadata.height ?? height;
  return sharp(buffer)
    .extract({ left: 0, top: 0, width: Math.min(sourceWidth, width), height: Math.min(sourceHeight, height) })
    .extend({ top: 0, left: 0, right: Math.max(0, width - sourceWidth), bottom: Math.max(0, height - sourceHeight), background })
    .png()
    .toBuffer();
}

async function compare(name, profile, reference, implementation, finalName = null) {
  const referenceMeta = await sharp(reference).metadata();
  const implementationMeta = await sharp(implementation).metadata();
  const width = Math.max(referenceMeta.width ?? profile.width, implementationMeta.width ?? profile.width);
  const height = Math.max(referenceMeta.height ?? profile.height, implementationMeta.height ?? profile.height);
  const [left, right] = await Promise.all([normalize(reference, width, height), normalize(implementation, width, height)]);
  const [leftPixels, rightPixels] = await Promise.all([sharp(left).ensureAlpha().raw().toBuffer(), sharp(right).ensureAlpha().raw().toBuffer()]);
  let absoluteDifference = 0;
  let changedPixels = 0;
  for (let index = 0; index < leftPixels.length; index += 4) {
    const red = Math.abs(leftPixels[index] - rightPixels[index]);
    const green = Math.abs(leftPixels[index + 1] - rightPixels[index + 1]);
    const blue = Math.abs(leftPixels[index + 2] - rightPixels[index + 2]);
    absoluteDifference += red + green + blue;
    if (Math.max(red, green, blue) > 24) changedPixels += 1;
  }
  const pixelCount = leftPixels.length / 4;
  await sharp(left).composite([{ input: right, blend: "difference" }]).linear(2.8, 0).webp({ quality: 80, effort: 5 }).toFile(artifactPath(name, profile.width, "diff"));
  const gap = 12;
  const sideBySide = await sharp({ create: { width: width * 2 + gap, height, channels: 4, background: { r: 231, g: 228, b: 220, alpha: 1 } } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: width + gap, top: 0 }])
    .webp({ quality: 72, effort: 5 })
    .toBuffer();
  await saveWebp(sideBySide, artifactPath(name, profile.width, "side-by-side"));
  if (finalName) await saveWebp(sideBySide, join(finalRoot, finalName));
  return {
    name,
    width: profile.width,
    canvasHeight: height,
    meanAbsoluteDifference: Number((absoluteDifference / (pixelCount * 3 * 255)).toFixed(6)),
    changedPixelRatio: Number((changedPixels / pixelCount).toFixed(6)),
  };
}

await mkdir(stateRoot, { recursive: true });
await mkdir(finalRoot, { recursive: true });
await mkdir(temporaryRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const metrics = [];
try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: profile });
    if (profile.width !== 430) {
      for (const state of programmeStates) {
        const name = `programme-${state}`;
        if (!selected(name, profile.width)) continue;
        if (phase === "reference" || phase === "all") await saveWebp(await captureProgrammeReference(context, state, profile), artifactPath(name, profile.width, "reference"));
        if (phase === "implementation" || phase === "all") await saveWebp(await captureProgrammeImplementation(context, state), artifactPath(name, profile.width, "runtime-implementation"));
        if (phase === "diff" || phase === "all") {
          const finalStates = new Set(["access", "intake", "recording", "registration", "dashboard"]);
          const finalName = finalStates.has(state) ? `${name}-${profile.width}-side-by-side.webp` : null;
          metrics.push(await compare(name, profile, await readFile(artifactPath(name, profile.width, "reference")), await readFile(artifactPath(name, profile.width, "runtime-implementation")), finalName));
        }
      }
    }
    if (profile.width === 390 || profile.width === 430) {
      for (const surface of commercialSurfaces) {
        if (!selected(surface.name, profile.width)) continue;
        if (phase === "reference" || phase === "all") await saveWebp(await captureCommercialReference(context, surface), artifactPath(surface.name, profile.width, "reference"));
        if (phase === "implementation" || phase === "all") await saveWebp(await captureCommercialImplementation(context, surface), artifactPath(surface.name, profile.width, "runtime-implementation"));
        if (phase === "diff" || phase === "all") metrics.push(await compare(surface.name, profile, await readFile(artifactPath(surface.name, profile.width, "reference")), await readFile(artifactPath(surface.name, profile.width, "runtime-implementation")), `${surface.name}-${profile.width}-side-by-side.webp`));
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (metrics.length && !commercialOnly) await writeFile(join(stateRoot, "metrics.json"), `${JSON.stringify({ renderer: "REAL_RUNTIME", thresholdPerChannel: 24, metrics }, null, 2)}\n`);

const finalImages = [
  ...[1440, 390].flatMap((width) => ["access", "intake", "recording", "registration", "dashboard"].map((state) => `programme-${state}-${width}-side-by-side.webp`)),
  ...[390, 430].flatMap((width) => commercialSurfaces.map((surface) => `${surface.name}-${width}-side-by-side.webp`)),
];
if (!commercialOnly) {
  await writeFile(join(finalRoot, "README.md"), [
    "# Founder final review",
    "",
    "Every image uses the same rule: LEFT = exact relevant original handoff product frame; RIGHT = REAL_RUNTIME implementation.",
    "",
    ...finalImages.map((name) => `- \`${name}\` — LEFT = exact relevant original handoff frame; RIGHT = REAL_RUNTIME implementation.`),
    "",
  ].join("\n"));
}

if (metrics.length) console.log(JSON.stringify({ renderer: "REAL_RUNTIME", thresholdPerChannel: 24, metrics }, null, 2));
console.log(`Founder final review ${phase} assets written to ${stateRoot} and ${finalRoot}`);
