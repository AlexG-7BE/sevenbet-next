import { expect, test } from "@playwright/test";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const messages = productPageMessages("en-GB");

type JsonLdRecord = Record<string, unknown>;

function jsonLdRecords(html: string) {
  const records: JsonLdRecord[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as JsonLdRecord;
    records.push(record);
    Object.values(record).forEach(visit);
  };

  for (const match of html.matchAll(/<script\b[^>]*\btype=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)) {
    visit(JSON.parse(match[2]) as unknown);
  }
  return records;
}

function hasJsonLdType(record: JsonLdRecord, type: string) {
  const value = record["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

test("best offers is server rendered and fails closed before any governed action", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText(messages.bestOffers.heroLead);
  await expect(heading).toContainText(messages.bestOffers.heroEmphasis);
  const renderer = page.locator('[data-runtime-renderer="best-offers"]');
  await expect(renderer).toBeVisible();
  expect(await renderer.locator('a[href^="http"]').count()).toBe(0);
  expect(await renderer.locator('a[href^="/r/"]').count()).toBe(0);
  const shortlist = renderer.locator("#shortlist");
  await expect(shortlist).toBeVisible();
  const featured = shortlist.getByTestId("best-offer-product-card");
  if (await featured.count() === 0) {
    await expect(shortlist.getByRole("heading", { level: 2 })).toBeVisible();
  } else {
    await expect(featured).toHaveCount(1);
    await expect(featured.getByText(messages.common.minimumDeposit).first()).toBeVisible();
  }
});

test("Best Offers exposes all three handoff picks without hiding ranking evidence", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const featured = page.getByTestId("best-offer-product-card");
  const alternatives = page.getByTestId("ranked-offer-card");
  await expect(featured).toBeVisible();
  await expect(alternatives).toHaveCount(2);
  await expect(alternatives.first()).toBeVisible();
  await expect(featured).toContainText(messages.common.demoData);
  await expect(page.locator('[data-runtime-renderer="best-offers"] > p.srOnly')).toHaveText(messages.bestOffers.commissionNote);
  const commissionDetails = page.locator("details").filter({ hasText: messages.bestOffers.faqCommissionQuestion });
  await commissionDetails.locator("summary").click();
  await expect(commissionDetails.getByText(messages.bestOffers.faqCommissionAnswer, { exact: false })).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});

test("Best Offers static handoff picks expose keyboard-accessible review routes", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const featured = page.getByTestId("best-offer-product-card");
  const alternatives = page.getByTestId("ranked-offer-card");
  const cards = page.locator('[data-testid="best-offer-product-card"], [data-testid="ranked-offer-card"]');
  await expect(cards).toHaveCount(3);

  const reviewLink = featured.getByRole("link", { name: messages.common.readReview, exact: false });
  await expect(reviewLink).toHaveCount(1);
  await reviewLink.focus();
  await expect(reviewLink).toBeFocused();
  const reviewHref = await reviewLink.getAttribute("href");
  expect(reviewHref).not.toBeNull();
  if (!reviewHref) throw new Error("The fixture review link must expose an href");
  const reviewUrl = new URL(reviewHref, baseUrl);
  expect(reviewUrl.pathname).toMatch(/^\/casino\/[^/]+$/);
  expect(reviewUrl.searchParams.get("visualFixture")).toBe("true");

  await expect(alternatives.getByRole("link", { name: messages.common.readReview, exact: false })).toHaveCount(0);
  for (const card of await cards.all()) {
    await expect(card.getByText(messages.common.reviewAvailableNoAction, { exact: true })).toBeVisible();
  }
  expect(await page.locator('[data-runtime-renderer="best-offers"] a[href^="http"]').count()).toBe(0);
});

