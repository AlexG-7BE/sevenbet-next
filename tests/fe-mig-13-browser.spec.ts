import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("Affiliate Disclosure renders the approved four-section trust document", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/affiliate-disclosure`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/HOW SEVENBET\s*IS FUNDED\./);
  await expect(page.getByRole("navigation", { name: "On this page" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Read methodology", exact: true })).toHaveAttribute("href", "/methodology");
  for (const heading of [
    "THE COMMERCIAL RELATIONSHIP",
    "EDITORIAL JUDGEMENT IS NOT FOR SALE.",
    "WHAT READERS CAN VERIFY",
    "CORRECTIONS",
  ]) await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("About renders the corrected 835:5298 visual family and content order", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/about`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("[data-about-document]")).toHaveAttribute("data-figma-family", "835:5298");
  await expect(page.locator("[data-about-document]")).toHaveAttribute("data-figma-compact-hero", "923:2694");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Learn\.↓?Reflect\.↓?Understand\.↓?Compare\.↓?Decide\.↓?Review again\./i);

  const expectedSections = [
    "hero",
    "operating-model",
    "clear-boundaries",
    "editorial-principles",
    "six-step-flow",
    "what-sevenbet-builds",
  ];
  expect(await page.locator("[data-about-section]").evaluateAll((sections) => sections.map((section) => section.getAttribute("data-about-section")))).toEqual(expectedSections);
  await expect(page.getByRole("heading", { name: "What we build ends here.", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The principles control the work.", exact: true })).toBeVisible();
  await expect(page.getByText("Optional. No Programme reward for casino, bonus, affiliate or commercial action. Reflection data does not personalize offers.", { exact: true })).toBeVisible();
  await expect(page.getByText("Structured reviews and comparisons remain informational. The path is not a funnel; readers may stop, return to learning or use protected Help.", { exact: true })).toBeVisible();
  await expect(page.locator('[data-about-document] a[href^="/r/"], [data-about-document] a[href^="/go/"]')).toHaveCount(0);
  await expect(page.locator('[data-about-document] a')).toHaveCount(0);
  await expect(page.locator("body > footer[data-public-shell]").getByRole("link", { name: "Open Help", exact: true })).toHaveAttribute("href", "/responsible-gambling");
  expect(errors).toEqual([]);
});

for (const route of [
  { path: "/affiliate-disclosure", document: "[data-affiliate-disclosure-document]" },
  { path: "/about", document: "[data-about-document]" },
] as const) {
  test(`${route.path} core document works without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(route.document)).toBeVisible();
    if (route.path === "/about") {
      await expect(page.locator("body > footer[data-public-shell]").getByRole("link", { name: "Open Help", exact: true })).toHaveAttribute("href", "/responsible-gambling");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await context.close();
  });

  test(`${route.path} metadata and schema match the visible route`, async ({ page }) => {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.path}$`));
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? "{}")));
    expect(schemas.some((schema) => schema["@type"] === "BreadcrumbList")).toBe(true);
    expect(schemas.some((schema) => schema["@type"] === "FAQPage")).toBe(false);
  });
}

test("About preserves the six boundaries, seven principles, and five outputs", async ({ page }) => {
  await page.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-about-section="clear-boundaries"] li')).toHaveCount(6);
  await expect(page.locator('[data-about-section="editorial-principles"] li')).toHaveCount(7);
  await expect(page.locator('[data-about-section="six-step-flow"] ol li')).toHaveCount(6);
  await expect(page.locator('[data-about-section="what-sevenbet-builds"] li')).toHaveCount(5);
  await expect(page.getByText("No casino, bonus or affiliate prompts", { exact: true })).toBeVisible();
});

const affiliateViewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 720 },
] as const;

const aboutViewports = [
  { width: 1440, height: 900, authority: "923:2694" },
  { width: 1280, height: 800, authority: "835:5651" },
  { width: 1024, height: 768, authority: "835:5787" },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 430, height: 844, authority: "835:5923" },
  { width: 390, height: 844, authority: "835:5436" },
  { width: 375, height: 667, authority: "835:5559" },
  { width: 360, height: 800, authority: "835:6015" },
  { width: 320, height: 720, authority: "835:6107" },
] as const;

for (const route of [
  { path: "/affiliate-disclosure", document: "[data-affiliate-disclosure-document]", viewports: affiliateViewports },
  { path: "/about", document: "[data-about-document]", viewports: aboutViewports },
] as const) {
  for (const viewport of route.viewports) {
    const authority = "authority" in viewport ? ` / Figma ${viewport.authority}` : "";
    test(`${route.path} follows the responsive contract at ${viewport.width}px${authority}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport });
      const errors: string[] = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      const outOfBounds = await page.locator(`${route.document} h1, ${route.document} h2, ${route.document} h3, ${route.document} a`).evaluateAll((elements) => elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
        })
        .map((element) => element.textContent?.trim()));
      expect(outOfBounds).toEqual([]);
      expect(errors).toEqual([]);
      await page.close();
    });
  }
}
