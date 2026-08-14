import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function answerSelfCheck(page: Page, answers: readonly ("No" | "Once" | "More than once" | "Not sure / prefer not to answer")[]) {
  await page.getByRole("button", { name: "Start private reflection" }).click();
  for (const [index, answer] of answers.entries()) {
    await page.getByRole("radio", { name: answer, exact: true }).check();
    await page.getByRole("button", { name: index === answers.length - 1 ? "View reflection" : "Next", exact: true }).click();
  }
}

for (const legal of [
  { path: "/privacy", title: "PRIVACY POLICY", contact: "privacy@7be.io", sections: 12 },
  { path: "/terms", title: "TERMS OF USE", contact: "info@7be.io", sections: 12 },
] as const) {
  test(`${legal.path} renders the approved substantive legal document`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(`${baseUrl}${legal.path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
    await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(legal.title);
    await expect(page.getByRole("navigation", { name: "On this page" }).getByRole("link")).toHaveCount(legal.sections);
    await expect(page.getByRole("link", { name: legal.contact, exact: true }).first()).toHaveAttribute("href", `mailto:${legal.contact}`);
    await expect(page.getByText(/7BE Inc\., trading as B4GAMBLE/).first()).toBeVisible();
    await expect(page.getByText(/447 Broadway, 2nd Floor, 1663/).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${legal.path}$`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*follow/i);
    const firstTocLink = page.getByRole("navigation", { name: "On this page" }).getByRole("link").first();
    await firstTocLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#who-we-are$|#about-b4gamble$/);
    expect(errors).toEqual([]);
  });
}

test("Privacy and Terms remain readable without JavaScript", async ({ browser }) => {
  for (const path of ["/privacy", "/terms"]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByText("Jump to a section ↓", { exact: true }).click();
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await context.close();
  }
});

test("Self-Check supports back, skip, keyboard selection and the review result", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${baseUrl}/self-check`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start private reflection" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("radio", { name: "Not sure / prefer not to answer" }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: "Once", exact: true }).check();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Not sure / prefer not to answer" })).toBeChecked();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  for (let index = 2; index < 8; index += 1) {
    await page.getByRole("radio", { name: "No", exact: true }).check();
    await page.getByRole("button", { name: index === 7 ? "View reflection" : "Next", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Some areas worth reviewing" })).toBeVisible();
  await expect(page.locator("[data-self-check-state='result-review'] [role='status']")).toBeFocused();
  expect(errors).toEqual([]);
});

test("Self-Check routes an all-No path to no current concerns", async ({ page }) => {
  await page.goto(`${baseUrl}/self-check`, { waitUntil: "domcontentloaded" });
  await answerSelfCheck(page, Array(8).fill("No"));
  await expect(page.getByRole("heading", { name: "No current concerns flagged" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review your personal boundaries" })).toHaveAttribute("href", "/program");
  await expect(page.getByRole("link", { name: "Open Protected Help" }).last()).toHaveAttribute("href", "/responsible-gambling");
});

test("Self-Check routes material-impact answers Help-first and restarts locally", async ({ page }) => {
  await page.goto(`${baseUrl}/self-check`, { waitUntil: "domcontentloaded" });
  await answerSelfCheck(page, ["No", "No", "No", "No", "Once", "No", "No", "No"]);
  await expect(page.getByRole("heading", { name: "Help-first" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Protected Help" }).last()).toHaveAttribute("href", "/responsible-gambling");
  await page.getByRole("button", { name: "Restart reflection" }).click();
  await expect(page.getByRole("button", { name: "Start private reflection" })).toBeVisible();
});

test("Self-Check responses clear on refresh and no-JS keeps Help available", async ({ browser, page }) => {
  await page.goto(`${baseUrl}/self-check`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start private reflection" }).click();
  await page.getByRole("radio", { name: "Once", exact: true }).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Start private reflection" })).toBeVisible();

  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await context.newPage();
  await noJsPage.goto(`${baseUrl}/self-check`, { waitUntil: "domcontentloaded" });
  await expect(noJsPage.getByRole("heading", { name: "Self-Check needs JavaScript." })).toBeVisible();
  await expect(noJsPage.getByRole("link", { name: "Open Protected Help" })).toHaveAttribute("href", "/responsible-gambling");
  await context.close();
});

test("Limit Tracker calculates below-limit and planned-over states from the user's values", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${baseUrl}/tools/budget-calculator`, { waitUntil: "networkidle" });
  await page.getByLabel("Your gambling limit for this period (£)").fill("100");
  await page.getByLabel("Amount already used (£)").fill("60");
  await page.getByRole("button", { name: "Check my limit" }).click();
  await expect(page.getByRole("heading", { name: /Remaining under the limit you entered: £40\.00/ })).toBeVisible();
  await expect(page.getByText("You have used 60% of your own limit.")).toBeVisible();
  await page.getByRole("button", { name: "Adjust entries" }).click();
  await page.getByLabel("Amount you are considering next (£) · optional").fill("50");
  await page.getByRole("button", { name: "Check my limit" }).click();
  await expect(page.getByRole("heading", { name: /£10\.00 above the limit you set/ })).toBeVisible();
  await page.getByRole("button", { name: "Reduce planned amount" }).click();
  await expect(page.getByLabel("Amount you are considering next (£) · optional")).toBeFocused();
  expect(errors).toEqual([]);
});

