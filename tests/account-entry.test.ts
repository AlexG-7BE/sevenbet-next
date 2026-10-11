import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { continueWithEmail, type EmailEntryAuth } from "../lib/auth/email-entry";
import {
  PROGRAMME_MARKETING_OPT_IN_DEFAULT,
  PROGRAMME_MARKETING_OPT_IN_LABEL,
  marketingPreferenceAlreadyDecided,
} from "../lib/customers/email-preference-client";
import {
  affirmAnonymousProgrammeAccess,
  markStartingPointForAccount,
  noteClaimMade,
  prepareAccountFirstGoogleReturn,
  recordAccountProgrammeAccess,
  tabProgrammeProgress,
} from "../lib/programme/access-client";
import {
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "../lib/programme/access-contract";
import {
  anonymousProgrammeSubject,
  loadProgrammeSubjectContent,
  mergeProgrammeSubjectContent,
  programmeAuthAccessHeaders,
  readProgrammeOAuthClaimMarker,
} from "../lib/programme/local-subject-storage";
import { makePendingClaim } from "../lib/programme/program-ai/pending-claim-client";

// Founder decision, 11 Oct 2026: one sign-in form for new and returning people, in the
// Programme and on Log in; the 18+ / Terms / Privacy ticks became a line.

const ok = (id: string) => ({ data: { user: { id } }, error: null });
const refused = (code: string) => ({ data: null, error: { code } });

function auth(script: { signUp?: ReturnType<typeof ok | typeof refused>; signIn?: ReturnType<typeof ok | typeof refused> }) {
  const calls: string[] = [];
  const seen: { email: string; password: string }[] = [];
  const step = (name: "signUp" | "signIn") => async (credentials: { email: string; password: string }) => {
    calls.push(name);
    seen.push(credentials);
    const answer = script[name];
    if (!answer) throw new Error(`${name} was not expected`);
    return answer;
  };
  return { calls, seen, port: { signUp: step("signUp"), signIn: step("signIn") } satisfies EmailEntryAuth };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

function authorityFor(journeyId: string) {
  const now = Date.now();
  return {
    version: 1,
    intent: "PROGRAMME_ACCESS",
    purpose: "PROGRAMME_AUTH_ACCESS",
    journeyId,
    createdAt: now,
    expiresAt: now + 60 * 60 * 1000,
    termsVersion: PROGRAMME_TERMS_VERSION,
    privacyVersion: PROGRAMME_PRIVACY_VERSION,
    adultConfirmedAt: now,
    termsAcceptedAt: now,
    privacyAcknowledgedAt: now,
    proof: "pa1.unit-test.signature",
  };
}

test("a new email gets an account in one request on the Programme save step", async () => {
  const fake = auth({ signUp: ok("user-new") });
  const result = await continueWithEmail({ email: "  New.Person@Example.Test ", password: "a-long-password", expect: "new" }, fake.port);
  assert.deepEqual(result, { kind: "created", userId: "user-new" });
  assert.deepEqual(fake.calls, ["signUp"]);
  assert.deepEqual(fake.seen[0], { email: "new.person@example.test", password: "a-long-password" });
});

test("the same button signs in the account that already owns the email", async () => {
  const fake = auth({ signUp: refused("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"), signIn: ok("user-existing") });
  const result = await continueWithEmail({ email: "back@example.test", password: "a-long-password", expect: "new" }, fake.port);
  assert.deepEqual(result, { kind: "signed-in", userId: "user-existing" });
  assert.deepEqual(fake.calls, ["signUp", "signIn"]);
});

test("an existing email with another password is reported as a wrong password, in either order", async () => {
  for (const expect of ["new", "returning"] as const) {
    const fake = auth({ signUp: refused("USER_ALREADY_EXISTS"), signIn: refused("INVALID_EMAIL_OR_PASSWORD") });
    assert.deepEqual(await continueWithEmail({ email: "back@example.test", password: "not-the-password", expect }, fake.port), { kind: "wrong-password" });
    assert.equal(fake.calls.length, 2);
  }
});

test("Log in signs a returning person in with one request and creates an account for a new one", async () => {
  const returning = auth({ signIn: ok("user-existing") });
  assert.deepEqual(await continueWithEmail({ email: "back@example.test", password: "a-long-password", expect: "returning" }, returning.port), { kind: "signed-in", userId: "user-existing" });
  assert.deepEqual(returning.calls, ["signIn"]);

  const fresh = auth({ signIn: refused("INVALID_EMAIL_OR_PASSWORD"), signUp: ok("user-new") });
  assert.deepEqual(await continueWithEmail({ email: "new@example.test", password: "a-long-password", expect: "returning" }, fresh.port), { kind: "created", userId: "user-new" });
  assert.deepEqual(fresh.calls, ["signIn", "signUp"]);
});

test("a refused creation or an unavailable sign-in never falls through to the other request", async () => {
  const refusedSignUp = auth({ signUp: refused("CURRENT_ACCESS_AUTHORITY_REQUIRED") });
  assert.deepEqual(await continueWithEmail({ email: "new@example.test", password: "a-long-password", expect: "new" }, refusedSignUp.port), { kind: "failed" });
  assert.deepEqual(refusedSignUp.calls, ["signUp"]);

  const unavailable = auth({ signIn: refused("AUTH_SERVICE_UNAVAILABLE") });
  assert.deepEqual(await continueWithEmail({ email: "back@example.test", password: "a-long-password", expect: "returning" }, unavailable.port), { kind: "failed" });
  assert.deepEqual(unavailable.calls, ["signIn"]);
});

test("linking Google to an existing account never creates one", async () => {
  const fake = auth({ signIn: refused("INVALID_EMAIL_OR_PASSWORD") });
  assert.deepEqual(await continueWithEmail({ email: "back@example.test", password: "not-the-password", expect: "existing-only" }, fake.port), { kind: "wrong-password" });
  assert.deepEqual(fake.calls, ["signIn"]);
});

test("continuing under the line sends the full 18+ / Terms / Privacy affirmation and keeps the proof", async () => {
  const storage = memoryStorage();
  const bodies: Record<string, unknown>[] = [];
  const fetcher = async (_input: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    bodies.push(body);
    return { ok: true, json: async () => ({ ok: true, accepted: false, authority: authorityFor(String(body.journeyId)) }) };
  };

  const journey = await affirmAnonymousProgrammeAccess(storage, fetcher);
  assert.deepEqual(bodies[0], {
    journeyId: journey.id,
    adultConfirmed: true,
    termsAccepted: true,
    privacyAcknowledged: true,
    termsVersion: PROGRAMME_TERMS_VERSION,
    privacyVersion: PROGRAMME_PRIVACY_VERSION,
  });
  assert.equal(programmeAuthAccessHeaders(storage, journey)["x-sevenbet-programme-access-proof"], "pa1.unit-test.signature");

  // An unexpired proof is reused: the same journey is not affirmed twice.
  assert.deepEqual(await affirmAnonymousProgrammeAccess(storage, fetcher), journey);
  assert.equal(bodies.length, 1);
});

test("a refused affirmation stops account creation", async () => {
  const storage = memoryStorage();
  const fetcher = async () => ({ ok: false, json: async () => ({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }) });
  await assert.rejects(affirmAnonymousProgrammeAccess(storage, fetcher), /PROGRAMME_ACCESS_NOT_VERIFIED/);
  assert.deepEqual(programmeAuthAccessHeaders(storage, anonymousProgrammeSubject(storage)), {});
  await assert.rejects(recordAccountProgrammeAccess(fetcher), /PROGRAMME_ACCESS_NOT_VERIFIED/);
});

test("the account affirmation carries no journey", async () => {
  let body: Record<string, unknown> | null = null;
  await recordAccountProgrammeAccess(async (_input, init) => {
    body = JSON.parse(String(init.body)) as Record<string, unknown>;
    return { ok: true, json: async () => ({ ok: true, accepted: true }) };
  });
  assert.deepEqual(Object.keys(body!).sort(), ["adultConfirmed", "privacyAcknowledged", "privacyVersion", "termsAccepted", "termsVersion"]);
});

test("a Google sign-up started on Log in hands the Programme an account-first return", () => {
  const storage = memoryStorage();
  const journey = anonymousProgrammeSubject(storage);
  assert.deepEqual(tabProgrammeProgress(storage, journey), { kind: "none" });

  prepareAccountFirstGoogleReturn(storage, journey);
  assert.deepEqual(loadProgrammeSubjectContent(storage, journey), { programAi: { phase: "registration", accountFirst: true } });
  assert.deepEqual(readProgrammeOAuthClaimMarker(storage), journey);
});

// Founder, 11 Oct 2026, after pressing Google on Log in and being sent back to the Programme
// screen: "почему при нажатии на гугл регистрацию меня отправляет вот сюда? даже если я уже
// ответил там на вопросы." A person who already answered is never sent back to press twice.
test("Log in knows what the tab already holds: a Starting Point, picked answers, or nothing", () => {
  const storage = memoryStorage();
  const journey = anonymousProgrammeSubject(storage);
  const startingPoint = { startingPoint: "…", desiredChange: "…" };

  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "registration", answers: ["I chase my losses"], candidate: startingPoint, claimReadyAt: 123 } });
  assert.deepEqual(tabProgrammeProgress(storage, journey), { kind: "starting-point", startingPoint, claimReadyAt: 123 });

  // The answers were sent but the Starting Point never arrived: the answers are kept.
  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "registration", answers: ["I chase my losses"], candidate: null } });
  assert.deepEqual(tabProgrammeProgress(storage, journey), { kind: "answers", answers: ["I chase my losses"] });

  // Support first holds registration back, so nothing is carried into an account from it.
  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "support", answers: ["I chase my losses"], candidate: startingPoint } });
  assert.deepEqual(tabProgrammeProgress(storage, journey), { kind: "none" });
});

