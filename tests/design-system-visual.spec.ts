import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function openStable(page: Page, route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: "*,*::before,*::after{caret-color:transparent!important;animation:none!important;transition:none!important}",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
}

async function matchViewport(page: Page, name: string) {
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    fullPage: false,
    maxDiffPixelRatio: 0.001,
  });
}

test("Home desktop reference", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStable(page, "/");
  await matchViewport(page, "home-desktop.png");
});

test("Home mobile reference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStable(page, "/");
  await matchViewport(page, "home-mobile.png");
});

test("Public shell mobile menu reference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStable(page, "/casinos");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await matchViewport(page, "public-menu-mobile.png");
});

test("Protected Help desktop reference", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStable(page, "/responsible-gambling");
  await expect(page.locator("[data-public-shell]")).toHaveCount(0);
  await matchViewport(page, "protected-help-desktop.png");
});

test("Protected Help mobile reference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStable(page, "/responsible-gambling");
  await matchViewport(page, "protected-help-mobile.png");
});

test("FAQ desktop reference", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStable(page, "/faq");
  await matchViewport(page, "faq-desktop.png");
});

test("Legal document mobile reference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStable(page, "/privacy");
  await matchViewport(page, "privacy-mobile.png");
});

test("Self-check question mobile reference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStable(page, "/self-check");
  await page.getByRole("button", { name: "Start private reflection" }).click();
  await expect(page.locator("[data-self-check-state='question']")).toBeVisible();
  await matchViewport(page, "self-check-question-mobile.png");
});

test("Personal limit result desktop reference", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStable(page, "/tools/budget-calculator");
  await page.getByLabel("Your gambling limit for this period (£)").fill("100");
  await page.getByLabel("Amount already used (£)").fill("85");
  await page.getByLabel(/Amount you are considering next/).fill("25");
  await page.getByRole("button", { name: "Check my limit" }).click();
  await expect(page.locator("[data-limit-tracker-state='planned-over']")).toBeVisible();
  await matchViewport(page, "limit-result-desktop.png");
});

test("About mobile reference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStable(page, "/about");
  await matchViewport(page, "about-mobile.png");
});

test("shared Action exposes production hover and keyboard-focus states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStable(page, "/");

  const action = page.getByRole("link", { name: "Start the 10-Step Program" }).first();
  const expectedHover = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.background = "var(--sb-action-primary-hover)";
    document.body.append(probe);
    const background = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return background;
  });

  await action.hover();
  await expect.poll(() => action.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(expectedHover);
  await expect.poll(() => action.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");

  await action.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  const focus = await action.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      offset: style.outlineOffset,
      style: style.outlineStyle,
      visible: element.matches(":focus-visible"),
      width: style.outlineWidth,
    };
  });
  expect(focus).toEqual({ offset: "4px", style: "solid", visible: true, width: "3px" });
});
