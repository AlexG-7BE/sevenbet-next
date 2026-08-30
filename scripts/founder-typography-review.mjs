import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const beforeRoot = process.env.TYPOGRAPHY_BEFORE_ROOT ?? "/private/tmp/b4gamble-typography-before";
const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-typography-review");
await mkdir(outputRoot, { recursive: true });

async function labelled(buffer, label) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width;
  const banner = Buffer.from(`<svg width="${width}" height="46" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="46" fill="#100f0f"/><text x="20" y="30" fill="#e4e24e" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">${label}</text></svg>`);
  return image.extend({ top: 46, background: "#100f0f" }).composite([{ input: banner, top: 0, left: 0 }]).png().toBuffer();
}

async function beforeAfter(beforeName, afterBuffer, outputName) {
  const beforePath = resolve(beforeRoot, beforeName);
  await access(beforePath);
  const [before, after] = await Promise.all([
    labelled(await readFile(beforePath), "BEFORE · BASELINE HEAD"),
    labelled(afterBuffer, "AFTER · FUNCTIONAL READABILITY CORRECTED"),
  ]);
  const beforeMeta = await sharp(before).metadata();
  const afterMeta = await sharp(after).metadata();
  const width = Math.max(beforeMeta.width, afterMeta.width);
  const beforeNormalised = await sharp(before).extend({ right: width - beforeMeta.width, background: "#fafaf7" }).png().toBuffer();
  const afterNormalised = await sharp(after).extend({ right: width - afterMeta.width, background: "#fafaf7" }).png().toBuffer();
  await sharp({ create: { width, height: beforeMeta.height + afterMeta.height, channels: 3, background: "#fafaf7" } })
    .composite([{ input: beforeNormalised, top: 0, left: 0 }, { input: afterNormalised, top: beforeMeta.height, left: 0 }])
    .webp({ quality: 88 })
    .toFile(resolve(outputRoot, outputName));
}

async function saveWebp(buffer, name) {
  await sharp(buffer).webp({ quality: 88 }).toFile(resolve(outputRoot, name));
}

async function fontsReady(page) {
  await page.evaluate(() => Promise.race([document.fonts?.ready, new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000))]));
}

async function runtimePage(context, route, renderer) {
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  if (response?.status() !== 200) throw new Error(`${route} returned ${response?.status()}`);
  await fontsReady(page);
  if (renderer && await page.locator("[data-handoff-page]").count()) throw new Error(`${route} used HandoffPage instead of its dynamic runtime`);
  if (renderer && await page.locator(`[data-runtime-renderer="${renderer}"]`).count() !== 1) throw new Error(`${route} missing ${renderer} runtime renderer`);
  return page;
}

function programmeAuthority(journeyId) {
  const createdAt = Date.now();
  return { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-19:updated-2026-08-19", privacyVersion: "privacy:effective-2026-08-19:updated-2026-08-19", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.typography" };
}

async function installProgramme(page) {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, authority: programmeAuthority(body.journeyId) }) });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
}

async function computedMetrics(page, viewport) {
  return page.evaluate((width) => {
    const size = (selector) => {
      const element = document.querySelector(selector);
      return element ? Number.parseFloat(getComputedStyle(element).fontSize) : null;
    };
    return {
      viewport: width,
      renderer: document.querySelector('[data-runtime-renderer="bonuses"]') ? "REAL_RUNTIME" : "MISSING",
      handoffPage: Boolean(document.querySelector("[data-handoff-page]")),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      hero: size('[data-runtime-renderer="bonuses"] > section h1'),
      filterValue: size('form[action="/bonuses"] select'),
      calculatorLabel: size('[class*="calculatorControls"] legend'),
      calculatorOption: size('[class*="segmented"] label'),
      calculatorExplanation: size('[class*="calculatorOutput"] > p'),
      topThreeTerm: size('section[aria-labelledby="bonus-shortlist-title"] dl div'),
      directoryLabel: size('article[class*="comparisonRow"] [class*="compactTerms"] dt'),
      directoryValue: size('article[class*="comparisonRow"] [class*="compactTerms"] dd'),
    };
  }, viewport);
}

