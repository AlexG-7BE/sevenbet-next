import { createHash, createHmac, randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type APIResponse,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import {
  PROGRAMME_ACCESS_HEADER_VALUES,
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_TTL_MS,
  PROGRAMME_AUTH_ACCESS_HEADERS,
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "../lib/programme/access-contract";
import {
  PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
  PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
  programAiMissionOneActions,
  type ProgrammeStartingPointValue,
} from "../lib/programme/program-ai/contracts";
import { programAiMissionOneRewardPolicy } from "../lib/programme/program-ai/reward-policy";
import { programAiMissionRegistry } from "../lib/programme/program-ai/mission-registry";

const baseURL = "http://127.0.0.1:4173";
const authSecret = "program-ai-ci-auth-secret-not-used-by-production";
const prisma = new PrismaClient();

const startingPoint: ProgrammeStartingPointValue = {
  startingPoint: "I open betting apps after difficult work days.",
  desiredChange: "Pause before opening an app",
  broadContext: "WORK",
  continuationCue: "Continue from the after-work pause",
  chosenBoundaryAction: "Put the phone in another room",
};

const situation = "After difficult work days I keep opening betting apps late at night.";
const missionActionArtifacts: Record<string, Record<string, unknown>> = {
  choose_direction: { direction: "pause" }, build_7_day_goal: { goalStyle: "pause_first", reviewWindowDays: 7 }, reality_check: { realityCheck: "restart_next_day" },
  map_urge_sequence: { sequenceOrder: ["cue", "early_signal", "urge_builds", "choice_point"] }, name_early_signal: { earlySignalCategory: "thought" }, choose_pause_move: { pauseMove: "wait_ten_minutes" },
  choose_boundary: { boundaryCategory: "pause", triggerType: "saved_early_signal" }, build_boundary_rule: { executionMethod: "bank_block" }, choose_execution: { pressureCheck: "needs_setup" },
  run_decision_check: { scenarioChoice: "unexpected_offer" }, build_three_checks: { decisionChecks: ["purpose", "terms", "exit"] }, commit_pause_rule: { pauseRuleType: "pause_when_terms_are_unclear" },
  choose_friction_layer: { frictionMethods: ["bank_block"] }, build_friction_stack: { frictionMethods: ["bank_block", "remove_saved_payment"] }, rehearse_bypass: { fallbackMethod: "leave", bypassReason: "easy_to_disable" },
  choose_support_route: { supportModes: ["protected_help"] }, build_support_card: { supportCardStyle: "when_then" }, choose_exit_action: { exitActionType: "open_help" },
  learn_comparison_signals: { comparisonSignals: ["licensing_status", "material_terms"] }, decode_offer_terms: { offerTermSignal: "wagering_requirement" }, build_research_checklist: { researchCriteria: ["licensing_status", "terms", "withdrawals"] },
  choose_scenario: { scenarioType: "unclear_terms" }, rehearse_response: { responseStrategy: "pause_and_check" }, build_fallback_response: { fallbackStrategy: "leave_and_return" },
  review_my_plan: { timelineReviewed: true }, assemble_final_plan: { planPriorityIds: ["pause_move", "boundary", "fallback"] }, choose_review_cadence: { reviewCadenceDays: 14 },
};
const programmeAgeHeader = {
  [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
};

type AccessAuthority = {
  journeyId: string;
  proof: string;
};

type ProgrammeSession = {
  access: AccessAuthority;
  cookieHeader: string;
  token: string;
};

function tokenHash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function testClientAddress(identity: string) {
  const octet = Number.parseInt(createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 2), 16);
  return `203.0.113.${Math.max(1, octet)}`;
}

function programmeProofSignature(encodedClaims: string) {
  const key = createHmac("sha256", authSecret)
    .update("sevenbet/programme-auth-access/hmac-sha256/v1")
    .digest();
  return createHmac("sha256", key)
    .update(`pa1.${encodedClaims}`, "utf8")
    .digest("base64url");
}

function resignProof(proof: string, mutate: (claims: Record<string, unknown>) => void) {
  const [, encodedClaims] = proof.split(".");
  const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(claims);
  const nextClaims = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  return `pa1.${nextClaims}.${programmeProofSignature(nextClaims)}`;
}

function accessHeaders(authority: AccessAuthority) {
  return {
    [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: authority.proof,
    [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
  };
}

function responseCookie(response: APIResponse, name: string) {
  const prefix = `${name}=`;
  const header = response.headersArray()
    .filter((item) => item.name.toLowerCase() === "set-cookie")
    .map((item) => item.value)
    .find((value) => value.startsWith(prefix));
  const token = header?.slice(prefix.length).split(";", 1)[0];
  expect(token, `${name} response cookie`).toBeTruthy();
  return { token: token!, header: `${name}=${token}` };
}

function storedCookieHeader(cookies: Array<{ name: string; value: string }>) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function issueAccess(client: APIRequestContext, journeyId = randomUUID()) {
  const response = await client.post("/api/programme-access/authority", {
    data: {
      journeyId,
      adultConfirmed: true,
      termsAccepted: true,
      privacyAcknowledged: true,
      termsVersion: PROGRAMME_TERMS_VERSION,
      privacyVersion: PROGRAMME_PRIVACY_VERSION,
    },
  });
  expect(response.status()).toBe(200);
  const payload = await response.json() as { authority: AccessAuthority };
  return payload.authority;
}

async function createProgrammeSession(client: APIRequestContext) {
  const access = await issueAccess(client);
  const response = await client.post("/api/program/program-ai/session", {
    headers: { ...programmeAgeHeader, ...accessHeaders(access) },
  });
  expect(response.status()).toBe(201);
  const cookie = responseCookie(response, "sevenbet_programme_session");
  return { access, cookieHeader: cookie.header, token: cookie.token } satisfies ProgrammeSession;
}

async function confirmSensitiveAuthority(client: APIRequestContext, cookieHeader?: string) {
  const response = await client.post("/api/program/program-ai/authority", {
    headers: { ...programmeAgeHeader, ...(cookieHeader ? { cookie: cookieHeader } : {}) },
    data: {
      confirmed: true,
      purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
      statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
    },
  });
  expect(response.status()).toBe(200);
  return response.json() as Promise<{ authority: { active: boolean; confirmedAt: string } }>;
}

async function prepareReadyClaim(client: APIRequestContext) {
  const session = await createProgrammeSession(client);
  await confirmSensitiveAuthority(client, session.cookieHeader);
  const turn = await client.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(turn.status()).toBe(200);
  const confirm = await client.post("/api/program/program-ai/starting-point", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: startingPoint,
  });
  expect(confirm.status()).toBe(200);
  const claim = await client.post("/api/program/program-ai/claim", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
  });
  expect(claim.status()).toBe(201);
  const claimCookie = responseCookie(claim, "sevenbet_programme_claim");
  return {
    ...session,
    claimToken: claimCookie.token,
    claimCookieHeader: claimCookie.header,
  };
}

async function signUp(client: APIRequestContext, authority: AccessAuthority, email: string) {
  const response = await client.post("/api/auth/sign-up/email", {
    headers: {
      ...accessHeaders(authority),
      origin: baseURL,
      "x-forwarded-for": testClientAddress(email),
    },
    data: { email, password: "Programme-test-password-42!", name: "Programme browser test" },
  });
  expect(response.status(), await response.text()).toBe(200);
  const sessionCookie = (await client.storageState()).cookies.find((cookie) => cookie.name.includes("session_token"));
  expect(sessionCookie, "Better Auth session cookie").toBeTruthy();
  return {
    user: await prisma.user.findUniqueOrThrow({ where: { email } }),
    authCookieHeader: `${sessionCookie!.name}=${sessionCookie!.value}`,
  };
}

async function anonymousSessionFromContext(context: BrowserContext) {
  const cookie = (await context.cookies()).find((item) => item.name === "sevenbet_programme_session");
  expect(cookie, "anonymous Programme cookie").toBeTruthy();
  return prisma.anonymousProgrammeSession.findUniqueOrThrow({
    where: { tokenHash: tokenHash(cookie!.value) },
  });
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("session creation rejects every direct access-proof bypass", async ({ request }) => {
  const authority = await issueAccess(request);
  const ipHeaders = { "x-forwarded-for": "203.0.113.41" };
  const postSession = (headers: Record<string, string>) => request.post("/api/program/program-ai/session", {
    headers: { ...programmeAgeHeader, ...ipHeaders, ...headers },
  });
  const forgedParts = authority.proof.split(".");
  const forgedSignatureBytes = Buffer.from(forgedParts[2], "base64url");
  forgedSignatureBytes[0] ^= 1;
  const forgedSignature = `${forgedParts[0]}.${forgedParts[1]}.${forgedSignatureBytes.toString("base64url")}`;
  const now = Date.now();
  const expired = resignProof(authority.proof, (claims) => {
    const createdAt = now - PROGRAMME_ACCESS_TTL_MS - 1_000;
    claims.createdAt = createdAt;
    claims.expiresAt = createdAt + PROGRAMME_ACCESS_TTL_MS;
    claims.adultConfirmedAt = createdAt;
    claims.termsAcceptedAt = createdAt;
    claims.privacyAcknowledgedAt = createdAt;
  });
  const cases: Array<[string, Record<string, string>]> = [
    ["no proof", {}],
    ["static forged headers", {
      [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
      [PROGRAMME_ACCESS_HEADERS.terms]: PROGRAMME_ACCESS_HEADER_VALUES.terms,
      [PROGRAMME_ACCESS_HEADERS.privacy]: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
    }],
    ["forged signature", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: forgedSignature,
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
    }],
    ["wrong journey", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: authority.proof,
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: randomUUID(),
    }],
    ["wrong purpose", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: resignProof(authority.proof, (claims) => { claims.purpose = "MARKETING"; }),
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
    }],
    ["stale Terms", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: resignProof(authority.proof, (claims) => { claims.termsVersion = "terms:stale"; }),
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
    }],
    ["stale Privacy", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: resignProof(authority.proof, (claims) => { claims.privacyVersion = "privacy:stale"; }),
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
    }],
    ["expired", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: expired,
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
    }],
    ["malformed", {
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: "pa1.not-json.not-a-signature",
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
    }],
  ];

  for (const [name, headers] of cases) {
    const response = await postSession(headers);
    expect(response.status(), name).toBe(403);
    expect((await response.json()).code, name).toBe("CURRENT_ACCESS_AUTHORITY_REQUIRED");
  }

  const valid = await postSession(accessHeaders(authority));
  expect(valid.status()).toBe(201);
  const cookie = responseCookie(valid, "sevenbet_programme_session");
  await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: tokenHash(cookie.token) } });
});

