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
import { programmeMissionCopy } from "../lib/i18n/programme-catalog";
import { publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { programAiMissionOneRewardPolicy } from "../lib/programme/program-ai/reward-policy";
import {
  missionStep,
  programAiMissionRegistry,
  programAiMissionSourcePresentation,
  programmeJourney,
} from "../lib/programme/program-ai/mission-registry";
import { programmePath, type ProgrammeLocale } from "../lib/programme/presentation";

// The other browser specs read the port the same way, so two sessions can run side by side.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const authSecret = "program-ai-ci-auth-secret-not-used-by-production";
const prisma = new PrismaClient();

test.beforeEach(async () => {
  await prisma.programmeRuntimeRateLimitBucket.deleteMany();
});

const startingPoint: ProgrammeStartingPointValue = {
  startingPoint: "I open betting apps after difficult work days.",
  desiredChange: "Pause before opening an app",
  broadContext: "WORK",
  continuationCue: "Continue from the after-work pause",
  chosenBoundaryAction: "Put the phone in another room",
};

// Founder decisions, 11 Oct 2026: Mission 01 takes picked ready answers; this is what two of them send.
const situation = "What feels hardest right now? I chase my losses. I spend more than I plan.";
const bestEffortStartingPoint: ProgrammeStartingPointValue = {
  startingPoint: situation,
  desiredChange: "Build more control around the situation described here.",
  broadContext: "NOT_SPECIFIED",
  continuationCue: "Continue from the situation described in Mission 01.",
};
const missionActionArtifacts: Record<string, Record<string, unknown>> = {
  choose_direction: { direction: "pause" }, build_7_day_goal: { goalStyle: "pause_first", reviewWindowDays: 7 }, reality_check: { realityCheck: "restart_next_day" },
  map_urge_sequence: { sequenceOrder: ["cue", "early_signal", "urge_builds", "choice_point"] }, name_early_signal: { earlySignalCategory: "thought" }, choose_pause_move: { pauseMove: "wait_ten_minutes" },
  choose_boundary: { boundaryCategory: "pause", triggerType: "saved_early_signal" }, build_boundary_rule: { executionMethod: "bank_block" }, choose_execution: { pressureCheck: "needs_setup" },
  run_decision_check: { scenarioChoice: "unexpected_offer" }, build_three_checks: { decisionChecks: ["purpose", "terms", "exit"] }, commit_pause_rule: { pauseRuleType: "pause_when_terms_are_unclear" },
  choose_friction_layer: { frictionMethods: ["bank_block"] }, build_friction_stack: { frictionMethods: ["bank_block", "remove_saved_payment"] }, rehearse_bypass: { fallbackMethod: "leave", bypassReason: "easy_to_disable" },
  choose_support_route: { supportModes: ["protected_help"] }, build_support_card: { supportCardStyle: "when_then" }, choose_exit_action: { exitActionType: "open_help" },
  learn_comparison_signals: { trustedPerson: "friend", openingLine: "call_me" }, decode_offer_terms: { helpService: "phone" }, build_research_checklist: { firstTenMinutes: ["phone_away", "send_line", "contact_service"] },
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
    data: { locale: "en-GB", inputMode: "text", situation, clarificationAnswers: [] },
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

async function openCurrentMission(page: Page, missionNumber: number, width: number, action: "Start mission" | "Resume mission" = "Start mission") {
  const mission = programAiMissionRegistry.find((item) => item.missionNumber === missionNumber)!;
  await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
  await page.goto("/program");
  await page.getByRole("button", { name: action, exact: true }).click();
  await expect(page.getByRole("heading", { name: programAiMissionSourcePresentation(mission.missionNumber).title, exact: true })).toBeVisible();
  await noHorizontalOverflow(page);
}

async function programmeInvariantSnapshot(userId: string) {
  const [enrollments, xp, xpEventCount, anonymousSessionCount] = await Promise.all([
    prisma.programEnrollment.findMany({
      where: { userId },
      orderBy: { id: "asc" },
      select: {
        id: true,
        userId: true,
        programId: true,
        programVersionId: true,
        completedAt: true,
        missionProgress: {
          orderBy: { missionNumber: "asc" },
          select: {
            id: true,
            missionNumber: true,
            status: true,
            taskStates: true,
            completedAt: true,
          },
        },
        programmeStartingPoint: {
          select: {
            id: true,
            enrollmentId: true,
            startingPoint: true,
            desiredChange: true,
            broadContext: true,
            continuationCue: true,
            chosenBoundaryAction: true,
            confirmedAt: true,
          },
        },
      },
    }),
    prisma.userXpEvent.aggregate({ where: { userId }, _sum: { xp: true } }),
    prisma.userXpEvent.count({ where: { userId } }),
    prisma.anonymousProgrammeSession.count(),
  ]);
  return JSON.parse(JSON.stringify({
    enrollments,
    xp: xp._sum.xp ?? 0,
    xpEventCount,
    anonymousSessionCount,
  })) as unknown;
}

async function switchProgrammeLocale(page: Page, from: ProgrammeLocale, to: ProgrammeLocale) {
  const selector = page.locator("[data-programme-language-selector]:visible");
  await selector.getByRole("button", { name: publicShellMessages(from).changeMarketAndLanguage }).click();
  await selector.locator(`a[href="${programmePath(to)}"]`).click();
  await expect(page).toHaveURL(programmePath(to));
  await expect(page.locator("html")).toHaveAttribute("lang", to);
  await expect(page.locator("[data-programme-language-selector]:visible").getByRole("button", {
    name: publicShellMessages(to).changeMarketAndLanguage,
  })).toBeVisible();
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

test("distributed session creation limiting returns a safe 429 while Help stays public", async ({ page }) => {
  const authority = await issueAccess(page.request);
  const tokenHashes: string[] = [];
  const headers = {
    ...programmeAgeHeader,
    ...accessHeaders(authority),
    "x-forwarded-for": "203.0.113.211",
  };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await page.request.post("/api/program/program-ai/session", { headers });
    expect(response.status(), `allowed attempt ${attempt + 1}`).toBe(201);
    tokenHashes.push(tokenHash(responseCookie(response, "sevenbet_programme_session").token));
  }
  const limited = await page.request.post("/api/program/program-ai/session", { headers });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
  expect(await limited.json()).toEqual({
    code: "RATE_LIMITED",
    retryAfterSeconds: Number(limited.headers()["retry-after"]),
  });

  await page.goto("/help");
  await expect(page.getByRole("heading", { name: /We're here\..*No strings\./i })).toBeVisible();
  await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: { in: tokenHashes } } });
});

test("the retired voice routes are gone and an unlisted Programme mutation still needs age evidence", async ({ request }) => {
  // Founder decision, 11 Oct 2026: Mission 01 takes picked answers only; the voice routes were removed.
  const session = await createProgrammeSession(request);
  await confirmSensitiveAuthority(request, session.cookieHeader);
  const offer = "v=0\r\no=programme-authority-integration-test\r\n";

  for (const path of [
    "/api/program/program-ai/transcription",
    "/api/program/program-ai/transcription/realtime?locale=en-GB",
  ]) {
    const rejected = await request.post(path, {
      headers: { cookie: session.cookieHeader, "content-type": "application/sdp" },
      data: offer,
    });
    expect(rejected.status(), path).toBe(403);
    expect(await rejected.json(), path).toMatchObject({ code: "AGE_ATTESTATION_REQUIRED" });

    const missing = await request.post(path, {
      headers: { ...programmeAgeHeader, cookie: session.cookieHeader, "content-type": "application/sdp" },
      data: offer,
    });
    expect(missing.status(), path).toBe(404);
  }

  await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: tokenHash(session.token) } });
});

