import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("signed-out desktop public shell has one semantic chrome and approved destinations", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Casinos", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Open Help", exact: true })).toHaveAttribute("href", "/responsible-gambling");
  await expect(page.getByText(/B4GAMBLE may receive compensation from some outbound links/i)).toBeVisible();
  const undersizedTargets = await page.locator("[data-public-shell] a, [data-public-shell] button").evaluateAll((targets) => targets
    .filter((target) => {
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    })
    .map((target) => ({ text: target.textContent?.trim(), rect: target.getBoundingClientRect().toJSON() })));
  expect(undersizedTargets).toEqual([]);
});

test("mobile menu is modal, Escape-closeable and restores focus", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.focus();
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Site navigation" }).getByRole("link", { name: "Log in", exact: true })).toHaveAttribute("href", "/login");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site navigation" })).not.toBeVisible();
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.close();
});

test("standalone login is a responsive public account surface with Programme account creation secondary", async ({ page }) => {
  await page.goto(`${baseUrl}/login?returnTo=https%3A%2F%2Fattacker.invalid`, { waitUntil: "networkidle" });
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "current-password");
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start the 10-Step Programme" })).toHaveAttribute("href", "/program");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Programme and protected Help never receive the commercial public shell", async ({ page }) => {
  for (const route of ["/program", "/responsible-gambling", "/responsible-gambling/cooling-off"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-public-shell]")).toHaveCount(0);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

for (const boundary of [
  { route: "/definitely-missing", publicShell: true },
  { route: "/program/definitely-missing", publicShell: false },
  { route: "/responsible-gambling/definitely-missing", publicShell: false },
]) {
  test(`${boundary.route} keeps its 404 shell boundary`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    const response = await page.goto(`${baseUrl}${boundary.route}`, { waitUntil: "networkidle" });

    expect(response?.status()).toBe(404);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("body > header[data-public-shell]")).toHaveCount(boundary.publicShell ? 1 : 0);
    await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(boundary.publicShell ? 1 : 0);

    if (!boundary.publicShell) {
      await expect(page.getByRole("link", { name: /casinos|bonuses|best offers|affiliate/iu })).toHaveCount(0);
    }

    const unexpectedBrowserErrors = browserErrors.filter(
      (message) => message !== "Failed to load resource: the server responded with a status of 404 (Not Found)",
    );
    expect(unexpectedBrowserErrors).toEqual([]);
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 800 },
]) {
  test(`public shell fits ${viewport.width}px without horizontal overflow`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.close();
  });
}

test("public shell reflows at the effective layout width of 200% zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
});
