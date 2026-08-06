import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("best offers is server rendered with material terms before governed actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Best offers/ })).toBeVisible();
  await expect(page.getByText(/Material term/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Read full review" }).first()).toBeVisible();
  for (const action of await page.getByRole("link", { name: "View demo action" }).all()) await expect(action).toHaveAttribute("href", /^\/r\/demo-/);
});

test("bonus filters remain URL-authoritative and server rendered", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  await page.getByLabel("Country").selectOption("GB");
  await page.getByLabel("Bonus type").selectOption("WELCOME");
  await page.getByLabel("Sort").selectOption("lowest-wagering");
  await page.getByRole("button", { name: "Apply filters" }).click();
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
  expect(html).toContain("Full filtered results");
});
