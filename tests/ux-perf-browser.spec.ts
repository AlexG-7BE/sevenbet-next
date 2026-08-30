import { expect, test } from "@playwright/test";

import { productPageMessages } from "../lib/i18n/product-pages-catalog";

const messages = productPageMessages("en-GB");

function isRsc(url: string, headers: Record<string, string>) {
  return url.includes("_rsc=") || headers.rsc === "1";
}

test("casino controls use RSC navigation, preserve results while pending, and support history", async ({ page }) => {
  await page.goto("/casinos?visualFixture=true", { waitUntil: "networkidle" });
  const initialDocuments: string[] = [];
  const rscRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") initialDocuments.push(request.url());
    if (isRsc(request.url(), request.headers())) rscRequests.push(request.url());
  });

  await page.route("**/*_rsc=*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
  const firstResult = page.locator("#casino-results article").first();
  const marketPreference = page.locator('select[name="country"]:visible').first();
  await expect(firstResult).toBeVisible();
  const fixtureCountry = await marketPreference.locator('option:not([value=""])').first().getAttribute("value");
  expect(fixtureCountry).toBeTruthy();
  await marketPreference.selectOption(fixtureCountry!);
  await expect(page.locator('form[data-instant-discovery-form="true"][data-pending="true"]')).toBeVisible();
  await expect(firstResult).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("country")).toBe(fixtureCountry);
  await expect(marketPreference).toHaveValue(fixtureCountry!);
  expect(initialDocuments).toHaveLength(0);
  expect(rscRequests.length).toBeGreaterThan(0);

  await marketPreference.selectOption("");
  await expect.poll(() => new URL(page.url()).searchParams.get("country")).toBeNull();
  await page.goBack();
  await expect(marketPreference).toHaveValue(fixtureCountry!);
  await page.goForward();
  await expect(marketPreference).toHaveValue("");
});

test("bonus numeric controls debounce to one replace navigation and Enter applies immediately", async ({ page }) => {
  await page.goto("/bonuses?visualFixture=true", { waitUntil: "networkidle" });
  const wagering = page.getByRole("spinbutton", { name: messages.common.wagering }).first();
  const rscRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/bonuses" && url.searchParams.get("maxWagering") === "35" && isRsc(request.url(), request.headers())) rscRequests.push(request.url());
  });
  await wagering.pressSequentially("35", { delay: 35 });
  await expect.poll(() => new URL(page.url()).searchParams.get("maxWagering")).toBe("35");
  expect(new URL(page.url()).searchParams.get("visualFixture")).toBe("true");
  expect(rscRequests).toHaveLength(1);

  await wagering.fill("25");
  await wagering.press("Enter");
  await expect.poll(() => new URL(page.url()).searchParams.get("maxWagering")).toBe("25");
  expect(new URL(page.url()).searchParams.get("visualFixture")).toBe("true");
});

test("bonus numeric and select controls auto-apply without a document reload", async ({ page }) => {
  await page.goto("/bonuses?visualFixture=true", { waitUntil: "networkidle" });
  const controls = page.getByRole("region", { name: messages.common.directoryControls, exact: true });
  let documents = 0;
  let rsc = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") documents += 1;
    if (isRsc(request.url(), request.headers())) rsc += 1;
  });
  await controls.locator('select[name="type"]:visible').first().selectOption("WELCOME");
  await expect.poll(() => new URL(page.url()).searchParams.get("type")).toBe("WELCOME");
  await controls.locator('input[name="maxWagering"]:visible').first().fill("25");
  await expect.poll(() => new URL(page.url()).searchParams.get("maxWagering")).toBe("25");
  expect(new URL(page.url()).searchParams.get("visualFixture")).toBe("true");
  expect(documents).toBe(0);
  expect(rsc).toBeGreaterThanOrEqual(2);
});

test("contextual comparison selection updates URL state without a document navigation", async ({ page }) => {
  await page.goto("/casinos?visualFixture=true", { waitUntil: "networkidle" });
  let documents = 0;
  page.on("request", (request) => { if (request.resourceType() === "document") documents += 1; });
  const availableComparisons = page.locator('[data-comparison-toggle][aria-pressed="false"]');
  await expect(availableComparisons.first()).toBeVisible();
  await availableComparisons.first().click();
  await availableComparisons.first().click();
  await expect(page).toHaveURL(/casino=[a-z0-9-]+.*casino=[a-z0-9-]+/);
  await expect(page.getByRole("heading", { name: "Side by side" })).toBeVisible();
  expect(documents).toBe(0);
});

test("native GET fallbacks work without JavaScript on all enhanced routes", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/casinos?visualFixture=true", { waitUntil: "networkidle" });
  const fallback = page.locator("noscript details").first();
  await fallback.locator("summary").click();
  const marketPreference = fallback.getByLabel(messages.common.countryPreference);
  const fixtureCountry = await marketPreference.locator('option:not([value=""])').first().getAttribute("value");
  expect(fixtureCountry).toBeTruthy();
  await marketPreference.selectOption(fixtureCountry!);
  await fallback.getByRole("button", { name: "Apply filters" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("country")).toBe(fixtureCountry);
  expect(new URL(page.url()).searchParams.get("visualFixture")).toBe("true");

  await page.goto("/bonuses?visualFixture=true", { waitUntil: "networkidle" });
  const bonusForm = page.locator("noscript form").first();
  await expect(bonusForm.getByLabel(messages.common.sortResults)).toBeVisible();
  await bonusForm.getByLabel(messages.common.sortResults).selectOption("lowest-deposit");
  await bonusForm.getByRole("button", { name: messages.common.applyFilters }).click();
  await expect(page).toHaveURL(/sort=lowest-deposit/);
  expect(new URL(page.url()).searchParams.get("visualFixture")).toBe("true");

  await page.goto("/compare?casino=demo-northstar&country=GB", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/casinos\?casino=demo-northstar&country=GB/);
  await expect(page.getByRole("heading", { name: /Picked for/ })).toBeVisible();
  await context.close();
});

test("GB preference never bypasses commercial authority", async ({ page }) => {
  await page.goto("/casinos?country=GB", { waitUntil: "networkidle" });
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await page.goto("/bonuses?country=GB", { waitUntil: "networkidle" });
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
});
