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

test("capture the final handoff surface matrix without page-level overflow", async ({ browser }) => {
  test.setTimeout(12 * 60_000);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    const output = join(evidenceRoot, String(viewport.width));
    mkdirSync(output, { recursive: true });
    const context = await browser.newContext({ viewport, isMobile: viewport.width <= 430 });
    const page = await context.newPage();
    for (const [name, path] of surfaces) {
      const errors: string[] = [];
      const onPageError = (error: Error) => errors.push(error.message);
      const onConsole = (message: import("@playwright/test").ConsoleMessage) => { if (message.type() === "error") errors.push(message.text()); };
      page.on("pageerror", onPageError);
      page.on("console", onConsole);
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
      expect(response?.status(), `${name} at ${viewport.width}px`).toBe(name === "not-found" ? 404 : 200);
      if (name === "contextual-comparison") await expect(page.getByRole("heading", { name: "See the differences." })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${name} overflow at ${viewport.width}px`).toBe(true);
      const unexpectedErrors = name === "not-found"
        ? errors.filter((message) => !message.includes("status of 404"))
        : errors;
      expect(unexpectedErrors, `${name} browser errors at ${viewport.width}px`).toEqual([]);
      await page.screenshot({ path: join(output, `${name}.png`), animations: "disabled" });
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
    }
    await context.close();
  }
});
