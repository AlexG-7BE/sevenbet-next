import { expect, test, type Locator, type Page } from "@playwright/test";

import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import {
  INITIAL_EUROPEAN_MARKET_PROFILES,
  publicMarketPath,
} from "../lib/market/registry";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

// Keep the Founder matrix literal: a later edit must not silently replace a
// height-sensitive case with a width-only approximation.
const FOUNDER_VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 480, height: 900 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 960 },
  { width: 1920, height: 1080 },
  { width: 390, height: 667 },
] as const;

const TEXT_CANDIDATES = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "button", "label", "legend", "summary",
  "li", "dt", "dd", "small", "strong", "em", "span",
  "[data-home-hero-kicker]",
  "[data-screen-label='Hero'] > div:first-child > div:last-child > div:first-child > div:nth-child(2)",
].join(",");

// Media and hidden content have no readable text. Horizontally scrollable UI is
// handled separately below: only content fully outside the current scrollport is
// skipped, so partially visible selector labels and table cells remain audited.
const INTENTIONAL_OVERFLOW_ALLOWLIST = [
  "[hidden]",
  "[aria-hidden='true']",
  "img",
  "picture",
  "video",
  "svg",
  "canvas",
  "[data-home-media]",
] as const;

type CriticalTextDefect = {
  clipper?: string;
  delta?: number;
  element: string;
  kind: "ANCESTOR_CLIP" | "SELF_HORIZONTAL_OVERFLOW" | "SELF_VERTICAL_CLIP";
  text: string;
};

function label(viewport: (typeof FOUNDER_VIEWPORTS)[number]) {
  return `${viewport.width}x${viewport.height}`;
}

async function waitForDocumentFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

async function waitForHomeLayout(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    let frames = 0;
    let previous = "";
    let stableFrames = 0;
    const sample = () => {
      frames += 1;
      const hero = document.querySelector('[data-screen-label="Hero"]');
      const elements = hero ? [hero, ...hero.querySelectorAll("[data-tphoto], h1, h1 + p, a[href*='/program']")] : [];
      const signature = JSON.stringify(elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return [rect.left, rect.top, rect.right, rect.bottom].map((value) => Math.round(value * 10) / 10);
      }));
      stableFrames = signature === previous ? stableFrames + 1 : 0;
      previous = signature;
      if (stableFrames >= 2 || frames >= 30) resolve();
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

async function gotoOk(page: Page, pathname: string) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
  expect(response?.status(), pathname).toBe(200);
  await waitForDocumentFonts(page);
}

