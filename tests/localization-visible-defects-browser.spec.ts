import { expect, test, type Locator } from "@playwright/test";

import { demoProfileCopy } from "../lib/i18n/demo-profile-catalog";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { visualFixtureCopy } from "../lib/i18n/visual-fixture-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function expectWrappedControlContainment(root: Locator, controlSelector: string) {
  await expect(root).toBeVisible();
  const geometry = await root.evaluate((element, selector) => {
    const container = element.getBoundingClientRect();
    return {
      container: { left: container.left, right: container.right },
      controls: Array.from(element.querySelectorAll(selector), (control) => {
        const bounds = control.getBoundingClientRect();
        return { height: bounds.height, left: bounds.left, right: bounds.right };
      }),
      overflow: element.scrollWidth - element.clientWidth,
    };
  }, controlSelector);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.controls.length).toBeGreaterThan(0);
  for (const control of geometry.controls) {
    expect(control.left).toBeGreaterThanOrEqual(geometry.container.left - 1);
    expect(control.right).toBeLessThanOrEqual(geometry.container.right + 1);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
}

async function expectResponsiveErrorGeometry(page: import("@playwright/test").Page) {
  const error = page.locator("[data-public-commercial-error]");
  await expect(error).toBeVisible();
  const findings = await error.evaluate((root) => {
    const controls = Array.from(root.querySelectorAll<HTMLElement>("a, button")).filter((control) => {
      const rect = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const boxes = controls.map((control) => {
      const rect = control.getBoundingClientRect();
      return { bottom: rect.bottom, height: rect.height, left: rect.left, right: rect.right, top: rect.top };
    });
    const overlaps = boxes.flatMap((box, index) => boxes.slice(index + 1).flatMap((other, offset) => (
      Math.min(box.right, other.right) - Math.max(box.left, other.left) > 1
      && Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top) > 1
        ? [[index, index + offset + 1]]
        : []
    )));
    const clippedText = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, p, a, button")).flatMap((element) => {
      if (element.clientWidth <= 0 || element.clientHeight <= 0) return [];
      const range = document.createRange();
      range.selectNodeContents(element);
      const textRects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
      if (!textRects.length) return [];
      const bounds = {
        bottom: Math.max(...textRects.map((rect) => rect.bottom)),
        left: Math.min(...textRects.map((rect) => rect.left)),
        right: Math.max(...textRects.map((rect) => rect.right)),
        top: Math.min(...textRects.map((rect) => rect.top)),
      };
      const hiddenOverflow = new Set(["auto", "clip", "hidden", "scroll"]);
      for (let clipper: HTMLElement | null = element; clipper && root.contains(clipper); clipper = clipper.parentElement) {
        const style = getComputedStyle(clipper);
        const clipsX = hiddenOverflow.has(style.overflowX);
        const clipsY = hiddenOverflow.has(style.overflowY);
        if (!clipsX && !clipsY) continue;
        const rect = clipper.getBoundingClientRect();
        if ((clipsX && (bounds.left < rect.left - 1 || bounds.right > rect.right + 1))
          || (clipsY && (bounds.top < rect.top - 1 || bounds.bottom > rect.bottom + 1))) {
          return [element.textContent?.trim() ?? element.tagName];
        }
      }
      return [];
    });
    const header = document.querySelector<HTMLElement>("[data-public-shell='header']");
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
    const headerContrast = (() => {
      if (!header) return ["missing public header"];
      const brand = header.querySelector<HTMLElement>("a");
      if (!brand) return ["missing public brand"];
      const parseColor = (value: string) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return channels.length >= 3 ? { red: channels[0], green: channels[1], blue: channels[2], alpha: channels[3] ?? 1 } : null;
      };
      const luminance = ({ red, green, blue }: { red: number; green: number; blue: number }) => {
        const channel = (value: number) => {
          const normalized = value / 255;
          return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
        };
        return .2126 * channel(red) + .7152 * channel(green) + .0722 * channel(blue);
      };
      const headerColor = parseColor(getComputedStyle(brand).color);
      const headerBackground = parseColor(getComputedStyle(header).backgroundColor);
      if (!headerColor || !headerBackground || headerBackground.alpha < .8) return ["header lacks an opaque contrast surface"];
      const lighter = Math.max(luminance(headerColor), luminance(headerBackground));
      const darker = Math.min(luminance(headerColor), luminance(headerBackground));
      return (lighter + .05) / (darker + .05) >= 3 ? [] : ["public brand/header contrast below 3:1"];
    })();
    const headerOverlap = Array.from(root.querySelectorAll<HTMLElement>("[role='alert'] h1, [role='alert'] h2, [role='alert'] h3, [role='alert'] p, [role='alert'] a, [role='alert'] button"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < headerBottom - 1;
      })
      .map((element) => element.textContent?.trim() ?? element.tagName);
    return {
      clippedText,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      headerContrast,
      headerOverlap,
      outsideViewport: boxes.filter((box) => box.left < -1 || box.right > window.innerWidth + 1),
      overlaps,
      undersized: boxes.filter((box) => box.height < 44),
    };
  });
  expect(findings).toEqual({ clippedText: [], documentOverflow: 0, headerContrast: [], headerOverlap: [], outsideViewport: [], overlaps: [], undersized: [] });
}

