import { createHash, createHmac, randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
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
const programmeAgeHeader = {
  [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
};

type AccessAuthority = {
  journeyId: string;
  proof: string;
};

function tokenHash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
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
  const authority = await issueAccess(client);
  const response = await client.post("/api/program/program-ai/session", {
    headers: { ...programmeAgeHeader, ...accessHeaders(authority) },
  });
  expect(response.status()).toBe(201);
  return authority;
}

async function confirmSensitiveAuthority(client: APIRequestContext) {
  const response = await client.post("/api/program/program-ai/authority", {
    headers: programmeAgeHeader,
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
  const access = await createProgrammeSession(client);
  await confirmSensitiveAuthority(client);
  const turn = await client.post("/api/program/program-ai/turn", {
    headers: programmeAgeHeader,
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(turn.status()).toBe(200);
  const confirm = await client.post("/api/program/program-ai/starting-point", {
    headers: programmeAgeHeader,
    data: startingPoint,
  });
  expect(confirm.status()).toBe(200);
  const claim = await client.post("/api/program/program-ai/claim", { headers: programmeAgeHeader });
  expect(claim.status()).toBe(201);
  return access;
}

async function signUp(client: APIRequestContext, authority: AccessAuthority, email: string) {
  const response = await client.post("/api/auth/sign-up/email", {
    headers: { ...accessHeaders(authority), origin: baseURL },
    data: { email, password: "Programme-test-password-42!", name: "Programme browser test" },
  });
  expect(response.status(), await response.text()).toBe(200);
  return prisma.user.findUniqueOrThrow({ where: { email } });
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
  const cookie = (await request.storageState()).cookies.find((item) => item.name === "sevenbet_programme_session");
  if (cookie) {
    await prisma.anonymousProgrammeSession.deleteMany({ where: { tokenHash: tokenHash(cookie.value) } });
  }
});

test("typed fallback path binds exact authority and is idempotent through real email auth", async ({ page }) => {
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
  await expect(page.getByRole("alert").or(page.getByRole("status"))).toBeVisible();
  const situationField = page.getByLabel("Your situation");
  await situationField.focus();
  await situationField.fill(situation);
  await page.getByRole("button", { name: "Create my Starting Point" }).click();

  await expect(page.getByRole("heading", { name: "Check your Starting Point." })).toBeVisible();
  await expect(page.getByText("No AI provider is connected in this preview.")).toBeVisible();
  await expect(page.getByText("20 XP", { exact: true })).toBeVisible();
  const anonymousSession = await anonymousSessionFromContext(page.context());
  const anonymousAuthority = await prisma.programmeSensitiveInputAuthority.findFirstOrThrow({
    where: { anonymousSessionId: anonymousSession.id, withdrawnAt: null },
  });
  expect(anonymousAuthority.userId).toBeNull();

  const duplicateTurn = await page.request.post("/api/program/program-ai/turn", {
    headers: programmeAgeHeader,
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
    headers: programmeAgeHeader,
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
  await expect(page.getByRole("heading", { name: "Continue with Mission 2." })).toBeVisible();
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
    headers: programmeAgeHeader,
    data: { timeZone: "UTC", startingPoint },
  });
  expect(duplicateClaim.status()).toBe(200);
  expect((await duplicateClaim.json()).home.totalXp).toBe(40);
  expect(await prisma.programmeStartingPoint.count({ where: { userId: user.id } })).toBe(1);
  expect(await prisma.userXpEvent.count({ where: { userId: user.id, awardKey: { in: programmeAiXp.map((event) => event.awardKey) } } })).toBe(2);

  const wrongClient = await playwrightRequest.newContext({ baseURL });
  const wrongAccess = await issueAccess(wrongClient);
  const wrongUser = await signUp(wrongClient, wrongAccess, wrongUserEmail);
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
    headers: programmeAgeHeader,
    data: { timeZone: "UTC", startingPoint },
  });
  expect(wrongClaim.status()).toBe(409);
  expect((await wrongClaim.json()).code).toBe("PROGRAMME_STATE_CONFLICT");
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

test("clarification cannot refresh authority, withdrawal blocks turns, and a new action can reconfirm", async ({ request }) => {
  await createProgrammeSession(request);
  const initial = await confirmSensitiveAuthority(request);
  const sessionCookie = (await request.storageState()).cookies.find((item) => item.name === "sevenbet_programme_session");
  expect(sessionCookie).toBeTruthy();

  const firstTurn = await request.post("/api/program/program-ai/turn", {
    headers: programmeAgeHeader,
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(firstTurn.status()).toBe(200);
  const clarification = await request.post("/api/program/program-ai/turn", {
    headers: programmeAgeHeader,
    data: { inputMode: "text", situation, clarificationAnswers: ["I want a pause before I open the app."] },
  });
  expect(clarification.status()).toBe(200);
  const afterClarification = await request.get("/api/program/program-ai/authority");
  expect(afterClarification.status()).toBe(200);
  expect((await afterClarification.json()).authority.confirmedAt).toBe(initial.authority.confirmedAt);

  const withdrawal = await request.delete("/api/program/program-ai/authority", { headers: programmeAgeHeader });
  expect(withdrawal.status()).toBe(200);
  const blocked = await request.post("/api/program/program-ai/turn", {
    headers: programmeAgeHeader,
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).code).toBe("SENSITIVE_INPUT_AUTHORITY_REQUIRED");

  const reconfirmed = await confirmSensitiveAuthority(request);
  expect(new Date(reconfirmed.authority.confirmedAt).getTime()).toBeGreaterThanOrEqual(
    new Date(initial.authority.confirmedAt).getTime(),
  );
  const resumed = await request.post("/api/program/program-ai/turn", {
    headers: programmeAgeHeader,
    data: { inputMode: "text", situation, clarificationAnswers: [] },
  });
  expect(resumed.status()).toBe(200);

  await prisma.anonymousProgrammeSession.deleteMany({
    where: { tokenHash: tokenHash(sessionCookie!.value) },
  });
});

test("completed legacy Mission 01 dominates a new claim and awards no new 40 XP", async () => {
  const client = await playwrightRequest.newContext({ baseURL });
  const access = await prepareReadyClaim(client);
  const stateBeforeAuth = await client.storageState();
  const anonymousCookie = stateBeforeAuth.cookies.find((item) => item.name === "sevenbet_programme_session");
  expect(anonymousCookie).toBeTruthy();
  const anonymousSession = await prisma.anonymousProgrammeSession.findUniqueOrThrow({
    where: { tokenHash: tokenHash(anonymousCookie!.value) },
  });
  const email = `program-ai-legacy-${randomUUID()}@example.test`;
  const user = await signUp(client, access, email);
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
    },
  });

  const redeem = await client.post("/api/program/program-ai/claims/redeem", {
    headers: programmeAgeHeader,
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

  await client.dispose();
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.anonymousProgrammeSession.deleteMany({ where: { id: anonymousSession.id } });
});

test("support-first keeps 20 XP, protected Help, and no registration CTA", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/program");
  for (const checkbox of await page.getByRole("checkbox").all()) {
    await checkbox.check();
  }
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
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
