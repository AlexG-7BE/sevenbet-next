import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const expectGoogle = process.env.EXPECT_GOOGLE_AUTH === "true";
const candidate = {
  startingPoint: "After difficult work days I keep opening betting apps late at night.",
  desiredChange: "Build more control around the situation described here.",
  broadContext: "NOT_SPECIFIED",
  continuationCue: "Continue from the situation described in Mission 01.",
};

function authority(journeyId: string) {
  const now = Date.now();
  return {
    version: 1,
    intent: "PROGRAMME_ACCESS",
    purpose: "PROGRAMME_AUTH_ACCESS",
    journeyId,
    createdAt: now,
    expiresAt: now + 60 * 60 * 1000,
    termsVersion: "terms:effective-2026-08-19:updated-2026-08-19",
    privacyVersion: "privacy:effective-2026-08-19:updated-2026-08-19",
    adultConfirmedAt: now,
    termsAcceptedAt: now,
    privacyAcknowledgedAt: now,
    proof: "pa1.browser-test.browser-signature",
  };
}

function homeFixture(currentMission = 2) {
  const titles = ["Get started", "Set your limits", "Understand your triggers", "Build one boundary", "Reality check", "Decision framework", "Play plan", "Safer play", "Review & adjust", "Long-term control"];
  const missions = titles.map((title, index) => ({
    missionNumber: index + 1,
    title,
    status: index + 1 < currentMission ? "completed" : index + 1 === currentMission ? "current" : "locked",
    actionsCompleted: index + 1 < currentMission ? 1 : 0,
    actionsTotal: 3,
    xpEarnedHere: index + 1 < currentMission ? 40 : 0,
    completionBonus: 20,
  }));
  return {
    totalXp: 40,
    activeDays: 1,
    currentStreak: 1,
    achievements: [],
    currentMission,
    engagementDayBucket: "day_1",
    currentAction: "choose_direction",
    startingPoint: candidate,
    missions,
    reviews: [
      { milestone: "first", unlockMission: 3, title: "First Review", maxWords: 200, status: "locked" },
      { milestone: "mid", unlockMission: 6, title: "Mid Review", maxWords: 250, status: "locked" },
      { milestone: "full", unlockMission: 10, title: "Full Review", maxWords: 300, status: "locked" },
    ],
    nextReview: { milestone: "first", unlockMission: 3, title: "First Review", xpRemaining: 20, missionsRemaining: 1 },
    discoveryLinks: [],
  };
}

async function open(page: Page, route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
}

async function installAnonymousProgramme(page: Page) {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const input = route.request().postDataJSON() as { journeyId: string };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: authority(input.journeyId) }) });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate }, progress: { xpPreview: 20 } }) }));
  await page.route("**/api/program/program-ai/starting-point", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, startingPoint: candidate }) }));
  await page.route("**/api/program/program-ai/claim", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
}

async function reachRegistration(page: Page) {
  await open(page, "/program");
  await expect(page.getByRole("heading", { name: "Two checks before you begin." })).toBeVisible();
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await expect(page.getByRole("button", { name: "Tap to speak" })).toBeVisible();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
  await page.getByRole("button", { name: "I'd rather type" }).click();
  await page.getByLabel("Your situation").fill(candidate.startingPoint);
  await page.getByRole("button", { name: "Create my Starting Point" }).click();
  await expect(page.getByRole("heading", { name: "A plan built around your evenings." })).toBeVisible();
}

async function seedOAuthJourney(page: Page, journeyId: string) {
  await page.addInitScript(({ journey, access, startingPoint }) => {
    sessionStorage.setItem("sevenbet.programme.journey.v2", journey);
    sessionStorage.setItem("sevenbet.programme.access-continuation.v1", JSON.stringify(access));
    sessionStorage.setItem("sevenbet.programme.oauth-claim.v1", JSON.stringify({ version: 1, intent: "PROGRAMME_CLAIM_GOOGLE", journeyId: journey, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 }));
    sessionStorage.setItem(`sevenbet.programme.local-content.v2:journey:${encodeURIComponent(journey)}`, JSON.stringify({
      programAi: { phase: "registration", situation: startingPoint.startingPoint, candidate: startingPoint, inputMode: "text" },
      privateSentinel: "PROGRAM-AI-OAUTH-LOCAL-SENTINEL",
    }));
  }, { journey: journeyId, access: authority(journeyId), startingPoint: candidate });
}