test("bonus filters remain URL-authoritative and server rendered", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/bonuses?country=GB&type=WELCOME&featured=false&recommended=true&sort=lowest-wagering&visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const form = page.locator('form[action$="/bonuses"]').first();
  await expect(form.getByLabel(messages.common.countryPreference)).toHaveValue("GB");
  await expect(form.getByLabel(messages.common.bonusType)).toHaveValue("WELCOME");
  const url = new URL(page.url());
  expect(url.searchParams.get("country")).toBe("GB");
  expect(url.searchParams.get("type")).toBe("WELCOME");
  expect(url.searchParams.get("featured")).toBe("false");
  expect(url.searchParams.get("recommended")).toBe("true");
  expect(url.searchParams.get("sort")).toBe("lowest-wagering");
  expect(url.searchParams.get("visualFixture")).toBe("true");
  await expect(page.getByRole("button", { name: messages.common.applyFilters })).toHaveCount(0);
  const allFilters = page.getByRole("button", { name: messages.common.allFilters });
  await expect(allFilters.locator("b")).toHaveText("4");
  await allFilters.click();
  const drawer = page.locator("#bonus-all-filters-dialog[open]");
  await expect(drawer.locator('select[name="featured"]')).toHaveValue("false");
  await expect(drawer.locator('select[name="recommended"]')).toHaveValue("true");
  await drawer.getByRole("button", { name: messages.common.closeFilters }).click();
  const activeFilters = page.locator('[data-active-filter-state="bonuses"]');
  await expect(activeFilters).toBeVisible();
  await expect(activeFilters.getByRole("link", { name: `${messages.comparison.remove} ${messages.bonuses.featuredFalse}`, exact: true })).toBeVisible();
  await expect(activeFilters.getByRole("link", { name: `${messages.comparison.remove} ${messages.bonuses.recommendedTrue}`, exact: true })).toBeVisible();
  await expect(activeFilters.getByRole("link", { name: messages.common.clearAll, exact: true })).toHaveCount(1);

  await form.getByLabel(messages.common.paymentMethods).selectOption("visa");
  await expect(page).toHaveURL((nextUrl) => nextUrl.searchParams.get("payment") === "visa");
  const updatedUrl = new URL(page.url());
  expect(updatedUrl.searchParams.get("featured")).toBe("false");
  expect(updatedUrl.searchParams.get("recommended")).toBe("true");
  expect(updatedUrl.searchParams.get("visualFixture")).toBe("true");
  await expect(page.getByRole("button", { name: messages.common.allFilters }).locator("b")).toHaveText("5");
});

test("offer pages have no horizontal overflow at desktop and mobile widths", async ({ browser }) => {
  for (const width of [1440, 430, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 }, isMobile: width <= 430 });
    for (const path of ["/best-offers?visualFixture=true", "/bonuses?country=GB&sort=lowest-deposit&visualFixture=true"]) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      expect(response?.status(), `${path} at ${width}px`).toBe(200);
      if (path.startsWith("/best-offers") && width <= 390) {
        await expect(page.getByTestId("ranked-offer-card").first()).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false);
    }
    await page.close();
  }
});

test("bonus HTML remains useful without JavaScript", async ({ request }) => {
  const response = await request.get(`${baseUrl}/bonuses?country=GB&type=WELCOME&featured=false&recommended=true&visualFixture=true`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('method="get"');
  expect(html).toContain('data-active-filter-state="bonuses"');
  expect(html).toContain(messages.common.activeFilters);
  expect(html).toContain(messages.bonuses.directoryTitle);
  expect(html).toContain(messages.bonuses.featuredFalse);
  expect(html).toContain(messages.bonuses.recommendedTrue);
});

test("Best Offers HTML remains useful without JavaScript and keeps schema truthful across inventory states", async ({ request }) => {
  const response = await request.get(`${baseUrl}/best-offers`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('data-runtime-renderer="best-offers"');
  expect(html).toContain(messages.bestOffers.heroLead);
  expect(html).toContain(messages.bestOffers.heroEmphasis);
  const records = jsonLdRecords(html);
  expect(records.filter((record) => hasJsonLdType(record, "Offer"))).toHaveLength(0);
  for (const itemList of records.filter((record) => hasJsonLdType(record, "ItemList"))) {
    const items = Array.isArray(itemList.itemListElement) ? itemList.itemListElement : [];
    expect(Number.isInteger(itemList.numberOfItems)).toBe(true);
    expect(itemList.numberOfItems).toBe(items.length);
  }
  expect(html).not.toMatch(/<a[^>]+href="\/r\//);

  const fixtureResponse = await request.get(`${baseUrl}/best-offers?visualFixture=true`);
  expect(fixtureResponse.status()).toBe(200);
  const fixtureHtml = await fixtureResponse.text();
  const fixtureRecords = jsonLdRecords(fixtureHtml);
  expect(fixtureHtml).toContain(messages.common.demoData);
  expect(fixtureRecords.filter((record) => hasJsonLdType(record, "Offer"))).toHaveLength(0);
  expect(fixtureRecords.filter((record) => hasJsonLdType(record, "ItemList"))).toHaveLength(0);
  expect(fixtureHtml).not.toMatch(/<a[^>]+href="\/r\//);
});