test("voice recording produces an editable transcript, releases tracks and can be cancelled", async ({ page }) => {
  await page.addInitScript(() => {
    const stoppedTracksKey = "program-ai-test-stopped-tracks";
    if (window.sessionStorage.getItem(stoppedTracksKey) === null) window.sessionStorage.setItem(stoppedTracksKey, "0");
    let failRecorder: (() => void) | null = null;
    class FakeMediaRecorder {
      static isTypeSupported(type: string) { return type === "audio/webm;codecs=opus"; }
      state = "inactive";
      mimeType: string;
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(_stream: MediaStream, options?: { mimeType?: string }) {
        this.mimeType = options?.mimeType || "audio/webm";
        failRecorder = () => this.onerror?.();
      }
      start() { this.state = "recording"; }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2, 3])], { type: this.mimeType }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeMediaRecorder });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => window.sessionStorage.setItem(stoppedTracksKey, String(Number(window.sessionStorage.getItem(stoppedTracksKey)) + 1)) }],
        }),
      },
    });
    Object.defineProperty(window, "__programAiStoppedTracks", { get: () => Number(window.sessionStorage.getItem(stoppedTracksKey)) });
    Object.defineProperty(window, "__programAiFailRecorder", { value: () => failRecorder?.() });
  });
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/program/program-ai/session", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }),
    });
  });
  await page.route("**/api/program/program-ai/authority", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { active: true } }),
    });
  });
  await page.goto("/program");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
  let transcriptionCalls = 0;
  await page.route("**/api/program/program-ai/transcription", async (route) => {
    transcriptionCalls += 1;
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        transcript: "After difficult work days I keep opening betting apps late at night.",
        timing: { transcriptionRequestMs: 321 },
      }),
    });
  });

  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "recording");
  await expect(page.getByText("Recording · 00:00 / 01:30")).toBeVisible();
  const recordingDot = page.locator("[data-recording-indicator]");
  expect(await recordingDot.evaluate((element) => getComputedStyle(element).animationName)).not.toBe("none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(recordingDot).toHaveCSS("animation-name", "none");
  await page.clock.fastForward(1_000);
  await expect(page.getByText("Recording · 00:01 / 01:30")).toBeVisible();
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByLabel("Editable transcript")).toHaveValue(situation);
  await expect(page.getByText("Transcript ready to review")).toBeVisible();
  await page.clock.fastForward(2_000);
  await expect(page.getByText("Transcript ready to review")).toBeVisible();
  expect(transcriptionCalls).toBe(1);
  expect(await page.evaluate(() => (window as unknown as { __programAiStoppedTracks: number }).__programAiStoppedTracks)).toBe(1);

  await page.getByRole("button", { name: "Record again" }).click();
  await expect(page.getByText("Recording · 00:00 / 01:30")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "cancelled");
  await page.clock.fastForward(2_000);
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "cancelled");
  expect(transcriptionCalls).toBe(1);
  expect(await page.evaluate(() => (window as unknown as { __programAiStoppedTracks: number }).__programAiStoppedTracks)).toBe(2);
  await expect(page.getByText("Type instead")).toBeVisible();

  await page.getByRole("button", { name: "Start recording" }).click();
  await page.clock.fastForward(90_000);
  await expect(page.getByText("Transcript ready to review")).toBeVisible();
  expect(transcriptionCalls).toBe(2);

  await page.getByRole("button", { name: "Record again" }).click();
  await page.evaluate(() => (window as unknown as { __programAiFailRecorder: () => void }).__programAiFailRecorder());
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "error");
  await page.clock.fastForward(2_000);
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "error");
  expect(transcriptionCalls).toBe(2);
  await page.getByRole("button", { name: "type instead" }).click();

  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("Recording · 00:00 / 01:30")).toBeVisible();
  await page.getByRole("link", { name: "B4GAMBLE" }).click();
  await expect(page).toHaveURL("/");
  expect(transcriptionCalls).toBe(2);
  expect(await page.evaluate(() => (window as unknown as { __programAiStoppedTracks: number }).__programAiStoppedTracks)).toBe(5);
  await noHorizontalOverflow(page);

  const cookie = (await page.context().cookies()).find((item) => item.name === "sevenbet_programme_session");
  if (cookie) await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: tokenHash(cookie.value) } });
});

