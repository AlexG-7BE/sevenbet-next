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
  await open(page, "/help");
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Privacy.*by default\./i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex.*follow/i,
  );
});

test("retired standalone control tools consolidate into Responsible Gambling", async ({ request }) => {
  for (const route of ["/self-check", "/tools/budget-calculator"]) {
    const response = await request.get(`${baseUrl}${route}`, { maxRedirects: 0 });
    expect(response.status(), route).toBe(308);
    expect(response.headers().location, route).toBe("/responsible-gambling");
  }
});

test("FAQ disclosures remain native and keyboard operable", async ({ page }) => {
  await open(page, "/faq");
  const summary = page.locator("summary").filter({ hasText: "What is B4GAMBLE?" });
  const answer = page.getByText(/Three things in one product/);
  await expect(answer).toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(answer).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(answer).toBeVisible();
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
  const action = page.getByRole("link", { name: "Start Programme" }).first();
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
    "self-recognition",
    "programme-theatre",
    "recognise",
    "build",
    "apply",
    "evidence",
    "trust-boundary",
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
