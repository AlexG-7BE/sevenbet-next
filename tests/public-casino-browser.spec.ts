import { expect, test } from "@playwright/test";

import { formatProductMessage, productPageMessages } from "../lib/i18n/product-pages-catalog";
import { DEFAULT_MARKET_PROFILE } from "../lib/market/registry";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const messages = productPageMessages("en-GB");
const fixtureFirstPage = "/casinos?visualFixture=true";
const fixtureSecondPage = "/casinos?page=2&visualFixture=true";

test("desktop discovery renders the deterministic fixture state without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}${fixtureFirstPage}`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const heroHeading = page.locator('[data-runtime-renderer="casinos"] h1').first();
  await expect(heroHeading).toContainText(messages.casinos.heroLead);
  await expect(heroHeading).toContainText(messages.casinos.heroEmphasis);
  await expect(page.locator("#casino-directory").getByRole("heading", { level: 2, name: messages.casinos.directoryTitle, exact: true })).toBeVisible();
  const results = page.locator('#casino-results[data-result-count="10"]');
  await expect(results).toBeVisible();
  await expect(results.locator("article")).toHaveCount(5);
  await expect(results.locator('[data-directory-pagination][data-current-page="1"][data-page-count="2"]')).toBeVisible();
  await expect(results.locator('[data-directory-pagination] a').filter({ hasText: messages.common.next })).toHaveAttribute("href", fixtureSecondPage);
  await expect(results.locator("[role=status]")).toHaveText(`10 ${messages.common.results} · ${messages.common.pageOf.replace("{page}", "1").replace("{pages}", "2")}`);
  await expect(page.locator('[data-active-filter-state="casinos"] [data-empty-reset]')).toHaveCount(0);

  const allFilters = page.locator('button[aria-controls="casino-all-filters-dialog"]');
  await expect(allFilters).toHaveAccessibleName(messages.common.allFilters);
  await allFilters.click();
  const filterDialog = page.locator("#casino-all-filters-dialog");
  await expect(filterDialog).toBeVisible();
  await expect(filterDialog).toHaveAccessibleName(messages.casinos.filterTitle);
  await expect(filterDialog.locator('select[name="hasBonus"]')).toHaveAccessibleName(messages.common.bonusAvailability);
  await expect(filterDialog.locator('select[name="hasResponsibleGambling"]')).toHaveAccessibleName(messages.common.saferGamblingInformation);
  await filterDialog.getByRole("button", { name: messages.common.closeFilters, exact: true }).click();

  const countryPreference = page.locator('#casino-directory select[name="country"]:visible').first();
  await expect(countryPreference).toHaveAccessibleName(messages.common.countryPreference);
  await countryPreference.focus();
  await expect(countryPreference).toBeFocused();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/sevenbet-casinos-desktop.png", fullPage: true });
});

test("directory URLs remain stable without overflow or runtime errors across approved widths", async ({ browser }) => {
  test.setTimeout(90_000);
  for (const width of [1440, 1280, 900, 768, 390, 375, 320]) {
    const errors: string[] = [];
    const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 }, isMobile: width <= 390 });
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const overflow = await page.evaluate(() => ({
      present: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      width: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll("body *")).flatMap((element) => {
        const box = element.getBoundingClientRect();
        return box.right > document.documentElement.clientWidth + 0.5 ? [`${element.tagName}.${typeof element.className === "string" ? element.className : ""}:${Math.round(box.right)}`] : [];
      }).slice(0, 8),
    }));
    expect(overflow.present, `horizontal overflow at ${width}px (${overflow.width}px): ${overflow.offenders.join(", ")}`).toBe(false);
    expect(errors, `runtime errors at ${width}px`).toEqual([]);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const path of ["/casinos?q=test", "/casinos?sort=NAME_ASC"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    expect(response?.status(), path).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
  }
  const pageTwoResponse = await page.goto(`${baseUrl}${fixtureSecondPage}`, { waitUntil: "networkidle" });
  expect(pageTwoResponse?.status(), fixtureSecondPage).toBe(200);
  const pageTwoResults = page.locator('#casino-results[data-result-count="10"]');
  await expect(pageTwoResults.locator('[data-directory-pagination][data-current-page="2"][data-page-count="2"]')).toBeVisible();
  await expect(pageTwoResults.locator("article")).toHaveCount(5);
  await expect(pageTwoResults.locator(`[aria-label="${messages.common.result} 6"]`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), fixtureSecondPage).toBe(false);
  await page.close();
});

test("sort, page size and search query remain URL-authoritative", async ({ page }) => {
  await page.goto(`${baseUrl}${fixtureFirstPage}`, { waitUntil: "networkidle" });
  await page.goto(`${baseUrl}/casinos?sort=NEWEST&pageSize=24&visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/sort=NEWEST/);
  await expect(page).toHaveURL(/pageSize=24/);
  const filterDialog = page.locator("#casino-all-filters-dialog");
  await page.locator('button[aria-controls="casino-all-filters-dialog"]').click();
  await expect(filterDialog).toBeVisible();
  const sort = filterDialog.locator('select[name="sort"]');
  const pageSize = filterDialog.locator('select[name="pageSize"]');
  await expect(sort).toHaveAccessibleName(messages.common.sortResults);
  await expect(sort).toHaveValue("NEWEST");
  await expect(pageSize).toHaveAccessibleName(messages.common.resultsPerPage);
  await expect(pageSize).toHaveValue("24");
  await page.goto(`${baseUrl}/casinos?q=live+casino&sort=NEWEST&pageSize=24&visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/q=live\+casino/);
  await expect(page).toHaveURL(/sort=NEWEST/);
  await expect(page).toHaveURL(/pageSize=24/);
  await page.locator('button[aria-controls="casino-all-filters-dialog"]').click();
  await filterDialog.locator('select[name="supportsMobile"]').selectOption("true");
  await expect(page).toHaveURL(/q=live\+casino/);
  await expect(page).toHaveURL(/supportsMobile=true/);
});

