import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

function collectRuntimeErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("Learning Center renders the current editorial catalogue in the Public Shell", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  const response = await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("THE MAGAZINE SHELF.");
  await expect(page.locator("[data-learning-center]")).toHaveAttribute("data-figma-authority", "835:6356");
  await expect(page.locator("#learning-categories li")).toHaveCount(13);
  await expect(page.locator("[data-learning-search] .LearningSearchAndFilter_results__placeholder")).toHaveCount(0);
  await expect(page.locator("[data-learning-search] ol li")).toHaveCount(13);
  await expect(page.getByRole("heading", { name: "SIX WAYS THROUGH THE SHELF." })).toBeVisible();
  expect(errors).toEqual([]);
});

test("search, facets, result count and no-results recovery use only current data", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
  const search = page.getByRole("searchbox", { name: "Search guides" });
  await search.fill("licensing");
  await expect(page.locator("[data-learning-search] ol li")).not.toHaveCount(13);
  await expect(page.getByText(/guides? on this shelf/)).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Category").selectOption("casino-bonuses");
  await expect(page.locator("[data-learning-search] ol li")).toHaveCount(1);
  await expect(page.locator("[data-learning-search]").getByRole("link", { name: /How Welcome Bonus Terms Work/ })).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await search.fill("no-current-guide-can-match-this-query");
  await expect(page.getByRole("heading", { name: "THE SHELF IS QUIET." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse categories" })).toHaveAttribute("href", "#learning-categories");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("[data-learning-search] ol li")).toHaveCount(13);
  expect(errors).toEqual([]);
});

test("complete catalogue and category navigation work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/learn`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-learning-search] ol li")).toHaveCount(13);
  await expect(page.locator("#learning-categories li")).toHaveCount(13);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

test("category and article routes preserve content, schemas and truthful evidence state", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(`${baseUrl}/learn/casino-bonuses`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/learn\?category=casino-bonuses/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Learn\.\s*Play smarter\./i);
  await expect(page.locator('[data-learning-search]')).toBeVisible();

  await page.goto(`${baseUrl}/learn/casino-bonuses/welcome-bonus-terms`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How Welcome Bonus Terms Work");
  await expect(page.getByRole("heading", { name: "SOURCE STATUS: UNAVAILABLE." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Compare casinos/ })).toHaveAttribute("href", "/casinos");
  await expect(page.locator('[data-learning-article] a[href^="/r/"], [data-learning-article] a[href^="/go/"]')).toHaveCount(0);
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? "{}")));
  expect(schemas.some((schema) => schema["@type"] === "BreadcrumbList")).toBe(true);
  expect(schemas.some((schema) => schema["@type"] === "Article")).toBe(true);
  expect(schemas.some((schema) => schema["@type"] === "FAQPage")).toBe(true);
  expect(errors).toEqual([]);
});

test("responsible-gambling learning article has no commercial transition", async ({ page }) => {
  await page.goto(`${baseUrl}/learn/responsible-gambling/responsible-gambling-tools`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /Open protected Help/ })).toHaveAttribute("href", "/help");
  await expect(page.locator('[data-learning-article] a[href="/compare"], [data-learning-article] a[href^="/casinos"], [data-learning-article] a[href^="/bonuses"]')).toHaveCount(0);
});

test("invalid category and article combinations return 404", async ({ request }) => {
  expect((await request.get(`${baseUrl}/learn/not-a-category`)).status()).toBe(404);
  expect((await request.get(`${baseUrl}/learn/casino-bonuses/not-an-article`)).status()).toBe(404);
  expect((await request.get(`${baseUrl}/learn/casino-basics/welcome-bonus-terms`)).status()).toBe(404);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 430, height: 844 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 800 },
  { width: 320, height: 720 },
] as const) {
  test(`/learn stays within the viewport at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    const errors = collectRuntimeErrors(page);
    await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const outOfBounds = await page.locator("[data-learning-center] h1, [data-learning-center] h2, [data-learning-center] h3, [data-learning-center] a").evaluateAll((elements) => elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .map((element) => element.textContent?.trim()));
    expect(outOfBounds).toEqual([]);
    expect(errors).toEqual([]);
    await page.close();
  });
}

for (const route of [
  "/learn/casino-bonuses",
  "/learn/casino-bonuses/welcome-bonus-terms",
] as const) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 720 }] as const) {
    test(`${route} stays within the viewport at ${viewport.width}px`, async ({ browser }) => {
      const page = await browser.newPage({ viewport });
      const errors = collectRuntimeErrors(page);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      expect(errors).toEqual([]);
      await page.close();
    });
  }
}