async function criticalTextDefects(page: Page, rootSelectors: readonly string[]) {
  return page.evaluate(({ allowlist, roots, textCandidates }) => {
    const tolerance = 2;
    const hiddenOverflow = new Set(["hidden", "clip"]);
    const horizontalClippingOverflow = new Set(["auto", "clip", "hidden", "scroll"]);
    const allowed = (element: Element) => allowlist.some((selector) => element.matches(selector) || Boolean(element.closest(selector)));
    const describe = (element: Element) => {
      const html = element as HTMLElement;
      const id = html.id ? `#${html.id}` : "";
      const classes = typeof html.className === "string"
        ? html.className.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join("")
        : "";
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const textBounds = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
      if (!rects.length) return null;
      return {
        bottom: Math.max(...rects.map((rect) => rect.bottom)),
        left: Math.min(...rects.map((rect) => rect.left)),
        right: Math.max(...rects.map((rect) => rect.right)),
        top: Math.min(...rects.map((rect) => rect.top)),
      };
    };
    const visible = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0
        && rect.width > 0
        && rect.height > 0;
    };
    const isFullyOutsideHorizontalScrollport = (element: HTMLElement, bounds: {
      left: number;
      right: number;
    }) => {
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (!["auto", "scroll"].includes(style.overflowX) || ancestor.scrollWidth <= ancestor.clientWidth + tolerance) continue;
        const scrollport = ancestor.getBoundingClientRect();
        const visibleLeft = Math.max(0, scrollport.left);
        const visibleRight = Math.min(document.documentElement.clientWidth, scrollport.right);
        if (visibleRight <= visibleLeft) continue;
        return bounds.right <= visibleLeft + tolerance || bounds.left >= visibleRight - tolerance;
      }
      return false;
    };

    const candidates = new Set<HTMLElement>();
    for (const selector of roots) {
      for (const root of document.querySelectorAll<HTMLElement>(selector)) {
        if (root.matches(textCandidates)) candidates.add(root);
        for (const element of root.querySelectorAll<HTMLElement>(textCandidates)) candidates.add(element);
      }
    }

    const defects: Array<{
      clipper?: string;
      delta?: number;
      element: string;
      kind: "ANCESTOR_CLIP" | "SELF_HORIZONTAL_OVERFLOW" | "SELF_VERTICAL_CLIP";
      text: string;
    }> = [];
    for (const element of candidates) {
      if (!visible(element) || allowed(element)) continue;
      const text = element.innerText.replace(/\s+/g, " ").trim();
      if (!text) continue;
      const style = getComputedStyle(element);
      const elementLabel = describe(element);
      const bounds = textBounds(element);
      if (!bounds || isFullyOutsideHorizontalScrollport(element, bounds)) continue;
      const horizontalDelta = element.clientWidth > 0 ? element.scrollWidth - element.clientWidth : 0;
      if (horizontalDelta > tolerance) {
        defects.push({
          delta: Math.round(horizontalDelta * 10) / 10,
          element: elementLabel,
          kind: "SELF_HORIZONTAL_OVERFLOW",
          text: text.slice(0, 120),
        });
      }
      const verticalDelta = element.clientHeight > 0 ? element.scrollHeight - element.clientHeight : 0;
      if (verticalDelta > tolerance && hiddenOverflow.has(style.overflowY)) {
        defects.push({
          delta: Math.round(verticalDelta * 10) / 10,
          element: elementLabel,
          kind: "SELF_VERTICAL_CLIP",
          text: text.slice(0, 120),
        });
      }
      let ancestor: HTMLElement | null = element;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        const ancestorStyle = getComputedStyle(ancestor);
        const clipsX = horizontalClippingOverflow.has(ancestorStyle.overflowX);
        const clipsY = hiddenOverflow.has(ancestorStyle.overflowY);
        if ((clipsX || clipsY) && !allowed(ancestor)) {
          const clip = ancestor.getBoundingClientRect();
          const clipped = (clipsX && (bounds.left < clip.left - tolerance || bounds.right > clip.right + tolerance))
            || (clipsY && (bounds.top < clip.top - tolerance || bounds.bottom > clip.bottom + tolerance));
          if (clipped) {
            defects.push({
              clipper: describe(ancestor),
              element: elementLabel,
              kind: "ANCESTOR_CLIP",
              text: text.slice(0, 120),
            });
            break;
          }
        }
        ancestor = ancestor.parentElement;
      }
    }
    return defects;
  }, {
    allowlist: [...INTENTIONAL_OVERFLOW_ALLOWLIST],
    roots: [...rootSelectors],
    textCandidates: TEXT_CANDIDATES,
  }) as Promise<CriticalTextDefect[]>;
}

async function expectCriticalTextFits(page: Page, roots: readonly string[], context: string) {
  expect(await criticalTextDefects(page, roots), `${context}: clipped critical text`).toEqual([]);
}

async function expectNoDocumentOverflow(page: Page, context: string) {
  const report = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const offenders = documentWidth <= viewportWidth + 1 ? [] : Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ""),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          text: element.innerText?.replace(/\s+/g, " ").trim().slice(0, 80) ?? "",
        };
      })
      .filter(({ left, right }) => left < -1 || right > viewportWidth + 1)
      .slice(0, 8);
    return { documentWidth, offenders, viewportWidth };
  });
  expect(report.documentWidth, `${context}: document overflow ${JSON.stringify(report.offenders)}`)
    .toBeLessThanOrEqual(report.viewportWidth + 1);
}

type Box = { height: number; width: number; x: number; y: number };

function intersectionArea(first: Box, second: Box) {
  return Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x))
    * Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y));
}

async function expectTextDoesNotOverlap(page: Page, text: Locator, neighbour: Locator, context: string) {
  const neighbourHandle = await neighbour.elementHandle();
  expect(neighbourHandle, `${context}: neighbour`).not.toBeNull();
  if (!neighbourHandle) return;
  const overlap = await text.evaluate((element, neighbourElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const neighbourRect = (neighbourElement as Element).getBoundingClientRect();
    const intersections = Array.from(range.getClientRects()).map((rect) => (
      Math.max(0, Math.min(rect.right, neighbourRect.right) - Math.max(rect.left, neighbourRect.left))
      * Math.max(0, Math.min(rect.bottom, neighbourRect.bottom) - Math.max(rect.top, neighbourRect.top))
    ));
    return intersections.length ? Math.max(...intersections) : 0;
  }, neighbourHandle);
  expect(overlap, `${context}: text overlap area`).toBeLessThanOrEqual(1);
}

