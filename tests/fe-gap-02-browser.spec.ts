import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const slugs = ["budgeting", "time-management", "bonus-terms", "self-exclusion", "deposit-limits", "cooling-off", "reality-checks", "casino-licenses", "payment-safety", "faq"];
const viewports = [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 430, height: 844 }, { width: 390, height: 844 }, { width: 375, height: 667 }, { width: 360, height: 800 }, { width: 320, height: 720 }];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function noOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}

test("all known Protected Help articles preserve the protected shell and commercial firewall", async ({ page }) => {
  const errors = collectErrors(page);
  for (const slug of slugs) {
    const response = await page.goto(`${baseUrl}/responsible-gambling/${slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), slug).toBe(200);
    await expect(page.locator("[data-protected-help-shell]")).toHaveCount(1);
    await expect(page.locator("[data-public-shell]")).toHaveCount(0);
    await expect(page.locator('[data-protected-help="header"]')).toHaveCount(1);
    await expect(page.locator('[data-protected-help="footer"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const article = page.locator("[data-protected-help-article]");
    await expect(article.locator('a[href^="/casinos"],a[href^="/bonuses"],a[href^="/best-offers"],a[href^="/compare"],a[href^="/r/"],a[href^="/go/"]')).toHaveCount(0);
    const external = await article.locator('a[href^="http://"],a[href^="https://"]').evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
    expect(external.every((href) => href === "https://www.gamstop.co.uk/")).toBe(true);
    expect(await noOverflow(page), slug).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("representative Protected Help articles fit every required viewport with reduced motion", async ({ browser }) => {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = collectErrors(page);
    for (const slug of ["self-exclusion", "cooling-off", "budgeting", "payment-safety"]) {
      await page.goto(`${baseUrl}/responsible-gambling/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(await noOverflow(page), `${slug} at ${viewport.width}`).toBe(true);
    }
    expect(errors, `${viewport.width}px errors`).toEqual([]);
    await context.close();
  }
});

test("Cooling-off and unknown Help routes fail closed without unsupported or commercial guidance", async ({ page }) => {
  await page.goto(`${baseUrl}/responsible-gambling/cooling-off`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Content review required", { exact: true })).toBeVisible();
  await expect(page.getByText("Terms unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Content blocked", { exact: true })).toBeVisible();
  await expect(page.locator("[data-protected-help-article='cooling-off']")).not.toContainText(/24-hour|48-hour|cancel early|available everywhere/i);
  const response = await page.goto(`${baseUrl}/responsible-gambling/not-a-known-help-article`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Return to Help home" })).toHaveAttribute("href", "/responsible-gambling");
  await expect(page.locator('[data-protected-help-recovery] a[href^="/casinos"], [data-protected-help-recovery] a[href^="/bonuses"], [data-protected-help-recovery] a[href^="/r/"]')).toHaveCount(0);
});

test("Protected Help articles remain fully readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const slug of slugs) {
    const response = await page.goto(`${baseUrl}/responsible-gambling/${slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Direct answer", { exact: true })).toBeVisible();
  }
  await context.close();
});

test("FAQ uses five semantic disclosure groups and remains usable at every viewport", async ({ browser }) => {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = collectErrors(page);
    const response = await page.goto(`${baseUrl}/faq`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const label of ["01 · About the product", "02 · Programme & private tools", "03 · Casinos, offers & money", "04 · Affiliate & editorial", "05 · Privacy & Help"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByText(/Help center|FAQ schema|Internal guide links/i)).toHaveCount(0);
    await expect(page.locator("details")).toHaveCount(14);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/faq$/);
    expect(await noOverflow(page), `${viewport.width}px`).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  }
});

test("FAQ disclosure keyboard and no-JS contracts remain native", async ({ browser, page }) => {
  await page.goto(`${baseUrl}/faq`, { waitUntil: "domcontentloaded" });
  const summary = page.locator("summary").filter({ hasText: "Is SevenBet an online casino?" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/does not accept wagers or deposits/)).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 720 } });
  const noJsPage = await context.newPage();
  await noJsPage.goto(`${baseUrl}/faq`, { waitUntil: "domcontentloaded" });
  await expect(noJsPage.locator("details[open]")).toHaveCount(5);
  await expect(noJsPage.getByRole("link", { name: /Open Protected Help/ })).toHaveAttribute("href", "/responsible-gambling");
  await context.close();
});

test("commercial handoff confirms, cancels and invokes only the managed redirect", async ({ page }) => {
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
  const action = page.locator('a[aria-haspopup="dialog"]').first();
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", /^\/outbound\/[a-z0-9-]+$/);
  await action.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "You are leaving SevenBet." })).toBeVisible();
  const managed = dialog.getByRole("link", { name: /Continue to eligible partner/ });
  await expect(managed).toHaveAttribute("href", /^\/r\/[a-z0-9-]+$/);
  expect(await managed.getAttribute("href")).not.toMatch(/^https?:/);
  await expect(dialog.getByRole("button", { name: "Cancel and stay on SevenBet" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(action).toBeFocused();
});

test("invalid managed redirects and no-JS outbound flows use governed same-origin recovery", async ({ browser, page }) => {
  const response = await page.goto(`${baseUrl}/r/not-a-real-managed-destination`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/outbound\/unavailable$/);
  await expect(page.getByRole("heading", { name: "Destination unavailable." })).toBeVisible();
  await expect(page.getByText("No destination · No redirect · No substitute offer", { exact: true })).toBeVisible();
  await expect(page.locator('main a[href^="/casinos"],main a[href^="/bonuses"],main a[href^="/best-offers"],main a[href^="http"]')).toHaveCount(0);
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await context.newPage();
  await noJsPage.goto(`${baseUrl}/outbound/example-managed-action`, { waitUntil: "domcontentloaded" });
  await expect(noJsPage.getByRole("heading", { name: "You are leaving SevenBet." })).toBeVisible();
  await expect(noJsPage.getByRole("link", { name: "Continue to eligible partner" })).toHaveAttribute("href", "/r/example-managed-action");
  expect(await noOverflow(noJsPage)).toBe(true);
  await context.close();
});

test("Best Offers, Bonuses, sitemap and llms expose corrected semantics", async ({ page }) => {
  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toHaveCount(1);
  const sitemap = await (await page.request.get(`${baseUrl}/sitemap.xml`)).text();
  expect(sitemap).not.toContain("/privacy");
  expect(sitemap).not.toContain("/terms");
  await page.goto(`${baseUrl}/privacy`, { waitUntil: "domcontentloaded" });
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toMatch(/noindex.*follow/i);
  await expect(page.locator('footer a[href="/privacy"]')).toHaveCount(1);
  await expect(page.locator('footer a[href="/terms"]')).toHaveCount(1);
  const llms = await (await page.request.get(`${baseUrl}/llms.txt`)).text();
  expect(llms).toContain("limit chosen by the user");
  expect(llms).toContain("does not generate a stop-loss recommendation");
  expect(llms).not.toMatch(/session limit and stop-loss calculator|Recommended stop-loss|safe gambling budget/i);
});
