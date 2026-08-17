import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("default directory exposes server-owned offers and page two continues at position 25", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Value, measured/i })).toBeVisible();
  await expect(page.locator('article[class*="comparisonRow"]')).toHaveCount(24);
  await expect(page.getByText(/Page 1 \/ \d+/)).toBeVisible();
  const pageTwo = await page.goto(`${baseUrl}/bonuses?page=2`, { waitUntil: "networkidle" });
  expect(pageTwo?.status()).toBe(200);
  await expect(page.locator('article[class*="comparisonRow"]')).toHaveCount(24);
  await expect(page.getByText(/Page 2 \/ \d+/)).toBeVisible();
  await expect(page.locator('[class*="compactPosition"]').filter({ hasText: "25" }).first()).toBeVisible();
});

test("every supported URL filter and sort is server owned", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  const form = page.locator('form[action="/bonuses"]').first();
  const selectCases = [
    ["Country preference", "country"], ["Bonus type", "type"], ["Payment method", "payment"],
    ["Crypto support", "crypto"], ["Commercial availability", "availability"],
  ] as const;
  for (const [label, parameter] of selectCases) {
    const select = form.getByLabel(label);
    const value = await select.locator("option").nth(1).getAttribute("value");
    expect(value).toBeTruthy();
    const response = await page.goto(`${baseUrl}/bonuses?${parameter}=${encodeURIComponent(value!)}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByLabel("Active filters")).toBeVisible();
  }
  for (const parameter of ["maxDeposit=1000", "maxWagering=100", "maxDeposit=1000&maxWagering=100&country=GB&type=WELCOME&availability=AVAILABLE"]) {
    const response = await page.goto(`${baseUrl}/bonuses?${parameter}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByLabel("Active filters")).toBeVisible();
  }
  for (const sort of ["editorial", "newest", "highest-bonus", "lowest-wagering", "lowest-deposit"]) {
    const response = await page.goto(`${baseUrl}/bonuses?sort=${sort}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('select[name="sort"]').first()).toHaveValue(sort);
  }
});

test("invalid filters fail safely while material terms and commercial states remain truthful", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses?country=ZZ`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: /Value, measured/i })).toBeVisible();
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);

  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  for (const label of ["Min deposit", "Wagering", "Max bonus", "Payout"]) await expect(page.getByText(label, { exact: true }).filter({ visible: true }).first()).toBeVisible();
  const governedActions = await page.locator('a[href^="/r/"]').count();
  const unavailableActions = await page.getByText("No governed visit", { exact: true }).count();
  expect(governedActions + unavailableActions).toBeGreaterThan(0);
  expect(unavailableActions).toBeGreaterThan(0);
  if (governedActions > 0) {
    const action = page.locator('a[href^="/r/"]').first();
    const colours = await action.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, foreground: style.color };
    });
    expect(colours).toEqual({ background: "rgb(16, 15, 15)", foreground: "rgb(255, 255, 255)" });
  }
  for (const link of await page.locator('a[href^="/r/"]').all()) await expect(link).toHaveAttribute("href", /^\/r\/demo-/);
});

test("canonical, filtered robots and ItemList positions are server rendered", async ({ page, request }) => {
  await page.goto(`${baseUrl}/bonuses?country=GB&page=2`, { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/bonuses$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  const json = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")).find((item) => item["@type"] === "ItemList"));
  expect(json["@type"]).toBe("ItemList");
  expect(json.itemListElement[0]?.position).toBe(25);
  const html = await (await request.get(`${baseUrl}/bonuses`)).text();
  expect(html).toContain('method="get"');
  expect(html).toContain("Bonus result pages");
  expect(html).toContain("Next →");
});

test("responsive pages have visible focus, no overflow and no console or hydration errors", async ({ browser }) => {
  for (const width of [1440, 1280, 430, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 920 }, isMobile: width <= 430 });
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}/bonuses?country=GB&sort=lowest-deposit`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px status`).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${width}px overflow`).toBe(false);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement !== document.body && document.activeElement?.matches(":focus-visible")), `${width}px focus`).toBe(true);
    expect(errors, `${width}px console`).toEqual([]);
    await page.close();
  }
});

test("mobile filter dialog is keyboard dismissible and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: /Filters/i });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: /Filter Bonuses/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close filters" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("mobile presentation follows the final 390px handoff composition", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: /Value, measured/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All bonuses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Run the numbers/i })).toBeVisible();
  const hero = page.locator('main section[class*="hero"]').first();
  const feature = page.locator('section[aria-labelledby="bonus-shortlist-title"] article').first();
  const result = page.locator('article[class*="comparisonRow"]').first();
  expect(Math.round((await hero.boundingBox())!.height)).toBe(586);
  expect(Math.round((await feature.boundingBox())!.width)).toBe(360);
  expect(Math.round((await result.boundingBox())!.height)).toBeGreaterThanOrEqual(220);
});

test("bonus calculator recomputes turnover, weighting cost and net value", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  const calculator = page.locator('section[aria-labelledby="bonus-calculator-title"]');
  const valueFor = (label: string) => calculator.getByText(label, { exact: true }).locator("..").locator("dd");

  await expect(valueFor("Required turnover")).toHaveText("€7,000");
  await expect(valueFor("Effective at your weighting")).toHaveText("€7,000");
  await expect(valueFor("Expected net value")).toHaveText("−€80");

  await calculator.getByLabel("Deposit + bonus").check({ force: true });
  await calculator.getByLabel("Table · 50%").check({ force: true });

  await expect(valueFor("Required turnover")).toHaveText("€14,000");
  await expect(valueFor("Effective at your weighting")).toHaveText("€28,000");
  await expect(valueFor("Expected net value")).toHaveText("−€920");
});
