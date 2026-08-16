import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function clearComparison(page: import("@playwright/test").Page) {
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.removeItem("b4gamble:public-comparison:v1"));
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
}

test("legacy Compare route permanently consolidates into the casino directory", async ({ page, request }) => {
  const response = await request.get(`${baseUrl}/compare?casino=demo-northstar&casino=demo-summit&country=GB`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/casinos?casino=demo-northstar&casino=demo-summit&country=GB");

  await page.goto(`${baseUrl}/compare?casino=demo-northstar&casino=demo-summit&country=GB`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/casinos\?casino=demo-northstar&casino=demo-summit&country=GB/);
  await expect(page.getByRole("heading", { name: "See the differences." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Compare", exact: true })).toHaveCount(0);
});

test("comparison stays contextual and opens automatically on the second selection", async ({ page }) => {
  await clearComparison(page);
  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  await expect(page.getByRole("complementary", { name: "Casino comparison tray" })).toContainText("1 of 3 selected");
  await expect(page.getByRole("heading", { name: "See the differences." })).not.toBeVisible();

  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "See the differences." })).toBeVisible();
  await expect(page.getByText("2 of 3 selected")).toBeVisible();
  await expect(page).toHaveURL(/casino=[a-z0-9-]+.*casino=[a-z0-9-]+/);
  await expect(page.getByText("Published evidence, side by side. No fabricated winner.")).toBeVisible();
  await expect(page.getByText("Country is a comparison preference, not proof of eligibility.")).toBeVisible();
});

test("selection is capped at three, removable, clearable and session-persistent", async ({ page }) => {
  await clearComparison(page);
  for (let index = 0; index < 2; index += 1) await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  await page.getByRole("button", { name: "Close comparison" }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  await expect(page.getByText("3 of 3 selected")).toBeVisible();

  const selectedBefore = await page.evaluate(() => JSON.parse(sessionStorage.getItem("b4gamble:public-comparison:v1") || "[]"));
  expect(selectedBefore).toHaveLength(3);
  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  const selectedAfter = await page.evaluate(() => JSON.parse(sessionStorage.getItem("b4gamble:public-comparison:v1") || "[]"));
  expect(selectedAfter).toEqual(selectedBefore);
  expect(Object.keys(await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage))))).toEqual(["b4gamble:public-comparison:v1"]);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("3 of 3 selected")).toBeVisible();
  await expect(page.getByRole("heading", { name: "See the differences." })).toBeVisible();
  await page.getByRole("button", { name: "Remove", exact: true }).first().click();
  await expect(page.getByText("2 of 3 selected")).toBeVisible();
  await page.getByRole("button", { name: "Close comparison" }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByRole("complementary", { name: "Casino comparison tray" })).toHaveCount(0);
  await expect(page).not.toHaveURL(/casino=/);
});

test("comparison projection is private, no-store, noindex and validates slugs", async ({ request }) => {
  const available = await request.get(`${baseUrl}/api/public/comparison?casino=demo-northstar&casino=demo-summit&country=GB`);
  expect(available.status()).toBe(200);
  expect(available.headers()["cache-control"]).toContain("private, no-store");
  expect(available.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  const body = await available.json();
  expect(body.selectedSlugs).toEqual(["demo-northstar", "demo-summit"]);
  expect(JSON.stringify(body)).not.toMatch(/destinationUrl|trackingUrl|email|programme/i);

  const malformed = await request.get(`${baseUrl}/api/public/comparison?casino=..%2Funsafe&casino=demo-northstar&country=GBR`);
  expect(malformed.status()).toBe(200);
  expect((await malformed.json()).selectedSlugs).toEqual(["demo-northstar"]);
});

test("desktop modal and mobile sheet avoid page-level horizontal overflow", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width <= 430 });
    await page.goto(`${baseUrl}/casinos?casino=demo-northstar&casino=demo-summit&country=GB`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "See the differences." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(true);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
    await page.close();
  }
});