test("all eleven European Homes hold the hero contract at every exact Founder viewport", async ({ browser }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: FOUNDER_VIEWPORTS[0],
  });
  const page = await context.newPage();

  try {
    for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
      const pathname = publicMarketPath(profile, profile.defaultLocale);
      await gotoOk(page, pathname);
      await expect(page.locator("html")).toHaveAttribute("lang", profile.defaultLocale);
      await expect(page.locator('[data-screen-label="Hero"]')).toHaveCount(1);

      for (const viewport of FOUNDER_VIEWPORTS) {
        await page.setViewportSize(viewport);
        await waitForHomeLayout(page);
        const geometry = await page.locator('[data-screen-label="Hero"]').evaluate((hero) => {
          const stage = hero.firstElementChild as HTMLElement | null;
          const metadata = stage?.nextElementSibling as HTMLElement | null;
          const heading = stage?.querySelector<HTMLElement>("h1") ?? null;
          const kicker = hero.querySelector<HTMLElement>("[data-home-hero-kicker]")
            ?? heading?.previousElementSibling?.children.item(1) as HTMLElement | null;
          const body = heading?.nextElementSibling as HTMLElement | null;
          const cta = stage?.querySelector<HTMLAnchorElement>('a[href*="/program"]') ?? null;
          if (!stage || !metadata || !kicker || !heading || !body || !cta) return null;
          const rect = (element: Element) => {
            const value = element.getBoundingClientRect();
            return { bottom: value.bottom, height: value.height, left: value.left, right: value.right, top: value.top, width: value.width };
          };
          const textRects = (element: Element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return Array.from(range.getClientRects()).filter((value) => value.width > 0 && value.height > 0);
          };
          const photoQuad = (element: HTMLElement) => {
            const bounds = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
            const [originX = element.offsetWidth / 2, originY = element.offsetHeight / 2] = style.transformOrigin
              .split(/\s+/)
              .map((value) => Number.parseFloat(value));
            const transformed = [
              [0, 0],
              [element.offsetWidth, 0],
              [element.offsetWidth, element.offsetHeight],
              [0, element.offsetHeight],
            ].map(([x, y]) => ({
              x: matrix.a * (x - originX) + matrix.c * (y - originY) + matrix.e + originX,
              y: matrix.b * (x - originX) + matrix.d * (y - originY) + matrix.f + originY,
            }));
            const minimumX = Math.min(...transformed.map((point) => point.x));
            const minimumY = Math.min(...transformed.map((point) => point.y));
            return transformed.map((point) => ({
              x: bounds.left + point.x - minimumX,
              y: bounds.top + point.y - minimumY,
            }));
          };
          const clipPolygon = (
            polygon: Array<{ x: number; y: number }>,
            inside: (point: { x: number; y: number }) => boolean,
            intersect: (from: { x: number; y: number }, to: { x: number; y: number }) => { x: number; y: number },
          ) => polygon.flatMap((point, index) => {
            const previous = polygon[(index + polygon.length - 1) % polygon.length];
            const pointInside = inside(point);
            const previousInside = inside(previous);
            if (pointInside && previousInside) return [point];
            if (pointInside) return [intersect(previous, point), point];
            if (previousInside) return [intersect(previous, point)];
            return [];
          });
          const polygonRectIntersectionArea = (polygon: Array<{ x: number; y: number }>, bounds: DOMRect) => {
            const vertical = (boundary: number) => (from: { x: number; y: number }, to: { x: number; y: number }) => {
              const ratio = (boundary - from.x) / (to.x - from.x);
              return { x: boundary, y: from.y + (to.y - from.y) * ratio };
            };
            const horizontal = (boundary: number) => (from: { x: number; y: number }, to: { x: number; y: number }) => {
              const ratio = (boundary - from.y) / (to.y - from.y);
              return { x: from.x + (to.x - from.x) * ratio, y: boundary };
            };
            let clipped = clipPolygon(polygon, (point) => point.x >= bounds.left, vertical(bounds.left));
            clipped = clipPolygon(clipped, (point) => point.x <= bounds.right, vertical(bounds.right));
            clipped = clipPolygon(clipped, (point) => point.y >= bounds.top, horizontal(bounds.top));
            clipped = clipPolygon(clipped, (point) => point.y <= bounds.bottom, horizontal(bounds.bottom));
            return clipped.length < 3 ? 0 : Math.abs(clipped.reduce((area, point, index) => {
              const next = clipped[(index + 1) % clipped.length];
              return area + point.x * next.y - next.x * point.y;
            }, 0)) / 2;
          };
          const copyRects = [kicker, heading, body, cta].flatMap(textRects);
          const photos = Array.from(stage.querySelectorAll<HTMLElement>("[data-tphoto]"))
            .filter((photo) => getComputedStyle(photo).display !== "none")
            .map(photoQuad);
          return {
            body: rect(body),
            cta: rect(cta),
            heading: rect(heading),
            hero: rect(hero),
            kicker: rect(kicker),
            metadata: rect(metadata),
            photoTextIntersections: photos.flatMap((photo) => copyRects.map((copy) => polygonRectIntersectionArea(photo, copy))),
            viewportWidth: document.documentElement.clientWidth,
          };
        });

        const at = `${profile.defaultLocale} Home ${label(viewport)}`;
        expect(geometry, `${at}: hero structure`).not.toBeNull();
        if (!geometry) continue;
        for (const [name, rect] of [
          ["kicker", geometry.kicker],
          ["heading", geometry.heading],
          ["body", geometry.body],
          ["CTA", geometry.cta],
          ["metadata", geometry.metadata],
        ] as const) {
          expect(rect.left, `${at}: ${name} left`).toBeGreaterThanOrEqual(-1);
          expect(rect.right, `${at}: ${name} right`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
          expect(rect.width, `${at}: ${name} width`).toBeGreaterThan(0);
          expect(rect.height, `${at}: ${name} height`).toBeGreaterThan(0);
        }
        expect(geometry.heading.top - geometry.kicker.bottom, `${at}: kicker -> heading`).toBeGreaterThanOrEqual(-1);
        expect(geometry.body.top - geometry.heading.bottom, `${at}: heading -> body`).toBeGreaterThanOrEqual(-1);
        expect(geometry.cta.top - geometry.body.bottom, `${at}: body -> CTA`).toBeGreaterThanOrEqual(-1);
        expect(geometry.metadata.top - geometry.cta.bottom, `${at}: CTA -> metadata`).toBeGreaterThanOrEqual(-1);
        expect(geometry.metadata.bottom, `${at}: metadata inside hero`).toBeLessThanOrEqual(geometry.hero.bottom + 1);
        expect(Math.max(0, ...geometry.photoTextIntersections), `${at}: photo/copy overlap`).toBeLessThanOrEqual(1);
        await expectCriticalTextFits(page, ['[data-screen-label="Hero"]'], at);
        await expectNoDocumentOverflow(page, at);
      }
    }
  } finally {
    await context.close();
  }
});