test("fresh microphone access uses the browser request before denied recovery", async ({ page }) => {
  await page.addInitScript(() => {
    let permissionRequests = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          permissionRequests += 1;
          throw new DOMException("Permission denied by test user", "NotAllowedError");
        },
      },
    });
    Object.defineProperty(window, "__programAiPermissionRequests", { get: () => permissionRequests });
  });
  await page.route("**/api/program/program-ai/session", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }),
    });
  });
  await page.route("**/api/program/program-ai/authority", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { active: true } }),
    });
  });
  await page.goto("/program");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();

  await expect(page.getByText("Prefer to speak?")).toBeVisible();
  await expect(page.getByText("Microphone permission was denied")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __programAiPermissionRequests: number }).__programAiPermissionRequests)).toBe(0);
  await page.getByRole("button", { name: "Start recording" }).click();
  expect(await page.evaluate(() => (window as unknown as { __programAiPermissionRequests: number }).__programAiPermissionRequests)).toBe(1);
  await expect(page.getByText("Microphone permission was denied")).toBeVisible();
  await expect(page.getByRole("button", { name: "type instead" })).toBeVisible();
});

test("typed fallback path binds exact authority and is idempotent through real email auth", async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testClientAddress(randomUUID()) });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/program");

  await expect(page.getByRole("heading", { name: "Two checks before you begin" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  for (const checkbox of await page.getByRole("checkbox").all()) {
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
  }
  await noHorizontalOverflow(page);
  await page.getByRole("button", { name: "Enter Mission 01" }).click();

  await expect(page.getByRole("heading", { name: "What feels hardest to control right now?" })).toBeVisible();
  const sensitiveCheckbox = page.getByRole("checkbox");
  await sensitiveCheckbox.focus();
  await page.keyboard.press("Space");
  await expect(sensitiveCheckbox).toBeChecked();
  const recorder = page.getByRole("button", { name: "Start recording" });
  await recorder.focus();
  await page.keyboard.press("Enter");
  const recorderState = page.locator("[data-state]").first();
  await expect(recorderState).not.toHaveAttribute("data-state", "idle");
  await expect(recorderState).toContainText(/Requesting microphone|Listening locally|Microphone permission was denied|Voice transcription is not connected/);
  const situationField = page.getByLabel("Your situation");
  await situationField.focus();
  await situationField.fill(situation);
  await page.getByRole("button", { name: "Create my Starting Point" }).click();

  await expect(page.getByRole("heading", { name: "Check your Starting Point." })).toBeVisible();
  await expect(page.getByText("Personalisation did not produce this draft.")).toBeVisible();
  await expect(page.getByText("20 XP", { exact: true })).toBeVisible();
  const anonymousSession = await anonymousSessionFromContext(page.context());
  const anonymousAuthority = await prisma.programmeSensitiveInputAuthority.findFirstOrThrow({
    where: { anonymousSessionId: anonymousSession.id, withdrawnAt: null },
  });
  expect(anonymousAuthority.userId).toBeNull();

  const duplicateTurn = await page.request.post("/api/program/program-ai/turn", {
    headers: {
      ...programmeAgeHeader,
      cookie: `sevenbet_programme_session=${(await page.context().cookies()).find((cookie) => cookie.name === "sevenbet_programme_session")!.value}`,
    },
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(duplicateTurn.status()).toBe(200);
  expect((await duplicateTurn.json()).progress.xpPreview).toBe(20);

  await page.setViewportSize({ width: 320, height: 760 });
  await noHorizontalOverflow(page);
  await page.getByLabel("What is happening now?").fill(startingPoint.startingPoint);
  await page.getByLabel("What would you like to change?").fill(startingPoint.desiredChange);
  await page.getByLabel("Broad context").selectOption(startingPoint.broadContext);
  await page.getByLabel("What should Mission 02 continue from?").fill(startingPoint.continuationCue);
  await page.getByLabel("Optional boundary action").fill(startingPoint.chosenBoundaryAction!);
  await page.getByRole("button", { name: "Confirm my Starting Point" }).click();
  await expect(page.getByRole("heading", { name: "Your Starting Point is ready." })).toBeVisible();

  const duplicateStartingPoint = await page.request.post("/api/program/program-ai/starting-point", {
    headers: {
      ...programmeAgeHeader,
      cookie: `sevenbet_programme_session=${(await page.context().cookies()).find((cookie) => cookie.name === "sevenbet_programme_session")!.value}`,
    },
    data: startingPoint,
  });
  expect(duplicateStartingPoint.status()).toBe(200);
  expect((await duplicateStartingPoint.json()).xpPreview).toBe(40);
  await page.getByRole("button", { name: "Keep this progress" }).click();
  await expect(page.getByRole("heading", { name: "Keep the Starting Point you confirmed." })).toBeVisible();

  const claimCookie = (await page.context().cookies()).find((item) => item.name === "sevenbet_programme_claim");
  expect(claimCookie, "pending claim cookie before auth").toBeTruthy();
  const email = `program-ai-happy-${randomUUID()}@example.test`;
  const wrongUserEmail = `program-ai-wrong-${randomUUID()}@example.test`;
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Programme-test-password-42!");
  await page.getByRole("button", { name: "Create account with email" }).click();
  await expect(page.getByRole("heading", { name: "02 · Set a 7-day goal" })).toBeVisible();
  await expect(page.getByText("40 XP", { exact: true })).toBeVisible();
  await noHorizontalOverflow(page);

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const [durableStartingPoints, programmeAiXp, boundAuthority, claim] = await Promise.all([
    prisma.programmeStartingPoint.findMany({ where: { userId: user.id } }),
    prisma.userXpEvent.findMany({
      where: { userId: user.id, awardKey: { in: [
        programAiMissionOneRewardPolicy.situationSubmitted.awardKey,
        programAiMissionOneRewardPolicy.startingPointComplete.awardKey,
      ] } },
    }),
    prisma.programmeSensitiveInputAuthority.findFirstOrThrow({
      where: { userId: user.id, withdrawnAt: null },
    }),
    prisma.pendingProgrammeClaim.findUniqueOrThrow({ where: { anonymousSessionId: anonymousSession.id } }),
  ]);
  expect(durableStartingPoints).toHaveLength(1);
  expect(durableStartingPoints[0].startingPoint).toBe(startingPoint.startingPoint);
  expect(programmeAiXp).toHaveLength(2);
  expect(programmeAiXp.reduce((total, event) => total + event.xp, 0)).toBe(40);
  expect(boundAuthority.anonymousSessionId).toBeNull();
  expect(boundAuthority.userId).toBe(user.id);
  expect(claim.consumedByUserId).toBe(user.id);
  expect(claim.consumedAt).not.toBeNull();

  await page.context().addCookies([claimCookie!]);
  const duplicateClaim = await page.request.post("/api/program/program-ai/claims/redeem", {
    headers: {
      ...programmeAgeHeader,
      cookie: storedCookieHeader(await page.context().cookies()),
    },
    data: { timeZone: "UTC", startingPoint },
  });
  expect(duplicateClaim.status()).toBe(200);
  expect((await duplicateClaim.json()).home.totalXp).toBe(40);
  expect(await prisma.programmeStartingPoint.count({ where: { userId: user.id } })).toBe(1);
  expect(await prisma.userXpEvent.count({ where: { userId: user.id, awardKey: { in: programmeAiXp.map((event) => event.awardKey) } } })).toBe(2);

  const wrongClient = await playwrightRequest.newContext({ baseURL });
  const wrongAccess = await issueAccess(wrongClient);
  const { user: wrongUser } = await signUp(wrongClient, wrongAccess, wrongUserEmail);
  const wrongState = await wrongClient.storageState();
  await wrongClient.dispose();
  const wrongClaimClient = await playwrightRequest.newContext({
    baseURL,
    storageState: {
      cookies: [...wrongState.cookies, claimCookie!],
      origins: [],
    },
  });
  const wrongClaim = await wrongClaimClient.post("/api/program/program-ai/claims/redeem", {
    headers: {
      ...programmeAgeHeader,
      cookie: storedCookieHeader([...wrongState.cookies, claimCookie!]),
    },
    data: { timeZone: "UTC", startingPoint },
  });
  expect(wrongClaim.status()).toBe(409);
  expect((await wrongClaim.json()).code).toBe("CONFLICT");
  await wrongClaimClient.dispose();
  expect((await prisma.programmeSensitiveInputAuthority.findUniqueOrThrow({ where: { id: boundAuthority.id } })).userId).toBe(user.id);

  await prisma.anonymousProgrammeSession.delete({ where: { id: anonymousSession.id } });
  const authorityAfterAnonymousCleanup = await prisma.programmeSensitiveInputAuthority.findUniqueOrThrow({
    where: { id: boundAuthority.id },
  });
  expect(authorityAfterAnonymousCleanup.anonymousSessionId).toBeNull();
  expect(authorityAfterAnonymousCleanup.userId).toBe(user.id);

  await prisma.user.deleteMany({ where: { id: { in: [user.id, wrongUser.id] } } });
});

test("database-backed Missions 02–10 path resumes, unlocks Reviews and reaches exactly 715 XP", async ({ page }) => {
  const client = page.request;
  const ready = await prepareReadyClaim(client);
  const email = `program-ai-ten-step-${randomUUID()}@example.test`;
  const { user, authCookieHeader } = await signUp(client, ready.access, email);
  const redeem = await client.post("/api/program/program-ai/claims/redeem", {
    headers: { ...programmeAgeHeader, cookie: `${ready.cookieHeader}; ${ready.claimCookieHeader}; ${authCookieHeader}` },
    data: { timeZone: "UTC", startingPoint },
  });
  const redeemPayload = await redeem.json();
  expect(redeem.status(), JSON.stringify(redeemPayload)).toBe(200);
  expect(redeemPayload.home.totalXp).toBe(40);

  for (const mission of programAiMissionRegistry) {
    for (const [index, action] of mission.actions.entries()) {
      const requestAction = () => client.post(`/api/program/program-ai/missions/${mission.missionNumber}/actions`, {
        headers: { cookie: authCookieHeader },
        data: { action: action.id, artifact: missionActionArtifacts[action.id] },
      });
      if (mission.missionNumber === 2 && index === 0) {
        const concurrent = await Promise.all([requestAction(), requestAction()]);
        expect(concurrent.map((response) => response.status())).toEqual([200, 200]);
        const awards = await Promise.all(concurrent.map(async (response) => (await response.json()).xpAwarded as number));
        expect(awards.sort((left, right) => left - right)).toEqual([0, 15]);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto("/program");
        await expect(page.getByRole("heading", { name: "02 · Set a 7-day goal" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Resume Mission 02" })).toBeVisible();
        await noHorizontalOverflow(page);
        await page.reload();
        await expect(page.getByRole("button", { name: "Resume Mission 02" })).toBeVisible();
      } else {
        const response = await requestAction();
        expect(response.status(), `${mission.missionNumber}:${action.id} ${await response.text()}`).toBe(200);
      }
    }
    const complete = await client.post(`/api/program/program-ai/missions/${mission.missionNumber}/complete`, {
      headers: { cookie: authCookieHeader },
      data: {},
    });
    const completePayload = await complete.json();
    expect(complete.status(), `complete ${mission.missionNumber}: ${JSON.stringify(completePayload)}`).toBe(200);
    expect(completePayload.xpAwarded).toBe(25);

    const milestone = mission.missionNumber === 3 ? "first" : mission.missionNumber === 6 ? "mid" : mission.missionNumber === 10 ? "full" : null;
    if (milestone) {
      const beforeReview = await prisma.userXpEvent.aggregate({ where: { userId: user.id }, _sum: { xp: true } });
      const review = await client.get(`/api/program/program-ai/reviews/${milestone}`, { headers: { cookie: authCookieHeader } });
      expect(review.status()).toBe(200);
      expect((await review.json()).review.generation).toBe("deterministic_fallback");
      const afterReview = await prisma.userXpEvent.aggregate({ where: { userId: user.id }, _sum: { xp: true } });
      expect(afterReview._sum.xp).toBe(beforeReview._sum.xp);
    }
  }

  const xp = await prisma.userXpEvent.aggregate({ where: { userId: user.id }, _sum: { xp: true } });
  expect(xp._sum.xp).toBe(715);
  expect(await prisma.userXpEvent.count({ where: { userId: user.id } })).toBe(38);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/program");
  await expect(page.getByText("715 XP", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "10 · Make the plan reviewable" })).toBeVisible();
  await expect(page.locator("li[data-state='completed']")).toHaveCount(10);
  await expect(page.getByRole("button", { name: "Open review" })).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "Explore B4GAMBLE" }).getByRole("link")).toHaveCount(4);
  await noHorizontalOverflow(page);

  await page.getByRole("button", { name: "Open review" }).last().click();
  await expect(page.getByRole("heading", { name: "Full Programme Personal Review" })).toBeVisible();
  await expect(page.getByText("0 XP", { exact: false }).first()).toBeVisible();
  await noHorizontalOverflow(page);
  await prisma.user.delete({ where: { id: user.id } });
});

test("clarification cannot refresh authority, withdrawal blocks turns, and a new action can reconfirm", async ({ page }) => {
  const request = page.request;
  const session = await createProgrammeSession(request);
  const initial = await confirmSensitiveAuthority(request, session.cookieHeader);

  const firstTurn = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(firstTurn.status()).toBe(200);
  const clarification = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { inputMode: "text", situation, clarificationAnswers: ["I want a pause before I open the app."] },
  });
  expect(clarification.status()).toBe(200);
  const afterClarification = await request.get("/api/program/program-ai/authority", {
    headers: { cookie: session.cookieHeader },
  });
  expect(afterClarification.status()).toBe(200);
  expect((await afterClarification.json()).authority.confirmedAt).toBe(initial.authority.confirmedAt);

  const withdrawal = await request.delete("/api/program/program-ai/authority", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
  });
  expect(withdrawal.status()).toBe(200);
  const blocked = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).code).toBe("SENSITIVE_INPUT_AUTHORITY_REQUIRED");

  const reconfirmed = await confirmSensitiveAuthority(request, session.cookieHeader);
  expect(new Date(reconfirmed.authority.confirmedAt).getTime()).toBeGreaterThanOrEqual(
    new Date(initial.authority.confirmedAt).getTime(),
  );
  const resumed = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(resumed.status()).toBe(200);

  await prisma.anonymousProgrammeSession.deleteMany({
    where: { tokenHash: tokenHash(session.token) },
  });
});

