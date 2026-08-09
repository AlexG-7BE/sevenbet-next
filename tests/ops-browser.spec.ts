import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function open(page: Page, route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
}

test("Public Shell renders one semantic, keyboard-usable shell", async ({ page }) => {
  await open(page, "/");
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
});

test("Protected Help remains isolated and non-commercial", async ({ page }) => {
  await open(page, "/responsible-gambling");
  await expect(page.locator("[data-protected-help-shell]")).toHaveCount(1);
  await expect(page.locator("[data-public-shell]")).toHaveCount(0);
  await expect(
    page.locator(
      'main a[href^="/casinos"], main a[href^="/bonuses"], main a[href^="/r/"], main a[href^="/go/"]',
    ),
  ).toHaveCount(0);
});

test("Privacy is substantive and remains noindex, follow", async ({ page }) => {
  await open(page, "/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PRIVACY POLICY");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex.*follow/i,
  );
});

test("Self-Check stays local and exposes a protected result path", async ({ page }) => {
  await open(page, "/self-check");
  await page.getByRole("button", { name: "Start private reflection" }).click();
  for (let index = 0; index < 8; index += 1) {
    await page.getByRole("radio", { name: "No", exact: true }).check();
    await page
      .getByRole("button", { name: index === 7 ? "View reflection" : "Next", exact: true })
      .click();
  }
  await expect(page.locator("[data-self-check-state^='result-']")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Protected Help" })).toBeVisible();
  await expect(page.locator('main a[href^="/r/"], main a[href^="/go/"]')).toHaveCount(0);
});

test("Personal Limit Tracker calculates only from user-entered values", async ({ page }) => {
  await open(page, "/tools/budget-calculator");
  await page.getByLabel("Your gambling limit for this period (£)").fill("100");
  await page.getByLabel("Amount already used (£)").fill("85");
  await page.getByLabel(/Amount you are considering next/).fill("25");
  await page.getByRole("button", { name: "Check my limit" }).click();
  await expect(page.locator("[data-limit-tracker-state='planned-over']")).toBeVisible();
  await expect(page.locator('main a[href^="/r/"], main a[href^="/go/"]')).toHaveCount(0);
});

test("FAQ disclosures remain native and keyboard operable", async ({ page }) => {
  await open(page, "/faq");
  const summary = page.locator("summary").filter({ hasText: "Is B4GAMBLE an online casino?" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/does not accept wagers or deposits/)).toBeVisible();
});

test("commercial confirmation, no-JS, and invalid managed routes fail closed", async ({ browser, page }) => {
  await open(page, "/outbound/example-managed-action");
  await expect(page).toHaveURL(/\/outbound\/unavailable$/);
  await expect(page.getByText("No destination · No redirect · No substitute offer")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to eligible partner" })).toHaveCount(0);

  const noJsContext = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${baseUrl}/outbound/example-managed-action`, { waitUntil: "domcontentloaded" });
  await expect(noJsPage).toHaveURL(/\/outbound\/unavailable$/);
  await expect(noJsPage.getByText("No destination · No redirect · No substitute offer")).toBeVisible();
  await noJsContext.close();

  const response = await page.goto(`${baseUrl}/r/not-a-real-managed-destination`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/outbound\/unavailable$/);
  await expect(page.getByText("No destination · No redirect · No substitute offer")).toBeVisible();
  await expect(page.locator('main a[href^="/casinos"], main a[href^="/bonuses"]')).toHaveCount(0);
});

test("shared Action preserves hover and focus visual contracts", async ({ page }) => {
  await open(page, "/");
  const action = page.getByRole("link", { name: "Start the 10-Step Program" }).first();
  await action.hover();
  await expect
    .poll(() => action.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe("none");
  await action.focus();
  const focus = await action.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineOffset: style.outlineOffset,
      outlineWidth: style.outlineWidth,
    };
  });
  expect(focus).toEqual({ focusVisible: true, outlineOffset: "3px", outlineWidth: "3px" });
});

test("Home renders its representative responsive hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const order = await page
    .locator("[data-home-section]")
    .evaluateAll((sections) => sections.map((section) => section.getAttribute("data-home-section")));
  expect(order).toEqual([
    "hero",
    "programme-theatre",
    "self-recognition",
    "recognise",
    "build",
    "apply",
    "programme-tools",
    "evidence",
    "final-programme-cta",
  ]);
});

test("10 Steps renders representative signed-out content without invented progress", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/10-steps");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-ten-steps-section='mission-map']")).toBeVisible();
  await expect(page.locator("[data-account-state='anonymous']")).toHaveCount(1);
  await expect(page.getByText("Live values from your server-owned Programme record.")).toHaveCount(0);
  await expect(page.getByText("WELCOME BACK")).toHaveCount(0);
});
