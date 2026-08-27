import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function open(page: import("@playwright/test").Page, path: string) {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  expect(response?.status(), path).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), path).toBe(true);
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
  await expect(best.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();

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
  await expect(bonuses.locator('aside[role="note"]').filter({ hasText: "DEMONSTRATION DATA" }).first()).toBeVisible();
  expect(await bonuses.locator('a[href^="/r/"], a[href^="http"]').count()).toBe(0);

  const directoryCards = bonuses.locator("[data-bonus-directory-card]");
  await expect(directoryCards).toHaveCount(8);
  for (const card of await directoryCards.all()) {
    await expect(card.locator('[data-logo-state="image"], [data-logo-state="fallback"]')).toBeVisible();
    for (const label of ["Wagering", "Min deposit", "Payout"]) await expect(card.getByText(label, { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Read Review" })).toBeVisible();
    expect(await card.evaluate((node) => {
      const terms = node.querySelector("[data-material-terms]");
      const actions = node.querySelector("[data-governed-actions]");
      return terms && actions ? Boolean(terms.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    })).toBe(true);
  }
  for (const image of await directoryCards.locator('[data-logo-state="image"] img').all()) expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe("contain");
});

test("missing offer media fails to the B4GAMBLE frame without inventing artwork", async ({ page }) => {
  await open(page, "/bonuses?visualFixture=true");
  const fallbacks = page.locator('[data-runtime-renderer="bonuses"] [data-media-state="fallback"]');
  await expect(fallbacks.first()).toBeVisible();
  await expect(fallbacks.first()).toContainText("Decision first. Creative optional.");
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
  const contracts: Array<{ path: string; label: string; preserved: RegExp }> = [
    { path: "/bonuses?sort=lowest-deposit", label: "Bonus result pages", preserved: /sort=lowest-deposit/ },
    { path: "/casinos?sort=NAME_ASC&pageSize=24", label: "Casino results pagination", preserved: /sort=NAME_ASC.*pageSize=24|pageSize=24.*sort=NAME_ASC/ },
  ];
  let visualContract: Record<string, string> | null = null;
  for (const contract of contracts) {
    await open(page, contract.path);
    const pagination = page.getByRole("navigation", { name: contract.label });
    await expect(pagination).toBeVisible();
    await expect(pagination.getByText("Previous", { exact: true })).toHaveAttribute("aria-disabled", "true");
    const next = pagination.getByRole("link", { name: "Next", exact: true });
    await expect(next).toHaveAttribute("href", /page=2/);
    await expect(next).toHaveAttribute("href", contract.preserved);
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
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(contract.preserved);
    await expect(pagination.getByText(/Page 2 of \d+/)).toBeVisible();
    await expect(pagination.getByRole("link", { name: "Previous", exact: true })).toBeVisible();
    const pageCount = Number((await pagination.locator("b").textContent())?.match(/of (\d+)/)?.[1]);
    await page.goto(`${baseUrl}${contract.path}${contract.path.includes("?") ? "&" : "?"}page=${pageCount}`, { waitUntil: "networkidle" });
    const finalPagination = page.getByRole("navigation", { name: contract.label });
    await expect(finalPagination.getByText("Next", { exact: true })).toHaveAttribute("aria-disabled", "true");
  }
  await page.close();
});
