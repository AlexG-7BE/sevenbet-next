import { expect, test, type Page } from "@playwright/test";

// The two plain-text pages as a browser lays them out (Founder, 18 and 20 October 2026): the
// title starts below the fixed header with room to breathe, no colour band crosses the text, and
// nothing scrolls sideways — on a phone and on a laptop. The stylesheet contract behind it, and
// why it holds on both hosts at once, is tests/help-text-pages-layout.test.tsx.
//
// CI serves the main host, which serves these HELP routes too until phase 3. Point
// HELP_TEXT_PAGES_HELP_BASE_URL at a local help-host server (HELP_SITE_DEV_HOST=localhost
// npx next start -p 4176) to run the same checks there.
const hosts = [
  { name: "main host", base: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173" },
  ...(process.env.HELP_TEXT_PAGES_HELP_BASE_URL ? [{ name: "help host", base: process.env.HELP_TEXT_PAGES_HELP_BASE_URL }] : []),
];
const viewports = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
];
const paths = ["/en/who-runs-this", "/sv/who-runs-this", "/da/for-organisations"];

async function layout(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-public-shell="header"]')!.getBoundingClientRect();
    const root = document.querySelector('[data-runtime-renderer="help-text-page"]')!;
    const eyebrow = root.querySelector("header small")!.getBoundingClientRect();
    const title = root.querySelector("h1")!.getBoundingClientRect();
    const body = getComputedStyle(document.body);
    const before = getComputedStyle(document.body, "::before");
    return {
      headerPosition: getComputedStyle(document.querySelector('[data-public-shell="header"]')!).position,
      headerBottom: header.bottom,
      eyebrowTop: eyebrow.top,
      titleTop: title.top,
      bodyBackgroundImage: body.backgroundImage,
      bodyBackgroundColor: body.backgroundColor,
      gridLayer: before.display,
      pageBackgroundImage: getComputedStyle(root).backgroundImage,
      pageBackgroundColor: getComputedStyle(root).backgroundColor,
      sidewaysScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

for (const host of hosts) {
  for (const viewport of viewports) {
    test(`the text pages start below the header and carry no band across the text (${host.name}, ${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const path of paths) {
        const response = await page.goto(`${host.base}${path}`, { waitUntil: "domcontentloaded" });
        expect(response?.status(), path).toBe(200);
        const measured = await layout(page);
        expect(measured.headerPosition, path).toBe("fixed");
        // The first line of the page is in the clear, with at least 32px between it and the header.
        expect(measured.eyebrowTop - measured.headerBottom, `${path}: room between header and eyebrow`).toBeGreaterThanOrEqual(32);
        expect(measured.titleTop, `${path}: the title is below the header`).toBeGreaterThan(measured.headerBottom);
        // One even surface: the body's decorative gradients and grid are off, the page is the
        // night colour, and nothing behind the text can draw a seam.
        expect(measured.bodyBackgroundImage, path).toBe("none");
        expect(measured.gridLayer, path).toBe("none");
        expect(measured.pageBackgroundImage, path).toBe("none");
        expect(measured.pageBackgroundColor, path).toBe("rgb(16, 15, 15)");
        expect(measured.bodyBackgroundColor, path).toBe("rgb(16, 15, 15)");
        expect(measured.sidewaysScroll, `${path}: no sideways scroll`).toBeLessThanOrEqual(0);
      }
    });
  }
}

test("every other page keeps the decorative background", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${hosts[0].base}/en/contact`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const backgroundImage = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(backgroundImage).toContain("radial-gradient");
});