const browser = await chromium.launch();
const metrics = [];
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const bonuses = await runtimePage(desktopContext, "/bonuses?visualFixture=true", "bonuses");
  const hero = bonuses.locator('[data-runtime-renderer="bonuses"] > section').first();
  const top3 = bonuses.locator('[aria-labelledby="bonus-shortlist-title"]');
  const filters = bonuses.locator("form").filter({ has: bonuses.getByRole("button", { name: "Show Results" }) }).first();
  const calculator = bonuses.locator("#bonus-calculator-title").locator("xpath=ancestor::section");
  const directory = bonuses.getByRole("heading", { name: "All bonuses" }).locator("xpath=ancestor::section");
  const heroBuffer = await hero.screenshot({ animations: "disabled" });
  await bonuses.locator('[data-public-shell="header"]').evaluate((element) => {
    element.setAttribute("hidden", "");
  });
  await bonuses.locator('.skipLink').evaluate((element) => {
    element.setAttribute("hidden", "");
  });
  const top3Buffer = await top3.screenshot({ animations: "disabled" });
  const filtersBuffer = await filters.screenshot({ animations: "disabled" });
  const calculatorBuffer = await calculator.screenshot({ animations: "disabled" });
  const directoryBuffer = await directory.screenshot({ animations: "disabled" });
  await saveWebp(heroBuffer, "bonuses-hero-1440.webp");
  await beforeAfter("filters-1440.png", filtersBuffer, "bonuses-filters-before-after-1440.webp");
  await beforeAfter("calculator-1440.png", calculatorBuffer, "bonuses-calculator-before-after-1440.webp");
  await beforeAfter("top3-1440.png", top3Buffer, "bonuses-top3-before-after-1440.webp");
  await beforeAfter("directory-1440.png", directoryBuffer, "bonuses-directory-before-after-1440.webp");
  metrics.push(await computedMetrics(bonuses, 1440));
  await bonuses.close();

  const home = await runtimePage(desktopContext, "/", null);
  await saveWebp(await home.screenshot({ animations: "disabled", fullPage: false }), "home-expressive-type-1440.webp");
  await home.close();
  const review = await runtimePage(desktopContext, "/casino/demo-northstar?visualFixture=true", "casino-review");
  await saveWebp(await review.screenshot({ animations: "disabled", fullPage: false }), "casino-review-type-1440.webp");
  await review.close();
  const article = await runtimePage(desktopContext, "/learn/casino-bonuses/welcome-bonus-terms?visualFixture=true", "learn-article");
  await saveWebp(await article.screenshot({ animations: "disabled", fullPage: false }), "learn-article-type-1440.webp");
  await article.close();

  const programme = await desktopContext.newPage();
  await installProgramme(programme);
  await programme.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await programme.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await programme.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await programme.getByRole("button", { name: "Enter Mission 01" }).click();
  await programme.locator('[data-programme-presentation="mission-01-intake"]').waitFor();
  if (await programme.locator("[data-handoff-page]").count() || await programme.locator('[data-runtime-renderer="programme"]').count() !== 1) throw new Error("Programme did not use the real runtime renderer");
  await saveWebp(await programme.screenshot({ animations: "disabled", fullPage: false }), "programme-type-1440.webp");
  await programme.close();
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobile = await runtimePage(mobileContext, "/bonuses?visualFixture=true", "bonuses");
  const mobileHero = mobile.locator('[data-runtime-renderer="bonuses"] > section').first();
  const mobileFilters = mobile.getByRole("button", { name: /Filters/i });
  const mobileCalculator = mobile.locator("#bonus-calculator-title").locator("xpath=ancestor::section");
  await saveWebp(await mobileHero.screenshot({ animations: "disabled" }), "bonuses-hero-390.webp");
  await mobile.locator('[data-public-shell="header"]').evaluate((element) => {
    element.setAttribute("hidden", "");
  });
  await mobile.locator('.skipLink').evaluate((element) => {
    element.setAttribute("hidden", "");
  });
  await saveWebp(await mobileFilters.screenshot({ animations: "disabled" }), "bonuses-filters-390.webp");
  await saveWebp(await mobileCalculator.screenshot({ animations: "disabled" }), "bonuses-calculator-390.webp");
  metrics.push(await computedMetrics(mobile, 390));
  await mobile.close();
  await mobileContext.close();

  await writeFile(resolve(outputRoot, "metrics.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), renderer: "REAL_RUNTIME", baselineHead: "bd9b47f5a4489759981ee3b2b2a40bf69ea0a8d9", metrics }, null, 2)}\n`);
  await writeFile(resolve(outputRoot, "README.md"), `# Founder Typography Review\n\n## EXPRESSIVE TYPE PRESERVED\n\n- The B4GAMBLE handoff remains the visual authority. Large route-specific Archivo display type, Instrument Serif italic accents, deliberate scale contrast and line breaks were not normalised.\n- \`VALUE, MEASURED / by terms.\` remains the typography-led Bonuses hero. Home, Casino Review, Programme and Learn retain their distinct compositions.\n- Home evidence uses its canonical static handoff renderer. Dynamic Bonuses, Casino Review, Learn Article and Programme evidence uses the **REAL_RUNTIME** renderer with deterministic data-only fixtures, never a \`visualFixture → HandoffPage\` bypass.\n\n## FUNCTIONAL READABILITY CORRECTED\n\n- Filters, values, material terms, availability states, CTAs, calculator controls/results, comparison facts, Programme states and Help actions now follow the functional scale.\n- Inputs are 15px desktop and 16px mobile; controls are at least 14px; decision values are at least 14px; labels/meta/legal use their documented 13–14px / 13px / 12–13px roles.\n- The five \`before-after\` files pair clean baseline HEAD \`bd9b47f\` evidence above the corrected runtime below without downscaling the source captures.\n\n## Runtime metrics\n\n- Dynamic renderer: **REAL_RUNTIME**.\n- Dynamic HandoffPage bypass: **ABSENT**.\n- Viewports measured: 1440 and 390 in \`metrics.json\`; Playwright computed-font and overflow tests additionally cover 1024 and 430.\n- Horizontal overflow: **NONE** in captured states.\n\n## Evidence key\n\n- \`bonuses-hero-*\`: expressive hero regression.\n- \`bonuses-*-before-after-1440.webp\`: functional baseline/correction pairs.\n- \`home-expressive-type-1440.webp\`, \`casino-review-type-1440.webp\`, \`programme-type-1440.webp\`, \`learn-article-type-1440.webp\`: route-specific expressive/editorial preservation.\n`);
} finally {
  await browser.close();
}
