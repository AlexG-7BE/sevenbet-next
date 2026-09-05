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
  const representative = page.locator("#eu-uk-representative");
  await expect(representative.getByRole("heading", { name: "European Union (EU)" })).toBeVisible();
  await expect(representative).toContainText("Prighter EU Rep GmbH");
  await expect(representative).toContainText("Article 27 of the EU GDPR");
  await expect(representative.getByRole("heading", { name: "United Kingdom (UK)" })).toBeVisible();
  await expect(representative).toContainText("Prighter Ltd");
  await expect(representative).toContainText("Article 27 of the UK GDPR");
  await expect(representative.getByRole("link", { name: "Prighter data-subject portal" })).toHaveAttribute(
    "href",
    "https://app.prighter.com/portal/16936473521",
  );

  const certificates = [
    page.getByAltText("GDPR Certification: Art 27 representation by Prighter", { exact: true }),
    page.getByAltText("UK-GDPR Certification: Art 27 representation by Prighter", { exact: true }),
  ];
  await expect(certificates[0]).toHaveAttribute("src", /certificate_product=ART27/);
  await expect(certificates[1]).toHaveAttribute("src", /certificate_product=UKREP/);
  for (const certificate of certificates) {
    await certificate.scrollIntoViewIfNeeded();
    await expect.poll(() => certificate.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await representative.evaluate((section) => section.scrollWidth <= section.clientWidth)).toBe(true);
  for (const certificate of certificates) {
    expect((await certificate.boundingBox())?.width).toBeLessThanOrEqual(320);
  }
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
  const answer = page.getByText(/Three connected areas/);
  await expect(answer).toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(answer).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(answer).toBeVisible();
});

test("legacy outbound routes redirect internally and governed failures remain fail closed without confirmation UI", async ({ browser, page }) => {
  const legacy = await page.request.get(`${baseUrl}/outbound/example-managed-action`, { maxRedirects: 0 });
  expect(legacy.status()).toBe(307);
  expect(legacy.headers().location).toBe("/r/example-managed-action");
  await open(page, "/outbound/example-managed-action");
  await expect(page).toHaveURL(/\/outbound\/unavailable$/);
  await expect(page.getByText("No destination · No redirect · No substitute offer")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to eligible partner" })).toHaveCount(0);
  await expect(page.getByText("You are leaving B4GAMBLE.", { exact: true })).toHaveCount(0);

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
  expect(focus.focusVisible).toBe(true);
  expect(focus.outlineWidth).toBe("3px");
  expect(Number.parseFloat(focus.outlineOffset)).toBeGreaterThanOrEqual(1);
});

test("Home renders its representative responsive hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const order = await page.locator("[data-screen-label]").evaluateAll((sections) =>
    sections.map((section) => section.getAttribute("data-screen-label")),
  );
  expect(order).toEqual([
    "Hero",
    "Recognition",
    "A plan you can see",
    "Missions 01-03",
    "Missions 04-07",
    "Missions 08-10",
    "Built from evidence",
    "Why trust",
    "Final CTA",
  ]);
});

test("10 Steps renders representative signed-out content without invented progress", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/10-steps");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('[data-handoff-page="tenSteps"]')).toHaveCount(1);
  await expect(page.getByText("01", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("10", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Mission 01" }).first()).toHaveAttribute("href", "/program?entry=start");
  await expect(page.getByText("Live values from your server-owned Programme record.")).toHaveCount(0);
  await expect(page.getByText("WELCOME BACK")).toHaveCount(0);
});
