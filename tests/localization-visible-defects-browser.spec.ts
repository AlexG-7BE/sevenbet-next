import { expect, test, type Locator } from "@playwright/test";

import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";

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

async function expectScrollableControlRail(root: Locator, controlSelector: string, expectedCount: number) {
  await expect(root).toBeVisible();
  const controls = root.locator(controlSelector);
  await expect(controls).toHaveCount(expectedCount);
  const heights = await controls.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);

  await controls.last().scrollIntoViewIfNeeded();
  const lastControl = await controls.last().evaluate((control) => {
    const bounds = control.getBoundingClientRect();
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      left: bounds.left,
      right: bounds.right,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  expect(lastControl.left).toBeGreaterThanOrEqual(-1);
  expect(lastControl.right).toBeLessThanOrEqual(lastControl.viewportWidth + 1);
  expect(lastControl.documentOverflow).toBe(0);
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

async function expectAuthoredWordsStayWhole(
  elements: Locator,
  context: string,
  expectedOverflowWrap: "normal" | "anywhere" = "normal",
) {
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
    expect(["none", "manual"], `${context}: automatic hyphenation`).toContain(item.hyphens);
    expect(item.overflowWrap, `${context}: emergency fragmentation`).toBe(expectedOverflowWrap);
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

test("localized mobile tab rails and focused profile navigation stay bounded", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  await expectScrollableControlRail(page.getByRole("tablist", { name: messages.bonuses.directoryTitle }), "button", 5);
  await expect(page.locator("[data-commercial-bonus-card]")).toHaveCount(8);
  await expect(page.locator("[data-commercial-bonus-card] figure, [data-commercial-bonus-card] img")).toHaveCount(0);

  await page.goto(`${baseUrl}/de/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  await expectScrollableControlRail(page.getByRole("tablist", { name: messages.casinos.directoryTitle }), "button", 3);
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);

  await page.goto(`${baseUrl}/de/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  await expectWrappedControlContainment(page.getByRole("navigation", { name: messages.profile.relatedTitle }), "a");
});

test("localized bonus facts stay bounded and omit payout evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(`${baseUrl}/fi/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const messages = productPageMessages("fi-FI");
  const cards = page.locator("[data-commercial-bonus-card]");
  await expect(cards).toHaveCount(8);
  const facts = cards.locator("dl");
  await expect(facts).toHaveCount(8);
  const labels = await facts.locator("dt").allTextContents();
  expect(labels).not.toContain(messages.common.payout);
  const geometry = await facts.evaluateAll((lists) => lists.map((list) => {
    const card = list.closest("article")!.getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    return {
      card: { left: card.left, right: card.right },
      factCount: list.children.length,
      left: bounds.left,
      right: bounds.right,
      valueOverflows: Array.from(list.querySelectorAll("dd"), (value) => value.scrollWidth - value.clientWidth),
    };
  }));
  for (const list of geometry) {
    expect(list.factCount).toBe(3);
    expect(list.left).toBeGreaterThanOrEqual(list.card.left - 1);
    expect(list.right).toBeLessThanOrEqual(list.card.right + 1);
    for (const overflow of list.valueOverflows) expect(overflow).toBeLessThanOrEqual(1);
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
        expectedOverflowWrap: "anywhere",
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
    ] as const;

    for (const surface of cases) {
      await page.setViewportSize(surface.viewport);
      const response = await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), surface.context).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expectAuthoredWordsStayWhole(
        page.locator(surface.selector),
        surface.context,
        "expectedOverflowWrap" in surface ? surface.expectedOverflowWrap : "normal",
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${surface.context}: document overflow`).toBe(0);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const focusedBonusResponse = await page.goto(`${baseUrl}/nb/bonuses?visualFixture=true`, { waitUntil: "domcontentloaded" });
    expect(focusedBonusResponse?.status(), "NO focused bonus directory at 390x844").toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-commercial-bonus-card]")).toHaveCount(8);
    await expect(page.getByRole("tab", { name: commercialUxMessages("nb-NO").lowWagering, exact: true })).toBeVisible();
    await expectAuthoredWordsStayWhole(page.locator("main h1"), "NO focused bonus heading at 390x844", "anywhere");
    await expectAuthoredWordsStayWhole(page.locator("[data-commercial-bonus-card] h2"), "NO focused bonus card headings at 390x844");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      "NO focused bonus directory at 390x844: document overflow",
    ).toBe(0);

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
    const response = await page.goto(`${baseUrl}/pt/bonuses?visualFixture=true`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-commercial-bonus-card]")).toHaveCount(8);
    await expectAuthoredWordsStayWhole(page.locator("main h1"), "PT focused Bonuses heading at 390x844", "anywhere");
    await expectAuthoredWordsStayWhole(
      page.locator("[data-commercial-bonus-card] h2"),
      "PT focused Bonuses card headings at 390x844",
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
    const terms = mobilePage.locator("[data-commercial-bonus-card] dl").first();
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
    const facts = desktopPage.locator("[data-commercial-bonus-card] dl");
    await expect(facts.first()).toBeVisible();
    await expectAuthoredWordsStayWhole(facts.locator("dt"), "DE Bonuses desktop fact labels");
    const widths = await facts.evaluateAll((lists) => lists.map((list) => list.getBoundingClientRect().width));
    expect(Math.min(...widths), "desktop fact lane width").toBeGreaterThanOrEqual(300);
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

test("legacy bonus filters stay retired while localized casino name search remains focused", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  let response = await page.goto(`${baseUrl}/de/bonuses?payment=localization-visual-no-match&featured=false&recommended=true&visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-commercial-bonus-card]")).toHaveCount(8);
  await expect(page.getByRole("tab")).toHaveCount(5);
  await expect(page.locator('[data-active-filter-state="bonuses"], #bonus-filter-dialog, select[name="sort"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  const copy = commercialUxMessages("fi-FI");
  response = await page.goto(`${baseUrl}/fi/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const search = page.getByRole("searchbox", { name: copy.searchCasinos });
  await search.fill("localization-visual-no-match");
  const results = page.locator('#casino-collection-results[role="tabpanel"]');
  await expect(results).toContainText(copy.noSearchResults);
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(0);
  await search.fill("");
  await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("localized mobile bonus view rails expose five touch-safe intents", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["es", "sv"]) {
    const response = await page.goto(`${baseUrl}/${route}/bonuses?crypto=false&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), route).toBe(200);
    const rail = page.getByRole("tablist");
    await expectScrollableControlRail(rail, "button", 5);
    await expect(page.locator('button[aria-controls="bonus-filter-dialog"], #bonus-filter-dialog, select[name="sort"]')).toHaveCount(0);
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

test("legacy casino page parameters do not fragment the focused collection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/casinos?page=2&visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const results = page.locator('#casino-collection-results[role="tabpanel"]');
  await expect(results).toBeVisible();
  const cards = results.locator("[data-commercial-casino-card]");
  await expect(cards).toHaveCount(10);
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(page.locator("[data-directory-pagination]")).toHaveCount(0);
  await expect(results.locator('a[href^="/r/"]')).toHaveCount(0);
  for (const card of await cards.all()) await expect(card.locator("dl > div")).toHaveCount(3);
  await expect(page.getByRole("note")).toContainText(messages.common.demoData);
});

test("casino fixture review controls resolve only the matching localized Solvane profile", async ({ page, request }) => {
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const cards = page.locator("[data-commercial-casino-card]");
  await expect(cards).toHaveCount(10);
  const first = cards.first();
  const reviewLinks = first.locator('a[href*="/casino/"]');
  await expect(reviewLinks).toHaveCount(1);
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
    await expect(reviewLinks).toHaveCount(1);
    await expect(reviewLinks).toHaveAttribute("href", expectedHref);
    await reviewLinks.first().click();
    await page.waitForURL(`${baseUrl}${expectedHref}`);
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toContainText("Solvane Casino");
  }
});

test("localized demo editorial declares fixture origin and keeps its single identity logo decorative", async ({ page }) => {
  const messages = productPageMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const profile = page.locator('[data-runtime-renderer="casino-review"]');
  const identityLogo = profile.locator('section[aria-labelledby="casino-profile-title"] [class*="logo"] img');
  await expect(identityLogo).toHaveCount(1);
  await expect(identityLogo).toHaveAttribute("alt", "");
  await expect(profile.locator("figure, video, [class*='heroMedia'], [data-content-origin]")).toHaveCount(0);
  await expect(profile).toContainText(messages.profile.demoDisclosure);
  await expect(profile).not.toContainText(messages.profile.originalEditorialNotice);
});

test("legacy comparison parameters retain the localized focused collection and stay action-free", async ({ page }) => {
  for (const { country, locale, route } of [
    { country: "DE", locale: "de-DE", route: "de" },
    { country: "FI", locale: "fi-FI", route: "fi" },
  ] as const) {
    const messages = productPageMessages(locale);
    const copy = commercialUxMessages(locale);
    const response = await page.goto(`${baseUrl}/${route}/casinos?casino=demo-northstar&casino=demo-summit&country=${country}&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    await expect(page.locator('[data-runtime-renderer="casinos"]')).toBeVisible();
    await expect(page.locator('[data-runtime-renderer="contextual-comparison"], [data-comparison-tray], [data-comparison-toggle]')).toHaveCount(0);
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
    await expect(page.getByRole("searchbox", { name: copy.searchCasinos })).toBeVisible();
    await expect(page.getByRole("tab", { name: copy.topRated, exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: copy.fastPayouts, exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: copy.lowDeposit, exact: true })).toBeVisible();
    await expect(page.getByRole("note")).toContainText(messages.common.demoData);
    await expect(page.locator('main a[href^="/r/"], main a[href^="/outbound/"]')).toHaveCount(0);
  }
});

test("legacy bonus page and sort parameters do not split the focused directory", async ({ page }) => {
  for (const { locale, route } of [
    { locale: "de-DE", route: "de" },
    { locale: "fi-FI", route: "fi" },
  ] as const) {
    const messages = productPageMessages(locale);
    const response = await page.goto(`${baseUrl}/${route}/bonuses?page=2&sort=editorial&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const cards = page.locator("[data-commercial-bonus-card]");
    await expect(cards).toHaveCount(8);
    await expect(page.getByRole("tab")).toHaveCount(5);
    for (const card of await cards.all()) await expect(card.locator("dl > div")).toHaveCount(3);
    await expect(page.locator('main a[href^="/r/"], main a[href^="/outbound/"]')).toHaveCount(0);
    await expect(page.locator("[data-directory-pagination]")).toHaveCount(0);
    await expect(page.getByRole("note")).toContainText(messages.common.demoData);
  }
});

test("legacy filter values do not reintroduce retired facets into localized commercial views", async ({ page }) => {
  for (const { locale, route } of [
    { locale: "de-DE", route: "de" },
    { locale: "fi-FI", route: "fi" },
  ] as const) {
    const copy = commercialUxMessages(locale);
    let response = await page.goto(`${baseUrl}/${route}/bonuses?type=WELCOME&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("tab", { name: copy.all, exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: copy.welcome, exact: true })).toBeVisible();
    await expect(page.locator("[data-commercial-bonus-card]")).toHaveCount(8);
    await expect(page.locator('select[name="type"], [data-active-filter-state="bonuses"], #bonus-filter-dialog')).toHaveCount(0);

    response = await page.goto(`${baseUrl}/${route}/casinos?bonusType=WELCOME&visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("tab", { name: copy.topRated, exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: copy.fastPayouts, exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: copy.lowDeposit, exact: true })).toBeVisible();
    await expect(page.locator("[data-commercial-casino-card]")).toHaveCount(10);
    await expect(page.locator('select[name="bonusType"], [data-active-filter-state="casinos"], #casino-all-filters-dialog')).toHaveCount(0);
  }
});
