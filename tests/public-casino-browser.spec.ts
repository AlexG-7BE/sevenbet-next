import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("desktop discovery renders the approved SSR directory without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /A clearer casino choice/ })).toBeVisible();
  await expect(page.getByText(/Search published review snapshots/)).toBeVisible();
  await expect(page.getByText(/Search verified published profiles/)).toHaveCount(0);
  await expect(page.getByLabel("Search published reviews")).toBeVisible();
  const editorialMedia = page.locator('img[src="/casino-directory/editorial-media.jpg"]');
  await expect(editorialMedia).toBeVisible();
  expect(await editorialMedia.evaluate((image: HTMLImageElement) => ({ complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ complete: true, width: 2400, height: 3600 });
  await expect(page.getByText("Market preference, not location.").first()).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/Page 1 of/);
  await page.getByLabel("Search published reviews").focus();
  expect(await page.getByLabel("Search published reviews").evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/sevenbet-casinos-desktop.png", fullPage: true });
});

test("directory URLs remain stable without overflow or runtime errors across approved widths", async ({ browser }) => {
  test.setTimeout(90_000);
  for (const width of [1440, 1280, 900, 768, 390, 375, 320]) {
    const errors: string[] = [];
    const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 }, isMobile: width <= 390 });
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
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
  await page.getByRole("button", { name: "Search", exact: true }).click();
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
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  await page.evaluate(() => scrollTo(0, 0));
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

test("mobile directory filters remain usable when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /A clearer casino choice/ })).toBeVisible();
  const fallback = page.locator("noscript details");
  await expect(fallback).toBeVisible();
  await fallback.locator("summary").click();
  const country = fallback.locator('select[name="country"]');
  await country.selectOption({ index: 1 });
  await fallback.getByRole("button", { name: /Show .* results/ }).click();
  await expect(page).toHaveURL(/country=/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

test("SSR metadata, canonical rules, ItemList and fail-closed action states remain intact", async ({ request }) => {
  const defaultResponse = await request.get(`${baseUrl}/casinos`);
  const defaultHtml = await defaultResponse.text();
  expect(defaultResponse.status()).toBe(200);
  expect(defaultHtml).toContain('<meta name="robots" content="index, follow"');
  expect(defaultHtml).toContain('<link rel="canonical" href="https://sevenbet-next.vercel.app/casinos"');
  expect(defaultHtml).toContain('"@type":"ItemList"');
  expect(defaultHtml).toContain('"numberOfItems":25');
  expect(defaultHtml).toMatch(/href="\/r\/[a-z0-9-]+"/);

  const pageTwoResponse = await request.get(`${baseUrl}/casinos?page=2`);
  const pageTwoHtml = await pageTwoResponse.text();
  expect(pageTwoResponse.status()).toBe(200);
  expect(pageTwoHtml).toContain('rel="canonical" href="https://sevenbet-next.vercel.app/casinos?page=2"');
  expect(pageTwoHtml).toContain("The published review remains available.");

  const filteredResponse = await request.get(`${baseUrl}/casinos?hasResponsibleGambling=true`);
  const filteredHtml = await filteredResponse.text();
  expect(filteredResponse.status()).toBe(200);
  expect(filteredHtml).toContain('<meta name="robots" content="noindex, follow"');
  expect(filteredHtml).toContain('rel="canonical" href="https://sevenbet-next.vercel.app/casinos"');
});

test("published facet, boolean, combined and invalid URL states stay server-authoritative", async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  const facetValues = await page.evaluate(() => Object.fromEntries(["country", "license", "payment"].map((name) => {
    const option = document.querySelector<HTMLSelectElement>(`form:not([class*="mobileFilterForm"]) select[name="${name}"]`)?.querySelector<HTMLOptionElement>('option:not([value=""])');
    return [name, option?.value ?? ""];
  })));
  expect(facetValues.country).toBeTruthy();
  expect(facetValues.license).toBeTruthy();
  expect(facetValues.payment).toBeTruthy();

  const paths = [
    `/casinos?country=${encodeURIComponent(facetValues.country)}`,
    `/casinos?license=${encodeURIComponent(facetValues.license)}`,
    `/casinos?payment=${encodeURIComponent(facetValues.payment)}`,
    "/casinos?hasBonus=true",
    "/casinos?hasResponsibleGambling=true",
    `/casinos?country=${encodeURIComponent(facetValues.country)}&license=${encodeURIComponent(facetValues.license)}&hasBonus=true`,
    "/casinos?sort=INVALID&page=-9&pageSize=999&hasBonus=maybe&unknown=value",
  ];
  for (const path of paths) {
    const response = await request.get(`${baseUrl}${path}`);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain("Casino directory");
  }
});

test("legacy catalog permanently redirects and drops unsupported parameters", async ({ page }) => {
  const response = await page.request.get(`${baseUrl}/catalog?q=alpha&junk=unsafe`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/casinos?q=alpha");
});