test("reported localized critical surfaces have unclipped, non-overlapping content", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  try {
    await gotoOk(page, "/de/responsible-gambling");
    const safetyHeading = page.locator("main h1").first();
    const safetyLead = page.locator("main h1 + p").first();
    await expect(safetyHeading).toBeVisible();
    await expect(safetyLead).toBeVisible();
    await expectTextDoesNotOverlap(page, safetyHeading, safetyLead, "DE Responsible Gambling heading/lead");
    await expectCriticalTextFits(page, [
      "main h1",
      "main h1 + p",
    ], "DE Responsible Gambling mobile hero");
    await expectNoDocumentOverflow(page, "DE Responsible Gambling 390x844");

    await gotoOk(page, "/de/bonuses?payment=localization-visual-no-match");
    const emptyBonus = page.locator('[data-public-empty-state="filtered"][data-result-count="0"]');
    await expect(emptyBonus).toBeVisible();
    const emptyBonusHeading = emptyBonus.locator("h2");
    await expect(emptyBonusHeading).toBeVisible();
    await expect(emptyBonusHeading).not.toContainText("{market}");
    const activeBonusFilters = page.locator('[data-active-filter-state="bonuses"]');
    await expect(activeBonusFilters).toContainText("localization-visual-no-match");
    await expect(emptyBonus.locator("[data-empty-reset]")).toHaveAttribute("href", "/de/bonuses");
    await expect(activeBonusFilters.locator("[data-empty-reset]")).toHaveCount(0);
    await expectCriticalTextFits(page, ['[data-runtime-renderer="bonuses"] h2'], "DE Bonuses empty heading 390x844");
    await expectNoDocumentOverflow(page, "DE Bonuses empty state 390x844");

    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoOk(page, "/de/learn/responsible-gambling/responsible-gambling-tools");
    const articleHeading = page.locator('[data-learning-article] header h1');
    const articleSummary = page.locator('[data-learning-article] header [class*="heroSummary"]');
    await expect(articleHeading).toBeVisible();
    await expect(articleSummary).toBeVisible();
    await expectTextDoesNotOverlap(page, articleHeading, articleSummary, "DE Learning article title/summary");
    await expectCriticalTextFits(page, [
      '[data-learning-article] header h1',
      '[data-learning-article] header [class*="heroSummary"]',
    ], "DE Learning article desktop hero");
    await expectNoDocumentOverflow(page, "DE Learning article 1440x900");
  } finally {
    await context.close();
  }
});

