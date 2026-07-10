import { chromium } from "@playwright/test";

const routes = ["/", "/self-check", "/program", "/bonuses", "/catalog", "/bonus-guide", "/tools/budget-calculator"];
const baseURL = process.env.BASE_URL || "http://localhost:4173";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

for (const route of routes) {
  await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);
  const h1 = await page.locator("h1").count();
  if (hasOverflow) throw new Error(`Horizontal overflow on ${route}`);
  if (h1 !== 1) throw new Error(`Expected one h1 on ${route}, got ${h1}`);
  await page.screenshot({ path: `visual-${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}.png`, fullPage: true });
}

await browser.close();
console.log(`Visual QA passed for ${routes.length} routes.`);
