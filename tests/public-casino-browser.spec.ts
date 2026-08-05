import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("desktop discovery renders the approved SSR directory without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Casino reviews/ })).toBeVisible();
  await expect(page.getByText(/Search published editorial profiles/)).toBeVisible();
  await expect(page.getByText(/Search verified published profiles/)).toHaveCount(0);
  await expect(page.getByLabel("Search published reviews")).toBeVisible();
  await expect(page.getByText("Market preference, not location.").first()).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/Page 1 of/);
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "/tmp/sevenbet-casinos-desktop.png", fullPage: true });
});

test("directory URLs remain stable without overflow or runtime errors across approved widths", async ({ browser }) => {
  for (const width of [1440, 1280, 390, 375, 320]) {
    const errors: string[] = [];
    const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 }, isMobile: width <= 390 });
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(errors, `runtime errors at ${width}px`).toEqual([]);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const path of ["/casinos?q=test", "/casinos?sort=NAME_ASC", "/casinos?page=2"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    expect(response?.status(), path).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
  }
  await page.close();
});

test("sort, page size and search remain URL-authoritative", async ({ page }) => {
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  await page.getByLabel("Sort by").selectOption("NEWEST");
  await page.getByLabel("Show").selectOption("24");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page).toHaveURL(/sort=NEWEST/);
  await expect(page).toHaveURL(/pageSize=24/);
  await page.getByLabel("Search published reviews").fill("live casino");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=live\+casino/);
  await expect(page).toHaveURL(/sort=NEWEST/);
  await expect(page).toHaveURL(/pageSize=24/);
});

test("mobile filter drawer is modal, keyboard dismissible and returns focus", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/casinos?q=definitely-no-match`, { waitUntil: "networkidle" });
  await expect(page.getByText("No published reviews match these controls.")).toBeVisible();
  const trigger = page.getByRole("button", { name: /Filters/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filter casinos" });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.screenshot({ path: "/tmp/sevenbet-casinos-filter-drawer.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: "/tmp/sevenbet-casinos-mobile.png", fullPage: true });
  await page.close();
});

test("SSR HTML includes the no-JavaScript filter fallback", async ({ request }) => {
  const response = await request.get(`${baseUrl}/casinos`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<noscript>");
  expect(html).toContain("Market preference, not location.");
});

test("legacy catalog permanently redirects and drops unsupported parameters", async ({ page }) => {
  const response = await page.request.get(`${baseUrl}/catalog?q=alpha&junk=unsafe`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/casinos?q=alpha");
});
