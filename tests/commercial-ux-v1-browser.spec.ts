import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const rawEvidence = /Material offer mechanics are not established|Players comparing|regulatory evidence and broad product depth|Pending review 24.?48 hours; bank\/card processing 3.?5 days/i;

async function expectNoCommercialLeak(page: Page) {
  await expect(page.locator("body")).not.toContainText(rawEvidence);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
}

test("Best Offers is an exact four-view, governed Top 3 decision flow", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/en/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  expect(await tabs.allTextContents()).toEqual(["Best Overall", "Fast Payouts", "Best Bonus Terms", "Low Deposit"]);

  for (const label of ["Best Overall", "Fast Payouts", "Best Bonus Terms", "Low Deposit"]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    await expect(page.getByRole("tab", { name: label, exact: true })).toHaveAttribute("aria-selected", "true");
    const cards = page.locator("[data-commercial-best-offer-card]");
    expect(await cards.count()).toBeLessThanOrEqual(3);
    for (const card of await cards.all()) {
      expect(await card.locator("dl > div").count()).toBeLessThanOrEqual(3);
      expect(await card.locator('[class*="badges"] > span').count()).toBeLessThanOrEqual(2);
      await expect(card.locator('[class*="rankOffer"] p')).toHaveCount(1);
    }
  }

  await expect(page.locator("[data-commercial-best-offer-card]")).toHaveCount(3);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await expect(page.getByText(/Worth a look/i)).toHaveCount(0);
  const method = page.locator('[data-premium-section="best-offers-method"]');
  const faq = page.locator('[data-premium-section="best-offers-faq"]');
  await expect(method).toContainText(/Material terms/i);
  await expect(method.locator("li")).toHaveCount(3);
  await expect(faq).toContainText(/Before you click/i);
  await expect(faq.locator("details")).toHaveCount(3);
  expect(await page.locator("[data-commercial-best-offer-card]").last().evaluate((card) => card.compareDocumentPosition(document.querySelector('[data-premium-section="best-offers-method"]')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  await expectNoCommercialLeak(page);
});

test("Casinos keeps one collection with name search and three reorder views", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/en/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const tabs = page.getByRole("tab");
  expect(await tabs.allTextContents()).toEqual(["Top Rated", "Fast Payouts", "Low Deposit"]);
  await expect(page.getByRole("tab", { name: "Top Rated", exact: true })).toHaveAttribute("aria-selected", "true");

  const cards = page.locator("[data-commercial-casino-card]");
  await expect(cards).toHaveCount(10);
  const names = async () => cards.locator("h2").allTextContents();
  const topRated = await names();
  await page.getByRole("tab", { name: "Fast Payouts", exact: true }).click();
  const fastPayouts = await names();
  await page.getByRole("tab", { name: "Low Deposit", exact: true }).click();
  const lowDeposit = await names();
  expect([...fastPayouts].sort()).toEqual([...topRated].sort());
  expect([...lowDeposit].sort()).toEqual([...topRated].sort());
  expect(lowDeposit[0]).not.toBe(topRated[0]);

  const search = page.getByRole("searchbox", { name: "Search casinos" });
  await search.fill("Marlowe");
  await expect(cards).toHaveCount(1);
  await expect(cards.locator("h2")).toHaveText("Marlowe Casino");
  await search.fill("");
  await expect(cards).toHaveCount(10);

  for (const removed of ["All Filters", "More Filters", "Results per page", "Sort results", "Compare"]) {
    await expect(page.getByText(removed, { exact: true })).toHaveCount(0);
  }
  await expect(cards.locator("dt").filter({ hasText: /^Wagering$/ })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  const firstTop = await cards.first().evaluate((element) => Math.round(element.getBoundingClientRect().top));
  const secondTop = await cards.nth(1).evaluate((element) => Math.round(element.getBoundingClientRect().top));
  const thirdTop = await cards.nth(2).evaluate((element) => Math.round(element.getBoundingClientRect().top));
  expect(secondTop).toBe(firstTop);
  expect(thirdTop).toBeGreaterThan(firstTop);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  const faq = page.locator('[data-premium-section="casinos-before-you-choose"]');
  await expect(faq).toContainText(/Before you choose/i);
  await expect(faq.locator("details")).toHaveCount(3);
  await expectNoCommercialLeak(page);
});

test("Bonuses is an offer-first directory with five bounded intent views", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/en/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const tabs = page.getByRole("tab");
  expect(await tabs.allTextContents()).toEqual(["All", "Welcome", "Low Wagering", "Low Deposit", "Free Spins"]);
  const cards = page.locator("[data-commercial-bonus-card]");
  await expect(cards).toHaveCount(8);

  await page.getByRole("tab", { name: "Low Wagering", exact: true }).click();
  await expect(cards.first()).toContainText("Novara Casino");
  await expect(cards.first()).toContainText("1×");
  await page.getByRole("tab", { name: "Free Spins", exact: true }).click();
  expect(await cards.count()).toBeLessThan(8);
  await page.getByRole("tab", { name: "Low Deposit", exact: true }).click();
  await expect(cards).toHaveCount(8);
  await page.getByRole("tab", { name: "Welcome", exact: true }).click();
  await expect(cards).toHaveCount(8);

  expect(await cards.first().locator("dl > div").count()).toBe(3);
  await expect(page.getByText("Current offer", { exact: true })).toHaveCount(0);
  await expect(cards.locator("dt").filter({ hasText: /^Payout$/ })).toHaveCount(0);
  for (const removed of ["More Filters", "Sort results", "What a bonus really costs", "Bonus calculator"]) {
    await expect(page.getByText(removed, { exact: true })).toHaveCount(0);
  }
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  const method = page.locator('[data-premium-section="bonus-terms-method"]');
  await expect(method).toContainText(/How we evaluate bonus terms/i);
  await expect(method.locator("li")).toHaveCount(3);
  await expect(method.getByRole("link", { name: /Bonus Guide/i })).toHaveAttribute("href", "/bonus-guide");
  await expectNoCommercialLeak(page);
});

test("casino review is concise, facts-first and suppresses non-governed CTA systems", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  const response = await page.goto(`${baseUrl}/en/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Solvane Casino" })).toBeVisible();
  expect(await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id))).toEqual([
    "overview", "why-we-rate", "payments", "current-offer", "games", "support", "regulation", "our-verdict", "casino-faq", "sources",
  ]);
  await expect(page.locator('section[aria-labelledby="casino-profile-title"] dl > div')).toHaveCount(3);
  await expect(page.locator("#why-we-rate li")).toHaveCount(3);
  await expect(page.locator("#current-offer dl > div")).toHaveCount(4);
  const verdict = page.locator('[data-intentional-line-clamp="2"]');
  await expect(verdict).toContainText("Solvane Casino:");
  await expect(verdict).toHaveAttribute("data-intentional-line-clamp", "2");
  expect(await verdict.evaluate((element) => ({
    lineClamp: getComputedStyle(element).webkitLineClamp,
    overflow: getComputedStyle(element).overflow,
  }))).toEqual({ lineClamp: "2", overflow: "hidden" });
  await expect(page.locator('#why-we-rate [data-reason-tone="strength"]')).toHaveCount(2);
  await expect(page.locator('#why-we-rate [data-reason-tone="caveat"]')).toHaveCount(1);
  await expect(page.locator("#support")).not.toContainText("Mobile support");
  await expect(page.locator("[data-casino-decision-bar]")).toHaveCount(0);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await expect(page.getByText("Review only", { exact: true })).toHaveCount(2);
  await expect(page.locator("#current-offer [class*='materialWarning']")).toContainText("Terms shown before action");
  const sectionNav = page.locator("[data-casino-section-nav]");
  await expect(sectionNav.getByRole("link")).toHaveCount(4);
  expect(await sectionNav.getByRole("link").allTextContents()).toEqual(["Overview", "Offer & terms", "Our verdict", "FAQ"]);
  await expect(page.locator('[data-premium-section="casino-verdict"]')).toContainText(/Solvane Casino.*9\.6/is);
  expect(await page.locator("#casino-faq details").count()).toBeLessThanOrEqual(3);
  await expectNoCommercialLeak(page);
});

test("editorial-only market state is deliberate across navigation and direct commercial routes", async ({ page }) => {
  const best = await page.goto(`${baseUrl}/en/best-offers`, { waitUntil: "networkidle" });
  expect(best?.status()).toBe(200);
  await expect(page.locator('[data-commercial-market-state="editorial-only"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Offers aren.t available/i);
  await expect(page.getByText(/Three picks/i)).toHaveCount(0);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await expect(page.locator('header a[href$="/best-offers"], header a[href$="/bonuses"]')).toHaveCount(0);
  await expect(page.locator('footer a[href$="/best-offers"], footer a[href$="/bonuses"]')).toHaveCount(0);
  await expect(page.locator('header a[href$="/casinos"], header a[href$="/learn"]')).toHaveCount(4);

  const bonuses = await page.goto(`${baseUrl}/en/bonuses`, { waitUntil: "networkidle" });
  expect(bonuses?.status()).toBe(200);
  await expect(page.locator('[data-commercial-market-state="editorial-only"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Partner bonus offers aren.t available/i);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator('[data-commercial-bonus-card], a[href^="/r/"]')).toHaveCount(0);
});

test("Preview market inspection is allowlisted, market-aware, and always non-actionable", async ({ page }) => {
  for (const [market, displayName] of [["DK", "Denmark"], ["EE", "Estonia"], ["LV", "Latvia"]] as const) {
    const response = await page.goto(`${baseUrl}/en/casinos?visualFixture=true&qaMarket=${market}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(new RegExp(displayName, "i"));
    expect(await page.title()).not.toContain("KZ");
    await expect(page.locator('[data-commercial-casino-card]')).toHaveCount(10);
    await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
    const reviewHref = await page.locator('[data-commercial-casino-card] a[href*="/casino/"]').first().getAttribute("href");
    expect(reviewHref).toContain(`qaMarket=${market}`);
  }
  const profile = await page.goto(`${baseUrl}/en/casino/demo-plume?visualFixture=true&qaMarket=EE`, { waitUntil: "domcontentloaded" });
  expect(profile?.status()).toBe(200);
  await expect(page.locator("#regulation dd").filter({ hasText: /^EE$/ })).toHaveCount(1);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
});

