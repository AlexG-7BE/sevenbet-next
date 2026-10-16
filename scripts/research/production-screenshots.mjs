// Pictures of the pause landing pages on Production, taken from a GitHub-hosted runner because
// Production answers the Founder's machine with 451. For each language the script opens the pause
// plan as a first-time visitor on a phone, opens the menu, goes home and opens the menu again, then
// photographs the pages for the person beside a player and the rule before the app, then the first
// guide on the pause plan, the Programme start behind its button and the sign-in screen. A second
// browser that still holds the old lesson cookie checks that it opens nothing: no research link in
// the menu at home, before or after the pause plan, and the research links only on the casino
// pages themselves (Founder, 16 October 2026: the Programme shows no casino links to anyone; the
// pause plan stays an ordinary landing page). Only ordinary page loads leave the runner; the
// cookies the site sets are listed by name.
// Output: <out>/*.png, <out>/REPORT.md and <out>/report.json.
//
//   node scripts/research/production-screenshots.mjs --base=https://b4gamble.com --locales=sv,da --out=screenshots
//
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const base = (options.base || "https://b4gamble.com").replace(/\/$/, "");
const locales = (options.locales || "sv,da").split(/[\s,]+/).filter(Boolean);
const out = options.out || "screenshots";
mkdirSync(out, { recursive: true });

// The cookie step 3 set until 16 October 2026; a browser may still hold it, and it must open nothing.
const OLD_LESSON_COOKIE = "b4g_research_access";
// A link into the research section or to a partner, with or without a language prefix.
const RESEARCH_LINK = /^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/(?:best-offers|casinos|casino|bonuses|r)(?:\/|$)/i;
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const LANGUAGE_TAGS = { sv: "sv-SE", da: "da-DK", de: "de-DE", en: "en-GB" };

const rows = [];

function contextOptions(locale, device) {
  const tag = LANGUAGE_TAGS[locale] ?? "en-GB";
  return { ...device, locale: tag, extraHTTPHeaders: { "accept-language": `${tag},${locale};q=0.8` } };
}

async function visit(page, path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  return response?.status() ?? 0;
}

async function openMenu(page) {
  const summary = page.locator("[data-public-mobile-disclosure] > summary");
  if ((await summary.count()) === 0) return false;
  await summary.first().click();
  await page.waitForTimeout(600);
  return true;
}

