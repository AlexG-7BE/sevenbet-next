import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

function collectRuntimeErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("Bonus Guide renders the approved editorial contract with truthful evidence", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  const response = await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/BONUS TERMS,\s*WITHOUT THE SPIN\./);
  await expect(page.locator("[data-bonus-guide]")).toHaveAttribute("data-figma-authority", "694:5455");
  await expect(page.getByText("Sources checked 07 Aug 2026")).toBeVisible();
  await expect(page.getByText("Reviewed by Compliance")).toHaveCount(0);
  await expect(page.getByText("WORKED EXAMPLE — ILLUSTRATIVE", { exact: false })).toBeVisible();
  await expect(page.getByText("£200", { exact: true })).toBeVisible();
  await expect(page.getByText(/not a current operator offer/i)).toBeVisible();
  await expect(page.getByText("Source checked", { exact: false })).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("official sources, current related reading and late commercial transition are mapped exactly", async ({ page }) => {
  await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /Open official source.*new tab/i })).toHaveCount(2);
  await expect(page.locator('a[href="https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/5-1-1-sr-code"]')).toHaveCount(1);
  await expect(page.locator('a[href="https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html"]')).toHaveCount(1);

  await expect(page.getByRole("link", { name: /How Welcome Bonus Terms Work/ })).toHaveAttribute("href", "/learn/casino-bonuses/welcome-bonus-terms");
  await expect(page.getByRole("link", { name: /Casino Licenses Explained/ })).toHaveAttribute("href", "/learn/licensing/casino-licenses-explained");
  await expect(page.getByRole("link", { name: /Responsible Gambling Tools Explained/ })).toHaveAttribute("href", "/learn/responsible-gambling/responsible-gambling-tools");

  const transition = page.getByRole("complementary", { name: "Optional offer comparison" });
  await expect(transition.getByRole("link", { name: "Compare published offers" })).toHaveAttribute("href", "/bonuses");
  expect(await page.locator("#related-reading").evaluate((related) => related.compareDocumentPosition(document.querySelector('[aria-label="Optional offer comparison"]')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  await expect(page.locator('[data-bonus-guide] a[href^="/r/"], [data-bonus-guide] a[href^="/go/"]')).toHaveCount(0);
  await expect(page.locator('[data-bonus-guide] a[href="/tools/budget-calculator"]')).toHaveCount(0);
});

test("TOC anchors and native FAQ work with the keyboard", async ({ page }) => {
  await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
  const toc = page.getByRole("navigation", { name: "On this page" });
  await expect(toc.getByRole("link")).toHaveCount(7);
  for (const href of await toc.getByRole("link").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toBeTruthy();
    await expect(page.locator(href!)).toHaveCount(1);
  }

  const firstSummary = page.locator("#faq details").first().locator("summary");
  await firstSummary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#faq details").first()).toHaveAttribute("open", "");

  const visibleQuestions = await page.locator("#faq details > summary").allTextContents();
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? "{}")));
  const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
  expect(faqSchema.mainEntity.map((item: { name: string }) => item.name)).toEqual(visibleQuestions.map((question) => question.replace(/\+$/, "").trim()));
});

test("the complete article and transition remain usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Claims stay attached to their source state." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Compare published offers" })).toHaveAttribute("href", "/bonuses");
  await expect(page.getByRole("link", { name: "Open Help" })).toHaveAttribute("href", "/responsible-gambling");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 430, height: 844 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 800 },
  { width: 320, height: 720 },
] as const) {
  test(`Bonus Guide follows the responsive contract at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    const errors = collectRuntimeErrors(page);
    await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const outOfBounds = await page.locator("[data-bonus-guide] h1, [data-bonus-guide] h2, [data-bonus-guide] h3, [data-bonus-guide] a, [data-bonus-guide] summary").evaluateAll((elements) => elements
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
