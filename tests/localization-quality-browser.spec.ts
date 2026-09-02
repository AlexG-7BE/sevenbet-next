import { expect, test, type Page } from "@playwright/test";

import { homeTranslation } from "../lib/i18n/home-catalog";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { INITIAL_EUROPEAN_MARKET_PROFILES, publicMarketPath } from "../lib/market/registry";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const coreCountries = new Set(["GB", "DE", "ES", "GR", "SE", "DK"]);
const coreProfiles = INITIAL_EUROPEAN_MARKET_PROFILES.filter((profile) => coreCountries.has(profile.countryCode));
const viewportWidths = [360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1536, 1920] as const;
const unresolvedToken = /\{\{?[a-z][a-z0-9_-]*\}?\}/i;
const fakeControl = /\b(?:Filter|Filtre|Filtro|Suodatin)\s*[1-5]\b/i;

async function assertNoHorizontalOverflow(page: Page, context: string) {
  const geometry = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element: element.outerHTML.slice(0, 240),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        };
      })
      .filter((rect) => rect.left < -1 || rect.right > window.innerWidth + 1)
      .slice(0, 5),
  }));
  expect(
    geometry.documentWidth,
    `${context}: document overflow; offenders=${JSON.stringify(geometry.offenders)}`,
  ).toBeLessThanOrEqual(geometry.viewportWidth + 1);
}

test("Preview and Production-grade selectors expose only public-core-ready markets", async ({ page }) => {
  await page.goto(`${baseUrl}/de-de`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("de-DE");
  await page.getByRole("button", { name: messages.changeMarketAndLanguage }).first().click();
  const menu = page.getByRole("menu", { name: messages.changeMarketAndLanguage }).first();
  const values = await menu.locator('button[name="choice"]').evaluateAll((buttons) => buttons.map((button) => (button as HTMLButtonElement).value));
  expect(values).toEqual(["automatic", "GB|en-GB", "DE|de-DE", "ES|es-ES", "PE|es-PE", "GR|el-GR", "SE|sv-SE", "DK|da-DK"]);
  for (const denied of ["IT|it-IT", "PT|pt-PT", "NL|nl-NL", "FI|fi-FI", "NO|nb-NO", "CA|en-CA", "CA|fr-CA"]) {
    await expect(menu.locator(`button[value="${denied}"]`)).toHaveCount(0);
  }
});

test("Danish Bonuses renders the five real curated controls and no raw token", async ({ page }) => {
  await page.goto(`${baseUrl}/da-dk/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  const labels = ["Bedst samlet", "Lavt omsætningskrav", "Lav indbetaling", "Krypto", "Nyeste"];
  const controls = page.getByRole("group", { name: productPageMessages("da-DK").bonuses.directoryTitle }).getByRole("button");
  await expect(controls).toHaveCount(5);
  await expect(controls).toHaveText(labels);
  for (const label of labels) {
    const control = page.getByRole("button", { name: label, exact: true });
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
  }
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(unresolvedToken);
  expect(visibleText).not.toMatch(fakeControl);
});

for (const profile of coreProfiles) {
  const locale = profile.defaultLocale;
  const prefix = publicMarketPath(profile, locale).replace(/\/$/, "");
  const routes = ["/", "/best-offers", "/casinos", "/bonuses", "/10-steps", "/about", "/contact", "/faq", "/learn", "/methodology"] as const;

  test(`${profile.countryCode} public-core routes have resolved copy, metadata and responsive geometry`, async ({ page }) => {
    test.setTimeout(180_000);
    for (const width of [390, 1536]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const route of routes) {
        const fixture = ["/best-offers", "/casinos", "/bonuses"].includes(route) ? "?visualFixture=true" : "";
        const pathname = route === "/" ? prefix || "/" : `${prefix}${route}` || route;
        const response = await page.goto(`${baseUrl}${pathname}${fixture}`, { waitUntil: "domcontentloaded" });
        expect(response?.status(), `${profile.countryCode}:${route}:${width}`).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(new URL(canonical ?? "http://invalid").pathname).toBe(pathname);
        if (profile.countryCode !== "GB") await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
        const [bodyText, title, description] = await Promise.all([
          page.locator("body").innerText(),
          page.title(),
          page.locator('meta[name="description"]').getAttribute("content"),
        ]);
        expect(`${bodyText}\n${title}\n${description ?? ""}`, `${profile.countryCode}:${route}:token`).not.toMatch(unresolvedToken);
        expect(bodyText, `${profile.countryCode}:${route}:fake control`).not.toMatch(fakeControl);
        await assertNoHorizontalOverflow(page, `${profile.countryCode}:${route}:${width}`);
      }
    }
  });
}

test("every Home-ready European locale keeps its hero inside all required viewport widths", async ({ page }) => {
  test.setTimeout(180_000);
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = profile.defaultLocale;
    const pathname = publicMarketPath(profile, locale);
    await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    for (const width of viewportWidths) {
      await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
      const geometry = await page.locator("main h1").first().evaluate((heading) => {
        const rect = heading.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width, viewport: window.innerWidth };
      });
      expect(geometry.left, `${locale}:${width}:hero left`).toBeGreaterThanOrEqual(-1);
      expect(geometry.right, `${locale}:${width}:hero right`).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.width, `${locale}:${width}:hero width`).toBeGreaterThan(0);
      await assertNoHorizontalOverflow(page, `${locale}:Home:${width}`);
    }
    const translated = homeTranslation(locale);
    if (translated) await expect(page.getByRole("heading", { level: 1 })).toContainText(translated.hero[1]);
  }
});

test("the Danish empty-state and metadata paths interpolate market names", async ({ page }) => {
  const messages = productPageMessages("da-DK");
  await page.goto(`${baseUrl}/da-dk/bonuses?maxDeposit=0`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("{market}");
  await expect(page).not.toHaveTitle(/\{market\}/);
  expect(messages.bonuses.noMatchesTitle).toContain("{market}");
});