async function installAuthenticatedSession(page: Page, userId: string, isAuthenticated: () => boolean = () => true) {
  await page.route("**/api/auth/get-session", (route) => {
    const now = new Date().toISOString();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(isAuthenticated() ? {
        session: { id: "programme-auth-browser", token: "test-token", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now },
        user: { id: userId, name: "Programme user", email: "programme@example.test", emailVerified: true, createdAt: now, updatedAt: now },
      } : null),
    });
  });
}

test("canonical Programme registration keeps access proof on email auth and fails closed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAnonymousProgramme(page);
  await reachRegistration(page);

  const google = page.getByRole("button", { name: /Continue with Google/ });
  await expect(google).toHaveCount(expectGoogle ? 1 : 0);
  await page.getByRole("button", { name: "Use email instead" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);

  let proofHeader: string | null = null;
  let journeyHeader: string | null = null;
  await page.route("**/api/auth/sign-up/email", async (route) => {
    proofHeader = await route.request().headerValue("x-sevenbet-programme-access-proof");
    journeyHeader = await route.request().headerValue("x-sevenbet-programme-access-journey");
    await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: "TEST_SIGNUP_STOP" }) });
  });
  await page.getByLabel("Email").fill("proof-check@example.test");
  await page.getByLabel("Password").fill("test-password-1234");
  await page.getByRole("button", { name: "Create account with email" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("could not be created");
  expect(proofHeader).toBe("pa1.browser-test.browser-signature");
  expect(journeyHeader).toMatch(/^[0-9a-f-]{36}$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("canonical access screen reports invalid authority safely", async ({ page }) => {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const input = route.request().postDataJSON() as { journeyId: string };
    const value = authority(input.journeyId);
    value.createdAt = Date.now() + 10 * 60 * 1000;
    value.expiresAt = value.createdAt + 60 * 60 * 1000;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: value }) });
  });
  await open(page, "/program");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  const alert = page.locator('p[role="alert"]');
  await expect(alert).toHaveText("Current access could not be verified. Try again.");
  await expect(alert).not.toContainText(/authority|continuation|proof/i);
});

test("Google cancellation retains the canonical Starting Point without legacy UI", async ({ page }) => {
  const journeyId = "5de1b8bb-4da6-4a2b-9f6f-6d4890baad0d";
  await seedOAuthJourney(page, journeyId);
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await open(page, "/program?auth=google-error&error=provider-payload-must-not-render");
  await expect(page.getByRole("heading", { name: "A plan built around your evenings." })).toBeVisible();
  await expect(page.locator('p[role="alert"]')).toContainText("Google account access was not completed");
  await expect(page.locator('p[role="alert"]')).not.toContainText("provider-payload-must-not-render");
  await expect(page.locator('[data-programme-runtime="legacy"], [data-legacy-programme]')).toHaveCount(0);
  const retained = await page.evaluate((journey) => ({
    marker: sessionStorage.getItem("sevenbet.programme.oauth-claim.v1"),
    content: sessionStorage.getItem(`sevenbet.programme.local-content.v2:journey:${encodeURIComponent(journey)}`),
  }), journeyId);
  expect(retained.marker).toContain(journeyId);
  expect(retained.content).toContain("PROGRAM-AI-OAUTH-LOCAL-SENTINEL");
});

test("Google cancellation without a provider code still keeps recovery actions visible", async ({ page }) => {
  const journeyId = "87117045-d6b3-477a-8fb3-f0746f8f6139";
  await seedOAuthJourney(page, journeyId);
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await open(page, "/program?auth=google-error");
  await expect(page.getByRole("heading", { name: "A plan built around your evenings." })).toBeVisible();
  await expect(page.locator('p[role="alert"]')).toHaveText("Google account access was not completed. You can retry or use email instead.");
  await expect(page.getByRole("button", { name: "Use email instead" })).toBeVisible();
});

