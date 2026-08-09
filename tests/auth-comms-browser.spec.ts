import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const expectGoogle = process.env.EXPECT_GOOGLE_AUTH === "true";

async function open(page: Page, route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
}

async function passAgeGate(page: Page) {
  await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Protected Help remains available/ })).toHaveAttribute("href", "/responsible-gambling");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("button", { name: "Continue to the Programme" }).click();
}

test("authentication choice is responsive, accessible and fail-closed with provider configuration", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/program?auth=sign-in");
  await passAgeGate(page);
  await expect(page.getByRole("heading", { name: "Return to your programme." })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  const google = page.getByRole("button", { name: "Continue with Google" });
  if (!expectGoogle) {
    await expect(google).toHaveCount(0);
    return;
  }

  await expect(google).toBeVisible();
  await expect(page.getByText("or use email", { exact: true })).toBeVisible();
  await expect(page.getByText(/Google provides account identity only/)).toBeVisible();
  await page.screenshot({ path: "test-results/auth-google-sign-in-desktop.png", fullPage: true });
  await google.focus();
  await expect(google).toBeFocused();
  expect(await google.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("3px");

  let requestBody: Record<string, unknown> | null = null;
  let ageHeader: string | null = null;
  await page.route("**/api/auth/sign-in/social", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    ageHeader = await route.request().headerValue("x-sevenbet-age-attestation");
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ code: "TEST_PROVIDER_UNAVAILABLE" }),
    });
  });
  await google.click();
  await expect(page.locator('p[role="alert"]')).toContainText("Google sign-in could not be started");
  expect(requestBody).toEqual({
    provider: "google",
    callbackURL: "/program?auth=google-return",
    errorCallbackURL: "/program?auth=google-error",
    requestSignUp: false,
  });
  expect(ageHeader).toBe("18-or-over");
});

test("Google cancellation preserves the exact local journey without exposing the marker in the URL", async ({ page }) => {
  const journeyId = "5de1b8bb-4da6-4a2b-9f6f-6d4890baad0d";
  await page.addInitScript(({ id }) => {
    const now = Date.now();
    sessionStorage.setItem("sevenbet.programme.journey.v2", id);
    sessionStorage.setItem(`sevenbet.age-attestation.v2:journey:${encodeURIComponent(id)}`, "18-or-over");
    sessionStorage.setItem(`sevenbet.programme.local-content.v2:journey:${encodeURIComponent(id)}`, JSON.stringify({
      momentMap: {
        situation: "CANCELLED-OAUTH-LOCAL-SENTINEL",
        cues: ["private cue"],
        thoughtOrFeeling: "private thought",
        response: "private response",
        immediateConsequence: "private consequence",
        noticeRule: "private rule",
        neutralFlags: [],
        notSureFlags: [],
      },
    }));
    sessionStorage.setItem("sevenbet.programme.oauth-claim.v1", JSON.stringify({
      version: 1,
      intent: "PROGRAMME_CLAIM_GOOGLE",
      journeyId: id,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
    }));
  }, { id: journeyId });

  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/program?auth=google-error&error=provider-payload-must-not-render");
  const error = page.locator('p[role="alert"]');
  await expect(error).toContainText("Google sign-in was not completed");
  await expect(error).not.toContainText("provider-payload-must-not-render");
  await expect(page).toHaveURL(`${baseUrl}/program`);
  const recovered = await page.evaluate((id) => ({
    pointer: sessionStorage.getItem("sevenbet.programme.journey.v2"),
    marker: sessionStorage.getItem("sevenbet.programme.oauth-claim.v1"),
    content: sessionStorage.getItem(`sevenbet.programme.local-content.v2:journey:${encodeURIComponent(id)}`),
  }), journeyId);
  expect(recovered.pointer).toBe(journeyId);
  expect(recovered.marker).toContain(journeyId);
  expect(recovered.content).toContain("CANCELLED-OAUTH-LOCAL-SENTINEL");
  await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
  await expect(page.getByText(/CANCELLED-OAUTH-LOCAL-SENTINEL/)).toBeVisible();
  await page.screenshot({ path: "test-results/auth-google-cancel-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Google control honours reduced motion when configured", async ({ browser }) => {
  test.skip(!expectGoogle, "Google is intentionally unavailable without complete server credentials");
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await open(page, "/program?auth=sign-in");
  await passAgeGate(page);
  const google = page.getByRole("button", { name: "Continue with Google" });
  await expect(google).toBeVisible();
  expect(await google.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await context.close();
});
