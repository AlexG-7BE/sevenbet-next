import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const evidenceRoot = join(process.cwd(), "docs/02_Product_Design/qa/final-design-handoff/founder-unified-shell-review");

const viewports = [
  { width: 1440, height: 1000, gutter: 72 },
  { width: 1024, height: 900, gutter: 51.2 },
  { width: 430, height: 932, gutter: 24 },
  { width: 390, height: 844, gutter: 24 },
] as const;

const routes = [
  ["home", "/", true],
  ["best-offers", "/best-offers", true],
  ["casinos", "/casinos", true],
  ["casino-review", "/casino/demo-northstar", true],
  ["bonuses", "/bonuses", true],
  ["learn", "/learn", true],
  ["programme", "/program", true],
  ["ten-steps", "/10-steps", true],
  ["bonus-guide", "/bonus-guide", true],
  ["responsible-gambling", "/responsible-gambling", true],
  ["help", "/help", false],
  ["methodology", "/methodology", true],
  ["about", "/about", true],
  ["faq", "/faq", true],
  ["contact", "/contact", true],
  ["privacy", "/privacy", true],
  ["terms", "/terms", true],
] as const;

type Edges = { left: number; right: number };

async function primaryContentEdges(page: Page): Promise<Edges> {
  return page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>("#main-content h1, main h1, h1");
    if (!heading) throw new Error("Primary heading was not rendered");
    let widestBounded: { element: HTMLElement; width: number } | null = null;
    for (let element: HTMLElement | null = heading; element && element !== document.body; element = element.parentElement) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const paddingLeft = Number.parseFloat(style.paddingLeft || "0");
      const paddingRight = Number.parseFloat(style.paddingRight || "0");
      if (rect.width >= innerWidth * .85 && paddingLeft >= 20 && paddingRight >= 20) {
        return { left: rect.left + paddingLeft, right: rect.right - paddingRight };
      }
      const rightGutter = innerWidth - rect.right;
      if (rect.width < innerWidth * .98 && rect.width >= innerWidth * .5 && Math.abs(rect.left - rightGutter) <= 2) {
        if (!widestBounded || rect.width > widestBounded.width) widestBounded = { element, width: rect.width };
      }
    }
    if (!widestBounded) throw new Error("Primary visual frame was not found");
    const rect = widestBounded.element.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  });
}

async function shellMetrics(page: Page) {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).display !== "none";
    };
    const header = document.querySelector<HTMLElement>('[data-public-shell="header"]');
    const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    if (!header || !footer) throw new Error("Shared public shell was not rendered");
    const logo = header.querySelector<HTMLElement>('a[aria-label="B4GAMBLE home"]');
    const cta = [...header.querySelectorAll<HTMLElement>('a[href^="/program"]')].find(visible);
    const footerInner = footer.firstElementChild as HTMLElement | null;
    if (!logo || !cta || !footerInner) throw new Error("Shared shell anchors were not rendered");
    const headerRect = header.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    const ctaRect = cta.getBoundingClientRect();
    const footerRect = footerInner.getBoundingClientRect();
    return {
      headerHeight: headerRect.height,
      logoLeft: logoRect.left,
      logoRight: logoRect.right,
      logoTop: logoRect.top,
      logoHeight: logoRect.height,
      ctaRight: ctaRect.right,
      footerLeft: footerRect.left,
      footerRight: footerRect.right,
    };
  });
}

test("real route anchors resolve to one Founder-visible public shell", async ({ page }) => {
  test.setTimeout(6 * 60_000);
  const report: Record<string, unknown> = {};
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const viewportReport: Record<string, unknown> = {};
    for (const [name, route, sharedChrome] of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${name} at ${viewport.width}px`).toBe(200);
      await page.waitForTimeout(80);
      const body = await primaryContentEdges(page);
      expect(Math.abs(body.left - viewport.gutter), `${name} content left at ${viewport.width}px`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(body.right - (viewport.width - viewport.gutter)), `${name} content right at ${viewport.width}px`).toBeLessThanOrEqual(1.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${name} overflow at ${viewport.width}px`).toBe(true);

      if (!sharedChrome) {
        expect(await page.locator('[data-public-shell="header"]').count(), `${name} protected shell`).toBe(0);
        viewportReport[name] = { body, shell: "protected-help" };
        continue;
      }

      await expect(page.locator('[data-public-shell="header"]')).toHaveCount(1);
      await expect(page.locator('[data-public-shell="footer"]')).toHaveCount(1);
      expect(await page.locator("[data-handoff-page] [data-nav]").count(), `${name} internal handoff navigation at ${viewport.width}px`).toBe(0);
      const shell = await shellMetrics(page);
      expect(Math.abs(shell.logoLeft - viewport.gutter), `${name} logo left at ${viewport.width}px`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(shell.ctaRight - (viewport.width - viewport.gutter)), `${name} CTA right at ${viewport.width}px`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(shell.footerLeft - viewport.gutter), `${name} footer left at ${viewport.width}px`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(shell.footerRight - (viewport.width - viewport.gutter)), `${name} footer right at ${viewport.width}px`).toBeLessThanOrEqual(1.5);
      viewportReport[name] = { body, shell };
    }
    report[String(viewport.width)] = viewportReport;
  }
  mkdirSync(evidenceRoot, { recursive: true });
  writeFileSync(join(evidenceRoot, "visual-anchor-metrics.json"), `${JSON.stringify(report, null, 2)}\n`);
});

test("Founder shell screenshots retain the same visible guide overlay", async ({ browser }) => {
  test.setTimeout(3 * 60_000);
  mkdirSync(evidenceRoot, { recursive: true });
  const screenshotRoutes = ["home", "best-offers", "casinos", "bonuses", "learn", "programme"] as const;
  const routeByName = new Map(routes.map(([name, route]) => [name, route]));
  const desktopBuffers: Buffer[] = [];

  for (const viewport of [viewports[0], viewports[3]]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const name of screenshotRoutes) {
      const response = await page.goto(`${baseUrl}${routeByName.get(name)}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), name).toBe(200);
      await page.evaluate(({ gutter }) => {
        const guides = document.createElement("div");
        guides.setAttribute("data-founder-shell-guides", "true");
        guides.innerHTML = '<i data-side="left"></i><i data-side="right"></i>';
        const style = document.createElement("style");
        style.textContent = `[data-founder-shell-guides] i{position:fixed;z-index:2147483646;top:0;bottom:0;width:2px;background:rgba(255,0,120,.9);pointer-events:none}[data-founder-shell-guides] [data-side=left]{left:${gutter}px}[data-founder-shell-guides] [data-side=right]{right:${gutter}px}`;
        document.head.append(style);
        document.body.append(guides);
      }, { gutter: viewport.gutter });
      const png = await page.screenshot({ animations: "disabled", fullPage: false, type: "png" });
      await sharp(png).webp({ quality: 90 }).toFile(join(evidenceRoot, `${name}-shell-${viewport.width}.webp`));
      if (viewport.width === 1440) desktopBuffers.push(png);
    }
    await context.close();
  }

  await sharp(desktopBuffers[0])
    .composite(desktopBuffers.slice(1).map((input) => ({ input, blend: "screen" })))
    .webp({ quality: 92 })
    .toFile(join(evidenceRoot, "desktop-shell-overlay.webp"));
});
