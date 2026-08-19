import { expect, test, type Page } from "@playwright/test";

const situation = "After difficult work days I keep opening betting apps late at night.";
const consoleErrors = new WeakMap<Page, string[]>();

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  consoleErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const knownNonceBaseline = text.includes("Content Security Policy directive 'style-src")
      || text.includes("Refused to apply a stylesheet because its hash, its nonce")
      || (text.includes("A tree hydrated but some attributes") && text.includes("nonce="));
    if (!knownNonceBaseline) errors.push(text);
  });
  return errors;
}

test.beforeEach(async ({ page }) => {
  trackConsoleErrors(page);
});

test.afterEach(async ({ page }) => {
  expect(consoleErrors.get(page) ?? []).toEqual([]);
});

function desktopForm(page: Page, action: "/bonuses" | "/casinos") {
  return page.locator(`form[action="${action}"][data-instant-discovery-form]`).first();
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function installProgramme(page: Page, calls: string[]) {
  let sensitiveAuthorityActive = false;
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON() as { journeyId: string };
    const now = Date.now();
    calls.push("access-proof");
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, authority: {
      version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId,
      createdAt: now, expiresAt: now + 3_600_000,
      termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
      privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13",
      adultConfirmedAt: now, termsAcceptedAt: now, privacyAcknowledgedAt: now,
      proof: "pa1.final-site-polish.browser-proof",
    } }) });
  });
  await page.route("**/api/program/program-ai/session", (route) => {
    calls.push("session");
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) });
  });
  await page.route("**/api/program/program-ai/authority", (route) => {
    const method = route.request().method();
    calls.push(`authority:${method}`);
    if (method === "POST") sensitiveAuthorityActive = true;
    if (method === "DELETE") sensitiveAuthorityActive = false;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: sensitiveAuthorityActive } }) });
  });
  await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    ok: true,
    result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: {
      startingPoint: situation,
      desiredChange: "Pause before opening an app.",
      broadContext: "WORK",
      continuationCue: "Continue from the after-work pause.",
    } },
  }) }));
}

test("Casinos filters are semantic, instant, reversible, URL-owned and reload-free", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/casinos", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Bonus availability").first().locator("option").first()).toHaveText("Bonus availability");
  await expect(page.getByLabel("Visit availability").first().locator("option").first()).toHaveText("Visit availability");
  await expect(page.getByLabel("Safer-gambling information").first().locator("option").first()).toHaveText("Safer-gambling information");
  await expect(page.getByLabel("Crypto support").first().locator("option").first()).toHaveText("Crypto support");
  await expect(page.getByLabel("Mobile support").first().locator("option").first()).toHaveText("Mobile support");
  await expect(page.getByLabel("Bonus availability").first().locator('option[value="true"]')).toHaveText("Available");
  await expect(page.getByLabel("Crypto support").first().locator('option[value="true"]')).toHaveText("Supported");
  await expect(page.getByRole("button", { name: /Apply|Show|Submit/i })).toHaveCount(0);

  let documents = 0;
  page.on("request", (request) => { if (request.resourceType() === "document") documents += 1; });
  await page.getByLabel("Mobile support").first().selectOption("true");
  await expect(page).toHaveURL(/supportsMobile=true/);
  await page.getByLabel("Bonus availability").first().selectOption("true");
  await expect(page).toHaveURL(/supportsMobile=true.*hasBonus=true|hasBonus=true.*supportsMobile=true/);
  await expect(page.getByLabel("Active filters").getByRole("link", { name: /Remove availability filter Mobile support/ })).toBeVisible();
  await page.getByLabel("Active filters").getByRole("link", { name: /Remove availability filter Mobile support/ }).click();
  await expect(page).not.toHaveURL(/supportsMobile/);
  await expect(page).toHaveURL(/hasBonus=true/);
  await page.goBack();
  await expect(page).toHaveURL(/supportsMobile=true/);
  await page.goForward();
  await expect(page).not.toHaveURL(/supportsMobile/);
  await page.getByLabel("Active filters").getByRole("link", { name: "Clear all" }).click();
  await expect(page).toHaveURL(/\/casinos$/);
  await expect(page.getByRole("heading", { name: "No published reviews yet." })).toBeVisible();
  expect(documents).toBe(0);
  await noOverflow(page);
});