async function expectAuthoredWordsStayWhole(elements: Locator, context: string) {
  await expect(elements.first(), `${context}: representative element`).toBeVisible();
  const report = await elements.evaluateAll((nodes) => nodes.map((element) => {
    const style = getComputedStyle(element);
    const fragments: Array<{ lines: number; word: string }> = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.textContent ?? "";
      for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
        if (match[0].length < 4 || match.index === undefined) continue;
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const lines = new Set(Array.from(range.getClientRects())
          .filter((rect) => rect.width > .5 && rect.height > .5)
          .map((rect) => Math.round(rect.top * 2) / 2)).size;
        if (lines > 1) fragments.push({ lines, word: match[0] });
      }
      node = walker.nextNode();
    }
    const bounds = element.getBoundingClientRect();
    const textRange = document.createRange();
    textRange.selectNodeContents(element);
    const textRects = Array.from(textRange.getClientRects())
      .filter((rect) => rect.width > .5 && rect.height > .5)
      .map((rect) => ({ left: rect.left, right: rect.right }));
    return {
      bounds: { left: bounds.left, right: bounds.right },
      fragments,
      hyphens: style.hyphens,
      overflowWrap: style.overflowWrap,
      textRects,
      wordBreak: style.wordBreak,
    };
  }));

  const viewportWidth = await elements.first().evaluate(() => document.documentElement.clientWidth);
  expect(report.length, `${context}: element count`).toBeGreaterThan(0);
  for (const item of report) {
    expect(item.fragments, `${context}: mid-word line fragments`).toEqual([]);
    expect(item.bounds.left, `${context}: viewport left`).toBeGreaterThanOrEqual(-1);
    expect(item.bounds.right, `${context}: viewport right`).toBeLessThanOrEqual(viewportWidth + 1);
    for (const rect of item.textRects) {
      expect(rect.left, `${context}: rendered text left`).toBeGreaterThanOrEqual(Math.max(-1, item.bounds.left - 1));
      expect(rect.right, `${context}: rendered text right`).toBeLessThanOrEqual(Math.min(viewportWidth + 1, item.bounds.right + 1));
    }
    expect(item.hyphens, `${context}: automatic hyphenation`).toBe("none");
    expect(item.overflowWrap, `${context}: emergency fragmentation`).toBe("normal");
    expect(item.wordBreak, `${context}: word-break policy`).toBe("normal");
  }
}

async function expectSemanticLongWordContainment(
  elements: Locator,
  context: string,
  requireLongWord = false,
  expectedOverflowWrap: "normal" | "break-word" = "normal",
) {
  await expect(elements.first(), `${context}: representative element`).toBeVisible();
  const report = await elements.evaluateAll((nodes) => nodes.map((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const shortWordFragments: string[] = [];
    const longWords: Array<{ rects: Array<{ left: number; right: number }>; word: string }> = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.textContent ?? "";
      for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
        if (match[0].length < 4 || match.index === undefined) continue;
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rects = Array.from(range.getClientRects())
          .filter((rect) => rect.width > .5 && rect.height > .5)
          .map((rect) => ({ left: rect.left, right: rect.right }));
        if (match[0].length < 14 && rects.length > 1) shortWordFragments.push(match[0]);
        if (match[0].length >= 14) longWords.push({ rects, word: match[0] });
      }
      node = walker.nextNode();
    }
    const textRange = document.createRange();
    textRange.selectNodeContents(element);
    const textRects = Array.from(textRange.getClientRects())
      .filter((rect) => rect.width > .5 && rect.height > .5)
      .map((rect) => ({ left: rect.left, right: rect.right }));
    return {
      bounds: { left: bounds.left, right: bounds.right },
      hyphenateLimitChars: style.getPropertyValue("hyphenate-limit-chars"),
      hyphens: style.hyphens,
      longWords,
      overflowWrap: style.overflowWrap,
      shortWordFragments,
      textRects,
      wordBreak: style.wordBreak,
    };
  }));

  const viewportWidth = await elements.first().evaluate(() => document.documentElement.clientWidth);
  expect(report.length, `${context}: element count`).toBeGreaterThan(0);
  for (const item of report) {
    expect(item.hyphens, `${context}: language-aware hyphenation`).toBe("auto");
    expect(item.hyphenateLimitChars, `${context}: short-word guard`).toContain("14");
    expect(item.overflowWrap, `${context}: emergency fragmentation`).toBe(expectedOverflowWrap);
    expect(item.wordBreak, `${context}: word-break policy`).toBe("normal");
    expect(item.shortWordFragments, `${context}: short authored words`).toEqual([]);
    if (requireLongWord) expect(item.longWords.length, `${context}: long-word exercise`).toBeGreaterThan(0);
    for (const rect of item.textRects) {
      expect(rect.left, `${context}: rendered text left`).toBeGreaterThanOrEqual(Math.max(-1, item.bounds.left - 1));
      expect(rect.right, `${context}: rendered text right`).toBeLessThanOrEqual(Math.min(viewportWidth + 1, item.bounds.right + 1));
    }
  }
}

