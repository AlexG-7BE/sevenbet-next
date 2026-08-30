import { expect, test } from "@playwright/test";

import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { faqMessages } from "../lib/i18n/static-pages/faq";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const cases = [
  { choice: "DE|de-DE", helpHref: "/de/help", locale: "de-DE", market: "DE", prefix: "/de" },
  { choice: "ES|es-ES", helpHref: "/es/help", locale: "es-ES", market: "ES", prefix: "/es" },
] as const;

function regex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

for (const acceptance of cases) {
  test(`${acceptance.market} mobile navigation, selector, FAQ and protected boundaries remain operable`, async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const shell = publicShellMessages(acceptance.locale);
    const faq = faqMessages(acceptance.locale);

    await page.goto(`${baseUrl}${acceptance.prefix}/faq`, { waitUntil: "domcontentloaded" });
    const firstDisclosure = page.locator("details").first();
    const firstSummary = firstDisclosure.locator("summary");
    await expect(firstSummary).toContainText(faq.groups[0].items[0][0]);
    await firstSummary.focus();
    await firstSummary.press("Enter");
    await expect(firstDisclosure).not.toHaveAttribute("open", "");
    await firstSummary.press("Space");
    await expect(firstDisclosure).toHaveAttribute("open", "");

    const menuButton = page.getByRole("button", { name: shell.openNavigation });
    await menuButton.click();
    const navigation = page.getByRole("dialog", { name: shell.siteNavigation });
    await expect(navigation).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    await expect(navigation.getByRole("link", { name: shell.openHelp })).toHaveAttribute("href", acceptance.helpHref);
    await expect(navigation.getByRole("link", { name: shell.startProgramme, exact: true })).toHaveAttribute("href", /^\/program(?:\?|$)/);

    const selector = navigation.getByRole("button", { name: shell.changeMarketAndLanguage });
    await selector.click();
    const selectorMenu = navigation.getByRole("menu", { name: shell.changeMarketAndLanguage });
    const currentChoice = selectorMenu.locator(`button[value="${acceptance.choice}"]`);
    await expect(currentChoice).toHaveAttribute("aria-checked", "true");
    await expect(currentChoice).toBeFocused();
    await currentChoice.press("End");
    await expect(selectorMenu.getByRole("menuitemradio").last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(selectorMenu).toHaveCount(0);
    await expect(selector).toBeFocused();

    const casinos = navigation.getByRole("link", { name: regex(shell.casinos) }).first();
    await expect(casinos).toHaveAttribute("href", `${acceptance.prefix}/casinos`);
    await casinos.click();
    await expect(page).toHaveURL(`${baseUrl}${acceptance.prefix}/casinos`);
    await expect(navigation).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(`${baseUrl}${acceptance.prefix}/faq`);
    await context.close();
  });

  test(`${acceptance.market} mobile casino filters preserve state, reset and browser history`, async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const messages = productPageMessages(acceptance.locale);
    const trigger = page.locator('[aria-controls="casino-filter-dialog"]');

    await page.goto(`${baseUrl}${acceptance.prefix}/casinos`, { waitUntil: "networkidle" });
    const total = Number((await page.locator("#casino-results [role=status]").innerText()).match(/^\d+/)?.[0] ?? "0");
    await expect(trigger).toHaveCount(total > 0 ? 1 : 0);

    await page.goto(`${baseUrl}${acceptance.prefix}/casinos?hasBonus=true`, { waitUntil: "networkidle" });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.locator("#casino-filter-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: messages.common.closeFilters })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    await dialog.locator('select[name="supportsMobile"]').selectOption("true");
    await expect(page).toHaveURL(/hasBonus=true/);
    await expect(page).toHaveURL(/supportsMobile=true/);
    await dialog.getByRole("button", { name: messages.common.closeFilters }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    const filteredTotal = Number(await page.locator("#casino-results").getAttribute("data-result-count") ?? "0");
    const reset = filteredTotal > 0
      ? page.getByLabel(messages.common.activeFilters).getByRole("link", { name: messages.common.clearAll, exact: true })
      : page.locator('[data-public-empty-state="filtered"] [data-empty-reset]');
    await expect(reset).toHaveText(messages.common.clearAll);
    await reset.click();
    await expect(page).toHaveURL(`${baseUrl}${acceptance.prefix}/casinos`);
    await page.goBack({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/hasBonus=true/);
    await expect(page).toHaveURL(/supportsMobile=true/);
    await expect(trigger).toContainText("(2)");
    await context.close();
  });
}
