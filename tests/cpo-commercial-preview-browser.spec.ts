import { expect, test } from "@playwright/test";

async function noHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

test("the decision route reaches an internal terminal in one click", async ({ page }) => {
  await page.goto("/best-casinos", { waitUntil: "networkidle" });
  await expect(page.getByText("PREVIEW ONLY", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-golden-section="number-one"] article')).toHaveCount(1);
  await expect(page.locator('[data-golden-section="alternatives"] article')).toHaveCount(2);
  const first = page.locator('[data-golden-section="number-one"] article');
  await expect(first.getByRole("link", { name: /Visit Casino/ })).toBeVisible();
  await expect(first.getByRole("link", { name: "Read full review" })).toBeVisible();
  await expect(first.getByRole("link", { name: "Compare" })).toBeVisible();
  await first.getByRole("link", { name: /Visit Casino/ }).click();
  await expect(page).toHaveURL(/\/preview\/outbound\//);
  await expect(page.getByRole("heading", { name: "No external visit occurred." })).toBeVisible();
});

test("Variant B and the Founder comparison hub preserve the Top 3 decision path", async ({ page }) => {
  await page.goto("/preview/cpo-commercial-v3", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /Open Variant A/ })).toHaveAttribute("href", "/best-casinos");
  await expect(page.getByRole("link", { name: /Open Variant B/ })).toHaveAttribute("href", "/best-casinos-roulette");

  await page.getByRole("link", { name: /Open Variant B/ }).click();
  await expect(page).toHaveURL(/\/best-casinos-roulette$/);
  await expect(page.locator('[data-commercial-variant="roulette"]')).toHaveCount(1);
  await expect(page.locator('[data-golden-section="number-one"] article')).toHaveCount(1);
  await expect(page.locator('[data-golden-section="alternatives"] article')).toHaveCount(2);
  const first = page.locator('[data-golden-section="number-one"] article');
  await expect(first.getByRole("link", { name: /Visit Casino/ })).toBeVisible();
  await expect(first.getByRole("link", { name: "Read full review" })).toBeVisible();
  await expect(first.getByRole("link", { name: "Compare" })).toBeVisible();
});

test("key commercial and protected surfaces remain usable at review widths", async ({ page }) => {
  for (const width of [390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    const response = await page.goto("/best-casinos", { waitUntil: "domcontentloaded" });
    expect(response?.status(), `/best-casinos at ${width}px`).toBeLessThan(400);
    await noHorizontalOverflow(page);
  }

  for (const width of [390, 430, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const path of ["/best-casinos-roulette", "/preview/cpo-commercial-v3"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} at ${width}px`).toBeLessThan(400);
      await noHorizontalOverflow(page);
    }
  }

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const path of ["/bonuses", "/casinos", "/learn", "/help", "/preview/cpo-commercial-v2"]) {
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
  test.setTimeout(120_000);
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

    if (path === "/best-casinos") {
      for (const section of ["hero", "number-one", "alternatives", "evidence-research"] as const) {
        await page.locator(`[data-golden-section="${section}"]`).screenshot({ path: `/tmp/cpo-${label}-${section}.png` });
      }
    }
  }

  for (const [label, width, height, path] of [
    ["variant-a-1440-full", 1440, 1000, "/best-casinos"],
    ["variant-a-430-first", 430, 932, "/best-casinos"],
    ["variant-b-1440-full", 1440, 1000, "/best-casinos-roulette"],
    ["variant-b-430-full", 430, 932, "/best-casinos-roulette"],
    ["variant-b-390-full", 390, 844, "/best-casinos-roulette"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.screenshot({ fullPage: true, path: `/tmp/cpo-${label}.png` });
    if (label === "variant-b-1440-full") {
      await page.locator('[data-golden-section="hero"]').screenshot({ path: "/tmp/cpo-variant-b-1440-hero.png" });
      await page.locator('[data-golden-section="number-one"]').screenshot({ path: "/tmp/cpo-variant-b-1440-number-one.png" });
      await page.locator('[data-golden-section="alternatives"]').screenshot({ path: "/tmp/cpo-variant-b-1440-alternatives.png" });
      await page.locator('[data-public-shell="footer"]').screenshot({ path: "/tmp/cpo-variant-b-1440-footer.png" });
    }
    if (label === "variant-b-430-full") {
      await page.screenshot({ clip: { x: 0, y: 0, width: 430, height: 932 }, path: "/tmp/cpo-variant-b-430-first.png" });
    }
  }
});
