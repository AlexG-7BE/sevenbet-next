import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const captureEvidence = process.env.B4GAMBLE_CAPTURE_FINAL_RC === "true";
const expectGoogle = process.env.EXPECT_GOOGLE_AUTH === "true";
const evidenceRoot = path.join(process.cwd(), "docs/02_Product_Design/qa/production-readiness/final-rc");

async function open(page: Page, route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  expect(response?.status(), route).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), route).toBe(true);
}

async function capture(page: Page, group: "desktop-1440" | "tablet-1024" | "mobile-390" | "critical-states", name: string, fullPage = false) {
  if (!captureEvidence) return;
  const directory = path.join(evidenceRoot, group);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, `${name}.jpg`), type: "jpeg", quality: 78, fullPage });
}

async function installAnonymousProgramme(page: Page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON() as { journeyId: string };
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        authority: {
          version: 1,
          intent: "PROGRAMME_ACCESS",
          purpose: "PROGRAMME_AUTH_ACCESS",
          journeyId: body.journeyId,
          createdAt,
          expiresAt: createdAt + 3_600_000,
          termsVersion: "terms:effective-2026-08-19:updated-2026-08-19",
          privacyVersion: "privacy:effective-2026-08-19:updated-2026-08-19",
          adultConfirmedAt: createdAt,
          termsAcceptedAt: createdAt,
          privacyAcknowledgedAt: createdAt,
          proof: "pa1.final-rc.browser-proof",
        },
      }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      result: {
        kind: "STARTING_POINT_CANDIDATE",
        disposition: "CONTINUE",
        candidate: {
          startingPoint: "After difficult work days I keep opening betting apps late at night.",
          desiredChange: "Pause before opening an app.",
          broadContext: "WORK",
          continuationCue: "Continue from the after-work pause.",
        },
      },
    }),
  }));
}

async function reachStartingPoint(page: Page) {
  await open(page, "/program");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing what I type or say/ }).check();
  await page.getByRole("button", { name: "I'd rather type" }).click();
  await page.getByLabel("Your situation").fill("After difficult work days I keep opening betting apps late at night.");
  await page.getByRole("button", { name: "Create my Starting Point" }).click();
  await expect(page.locator('[data-programme-presentation="starting-point-ready"]')).toBeVisible();
}

test("public navigation, Home journey and shared footer remain operable at release viewports", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.width <= 430, isMobile: viewport.width <= 430, reducedMotion: "reduce" });
    await open(page, "/");
    await expect(page.locator('[data-public-shell="header"]')).toHaveCount(1);
    await expect(page.locator('[data-public-shell="footer"]')).toHaveCount(1);
    await expect(page.locator('[data-handoff-page="home"] [data-screen-label]')).toHaveCount(9);
    await page.locator('[data-screen-label="Final CTA"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-screen-label="Final CTA"]').getByRole("link", { name: "Start Programme" }).first()).toBeVisible();
    await page.locator('[data-public-shell="footer"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-public-shell="footer"]')).toBeVisible();
    if (viewport.width === 390) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(page.locator("#public-mobile-navigation")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("#public-mobile-navigation")).toBeHidden();
    }
    const group = viewport.width === 1440 ? "desktop-1440" : viewport.width === 1024 ? "tablet-1024" : "mobile-390";
    await capture(page, group, "home-closing-composition");
    await page.close();
  }
});

