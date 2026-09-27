import { expect, test, type Page } from "@playwright/test";
import { commercialDiscoveryLinks, programmeMissionTitles } from "../lib/programme/program-ai/mission-registry";

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
  const missions = programmeMissionTitles.map((title, index) => ({
    missionNumber: index + 1,
    title,
    status: index + 1 < currentMission ? "completed" : index + 1 === currentMission ? "current" : "locked",
    actionsCompleted: index + 1 < currentMission ? index === 0 ? 2 : 3 : 0,
    actionsTotal: index === 0 ? 2 : 3,
    xpEarnedHere: index + 1 < currentMission ? index === 0 ? 40 : 75 : 0,
    completionBonus: index === 0 ? 0 : 25,
  }));
  const firstReviewAvailable = currentMission > 3;
  return {
    totalXp: firstReviewAvailable ? 190 : 40,
    activeDays: 1,
    currentStreak: 1,
    achievements: [
      { slug: "first-plan", title: "First Plan", state: currentMission > 2 ? "earned" : "locked", awardedAt: currentMission > 2 ? "2026-08-19T00:00:00.000Z" : null },
      { slug: "boundary-built", title: "Boundary Built", state: currentMission > 4 ? "earned" : "locked", awardedAt: currentMission > 4 ? "2026-08-19T00:00:00.000Z" : null },
    ],
    currentMission,
    primaryAction: "start-mission",
    engagementDayBucket: "day_1",
    currentAction: firstReviewAvailable ? "choose_boundary" : "choose_direction",
    startingPoint: candidate,
    missions,
    reviews: [
      { milestone: "first", unlockMission: 3, title: "First Personal Review", maxWords: 250, status: firstReviewAvailable ? "available" : "locked" },
      { milestone: "mid", unlockMission: 6, title: "Mid-Programme Personal Review", maxWords: 300, status: "locked" },
      { milestone: "full", unlockMission: 10, title: "Full Programme Personal Review", maxWords: 450, status: "locked" },
    ],
    nextReview: firstReviewAvailable
      ? { milestone: "mid", unlockMission: 6, title: "Mid-Programme Personal Review", xpRemaining: 225, missionsRemaining: 3 }
      : { milestone: "first", unlockMission: 3, title: "First Personal Review", xpRemaining: 150, missionsRemaining: 2 },
    discoveryLinks: commercialDiscoveryLinks,
  };
}

