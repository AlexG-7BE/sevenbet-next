import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("best offers is server rendered with material terms before governed actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /The shortlist/ })).toBeVisible();
  await expect(page.getByText("Minimum deposit").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Read full review" }).first()).toBeVisible();
  expect(await page.locator('a[href^="http"]').count()).toBe(0);
  const activeCard = page.getByRole("region", { name: "Top three eligible offers" }).getByRole("article");
  const cardText = await activeCard.innerText();
  expect(cardText.indexOf("Minimum deposit")).toBeLessThan(cardText.indexOf("Review demo handoff"));
});

test("Best Offers carousel, tabs and outbound confirmation are keyboard accessible", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  const carousel = page.getByRole("region", { name: "Top three eligible offers" });
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("02 / 03")).toBeVisible();
  await page.getByRole("tab", { name: "Lower wagering" }).click();
  await expect(page.getByRole("tabpanel").getByText("Lowest published non-null wagering requirement in the current eligible shortlist.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Faster payout signal" }).click();
  await expect(page.getByRole("tabpanel").getByText("Fastest published withdrawal-time signal in the current eligible shortlist; this is not a payout guarantee.", { exact: true })).toBeVisible();

  const action = page.getByRole("button", { name: /Review demo handoff/ }).first();
  if (await action.count()) {
    await action.click();
    const dialog = page.getByRole("dialog", { name: "Before you continue." });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Keep comparing" })).toBeFocused();
    expect(await dialog.locator('a[href^="http"]').count()).toBe(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(action).toBeFocused();
  }
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
  expect(html).toContain("Illustrative pre-launch offer data.");
  expect(html).toContain('"@type":"ItemList"');
  expect(html).not.toContain('"@type":"Offer"');
  expect(html).not.toMatch(/<a[^>]+href="https?:\/\//);
});
