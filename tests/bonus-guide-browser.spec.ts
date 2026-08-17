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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Wagering requirements,\s*explained with real numbers\./i);
  await expect(page.locator('[data-handoff-page="article"]')).toHaveCount(1);
  await expect(page.getByText("Not sponsored · real-money tested")).toBeVisible();
  await expect(page.getByText("Bonus received")).toBeVisible();
  await expect(page.getByText("€200", { exact: true })).toBeVisible();
  await expect(page.getByText("Reviewed by two editors · sources on request")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the supplied guide links and Programme transition are mapped exactly", async ({ page }) => {
  await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "All guides →" })).toHaveAttribute("href", "/learn");
  await expect(page.getByRole("link", { name: "Start Programme" }).last()).toHaveAttribute("href", "/program");
  await expect(page.getByRole("link", { name: "Open Help — no offers there →" })).toHaveAttribute("href", "/help");
  await expect(page.getByRole("link", { name: "How we test →" })).toHaveAttribute("href", "/methodology");
  await expect(page.locator('[data-handoff-page="article"] a[href^="/r/"], [data-handoff-page="article"] a[href^="/go/"]')).toHaveCount(0);
  await expect(page.locator('[data-handoff-page="article"] a[href="/tools/budget-calculator"]')).toHaveCount(0);
});

test("the supplied visual guide index is complete and its Help action is keyboard reachable", async ({ page }) => {
  await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "networkidle" });
  const toc = page.locator('[data-handoff-page="article"] [data-mob="toc"]');
  for (const label of ["What 35x really means", "The maths on a real offer", "Game weighting — the quiet tax", "When smaller wins", "The checklist"]) {
    await expect(toc).toContainText(label);
  }
  const help = toc.locator('a[href="/help"]');
  await help.focus();
  await expect(help).toBeFocused();
});

test("the complete article and transition remain usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/bonus-guide`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What 35x really means" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Programme" }).last()).toHaveAttribute("href", "/program");
  await expect(page.locator('[data-handoff-page="article"] a[href="/help"]').filter({ hasText: "Open Help" })).toHaveCount(1);
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
    const outOfBounds = await page.locator('[data-handoff-page="article"] h1, [data-handoff-page="article"] h2, [data-handoff-page="article"] h3, [data-handoff-page="article"] a, [data-handoff-page="article"] summary').evaluateAll((elements) => elements
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
