import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

function collectRuntimeErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("Learning Center renders the truthful empty PostgreSQL catalogue in the Public Shell", async ({ page }) => {
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
  await expect(page.locator('[data-handoff-page="learn"] a[data-learn-category]')).toHaveCount(0);
  await expect(page.locator("[data-learn-empty]")).toHaveText("No published guides are available in this language yet.");
  await expect(page.locator("[data-learn-results-status]")).toBeEmpty();
  expect(errors).toEqual([]);
});

test("search and facets remain usable with no synthetic catalogue", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(`${baseUrl}/learn`, { waitUntil: "networkidle" });
  const search = page.getByRole("searchbox", { name: "Search guides" });
  const liveStatus = page.locator("[data-learn-results-status]");
  await expect(liveStatus).toHaveAttribute("aria-live", "polite");
  await search.fill("licensing");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(0);
  await expect(page.locator("[data-learn-results-status]")).toContainText("No guides match");

  await search.fill("");
  await page.getByRole("button", { name: "Bonuses", exact: true }).click();
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(0);
  await expect(page.locator("[data-learn-results-status]")).toContainText("No guides match");
  expect(errors).toEqual([]);
});

test("complete catalogue and category navigation work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/learn`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("a[data-learn-category].scp3")).toHaveCount(0);
  await expect(page.locator("[data-learn-empty]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

test("Greek mobile Learning proof copy wraps inside its content-driven row", async ({ page }) => {
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

  const response = await page.goto(`${baseUrl}/el/learn`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-learn-meta-item]').nth(1)).toHaveText("Εκπαιδευτικοί οδηγοί · γνωστοποιούνται εμπορικοί σύνδεσμοι");
  await expectProofCopyFits("Greek Learning hub at 390x844");

  await page.getByRole("searchbox", { name: "Αναζήτηση οδηγών" }).fill("καζίνο");
  await expect(page.locator("[data-learn-results-status]")).toBeVisible();
  await expectProofCopyFits("Greek Learning search at 390x844");
});

test("invalid category and article combinations return 404", async ({ request }) => {
  expect((await request.get(`${baseUrl}/learn/not-a-category`)).status()).toBe(404);
  expect((await request.get(`${baseUrl}/learn/casino-bonuses`)).status()).toBe(404);
  expect((await request.get(`${baseUrl}/learn/responsible-gambling/responsible-gambling-tools`)).status()).toBe(404);
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