test("completed legacy Mission 01 dominates a new claim and awards no new 40 XP", async ({ page }) => {
  const client = page.request;
  const ready = await prepareReadyClaim(client);
  const anonymousSession = await prisma.anonymousProgrammeSession.findUniqueOrThrow({
    where: { tokenHash: tokenHash(ready.token) },
  });
  const email = `program-ai-legacy-${randomUUID()}@example.test`;
  const { user, authCookieHeader } = await signUp(client, ready.access, email);
  const program = await prisma.program.findFirstOrThrow({
    where: { slug: "sevenbet-10-step-control-program" },
    include: { steps: { orderBy: { order: "asc" } }, versions: { where: { status: "PUBLISHED" } } },
  });
  const version = program.versions.find((item) => item.version === program.publishedVersion);
  expect(version).toBeTruthy();
  const enrollment = await prisma.programEnrollment.create({
    data: {
      userId: user.id,
      programId: program.id,
      programVersionId: version!.id,
      currentStepId: program.steps[1].id,
      timezone: "UTC",
    },
  });
  await prisma.programmeMissionProgress.create({
    data: {
      enrollmentId: enrollment.id,
      missionNumber: 1,
      status: "COMPLETED",
      taskStates: ["legacy_mission_one_complete"],
      completedAt: new Date(),
    },
  });
  await prisma.userXpEvent.create({
    data: {
      userId: user.id,
      programId: program.id,
      missionNumber: 1,
      awardKey: "programme:mission:01:save:v1",
      eventType: "MISSION_COMPLETION",
      xp: 60,
      sourceArtifactType: "MOMENT_MAP",
      sourceArtifactId: enrollment.id,
    },
  });

  const redeem = await client.post("/api/program/program-ai/claims/redeem", {
    headers: {
      ...programmeAgeHeader,
      cookie: `${ready.cookieHeader}; ${ready.claimCookieHeader}; ${authCookieHeader}`,
    },
    data: { timeZone: "UTC", startingPoint },
  });
  expect(redeem.status(), await redeem.text()).toBe(200);
  const payload = await redeem.json() as { home: { totalXp: number; currentMission: number; startingPoint: unknown } };
  expect(payload.home.totalXp).toBe(60);
  expect(payload.home.currentMission).toBe(2);
  expect(payload.home.startingPoint).toBeNull();
  expect(await prisma.programmeStartingPoint.count({ where: { userId: user.id } })).toBe(0);
  expect(await prisma.userXpEvent.count({
    where: {
      userId: user.id,
      awardKey: { in: [
        programAiMissionOneRewardPolicy.situationSubmitted.awardKey,
        programAiMissionOneRewardPolicy.startingPointComplete.awardKey,
      ] },
    },
  })).toBe(0);

  await prisma.user.delete({ where: { id: user.id } });
  await prisma.anonymousProgrammeSession.deleteMany({ where: { id: anonymousSession.id } });
});