test("mobile filter drawer is modal, keyboard dismissible and returns focus", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/casinos?q=definitely-no-match`, { waitUntil: "networkidle" });
  const emptyState = page.locator('#casino-results [data-public-empty-state="filtered"][data-result-count="0"]');
  await expect(emptyState).toBeVisible();
  await expect(emptyState.getByRole("heading", { level: 2, name: messages.casinos.noMatchesTitle, exact: true })).toBeVisible();
  const trigger = page.locator('button[aria-controls="casino-filter-dialog"]');
  await trigger.click();
  const dialog = page.locator("#casino-filter-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName(messages.casinos.filterTitle);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.screenshot({ path: "/tmp/sevenbet-casinos-filter-drawer.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/sevenbet-casinos-mobile.png", fullPage: true });
  await page.close();
});

test("SSR HTML includes the no-JavaScript filter fallback", async ({ request }) => {
  const response = await request.get(`${baseUrl}${fixtureFirstPage}`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<noscript>");
  expect(html).toContain(messages.common.marketPresentationNotice);
  expect(html).not.toContain(messages.common.demoDisclosure);
  expect(html).toMatch(/<input[^>]*name="visualFixture"[^>]*value="true"[^>]*>/);
});

test("mobile directory filters remain usable when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}${fixtureFirstPage}`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const heroHeading = page.locator('[data-runtime-renderer="casinos"] h1').first();
  await expect(heroHeading).toContainText(messages.casinos.heroLead);
  await expect(heroHeading).toContainText(messages.casinos.heroEmphasis);
  const fallback = page.locator("noscript details");
  await expect(fallback).toBeVisible();
  await fallback.locator("summary").click();
  const responsibleGambling = fallback.locator('select[name="hasResponsibleGambling"]');
  await expect(responsibleGambling).toHaveAccessibleName(messages.common.saferGamblingInformation);
  await responsibleGambling.selectOption("true");
  await fallback.getByRole("button", { name: messages.common.applyFilters, exact: true }).click();
  await expect(page).toHaveURL(/hasResponsibleGambling=true/);
  expect(new URL(page.url()).searchParams.get("visualFixture")).toBe("true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

test("directory metadata, canonical rules and fail-closed action state remain intact", async ({ request }) => {
  const defaultResponse = await request.get(`${baseUrl}/casinos`);
  const defaultHtml = await defaultResponse.text();
  expect(defaultResponse.status()).toBe(200);
  expect(defaultHtml).toContain('<meta name="robots" content="noindex, follow"');
  expect(defaultHtml).toMatch(/<link rel="canonical" href="https?:\/\/[^\"]+\/casinos"/);
  expect(defaultHtml).not.toContain('"@type":"ItemList"');
  if (!defaultHtml.includes(messages.common.demoData)) {
    expect(defaultHtml).toContain(formatProductMessage(messages.casinos.noPublishedTitle, { market: DEFAULT_MARKET_PROFILE.seoDisplayName }));
  }
  expect(defaultHtml).not.toMatch(/href="\/r\/[a-z0-9-]+"/);

  const pageTwoResponse = await request.get(`${baseUrl}/casinos?page=2`);
  const pageTwoHtml = await pageTwoResponse.text();
  expect(pageTwoResponse.status()).toBe(200);
  expect(pageTwoHtml).toMatch(/rel="canonical" href="https?:\/\/[^\"]+\/casinos\?page=2"/);

  const filteredResponse = await request.get(`${baseUrl}/casinos?hasResponsibleGambling=true`);
  const filteredHtml = await filteredResponse.text();
  expect(filteredResponse.status()).toBe(200);
  expect(filteredHtml).toContain('<meta name="robots" content="noindex, follow"');
  expect(filteredHtml).toMatch(/rel="canonical" href="https?:\/\/[^\"]+\/casinos"/);
});

test("empty facets, boolean and invalid URL states stay server-authoritative", async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  const results = page.locator("#casino-results[data-result-count]");
  const total = Number(await results.getAttribute("data-result-count"));
  const directoryControls = page.getByRole("region", { name: messages.common.directoryControls, exact: true });
  if (total === 0) {
    await expect(directoryControls).toHaveCount(0);
  } else {
    await expect(directoryControls).toHaveCount(1);
    for (const [name, label] of [["country", messages.common.countryPreference], ["license", messages.common.licence], ["payment", messages.common.paymentMethods]] as const) {
      const field = directoryControls.locator(`select[name="${name}"]`).first();
      await expect(field).toHaveAccessibleName(label);
      expect(await field.locator('option:not([value=""])').count(), name).toBeGreaterThan(0);
    }
  }

  const paths = [
    "/casinos?hasBonus=true",
    "/casinos?hasResponsibleGambling=true",
    "/casinos?hasBonus=true&hasResponsibleGambling=true",
    "/casinos?sort=INVALID&page=-9&pageSize=999&hasBonus=maybe&unknown=value",
  ];
  for (const path of paths) {
    const response = await request.get(`${baseUrl}${path}`);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain(messages.casinos.directoryTitle);
  }
});

test("legacy catalog permanently redirects and drops unsupported parameters", async ({ page }) => {
  const response = await page.request.get(`${baseUrl}/catalog?q=alpha&junk=unsafe`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/casinos?q=alpha");
});
