import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function defaultSlugs(page: import("@playwright/test").Page) {
  await page.goto(`${baseUrl}/compare`, { waitUntil: "networkidle" });
  const values = await page.locator('select[name="casino"]').evaluateAll((selects) => selects
    .map((select) => (select as HTMLSelectElement).value)
    .filter(Boolean));
  expect(values).toHaveLength(3);
  return values;
}

function explicitPath(slugs: string[], suffix = "") {
  const params = new URLSearchParams();
  for (const slug of slugs) params.append("casino", slug);
  params.set("country", "GB");
  return `/compare?${params}${suffix}`;
}

test("desktop comparison renders current published evidence without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}/compare`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Compare what matters/ })).toBeVisible();
  await expect(page.getByRole("table", { name: /Comparison of/ })).toBeVisible();
  await expect(page.getByText("Illustrative pre-launch product demonstration.")).toBeVisible();
  await expect(page.getByText("Preference, not detected location.")).toBeVisible();
  await page.getByLabel(/01 · Selected/).focus();
  expect(await page.getByLabel(/01 · Selected/).evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/sevenbet-compare-desktop.png", fullPage: true });
});

test("two and three profile URLs preserve order, support replacement, removal and clear", async ({ page }) => {
  const slugs = await defaultSlugs(page);
  await page.goto(`${baseUrl}${explicitPath([slugs[1], slugs[0]])}`, { waitUntil: "networkidle" });
  const selected = page.locator('select[name="casino"]');
  await expect(selected.nth(0)).toHaveValue(slugs[1]);
  await expect(selected.nth(1)).toHaveValue(slugs[0]);
  await expect(page.getByRole("table")).toBeVisible();

  await selected.nth(2).selectOption(slugs[2]);
  await page.getByRole("button", { name: "Update comparison" }).click();
  await expect(page).toHaveURL(new RegExp(`casino=${slugs[1]}.*casino=${slugs[0]}.*casino=${slugs[2]}`));
  await expect(page.getByText("3 of 3 selected · maximum")).toBeVisible();
  await page.waitForLoadState("networkidle");

  const removeHref = await page.getByRole("link", { name: "Remove", exact: true }).first().getAttribute("href");
  expect(removeHref).toContain(`casino=${slugs[0]}`);
  expect(removeHref).not.toContain(`casino=${slugs[1]}`);
  const clearHref = await page.getByRole("link", { name: "Clear selection" }).getAttribute("href");
  expect(clearHref).toMatch(/empty=true/);
  await page.goto(`${baseUrl}${clearHref}`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/empty=true/);
  await expect(page.getByRole("heading", { name: "Start with two profiles" })).toBeVisible();
});

test("show-only-differences and malformed or unavailable selections fail closed", async ({ page, request }) => {
  const slugs = await defaultSlugs(page);
  await page.goto(`${baseUrl}${explicitPath(slugs.slice(0, 2), "&differences=true")}`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Showing differences/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Show all criteria" })).toBeVisible();

  await page.goto(`${baseUrl}/compare?casino=definitely-unpublished-profile&casino=also-unpublished&country=GB`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "These profiles do not align" })).toBeVisible();
  await expect(page.getByText(/unknown, unpublished, archived or unavailable/).first()).toBeVisible();
  await expect(page.locator('a[href^="http"]')).toHaveCount(0);

  const malformed = await request.get(`${baseUrl}/compare?casino=..%2Funsafe&casino=${slugs[0]}&casino=${slugs[1]}&casino=${slugs[2]}&casino=extra&country=GBR&differences=maybe`);
  expect(malformed.status()).toBe(200);
  const html = await malformed.text();
  expect(html).toContain("Some URL values were safely ignored");
  await page.goto(`${baseUrl}/compare?casino=..%2Funsafe&casino=${slugs[0]}&casino=${slugs[1]}&casino=${slugs[2]}&casino=extra&country=GBR&differences=maybe`, { waitUntil: "networkidle" });
  await expect(page.getByText("../unsafe", { exact: true })).toHaveCount(0);
  await expect(page.locator('option[value="../unsafe"]')).toHaveCount(0);
});