test("representative major surfaces keep the public shell and intended runtime renderer", async ({ browser }) => {
  const samples: Array<{
    width: number;
    height: number;
    group: "desktop-1440" | "tablet-1024" | "mobile-390";
    name: string;
    route: string;
    renderer?: string;
    programme?: boolean;
  }> = [
    { width: 1440, height: 900, group: "desktop-1440" as const, name: "casinos-directory", route: "/casinos?visualFixture=true", renderer: "casinos" },
    { width: 1440, height: 900, group: "desktop-1440" as const, name: "bonuses-directory", route: "/bonuses?visualFixture=true", renderer: "bonuses" },
    { width: 1440, height: 900, group: "desktop-1440" as const, name: "bonus-guide", route: "/bonus-guide" },
    { width: 1440, height: 900, group: "desktop-1440" as const, name: "programme-entry", route: "/program", programme: true },
    { width: 1024, height: 768, group: "tablet-1024" as const, name: "casinos-directory", route: "/casinos?visualFixture=true", renderer: "casinos" },
    { width: 1024, height: 768, group: "tablet-1024" as const, name: "casino-review", route: "/casino/demo-northstar?visualFixture=true", renderer: "casino-review" },
    { width: 1024, height: 768, group: "tablet-1024" as const, name: "learn", route: "/learn" },
    { width: 1024, height: 768, group: "tablet-1024" as const, name: "ten-steps", route: "/10-steps" },
    { width: 390, height: 844, group: "mobile-390" as const, name: "casinos-directory", route: "/casinos?visualFixture=true", renderer: "casinos" },
    { width: 390, height: 844, group: "mobile-390" as const, name: "bonus-guide", route: "/bonus-guide" },
    { width: 390, height: 844, group: "mobile-390" as const, name: "responsible-gambling", route: "/responsible-gambling" },
    { width: 390, height: 844, group: "mobile-390" as const, name: "faq", route: "/faq" },
  ];

  for (const sample of samples) {
    const page = await browser.newPage({
      viewport: { width: sample.width, height: sample.height },
      hasTouch: sample.width <= 430,
      isMobile: sample.width <= 430,
      reducedMotion: "reduce",
    });
    await open(page, sample.route);
    await expect(page.locator('[data-public-shell="header"]')).toHaveCount(1);
    await expect(page.locator('[data-public-shell="footer"]')).toHaveCount(1);
    if (sample.renderer) await expect(page.locator(`[data-runtime-renderer="${sample.renderer}"]`)).toHaveCount(1);
    if (sample.programme) await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toHaveCount(1);
    await expect(page.locator('[data-runtime-renderer] [data-handoff-page]')).toHaveCount(0);
    if (sample.name === "casino-review" && sample.width === 1024) {
      const disclosure = await page.getByText("DEMONSTRATION DATA", { exact: true }).locator("..").boundingBox();
      const heading = await page.getByRole("heading", { level: 1, name: "Solvane Casino" }).boundingBox();
      const overlaps = disclosure && heading
        ? Math.min(disclosure.x + disclosure.width, heading.x + heading.width) > Math.max(disclosure.x, heading.x)
          && Math.min(disclosure.y + disclosure.height, heading.y + heading.height) > Math.max(disclosure.y, heading.y)
        : true;
      expect(overlaps).toBe(false);
    }
    await capture(page, sample.group, sample.name);
    await page.close();
  }
});

test("Best Offers local visual fixture preserves decision hierarchy and remains non-claimable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/best-offers?visualFixture=true");
  await expect(page.locator('[data-runtime-renderer="best-offers"]')).toHaveCount(1);
  await expect(page.getByText("Fictional product demonstration")).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(4);
  await expect(page.locator("[data-commercial-best-offer-card]")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /View .* offer|Visit /i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toHaveCount(0);
  await expect(page.getByText("Review only", { exact: true })).toHaveCount(3);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await expect(page.locator("dt:visible").filter({ hasText: /^Wagering$/ }).first()).toBeVisible();
  await expect(page.locator("dt:visible").filter({ hasText: /^Minimum deposit$/ }).first()).toBeVisible();
  await capture(page, "mobile-390", "best-offers-demo", true);
});

