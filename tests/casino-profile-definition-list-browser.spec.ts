import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("German profile fact labels and values never intersect", async ({ browser }) => {
  const viewports = [
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    const page = await browser.newPage({ reducedMotion: "reduce", viewport });
    const response = await page.goto(`${baseUrl}/de-de/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewport.width}px response`).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
    await page.evaluate(() => document.fonts.ready);

    const factRows = await page.locator("#overview dl > div").evaluateAll((rows) => {
      const intersectionArea = (first: DOMRect, second: DOMRect) => {
        const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
        const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
        return width * height;
      };
      const rangeFor = (element: Element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range;
      };

      return rows.map((row) => {
        const label = row.querySelector<HTMLElement>("dt")!;
        const value = row.querySelector<HTMLElement>("dd")!;
        const labelRange = rangeFor(label);
        const valueRange = rangeFor(value);
        const labelRects = Array.from(labelRange.getClientRects()).filter((rect) => rect.width > 0.5 && rect.height > 0.5);
        const valueRects = Array.from(valueRange.getClientRects()).filter((rect) => rect.width > 0.5 && rect.height > 0.5);

        return {
          elementIntersection: intersectionArea(label.getBoundingClientRect(), value.getBoundingClientRect()),
          label: label.textContent?.trim(),
          rangeBoundingBoxIntersection: intersectionArea(labelRange.getBoundingClientRect(), valueRange.getBoundingClientRect()),
          rangeIntersection: labelRects.reduce((total, labelRect) => (
            total + valueRects.reduce((rowTotal, valueRect) => rowTotal + intersectionArea(labelRect, valueRect), 0)
          ), 0),
          value: value.textContent?.trim(),
        };
      });
    });

    expect(factRows.map(({ label }) => label), `${viewport.width}px fact labels`).toContain("Gründungsjahr");
    for (const row of factRows) {
      const description = `${viewport.width}px ${row.label} / ${row.value}`;
      expect(row.elementIntersection, `${description} element boxes`).toBe(0);
      expect(row.rangeBoundingBoxIntersection, `${description} text bounds`).toBe(0);
      expect(row.rangeIntersection, `${description} text fragments`).toBe(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${viewport.width}px horizontal overflow`).toBe(0);
    await page.close();
  }
});
