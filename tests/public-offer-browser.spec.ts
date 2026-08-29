import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("best offers is server rendered and fails closed before any governed action", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Three picks.*Not thirty/ })).toBeVisible();
  const renderer = page.locator('[data-runtime-renderer="best-offers"]');
  expect(await renderer.locator('a[href^="http"]').count()).toBe(0);
  expect(await renderer.locator('a[href^="/r/"]').count()).toBe(0);
  const products = page.getByTestId("best-offer-product-card");
  const count = await products.count();
  if (count === 0) {
    await expect(page.getByText("No eligible records", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nothing currently clears every gate." })).toBeVisible();
  } else {
    await expect(page.getByText("Minimum deposit").first()).toBeVisible();
    const reviewLink = page.getByRole("link", { name: /Read (full )?review/i }).first();
    await expect(reviewLink).toBeVisible();
    await expect(reviewLink).toHaveAttribute("href", /^\/casino\//);
    await expect(page.getByText("DEMONSTRATION DATA", { exact: true }).first()).toBeVisible();
    const activeCard = page.getByTestId("best-offer-product-card");
    const cardText = await activeCard.innerText();
    expect(cardText).toMatch(/wagering/i);
    expect(cardText).toContain("The review remains available while commercial action is unavailable.");
  }
});

test("Best Offers exposes all three handoff picks without hiding ranking evidence", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  const featured = page.getByTestId("best-offer-product-card");
  test.skip(await featured.count() === 0, "No eligible shortlist records in this isolated environment");
  const alternatives = page.getByTestId("ranked-offer-card");
  await expect(featured).toBeVisible();
  await expect(alternatives).toHaveCount(2);
  await expect(alternatives.first()).toBeVisible();
  await expect(featured).toContainText("DEMONSTRATION DATA");
  await expect(page.getByText("Compensation does not determine Editor Score or natural editorial ranking.", { exact: false }).first()).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});

test("Best Offers static handoff picks expose keyboard-accessible review routes", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  test.skip(await page.getByTestId("best-offer-product-card").count() === 0, "No eligible shortlist records in this isolated environment");
  const cards = page.locator('[data-testid="best-offer-product-card"], [data-testid="ranked-offer-card"]');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    const link = card.getByRole("link", { name: /Read (full )?review/i });
    await expect(link).toHaveCount(1);
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute("href", /^\/casino\//);
  }
  expect(await page.locator('[data-runtime-renderer="best-offers"] a[href^="http"]').count()).toBe(0);
});

test("bonus filters remain URL-authoritative and server rendered", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  const form = page.locator('form[action="/bonuses"]').first();
  await form.getByLabel("Country preference").selectOption("GB");
  await form.getByLabel("Bonus type").selectOption("WELCOME");
  await expect(page).toHaveURL(/country=GB/);
  await expect(page).toHaveURL(/type=WELCOME/);
  await page.goto(`${baseUrl}/bonuses?country=GB&type=WELCOME&sort=lowest-wagering`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/sort=lowest-wagering/);
  await expect(page.getByRole("button", { name: "Show Results" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Clear all" })).toHaveCount(1);
  await expect(page.getByText("Active filters")).toBeVisible();
});

test("offer pages have no horizontal overflow at desktop and mobile widths", async ({ browser }) => {
  for (const width of [1440, 430, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 }, isMobile: width <= 430 });
    for (const path of ["/best-offers", "/bonuses?country=GB&sort=lowest-deposit"]) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      expect(response?.status(), `${path} at ${width}px`).toBe(200);
      if (path === "/best-offers" && width <= 390 && await page.getByTestId("ranked-offer-card").count() > 0) {
        await expect(page.getByTestId("ranked-offer-card").first()).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false);
    }
    await page.close();
  }
});

test("bonus HTML remains useful without JavaScript", async ({ request }) => {
  const response = await request.get(`${baseUrl}/bonuses?country=GB&type=WELCOME`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('method="get"');
  expect(html).toContain("Active filters");
  expect(html).toContain("All bonuses");
});

test("Best Offers HTML remains useful without JavaScript and keeps empty/demo schema truthful", async ({ request }) => {
  const response = await request.get(`${baseUrl}/best-offers`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<span>Three picks.</span><em>Not thirty.</em>");
  expect(html).toMatch(/No eligible records|DEMONSTRATION DATA/);
  expect(html).not.toContain('"@type":"Offer"');
  if (html.includes("DEMONSTRATION DATA")) {
    expect(html).not.toContain('"@type":"ItemList"');
  } else {
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"numberOfItems":0');
  }
  expect(html).not.toMatch(/<a[^>]+href="\/r\//);
});