async function expectNativeArticleHeroSeparation(page: import("@playwright/test").Page, context: string) {
  const heroGrid = page.locator("[data-learning-article]:not([data-handoff-article]) > header > nav + div");
  await expect(heroGrid.locator("h1"), `${context}: title`).toBeVisible();
  await expect(heroGrid.locator(":scope > div:last-child"), `${context}: summary`).toBeVisible();
  const geometry = await heroGrid.evaluate((grid) => {
    const title = grid.querySelector("h1")!;
    const summary = grid.querySelector(":scope > div:last-child")!;
    const titleBox = title.getBoundingClientRect();
    const summaryBox = summary.getBoundingClientRect();
    const textRects = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Array.from(range.getClientRects())
        .filter((rect) => rect.width > .5 && rect.height > .5)
        .map((rect) => ({ bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top }));
    };
    const rects = textRects(title);
    const summaryRects = textRects(summary);
    const titleText = {
      bottom: Math.max(...rects.map((rect) => rect.bottom)),
      left: Math.min(...rects.map((rect) => rect.left)),
      right: Math.max(...rects.map((rect) => rect.right)),
      top: Math.min(...rects.map((rect) => rect.top)),
    };
    const summaryText = {
      bottom: Math.max(...summaryRects.map((rect) => rect.bottom)),
      left: Math.min(...summaryRects.map((rect) => rect.left)),
      right: Math.max(...summaryRects.map((rect) => rect.right)),
      top: Math.min(...summaryRects.map((rect) => rect.top)),
    };
    const rangeIntersections = rects.flatMap((titleRect, titleIndex) => summaryRects.flatMap((summaryRect, summaryIndex) => {
      const width = Math.max(0, Math.min(titleRect.right, summaryRect.right) - Math.max(titleRect.left, summaryRect.left));
      const height = Math.max(0, Math.min(titleRect.bottom, summaryRect.bottom) - Math.max(titleRect.top, summaryRect.top));
      return width > .5 && height > .5 ? [{ area: width * height, summaryIndex, titleIndex }] : [];
    }));
    const horizontalGap = summaryText.left - titleText.right;
    const verticalGap = summaryText.top - titleText.bottom;
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      rangeIntersections,
      separationGap: Math.max(horizontalGap, verticalGap),
      summary: { bottom: summaryBox.bottom, left: summaryBox.left, right: summaryBox.right, top: summaryBox.top },
      title: { bottom: titleBox.bottom, left: titleBox.left, right: titleBox.right, top: titleBox.top },
      titleText,
    };
  });

  expect(geometry.documentOverflow, `${context}: document overflow`).toBe(0);
  expect(geometry.rangeIntersections, `${context}: title/summary Range intersections`).toEqual([]);
  expect(geometry.separationGap, `${context}: title/summary separation`).toBeGreaterThanOrEqual(1);
}

test("localized mobile controls wrap while neutral global and composed copy stay bounded", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${baseUrl}/de/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const rail = page.locator('[data-selector-group="curated-bonuses"]');
  await expectWrappedControlContainment(rail, "button");

  const row = page.locator('article[class*="comparisonRow"]').first();
  const position = row.locator('[class*="compactPosition"]');
  await expect(position).toBeVisible();
  const [rowBox, positionBox] = await Promise.all([row.boundingBox(), position.boundingBox()]);
  expect(rowBox).not.toBeNull();
  expect(positionBox).not.toBeNull();
  expect(positionBox!.x).toBeGreaterThanOrEqual(rowBox!.x - 1);
  expect(positionBox!.y).toBeGreaterThanOrEqual(rowBox!.y - 1);
  expect(positionBox!.x + positionBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1);
  expect(positionBox!.y + positionBox!.height).toBeLessThanOrEqual(rowBox!.y + rowBox!.height + 1);

  const composed = page.locator('[data-media-state="presented"][data-media-mode="COMPOSED"][data-media-ratio="missing"][data-offer-media="bonus"]').first();
  await expect(composed).toBeVisible();
  await expect(composed.locator("strong").first()).toBeVisible();
  const composedGeometry = await composed.evaluate((element) => {
    const container = element.getBoundingClientRect();
    const children = Array.from(element.querySelectorAll("span, strong, small"));
    const bounds = children.map((child) => {
      const range = document.createRange();
      range.selectNodeContents(child);
      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
      return {
        bottom: Math.max(...rects.map((rect) => rect.bottom)),
        left: Math.min(...rects.map((rect) => rect.left)),
        right: Math.max(...rects.map((rect) => rect.right)),
        top: Math.min(...rects.map((rect) => rect.top)),
      };
    });
    return { container: { bottom: container.bottom, left: container.left, right: container.right, top: container.top }, bounds };
  });
  for (const bounds of composedGeometry.bounds) {
    expect(bounds.left).toBeGreaterThanOrEqual(composedGeometry.container.left - 1);
    expect(bounds.right).toBeLessThanOrEqual(composedGeometry.container.right + 1);
    expect(bounds.top).toBeGreaterThanOrEqual(composedGeometry.container.top - 1);
    expect(bounds.bottom).toBeLessThanOrEqual(composedGeometry.container.bottom + 1);
  }

  await page.goto(`${baseUrl}/de/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page.locator('[data-selector-group="curated-casinos"]')).toHaveCount(0);
  expect(await page.locator("#casino-results article").count()).toBeGreaterThan(0);

  await page.goto(`${baseUrl}/de/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  await expectWrappedControlContainment(page.locator("#editorial-review nav"), "a");
});

