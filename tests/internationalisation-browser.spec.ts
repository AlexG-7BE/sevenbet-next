import { expect, test } from "@playwright/test";

import { HOME_SOURCE_COPY, homeMetadata, homeTranslation } from "../lib/i18n/home-catalog";
import { publicFooterMessages, publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { aboutMessages } from "../lib/i18n/static-pages/about";
import { faqMessages } from "../lib/i18n/static-pages/faq";
import { tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { INITIAL_EUROPEAN_MARKET_PROFILES, publicMarketPath } from "../lib/market/registry";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
  const locale = profile.defaultLocale;
  const pathname = publicMarketPath(profile, locale);
  test(`${pathname} renders a localized Home contract`, async ({ page }) => {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "http://invalid").pathname).toBe(pathname);
    await expect(page).toHaveTitle(homeMetadata(locale).title);
    const translation = homeTranslation(locale);
    const hero = translation?.hero ?? HOME_SOURCE_COPY.hero;
    await expect(page.getByRole("heading", { name: `${hero[1]} ${hero[2]}` })).toBeVisible();
    const messages = publicShellMessages(locale);
    await expect(page.getByRole("navigation", { name: messages.primaryNavigation })).toBeVisible();
    await expect(page.getByRole("combobox", { name: messages.changeMarketAndLanguage }).first()).toHaveValue(`${profile.countryCode}|${locale}`);
    const footer = publicFooterMessages(locale);
    await expect(page.getByRole("contentinfo", { name: footer.label })).toContainText(footer.financialRisk);
  });
}

test("invalid market-language pairs and protected prefixed paths fail without a rewrite", async ({ page }) => {
  for (const pathname of ["/de/en/", "/gr/gr/", "/xx/", "/de/admin", "/de/api/private", "/de/program/api/private"]) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(404);
  }
});

test("desktop selector persists presentation and preserves a supported equivalent path", async ({ page, context }) => {
  await page.goto(`${baseUrl}/de/casinos`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("de-DE");
  const selector = page.getByRole("combobox", { name: messages.changeMarketAndLanguage }).first();
  await selector.selectOption("ES|es-ES");
  await selector.locator("xpath=ancestor::form").getByRole("button", { name: messages.applyPreference }).click();
  await expect(page).toHaveURL(/\/es\/casinos\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "b4gamble_presentation")?.value).toBe("v1.ES.es-ES");
  await expect(page.getByRole("navigation", { name: publicShellMessages("es-ES").primaryNavigation })).toBeVisible();
});