test("Limit Tracker validates zero, supports decimals, at/over state and reset", async ({ page }) => {
  await page.goto(`${baseUrl}/tools/budget-calculator`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Your gambling limit for this period (£)").fill("0");
  await page.getByLabel("Amount already used (£)").fill("0");
  await page.getByRole("button", { name: "Check my limit" }).click();
  await expect(page.getByText("Enter a limit greater than £0.")).toBeVisible();
  await page.getByLabel("Your gambling limit for this period (£)").fill("100.50");
  await page.getByLabel("Amount already used (£)").fill("100.50");
  await page.getByRole("button", { name: "Check my limit" }).click();
  await expect(page.getByRole("heading", { name: "You have reached or exceeded the limit you set." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Protected Help / Pause options" })).toHaveAttribute("href", "/responsible-gambling");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Your gambling limit for this period (£)")).toHaveValue("");
});

test("Limit Tracker values clear on refresh and no-JS gives a manual fallback", async ({ browser, page }) => {
  await page.goto(`${baseUrl}/tools/budget-calculator`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Your gambling limit for this period (£)").fill("250");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Your gambling limit for this period (£)")).toHaveValue("");
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await context.newPage();
  await noJsPage.goto(`${baseUrl}/tools/budget-calculator`, { waitUntil: "domcontentloaded" });
  await expect(noJsPage.getByRole("heading", { name: "Interactive tracker needs JavaScript." })).toBeVisible();
  await expect(noJsPage.getByText(/chosen limit minus the amount already used/)).toBeVisible();
  await expect(noJsPage.getByRole("link", { name: "Open Protected Help" })).toHaveAttribute("href", "/responsible-gambling");
  await context.close();
});

test("Self-Check and Limit Tracker contain no commercial body actions", async ({ page }) => {
  for (const route of ["/self-check", "/tools/budget-calculator"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    const body = route === "/self-check" ? page.locator("[data-self-check-page]") : page.locator("[data-limit-tracker-page]");
    await expect(body.locator('a[href^="/casinos"],a[href^="/bonuses"],a[href^="/best-offers"],a[href^="/compare"],a[href^="/r/"],a[href^="/go/"]')).toHaveCount(0);
    await expect(body.locator('a[href^="http://"],a[href^="https://"]')).toHaveCount(0);
  }
});

test("FE-GAP routes have one H1, no overflow, no browser errors, and reduced-motion safety", async ({ browser }) => {
  const routes = ["/privacy", "/terms", "/self-check", "/tools/budget-calculator", "/about"];
  const viewports = [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 430, height: 844 }, { width: 390, height: 844 }, { width: 375, height: 667 }, { width: 360, height: 800 }, { width: 320, height: 720 }];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = collectErrors(page);
    for (const route of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} at ${viewport.width}`).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${route} overflow at ${viewport.width}`).toBe(false);
    }
    expect(errors, `console errors at ${viewport.width}`).toEqual([]);
    await context.close();
  }
});

test("About uses the 1180px desktop hero and preserves the approved mobile height", async ({ browser }) => {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded" });
  await expect(desktop.locator("[data-about-document]")).toHaveAttribute("data-figma-compact-hero", "923:2694");
  expect(await desktop.locator('[data-about-section="hero"]').evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(1180);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded" });
  expect(await mobile.locator('[data-about-section="hero"]').evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(772);
  await desktop.close();
  await mobile.close();
});