test("a Starting Point goes with the account from Log in: the claim is made and marked for the Programme page", async () => {
  const storage = memoryStorage();
  const journey = anonymousProgrammeSubject(storage);
  const startingPoint = { startingPoint: "…", desiredChange: "…" };
  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "registration", answers: ["I chase my losses"], candidate: startingPoint } });

  const requests: Array<{ path: string; method: string; body: unknown; headers: Record<string, string> }> = [];
  await makePendingClaim({ "x-test-access": "current" }, startingPoint, async (path, init) => {
    requests.push({ path, method: String(init.method), body: init.body ? JSON.parse(String(init.body)) : null, headers: init.headers as Record<string, string> });
    return { ok: true };
  });
  // Ready first, then the claim; both carry the journey's access evidence and the cookie.
  assert.deepEqual(requests.map((request) => request.path), ["/api/program/program-ai/starting-point", "/api/program/program-ai/claim"]);
  assert.deepEqual(requests[0].body, startingPoint);
  assert.equal(requests[1].body, null);
  for (const request of requests) {
    assert.equal(request.method, "POST");
    assert.equal(request.headers["x-test-access"], "current");
  }

  noteClaimMade(storage, journey, 1_800_000_000_000);
  assert.deepEqual(tabProgrammeProgress(storage, journey), { kind: "starting-point", startingPoint, claimReadyAt: 1_800_000_000_000 });
  markStartingPointForAccount(storage, journey);
  assert.deepEqual(readProgrammeOAuthClaimMarker(storage), journey);
  // The Starting Point and the answers are still there for the Programme page to redeem.
  assert.deepEqual(loadProgrammeSubjectContent<{ programAi: { candidate: unknown } }>(storage, journey).programAi?.candidate, startingPoint);
});