test("support-first keeps 20 XP, protected Help, and no registration CTA", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/program");
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await expect(page.getByRole("button", { name: "Enter Mission 01" })).toBeEnabled();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await expect(page.getByRole("heading", { name: "What feels hardest to control right now?" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByLabel("Your situation").fill(situation);
  await page.route("**/api/program/program-ai/turn", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        result: {
          kind: "STARTING_POINT_CANDIDATE",
          candidate: startingPoint,
          generation: "PROVIDER",
          disposition: "SUPPORT_FIRST",
        },
        progress: { taskStates: [programAiMissionOneActions[0]], xpPreview: 20 },
      }),
    });
  });
  await page.getByRole("button", { name: "Create my Starting Point" }).click();

  await expect(page.getByRole("heading", { name: "Pause the Programme. Keep support close." })).toBeVisible();
  await expect(page.getByText("20 XP", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open protected Help" })).toHaveAttribute("href", "/responsible-gambling");
  await expect(page.getByRole("button", { name: /register|account|keep this progress/i })).toHaveCount(0);
  await expect(page.getByText("Registration and celebration are paused on this screen.")).toBeVisible();
  await noHorizontalOverflow(page);

  const cookie = (await page.context().cookies()).find((item) => item.name === "sevenbet_programme_session");
  if (cookie) {
    await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: tokenHash(cookie.value) } });
  }
});
