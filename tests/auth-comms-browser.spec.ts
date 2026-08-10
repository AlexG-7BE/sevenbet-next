import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const expectGoogle = process.env.EXPECT_GOOGLE_AUTH === "true";

async function open(page: Page, route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
}

async function passAccessGate(page: Page) {
  await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Protected Help remains available/ })).toHaveAttribute("href", "/responsible-gambling");
  await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  await expect(page.getByRole("link", { name: "Privacy Notice" })).toHaveAttribute("href", "/privacy");
  const required = page.getByRole("checkbox");
  await expect(required).toHaveCount(2);
  const continueButton = page.getByRole("button", { name: "Continue to the Programme" });
  await expect(continueButton).toBeDisabled();
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await expect(continueButton).toBeDisabled();
  await page.getByRole("checkbox", { name: /I agree to the Terms and acknowledge the Privacy Notice/ }).check();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}

test("authentication choice is responsive, accessible and fail-closed with provider configuration", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/program?auth=sign-in");
  await passAccessGate(page);
  await expect(page.getByRole("heading", { name: "Return to your programme." })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();

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
    sessionStorage.setItem("sevenbet.programme.access-continuation.v1", JSON.stringify({
      version: 1,
      intent: "PROGRAMME_ACCESS",
      journeyId: id,
      createdAt: now,
      expiresAt: now + 60 * 60 * 1000,
      termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
      privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-09",
      adultConfirmedAt: now,
      termsAcceptedAt: now,
      privacyAcknowledgedAt: now,
    }));
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

test("Google return transfers only active access authority to the authenticated user", async ({ page }) => {
  const userId = "google-return-fresh-user";
  const journeyId = "19dde0a8-e33b-40a7-88c3-a50d0942ce57";
  await page.addInitScript(({ journey }) => {
    const now = Date.now();
    sessionStorage.setItem("sevenbet.programme.journey.v2", journey);
    sessionStorage.setItem("sevenbet.programme.access-continuation.v1", JSON.stringify({
      version: 1,
      intent: "PROGRAMME_ACCESS",
      journeyId: journey,
      createdAt: now,
      expiresAt: now + 60 * 60 * 1000,
      termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
      privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-09",
      adultConfirmedAt: now,
      termsAcceptedAt: now,
      privacyAcknowledgedAt: now,
    }));
  }, { journey: journeyId });
  await page.route("**/api/auth/get-session", async (route) => {
    const timestamp = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: { id: "google-return-session", token: "test-token", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: timestamp, updatedAt: timestamp },
        user: { id: userId, name: "Google Return", email: "return@example.com", emailVerified: true, createdAt: timestamp, updatedAt: timestamp },
      }),
    });
  });
  await page.route("**/api/program/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        dashboard: {
          totalXp: 0,
          currentMission: 1,
          missions: [{ missionNumber: 1, title: "Map the moment", status: "current" }],
          activeDays: 0,
          currentStreak: 0,
          achievements: [],
          momentMap: null,
          currentGoal: null,
          urgeLearningRecord: null,
          activeBoundary: null,
        },
      }),
    });
  });

  await open(page, "/program?auth=google-return");
  await expect(page).toHaveURL(`${baseUrl}/program`);
  await expect(page.getByRole("heading", { name: "Your Programme is ready." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);
  const access = await page.evaluate((id) => ({
    continuation: sessionStorage.getItem("sevenbet.programme.access-continuation.v1"),
    authority: sessionStorage.getItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(id)}`),
    claim: sessionStorage.getItem("sevenbet.programme.oauth-claim.v1"),
  }), userId);
  expect(access.continuation).toBeNull();
  expect(access.authority).toContain(journeyId);
  expect(access.claim).toBeNull();
});

test("expired access continuation returns to the consolidated access screen", async ({ page }) => {
  const journeyId = "2a5dfb88-a766-4ac1-9b1b-b8e5eac1aef4";
  await page.addInitScript(({ journey }) => {
    const createdAt = Date.now() - 2 * 60 * 60 * 1000;
    sessionStorage.setItem("sevenbet.programme.journey.v2", journey);
    sessionStorage.setItem("sevenbet.programme.access-continuation.v1", JSON.stringify({
      version: 1,
      intent: "PROGRAMME_ACCESS",
      journeyId: journey,
      createdAt,
      expiresAt: createdAt + 60 * 60 * 1000,
      termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
      privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-09",
      adultConfirmedAt: createdAt,
      termsAcceptedAt: createdAt,
      privacyAcknowledgedAt: createdAt,
    }));
  }, { journey: journeyId });

  await open(page, "/program");
  await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
});

test("Google control honours reduced motion when configured", async ({ browser }) => {
  test.skip(!expectGoogle, "Google is intentionally unavailable without complete server credentials");
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await open(page, "/program?auth=sign-in");
  await passAccessGate(page);
  const google = page.getByRole("button", { name: "Continue with Google" });
  await expect(google).toBeVisible();
  expect(await google.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await context.close();
});

test("fresh authenticated user resolves to Programme home and starts Mission 01 explicitly", async ({ page }) => {
  const userId = "fresh-authenticated-programme-user";
  const journeyId = "4e5c7a66-33dd-4bb7-a237-4ee9ad01caf7";
  await page.addInitScript(({ id, journey }) => {
    const now = Date.now();
    sessionStorage.setItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(id)}`, JSON.stringify({
      version: 1,
      intent: "PROGRAMME_ACCESS",
      journeyId: journey,
      createdAt: now,
      expiresAt: now + 60 * 60 * 1000,
      termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
      privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-09",
      adultConfirmedAt: now,
      termsAcceptedAt: now,
      privacyAcknowledgedAt: now,
    }));
  }, { id: userId, journey: journeyId });
  await page.route("**/api/auth/get-session", async (route) => {
    const timestamp = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: { id: "fresh-session", token: "fresh-token", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: timestamp, updatedAt: timestamp },
        user: { id: userId, name: "Fresh User", email: "fresh@example.com", emailVerified: true, createdAt: timestamp, updatedAt: timestamp },
      }),
    });
  });
  await page.route("**/api/program/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        dashboard: {
          totalXp: 0,
          currentMission: 1,
          missions: [
            { missionNumber: 1, title: "Map the moment", status: "current" },
            { missionNumber: 2, title: "Set a 7-day goal", status: "locked" },
            { missionNumber: 3, title: "Understand the urge", status: "locked" },
          ],
          activeDays: 0,
          currentStreak: 0,
          achievements: [],
          momentMap: null,
          currentGoal: null,
          urgeLearningRecord: null,
          activeBoundary: null,
        },
      }),
    });
  });

  await open(page, "/program");
  await expect(page.getByText("PERSONAL CONTROL DASHBOARD", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Programme is ready." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out of B4GAMBLE" })).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your Programme is ready." })).toBeVisible();
  await open(page, "/program?entry=start");
  await expect(page).toHaveURL(`${baseUrl}/program`);
  await expect(page.getByRole("heading", { name: "Map one real moment." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out of B4GAMBLE" })).toBeVisible();
});

test("authenticated Programme logout ends the session and starts a fresh anonymous subject", async ({ page }) => {
  const userId = "auth-harden-browser-user";
  const priorJourneyId = "8a6bf1a5-b7f5-497d-883f-3b3f1ebd0fb8";
  let authenticated = true;
  let signOutRequests = 0;

  await page.addInitScript(({ id, journeyId }) => {
    if (sessionStorage.getItem("auth-harden-browser-seeded") === "true") return;
    sessionStorage.setItem("auth-harden-browser-seeded", "true");
    sessionStorage.setItem("sevenbet.programme.journey.v2", journeyId);
    sessionStorage.setItem(
      `sevenbet.programme.local-content.v2:journey:${encodeURIComponent(journeyId)}`,
      JSON.stringify({ privateSentinel: "PRIOR-ANONYMOUS-SENTINEL" }),
    );
    const now = Date.now();
    sessionStorage.setItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(id)}`, JSON.stringify({
      version: 1,
      intent: "PROGRAMME_ACCESS",
      journeyId,
      createdAt: now,
      expiresAt: now + 60 * 60 * 1000,
      termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
      privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-09",
      adultConfirmedAt: now,
      termsAcceptedAt: now,
      privacyAcknowledgedAt: now,
    }));
  }, { id: userId, journeyId: priorJourneyId });

  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authenticated ? {
        session: {
          id: "auth-harden-session",
          token: "browser-session-token",
          userId,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user: {
          id: userId,
          name: "Auth Harden User",
          email: "auth-harden@example.com",
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      } : null),
    });
  });
  await page.route("**/api/program/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        dashboard: {
          totalXp: 60,
          currentMission: 2,
          missions: [
            { missionNumber: 1, title: "Map the moment", status: "completed" },
            { missionNumber: 2, title: "Set a 7-day goal", status: "current" },
            { missionNumber: 3, title: "Understand the urge", status: "locked" },
          ],
          activeDays: 1,
          currentStreak: 0,
          achievements: [],
          momentMap: null,
          currentGoal: null,
          urgeLearningRecord: null,
          activeBoundary: null,
        },
      }),
    });
  });
  await page.route("**/api/auth/sign-out", async (route) => {
    signOutRequests += 1;
    authenticated = false;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/program");
  await expect(page.getByText("PERSONAL CONTROL DASHBOARD", { exact: true })).toBeVisible();
  const logout = page.getByRole("button", { name: "Log out of B4GAMBLE" });
  await expect(logout).toBeVisible();
  await logout.focus();
  await expect(logout).toBeFocused();
  expect(await logout.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("3px");
  await page.evaluate((id) => {
    sessionStorage.setItem(
      `sevenbet.programme.local-content.v2:user:${encodeURIComponent(id)}`,
      JSON.stringify({ privateSentinel: "AUTHENTICATED-USER-SENTINEL" }),
    );
  }, userId);
  await logout.click();

  await expect(page).toHaveURL(`${baseUrl}/program`);
  await expect(page.getByRole("heading", { name: "Confirm before you continue." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out of B4GAMBLE" })).toHaveCount(0);
  expect(signOutRequests).toBe(1);
  const storage = await page.evaluate(({ id, journeyId }) => {
    const pointer = sessionStorage.getItem("sevenbet.programme.journey.v2");
    return {
      pointer,
      priorJourney: sessionStorage.getItem(
        `sevenbet.programme.local-content.v2:journey:${encodeURIComponent(journeyId)}`,
      ),
      freshJourney: pointer ? sessionStorage.getItem(
        `sevenbet.programme.local-content.v2:journey:${encodeURIComponent(pointer)}`,
      ) : null,
      authenticatedUser: sessionStorage.getItem(
        `sevenbet.programme.local-content.v2:user:${encodeURIComponent(id)}`,
      ),
      authenticatedAccess: sessionStorage.getItem(
        `sevenbet.programme.access-authority.v1:user:${encodeURIComponent(id)}`,
      ),
      continuation: sessionStorage.getItem("sevenbet.programme.access-continuation.v1"),
      claim: sessionStorage.getItem("sevenbet.programme.oauth-claim.v1"),
    };
  }, { id: userId, journeyId: priorJourneyId });
  expect(storage.pointer).not.toBe(priorJourneyId);
  expect(storage.priorJourney).toContain("PRIOR-ANONYMOUS-SENTINEL");
  expect(storage.freshJourney ?? "").not.toContain("PRIOR-ANONYMOUS-SENTINEL");
  expect(storage.freshJourney ?? "").not.toContain("AUTHENTICATED-USER-SENTINEL");
  expect(storage.authenticatedUser).toContain("AUTHENTICATED-USER-SENTINEL");
  expect(storage.authenticatedAccess).toBeNull();
  expect(storage.continuation).toBeNull();
  expect(storage.claim).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