test("Bonuses has one Clear All and instant combined filters, deep links, history and empty recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/bonuses?country=GB", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /Show Results|Apply filters/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Reset/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Clear All" })).toHaveCount(1);
  let documents = 0;
  page.on("request", (request) => { if (request.resourceType() === "document") documents += 1; });

  await desktopForm(page, "/bonuses").getByLabel("Bonus type").selectOption("WELCOME");
  await expect(page).toHaveURL(/country=GB.*type=WELCOME|type=WELCOME.*country=GB/);
  await desktopForm(page, "/bonuses").getByLabel("Sort results").selectOption("lowest-wagering");
  await expect(page).toHaveURL(/sort=lowest-wagering/);
  await expect(page.getByRole("link", { name: "Clear All" })).toHaveCount(1);
  await page.getByLabel("Active filters").getByRole("link", { name: /Remove welcome filter/i }).click();
  await expect(page).not.toHaveURL(/type=WELCOME/);
  await page.goBack();
  await expect(page).toHaveURL(/type=WELCOME/);
  await page.goForward();
  await expect(page).not.toHaveURL(/type=WELCOME/);
  await page.getByRole("link", { name: "Clear All" }).click();
  await expect(page).toHaveURL(/\/bonuses$/);

  await page.goto("/bonuses?maxDeposit=0", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "No Comparison Records Match These Filters." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear All" })).toHaveCount(1);
  expect(documents).toBe(1);
  await noOverflow(page);
});

test("Learn has one discovery-adjacent search with combined live filtering and recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/learn?category=casino-bonuses", { waitUntil: "networkidle" });
  const search = page.getByRole("searchbox", { name: "Search guides" });
  await expect(search).toHaveCount(1);
  await expect(page.locator('[data-learn-hero-axis] input[type="search"]')).toHaveCount(0);
  await expect(page.locator("[data-learn-discovery-search]").filter({ has: search })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Bonuses", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-learn-results-status]")).toHaveAttribute("aria-live", "polite");
  await search.fill("welcome");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(1);
  await search.fill("no-guide-matches-this-query");
  await expect(page.locator("[data-learn-results-status]")).toContainText("No guides match");
  await search.fill("");
  await page.getByRole("button", { name: "All topics", exact: true }).click();
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(13);
  await search.focus();
  await expect(search).toBeFocused();
  await noOverflow(page);
});

test("Programme requires two access checks plus just-in-time consent and returns withdrawal to the gate", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const calls: string[] = [];
  await installProgramme(page, calls);
  await page.goto("/program", { waitUntil: "networkidle" });
  const checks = page.getByRole("checkbox");
  const enter = page.getByRole("button", { name: "Enter Mission 01" });
  await expect(page.getByRole("heading", { name: "Two checks before you begin." })).toBeVisible();
  await expect(checks).toHaveCount(2);
  for (let mask = 0; mask < 4; mask += 1) {
    for (let index = 0; index < 2; index += 1) await checks.nth(index).setChecked(Boolean(mask & (1 << index)));
    if (mask === 3) await expect(enter).toBeEnabled();
    else await expect(enter).toBeDisabled();
  }
  await enter.click();
  await expect(page.getByRole("heading", { name: "Tell us what is happening right now." })).toBeVisible();
  expect(calls.slice(0, 3)).toEqual(["access-proof", "session", "authority:GET"]);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Tell us what is happening right now." })).toBeVisible();
  await page.getByRole("button", { name: "I'd rather type" }).click();
  await page.getByLabel("Your situation").fill(situation);
  await page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing what I type or say/ }).check();
  await page.getByRole("button", { name: "Create my Starting Point" }).click();
  expect(calls).toContain("authority:POST");
  await page.getByRole("button", { name: /Withdraw sensitive-input authority/ }).click();
  await expect(page.getByRole("heading", { name: "Two checks before you begin." })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  expect(calls).toContain("authority:DELETE");
  await noOverflow(page);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }] as const) {
  test(`locked Home and all four changed routes fit ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    const errors = trackConsoleErrors(page);
    for (const route of ["/", "/casinos", "/bonuses", "/learn", "/program"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      await noOverflow(page);
    }
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator('[data-handoff-page="home"] [data-screen-label]')).toHaveCount(9);
    expect(errors).toEqual([]);
    await page.close();
  });
}