function partialMissionOneHomeFixture() {
  const home = homeFixture(1);
  return {
    ...home,
    totalXp: 20,
    primaryAction: "finish-mission-one",
    currentAction: "program_ai_starting_point_complete",
    startingPoint: null,
    missions: home.missions.map((mission) => mission.missionNumber === 1
      ? { ...mission, actionsCompleted: 1, xpEarnedHere: 20 }
      : mission),
    nextReview: { milestone: "first", unlockMission: 3, title: "First Personal Review", xpRemaining: 170, missionsRemaining: 3 },
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
  await expect(page.getByRole("heading", { name: "Three checks before you begin." })).toBeVisible();
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing what I type or say/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await expect(page.getByRole("button", { name: "Start voice input" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I'd rather type" })).toHaveCount(0);
  await page.getByLabel("Your situation").fill(candidate.startingPoint);
  await page.getByRole("button", { name: "Create my Starting Point" }).click();
  await expect(page.getByRole("heading", { name: "Your Starting Point, in your words." })).toBeVisible();
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
  await page.route("**/api/programme-access/authority", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: isAuthenticated() ? 200 : 401,
        contentType: "application/json",
        body: JSON.stringify(isAuthenticated()
          ? { ok: true, accepted: true }
          : { ok: false, code: "AUTHENTICATION_REQUIRED" }),
      });
    }
    const input = route.request().postDataJSON() as { journeyId?: string } | null;
    return route.fulfill({
      status: isAuthenticated() ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(isAuthenticated() && input?.journeyId
        ? { ok: true, accepted: true, authority: authority(input.journeyId) }
        : { ok: false, code: "AUTHENTICATION_REQUIRED" }),
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
  await expect(page.getByRole("checkbox", { name: /Email me occasional B4GAMBLE product/ })).toHaveCount(1);

  let proofHeader: string | null = null;
  let journeyHeader: string | null = null;
  await page.route("**/api/auth/sign-up/email", async (route) => {
    proofHeader = await route.request().headerValue("x-sevenbet-programme-access-proof");
    journeyHeader = await route.request().headerValue("x-sevenbet-programme-access-journey");
    await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: "TEST_SIGNUP_STOP" }) });
  });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("proof-check@example.test");
  await page.getByLabel("Password").fill("test-password-1234");
  await page.getByRole("button", { name: "Create account with email" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("could not be created");
  expect(proofHeader).toBe("pa1.browser-test.browser-signature");
  expect(journeyHeader).toMatch(/^[0-9a-f-]{36}$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

// Founder decision, 27 Sep 2026: one unticked email opt-in on the registration
// screen serves Google and email sign-up alike, and is asked once.
test("registration asks the optional email opt-in once for Google and email sign-up", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAnonymousProgramme(page);
  await reachRegistration(page);

  const optIn = page.getByRole("checkbox", { name: /Email me occasional B4GAMBLE product/ });
  await expect(optIn).toHaveCount(1);
  await expect(optIn).not.toBeChecked();
  await page.getByRole("button", { name: "Use email instead" }).click();
  await expect(optIn).toHaveCount(1);
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  await expect(optIn).toHaveCount(0);
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await expect(optIn).toHaveCount(1);
  expect(await optIn.evaluate((element) => Number.parseFloat(getComputedStyle(element.closest("label")!.querySelector("span")!).fontSize))).toBeGreaterThanOrEqual(14);

  let signUpBody: Record<string, unknown> | null = null;
  await page.route("**/api/auth/sign-up/email", async (route) => {
    signUpBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: "TEST_SIGNUP_STOP" }) });
  });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("opt-in-check@example.test");
  await page.getByLabel("Password").fill("test-password-1234");
  await page.getByRole("button", { name: "Create account with email" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("could not be created");
  // The confirmation link in the sign-up email lands back on the Programme.
  expect(signUpBody).toMatchObject({ email: "opt-in-check@example.test", callbackURL: "/program" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  if (expectGoogle) {
    await page.getByRole("button", { name: "Hide email option" }).click();
    await optIn.check();
    await page.route("**/api/auth/sign-in/social", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: `${baseUrl}/robots.txt`, redirect: true }),
    }));
    await page.getByRole("button", { name: /Continue with Google/ }).click();
    await page.waitForURL(/robots\.txt/);
    const carried = await page.evaluate(() => ({
      choice: sessionStorage.getItem("sevenbet.programme.google-marketing-choice.v1"),
      journey: sessionStorage.getItem("sevenbet.programme.journey.v2"),
    }));
    expect(JSON.parse(carried.choice ?? "null")).toMatchObject({ version: 1, journeyId: carried.journey });
  }
});

test("Google return records the opt-in ticked before leaving, once, through the preference service", async ({ page }) => {
  const userId = "google-return-opt-in-user";
  const journeyId = "5f0c2a8e-3a1d-4c6b-9e2f-7b1a0d4c8e21";
  await seedOAuthJourney(page, journeyId);
  await page.addInitScript((journey) => {
    if (sessionStorage.getItem("test.opt-in-seeded")) return;
    sessionStorage.setItem("test.opt-in-seeded", "1");
    sessionStorage.setItem("sevenbet.programme.google-marketing-choice.v1", JSON.stringify({ version: 1, journeyId: journey, expiresAt: Date.now() + 5 * 60 * 1000 }));
  }, journeyId);
  await installAuthenticatedSession(page, userId);
  const preferences: unknown[] = [];
  await page.route("**/api/customer/email-preference", (route) => {
    preferences.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ marketingAllowed: true }) });
  });
  await page.route("**/api/program/program-ai/claims/redeem", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: homeFixture() }) }));
  await open(page, "/program?auth=google-return");
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await expect.poll(() => preferences.length).toBe(1);
  expect(preferences[0]).toEqual({ marketingAllowed: true, locale: "en-GB" });
  expect(await page.evaluate(() => sessionStorage.getItem("sevenbet.programme.google-marketing-choice.v1"))).toBeNull();
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  // Google confirmed the address, so the dashboard asks for nothing more.
  await expect(page.locator("[data-programme-email-confirmation]")).toHaveCount(0);
});

