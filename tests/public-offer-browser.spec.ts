import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("best offers is server rendered and fails closed before any governed action", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /The shortlist/ })).toBeVisible();
  expect(await page.locator('a[href^="http"]').count()).toBe(0);
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  const products = page.getByTestId("best-offer-product-card");
  const count = await products.count();
  if (count === 0) {
    await expect(page.getByText("No eligible records", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nothing currently clears every gate." })).toBeVisible();
  } else {
    await expect(page.getByText("Min deposit").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View full terms" }).first()).toBeVisible();
    await expect(page.getByText("DEMONSTRATION DATA", { exact: true }).first()).toBeVisible();
    const activeCard = page.getByRole("region", { name: "Best offer selectors" }).locator('[aria-hidden="false"] [data-testid="best-offer-product-card"]');
    const cardText = await activeCard.innerText();
    expect(cardText.indexOf("Wagering")).toBeLessThan(cardText.indexOf("View full terms"));
  }
});

test("Best Offers exposes all ranked records as an accessible comparison", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  const cards = page.getByTestId("ranked-offer-card");
  test.skip(await cards.count() === 0, "No eligible shortlist records in this isolated environment");
  const summary = page.locator("details").getByText(/Compare all \d+/, { exact: true });
  await summary.click();
  await expect(cards.first()).toBeVisible();
  await expect(cards.first()).toContainText("Why it ranks");
  await expect(cards.first()).toContainText("Commission is not a ranking input");
  await expect(cards.first()).toContainText("DEMONSTRATION DATA");
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});

test("Best Offers carousel and fit tabs are keyboard accessible", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  test.skip(await page.getByTestId("best-offer-product-card").count() === 0, "No eligible shortlist records in this isolated environment");
  const carousel = page.getByRole("region", { name: "Best offer selectors" });
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(carousel.locator('[aria-hidden="false"] [data-testid="best-offer-product-card"]')).toContainText("Lower wagering");
  await page.getByRole("tab", { name: "2 Lower wagering" }).click();
  await expect(page.getByRole("tabpanel").getByText("A smaller headline with a lighter play-through requirement.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "3 Faster payout signal" }).click();
  await expect(page.getByRole("tabpanel").getByText("A clearer, faster published withdrawal signal beside the bonus terms.", { exact: true })).toBeVisible();
  expect(await page.locator('a[href^="http"]').count()).toBe(0);
});

test("bonus filters remain URL-authoritative and server rendered", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  const form = page.locator('form[action="/bonuses"]').first();
  await form.getByLabel("Country preference").selectOption("GB");
  await form.getByLabel("Bonus type").selectOption("WELCOME");
  await form.getByLabel("Sort results").selectOption("lowest-wagering");
  await form.getByRole("button", { name: "Show Results" }).click();
  await expect(page).toHaveURL(/country=GB/);
  await expect(page).toHaveURL(/type=WELCOME/);
  await expect(page).toHaveURL(/sort=lowest-wagering/);
  await expect(page.getByText("Active filters")).toBeVisible();
});

test("offer pages have no horizontal overflow at desktop and mobile widths", async ({ browser }) => {
  for (const width of [1440, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 }, isMobile: width <= 390 });
    for (const path of ["/best-offers", "/bonuses?country=GB&sort=lowest-deposit"]) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      expect(response?.status(), `${path} at ${width}px`).toBe(200);
      if (path === "/best-offers" && width <= 390 && await page.getByTestId("ranked-offer-card").count() > 0) {
        const comparison = page.locator("details").getByText(/Compare all \d+/, { exact: true });
        await comparison.click();
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
  expect(html).toContain("Full comparison results");
});

test("Best Offers HTML remains useful without JavaScript and keeps empty/demo schema truthful", async ({ request }) => {
  const response = await request.get(`${baseUrl}/best-offers`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<span>The shortlist</span><em>that survives the small print.</em>");
  expect(html).toMatch(/No eligible records|DEMONSTRATION DATA/);
  expect(html).not.toContain('"@type":"Offer"');
  if (html.includes("DEMONSTRATION DATA")) {
    expect(html).not.toContain('"@type":"ItemList"');
  } else {
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"numberOfItems":0');
  }
  expect(html).not.toMatch(/<a[^>]+href="https?:\/\//);
  expect(html).not.toMatch(/<a[^>]+href="\/r\//);
});
