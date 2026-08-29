import { expect, test } from "@playwright/test";

import { HOME_SOURCE_COPY, homeMetadata, homeTranslation } from "../lib/i18n/home-catalog";
import { publicFooterMessages, publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { INITIAL_EUROPEAN_MARKET_PROFILES, localizedMarketPath } from "../lib/market/registry";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
  const locale = profile.defaultLocale;
  const pathname = localizedMarketPath(profile, locale);
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
  for (const pathname of ["/de/en/", "/xx/xx/", "/de/de/admin", "/de/de/program"]) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(404);
  }
});

test("desktop selector persists presentation and preserves a supported equivalent path", async ({ page, context }) => {
  await page.goto(`${baseUrl}/de/de/casinos`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("de-DE");
  const selector = page.getByRole("combobox", { name: messages.changeMarketAndLanguage }).first();
  await selector.selectOption("ES|es-ES");
  await selector.locator("xpath=ancestor::form").getByRole("button", { name: messages.applyPreference }).click();
  await expect(page).toHaveURL(/\/es\/es\/casinos\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "b4gamble_presentation")?.value).toBe("v1.ES.es-ES");
  await expect(page.getByRole("navigation", { name: publicShellMessages("es-ES").primaryNavigation })).toBeVisible();
});

test("automatic presentation clears the preference and returns to an unprefixed compatible URL", async ({ page, context }) => {
  await context.addCookies([{ name: "b4gamble_presentation", value: "v1.PT.pt-PT", domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto(`${baseUrl}/pt/pt/learn`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("pt-PT");
  const selector = page.getByRole("combobox", { name: messages.changeMarketAndLanguage }).first();
  await selector.selectOption("automatic");
  await selector.locator("xpath=ancestor::form").getByRole("button", { name: messages.applyPreference }).click();
  await expect(page).toHaveURL(/\/learn\/?$/);
  expect((await context.cookies()).some((cookie) => cookie.name === "b4gamble_presentation")).toBe(false);
});

test("mobile selector is keyboard-accessible inside the existing modal navigation", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const messages = publicShellMessages("fi-FI");
  await page.goto(`${baseUrl}/fi/fi/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: messages.openNavigation }).click();
  const dialog = page.getByRole("dialog", { name: messages.siteNavigation });
  await expect(dialog).toBeVisible();
  const selector = dialog.getByRole("combobox", { name: messages.changeMarketAndLanguage });
  await selector.focus();
  await expect(selector).toBeFocused();
  await selector.selectOption("NO|nb-NO");
  await dialog.getByRole("button", { name: messages.applyPreference }).click();
  await expect(page).toHaveURL(/\/no\/nb\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nb-NO");
  await page.close();
});

test("unprefixed public URLs remain compatible", async ({ page }) => {
  for (const pathname of ["/", "/casinos", "/bonuses", "/best-offers", "/learn"]) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
  }
});
