import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("best offers is server rendered with material terms before governed actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /The shortlist/ })).toBeVisible();
  await expect(page.getByText("Min deposit").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "View full terms" }).first()).toBeVisible();
  expect(await page.locator('a[href^="http"]').count()).toBe(0);
  const activeCard = page.getByRole("region", { name: "Best offer selectors" }).locator('[aria-hidden="false"] [data-testid="best-offer-product-card"]');
  const cardText = await activeCard.innerText();
  expect(cardText.indexOf("Wagering")).toBeLessThan(cardText.indexOf("View full terms"));
  await expect(page.getByText("Compare all 12", { exact: true })).toBeVisible();
  expect(await page.getByTestId("ranked-offer-card").count()).toBe(12);
});

test("Best Offers exposes all ranked records as an accessible comparison", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  await page.getByText("Compare all 12", { exact: true }).click();
  const cards = page.getByTestId("ranked-offer-card");
  await expect(cards.first()).toBeVisible();
  await expect(cards.first()).toContainText("Why it ranks");
  await expect(cards.first()).toContainText("Commission is not a ranking input");
  expect(await cards.count()).toBe(12);
});

test("Best Offers carousel and fit tabs are keyboard accessible", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
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

test("Best Offers HTML remains useful without JavaScript and has truthful ItemList metadata", async ({ request }) => {
  const response = await request.get(`${baseUrl}/best-offers`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("One headline. The full decision.");
  expect(html).toContain("Find your best fit.");
  expect(html).toContain("The full ranked field.");
  expect((html.match(/data-testid="ranked-offer-card"/g) ?? []).length).toBe(12);
  expect(html).toContain("Illustrative pre-launch offer data.");
  expect(html).toContain('"@type":"ItemList"');
  expect(html).not.toContain('"@type":"Offer"');
  expect(html).not.toMatch(/<a[^>]+href="https?:\/\//);
});