test("Google return without a ticked opt-in records nothing", async ({ page }) => {
  const userId = "google-return-no-opt-in-user";
  const journeyId = "0e7d3b52-6c1f-4a8e-8d2b-3f9a6c1e5b74";
  await seedOAuthJourney(page, journeyId);
  await installAuthenticatedSession(page, userId);
  let preferenceRequests = 0;
  await page.route("**/api/customer/email-preference", (route) => {
    preferenceRequests += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ marketingAllowed: true }) });
  });
  await page.route("**/api/program/program-ai/claims/redeem", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: homeFixture() }) }));
  await open(page, "/program?auth=google-return");
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  expect(preferenceRequests).toBe(0);
});

test("an unconfirmed customer can ask for the confirmation link again from the dashboard", async ({ page }) => {
  const userId = "unconfirmed-email-user";
  const journeyId = "b3c9e1f4-2a7d-4e5b-9c8f-1d6a2e4b7c90";
  await page.addInitScript(({ user, access }) => {
    sessionStorage.setItem(`sevenbet.programme.access-authority.v1:user:${encodeURIComponent(user)}`, JSON.stringify(access));
  }, { user: userId, access: authority(journeyId) });
  await page.route("**/api/auth/get-session", (route) => {
    const now = new Date().toISOString();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: { id: "unconfirmed-session", token: "test-token", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now },
        user: { id: userId, name: "unconfirmed", email: "unconfirmed@example.test", emailVerified: false, createdAt: now, updatedAt: now },
      }),
    });
  });
  await page.route("**/api/programme-access/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, accepted: true }) }));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: homeFixture(2) }) }));
  const resendBodies: unknown[] = [];
  await page.route("**/api/auth/send-verification-email", (route) => {
    resendBodies.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: true }) });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/program");
  const notice = page.locator("[data-programme-email-confirmation]");
  await expect(notice).toContainText("Confirm your email: open the link we sent to unconfirmed@example.test.");
  const resend = notice.getByRole("button", { name: "Send the link again" });
  expect(await resend.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.height >= 44 && Number.parseFloat(getComputedStyle(element).fontSize) >= 16;
  })).toBe(true);
  await resend.click();
  await expect(notice.getByRole("status")).toHaveText("Link sent. Check your inbox.");
  expect(resendBodies).toEqual([{ email: "unconfirmed@example.test", callbackURL: "/program" }]);
  // The notice follows the current mission and leads the journey.
  const [card, noticeBox, journey] = await Promise.all([
    page.locator('[data-programme-presentation="dashboard"] section').first().boundingBox(),
    notice.boundingBox(),
    page.locator('[aria-labelledby="programme-path-title"]').boundingBox(),
  ]);
  expect(noticeBox!.y).toBeGreaterThan(card!.y);
  expect(noticeBox!.y).toBeLessThan(journey!.y);
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
  await page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing what I type or say/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  const alert = page.locator('p[role="alert"]');
  await expect(alert).toHaveText("We could not verify Programme access. Check all three boxes and try again.");
  await expect(alert).not.toContainText(/authority|continuation|proof/i);
});

