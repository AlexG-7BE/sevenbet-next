import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("methodology renders one semantic document with synchronized metadata and FAQ schema", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/methodology`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/THE SCORE\s+SHOWS ITS WORK\./);
  await expect(page.getByText("Licensing and operator transparency", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("20%", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Read the full affiliate disclosure/i })).toHaveAttribute("href", "/affiliate-disclosure");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/methodology$/);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);

  const tocLinks = page.getByRole("navigation", { name: "On this page" }).getByRole("link");
  await expect(tocLinks).toHaveCount(4);
  for (const href of await tocLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toBeTruthy();
    await expect(page.locator(href!)).toHaveCount(1);
  }

  const faqQuestions = await page.locator("[data-methodology-document] details > summary").allTextContents();
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? "{}")));
  const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
  expect(faqSchema).toBeTruthy();
  expect(faqSchema.mainEntity.map((item: { name: string }) => item.name)).toEqual(
    faqQuestions.map((question) => question.replace(/^\d{2}/, "").trim()),
  );
});

test("methodology core content is usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/methodology`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "10-POINT EDITOR'S SCORE" })).toBeVisible();
  await expect(page.getByText("Account rules and restrictions", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
  await context.close();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 720 },
]) {
  test(`methodology follows the responsive contract at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    const browserErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.goto(`${baseUrl}/methodology`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const outOfBounds = await page.locator("[data-methodology-document] h1, [data-methodology-document] h2, [data-methodology-document] a").evaluateAll((elements) => elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .map((element) => element.textContent?.trim()));
    expect(outOfBounds).toEqual([]);
    expect(browserErrors).toEqual([]);
    await page.close();
  });
}
