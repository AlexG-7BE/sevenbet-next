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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Learn\.\s*Play smarter\./i);
  await expect(page.locator('[data-handoff-page="learn"]')).toHaveCount(1);
  const search = page.getByRole("searchbox", { name: "Search guides" });
  await expect(search).toHaveCount(1);
  await expect(page.locator('[data-learn-discovery-search]').filter({ has: search })).toHaveCount(1);
  await expect(page.locator('[data-screen-label="Hero"] input[type="search"], [data-learn-hero-axis] input[type="search"]')).toHaveCount(0);
  const guides = page.locator('[data-handoff-page="learn"] a[data-learn-category]');
  await expect(guides).toHaveCount(17);
  const allGuidePaths = await page.locator('[data-handoff-page="learn"] .scp3').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(allGuidePaths).size).toBe(13);
  expect(errors).toEqual([]);
});

test("search, facets, result count and no-results recovery use only current data", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
  const search = page.getByRole("searchbox", { name: "Search guides" });
  const liveStatus = page.locator("[data-learn-results-status]");
  await expect(liveStatus).toHaveAttribute("aria-live", "polite");
  await search.fill("licensing");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(2);
  await expect(page.locator("[data-learn-results-status]")).toContainText("2 guides shown");

  await search.fill("");
  await page.getByRole("button", { name: "Bonuses", exact: true }).click();
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(1);
  await expect(page.getByRole("link", { name: /How Welcome Bonus Terms Work/ }).last()).toBeVisible();
  await search.fill("welcome");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(1);

  await page.getByRole("button", { name: "All topics", exact: true }).click();
  await search.fill("no-current-guide-can-match-this-query");
  await expect(page.locator("[data-learn-results-status]")).toContainText("No guides match");
  await search.fill("");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(13);
  expect(errors).toEqual([]);
});

test("complete catalogue and category navigation work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/learn`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("a[data-learn-category].scp3")).toHaveCount(13);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

test("category and article routes preserve content, schemas and truthful evidence state", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(`${baseUrl}/learn/casino-bonuses`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/learn\?category=casino-bonuses/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Learn\.\s*Play smarter\./i);
  await expect(page.getByRole("button", { name: "Bonuses", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(1);

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

test("Greek mobile Learning proof copy wraps inside its content-driven row in hub, category and search states", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const expectProofCopyFits = async (state: string) => {
    const proof = page.locator('[data-handoff-page="learn"] [data-learn-meta-axis]');
    const items = proof.locator("[data-learn-meta-item]");
    await expect(proof, state).toBeVisible();
    await expect(items, state).toHaveCount(3);
    const geometry = await proof.evaluate((container) => {
      const containerBox = container.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      return {
        clientHeight: container.clientHeight,
        container: {
          bottom: containerBox.bottom,
          left: containerBox.left,
          right: containerBox.right,
          top: containerBox.top,
        },
        items: Array.from(container.querySelectorAll<HTMLElement>("[data-learn-meta-item]")).map((item) => {
          const range = document.createRange();
          range.selectNodeContents(item);
          const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
          return {
            bottom: Math.max(...rects.map((rect) => rect.bottom)),
            hyphens: getComputedStyle(item).hyphens,
            left: Math.min(...rects.map((rect) => rect.left)),
            right: Math.max(...rects.map((rect) => rect.right)),
            top: Math.min(...rects.map((rect) => rect.top)),
            whiteSpace: getComputedStyle(item).whiteSpace,
          };
        }),
        scrollHeight: container.scrollHeight,
        viewportWidth,
      };
    });

    expect(geometry.scrollHeight, `${state}: row height follows wrapped copy`).toBeLessThanOrEqual(geometry.clientHeight + 1);
    for (const item of geometry.items) {
      expect(item.whiteSpace, `${state}: semantic wrapping`).toBe("normal");
      expect(item.hyphens, `${state}: language-aware hyphenation`).toBe("auto");
      expect(item.left, `${state}: left edge`).toBeGreaterThanOrEqual(geometry.container.left - 1);
      expect(item.right, `${state}: right edge`).toBeLessThanOrEqual(geometry.container.right + 1);
      expect(item.left, `${state}: viewport left`).toBeGreaterThanOrEqual(-1);
      expect(item.right, `${state}: viewport right`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(item.top, `${state}: top edge`).toBeGreaterThanOrEqual(geometry.container.top - 1);
      expect(item.bottom, `${state}: bottom edge`).toBeLessThanOrEqual(geometry.container.bottom + 1);
    }
  };

  let response = await page.goto(`${baseUrl}/el/learn`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-learn-meta-item]').nth(1)).toHaveText("Εκπαιδευτικοί οδηγοί · γνωστοποιούνται εμπορικοί σύνδεσμοι");
  await expectProofCopyFits("Greek Learning hub at 390x844");

  response = await page.goto(`${baseUrl}/el/learn/casino-bonuses`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/gr\/learn\?category=casino-bonuses$/);
  await expectProofCopyFits("Greek Learning category at 390x844");

  await page.goto(`${baseUrl}/el/learn`, { waitUntil: "networkidle" });
  await page.getByRole("searchbox", { name: "Αναζήτηση οδηγών" }).fill("καζίνο");
  await expect(page.locator("[data-learn-results-status]")).toBeVisible();
  await expectProofCopyFits("Greek Learning search at 390x844");
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
    const outOfBounds = await page.locator('[data-handoff-page="learn"] h1, [data-handoff-page="learn"] h2, [data-handoff-page="learn"] h3, [data-handoff-page="learn"] a').evaluateAll((elements) => elements
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