test("canonical access screen distinguishes a disabled runtime from session creation failure", async ({ page }) => {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const input = route.request().postDataJSON() as { journeyId: string };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: authority(input.journeyId) }) });
  });
  let sessionAttempt = 0;
  await page.route("**/api/program/program-ai/session", (route) => {
    sessionAttempt += 1;
    return route.fulfill(sessionAttempt === 1
      ? { status: 404, contentType: "application/json", body: JSON.stringify({ ok: false, code: "PROGRAM_AI_DISABLED", error: "server detail must not render" }) }
      : { status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, code: "INTERNAL_ERROR", error: "server detail must not render" }) });
  });

  await open(page, "/program");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing what I type or say/ }).check();
  const enter = page.getByRole("button", { name: "Enter Mission 01" });
  await enter.click();
  const alert = page.locator('p[role="alert"]');
  await expect(alert).toHaveText("Mission 01 is temporarily unavailable. Your access checks were accepted. Try again later.");
  await expect(alert).not.toContainText(/PROGRAM_AI|server detail|404/i);

  await enter.click();
  await expect(alert).toHaveText("Mission 01 could not be started. Try again.");
  await expect(alert).not.toContainText(/INTERNAL_ERROR|server detail|500/i);
});

test("Google cancellation retains the canonical Starting Point without legacy UI", async ({ page }) => {
  const journeyId = "5de1b8bb-4da6-4a2b-9f6f-6d4890baad0d";
  await seedOAuthJourney(page, journeyId);
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await open(page, "/program?auth=google-error&error=provider-payload-must-not-render");
  await expect(page.getByRole("heading", { name: "Your Starting Point, in your words." })).toBeVisible();
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
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await open(page, "/program?auth=google-error");
  await expect(page.getByRole("heading", { name: "Your Starting Point, in your words." })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Your Starting Point, in your words." })).toBeVisible();
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

test("authenticated partial Mission 01 truthfully re-enters private intake without discarding saved progress", async ({ page }) => {
  const userId = "partial-mission-one-user";
  await installAuthenticatedSession(page, userId);
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, home: partialMissionOneHomeFixture() }),
  }));
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: ["situation_described"], xpPreview: 20 } }),
  }));
  await open(page, "/program");
  await expect(page.getByRole("heading", { name: "Mission 01 — Map the moment" })).toBeVisible();
  await expect(page.getByText("Your first action and XP are saved. For privacy, the situation itself was not retained. Enter one again to finish your Starting Point.", { exact: true })).toBeVisible();
  await expect(page.getByText("1 of 2 actions complete · Short Starting Point", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Finish Mission 01", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tell us what is happening right now." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three checks before you begin." })).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "Three checks before you begin." })).toBeVisible();
  // Three required checks, including the explicit consent (Founder decision, 25 Sep 2026).
  await expect(page.getByRole("checkbox")).toHaveCount(3);
  await expect(page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing/ })).not.toBeChecked();
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
  await expect(page.getByRole("heading", { name: "Three checks before you begin." })).toBeVisible();
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

async function expectBoundedTouchControls(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  const controls = await page.locator("[data-password-reset-page] main a, [data-password-reset-page] main button, [data-password-reset-page] main input").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { text: element.textContent || element.getAttribute("aria-label"), height: rect.height, left: rect.left, right: rect.right, fontSize: Number.parseFloat(getComputedStyle(element).fontSize) };
  }));
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    expect(control.height, `${control.text} height`).toBeGreaterThanOrEqual(44);
    expect(control.left, `${control.text} left`).toBeGreaterThanOrEqual(0);
    expect(control.right, `${control.text} right`).toBeLessThanOrEqual(width);
    expect(control.fontSize, `${control.text} font size`).toBeGreaterThanOrEqual(14);
  }
}

