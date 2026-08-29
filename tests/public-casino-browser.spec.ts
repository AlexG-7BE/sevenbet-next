import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("desktop discovery renders the server-owned CMS state without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Picked for.*how you play/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Full directory" })).toBeVisible();
  const resultStatus = page.locator("#casino-results [role=status]");
  if ((await resultStatus.innerText()).startsWith("0 ")) {
    await expect(page.getByRole("heading", { level: 2, name: /No published reviews for .* yet\./ })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Clear all" })).toHaveCount(0);
  await page.getByRole("button", { name: "All filters" }).click();
  const filterDialog = page.getByRole("dialog", { name: "Filters · Full directory" });
  await expect(filterDialog.getByLabel("Bonus availability")).toBeVisible();
  await expect(filterDialog.getByLabel("Safer-gambling information")).toBeVisible();
  await filterDialog.getByRole("button", { name: "Close filters" }).click();
  await expect(resultStatus).toHaveText(/\d+ results? · Page 1 of \d+/);
  const countryPreference = page.getByLabel("Country preference").filter({ visible: true }).first();
  await countryPreference.focus();
  await expect(countryPreference).toBeFocused();
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

test("sort, page size and search query remain URL-authoritative", async ({ page }) => {
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  await page.goto(`${baseUrl}/casinos?sort=NEWEST&pageSize=24`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/sort=NEWEST/);
  await expect(page).toHaveURL(/pageSize=24/);
  await expect(page.getByLabel("Sort results")).toHaveValue("NEWEST");
  await expect(page.getByLabel("Results per page")).toHaveValue("24");
  await page.goto(`${baseUrl}/casinos?q=live+casino&sort=NEWEST&pageSize=24`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/q=live\+casino/);
  await expect(page).toHaveURL(/sort=NEWEST/);
  await expect(page).toHaveURL(/pageSize=24/);
});

test("mobile filter drawer is modal, keyboard dismissible and returns focus", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/casinos?q=definitely-no-match`, { waitUntil: "networkidle" });
  await expect(page.getByText(/No published reviews match this market and these controls\./).first()).toBeVisible();
  const trigger = page.getByRole("button", { name: /Filters/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filters · Full directory" });
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
  expect(html).toContain("The selected market changes editorial presentation only.");
});

test("mobile directory filters remain usable when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Picked for.*how you play/ })).toBeVisible();
  const fallback = page.locator("noscript details");
  await expect(fallback).toBeVisible();
  await fallback.locator("summary").click();
  const responsibleGambling = fallback.locator('select[name="hasResponsibleGambling"]');
  await responsibleGambling.selectOption("true");
  await fallback.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/hasResponsibleGambling=true/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

test("directory metadata, canonical rules and fail-closed action state remain intact", async ({ request }) => {
  const defaultResponse = await request.get(`${baseUrl}/casinos`);
  const defaultHtml = await defaultResponse.text();
  expect(defaultResponse.status()).toBe(200);
  expect(defaultHtml).toContain('<meta name="robots" content="noindex, follow"');
  expect(defaultHtml).toMatch(/<link rel="canonical" href="https?:\/\/[^\"]+\/casinos"/);
  expect(defaultHtml).not.toContain('"@type":"ItemList"');
  if (!defaultHtml.includes("DEMONSTRATION DATA")) expect(defaultHtml).toMatch(/No published reviews for .* yet\./);
  expect(defaultHtml).not.toMatch(/href="\/r\/[a-z0-9-]+"/);

  const pageTwoResponse = await request.get(`${baseUrl}/casinos?page=2`);
  const pageTwoHtml = await pageTwoResponse.text();
  expect(pageTwoResponse.status()).toBe(200);
  expect(pageTwoHtml).toMatch(/rel="canonical" href="https?:\/\/[^\"]+\/casinos\?page=2"/);

  const filteredResponse = await request.get(`${baseUrl}/casinos?hasResponsibleGambling=true`);
  const filteredHtml = await filteredResponse.text();
  expect(filteredResponse.status()).toBe(200);
  expect(filteredHtml).toContain('<meta name="robots" content="noindex, follow"');
  expect(filteredHtml).toMatch(/rel="canonical" href="https?:\/\/[^\"]+\/casinos"/);
});

test("empty facets, boolean and invalid URL states stay server-authoritative", async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  const facetValues = await page.evaluate(() => Object.fromEntries(["country", "license", "payment"].map((name) => {
    const option = document.querySelector<HTMLSelectElement>(`form:not([class*="mobileFilterForm"]) select[name="${name}"]`)?.querySelector<HTMLOptionElement>('option:not([value=""])');
    return [name, option?.value ?? ""];
  })));
  const total = Number((await page.locator("#casino-results [role=status]").innerText()).match(/^\d+/)?.[0] ?? "0");
  if (total === 0) expect(facetValues).toEqual({ country: "", license: "", payment: "" });
  else expect(Object.values(facetValues).every(Boolean)).toBe(true);

  const paths = [
    "/casinos?hasBonus=true",
    "/casinos?hasResponsibleGambling=true",
    "/casinos?hasBonus=true&hasResponsibleGambling=true",
    "/casinos?sort=INVALID&page=-9&pageSize=999&hasBonus=maybe&unknown=value",
  ];
  for (const path of paths) {
    const response = await request.get(`${baseUrl}${path}`);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain("Full directory");
  }
});

test("legacy catalog permanently redirects and drops unsupported parameters", async ({ page }) => {
  const response = await page.request.get(`${baseUrl}/catalog?q=alpha&junk=unsafe`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/casinos?q=alpha");
});
