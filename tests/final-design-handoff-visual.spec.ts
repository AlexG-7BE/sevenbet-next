import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const evidenceRoot = join(process.cwd(), "docs/02_Product_Design/qa/final-design-handoff");

const surfaces = [
  ["home", "/"],
  ["ten-steps", "/10-steps"],
  ["programme", "/program"],
  ["login", "/login"],
  ["best-offers", "/best-offers"],
  ["casinos", "/casinos"],
  ["casino-review", "/casino/demo-northstar"],
  ["bonuses", "/bonuses"],
  ["bonus-guide", "/bonus-guide"],
  ["learn", "/learn"],
  ["article", "/learn/casino-bonuses/welcome-bonus-terms"],
  ["responsible-gambling", "/responsible-gambling"],
  ["help", "/help"],
  ["methodology", "/methodology"],
  ["about", "/about"],
  ["faq", "/faq"],
  ["affiliate-disclosure", "/affiliate-disclosure"],
  ["contact", "/contact"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["not-found", "/final-handoff-not-found"],
  ["contextual-comparison", "/casinos?casino=demo-northstar&casino=demo-summit&country=GB"],
] as const;

const runtimeIntegritySurfaces = [
  ["best-offers", "/best-offers", "best-offers", "#shortlist"],
  ["casinos", "/casinos", "casinos", "#casino-directory"],
  ["casino-review", "/casino/demo-northstar", "casino-review", "#overview"],
  ["bonuses", "/bonuses", "bonuses", "section"],
  ["learn-article", "/learn/casino-bonuses/welcome-bonus-terms", "learn-article", "[data-learning-article]"],
] as const;

test("visualFixture changes data only and never switches the runtime presentation tree", async ({ page }) => {
  for (const [name, route, renderer, requiredChild] of runtimeIntegritySurfaces) {
    const signatures = [];
    for (const suffix of ["", "?visualFixture=true"]) {
      const response = await page.goto(`${baseUrl}${route}${suffix}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${name}${suffix}`).toBe(200);
      await expect(page.locator("[data-handoff-page]"), `${name}${suffix} must not use HandoffPage`).toHaveCount(0);
      const root = page.locator(`[data-runtime-renderer="${renderer}"]`).first();
      await expect(root, `${name}${suffix} real runtime marker`).toHaveCount(1);
      await expect(page.locator(requiredChild).first(), `${name}${suffix} functional child`).toBeAttached();
      signatures.push(await root.evaluate((element) => ({
        tag: element.tagName,
        className: element.className,
        directChildren: Array.from(element.children)
          .filter((child) => child.tagName !== "SCRIPT" && !String(child.className).includes("demoDisclosure"))
          .map((child) => `${child.tagName}.${child.className}`),
      })));
    }
    expect(signatures[1], `${name} presentation root and direct composition`).toEqual(signatures[0]);
  }
});

test("capture the final handoff surface matrix without page-level overflow", async ({ browser }) => {
  test.setTimeout(12 * 60_000);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    const output = join(evidenceRoot, "comparison", String(viewport.width));
    mkdirSync(output, { recursive: true });
    const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    const page = await context.newPage();
    for (const [name, path] of surfaces) {
      const errors: string[] = [];
      const onPageError = (error: Error) => errors.push(error.message);
      const onConsole = (message: import("@playwright/test").ConsoleMessage) => {
        if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
      };
      const onResponse = (response: import("@playwright/test").Response) => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      };
      page.on("pageerror", onPageError);
      page.on("console", onConsole);
      page.on("response", onResponse);
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
      expect(response?.status(), `${name} at ${viewport.width}px`).toBe(name === "not-found" ? 404 : 200);
      if (name === "contextual-comparison") await expect(page.getByRole("heading", { name: "Side by side" })).toBeVisible();
      const overflowing = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth ? [] : Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
        })
        .slice(0, 8)
        .map((element) => ({ className: element.className, tag: element.tagName, text: element.textContent?.trim().slice(0, 80) })));
      expect(overflowing, `${name} overflow at ${viewport.width}px`).toEqual([]);
      const unexpectedErrors = name === "not-found"
        ? errors.filter((message) => !message.includes("status of 404") && !/^404 .*\/final-handoff-not-found$/.test(message))
        : errors;
      expect(unexpectedErrors, `${name} browser errors at ${viewport.width}px`).toEqual([]);
      await page.screenshot({ path: join(output, `${name}-implementation-final.png`), animations: "disabled", fullPage: true });
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      page.off("response", onResponse);
    }
    await context.close();
  }
});