test("long localized payout evidence receives a readable desktop term row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(`${baseUrl}/fi/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const payoutRows = page.locator("[data-bonus-directory-card] [data-material-terms] > div:last-child");
  await expect(payoutRows).toHaveCount(4);
  const geometry = await payoutRows.evaluateAll((rows) => rows.map((row) => {
    const container = row.parentElement!.getBoundingClientRect();
    const bounds = row.getBoundingClientRect();
    const value = row.querySelector("dd")!;
    return {
      rowShare: bounds.width / container.width,
      valueOverflow: value.scrollWidth - value.clientWidth,
    };
  }));
  for (const row of geometry) {
    expect(row.rowShare).toBeGreaterThan(.75);
    expect(row.valueOverflow).toBeLessThanOrEqual(1);
  }
});

test("authored display copy wraps between words across long mobile and desktop locales", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  try {
    const cases = [
      {
        context: "DE 10 Steps eyebrow at 390x844",
        path: "/de/10-steps",
        selector: '[data-handoff-page="tenSteps"] [data-mob="copy"] > div:first-child > div:last-child',
        viewport: { width: 390, height: 844 },
      },
      {
        context: "DE Best Offers hero at 390x844",
        path: "/de/best-offers?visualFixture=true",
        selector: '[data-runtime-renderer="best-offers"] section[class*="hero"] h1',
        viewport: { width: 390, height: 844 },
      },
      {
        context: "IT Welcome Bonus article at 1440x900",
        path: "/it/learn/casino-bonuses/welcome-bonus-terms",
        selector: "[data-learning-article] header h1",
        viewport: { width: 1440, height: 900 },
      },
      {
        context: "DE responsible-gambling article at 390x844",
        path: "/de/learn/responsible-gambling/responsible-gambling-tools",
        selector: "[data-learning-article] header h1",
        viewport: { width: 390, height: 844 },
      },
      {
        context: "DE responsible-gambling article headings at 320x700",
        path: "/de/learn/responsible-gambling/responsible-gambling-tools",
        selector: "[data-learning-article] header h1, [data-learning-article] #direct-answer-title",
        viewport: { width: 320, height: 700 },
      },
      {
        context: "NO curated bonus empty state at 390x844",
        path: "/nb/bonuses?payment=localization-visual-no-match",
        selector: 'section[aria-labelledby="bonus-shortlist-title"] [role="status"] strong',
        viewport: { width: 390, height: 844 },
      },
    ] as const;

    for (const surface of cases) {
      await page.setViewportSize(surface.viewport);
      const response = await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), surface.context).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expectAuthoredWordsStayWhole(page.locator(surface.selector), surface.context);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${surface.context}: document overflow`).toBe(0);
    }

    const semanticCases = [
      {
        context: "PT country-guide article at 390x844",
        expectedOverflowWrap: "normal",
        path: "/pt/learn/country-guides/country-guide-structure",
        requireLongWord: false,
        selector: "[data-learning-article] header h1",
      },
    ] as const;

    await page.setViewportSize({ width: 390, height: 844 });
    for (const surface of semanticCases) {
      const response = await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), surface.context).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expectSemanticLongWordContainment(
        page.locator(surface.selector),
        surface.context,
        surface.requireLongWord,
        surface.expectedOverflowWrap,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${surface.context}: document overflow`).toBe(0);
    }
  } finally {
    await context.close();
  }
});

