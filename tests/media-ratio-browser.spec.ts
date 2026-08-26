import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("curated casino fixtures preserve wide, landscape and square artwork", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430, reducedMotion: "reduce" });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casinos?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const frames = page.locator('[class*="mediaFrame"][data-media-ratio]');
    await expect(frames).toHaveCount(3);
    expect(await frames.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-media-ratio")))).toEqual([
      "wide-landscape",
      "landscape",
      "square",
    ]);
    expect(await frames.locator("img").evaluateAll((images) => images.map((image) => getComputedStyle(image).objectFit))).toEqual([
      "contain",
      "contain",
      "contain",
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await context.close();
  }
});

test("casino profile fixtures cover portrait, square, landscape and fallback states", async ({ page }) => {
  const fixtures = [
    ["demo-northstar", "portrait", true],
    ["demo-beacon", "square", true],
    ["demo-aurora", "wide-landscape", true],
    ["demo-canopy", "missing", false],
  ] as const;

  for (const [slug, ratio, hasImage] of fixtures) {
    const response = await page.goto(`${baseUrl}/casino/${slug}?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), slug).toBe(200);
    const stage = page.locator('[class*="heroMedia"][data-media-ratio]').first();
    await expect(stage, slug).toHaveAttribute("data-media-ratio", ratio);
    await expect(stage.locator("img"), slug).toHaveCount(hasImage ? 1 : 0);
    if (hasImage) expect(await stage.locator("img").evaluate((image) => getComputedStyle(image).objectFit), slug).toBe("contain");
    else await expect(stage.getByText("Suitable creative unavailable.")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), slug).toBe(0);
  }
});
