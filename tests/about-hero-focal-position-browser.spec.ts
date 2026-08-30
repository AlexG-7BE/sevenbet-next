import { expect, test } from "@playwright/test";

import { INITIAL_EUROPEAN_MARKET_PROFILES, publicMarketPath } from "../lib/market/registry";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

const viewports = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`About keeps the editorial portrait focal point and whole-word title wrapping at ${viewport.width}px`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();

    try {
      for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
        const locale = profile.defaultLocale;
        const pathname = publicMarketPath(profile, locale, "/about");
        const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
        expect(response?.status(), pathname).toBe(200);
        await expect(page.locator("html"), pathname).toHaveAttribute("lang", locale);
        await page.evaluate(() => document.fonts.ready);

        const report = await page.locator('[data-about-section="hero"]').evaluate(async (hero) => {
          const style = getComputedStyle(hero);
          const heading = hero.querySelector("h1");
          if (!(heading instanceof HTMLElement)) throw new Error("About hero heading is missing");

          const image = new Image();
          image.src = "/home/hero-outcome.jpg";
          await image.decode();

          const heroRect = hero.getBoundingClientRect();
          const headingRange = document.createRange();
          headingRange.selectNodeContents(heading);
          const headingRects = Array.from(headingRange.getClientRects());
          const avoidableSplitWords: string[] = [];
          const splitWords: string[] = [];
          const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const value = node.textContent ?? "";
            for (const match of value.matchAll(/\S+/gu)) {
              if (match.index === undefined) continue;
              const wordRange = document.createRange();
              wordRange.setStart(node, match.index);
              wordRange.setEnd(node, match.index + match[0].length);
              if (wordRange.getClientRects().length < 2) continue;
              splitWords.push(match[0]);
              const textStyle = getComputedStyle(node.parentElement ?? heading);
              const probe = document.createElement("span");
              probe.textContent = match[0];
              Object.assign(probe.style, {
                fontFamily: textStyle.fontFamily,
                fontFeatureSettings: textStyle.fontFeatureSettings,
                fontKerning: textStyle.fontKerning,
                fontOpticalSizing: textStyle.fontOpticalSizing,
                fontSize: textStyle.fontSize,
                fontStretch: textStyle.fontStretch,
                fontStyle: textStyle.fontStyle,
                fontVariationSettings: textStyle.fontVariationSettings,
                fontWeight: textStyle.fontWeight,
                letterSpacing: textStyle.letterSpacing,
                position: "fixed",
                textTransform: textStyle.textTransform,
                visibility: "hidden",
                whiteSpace: "nowrap",
              });
              document.body.append(probe);
              const unbrokenWidth = probe.getBoundingClientRect().width;
              probe.remove();
              if (unbrokenWidth <= heading.clientWidth + 1) avoidableSplitWords.push(match[0]);
            }
          }
          const scale = Math.max(heroRect.width / image.naturalWidth, heroRect.height / image.naturalHeight);
          const renderedHeight = image.naturalHeight * scale;
          const positionY = Number.parseFloat(style.backgroundPositionY) / 100;
          const imageTop = (heroRect.height - renderedHeight) * positionY;

          // Stable landmarks in the approved 3648×5301 portrait source.
          const headTop = 320 * scale + imageTop;
          const faceCenter = 980 * scale + imageTop;
          const chin = 1660 * scale + imageTop;

          return {
            avoidableSplitWords,
            splitWords,
            backgroundImage: style.backgroundImage,
            backgroundPositionY: style.backgroundPositionY,
            backgroundSize: style.backgroundSize,
            chin,
            faceCenter,
            headTop,
            headingHyphens: getComputedStyle(heading).hyphens,
            headingHyphenateLimitChars: getComputedStyle(heading).hyphenateLimitChars,
            headingFontSize: Number.parseFloat(getComputedStyle(heading).fontSize),
            headingFontStretch: getComputedStyle(heading).fontStretch,
            headingLeft: Math.min(...headingRects.map((rect) => rect.left)),
            headingOverflow: heading.scrollWidth - heading.clientWidth,
            headingOverflowWrap: getComputedStyle(heading).overflowWrap,
            headingRight: Math.max(...headingRects.map((rect) => rect.right)),
            headingWordBreak: getComputedStyle(heading).wordBreak,
            documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            heroHeight: heroRect.height,
            viewportWidth: document.documentElement.clientWidth,
          };
        });

        expect(report.backgroundImage, pathname).toContain("/home/hero-outcome.jpg");
        expect(report.avoidableSplitWords, `${pathname}: words split despite fitting the title measure`).toEqual([]);
        const compactGreekTitle = locale === "el-GR" && viewport.width <= 480;
        const compactFinnishTitle = locale === "fi-FI" && viewport.width <= 480;
        const wholeWordCompactTitle = compactGreekTitle || compactFinnishTitle;
        if (wholeWordCompactTitle) {
          expect(report.splitWords, `${pathname}: compact hero title words stay intact`).toEqual([]);
        }
        if (locale === "fi-FI" && viewport.width === 390) {
          expect(
            report.splitWords.map((word) => word.toLocaleUpperCase(locale)),
            `${pathname}: RAKENNETTU stays whole`,
          ).not.toContain("RAKENNETTU");
          expect(report.headingOverflow, `${pathname}: heading overflow`).toBeLessThanOrEqual(1);
          expect(report.documentOverflow, `${pathname}: document overflow`).toBe(0);
        }
        expect(report.backgroundSize, pathname).toBe("cover");
        expect(report.backgroundPositionY, pathname).toBe("8%");
        expect(report.headTop, `${pathname}: portrait head is cropped`).toBeGreaterThanOrEqual(0);
        expect(report.faceCenter, `${pathname}: portrait face is above the hero`).toBeGreaterThan(0);
        expect(report.chin, `${pathname}: portrait face is below the hero`).toBeLessThan(report.heroHeight);
        expect(report.headingHyphens, pathname).toBe(wholeWordCompactTitle ? "none" : viewport.width <= 800 ? "auto" : "none");
        expect(report.headingHyphenateLimitChars, pathname).toBe(viewport.width <= 800 ? "14 6 5" : "auto");
        const expectedHeadingFontSize = compactGreekTitle
          ? Math.min(44, Math.max(30, viewport.width * 0.095))
          : compactFinnishTitle
            ? Math.min(54, Math.max(44, viewport.width * 0.12))
          : viewport.width <= 800
            ? Math.min(70, Math.max(48, viewport.width * 0.1325))
          : Math.min(96, Math.max(54, viewport.width * 0.06));
        expect(report.headingFontSize, `${pathname}: responsive title scale`).toBeCloseTo(expectedHeadingFontSize, 2);
        if (compactFinnishTitle) expect(report.headingFontStretch, `${pathname}: compact Finnish title width`).toBe("90%");
        expect(report.headingOverflowWrap, pathname).toBe(wholeWordCompactTitle ? "normal" : viewport.width <= 800 ? "break-word" : "normal");
        expect(report.headingWordBreak, pathname).toBe("normal");
        expect(report.headingLeft, `${pathname}: heading starts outside the viewport`).toBeGreaterThanOrEqual(-1);
        expect(report.headingRight, `${pathname}: heading ends outside the viewport`).toBeLessThanOrEqual(report.viewportWidth + 1);
      }
    } finally {
      await context.close();
    }
  });
}