test("a refused claim is reported, so Log in can still sign the person in with the answers kept", async () => {
  const refuse = (failAt: number) => { let call = 0; return async () => ({ ok: ++call !== failAt }); };
  await assert.rejects(makePendingClaim({}, {}, refuse(1)), /STARTING_POINT_NOT_READY/);
  await assert.rejects(makePendingClaim({}, {}, refuse(2)), /PENDING_CLAIM_NOT_MADE/);

  // Without a claim the Google return is account-first, and the picked answers travel with it.
  const storage = memoryStorage();
  const journey = anonymousProgrammeSubject(storage);
  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "registration", answers: ["I chase my losses", "Something else"], candidate: null } });
  prepareAccountFirstGoogleReturn(storage, journey);
  assert.deepEqual(loadProgrammeSubjectContent(storage, journey), { programAi: { phase: "registration", accountFirst: true, answers: ["I chase my losses", "Something else"] } });
});

test("Log in creates accounts through the Programme access proof and the Programme Google return", () => {
  const login = readFileSync("components/auth/LoginExperience.tsx", "utf8");
  const experience = readFileSync("components/programme/ProgramAiExperience.tsx", "utf8");
  const page = readFileSync("app/(public)/login/page.tsx", "utf8");
  assert.match(page, /<LoginExperience /);
  // Email: sign-in first, then an account with the server-verified affirmation.
  assert.match(login, /expect: linkRecovery \? "existing-only" : "returning"/);
  assert.match(login, /const journey = await affirmAnonymousProgrammeAccess\(window\.sessionStorage\);[\s\S]*authClient\.signUp\.email\([\s\S]*programmeAuthAccessHeaders\(window\.sessionStorage, journey\)/);
  assert.match(login, /await recordAccountProgrammeAccess\(\)/);
  // Google: the Programme callbacks are the only ones the server lets create an account.
  assert.match(login, /if \(!carried\) prepareAccountFirstGoogleReturn\(window\.sessionStorage, journey\);[\s\S]*\.\.\.programmeGoogleCallbacks\(locale\),\s+requestSignUp: true,/);
  assert.doesNotMatch(login, /requestSignUp: false/);
  // Neither action sends a person who already answered back to the Programme before signing
  // in: Google starts at once with the Starting Point carried, and email carries it after auth.
  const google = login.slice(login.indexOf("async function startGoogle()"), login.indexOf("async function startGoogleLink()"));
  assert.doesNotMatch(google, /window\.location/);
  assert.match(google, /if \(progress\.kind === "starting-point"\) \{[\s\S]*await carryStartingPoint\(journey, progress, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS\); carried = true;/);
  const emailEntry = login.slice(login.indexOf("async function continueWithEmailEntry"));
  assert.ok(emailEntry.indexOf("await continueWithEmail(") < emailEntry.indexOf("window.location.assign(programmePath)"), "email signs in before any move to the Programme");
  assert.match(emailEntry, /await carryStartingPoint\(journey, progress, PENDING_CLAIM_FRESH_FOR_EMAIL_MS\);\s+window\.location\.assign\(programmePath\);/);
  assert.doesNotMatch(login, /unsavedStartingPointOpened|hasUnsavedStartingPoint/);
  // Answers picked before the account existed are shown picked on the Programme page.
  assert.match(experience, /const picked = Array\.isArray\(kept\) \? pickedReadyAnswers\(kept\) : \[\];/);
  assert.match(experience, /initialAnswers=\{phase === "intake" \? local\.answers : undefined\}/);
  // The line is the first and only ask on Log in; the old dead end is gone.
  assert.match(login, /By continuing, you confirm you are 18\+ and accept the Terms and Privacy Notice\./);
  assert.doesNotMatch(login, /There's no signup form/);
  // The Programme restores the handed-over state through the same guard as a reload.
  assert.match(experience, /if \(restored\) setLocal\(restoredAnonymousState\(restored\)\);/);
});

test("the email opt-in is short and ticked when the form opens, on both screens, at the end of the form", () => {
  // Founder decision, 11 Oct 2026. The wording and default are policy version email-marketing-v2.
  assert.equal(PROGRAMME_MARKETING_OPT_IN_LABEL, "Email me B4GAMBLE updates");
  assert.equal(PROGRAMME_MARKETING_OPT_IN_DEFAULT, true);
  const presentation = readFileSync("components/programme/ProgramAiFinalPresentation.tsx", "utf8");
  const login = readFileSync("components/auth/LoginExperience.tsx", "utf8");
  for (const source of [presentation, login]) {
    assert.match(source, /useState\(PROGRAMME_MARKETING_OPT_IN_DEFAULT\)/);
    assert.ok(source.indexOf("</form>") < source.indexOf("t(PROGRAMME_MARKETING_OPT_IN_LABEL)"), "the opt-in follows the form");
  }
  assert.match(readFileSync("app/api/customer/email-preference/route.ts", "utf8"), /policyVersion: "email-marketing-v2"/);
});

test("a ticked-by-default box never overwrites an earlier choice", async () => {
  const answer = (value: unknown, ok = true) => async () => ({ ok, json: async () => value });
  assert.equal(await marketingPreferenceAlreadyDecided(answer({ marketingAllowed: false, unsubscribed: false, suppressed: false })), false);
  assert.equal(await marketingPreferenceAlreadyDecided(answer({ marketingAllowed: true, unsubscribed: false, suppressed: false })), true);
  assert.equal(await marketingPreferenceAlreadyDecided(answer({ marketingAllowed: false, unsubscribed: true, suppressed: false })), true);
  assert.equal(await marketingPreferenceAlreadyDecided(answer({ marketingAllowed: false, unsubscribed: false, suppressed: true })), true);
  // When the answer cannot be read, nothing is recorded.
  assert.equal(await marketingPreferenceAlreadyDecided(answer({ code: "AUTHENTICATION_REQUIRED" }, false)), true);
  assert.equal(await marketingPreferenceAlreadyDecided(async () => { throw new Error("offline"); }), true);
  const experience = readFileSync("components/programme/ProgramAiExperience.tsx", "utf8");
  assert.match(experience, /if \(await marketingPreferenceAlreadyDecided\(\)\) return true;\n    return saveProgrammeMarketingPreference\(locale\);/);
});

test("the Programme start has no way to registration that goes round the answers", () => {
  const runtime = readFileSync("components/programme/ProgramAiExperience.tsx", "utf8") + readFileSync("components/programme/ProgramAiFinalPresentation.tsx", "utf8");
  assert.doesNotMatch(runtime, /Create an account first|Tell my story first|onAccountFirst|startAccountFirst/);
});
