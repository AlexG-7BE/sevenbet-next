import { expect, test, type Locator, type Page } from "@playwright/test";

import { formatProductMessage, productPageMessages } from "../lib/i18n/product-pages-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const messages = productPageMessages("en-GB");

async function open(page: Page, path: string) {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  expect(response?.status(), path).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), path).toBe(true);
}

async function expectBonusDirectoryPage(cards: Locator, expectedCount: number) {
  await expect(cards).toHaveCount(expectedCount);
  for (const card of await cards.all()) {
    await expect(card.locator('[data-logo-state="image"], [data-logo-state="fallback"]')).toBeVisible();
    for (const label of [messages.common.wagering, messages.common.minimumDeposit, messages.common.payout]) {
      await expect(card.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(card.locator("[data-governed-actions]")).toBeVisible();
    expect(await card.evaluate((node) => {
      const terms = node.querySelector("[data-material-terms]");
      const actions = node.querySelector("[data-governed-actions]");
      return terms && actions ? Boolean(terms.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    })).toBe(true);
  }
  for (const image of await cards.locator('[data-logo-state="image"] img').all()) {
    expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe("contain");
  }
}

function expectPreservedQuery(url: URL, expected: Readonly<Record<string, string>>) {
  for (const [key, value] of Object.entries(expected)) expect(url.searchParams.get(key), key).toBe(value);
}

test("Phase 2 visual fixtures present controlled ratios and keep terms before action", async ({ page }) => {
  await open(page, "/best-offers?visualFixture=true");
  const best = page.locator('[data-runtime-renderer="best-offers"]');
  const bestMedia = best.locator("[data-offer-media]");
  await expect(bestMedia).toHaveCount(3);
  await expect(bestMedia.nth(0)).toHaveAttribute("data-media-ratio", "wide-landscape");
  await expect(bestMedia.nth(1)).toHaveAttribute("data-media-ratio", "landscape");
  await expect(bestMedia.nth(2)).toHaveAttribute("data-media-ratio", "square");
  await expect(bestMedia.locator("img")).toHaveCount(3);
  for (const image of await bestMedia.locator("img").all()) expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe("contain");
  expect(await best.locator('a[href^="/r/"], a[href^="http"]').count()).toBe(0);
  const bestDemoNote = best.getByRole("note").filter({ hasText: messages.common.demoDisclosure });
  await expect(bestDemoNote).toContainText(messages.common.demoData);

  const featuredOrder = await page.getByTestId("best-offer-product-card").evaluate((card) => {
    const terms = card.querySelector("dl");
    const action = card.querySelector('[class*="featuredActions"]');
    return terms && action ? Boolean(terms.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  });
  expect(featuredOrder).toBe(true);

  await open(page, "/bonuses?visualFixture=true");
  const bonuses = page.locator('[data-runtime-renderer="bonuses"]');
  const curated = bonuses.locator('section[aria-labelledby="bonus-shortlist-title"] article');
  await expect(curated).toHaveCount(3);
  await expect(curated.nth(0).locator("[data-offer-media]")).toHaveAttribute("data-media-ratio", "wide-landscape");
  await expect(curated.nth(1).locator("[data-offer-media]")).toHaveAttribute("data-media-ratio", "square");
  await expect(curated.nth(2).locator("[data-offer-media]")).toHaveAttribute("data-media-ratio", "missing");
  await expect(curated.nth(2).locator('[data-media-state="fallback"]')).toBeVisible();
  for (const card of await curated.all()) {
    expect(await card.evaluate((node) => {
      const terms = node.querySelector("dl");
      const actions = node.querySelector('[class*="actions"]');
      return terms && actions ? Boolean(terms.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    })).toBe(true);
  }
  await expect(bonuses.locator('aside[role="note"]').filter({ hasText: messages.common.demoData }).first()).toBeVisible();
  expect(await bonuses.locator('a[href^="/r/"], a[href^="http"]').count()).toBe(0);

  const directoryCards = bonuses.locator("[data-bonus-directory-card]");
  const directoryPagination = bonuses.locator("[data-directory-pagination]");
  await expect(directoryPagination).toHaveAttribute("data-current-page", "1");
  await expect(directoryPagination).toHaveAttribute("data-page-count", "2");
  await expectBonusDirectoryPage(directoryCards, 4);
  await expect(directoryCards.getByRole("link", { name: messages.common.readReview, exact: true })).toHaveCount(1);

  await directoryPagination.getByRole("link", { name: messages.common.next, exact: true }).click();
  await expect(directoryPagination).toHaveAttribute("data-current-page", "2");
  expectPreservedQuery(new URL(page.url()), { page: "2", visualFixture: "true" });
  await expectBonusDirectoryPage(directoryCards, 4);
  await expect(directoryCards.getByRole("link", { name: messages.common.readReview, exact: true })).toHaveCount(0);
  expect(await bonuses.locator('a[href^="/r/"], a[href^="http"]').count()).toBe(0);
});

test("missing offer media fails to the B4GAMBLE frame without inventing artwork", async ({ page }) => {
  await open(page, "/bonuses?visualFixture=true");
  const fallbacks = page.locator('[data-runtime-renderer="bonuses"] [data-media-state="fallback"]');
  const fallback = fallbacks.first();
  await expect(fallback).toBeVisible();
  await expect(fallback.getByText(messages.common.mediaUnavailableTitle, { exact: true })).toBeVisible();
  await expect(fallback.getByText(messages.common.mediaUnavailableCopy, { exact: true })).toBeVisible();
  expect(await fallbacks.locator("img").count()).toBe(0);
});

test("Phase 2 pages keep pagination semantics and no overflow at all target widths", async ({ browser }) => {
  test.setTimeout(90_000);
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 900 : 1000 }, isMobile: width <= 430, hasTouch: width <= 430 });
    for (const path of ["/best-offers?visualFixture=true", "/bonuses?visualFixture=true", "/casinos?visualFixture=true"]) await open(page, path);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const contracts: Array<{ path: string; label: string; preserved: Readonly<Record<string, string>> }> = [
    {
      path: "/bonuses?sort=lowest-deposit&visualFixture=true",
      label: messages.bonuses.directoryTitle,
      preserved: { sort: "lowest-deposit", visualFixture: "true" },
    },
    {
      path: "/casinos?sort=NAME_ASC&pageSize=24&visualFixture=true",
      label: messages.casinos.directoryTitle,
      preserved: { sort: "NAME_ASC", pageSize: "24", visualFixture: "true" },
    },
  ];
  let visualContract: Record<string, string> | null = null;
  for (const contract of contracts) {
    await open(page, contract.path);
    const pagination = page.getByRole("navigation", { name: contract.label, exact: true });
    await expect(pagination).toBeVisible();
    await expect(pagination).toHaveAttribute("data-current-page", "1");
    await expect(pagination).toHaveAttribute("data-page-count", "2");
    await expect(pagination.getByText(messages.common.previous, { exact: true })).toHaveAttribute("aria-disabled", "true");
    const next = pagination.getByRole("link", { name: messages.common.next, exact: true });
    const nextHref = await next.getAttribute("href");
    expect(nextHref).not.toBeNull();
    const nextUrl = new URL(nextHref!, baseUrl);
    expect(nextUrl.searchParams.get("page")).toBe("2");
    expectPreservedQuery(nextUrl, contract.preserved);
    const currentContract = await pagination.evaluate((node) => {
      const control = node.querySelector("a");
      const label = node.querySelector("b");
      const navStyle = getComputedStyle(node);
      const controlStyle = control ? getComputedStyle(control) : null;
      const labelStyle = label ? getComputedStyle(label) : null;
      return {
        display: navStyle.display,
        gap: navStyle.gap,
        columns: navStyle.gridTemplateColumns,
        controlHeight: controlStyle?.minHeight || "",
        controlRadius: controlStyle?.borderRadius || "",
        controlBorder: controlStyle?.borderTopWidth || "",
        labelSize: labelStyle?.fontSize || "",
      };
    });
    if (visualContract) expect(currentContract).toEqual(visualContract);
    else visualContract = currentContract;
    await next.focus();
    await expect(next).toBeFocused();
    await next.click();
    await expect(pagination).toHaveAttribute("data-current-page", "2");
    const pageCount = Number(await pagination.getAttribute("data-page-count"));
    expect(pageCount).toBe(2);
    expectPreservedQuery(new URL(page.url()), { ...contract.preserved, page: "2" });
    await expect(pagination.getByText(formatProductMessage(messages.common.pageOf, { page: 2, pages: pageCount }), { exact: true })).toBeVisible();
    await expect(pagination.getByRole("link", { name: messages.common.previous, exact: true })).toBeVisible();

    const finalUrl = new URL(contract.path, baseUrl);
    finalUrl.searchParams.set("page", String(pageCount));
    await open(page, `${finalUrl.pathname}${finalUrl.search}`);
    const finalPagination = page.getByRole("navigation", { name: contract.label, exact: true });
    await expect(finalPagination).toHaveAttribute("data-current-page", String(pageCount));
    expectPreservedQuery(new URL(page.url()), { ...contract.preserved, page: String(pageCount) });
    await expect(finalPagination.getByText(messages.common.next, { exact: true })).toHaveAttribute("aria-disabled", "true");
  }
  await page.close();
});