test("Programme Google remains the account-continuation action after changing the email form mode", async ({ page }) => {
  test.skip(!expectGoogle, "Google is intentionally unavailable without complete server credentials");
  await installAnonymousProgramme(page);
  await reachRegistration(page);

  await page.getByRole("button", { name: "Use email instead" }).click();
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  await page.getByRole("button", { name: "Hide email option" }).click();

  let requestSignUp: boolean | undefined;
  await page.route("**/api/auth/sign-in/social", (route) => {
    requestSignUp = (route.request().postDataJSON() as { requestSignUp?: boolean }).requestSignUp;
    return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: "TEST_STOP" }) });
  });
  await page.getByRole("button", { name: "Continue with Google — save your plan" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("Google account access could not be started");
  expect(requestSignUp).toBe(true);
});

test("Google Programme, login and recovery controls fit every Founder mobile width", async ({ page }) => {
  test.skip(!expectGoogle, "Google is intentionally unavailable without complete server credentials");
  await installAnonymousProgramme(page);
  await reachRegistration(page);

  for (const width of [360, 375, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const google = page.getByRole("button", { name: "Continue with Google — save your plan" });
    const email = page.getByRole("button", { name: "Use email instead" });
    await expect(google).toBeVisible();
    await expect(email).toBeVisible();
    expect(await google.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.height >= 44 && rect.left >= 0 && rect.right <= window.innerWidth && element.scrollWidth <= element.clientWidth;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }

  await open(page, "/login");
  for (const width of [360, 375, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const google = page.getByRole("button", { name: "Continue with Google" });
    await expect(google).toBeVisible();
    expect(await google.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.height >= 44 && rect.left >= 0 && rect.right <= window.innerWidth && element.scrollWidth <= element.clientWidth;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }

  await open(page, "/login?auth=google-error&error=account_not_linked");
  for (const width of [360, 375, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const recovery = page.getByRole("button", { name: "Sign in, then link Google" });
    const legal = page.getByText(/18\+ · Private by default/);
    await expect(recovery).toBeVisible();
    await expect(legal).toBeVisible();
    expect(await recovery.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.height >= 44 && rect.left >= 0 && rect.right <= window.innerWidth && element.scrollWidth <= element.clientWidth;
    })).toBe(true);
    expect(await legal.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("Google return retries canonical claim redemption and transfers local authority", async ({ page }) => {
  const userId = "google-return-program-ai-user";
  const journeyId = "19dde0a8-e33b-40a7-88c3-a50d0942ce57";
  await seedOAuthJourney(page, journeyId);
  await installAuthenticatedSession(page, userId);
  await page.route("**/api/program/program-ai/starting-point", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route("**/api/program/program-ai/claim", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  let redemptions = 0;
  await page.route("**/api/program/program-ai/claims/redeem", (route) => {
    redemptions += 1;
    return route.fulfill(redemptions === 1
      ? { status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Your progress could not be saved yet" }) }
      : { status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: homeFixture() }) });
  });
  await open(page, "/program?auth=google-return");
  await expect(page.getByRole("heading", { name: "A plan built around your evenings." })).toBeVisible();
  await expect(page.locator('p[role="alert"]')).toHaveText("Your progress could not be saved yet");
  expect(redemptions).toBe(1);
  await page.getByRole("button", { name: "Save to my account" }).click();
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mission 02/ })).toBeVisible();
  expect(redemptions).toBe(2);
  const transferred = await page.evaluate(({ journey, user }) => ({
    marker: sessionStorage.getItem("sevenbet.programme.oauth-claim.v1"),
    journeyContent: sessionStorage.getItem(`sevenbet.programme.local-content.v2:journey:${encodeURIComponent(journey)}`),
    userContent: sessionStorage.getItem(`sevenbet.programme.local-content.v2:user:${encodeURIComponent(user)}`),
    userAuthority: sessionStorage.getItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(user)}`),
  }), { journey: journeyId, user: userId });
  expect(transferred.marker).toBeNull();
  expect(transferred.journeyContent).toBeNull();
  expect(transferred.userContent).toBeNull();
  expect(transferred.userAuthority).toContain(journeyId);
});

test("expired access continuation returns to the canonical access screen", async ({ page }) => {
  const journeyId = "2a5dfb88-a766-4ac1-9b1b-b8e5eac1aef4";
  const expired = authority(journeyId);
  expired.createdAt = Date.now() - 2 * 60 * 60 * 1000;
  expired.expiresAt = expired.createdAt + 60 * 60 * 1000;
  await page.addInitScript(({ journey, access }) => {
    sessionStorage.setItem("sevenbet.programme.journey.v2", journey);
    sessionStorage.setItem("sevenbet.programme.access-continuation.v1", JSON.stringify(access));
  }, { journey: journeyId, access: expired });
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await open(page, "/program");
  await expect(page.getByRole("heading", { name: "Two checks before you begin." })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
});

test("authenticated canonical dashboard logs out into a fresh anonymous access boundary", async ({ page }) => {
  const userId = "auth-harden-program-ai-user";
  const journeyId = "8a6bf1a5-b7f5-497d-883f-3b3f1ebd0fb8";
  let authenticated = true;
  let signOutRequests = 0;
  let transitionRequests = 0;
  await page.addInitScript(({ user, access }) => {
    sessionStorage.setItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(user)}`, JSON.stringify(access));
    sessionStorage.setItem(`sevenbet.programme.local-content.v2:user:${encodeURIComponent(user)}`, JSON.stringify({ privateSentinel: "AUTHENTICATED-USER-SENTINEL" }));
  }, { user: userId, access: authority(journeyId) });
  await installAuthenticatedSession(page, userId, () => authenticated);
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: homeFixture(4) }) }));
  await page.route("**/api/program/session", (route) => {
    transitionRequests += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/api/auth/sign-out", (route) => {
    signOutRequests += 1;
    authenticated = false;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });
  await page.setViewportSize({ width: 1024, height: 900 });
  await open(page, "/program");
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mission 04/ })).toBeVisible();
  const logout = page.getByRole("button", { name: "Log out of B4GAMBLE" });
  await expect(logout).toBeVisible();
  await logout.click();
  await expect(page.getByRole("heading", { name: "Two checks before you begin." })).toBeVisible();
  expect(signOutRequests).toBe(1);
  expect(transitionRequests).toBe(1);
  const storage = await page.evaluate((user) => ({
    pointer: sessionStorage.getItem("sevenbet.programme.journey.v2"),
    userContent: sessionStorage.getItem(`sevenbet.programme.local-content.v2:user:${encodeURIComponent(user)}`),
    userAuthority: sessionStorage.getItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(user)}`),
    continuation: sessionStorage.getItem("sevenbet.programme.access-continuation.v1"),
    claim: sessionStorage.getItem("sevenbet.programme.oauth-claim.v1"),
  }), userId);
  expect(storage.pointer).not.toBe(journeyId);
  expect(storage.userContent).toContain("AUTHENTICATED-USER-SENTINEL");
  expect(storage.userAuthority).toContain(journeyId);
  expect(storage.continuation).toBeNull();
  expect(storage.claim).toBeNull();
});

test("Google control honours reduced motion on the canonical registration screen", async ({ browser }) => {
  test.skip(!expectGoogle, "Google is intentionally unavailable without complete server credentials");
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await installAnonymousProgramme(page);
  await reachRegistration(page);
  const google = page.getByRole("button", { name: /Continue with Google/ });
  await expect(google).toBeVisible();
  const transitionSeconds = await google.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration));
  expect(transitionSeconds).toBeLessThanOrEqual(0.00001);
  await context.close();
});