test("no Programme document carries a casino, offer or partner address, the old lesson cookie included", async ({ request }) => {
  // Founder, 16 October 2026: the Programme links to no casino page. Its header and footer are built
  // without the research links, so not even the page's inline data (where the children of a client
  // component are written) carries their addresses.
  for (const urlPath of ["/program", "/sv/program", "/da/program", "/program/missing", "/sv/program/missing"]) {
    for (const cookie of [undefined, "b4g_research_access=open"]) {
      const response = await request.get(urlPath, cookie ? { headers: { cookie } } : undefined);
      const html = await response.text();
      // The Programme's own shell answered, with its menu (a 404 carries the menu in its inline data).
      expect(html, urlPath).toContain("data-public-programme-shell");
      expect(html, urlPath).toMatch(/navigation-href[^/]{1,8}\/learn/);
      for (const address of ["/best-offers", "/casinos", "/casino/", "/catalog", "/bonuses", "/compare", "/bonus-guide", "/wagering-calculator", "/outbound"]) {
        expect(html, `${urlPath}: ${address}${cookie ? " (old lesson cookie)" : ""}`).not.toContain(address);
      }
      expect(html, urlPath).not.toMatch(/(?:["'(]|https?:\/\/[a-z0-9.:-]+)(?:\/[a-z]{2})?\/(?:r|go)\//i);
    }
  }
});

test("picked ready answers open the next screen at once under one consent press", async ({ page }) => {
  // Founder decisions, 11 Oct 2026: ready answers, several can be picked; one button is the
  // explicit consent and, under the line, the 18+, Terms and Privacy affirmation. No tick, no
  // second screen and no microphone. The next screen does not wait for the server.
  let consentPosts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/program/program-ai/authority") consentPosts += 1;
  });
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testClientAddress(randomUUID()) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/program");
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();
  const agree = page.getByRole("button", { name: "Agree and continue" });
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  await expect(page.getByRole("checkbox", { name: "Something else" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /voice|microphone/i })).toHaveCount(0);
  await expect(page.locator("[data-programme-start-consent]")).toHaveText("I agree that B4GAMBLE and its AI provider use my answers, which may reveal my health, to personalise my plan.");
  await expect(page.locator("[data-programme-access-note]")).toHaveText("By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice.");
  await expect(agree).toBeDisabled();
  await page.getByRole("checkbox", { name: "I chase my losses" }).check();
  await page.getByRole("checkbox", { name: "I spend more than I plan" }).check();
  await expect(agree).toBeEnabled();
  await noHorizontalOverflow(page);
  // The answers are held back for three seconds; the next screen must not wait for them.
  await page.route("**/api/program/program-ai/turn", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });
  const turnAnswered = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/program/program-ai/turn");
  const claimMade = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/program/program-ai/claim");
  await agree.click();

  await expect(page.getByRole("heading", { name: "Here's what we can do together." })).toBeVisible({ timeout: 1_500 });
  // One line of ours per picked answer; the picked answers are not repeated back.
  await expect(page.locator("[data-programme-understanding] li")).toHaveText([
    "Set a stop point before you play, so a loss ends the session instead of starting a chase.",
    "Fix your budget before you play and make it hard to add more.",
  ], { timeout: 1_500 });
  await expect(page.getByText(situation, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Your Starting Point is ready")).toHaveCount(0);
  // Email, then password, then the button, all visible at once.
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with email" })).toBeVisible();
  // Behind the screen: the consent is recorded once, then the answers are sent, then the claim
  // is made, so a press on Google or email does not wait for it.
  expect((await turnAnswered).status()).toBe(200);
  expect(consentPosts).toBe(1);
  expect((await claimMade).status()).toBe(201);
  const anonymousSession = await anonymousSessionFromContext(page.context());
  const authority = await prisma.programmeSensitiveInputAuthority.findFirstOrThrow({
    where: { anonymousSessionId: anonymousSession.id, withdrawnAt: null },
  });
  expect(authority.statementVersion).toBe(PROGRAM_AI_SENSITIVE_STATEMENT_VERSION);
  await prisma.anonymousProgrammeSession.deleteMany({ where: { id: anonymousSession.id } });
});

test("Log in creates an account for a new person, who answers once and lands in the plan", async ({ page }) => {
  // Founder decisions, 11 Oct 2026: Log in creates accounts with the same form, and a new account
  // opens on the answers, not on an empty plan with a Start button. Inside the Programme nothing
  // reaches registration except the answers.
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testClientAddress(randomUUID()) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/program");
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create an account first|Tell my story first|Open my plan/ })).toHaveCount(0);

  await page.goto("/login");
  await expect(page.locator("[data-login-access-note]")).toContainText("By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice.");
  // The email opt-in is ticked when the form opens.
  await expect(page.getByRole("checkbox", { name: "Email me B4GAMBLE updates" })).toBeChecked();
  await noHorizontalOverflow(page);
  const email = `program-ai-login-signup-${randomUUID()}@example.test`;
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password").fill("Programme-test-password-42!");
  await page.getByRole("button", { name: "Continue with email" }).click();

  // The account exists and affirmed access on Log in, so the answers carry no 18+ line.
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();
  await expect(page.locator("[data-programme-access-note]")).toHaveCount(0);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const [acceptance, startingPoints, xp, consent] = await Promise.all([
    prisma.programmeAccessAcceptance.findUniqueOrThrow({ where: { userId: user.id } }),
    prisma.programmeStartingPoint.findMany({ where: { userId: user.id } }),
    prisma.userXpEvent.findMany({ where: { userId: user.id } }),
    prisma.consentEvent.findFirstOrThrow({ where: { userId: user.id, purpose: "MARKETING_EMAIL" } }),
  ]);
  expect(acceptance.userId).toBe(user.id);
  expect(startingPoints).toHaveLength(0);
  expect(xp).toHaveLength(0);
  expect(consent).toMatchObject({ action: "GRANTED", source: "PROGRAMME_SIGNUP", policyVersion: "email-marketing-v2" });

  // The plan is one quiet link away, and Mission 01 leads back to the answers.
  await page.getByRole("button", { name: "Open my plan" }).click();
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await page.getByRole("button", { name: /Start Mission 01/i }).click();
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();

  // "Something else" opens one short note; the answers are saved to the plan without another press.
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Something else" }).check();
  await page.getByRole("textbox", { name: "Tell us in a few words" }).fill("I bet on football every weekend");
  await noHorizontalOverflow(page);
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await expect(page.getByRole("heading", { name: "Mission 02 — Set a 7-day goal" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Programme progress" })).toContainText("40 XP");
  const saved = await prisma.programmeStartingPoint.findMany({ where: { userId: user.id } });
  expect(saved).toHaveLength(1);
  expect(saved[0].startingPoint).toBe("What feels hardest right now? Something else: I bet on football every weekend.");

  // The same form signs the account back in, to its plan: no second account, no answers again.
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password").fill("Programme-test-password-42!");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("heading", { name: "Mission 02 — Set a 7-day goal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toHaveCount(0);
  expect(await prisma.user.count({ where: { email } })).toBe(1);
  expect(await prisma.consentEvent.count({ where: { userId: user.id, purpose: "MARKETING_EMAIL" } })).toBe(1);

  await prisma.user.delete({ where: { id: user.id } });
});

test("answers first, then Log in: the account gets the Starting Point and nothing is pressed twice", async ({ page }) => {
  // Founder, 11 Oct 2026: a person who had answered and then used Log in was sent back to the
  // Programme screen to press the same button again. The Starting Point now goes with the
  // account from Log in.
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testClientAddress(randomUUID()) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/program");
  await page.getByRole("checkbox", { name: "I chase my losses" }).check();
  await page.getByRole("checkbox", { name: "I spend more than I plan" }).check();
  const claimMade = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/program/program-ai/claim");
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await expect(page.getByRole("heading", { name: "Here's what we can do together." })).toBeVisible();
  expect((await claimMade).status()).toBe(201);

  // The person opens Log in instead of using the form in front of them.
  await page.goto("/login");
  const email = `program-ai-answers-then-login-${randomUUID()}@example.test`;
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password").fill("Programme-test-password-42!");
  await page.getByRole("button", { name: "Continue with email" }).click();

  // One press: the plan opens with the Starting Point saved, and the answers are not asked again.
  await expect(page.getByRole("heading", { name: "Mission 02 — Set a 7-day goal" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Programme progress" })).toContainText("40 XP");
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toHaveCount(0);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const saved = await prisma.programmeStartingPoint.findMany({ where: { userId: user.id } });
  expect(saved).toHaveLength(1);
  expect(saved[0].startingPoint).toBe(situation);

  await prisma.user.delete({ where: { id: user.id } });
});

test("ready answers bind exact authority and are idempotent through real email auth", async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testClientAddress(randomUUID()) });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/program");

  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();
  // Founder decisions, 11 Oct 2026: ready answers picked with the keyboard, then one button.
  for (const answer of ["I chase my losses", "I spend more than I plan"]) {
    const option = page.getByRole("checkbox", { name: answer });
    await option.focus();
    await page.keyboard.press("Space");
    await expect(option).toBeChecked();
  }
  await noHorizontalOverflow(page);
  let capturedClaimCookie: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: "Lax" } | null = null;
  page.on("response", async (response) => {
    if (!response.url().endsWith("/api/program/program-ai/claim")) return;
    const setCookie = (await response.allHeaders())["set-cookie"];
    const value = setCookie?.match(/sevenbet_programme_claim=([^;]+)/)?.[1];
    if (value) capturedClaimCookie = { name: "sevenbet_programme_claim", value, domain: "127.0.0.1", path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" };
  });
  const turnAnswered = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/program/program-ai/turn");
  const claimMade = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/program/program-ai/claim");
  await page.getByRole("button", { name: "Agree and continue" }).click();

  await expect(page.getByRole("heading", { name: "Here's what we can do together." })).toBeVisible();
  // The start screen and its answers are gone; the consent is not asked again.
  await expect(page.getByRole("checkbox", { name: "I chase my losses" })).toHaveCount(0);
  await expect(page.getByText(bestEffortStartingPoint.startingPoint, { exact: true })).toHaveCount(0);
  const understanding = page.locator("[data-programme-understanding]");
  await expect(understanding.locator("li")).toHaveCount(2);
  await expect(understanding.getByText(bestEffortStartingPoint.desiredChange, { exact: true })).toHaveCount(0);
  // The session, the consent record, the answers and the claim went behind the screen, before
  // any registration press.
  expect((await turnAnswered).status()).toBe(200);
  expect((await claimMade).status()).toBe(201);
  // The listener above reads the response headers asynchronously.
  await expect.poll(() => capturedClaimCookie, "the claim is made behind the screen").toBeTruthy();
  const claimBeforePress = (capturedClaimCookie as unknown as { value: string }).value;
  await expect(page.getByRole("heading", { name: "What we'll work on first" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Where we'll start" })).toHaveCount(0);
  await expect(page.getByText(bestEffortStartingPoint.continuationCue, { exact: true })).toHaveCount(0);
  const registration = page.locator('[data-programme-phase="registration"]');
  await expect(registration).toBeVisible();
  await expect(registration.getByRole("button", { name: "Continue with email" })).toBeVisible();
  await expect(page.locator('[data-programme-phase="clarification"], [data-programme-phase="candidate"], [data-programme-phase="reward"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Check your Starting Point." })).toHaveCount(0);
  await expect(page.getByText("ONE SHORT FOLLOW-UP", { exact: false })).toHaveCount(0);
  await expect(page.getByText("MISSION 01 COMPLETE", { exact: true })).toHaveCount(0);
  await expect(page.getByText("20 XP", { exact: true })).toBeHidden();
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
    data: { locale: "en-GB", inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(duplicateTurn.status()).toBe(200);
  // Both Mission 01 actions are complete once the claim is made; a duplicate submission adds nothing.
  expect((await duplicateTurn.json()).progress.xpPreview).toBe(40);

  await page.setViewportSize({ width: 320, height: 760 });
  await noHorizontalOverflow(page);
  const email = `program-ai-happy-${randomUUID()}@example.test`;
  const wrongUserEmail = `program-ai-wrong-${randomUUID()}@example.test`;
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password").fill("Programme-test-password-42!");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("heading", { name: "Mission 02 — Set a 7-day goal" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Programme progress" })).toContainText("40 XP");
  await noHorizontalOverflow(page);
  // The duplicate submission above reset the server's state, so the first claim could not be
  // redeemed: the press made a new one and redeemed that.
  expect((capturedClaimCookie as unknown as { value: string }).value, "a reset claim is made again").not.toBe(claimBeforePress);

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const [durableStartingPoints, programmeAiXp, boundAuthority, claim, accessAcceptance] = await Promise.all([
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
    prisma.programmeAccessAcceptance.findUniqueOrThrow({ where: { userId: user.id } }),
  ]);
  expect(durableStartingPoints).toHaveLength(1);
  expect(durableStartingPoints[0].startingPoint).toBe(bestEffortStartingPoint.startingPoint);
  expect(programmeAiXp).toHaveLength(2);
  expect(programmeAiXp.reduce((total, event) => total + event.xp, 0)).toBe(40);
  expect(boundAuthority.anonymousSessionId).toBeNull();
  expect(boundAuthority.userId).toBe(user.id);
  expect(claim.consumedByUserId).toBe(user.id);
  expect(claim.consumedAt).not.toBeNull();
  expect(accessAcceptance.anonymousSessionId).toBeNull();
  expect(accessAcceptance.source).toBe("ANONYMOUS_JOURNEY");

  await page.context().addCookies([capturedClaimCookie!]);
  const duplicateClaim = await page.request.post("/api/program/program-ai/claims/redeem", {
    headers: {
      ...programmeAgeHeader,
      cookie: storedCookieHeader(await page.context().cookies()),
    },
    data: { timeZone: "UTC", startingPoint: bestEffortStartingPoint },
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
      cookies: [...wrongState.cookies, capturedClaimCookie!],
      origins: [],
    },
  });
  const wrongClaim = await wrongClaimClient.post("/api/program/program-ai/claims/redeem", {
    headers: {
      ...programmeAgeHeader,
      cookie: storedCookieHeader([...wrongState.cookies, capturedClaimCookie!]),
    },
    data: { timeZone: "UTC", startingPoint: bestEffortStartingPoint },
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

test("unaccepted authenticated mutation fails closed, then one acknowledgement unlocks it", async ({ page }) => {
  const client = page.request;
  const authority = await issueAccess(client);
  const email = `program-ai-unaccepted-${randomUUID()}@example.test`;
  const { user, authCookieHeader } = await signUp(client, authority, email);
  const program = await prisma.program.findFirstOrThrow({
    where: { slug: "sevenbet-10-step-control-program" },
    include: { steps: { orderBy: { order: "asc" } }, versions: { where: { status: "PUBLISHED" } } },
  });
  const version = program.versions.find((item) => item.version === program.publishedVersion)!;
  const enrollment = await prisma.programEnrollment.create({
    data: {
      userId: user.id,
      programId: program.id,
      programVersionId: version.id,
      currentStepId: program.steps[1].id,
      timezone: "UTC",
      missionProgress: {
        create: [
          { missionNumber: 1, status: "COMPLETED", taskStates: [...programAiMissionOneActions], completedAt: new Date() },
          { missionNumber: 2, status: "IN_PROGRESS", taskStates: [] },
        ],
      },
    },
  });
  const action = () => client.post("/api/program/program-ai/missions/2/actions", {
    headers: { cookie: authCookieHeader },
    data: { action: "choose_direction", artifact: missionActionArtifacts.choose_direction },
  });
  const blocked = await action();
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).code).toBe("PROGRAMME_ACCESS_ACKNOWLEDGEMENT_REQUIRED");
  expect(await prisma.programmeMissionProgress.findUniqueOrThrow({
    where: { enrollmentId_missionNumber: { enrollmentId: enrollment.id, missionNumber: 2 } },
  })).toMatchObject({ taskStates: [] });

  const accepted = await client.post("/api/programme-access/authority", {
    data: {
      adultConfirmed: true,
      termsAccepted: true,
      privacyAcknowledged: true,
      termsVersion: PROGRAMME_TERMS_VERSION,
      privacyVersion: PROGRAMME_PRIVACY_VERSION,
    },
  });
  expect(accepted.status(), await accepted.text()).toBe(200);
  const saved = await action();
  expect(saved.status(), await saved.text()).toBe(200);
  expect((await saved.json()).xpAwarded).toBe(15);
  expect(await prisma.programmeAccessAcceptance.count({ where: { userId: user.id } })).toBe(1);
  await prisma.user.delete({ where: { id: user.id } });
});

test("durably accepted account survives empty storage, context, login and Missions 02–10 without age headers", async ({ browser, page }) => {
  test.setTimeout(180_000);
  const client = page.request;
  const ready = await prepareReadyClaim(client);
  const email = `program-ai-ten-step-${randomUUID()}@example.test`;
  const signedUp = await signUp(client, ready.access, email);
  const { user } = signedUp;
  let { authCookieHeader } = signedUp;
  const redeem = await client.post("/api/program/program-ai/claims/redeem", {
    headers: { ...programmeAgeHeader, cookie: `${ready.cookieHeader}; ${ready.claimCookieHeader}; ${authCookieHeader}` },
    data: { timeZone: "UTC", startingPoint },
  });
  const redeemPayload = await redeem.json();
  expect(redeem.status(), JSON.stringify(redeemPayload)).toBe(200);
  expect(redeemPayload.home.totalXp).toBe(40);
  expect(await prisma.programmeAccessAcceptance.count({ where: { userId: user.id } })).toBe(1);

  await page.goto("/program");
  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload();
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toHaveCount(0);

  const freshContext = await browser.newContext({
    baseURL,
    storageState: { cookies: (await page.context().storageState()).cookies, origins: [] },
  });
  const freshPage = await freshContext.newPage();
  await freshPage.goto("/program");
  await expect(freshPage.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await expect(freshPage.getByRole("heading", { name: "What feels hardest right now?" })).toHaveCount(0);
  await freshContext.close();

  await page.getByRole("button", { name: "Log out of B4GAMBLE" }).click();
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toBeVisible();
  const signIn = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: baseURL, "x-forwarded-for": testClientAddress(email) },
    data: { email, password: "Programme-test-password-42!" },
  });
  expect(signIn.status(), await signIn.text()).toBe(200);
  const resumedSessionCookie = (await page.context().cookies()).find((cookie) => cookie.name.includes("session_token"));
  expect(resumedSessionCookie).toBeTruthy();
  authCookieHeader = `${resumedSessionCookie!.name}=${resumedSessionCookie!.value}`;
  await page.goto("/program");
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "What feels hardest right now?" })).toHaveCount(0);

  for (const mission of programAiMissionRegistry) {
    if (mission.missionNumber === 3) {
      // "Understand the urge" keeps its number 3 and is the fourth step a person takes.
      await openCurrentMission(page, 3, 390);
      await expect(page.getByText("Step 4 of 10", { exact: true })).toBeVisible();
      await expect(page.getByText("Question 1 of 3", { exact: true })).toBeVisible();
      const builder = page.getByRole("region", { name: "Place the earliest moment first." });
      await expect(builder.getByRole("listitem").nth(0)).toContainText("Choice point");
      await page.getByRole("button", { name: /Check sequence/ }).click();
      await expect(page.getByText("No XP awarded. Adjust the order and try again.")).toBeVisible();
      await builder.getByRole("listitem").filter({ hasText: "Cue" }).getByRole("button", { name: "Move up" }).click();
      await builder.getByRole("listitem").filter({ hasText: "Early signal" }).getByRole("button", { name: "Move up" }).click();
      await builder.getByRole("listitem").filter({ hasText: "Early signal" }).getByRole("button", { name: "Move up" }).click();
      await builder.getByRole("listitem").filter({ hasText: "Choice point" }).getByRole("button", { name: "Move down" }).click();
      await page.getByRole("button", { name: /Check sequence/ }).click();
      // The server's number stands in the progress label for a moment, then the question count returns.
      await expect(page.getByText("+15 XP", { exact: true })).toBeVisible();
      await expect(page.getByText("Question 2 of 3", { exact: true })).toBeVisible();
      await expect(page.getByText("+15 XP", { exact: true })).toHaveCount(0);
    }
    if (mission.missionNumber === 5) {
      await openCurrentMission(page, 5, 768);
      await page.getByRole("radio", { name: "An unexpected offer" }).check();
      await expect(page.getByText("A headline appears when you were not planning to look.")).toBeVisible();
      await page.getByRole("radio", { name: "Are the material terms clear?" }).check();
      await noHorizontalOverflow(page);
    }
    if (mission.missionNumber === 10) {
      await openCurrentMission(page, 10, 768);
      await expect(page.getByRole("heading", { name: "What you have built, in order." })).toBeVisible();
      await expect(page.getByText("Starting Point", { exact: true })).toBeVisible();
      await expect(page.getByText("Pause before one decision", { exact: true })).toBeVisible();
      await expect(page.getByText("Bank block", { exact: true })).toBeVisible();
      await expect(page.getByText("Pause and run the checks", { exact: true })).toBeVisible();
      await expect(page.getByText("Built and ready to review")).toHaveCount(0);
      await noHorizontalOverflow(page);
    }
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
        await expect(page.getByRole("heading", { name: "Mission 02 — Set a 7-day goal" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Resume mission", exact: true })).toBeVisible();
        await noHorizontalOverflow(page);
        await page.reload();
        await expect(page.getByRole("button", { name: "Resume mission", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Resume mission", exact: true }).click();
        await expect(page.getByText("Step 2 of 10", { exact: true })).toBeVisible();
        await expect(page.getByText("Question 2 of 3", { exact: true })).toBeVisible();
        await page.getByRole("radio", { name: "Pause before one decision" }).check();
        await page.getByRole("button", { name: "Create personal drafts" }).click();
        await expect(page.getByRole("heading", { name: "Choose or edit the wording that fits" })).toBeVisible();
        await expect(page.locator("[aria-pressed]")).toHaveCount(3);
        await page.locator("[aria-pressed]").nth(1).click();
        await expect(page.getByTestId("programme-artifact").locator("blockquote")).toContainText("seven days");
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await expect(page.getByText("Question 3 of 3", { exact: true })).toBeVisible();
        await noHorizontalOverflow(page);
      } else {
        const response = await requestAction();
        expect(response.status(), `${mission.missionNumber}:${action.id} ${await response.text()}`).toBe(200);
        if (mission.missionNumber === 6 && index === 0) {
          expect((await response.json()).xpAwarded).toBe(15);
          const retry = await requestAction();
          expect(retry.status()).toBe(200);
          expect((await retry.json()).xpAwarded).toBe(0);
          const missionSix = await prisma.programmeMissionProgress.findFirstOrThrow({
            where: { enrollment: { userId: user.id }, missionNumber: 6 },
          });
          expect(missionSix.taskStates).toHaveLength(1);
          // Starting Point 40, five completed Missions (02, 08, 03, 04, 05) at 75 each, and this action's 15.
          expect((await prisma.userXpEvent.aggregate({ where: { userId: user.id }, _sum: { xp: true } }))._sum.xp).toBe(430);
        }
        if (mission.missionNumber === 4 && index === 0) {
          await openCurrentMission(page, 4, 1024, "Resume mission");
          await page.getByRole("radio", { name: "Bank block" }).check();
          await page.getByRole("button", { name: "Create personal drafts" }).click();
          await page.locator("[aria-pressed]").first().click();
          await expect(page.getByTestId("programme-artifact").locator("blockquote")).toBeVisible();
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 5 && index === 1) {
          await openCurrentMission(page, 5, 768, "Resume mission");
          await expect(page.getByText("SECOND PRACTICE MOMENT")).toBeVisible();
          for (const check of ["Why am I considering this?", "Are the material terms clear?", "What is my exit route?"]) {
            await page.getByRole("checkbox", { name: check }).check();
          }
          await expect(page.getByText("Apply each check you built before choosing the pause rule.")).toBeVisible();
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 6 && index === 0) {
          await openCurrentMission(page, 6, 1024, "Resume mission");
          await page.getByRole("checkbox", { name: "Remove saved payment" }).check();
          await expect(page.getByText("YOUR STACK · 2 LAYERS")).toBeVisible();
          await page.getByRole("button", { name: "Suggest an order" }).click();
          await page.locator("[aria-pressed]").first().click();
          await expect(page.getByTestId("programme-artifact").locator("blockquote")).toBeVisible();
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 7 && index === 0) {
          await openCurrentMission(page, 7, 375, "Resume mission");
          await page.getByRole("radio", { name: "When X, I can Y" }).check();
          await page.getByRole("button", { name: "Create personal drafts" }).click();
          await expect(page.getByTestId("programme-artifact").locator("blockquote")).toBeVisible();
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 8 && index === 0) {
          await openCurrentMission(page, 8, 1440, "Resume mission");
          // Step 3, "Know who to turn to" (Founder, 16 October 2026): the kind of help, then who answers.
          await expect(page.getByRole("heading", { name: "Which kind of help would you try first?" })).toBeVisible();
          await page.getByRole("radio", { name: /Talk on the phone/ }).check();
          await expect(page.getByRole("heading", { name: "National Gambling Helpline" })).toBeVisible();
          await expect(page.getByRole("link", { name: "Call 0808 8020 133" })).toHaveAttribute("href", "tel:08088020133");
          await expect(page.locator("[data-programme-crisis-line]")).toContainText("Samaritans · 116 123");
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 8 && index === 1) {
          await openCurrentMission(page, 8, 1440, "Resume mission");
          await expect(page.getByRole("group", { name: /Your first 10 minutes/ })).toBeVisible();
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 9 && index === 0) {
          await openCurrentMission(page, 9, 390, "Resume mission");
          await expect(page.getByText("The headline is clear, but the conditions")).toBeVisible();
          await page.getByRole("button", { name: "Create my rehearsal" }).click();
          await expect(page.getByRole("heading", { name: "The headline is clear; the terms are not" })).toBeVisible();
          await expect(page.locator("[aria-pressed]")).toHaveCount(4);
          await page.locator("[aria-pressed]").first().click();
          await expect(page.getByText("That response creates a clear next move.")).toBeVisible();
          await noHorizontalOverflow(page);
        }
        if (mission.missionNumber === 10 && index === 0) {
          await openCurrentMission(page, 10, 768, "Resume mission");
          for (const priority of ["Pause move", "Boundary", "Fallback"]) {
            await page.getByRole("checkbox", { name: priority }).check();
          }
          await page.getByRole("button", { name: "Continue", exact: true }).click();
          await expect(page.getByRole("heading", { name: "Build the plan, then choose when to review it." })).toBeVisible();
          await page.getByRole("button", { name: "Build my plan" }).click();
          await expect(page.getByRole("heading", { name: "Review your one-screen plan" })).toBeVisible();
          await expect(page.getByTestId("programme-artifact").locator("blockquote")).toContainText("Pause move: Wait 10 minutes");
          await expect(page.getByTestId("programme-artifact").locator("blockquote")).toContainText("Boundary: When the early signal appears; Bank block; Pause");
          await page.getByRole("radio", { name: "Every 14 days" }).check();
          await page.getByRole("button", { name: "Continue", exact: true }).click();
          await noHorizontalOverflow(page);
        }
      }
    }
    if (mission.missionNumber === 2) {
      await openCurrentMission(page, 2, 375, "Resume mission");
      const replayPage = await page.context().newPage();
      await openCurrentMission(replayPage, 2, 375, "Resume mission");
      const completionResponse = page.waitForResponse((response) => response.url().endsWith("/api/program/program-ai/missions/2/complete"));
      await page.getByRole("button", { name: "Complete Mission", exact: true }).click();
      expect((await (await completionResponse).json()).xpAwarded).toBe(25);
      await expect(page.getByText("You built it yourself. It is yours, not ours.", { exact: true })).toBeVisible();
      const replayResponse = replayPage.waitForResponse((response) => response.url().endsWith("/api/program/program-ai/missions/2/complete"));
      await replayPage.getByRole("button", { name: "Complete Mission", exact: true }).click();
      expect((await (await replayResponse).json()).xpAwarded).toBe(0);
      const completionPages = [page, replayPage];
      await Promise.all(completionPages.map((candidate) => expect(candidate.getByText("Step 2 done", { exact: true })).toBeVisible()));
      // The reward is said once, with the server's numbers; the screen that only replayed the press shows what the Mission holds.
      await expect(page.getByText("+25 XP · 2 of 10 steps", { exact: true })).toBeVisible();
      await expect(replayPage.getByText("75 XP · 2 of 10 steps", { exact: true })).toBeVisible();
      await expect(replayPage.getByText(/This Mission was already complete\. Your completed result is ready to review\./)).toBeVisible();
      await expect(replayPage.getByText(/\+25/)).toHaveCount(0);
      await replayPage.close();

      const localContentKey = `sevenbet.programme.local-content.v2:user:${encodeURIComponent(user.id)}`;
      const localNarrative = "USER-OWNED-LOCAL-NARRATIVE — preserve exactly across locale changes.";
      await page.evaluate(({ key, value }) => {
        window.sessionStorage.setItem(key, JSON.stringify({
          programAiMissionWording: { "2": value },
          programAiReviewWording: {},
        }));
      }, { key: localContentKey, value: localNarrative });
      await page.setViewportSize({ width: 1440, height: 1000 });
      const beforeLocaleSwitch = await programmeInvariantSnapshot(user.id);
      const browserStateBefore = await page.evaluate((key) => ({
        content: window.sessionStorage.getItem(key),
        journey: window.sessionStorage.getItem("sevenbet.programme.journey.v2"),
      }), localContentKey);
      expect((beforeLocaleSwitch as { enrollments: unknown[] }).enrollments).toHaveLength(1);
      expect(browserStateBefore.content).toContain(localNarrative);

      for (const [from, to] of [["en-GB", "de-DE"], ["de-DE", "es-ES"], ["es-ES", "fi-FI"], ["fi-FI", "en-GB"]] as const) {
        await switchProgrammeLocale(page, from, to);
        await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
        // After the 7-day goal the dashboard leads with "Know who to turn to", the third step.
        await expect(page.locator("[data-programme-presentation=\"dashboard\"] h1")).toContainText(programmeMissionCopy(to, 8).title);
        await expect(page.locator("[aria-labelledby='programme-path-title'] li").nth(2)).toContainText(programmeMissionCopy(to, 8).title);
        await expect(page.getByText(startingPoint.startingPoint, { exact: true })).toBeVisible();
        expect(await programmeInvariantSnapshot(user.id)).toEqual(beforeLocaleSwitch);
        expect(await page.evaluate((key) => ({
          content: window.sessionStorage.getItem(key),
          journey: window.sessionStorage.getItem("sevenbet.programme.journey.v2"),
        }), localContentKey)).toEqual(browserStateBefore);
        if (to === "fi-FI") {
          await page.reload();
          await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("lang", "fi-FI");
          expect(await programmeInvariantSnapshot(user.id)).toEqual(beforeLocaleSwitch);
          expect(await page.evaluate((key) => window.sessionStorage.getItem(key), localContentKey)).toBe(browserStateBefore.content);
        }
      }
    } else if (mission.missionNumber === 3) {
      await openCurrentMission(page, 3, 390, "Resume mission");
      await page.getByRole("button", { name: "Complete Mission", exact: true }).click();
      await expect(page.getByText("You built it yourself. It is yours, not ours.", { exact: true })).toBeVisible();
      await expect(page.getByText("PERSONAL REVIEW AVAILABLE", { exact: true })).toBeVisible();
      await expect(page.getByText(/First Personal Review is ready\./)).toBeVisible();
    } else if (mission.missionNumber === 8) {
      // Finishing the third step, "Know who to turn to", opens nothing (Founder, 16 October 2026):
      // no research block or casino link on its completion screen, no menu cookie, the same guide
      // menu on this page and on Home, and no research card on the Programme home.
      const guideMenu = ["/10-steps", "/learn", "/help"];
      const primary = page.locator('nav[aria-label="Primary navigation"]');
      const primaryMenu = () => primary.locator("[data-navigation-href]").evaluateAll((links) => links.map((link) => link.getAttribute("data-navigation-href")));
      const researchLinks = 'a[href*="/casinos"], a[href*="/casino/"], a[href*="/bonuses"], a[href*="/best-offers"], a[href*="/compare"], a[href*="/bonus-guide"], a[href*="/wagering-calculator"], a[href*="/outbound"], a[href^="/r/"], a[href^="/go/"]';
      const publicContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 }, storageState: await page.context().storageState() });
      const before = await publicContext.newPage();
      await before.goto("/en");
      await expect.poll(() => before.locator('nav[aria-label="Primary navigation"] [data-navigation-href]').evaluateAll((links) => links.map((link) => link.getAttribute("data-navigation-href"))), { timeout: 15_000 }).toEqual(guideMenu);
      await publicContext.close();

      await openCurrentMission(page, 8, 1440, "Resume mission");
      await page.getByRole("button", { name: "Complete Mission", exact: true }).click();
      await expect(page.getByText("You built it yourself. It is yours, not ours.", { exact: true })).toBeVisible();
      await expect(page.locator("[data-programme-research-opened], [data-programme-research]")).toHaveCount(0);
      await expect(page.getByText(/now open to you|NEW IN YOUR MENU|PUT IT TO USE/)).toHaveCount(0);
      await expect(page.locator(researchLinks)).toHaveCount(0);
      await noHorizontalOverflow(page);
      expect((await page.context().cookies()).find((cookie) => cookie.name === "b4g_research_access")).toBeUndefined();
      // The menu on this same page keeps its guide links.
      await expect.poll(primaryMenu, { timeout: 15_000 }).toEqual(guideMenu);
      await expect(page.locator('[data-public-shell="header"]')).not.toHaveAttribute("data-research-new", "");

      await page.goto("/en");
      await expect.poll(primaryMenu, { timeout: 15_000 }).toEqual(guideMenu);
      await expect(page.locator('[data-public-shell] a[href$="/casinos"]')).toHaveCount(0);
      await page.goto("/program");
      await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-programme-research="featured"]')).toHaveCount(0);
      await expect(page.locator(`main ${researchLinks.split(", ").join(", main ")}`)).toHaveCount(0);
    } else {
      const complete = await client.post(`/api/program/program-ai/missions/${mission.missionNumber}/complete`, {
        headers: { cookie: authCookieHeader },
        data: {},
      });
      const completePayload = await complete.json();
      expect(complete.status(), `complete ${mission.missionNumber}: ${JSON.stringify(completePayload)}`).toBe(200);
      expect(completePayload.xpAwarded).toBe(25);
    }

    const milestone = mission.missionNumber === 3 ? "first" : mission.missionNumber === 6 ? "mid" : mission.missionNumber === 10 ? "full" : null;
    if (milestone) {
      const beforeReview = await prisma.userXpEvent.aggregate({ where: { userId: user.id }, _sum: { xp: true } });
      const review = await client.get(`/api/program/program-ai/reviews/${milestone}?locale=en-GB`, { headers: { cookie: authCookieHeader } });
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
  await expect(page.locator("[data-programme-context-header]").getByText("715 XP", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mission 10 — Make the plan reviewable" })).toBeVisible();
  await expect(page.getByText("Mission complete", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review mission", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Programme completion" })).toHaveCount(0);
  await expect(page.locator("li[data-state='completed']")).toHaveCount(10);
  await expect(page.getByRole("button", { name: "Open review" })).toHaveCount(3);
  await expect(page.getByText("Your data is private. We never use it for offers or rankings.")).toBeVisible();
  await noHorizontalOverflow(page);

  for (const width of [375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await noHorizontalOverflow(page);
  }

  await page.getByRole("button", { name: "Open review" }).last().click();
  await expect(page.getByRole("heading", { name: "Full Programme Personal Review" })).toBeVisible();
  await expect(page.getByText("Here’s what your Programme looks like so far.")).toBeVisible();
  await expect(page.getByText(/DETERMINISTIC REVIEW|BOUNDED AI REVIEW|Provider-off|provider-failure/)).toHaveCount(0);
  await noHorizontalOverflow(page);
  await prisma.user.delete({ where: { id: user.id } });
});

test("clarification cannot refresh authority, withdrawal blocks turns, and a new action can reconfirm", async ({ page }) => {
  const request = page.request;
  const session = await createProgrammeSession(request);
  const initial = await confirmSensitiveAuthority(request, session.cookieHeader);

  const firstTurn = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { locale: "en-GB", inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(firstTurn.status()).toBe(200);
  const clarification = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { locale: "en-GB", inputMode: "text", situation, clarificationAnswers: ["I want a pause before I open the app."] },
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
    data: { locale: "en-GB", inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).code).toBe("SENSITIVE_INPUT_AUTHORITY_REQUIRED");

  const reconfirmed = await confirmSensitiveAuthority(request, session.cookieHeader);
  expect(new Date(reconfirmed.authority.confirmedAt).getTime()).toBeGreaterThanOrEqual(
    new Date(initial.authority.confirmedAt).getTime(),
  );
  const resumed = await request.post("/api/program/program-ai/turn", {
    headers: { ...programmeAgeHeader, cookie: session.cookieHeader },
    data: { locale: "en-GB", inputMode: "text", situation, clarificationAnswers: [] },
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
  await expect(page.getByRole("button", { name: "Agree and continue" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "I can't stop once I start" }).check();
  await expect(page.getByRole("button", { name: "Agree and continue" })).toBeEnabled();
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
  await page.getByRole("button", { name: "Agree and continue" }).click();

  await expect(page.getByRole("heading", { name: "Pause the Programme. Keep support close." })).toBeVisible();
  await expect(page.getByText(/Your 20 XP for describing the situation is preserved/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open protected Help" })).toHaveAttribute("href", "/help");
  await expect(page.getByRole("button", { name: /register|account|keep this progress/i })).toHaveCount(0);
  await expect(page.getByText("Registration and celebration are paused on this screen.")).toBeVisible();
  await noHorizontalOverflow(page);

  const cookie = (await page.context().cookies()).find((item) => item.name === "sevenbet_programme_session");
  if (cookie) {
    await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: tokenHash(cookie.value) } });
  }
});

test("phone Mission screens open at the top with the first choice above a sticky confirm, and no research card follows the research Mission", async ({ browser }) => {
  const now = new Date().toISOString();
  const userId = "mobile-mission-review-user";
  const titles = Array.from({ length: 10 }, (_, index) => programmeMissionCopy("en-GB", index + 1).title);
  const home = (current: number) => ({
    totalXp: current * 55, activeDays: 3, currentStreak: 2,
    achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }],
    currentMission: current, primaryAction: "start-mission", engagementDayBucket: "day_2_3", currentAction: null,
    startingPoint: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app", broadContext: "WORK", continuationCue: "Continue from the after-work pause", chosenBoundaryAction: "Put the phone in another room" },
    currentStep: missionStep(current),
    missions: programmeJourney.map((missionNumber, index) => ({ missionNumber, step: index + 1, title: titles[missionNumber - 1], status: index + 1 < missionStep(current) ? "completed" : index + 1 === missionStep(current) ? "current" : "locked", actionsCompleted: index + 1 < missionStep(current) ? 3 : 0, actionsTotal: 3, xpEarnedHere: index + 1 < missionStep(current) ? 55 : 0, completionBonus: 25 })),
    reviews: [{ milestone: "first", unlockMission: 3, unlockStep: 4, title: "First review", maxWords: 60, status: "locked" }],
    nextReview: null,
  });
  const missionTwo = {
    missionNumber: 2, step: 2, stepId: "goal", title: titles[1], purpose: "", status: "current",
    actions: [
      { id: "choose_direction", label: "Choose a direction", xp: 20, completed: false },
      { id: "build_7_day_goal", label: "Build the 7-day goal", xp: 20, completed: false },
      { id: "reality_check", label: "Run a reality check", xp: 15, completed: false },
    ],
    currentAction: "choose_direction", currentActionPosition: 1, actionsCompleted: 0, actionsTotal: 3,
    artifact: {}, artifactVersion: "1", xpEarnedHere: 0, completionBonus: 25, completedAt: null, legacyCompletion: false, programmeFacts: null,
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }]) {
    for (const current of [2, 9]) {
      const context = await browser.newContext({ baseURL, viewport, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.route("**/api/auth/get-session**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: { id: "mobile-mission-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Mobile mission", email: "mobile-mission@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } }) }));
      await page.route("**/api/programme-access/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, accepted: true }) }));
      await page.route("**/api/program/program-ai/home", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: home(current) }) }));
      await page.route("**/api/program/program-ai/missions/2", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, mission: missionTwo }) }));
      await page.goto("/program");
      await expect(page.locator('[data-programme-phase="home"]')).toBeVisible();
      const research = page.locator("[data-programme-research]");
      // No research card before or after the research Mission (Founder, 16 October 2026).
      await expect(research).toHaveCount(0);
      if (current === 9) {
        await expect(page.locator('[data-programme-presentation="dashboard"] main a[href*="/casinos"], [data-programme-presentation="dashboard"] main a[href*="/bonuses"], [data-programme-presentation="dashboard"] main a[href*="/best-offers"]')).toHaveCount(0);
        await context.close();
        continue;
      }
      const start = page.getByRole("button", { name: "Start mission", exact: true });
      await start.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 200));
      await start.click();
      await expect(page.locator('[data-programme-phase="mission"]')).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.scrollY), { message: `Mission opens at its top at ${viewport.width}px` }).toBe(0);
      await expect(page.locator("[data-programme-context-header]")).toBeHidden();
      await expect(page.getByRole("button", { name: "← Programme Home" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Protected Help / pause" })).toBeVisible();
      const confirm = page.getByRole("button", { name: "Continue", exact: true });
      await expect(page.getByText("Step 2 of 10", { exact: true })).toBeVisible();
      // On a phone the step's own bar stands where the site header was.
      await expect(page.locator('[data-public-shell="header"]')).toBeHidden();
      const firstChoice = page.locator("[data-programme-action] label").first();
      const [choiceBox, confirmBox] = await Promise.all([firstChoice.boundingBox(), confirm.boundingBox()]);
      expect(confirmBox!.y + confirmBox!.height, `confirm sits on the first screen at ${viewport.width}px`).toBeLessThanOrEqual(viewport.height);
      if (viewport.height >= 800) expect(choiceBox!.y + choiceBox!.height, `first choice sits above the confirm at ${viewport.width}px`).toBeLessThanOrEqual(confirmBox!.y);
      await page.evaluate(() => window.scrollBy(0, 240));
      await expect.poll(async () => { const box = await confirm.boundingBox(); return box!.y + box!.height <= viewport.height; }, { message: `confirm stays reachable while choosing at ${viewport.width}px` }).toBe(true);
      await noHorizontalOverflow(page);
      await context.close();
    }
  }
});