test("automatic presentation clears the preference and returns to an unprefixed compatible URL", async ({ page, context }) => {
  await context.addCookies([{ name: "b4gamble_presentation", value: "v1.PT.pt-PT", domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto(`${baseUrl}/pt/bonuses?type=welcome&country=PT`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("pt-PT");
  const selector = page.getByRole("combobox", { name: messages.changeMarketAndLanguage }).first();
  await selector.selectOption("automatic");
  await selector.locator("xpath=ancestor::form").getByRole("button", { name: messages.applyPreference }).click();
  await expect(page).toHaveURL(/\/bonuses\?type=welcome$/);
  expect((await context.cookies()).some((cookie) => cookie.name === "b4gamble_presentation")).toBe(false);
});

test("mobile selector is keyboard-accessible inside the existing modal navigation", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const messages = publicShellMessages("fi-FI");
  await page.goto(`${baseUrl}/fi/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: messages.openNavigation }).click();
  const dialog = page.getByRole("dialog", { name: messages.siteNavigation });
  await expect(dialog).toBeVisible();
  const selector = dialog.getByRole("combobox", { name: messages.changeMarketAndLanguage });
  await selector.focus();
  await expect(selector).toBeFocused();
  await selector.selectOption("NO|nb-NO");
  await dialog.getByRole("button", { name: messages.applyPreference }).click();
  await expect(page).toHaveURL(/\/no\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nb-NO");
  await page.close();
});

test("unprefixed public URLs remain compatible", async ({ page }) => {
  for (const pathname of ["/", "/casinos", "/bonuses", "/best-offers", "/learn"]) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
  }
});

const representativeProductMarkets = INITIAL_EUROPEAN_MARKET_PROFILES.filter((profile) => ["GB", "DE", "ES", "GR", "NL", "NO"].includes(profile.countryCode));

for (const profile of representativeProductMarkets) {
  const locale = profile.defaultLocale;
  const prefix = publicMarketPath(profile, locale).replace(/\/$/, "");
  const messages = productPageMessages(locale);
  test(`${profile.countryCode} product pages use localized bodies, self canonicals and no inferred outbound action`, async ({ page }) => {
    for (const [route, expected] of [
      ["/best-offers", messages.bestOffers.heroLead],
      ["/casinos", messages.casinos.heroLead],
      ["/bonuses", messages.bonuses.heroLead],
    ] as const) {
      const response = await page.goto(`${baseUrl}${prefix}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${profile.countryCode}${route}`).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(expected);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical ?? "http://invalid").pathname).toBe(`${prefix}${route}`);
      if (profile.countryCode === "GB") {
        await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      } else {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
      }
      expect(await page.locator('main a[href^="/r/"]').count(), `${profile.countryCode}${route} must fail closed`).toBe(0);
    }
  });

  test(`${profile.countryCode} localized profile and Compare preserve the explicit prefix`, async ({ page, request }) => {
    const profilePath = `${prefix}/casino/demo-northstar`;
    const response = await page.goto(`${baseUrl}${profilePath}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "http://invalid").pathname).toBe(profilePath);
    await expect(page.getByText(messages.profile.offerUnavailable).first()).toBeVisible();
    await expect(page.locator(`a[href="${prefix}/casinos"]`).first()).toBeVisible();
    expect(await page.locator('main a[href^="/r/"]').count()).toBe(0);

    const redirect = await request.get(`${baseUrl}${prefix}/compare?casino=alpha&casino=beta&differences=true`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    expect(redirect.headers().location).toBe(`${prefix}/casinos?casino=alpha&casino=beta&differences=true`);
  });
}

test("old Preview-only default-language URLs redirect once to market-first canonicals", async ({ page }) => {
  for (const [legacy, canonical] of [
    ["/de/de/?source=partner", "/de/?source=partner"],
    ["/de/de/casinos?page=2", "/de/casinos?page=2"],
    ["/gb/en/", "/"],
    ["/gr/el/bonuses", "/gr/bonuses"],
  ] as const) {
    await page.goto(`${baseUrl}${legacy}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(`${baseUrl}${canonical}`);
  }
});

test("localized 10 Steps and About publish complete draft bodies with localized metadata and accessibility text", async ({ page }) => {
  const tenSteps = tenStepsTranslation("de-DE");
  await page.goto(`${baseUrl}/de/10-steps`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(tenSteps.text[1]);
  await expect(page.getByRole("link", { name: tenSteps.text[5] })).toHaveAttribute("href", "/program?entry=start");
  await expect(page.getByRole("img")).toHaveAttribute("alt", tenSteps.text.at(-1) ?? "");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/de/10-steps");

  const about = aboutMessages("es-ES");
  await page.goto(`${baseUrl}/es/about`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(about.titleLead);
  await expect(page.locator('[data-about-section="three-parts"]')).toContainText(about.parts[0].body);
  await expect(page.locator('[data-about-section="commercial-separation"]')).toContainText(about.separationPoints[2]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/es/about");

  const faq = faqMessages("pt-PT");
  await page.goto(`${baseUrl}/pt/faq`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(faq.titleLead);
  await expect(page.getByText(faq.groups[0].items[0][1])).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/pt/faq");
});

test("long localized copy has no horizontal overflow across the required responsive widths", async ({ browser }) => {
  const samples = [
    [360, "/de/about"],
    [375, "/pt/faq"],
    [390, "/gr/"],
    [412, "/fi/casinos"],
    [430, "/es/bonuses"],
    [768, "/nl/about"],
    [1024, "/no/10-steps"],
    [1440, "/de/best-offers"],
  ] as const;
  for (const [width, pathname] of samples) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 900 : 1_000 }, isMobile: width <= 430 });
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${pathname} at ${width}px`).toBe(0);
    await page.close();
  }
});
