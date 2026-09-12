import { expect, test } from "@playwright/test";

import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { faqMessages } from "../lib/i18n/static-pages/faq";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const cases = [
  { choice: "de", helpHref: "/de/help", locale: "de-DE", language: "de", prefix: "/de", programmeHref: "/de/program" },
  { choice: "es", helpHref: "/es/help", locale: "es-ES", language: "es", prefix: "/es", programmeHref: "/es/program" },
] as const;

function regex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

for (const acceptance of cases) {
  test(`${acceptance.language} mobile navigation, selector, FAQ and protected boundaries remain operable`, async ({ browser }) => {
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
    await expect(navigation.getByRole("link", { name: shell.startProgramme, exact: true })).toHaveAttribute("href", acceptance.programmeHref);

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

  test(`${acceptance.language} mobile casino search and views preserve focused state and browser history`, async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const copy = commercialUxMessages(acceptance.locale);
    const directoryUrl = `${baseUrl}${acceptance.prefix}/casinos?q=Solvane&visualFixture=true`;
    await page.goto(directoryUrl, { waitUntil: "networkidle" });

    const search = page.getByRole("searchbox", { name: copy.searchCasinos });
    await expect(search).toHaveValue("Solvane");
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(1);
    await page.getByRole("tab", { name: copy.fastPayouts, exact: true }).click();
    await expect(page.getByRole("tab", { name: copy.fastPayouts, exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(search).toHaveValue("Solvane");
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(1);

    await search.fill("localization-visual-no-match");
    await expect(page.locator('#casino-collection-results[role="tabpanel"]')).toContainText(copy.noSearchResults);
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(0);
    await expect(page.locator("#casino-filter-dialog, [data-active-filter-state='casinos']")).toHaveCount(0);

    await page.goto(`${baseUrl}${acceptance.prefix}/faq`, { waitUntil: "domcontentloaded" });
    await page.goBack({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(directoryUrl);
    await expect(search).toHaveValue("Solvane");
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(1);
    await context.close();
  });
}