test("Spanish empty-state actions remain visually distinct", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await gotoOk(page, "/es/best-offers");
    const messages = productPageMessages("es-ES");
    const methodology = page.getByRole("link", { name: messages.common.reviewMethodology, exact: true });
    const reviews = page.getByRole("link", { name: messages.common.browseReviews, exact: true });
    await expect(methodology).toBeVisible();
    await expect(reviews).toBeVisible();
    const [first, second] = await Promise.all([methodology.boundingBox(), reviews.boundingBox()]);
    expect(first, "methodology action bounds").not.toBeNull();
    expect(second, "reviews action bounds").not.toBeNull();
    if (first && second) {
      expect(intersectionArea(first, second), "ES Best Offers action overlap").toBe(0);
      const rowsOverlap = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y) > 1;
      const gap = rowsOverlap
        ? Math.max(second.x - (first.x + first.width), first.x - (second.x + second.width))
        : Math.max(second.y - (first.y + first.height), first.y - (second.y + second.height));
      expect(gap, `ES Best Offers ${rowsOverlap ? "horizontal" : "vertical"} action gap`).toBeGreaterThanOrEqual(rowsOverlap ? 12 : 8);
    }
    await expectCriticalTextFits(page, ['[data-runtime-renderer="best-offers"] #shortlist'], "ES Best Offers empty state");
    await expectNoDocumentOverflow(page, "ES Best Offers 390x844");
  } finally {
    await context.close();
  }
});

test("German global profile localizes system UI while remaining information-only", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await gotoOk(page, "/de/casinos");
    const profileHref = await page.locator('main a[href^="/de/casino/"]').first().getAttribute("href");
    expect(profileHref, "published global profile").not.toBeNull();
    await gotoOk(page, profileHref ?? "/de/casino/missing");
    await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
    const systemUi = await page.locator([
      "[data-casino-decision-bar] > div",
      "#overview > [class*='sectionHeading']",
      "#offer-evidence > [class*='sectionHeading']",
      "#verdict > div:first-child > p",
      "#verdict-heading",
      "#faq > [class*='sectionHeading']",
      "[class*='relatedLinks']",
    ].join(",")).allInnerTexts();
    expect(systemUi.join("\n"), "localized profile system UI").not.toMatch(/\b(?:Why|Demonstration)\b/);
    const messages = productPageMessages("de-DE");
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toContainText(messages.common.reviewAvailableNoAction);
    await expect(page.locator('[data-runtime-renderer="casino-review"] a[href^="/r/"]')).toHaveCount(0);
    await expectCriticalTextFits(page, [
      "[data-casino-decision-bar]",
      "#overview > [class*='sectionHeading']",
      "#offer-evidence > [class*='sectionHeading']",
      "#verdict > div:first-child",
      "#faq > [class*='sectionHeading']",
      "[class*='relatedLinks']",
    ], "DE demo profile system UI");
    await expectNoDocumentOverflow(page, "DE demo profile 390x844");
  } finally {
    await context.close();
  }
});

test("Canada architecture-only direct paths never enter localized rendering", async ({ request }) => {
  for (const pathname of ["/ca/", "/ca/fr/", "/ca/casinos", "/ca/fr/casinos"] as const) {
    const response = await request.get(`${baseUrl}${pathname}`, { maxRedirects: 0 });
    expect(response.status(), pathname).toBe(404);
    expect(response.headers()["content-language"], `${pathname}: no localized middleware context`).toBeUndefined();
    const html = await response.text();
    expect(html, `${pathname}: no CA html language`).not.toMatch(/<html[^>]+lang=["'](?:en|fr)-CA["']/i);
    expect(html, `${pathname}: no localized public renderer`).not.toMatch(/data-(?:handoff-page|runtime-renderer)=["'](?:home|casino-discovery)["']/i);
  }
});