test("native localized article heroes keep title and summary in separate responsive lanes", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const surface of [
      {
        context: "DE Welcome Bonus Terms article at 390x844",
        path: "/de/learn/casino-bonuses/welcome-bonus-terms",
      },
      {
        context: "DE Casino Reviews article at 390x844",
        path: "/de/learn/casino-reviews/how-casino-reviews-work",
      },
      {
        context: "SE Casino Reviews article at 390x844",
        path: "/sv/learn/casino-reviews/how-casino-reviews-work",
      },
      {
        context: "DK Casino Reviews article at 390x844",
        path: "/da/learn/casino-reviews/how-casino-reviews-work",
      },
    ]) {
      const response = await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), surface.context).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expectAuthoredWordsStayWhole(
        page.locator("[data-learning-article]:not([data-handoff-article]) > header h1"),
        surface.context,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${surface.context}: document overflow`).toBe(0);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    for (const surface of [
      {
        context: "DE Responsible Gambling Tools article at 1440x900",
        path: "/de/learn/responsible-gambling/responsible-gambling-tools",
      },
      {
        context: "DE Casino Reviews article at 1440x900",
        path: "/de/learn/casino-reviews/how-casino-reviews-work",
      },
    ]) {
      const response = await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), surface.context).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expectAuthoredWordsStayWhole(
        page.locator("[data-learning-article]:not([data-handoff-article]) > header h1"),
        surface.context,
      );
      await expectNativeArticleHeroSeparation(page, surface.context);
    }
  } finally {
    await context.close();
  }
});

test("commercial error and empty-state display headings preserve authored words", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  try {
    const errorCases = [
      {
        context: "EN Best Offers error at 390x844",
        path: "/best-offers?errorFixture=public-commercial",
        selector: '[data-public-commercial-error="best-offers"] [role="alert"] h1',
        viewport: { width: 390, height: 844 },
      },
      {
        context: "IT Bonuses error at 1440x900",
        path: "/it/bonuses?errorFixture=public-commercial",
        selector: '[data-public-commercial-error="bonuses"] [role="alert"] h1',
        viewport: { width: 1440, height: 900 },
      },
    ] as const;

    for (const surface of errorCases) {
      await page.setViewportSize(surface.viewport);
      await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await expectAuthoredWordsStayWhole(page.locator(surface.selector), surface.context);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(`${baseUrl}/pt/bonuses?payment=localization-visual-no-match`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expectAuthoredWordsStayWhole(
      page.locator('[data-runtime-renderer="bonuses"] [role="status"] strong'),
      "PT curated Bonuses empty heading at 390x844",
    );
    await expectSemanticLongWordContainment(
      page.locator('[data-public-empty-state="filtered"] h2'),
      "PT directory Bonuses empty heading at 390x844",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  } finally {
    await context.close();
  }
});

test("localized offer facts recompose instead of fragmenting labels", async ({ browser }) => {
  const mobileContext = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  try {
    const response = await mobilePage.goto(`${baseUrl}/de/bonuses?visualFixture=true`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await mobilePage.evaluate(() => document.fonts.ready);
    const terms = mobilePage.locator('article[class*="comparisonRow"] [class*="compactTerms"]').first();
    await expectAuthoredWordsStayWhole(terms.locator("dt"), "DE Bonuses mobile fact labels");
    const rows = await terms.locator(":scope > div").evaluateAll((items) => items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    }));
    expect(rows.slice(1).every((row, index) => row.top >= rows[index].bottom - 1), "mobile term rows stack").toBe(true);
  } finally {
    await mobileContext.close();
  }

  const desktopContext = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  try {
    const response = await desktopPage.goto(`${baseUrl}/de/bonuses?visualFixture=true`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await desktopPage.evaluate(() => document.fonts.ready);
    const facts = desktopPage.locator('article[class*="comparisonRow"] [class*="compactTerms"]');
    await expect(facts.first()).toBeVisible();
    await expectAuthoredWordsStayWhole(facts.locator("dt"), "DE Bonuses desktop fact labels");
    const widths = await facts.evaluateAll((lists) => lists.map((list) => list.getBoundingClientRect().width));
    expect(Math.min(...widths), "desktop fact lane width").toBeGreaterThanOrEqual(350);
  } finally {
    await desktopContext.close();
  }
});

test("language-only protected safety headings wrap within their responsive grids", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  try {
    for (const width of [768, 1440]) {
      await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
      for (const language of ["de", "es", "el", "sv", "da"] as const) {
        const response = await page.goto(`${baseUrl}/${language}/help`, { waitUntil: "domcontentloaded" });
        expect(response?.status(), `${language} at ${width}px`).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        const headings = page.locator("main h1, main h2");
        expect(await headings.count()).toBeGreaterThan(0);
        const overflows = await headings.evaluateAll((elements) => elements.flatMap((element) => {
          const box = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
          const left = Math.min(...rects.map((rect) => rect.left));
          const right = Math.max(...rects.map((rect) => rect.right));
          return element.scrollWidth > element.clientWidth + 1 || left < box.left - 1 || right > box.right + 1
            ? [{ id: element.id, clientWidth: element.clientWidth, left, right, scrollWidth: element.scrollWidth }]
            : [];
        }));
        expect(overflows, `${language} safety headings at ${width}px`).toEqual([]);
      }
    }
  } finally {
    await context.close();
  }
});

test("localized commercial route errors resolve accepted and draft locale context safely", async ({ page }) => {
  test.setTimeout(120_000);
  const de = productPageMessages("de-DE");
  const es = productPageMessages("es-ES");
  const fi = productPageMessages("fi-FI");
  const nb = productPageMessages("nb-NO");
  const cases = [
    {
      key: "casinos", path: "/de/casinos", locale: "de-DE", heading: de.common.commercialUnavailable,
      links: [[de.common.reviewMethodology, "/de/methodology"], [de.common.protectedHelp, "/de/help"]],
    },
    {
      key: "best-offers", path: "/es/best-offers", locale: "es-ES", heading: es.bestOffers.unavailableTitleBody,
      links: [[es.common.browseReviews, "/es/casinos"]],
    },
    {
      key: "bonuses", path: "/fi/bonuses", locale: "fi-FI", heading: fi.bonuses.unavailableTitleBody,
      links: [[fi.common.bonusGuide, "/bonus-guide"]],
    },
    {
      key: "casino-profile", path: "/nb/casino/demo-plume", locale: "nb-NO", heading: nb.profile.unavailableTitle.replace(/\s*\|\s*B4GAMBLE$/, ""),
      links: [[nb.common.browseReviews, "/nb/casinos"], [nb.common.protectedHelp, "/help"]],
    },
  ] as const;

  for (const viewport of [{ width: 320, height: 700 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const surface of cases) {
      await page.goto(`${baseUrl}${surface.path}?errorFixture=public-commercial`, { waitUntil: "domcontentloaded" });
      const error = page.locator(`[data-public-commercial-error="${surface.key}"]`);
      await expect(error.getByRole("heading", { level: 1, name: surface.heading })).toBeVisible();
      await expect(error.getByRole("alert")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", surface.locale);
      await expect(error.getByRole("button")).toBeEnabled();
      for (const [label, href] of surface.links) {
        await expect(error.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
      }
      await expect(error).not.toContainText(/LOCALIZED_PUBLIC_COMMERCIAL_ERROR_HARNESS|digest|stack|database|provider/iu);
      await expectResponsiveErrorGeometry(page);
      await Promise.all([
        page.waitForURL((url) => !url.searchParams.has("errorFixture")),
        error.getByRole("button").click(),
      ]);
      await expect(page.locator("[data-public-commercial-error]")).toHaveCount(0);
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  }
});

test("localized filtered-empty states expose zero results, active filters, and a reset", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const de = productPageMessages("de-DE");
  let response = await page.goto(`${baseUrl}/de/bonuses?payment=localization-visual-no-match&featured=false&recommended=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const bonusEmpty = page.locator('[data-public-empty-state="filtered"][data-result-count="0"]');
  await expect(bonusEmpty).toBeVisible();
  await expect(bonusEmpty).toContainText(de.bonuses.noMatchesCopy);
  await expect(bonusEmpty.locator("[data-empty-reset]")).toHaveAttribute("href", "/de/bonuses");
  const bonusFilters = page.locator('[data-active-filter-state="bonuses"]');
  await expect(bonusFilters).toContainText("localization-visual-no-match");
  await expect(bonusFilters.getByRole("link", { name: `${de.comparison.remove} ${de.bonuses.featuredFalse}`, exact: true })).toBeVisible();
  await expect(bonusFilters.getByRole("link", { name: `${de.comparison.remove} ${de.bonuses.recommendedTrue}`, exact: true })).toBeVisible();
  await expect(page.locator('button[aria-controls="bonus-filter-dialog"]')).toHaveAccessibleName(`${de.common.filters} (3)`);
  await expect(bonusFilters.locator("[data-empty-reset]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  const fi = productPageMessages("fi-FI");
  response = await page.goto(`${baseUrl}/fi/casinos?q=localization-visual-no-match`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const casinoEmpty = page.locator('[data-public-empty-state="filtered"][data-result-count="0"]');
  await expect(casinoEmpty).toBeVisible();
  await expect(casinoEmpty).toContainText(fi.casinos.noMatchesCopy);
  await expect(casinoEmpty.locator("[data-empty-reset]")).toHaveAttribute("href", "/fi/casinos");
  const casinoFilters = page.locator('[data-active-filter-state="casinos"]');
  await expect(casinoFilters).toContainText("localization-visual-no-match");
  await expect(casinoFilters.locator("[data-empty-reset]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("localized mobile bonus-filter footers clear the final sort control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["es", "sv"]) {
    const response = await page.goto(`${baseUrl}/${route}/bonuses?crypto=false&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), route).toBe(200);
    await page.locator('button[aria-controls="bonus-filter-dialog"]').click();

    const drawer = page.locator('#bonus-filter-dialog[open]');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('select[name="sort"]')).toBeVisible();
    await drawer.locator('select[name="sort"]').scrollIntoViewIfNeeded();
    await drawer.locator("form > div:last-of-type").scrollIntoViewIfNeeded();
    const geometry = await drawer.evaluate((dialog) => {
      const sort = dialog.querySelector<HTMLSelectElement>('select[name="sort"]')!;
      const footer = dialog.querySelector<HTMLElement>("form > div:last-of-type")!;
      const sortBox = sort.getBoundingClientRect();
      const footerBox = footer.getBoundingClientRect();
      return {
        footerBottom: footerBox.bottom,
        footerTop: footerBox.top,
        sortBottom: sortBox.bottom,
        viewportHeight: window.innerHeight,
      };
    });
    expect(geometry.footerTop - geometry.sortBottom, `${route}: sort/footer clearance`).toBeGreaterThanOrEqual(1);
    expect(geometry.footerBottom, `${route}: footer viewport containment`).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    await drawer.locator('button[aria-label]').click();
    await expect(drawer).not.toBeVisible();
  }
});

test("German Learning card titles use semantic compound-word wrapping at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${baseUrl}/de/learn`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);

  await expectSemanticLongWordContainment(
    page.locator('[data-handoff-page="learn"] a.scp2 > div:nth-child(2)'),
    "DE Learning featured guide titles at 390x844",
    true,
    "break-word",
  );
  await expectSemanticLongWordContainment(
    page.locator('[data-handoff-page="learn"] a.scp3 > div:first-child > div:nth-child(2)').filter({ hasText: "Anbieterbewertungen" }),
    "DE Learning directory guide titles at 390x844",
    true,
    "break-word",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("mobile outbound unavailable content clears the fixed public header", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(viewport);
    const response = await page.goto(`${baseUrl}/outbound/unavailable`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${viewport.width}x${viewport.height}`).toBe(200);

    const geometry = await page.locator('[data-commercial-handoff="unavailable"]').evaluate((surface) => {
      const header = document.querySelector<HTMLElement>('[data-public-shell="header"]')!;
      const card = surface.firstElementChild as HTMLElement;
      const eyebrow = card.querySelector<HTMLElement>("p")!;
      return {
        cardTop: card.getBoundingClientRect().top,
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        eyebrowTop: eyebrow.getBoundingClientRect().top,
        headerBottom: header.getBoundingClientRect().bottom,
      };
    });
    expect(geometry.cardTop, `${viewport.width}: card/header clearance`).toBeGreaterThanOrEqual(geometry.headerBottom + 8);
    expect(geometry.eyebrowTop, `${viewport.width}: eyebrow/header clearance`).toBeGreaterThan(geometry.headerBottom);
    expect(geometry.documentOverflow, `${viewport.width}: document overflow`).toBe(0);
  }
});

test("localized related-reading cards preserve ordinary short words at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/el/learn/country-guides/country-guide-structure",
    "/it/learn/casino-bonuses/welcome-bonus-terms",
    "/pt/learn/responsible-gambling/responsible-gambling-tools",
  ]) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expectSemanticLongWordContainment(
      page.locator('[data-learning-article]:not([data-handoff-article]) section[class*="related"] a'),
      `${route}: related-reading cards at 390x844`,
      false,
      "break-word",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), route).toBe(0);
  }
});

test("the deterministic casino fixture exposes a truthful second-page boundary", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/casinos?page=2&visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const results = page.locator('#casino-results[data-result-count="10"]');
  await expect(results).toBeVisible();
  const pagination = results.locator('[data-directory-pagination][data-current-page="2"][data-page-count="2"]');
  await expect(pagination).toBeVisible();
  await expect(pagination.getByRole("link", { name: messages.common.previous, exact: true })).toHaveAttribute("href", "/de/casinos?visualFixture=true");
  await expect(pagination.getByText(messages.common.pageOf.replace("{page}", "2").replace("{pages}", "2"), { exact: true })).toBeVisible();
  await expect(pagination.getByText(messages.common.next, { exact: true })).toHaveAttribute("aria-disabled", "true");
  const cards = results.locator("article");
  await expect(cards).toHaveCount(5);
  await expect(results.locator(`[aria-label="${messages.common.result} 6"]`)).toBeVisible();
  await expect(results.locator('a[href^="/r/"]')).toHaveCount(0);
  for (const card of await cards.all()) await expect(card).toContainText(messages.common.demoData);
});

test("casino fixture review controls resolve only the matching localized Solvane profile", async ({ page, request }) => {
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const cards = page.locator("#casino-results article");
  await expect(cards).toHaveCount(5);
  const first = cards.first();
  const reviewLinks = first.locator('a[href*="/casino/"]');
  await expect(reviewLinks).toHaveCount(2);
  for (const link of await reviewLinks.all()) await expect(link).toHaveAttribute("href", "/de/casino/demo-plume?visualFixture=true");
  for (const card of await cards.all().then((items) => items.slice(1))) await expect(card.locator('a[href*="/casino/"]')).toHaveCount(0);

  const destination = await request.get(`${baseUrl}/de/casino/demo-plume?visualFixture=true`);
  expect(destination.status()).toBe(200);
  await first.getByRole("link", { name: messages.common.viewDemonstration, exact: true }).click();
  await page.waitForURL(`${baseUrl}/de/casino/demo-plume?visualFixture=true`);
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toContainText("Solvane Casino");
});

test("bonus fixture review controls resolve only the matching localized Solvane profile", async ({ page }) => {
  test.setTimeout(120_000);
  const expectedHref = "/de/casino/demo-plume?visualFixture=true";
  for (const path of ["/de/bonuses?visualFixture=true"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const reviewLinks = page.locator('main a[href*="/casino/"]');
    expect(await reviewLinks.count()).toBeGreaterThan(0);
    for (const link of await reviewLinks.all()) await expect(link).toHaveAttribute("href", expectedHref);
    await reviewLinks.first().click();
    await page.waitForURL(`${baseUrl}${expectedHref}`);
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toContainText("Solvane Casino");
  }
});

test("localized demo editorial declares fixture origin and keeps only adjacent logos decorative", async ({ page }) => {
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const profile = page.locator('[data-runtime-renderer="casino-review"]');
  const identityLogo = profile.locator('[class*="identityRow"] [class*="logo"] img');
  await expect(identityLogo).toHaveAttribute("alt", "");
  await expect(profile.locator('[class*="heroMediaCanvas"] img')).not.toHaveAttribute("alt", "");
  expect(await profile.locator('[data-content-origin="localized-fixture"]').count()).toBeGreaterThan(0);
  await expect(profile.locator('[data-content-origin="source-controlled"]')).toHaveCount(0);
  await expect(profile).toContainText(messages.profile.demoDisclosure);
  await expect(profile).not.toContainText(messages.profile.originalEditorialNotice);
});

test("accepted and draft comparison fixtures use localized catalog copy and stay action-free", async ({ page }) => {
  for (const { country, locale, route } of [
    { country: "DE", locale: "de-DE", route: "de" },
    { country: "FI", locale: "fi-FI", route: "fi" },
  ] as const) {
    const messages = productPageMessages(locale);
    const copy = demoProfileCopy(locale);
    const response = await page.goto(`${baseUrl}/${route}/casinos?casino=demo-northstar&casino=demo-summit&country=${country}&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const comparison = page.locator('[data-runtime-renderer="contextual-comparison"]');
    await expect(comparison.getByRole("heading", { name: messages.comparison.title })).toBeVisible();
    await expect(comparison).toContainText(copy.summary);
    await expect(comparison).toContainText(copy.bonus.title);
    await expect(comparison).toContainText(copy.bankTransfer);
    await expect(comparison).toContainText(copy.responsibleGamblingTools[0]);
    await expect(comparison).toContainText(messages.common.demoData);
    const visible = await comparison.innerText();
    for (const genericEnglish of [
      "Fictional review fields for interface testing",
      "Deterministic local visual data",
      "Offer terms",
      "Minimum deposit",
      "Bank transfer",
      "Control tools",
      "Live casino",
      "VIP programme",
    ]) expect(visible, `${locale}: ${genericEnglish}`).not.toContain(genericEnglish);

    const results = page.locator('#casino-results[data-result-count="10"]');
    await expect(results.locator('[data-directory-pagination][data-current-page="1"]')).toBeVisible();
    await expect(results.locator("article")).toHaveCount(5);
    await expect(page.locator('main a[href^="/r/"], main a[href^="/outbound/"]')).toHaveCount(0);
  }
});

test("accepted and draft bonus fixtures preserve localized page-two navigation", async ({ page }) => {
  for (const { locale, route } of [
    { locale: "de-DE", route: "de" },
    { locale: "fi-FI", route: "fi" },
  ] as const) {
    const messages = productPageMessages(locale);
    const response = await page.goto(`${baseUrl}/${route}/bonuses?page=2&sort=editorial&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const cards = page.locator("[data-bonus-directory-card]");
    await expect(cards).toHaveCount(4);
    await expect(page.locator(`[aria-label="${messages.common.result} 5"]`)).toBeVisible();
    for (const card of await cards.all()) await expect(card).toContainText(messages.common.demoData);
    await expect(page.locator('main a[href^="/r/"], main a[href^="/outbound/"]')).toHaveCount(0);

    const pagination = page.locator('[data-directory-pagination][data-current-page="2"][data-page-count="2"]');
    await expect(pagination).toBeVisible();
    await expect(pagination.getByText(messages.common.pageOf.replace("{page}", "2").replace("{pages}", "2"), { exact: true })).toBeVisible();
    const previous = pagination.getByRole("link", { name: messages.common.previous, exact: true });
    const previousHref = await previous.getAttribute("href");
    expect(previousHref).not.toBeNull();
    const previousUrl = new URL(previousHref!, baseUrl);
    expect(previousUrl.pathname).toBe(`/${route}/bonuses`);
    expect(previousUrl.searchParams.get("page")).toBeNull();
    expect(previousUrl.searchParams.get("sort")).toBe("editorial");
    expect(previousUrl.searchParams.get("visualFixture")).toBe("true");
    await expect(pagination.getByText(messages.common.next, { exact: true })).toHaveAttribute("aria-disabled", "true");
  }
});

test("visual fixtures keep canonical filter values while presenting localized facet labels", async ({ page }) => {
  for (const { locale, route } of [
    { locale: "de-DE", route: "de" },
    { locale: "fi-FI", route: "fi" },
  ] as const) {
    const label = visualFixtureCopy(locale).welcomeBonusType;
    let response = await page.goto(`${baseUrl}/${route}/bonuses?type=WELCOME&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('select[name="type"] option[value="WELCOME"]').first()).toHaveText(new RegExp(label, "iu"));
    const bonusChip = page.locator('[data-active-filter-state="bonuses"]');
    await expect(bonusChip).toContainText(label);
    await expect(bonusChip).not.toContainText(/\bWELCOME\b/);

    response = await page.goto(`${baseUrl}/${route}/casinos?bonusType=WELCOME&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('select[name="bonusType"] option[value="WELCOME"]').first()).toHaveText(new RegExp(label, "iu"));
    const casinoChip = page.locator('[data-active-filter-state="casinos"]');
    await expect(casinoChip).toContainText(label);
    await expect(casinoChip).not.toContainText(/\bWELCOME\b/);
  }
});