test("casino collection keeps comparison UI retired from the focused decision flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/casinos?visualFixture=true");
  const toggles = page.getByRole("button", { name: "Compare", exact: true });
  await expect(toggles).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Casino comparison tray" })).toHaveCount(0);
  await expect(page.locator('dialog[data-runtime-renderer="contextual-comparison"]')).toHaveCount(0);
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(page.getByRole("searchbox", { name: "Search casinos" })).toBeVisible();
  await capture(page, "critical-states", "casino-collection-mobile");
});

test("casino review stays readable through the concise Review Only decision state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/casino/demo-northstar?visualFixture=true");
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
  expect(await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id))).toEqual([
    "why-we-rate", "payments", "current-offer", "games", "support", "regulation", "sources",
  ]);
  await expect(page.getByText("Review only", { exact: true })).toHaveCount(2);
  await expect(page.locator("[data-casino-decision-bar]")).toHaveCount(0);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await capture(page, "critical-states", "casino-review-mobile-review-only");
});

test("bonus directory keeps five bounded intent views and three decision facts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/bonuses?visualFixture=true");
  const tabs = page.getByRole("tab");
  const cards = page.locator("[data-commercial-bonus-card]");
  expect(await tabs.allTextContents()).toEqual(["All", "Welcome", "Low Wagering", "Low Deposit", "Free Spins"]);
  await expect(cards).toHaveCount(8);
  expect(await cards.first().locator("dl > div").count()).toBe(3);
  await expect(cards.locator("dt").filter({ hasText: /^Payout$/ })).toHaveCount(0);
  await page.getByRole("tab", { name: "Free Spins", exact: true }).click();
  expect(await cards.count()).toBeLessThan(8);
  await expect(page.getByText("Bonus calculator", { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="/r/"]')).toHaveCount(0);
  await capture(page, "critical-states", "bonus-directory-mobile");
});

test("Learn search, facets, no-result recovery and real article navigation work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/learn");
  const search = page.getByRole("searchbox", { name: "Search guides" });
  await search.fill("licensing");
  await expect(page.locator('a[data-learn-category].scp3:visible')).toHaveCount(2);
  await page.getByRole("button", { name: "Bonuses", exact: true }).click();
  await expect(page.locator("[data-learn-results-status]")).toContainText("No guides match");
  await search.fill("");
  await expect(page.getByRole("link", { name: /How Welcome Bonus Terms Work/ }).last()).toBeVisible();
  await capture(page, "critical-states", "learn-filter-mobile");
  await page.getByRole("link", { name: /How Welcome Bonus Terms Work/ }).last().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How Welcome Bonus Terms Work");
});

test("fresh Mission 01 delivers value before account continuation and preserves Google/email priority contract", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAnonymousProgramme(page);
  await reachStartingPoint(page);
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use email instead" })).toBeVisible();
  const google = page.getByRole("button", { name: "Continue with Google — save your plan" });
  await expect(google).toHaveCount(expectGoogle ? 1 : 0);
  if (expectGoogle) {
    await expect(google).toBeVisible();
    const actions = page.locator('[data-programme-presentation-state="registration"] button');
    expect(await actions.first().textContent()).toContain("Continue with Google");
  }
  await capture(page, "critical-states", "programme-starting-point-registration");
  await page.getByRole("button", { name: "Use email instead" }).click();
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("login exposes returning-user Google intent when configured and keeps email fallback usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/login");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(expectGoogle ? 1 : 0);
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await capture(page, "critical-states", "login-mobile");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("not-an-email");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator('[role="alert"]')).toBeVisible();
});

test("Protected Help stays non-commercial and Contact invalid submission is announced without sending", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/help");
  await expect(page.locator('a[href^="/r/"],a[href^="/go/"],a[href="/best-offers"],a[href="/bonuses"]')).toHaveCount(0);
  await capture(page, "mobile-390", "protected-help", true);
  await open(page, "/contact");
  await page.getByRole("button", { name: /Send message/i }).click();
  const email = page.locator("#contact-email");
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#contact-email-error")).toBeVisible();
  await capture(page, "critical-states", "contact-validation-mobile");
});
