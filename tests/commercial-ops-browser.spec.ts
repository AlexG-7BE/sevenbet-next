import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("Commercial Admin routes remain protected", async ({ request }) => {
  const page = await request.get(`${baseUrl}/admin/commercial`, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(page.status());
  expect(page.headers().location).toContain("/admin/login");

  const api = await request.get(`${baseUrl}/api/admin/commercial/opportunities`);
  expect(api.status()).toBe(401);
});

test("Commercial routes are not exposed through public navigation", async ({ page }) => {
  await page.goto(baseUrl);
  await expect(page.locator('body > header a[href^="/admin/commercial"], body > footer a[href^="/admin/commercial"]')).toHaveCount(0);
});
