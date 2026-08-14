import { expect, test } from "@playwright/test";

async function noHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

test("the decision route reaches an internal terminal in one click", async ({ page }) => {
  await page.goto("/best-casinos", { waitUntil: "networkidle" });
  await expect(page.getByText("PREVIEW ONLY", { exact: true }).first()).toBeVisible();
  await expect(page.locator("ol article")).toHaveCount(3);
  const first = page.locator("ol article").first();
  await expect(first.getByRole("link", { name: /Visit Casino/ })).toBeVisible();
  await expect(first.getByRole("link", { name: "Read full review" })).toBeVisible();
  await expect(first.getByRole("link", { name: "Compare" })).toBeVisible();
  await first.getByRole("link", { name: /Visit Casino/ }).click();
  await expect(page).toHaveURL(/\/preview\/outbound\//);
  await expect(page.getByRole("heading", { name: "No external visit occurred." })).toBeVisible();
});

test("key commercial and protected surfaces remain usable at review widths", async ({ page }) => {
  for (const width of [390, 430, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const path of ["/best-casinos", "/bonuses", "/casinos", "/learn", "/help", "/preview/cpo-commercial-v2"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBeLessThan(400);
      await noHorizontalOverflow(page);
    }
  }
});

test("Top Offers exposes a primary Preview action on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/bonuses#top-offers", { waitUntil: "networkidle" });
  await expect(page.getByText("Top 3 offers", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Offer" }).first()).toBeVisible();
});

test("capture CPO visual QA evidence", async ({ page }) => {
  for (const [label, width, height, path] of [
    ["best-casinos-1440", 1440, 1000, "/best-casinos"],
    ["best-casinos-430", 430, 932, "/best-casinos"],
    ["best-casinos-390", 390, 844, "/best-casinos"],
    ["bonuses-390", 390, 844, "/bonuses#top-offers"],
    ["review-hub-1440", 1440, 1000, "/preview/cpo-commercial-v2"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.screenshot({ fullPage: true, path: `/tmp/cpo-${label}.png` });
  }
});