/** One row of the report: what the page shows, which cookies exist, where the picture went. */
async function record(page, context, { step, file, status, expect = null, fullPage = false }) {
  await page.screenshot({ path: `${out}/${file}`, fullPage });
  const cookies = (await context.cookies(base)).map((cookie) => cookie.name).sort();
  const paths = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]"))
    .map((anchor) => new URL(anchor.getAttribute("href") ?? "", location.href).pathname));
  const research = paths.filter((path) => RESEARCH_LINK.test(path));
  rows.push({
    step,
    url: page.url(),
    status,
    title: await page.title(),
    file,
    cookies,
    researchLinks: research.length,
    researchLinkSample: [...new Set(research)].slice(0, 5),
    partnerLinks: [...new Set(paths.filter((path) => /^\/r\//.test(path)))].slice(0, 12),
    expect,
  });
}

const browser = await chromium.launch();
try {
  for (const locale of locales) {
    // 1. A first-time visitor on a phone: the pause plan and its menu, then home and its menu, then
    //    the two other landing pages. No research link outside the research section.
    {
      const context = await browser.newContext(contextOptions(locale, PHONE));
      const page = await context.newPage();
      let status = await visit(page, `/${locale}/pause-plan`);
      await record(page, context, { step: `${locale}: pause page, first visit`, file: `${locale}-1-pause-plan-phone.png`, status, expect: "none", fullPage: true });
      if (await openMenu(page)) {
        await record(page, context, { step: `${locale}: pause page, menu open`, file: `${locale}-2-pause-plan-menu-phone.png`, status, expect: "none" });
      }
      status = await visit(page, `/${locale}`);
      if (await openMenu(page)) {
        await record(page, context, { step: `${locale}: home after the pause page, menu open`, file: `${locale}-3-home-menu-after-pause-plan-phone.png`, status, expect: "none" });
      }
      for (const path of ["innan", "beside"]) {
        status = await visit(page, `/${locale}/${path}`);
        await record(page, context, { step: `${locale}: /${path}`, file: `${locale}-4-${path}-phone.png`, status, expect: "none", fullPage: true });
      }
      await context.close();
    }
    // 2. A browser that still holds the old lesson cookie: it opens nothing, so home shows no
    //    research link before or after the pause plan; the casino list itself still does.
    {
      const context = await browser.newContext(contextOptions(locale, PHONE));
      await context.addCookies([{ name: OLD_LESSON_COOKIE, value: "open", url: base }]);
      const page = await context.newPage();
      let status = await visit(page, `/${locale}`);
      if (await openMenu(page)) {
        await record(page, context, { step: `${locale}: old lesson cookie, home menu`, file: `${locale}-5-old-lesson-cookie-home-menu-phone.png`, status, expect: "none" });
      }
      await visit(page, `/${locale}/pause-plan`);
      status = await visit(page, `/${locale}`);
      if (await openMenu(page)) {
        await record(page, context, { step: `${locale}: old lesson cookie, home menu after the pause page`, file: `${locale}-6-old-lesson-cookie-home-menu-after-pause-plan-phone.png`, status, expect: "none" });
      }
      // The casino list and the first casino review behind it, with their partner buttons.
      status = await visit(page, `/${locale}/casinos`);
      await record(page, context, { step: `${locale}: casino list`, file: `${locale}-11-casinos-phone.png`, status, expect: "some" });
      const reviewHref = await page.locator("main a[href*='/casino/']").first().getAttribute("href").catch(() => null);
      if (reviewHref) {
        status = await visit(page, reviewHref);
        await record(page, context, { step: `${locale}: first casino review`, file: `${locale}-12-casino-review-phone.png`, status, fullPage: true });
      }
      await context.close();
    }
    // 2b. The path to the Programme on a phone: the first guide listed on the pause plan, the
    //     Programme start behind the plan's button, and the sign-in screen. Nothing is submitted.
    {
      const context = await browser.newContext(contextOptions(locale, PHONE));
      const page = await context.newPage();
      await visit(page, `/${locale}/pause-plan`);
      const guideHref = await page.locator("main a[href*='/learn/']").first().getAttribute("href").catch(() => null);
      const startHref = await page.locator("[data-pause-plan-start]").first().getAttribute("href").catch(() => null);
      if (guideHref) {
        const status = await visit(page, guideHref);
        await record(page, context, { step: `${locale}: first guide on the pause plan`, file: `${locale}-8-guide-phone.png`, status, expect: "none", fullPage: true });
      }
      if (startHref) {
        const status = await visit(page, startHref);
        await record(page, context, { step: `${locale}: Programme start from the pause plan`, file: `${locale}-9-programme-start-phone.png`, status, fullPage: true });
      }
      const status = await visit(page, `/login?returnTo=${encodeURIComponent(new URL(startHref ?? `/${locale}/program`, base).pathname)}`);
      await record(page, context, { step: `${locale}: sign-in screen`, file: `${locale}-10-login-phone.png`, status, expect: "none", fullPage: true });
      await context.close();
    }
    // 3. The pause page on a desktop, with its header.
    {
      const context = await browser.newContext(contextOptions(locale, DESKTOP));
      const page = await context.newPage();
      const status = await visit(page, `/${locale}/pause-plan`);
      await record(page, context, { step: `${locale}: pause page on a desktop`, file: `${locale}-7-pause-plan-desktop.png`, status, expect: "none", fullPage: true });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const takenAt = new Date().toISOString();
const failures = rows.filter((row) => row.status >= 400 || row.status === 0
  || (row.expect === "none" && row.researchLinks > 0)
  || (row.expect === "some" && row.researchLinks === 0));
const lines = [
  "# The pause landing pages on Production",
  "",
  `Site: ${base} · taken ${takenAt} from a GitHub-hosted runner · research links = links to Best Offers, Casinos, a casino review, Bonuses or a partner route on the page`,
  "",
  "| Step | HTTP | Research links | Cookies | Picture |",
  "|---|---|---|---|---|",
  ...rows.map((row) => `| ${row.step} | ${row.status} | ${row.researchLinks}${row.expect === "none" && row.researchLinks > 0 ? " ✗" : ""}${row.expect === "some" && row.researchLinks === 0 ? " ✗" : ""} | ${row.cookies.join(", ") || "—"} | ${row.file} |`),
  "",
  failures.length ? `**${failures.length} step(s) did not hold.**` : "**Every step holds: no research link outside the research section, and the old lesson cookie opens nothing.**",
  "",
];
writeFileSync(`${out}/REPORT.md`, lines.join("\n"));
writeFileSync(`${out}/report.json`, `${JSON.stringify({ base, takenAt, rows }, null, 2)}\n`);
console.log(lines.join("\n"));
if (failures.length) process.exit(1);