test("mobile uses criterion cards and all approved widths avoid horizontal overflow", async ({ browser }) => {
  test.setTimeout(120_000);
  for (const width of [1440, 1280, 900, 768, 390, 375, 320]) {
    const errors: string[] = [];
    const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 }, isMobile: width <= 390 });
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}/compare`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px status`).toBe(200);
    if (width <= 760) {
      await expect(page.getByRole("table")).toBeHidden();
      await expect(page.locator('article').filter({ hasText: "Editorial score" }).first()).toBeVisible();
    } else {
      await expect(page.getByRole("table")).toBeVisible();
    }
    const overflow = await page.evaluate(() => ({
      present: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      width: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll("body *")).flatMap((element) => {
        const box = element.getBoundingClientRect();
        return box.right > document.documentElement.clientWidth + 0.5 ? [`${element.tagName}.${typeof element.className === "string" ? element.className : ""}:${Math.round(box.right)}`] : [];
      }).slice(0, 8),
    }));
    expect(overflow.present, `horizontal overflow at ${width}px (${overflow.width}px): ${overflow.offenders.join(", ")}`).toBe(false);
    expect(errors, `runtime errors at ${width}px`).toEqual([]);
    if (width === 390) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: "/tmp/sevenbet-compare-mobile.png", fullPage: true });
    }
    await page.close();
  }
});

test("soft navigation preserves comparison evidence while pending without mobile overflow", async ({ browser }) => {
  for (const width of [390, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true });
    await page.goto(`${baseUrl}/compare`, { waitUntil: "networkidle" });
    const heading = page.getByRole("heading", { level: 1, name: /Compare what matters/ });
    await expect(heading).toBeVisible();
    await page.route("**/*_rsc=*", async (route) => { await new Promise((resolve) => setTimeout(resolve, 300)); await route.continue(); });
    const first = page.locator('select[name="casino"]').first();
    const replacement = await first.locator("option").nth(2).getAttribute("value");
    await first.selectOption(replacement!);
    await expect(page.locator('form[data-pending="true"]')).toBeVisible();
    await expect(heading).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${width}px pending overflow`).toBe(false);
    await page.close();
  }
});

test("comparison evidence remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/compare`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Compare what matters/ })).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(3);
  await expect(page.locator('article').filter({ hasText: "Editorial score" }).first()).toBeVisible();
  const overflow = await page.evaluate(() => ({
    present: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    width: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll("body *")).flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.right > document.documentElement.clientWidth + 0.5 ? [`${element.tagName}.${typeof element.className === "string" ? element.className : ""}:${Math.round(box.right)}`] : [];
    }).slice(0, 8),
  }));
  expect(overflow.present, `no-JavaScript horizontal overflow (${overflow.width}px): ${overflow.offenders.join(", ")}`).toBe(false);
  await context.close();
});

test("metadata and structured data use a clean canonical without commercial schema", async ({ request }) => {
  const defaultResponse = await request.get(`${baseUrl}/compare`);
  const defaultHtml = await defaultResponse.text();
  expect(defaultResponse.status()).toBe(200);
  expect(defaultHtml).toContain('<meta name="robots" content="index, follow"');
  expect(defaultHtml).toContain('<link rel="canonical" href="https://b4gamble.com/compare"');
  expect(defaultHtml).toContain('"@type":"BreadcrumbList"');
  expect(defaultHtml).toContain('"@type":"ItemList"');
  expect(defaultHtml).not.toContain('"@type":"Offer"');
  expect(defaultHtml).not.toContain('"@type":"AggregateRating"');
  expect(defaultHtml).not.toMatch(/destinationUrl|trackingUrl/);
  expect(defaultHtml).not.toMatch(/href="\/r\/[a-z0-9-]+"/);

  const queryResponse = await request.get(`${baseUrl}/compare?empty=true&country=GB`);
  const queryHtml = await queryResponse.text();
  expect(queryResponse.status()).toBe(200);
  expect(queryHtml).toContain('<meta name="robots" content="noindex, follow"');
  expect(queryHtml).toContain('<link rel="canonical" href="https://b4gamble.com/compare"');
});

test("commercial actions stay inert while market authority denies referral", async ({ page, request }) => {
  const slugs = await defaultSlugs(page);
  await expect(page.locator('a[aria-haspopup="dialog"]')).toHaveCount(0);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);

  const candidateSlugs = await page.locator('select[name="casino"]').first().locator('option[value]:not([value=""])').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  let unavailableHtml = "";
  for (const candidate of candidateSlugs) {
    if (candidate === slugs[0]) continue;
    const response = await request.get(`${baseUrl}${explicitPath([slugs[0], candidate])}`);
    const html = await response.text();
    if (html.includes("Commercial action unavailable")) { unavailableHtml = html; break; }
  }
  expect(unavailableHtml, "expected at least one current comparable profile without a governed action").toContain("Commercial action unavailable");
  expect(unavailableHtml).not.toMatch(/<a[^>]+href="https?:\/\//);

  const missingRedirect = await request.get(`${baseUrl}/r/definitely-missing-comparison-route`, { maxRedirects: 0 });
  expect(missingRedirect.status()).toBe(303);
  expect(missingRedirect.headers().location ?? "").toMatch(/\/outbound\/unavailable$/);
});