test("all Commercial UX surfaces remain readable at Founder-approved breakpoints", async ({ page }) => {
  test.setTimeout(120_000);
  const paths = [
    "/en/best-offers?visualFixture=true",
    "/en/casinos?visualFixture=true",
    "/en/bonuses?visualFixture=true",
    "/en/casino/demo-plume?visualFixture=true",
  ];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of paths) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${viewport.width}px ${path}`).toBe(200);
      await expect(page.locator("h1"), `${viewport.width}px ${path}`).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${viewport.width}px ${path}`).toBe(0);
      const targetHeights = await page.getByRole("tab").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
      expect(targetHeights.every((height) => height >= 44), `${viewport.width}px ${path} tab targets`).toBe(true);
      if (path.includes("best-offers")) {
        expect(await page.locator('[data-premium-section="best-offers-method"] li p').evaluateAll((items) => items.length === 3 && items.every((item) => getComputedStyle(item).display !== "none")), `${viewport.width}px trust principles`).toBe(true);
      }
      if (path.includes("/casino/")) {
        const sectionNavFits = await page.locator("[data-casino-section-nav]").evaluate((nav) => nav.scrollWidth <= nav.clientWidth);
        expect(sectionNavFits, `${viewport.width}px casino section navigation`).toBe(true);
      }
      await expect(page.locator("body")).not.toContainText(rawEvidence);
    }
  }
});