test("Forgot password opens the reset request and confirms neutrally without revealing accounts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/login");
  const forgot = page.getByRole("link", { name: "Forgot password?" });
  await expect(forgot).toHaveAttribute("href", "/reset-password");
  expect(await forgot.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await forgot.click();
  await expect(page).toHaveURL(`${baseUrl}/reset-password`);
  await expect(page.getByRole("heading", { name: "Reset your password." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/login");

  const bodies: unknown[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/request-password-reset") bodies.push(request.postDataJSON());
  });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("No-Account.Reset@Example.com");
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => new URL(candidate.url()).pathname === "/api/auth/request-password-reset"),
    page.getByRole("button", { name: "Send reset link" }).click(),
  ]);
  // The real endpoint accepts the relative redirect and answers the same way for any address.
  expect(response.status()).toBe(200);
  expect(bodies).toEqual([{ email: "no-account.reset@example.com", redirectTo: "/reset-password" }]);
  await expect(page.getByRole("heading", { name: "Check your email." })).toBeFocused();
  await expect(page.getByText("If this email belongs to a B4GAMBLE account, we've sent a link there to reset your password. The link works for 1 hour.")).toBeVisible();
  await expect(page.locator('[data-password-reset-page] [role="alert"]')).toHaveCount(0);
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expectBoundedTouchControls(page, width);
  }
  await page.getByRole("button", { name: "Send another link" }).click();
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toHaveValue("No-Account.Reset@Example.com");
});

test("password reset keeps the Programme language through the request and the emailed return", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/login?returnTo=%2Fde%2Fprogram");
  await expect(page.getByRole("link", { name: "Passwort vergessen?" })).toHaveAttribute("href", "/reset-password?returnTo=%2Fde%2Fprogram");
  await open(page, "/reset-password?returnTo=%2Fde%2Fprogram");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("de-DE");
  await expect(page.getByRole("heading", { name: "Setze dein Passwort zurück." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zurück zur Anmeldung" })).toHaveAttribute("href", "/login?returnTo=%2Fde%2Fprogram");
  const bodies: unknown[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/request-password-reset") bodies.push(request.postDataJSON());
  });
  await page.getByRole("textbox", { name: "E-Mail", exact: true }).fill("kein-konto@example.com");
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => new URL(candidate.url()).pathname === "/api/auth/request-password-reset"),
    page.getByRole("button", { name: "Link senden" }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect(bodies).toEqual([{ email: "kein-konto@example.com", redirectTo: "/reset-password?returnTo=%2Fde%2Fprogram" }]);
  await expect(page.getByRole("heading", { name: "Sieh in dein E-Mail-Postfach." })).toBeVisible();
});

test("an expired or used reset link explains itself and offers a new link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/reset-password?error=INVALID_TOKEN");
  await expect(page.getByRole("heading", { name: "This link no longer works." })).toBeVisible();
  await expect(page.getByText("Each reset link works once, for 1 hour. Enter your email and we'll send you a new one.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await expectBoundedTouchControls(page, 390);

  // A token the server no longer knows is refused by the real endpoint and lands in the same state.
  await open(page, "/reset-password?token=BrowserTestUnknownToken0");
  await expect(page.getByRole("heading", { name: "Choose a new password." })).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill("replacement-password-2");
  await page.getByLabel("Repeat new password", { exact: true }).fill("replacement-password-2");
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => new URL(candidate.url()).pathname === "/api/auth/reset-password"),
    page.getByRole("button", { name: "Save new password" }).click(),
  ]);
  expect(response.status()).toBe(400);
  await expect(page.getByRole("heading", { name: "This link no longer works." })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
});

test("a valid reset link saves the new password once both entries match", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const bodies: unknown[] = [];
  await page.route("**/api/auth/reset-password", (route) => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: true }) });
  });
  await open(page, "/reset-password?token=BrowserTestValidToken000");
  const password = page.getByLabel("New password", { exact: true });
  const repeat = page.getByLabel("Repeat new password", { exact: true });
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  await expect(password).toHaveAttribute("minlength", "8");
  await expectBoundedTouchControls(page, 390);

  await password.fill("replacement-password-2");
  await repeat.fill("replacement-password-3");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.locator('[data-password-reset-page] [role="alert"]')).toHaveText("The passwords do not match.");
  expect(bodies).toEqual([]);

  await repeat.fill("replacement-password-2");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("heading", { name: "Password changed." })).toBeFocused();
  expect(bodies).toEqual([{ newPassword: "replacement-password-2", token: "BrowserTestValidToken000" }]);
  const logIn = page.getByRole("link", { name: "Log in", exact: true });
  await expect(logIn).toHaveAttribute("href", "/login");
  await expectBoundedTouchControls(page, 390);
});
