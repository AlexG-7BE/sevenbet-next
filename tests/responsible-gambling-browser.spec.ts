import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function browserErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("Protected Help renders one isolated, non-commercial shell", async ({ page }) => {
  const errors = await browserErrors(page);
  const response = await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "networkidle" });

  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-protected-help-shell]")).toHaveCount(1);
  await expect(page.locator("[data-public-shell]")).toHaveCount(0);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Get support.*without offers\./i);
  await expect(page.getByText("No casino · No bonus · No affiliate")).toBeVisible();
  await expect(page.getByRole("link", { name: /casinos|bonuses|best offers|visit casino|claim bonus/i })).toHaveCount(0);
  await expect(page.locator('a[href^="/r/"], a[href^="/go/"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("keyboard focus is visible and external-resource meaning is explicit", async ({ page }) => {
  await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "domcontentloaded" });
  const firstLink = page.getByRole("link", { name: "B4GAMBLE Help home" });
  await firstLink.focus();
  const focusStyle = await firstLink.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(focusStyle).not.toBe("none");

  const gamCare = page.getByRole("link", { name: /Open GamCare.*opens an external site in a new tab/i });
  await expect(gamCare).toHaveAttribute("href", "https://www.gamcare.org.uk/get-support/");
  await expect(gamCare).toHaveAttribute("target", "_blank");
  await expect(gamCare).toHaveAttribute("rel", "noopener noreferrer");

  const undersizedTargets = await page.locator("[data-protected-help-shell] a").evaluateAll((targets) => targets
    .filter((target) => {
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      const onScreen = rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
      return onScreen && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    })
    .map((target) => ({ text: target.textContent?.trim(), width: target.getBoundingClientRect().width, height: target.getBoundingClientRect().height })));
  expect(undersizedTargets).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 800 },
]) {
  test(`Protected Help fits ${viewport.width}px without losing content`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    const errors = await browserErrors(page);
    await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await expect(page.getByRole("link", { name: /Find external support/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open GamCare/i })).toBeVisible();
    await expect(page.getByText("No casino · No bonus · No affiliate")).toBeVisible();
    expect(errors).toEqual([]);
    await page.close();
  });
}

test("reduced motion and no-JS preserve the full Help route", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/responsible-gambling`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open GamCare/i })).toBeVisible();
  await expect(page.getByText(/B4GAMBLE does not save your choices here/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await context.close();
});
