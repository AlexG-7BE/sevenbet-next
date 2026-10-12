import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { betterAuth } from "better-auth";

import {
  GOOGLE_AUTH_CALLBACK,
  GOOGLE_AUTH_ERROR_CALLBACK,
  GOOGLE_LINK_CALLBACK,
  GOOGLE_LINK_ERROR_CALLBACK,
  googleLoginCallbacks,
  isAllowedGoogleLinkRequest,
  isAllowedGoogleSignInRequest,
} from "../lib/auth/google-flow";
import {
  GOOGLE_PREPARATION_CHECK_EVERY_MS,
  GOOGLE_PREPARATION_IDLE_AFTER_MS,
  GOOGLE_PREPARATION_RETRY_AFTER_MS,
  GOOGLE_SIGN_IN_STATE_LIFETIME_MS,
  PENDING_CLAIM_RENEW_FOR_GOOGLE_AFTER_MS,
  PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS,
  PREPARED_GOOGLE_ADDRESS_RENEW_AFTER_MS,
  createGooglePreparation,
  preparedGoogleAddress,
  preparedGoogleAddressIsFresh,
  type GooglePressClaim,
} from "../lib/auth/google-press";
import { forgetClaimMade, journeyWithAccessProof, noteClaimMade, tabProgrammeProgress } from "../lib/programme/access-client";
import { PROGRAMME_ACCESS_TTL_MS } from "../lib/programme/access-contract";
import {
  anonymousProgrammeSubject,
  loadProgrammeSubjectContent,
  mergeProgrammeSubjectContent,
  programmeLocalStorageKeysForTests,
} from "../lib/programme/local-subject-storage";
import {
  PENDING_CLAIM_FRESH_FOR_GOOGLE_MS,
  pendingClaimIsFresh,
} from "../lib/programme/program-ai/pending-claim-client";
import { pendingClaimLifetimeMs } from "../lib/programme/security";

// Founder decision, 12 Oct 2026 ("Мгновенная кнопка Google"): everything a press on Google needs
// is prepared behind the screen, so the press leaves at once. In the production log of the
// Founder's own walk that day every press sent starting-point → claim → sign-in/social first.

const second = 1000;
const minute = 60 * second;
const START = 1_800_000_000_000;

/** Lets the preparation's own promise chains run. */
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** A screen with a clock, a server that answers when told to, and a remembered claim time. */
function screen(options: { claim?: "none" | "missing" | number } = {}) {
  let now = START;
  const addressRequests: Array<ReturnType<typeof deferred<unknown>>> = [];
  const claimRequests: Array<ReturnType<typeof deferred<void>>> = [];
  let claimReadyAt: unknown = options.claim === "missing" || options.claim === "none" ? undefined : options.claim ?? START;
  const claim: GooglePressClaim | null = options.claim === "none" ? null : {
    get readyAt() { return claimReadyAt; },
    make: async () => {
      const request = deferred<void>();
      claimRequests.push(request);
      await request.promise;
      claimReadyAt = now;
    },
  };
  const preparation = createGooglePreparation({
    now: () => now,
    prepareAddress: () => {
      const request = deferred<unknown>();
      addressRequests.push(request);
      return request.promise;
    },
    claim: () => claim,
  });
  return {
    preparation,
    addressRequests,
    claimRequests,
    advance(ms: number) { now += ms; },
    /** The server answers the newest address request. */
    async answerAddress(url = `https://accounts.google.com/o/oauth2/v2/auth?state=${addressRequests.length}`) {
      addressRequests.at(-1)!.resolve({ url, redirect: false });
      await settle();
      return url;
    },
    async answerClaim() {
      claimRequests.at(-1)!.resolve();
      await settle();
    },
  };
}

test("the freshness windows keep the time a person has at Google and to come back", () => {
  // The sign-in state Better Auth keeps in the browser is the real limit of a Google round trip.
  const state = readFileSync("node_modules/better-auth/dist/state.mjs", "utf8");
  assert.match(state, /createAuthCookie\(settings\?\.cookieName \?\? "state", \{ maxAge: 300 \}\)/, "the installed library keeps the state cookie for 300 seconds");
  assert.equal(GOOGLE_SIGN_IN_STATE_LIFETIME_MS, 300 * second);
  // The site stores sign-in state in the database and sets no other lifetime or strategy.
  const config = readFileSync("lib/auth/config.ts", "utf8");
  assert.match(config, /database: prismaAdapter\(prisma,/);
  assert.doesNotMatch(config, /storeStateStrategy|skipStateCookieCheck/);
  // A prepared address is used for one minute at most: at least four of five minutes are left.
  assert.ok(GOOGLE_SIGN_IN_STATE_LIFETIME_MS - PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS >= 4 * minute);
  // It is renewed early enough that a visible screen always holds a fresh one: the check interval
  // and a slow request both fit between renewal and staleness.
  assert.ok(PREPARED_GOOGLE_ADDRESS_RENEW_AFTER_MS + GOOGLE_PREPARATION_CHECK_EVERY_MS + 5 * second <= PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS);
  // The claim: Google still gets one made at most five minutes ago, so 25 of the server's 30
  // minutes remain, and it is renewed before a press would find it too old.
  assert.ok(pendingClaimLifetimeMs - PENDING_CLAIM_FRESH_FOR_GOOGLE_MS >= 25 * minute);
  assert.ok(PENDING_CLAIM_RENEW_FOR_GOOGLE_AFTER_MS + GOOGLE_PREPARATION_CHECK_EVERY_MS + 5 * second <= PENDING_CLAIM_FRESH_FOR_GOOGLE_MS);
  // An untouched screen stops long before the tab's access proof ends, and a failure is not hammered.
  assert.ok(GOOGLE_PREPARATION_IDLE_AFTER_MS < PROGRAMME_ACCESS_TTL_MS);
  assert.ok(GOOGLE_PREPARATION_RETRY_AFTER_MS >= 30 * second);

  assert.equal(preparedGoogleAddressIsFresh(START - 59 * second, START), true);
  assert.equal(preparedGoogleAddressIsFresh(START - 60 * second, START), false);
  for (const value of [undefined, null, "1800000000000", Number.NaN, START + second]) {
    assert.equal(preparedGoogleAddressIsFresh(value, START), false, String(value));
  }
});

test("only the answer to a request that asked for no redirect is an address to hold", () => {
  const url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y";
  assert.equal(preparedGoogleAddress({ url, redirect: false }), url);
  assert.equal(preparedGoogleAddress({ url: "http://127.0.0.1:4173/google", redirect: false }), "http://127.0.0.1:4173/google");
  for (const answer of [
    null,
    undefined,
    "https://accounts.google.com/",
    [],
    {},
    { url },
    { url, redirect: true },
    { url: "javascript:alert(1)", redirect: false },
    { url: "/relative", redirect: false },
    { url: 7, redirect: false },
    { code: "INVALID_SOCIAL_AUTH_REQUEST" },
  ]) assert.equal(preparedGoogleAddress(answer), null, JSON.stringify(answer));
});

test("with the address and a fresh claim prepared, a press leaves at once and sends nothing", async () => {
  const { preparation, addressRequests, claimRequests, answerAddress } = screen();
  preparation.start();
  // Behind the screen: one address request. The claim made after the answers is fresh.
  assert.equal(addressRequests.length, 1);
  assert.equal(claimRequests.length, 0);
  const url = await answerAddress();

  assert.equal(preparation.press(), url);
  assert.equal(addressRequests.length, 1, "the press asks for nothing");
  assert.equal(claimRequests.length, 0);
  // Nothing new starts once the press is leaving: a later request would replace the sign-in state.
  preparation.check();
  preparation.resume();
  assert.equal(addressRequests.length, 1);
});

test("the address is renewed before it goes stale and is never used once it is", async () => {
  const { preparation, addressRequests, advance, answerAddress } = screen();
  preparation.start();
  await answerAddress();

  advance(PREPARED_GOOGLE_ADDRESS_RENEW_AFTER_MS - second);
  preparation.check();
  assert.equal(addressRequests.length, 1, "still fresh: nothing is asked");
  advance(second);
  preparation.check();
  assert.equal(addressRequests.length, 2, "renewed at 45 seconds");
  // The request takes three seconds; the address's age counts from before it was sent.
  advance(3 * second);
  const renewed = await answerAddress();
  assert.equal(await preparation.settled(), renewed);
  advance(PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS - 4 * second);
  assert.equal(await preparation.settled(), renewed, "59 seconds after it was asked for");
  advance(second);
  assert.equal(await preparation.settled(), null, "a minute-old address is not used");

  // A screen whose renewal did not come back in time has no address to leave with.
  const stale = screen();
  stale.preparation.start();
  await stale.answerAddress();
  stale.advance(PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS);
  assert.equal(stale.preparation.press(), null);
});

test("address requests never overlap, and a press waits for one in flight instead of leaving beside it", async () => {
  // The browser keeps one sign-in state: the answer that arrives last decides which address works.
  const { preparation, addressRequests, advance, answerAddress } = screen();
  preparation.start();
  preparation.check();
  preparation.check();
  assert.equal(addressRequests.length, 1, "one request, however often the screen checks");
  const first = await answerAddress();

  advance(PREPARED_GOOGLE_ADDRESS_RENEW_AFTER_MS);
  preparation.check();
  assert.equal(addressRequests.length, 2);
  // The first address is still young, but its sign-in state is about to be replaced.
  assert.equal(preparation.press(), null);
  const waiting = preparation.settled();
  const newest = await answerAddress();
  assert.equal(await waiting, newest);
  assert.notEqual(newest, first);
  assert.equal(addressRequests.length, 2, "the press itself asked for nothing");
});

test("the claim is renewed behind the screen before a Google press would find it too old", async () => {
  const { preparation, claimRequests, addressRequests, advance, answerAddress, answerClaim } = screen();
  preparation.start();
  await answerAddress();

  advance(PENDING_CLAIM_RENEW_FOR_GOOGLE_AFTER_MS - second);
  preparation.check();
  assert.equal(claimRequests.length, 0);
  advance(second);
  preparation.check();
  assert.equal(claimRequests.length, 1, "renewed at four minutes");
  await answerAddress();
  // While the claim is being made the page must not leave: the server is between two states.
  assert.equal(preparation.press(), null);
  const waiting = preparation.settled();
  await answerClaim();
  assert.match(String(await waiting), /^https:\/\/accounts\.google\.com\//);
  assert.equal(claimRequests.length, 1);
  assert.ok(addressRequests.length >= 2);
});

test("a claim that was never made is made behind the screen, once, and remembered", async () => {
  // The Founder's walk: the claim behind the screen did not finish before the page was loaded
  // again, and nothing made it until the press. A reloaded screen now makes it itself.
  const { preparation, claimRequests, answerAddress, answerClaim } = screen({ claim: "missing" });
  preparation.start();
  assert.equal(claimRequests.length, 1);
  const url = await answerAddress();
  assert.equal(preparation.press(), null, "not while the claim is being made");
  await answerClaim();
  assert.equal(await preparation.settled(), url);
  preparation.release();
  preparation.check();
  assert.equal(claimRequests.length, 1, "the remembered claim is reused, not made again");
});

test("an address without a fresh claim is not enough, and a sign-up without a Starting Point needs no claim", async () => {
  // A claim older than five minutes that could not be renewed: the press does the work itself.
  const old = screen({ claim: START - PENDING_CLAIM_FRESH_FOR_GOOGLE_MS });
  old.preparation.start();
  assert.equal(old.claimRequests.length, 1);
  await old.answerAddress();
  old.claimRequests[0].reject(new Error("PENDING_CLAIM_NOT_MADE"));
  await settle();
  assert.equal(old.preparation.press(), null);
  old.preparation.release();
  old.preparation.check();
  assert.equal(old.claimRequests.length, 1, "a failed claim is not retried at once");
  old.advance(GOOGLE_PREPARATION_RETRY_AFTER_MS);
  old.preparation.check();
  assert.equal(old.claimRequests.length, 2);

  // A Google sign-up that began on Log in comes back without a Starting Point.
  const accountFirst = screen({ claim: "none" });
  accountFirst.preparation.start();
  const url = await accountFirst.answerAddress();
  assert.equal(accountFirst.claimRequests.length, 0);
  assert.equal(accountFirst.preparation.press(), url);
});

test("a failed preparation leaves the press to do the work, and is retried only after a rest", async () => {
  const { preparation, addressRequests } = screen();
  preparation.start();
  addressRequests[0].reject(new Error("network"));
  await settle();
  assert.equal(preparation.press(), null, "nothing prepared: the earlier path runs");
  assert.equal(await preparation.settled(), null);
  preparation.release();
  assert.equal(addressRequests.length, 2, "a released press asks again at once");

  // A refusal, a redirecting answer or nothing to ask with are failures too.
  for (const answer of [{ code: "INVALID_SOCIAL_AUTH_REQUEST" }, { url: "https://accounts.google.com/", redirect: true }, null]) {
    const refused = screen();
    refused.preparation.start();
    refused.addressRequests[0].resolve(answer);
    await settle();
    assert.equal(refused.preparation.press(), null, JSON.stringify(answer));
  }

  const resting = screen();
  resting.preparation.start();
  resting.addressRequests[0].reject(new Error("503"));
  await settle();
  resting.advance(GOOGLE_PREPARATION_RETRY_AFTER_MS - second);
  resting.preparation.check();
  assert.equal(resting.addressRequests.length, 1, "no retry loop");
  resting.advance(second);
  resting.preparation.check();
  assert.equal(resting.addressRequests.length, 2);
  await resting.answerAddress();
  assert.match(String(resting.preparation.press()), /^https:/);
});

test("a hidden tab asks for nothing, and a tab shown again forgets its address and asks for a new one", async () => {
  const { preparation, addressRequests, claimRequests, advance, answerAddress } = screen();
  preparation.start(false);
  assert.equal(addressRequests.length, 0, "opened in a hidden tab: nothing is asked");
  preparation.resume();
  assert.equal(addressRequests.length, 1);
  const first = await answerAddress();

  preparation.hide();
  advance(10 * minute);
  for (let checks = 0; checks < 50; checks += 1) preparation.check();
  assert.equal(addressRequests.length, 1, "no requests while hidden");
  assert.equal(claimRequests.length, 0);

  // Another tab may have asked for a newer address meanwhile, so the old one is not trusted,
  // however young it is.
  const young = screen();
  young.preparation.start();
  await young.answerAddress();
  young.preparation.hide();
  young.preparation.resume();
  assert.equal(young.preparation.press(), null);

  preparation.resume();
  assert.equal(addressRequests.length, 2);
  assert.equal(claimRequests.length, 1, "the claim aged past four minutes while hidden");
  assert.notEqual(await answerAddress(), first);
});

test("an answer to a request made before the tab was hidden is not kept", async () => {
  const { preparation, addressRequests, answerAddress } = screen();
  preparation.start();
  preparation.hide();
  preparation.resume();
  // The first request is still in flight; no second one runs beside it.
  assert.equal(addressRequests.length, 1);
  await answerAddress("https://accounts.google.com/o/oauth2/v2/auth?state=before-hidden");
  // Its answer is dropped and a new request follows it.
  assert.equal(addressRequests.length, 2);
  assert.equal(preparation.press(), null);
  const fresh = await answerAddress("https://accounts.google.com/o/oauth2/v2/auth?state=after-shown");
  assert.equal(await preparation.settled(), fresh);
});

test("nothing new is prepared beside another action, on an untouched screen, or after the screen is left", async () => {
  const held = screen({ claim: "missing" });
  held.preparation.hold(true);
  held.preparation.start();
  assert.equal(held.addressRequests.length + held.claimRequests.length, 0, "email or saving is in flight");
  held.preparation.hold(false);
  assert.equal(held.addressRequests.length, 1);
  assert.equal(held.claimRequests.length, 1);

  const idle = screen();
  idle.preparation.start();
  await idle.answerAddress();
  idle.advance(GOOGLE_PREPARATION_IDLE_AFTER_MS);
  idle.preparation.check();
  assert.equal(idle.addressRequests.length, 1, "nobody has touched the screen for 15 minutes");
  assert.equal(idle.claimRequests.length, 0);
  idle.preparation.touch();
  assert.equal(idle.addressRequests.length, 2, "a touch wakes it");
  assert.equal(idle.claimRequests.length, 1);

  const left = screen();
  left.preparation.start();
  await left.answerAddress();
  left.preparation.stop();
  left.advance(minute);
  left.preparation.check();
  assert.equal(left.addressRequests.length, 1);
  assert.equal(left.preparation.press(), null, "the address is forgotten with the screen");
});

test("the tab remembers when the claim was made, so a second press does not make it again", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  const journey = anonymousProgrammeSubject(storage);
  const startingPoint = { startingPoint: "…", desiredChange: "…" };
  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "registration", answers: ["I chase my losses"], candidate: startingPoint } });

  // After a reload with no remembered claim, the first press makes it.
  const first = tabProgrammeProgress(storage, journey);
  assert.equal(first.kind === "starting-point" && pendingClaimIsFresh(first.claimReadyAt, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS, START), false);
  noteClaimMade(storage, journey, START);
  // Back from Google 12 and 19 seconds later (the Founder's second and third press): still fresh.
  for (const later of [12 * second, 19 * second, 5 * minute - second]) {
    const again = tabProgrammeProgress(storage, journey);
    assert.equal(again.kind === "starting-point" && pendingClaimIsFresh(again.claimReadyAt, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS, START + later), true, String(later));
  }
  const programme = readFileSync("components/programme/ProgramAiExperience.tsx", "utf8");
  assert.match(programme, /await prepareClaimForRegistration\(journey, state\);\s+rememberClaim\(journey\);/);

  // A claim being made again is not counted as ready meanwhile: the server drops the earlier one
  // as soon as the new one is started, so a renewal that fails half-way leaves the press to make it.
  forgetClaimMade(storage, journey);
  const renewing = tabProgrammeProgress(storage, journey);
  assert.deepEqual(renewing, { kind: "starting-point", startingPoint, claimReadyAt: undefined });
  assert.deepEqual(loadProgrammeSubjectContent(storage, journey), { programAi: { phase: "registration", answers: ["I chase my losses"], candidate: startingPoint } });
  forgetClaimMade(storage, journey);
  noteClaimMade(storage, journey, START + minute);
  assert.equal(pendingClaimIsFresh((tabProgrammeProgress(storage, journey) as { claimReadyAt: unknown }).claimReadyAt, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS, START + minute), true);
  const login = readFileSync("components/auth/LoginExperience.tsx", "utf8");
  assert.match(login, /forgetClaimMade\(window\.sessionStorage, journey\);\s+await makePendingClaim\(programmeMutationAccessHeaders\(window\.sessionStorage, journey\), progress\.startingPoint\);\s+noteClaimMade\(window\.sessionStorage, journey\);/);
  assert.match(programme, /forgetClaim\(journey\);\s+await prepareClaimForRegistration\(journey, state\);\s+rememberClaim\(journey\);/);
  // A reload keeps the remembered time.
  assert.match(programme, /\.\.\.\(value\.candidate && typeof value\.claimReadyAt === "number" \? \{ claimReadyAt: value\.claimReadyAt \} : \{\}\)/);

  // Work behind a screen uses a proof the person already gave and never asks for one.
  assert.equal(journeyWithAccessProof(storage), null);
  assert.equal(values.has(programmeLocalStorageKeysForTests.accessContinuation), false);
});

test("Log in prepares only for a tab that already affirmed access, and its press leaves without moving to the Programme", () => {
  const login = readFileSync("components/auth/LoginExperience.tsx", "utf8");
  // Nothing is affirmed behind the screen.
  const prepare = login.slice(login.indexOf("const googlePress = useGooglePress({"), login.indexOf("// Founder decision, 11 Oct 2026: Log in also creates the account."));
  assert.doesNotMatch(prepare, /affirmAnonymousProgrammeAccess|recordAccountProgrammeAccess/);
  assert.match(prepare, /const journey = journeyWithAccessProof\(window\.sessionStorage\);\s+if \(!journey\) return null;/);
  assert.match(prepare, /requestSignUp: true, disableRedirect: true, fetchOptions: \{ headers: programmeAuthAccessHeaders\(window\.sessionStorage, journey\) \}/);
  // The press: at once with what was prepared, otherwise the earlier path; a second press does nothing.
  const press = login.slice(login.indexOf("async function startGoogle()"), login.indexOf("async function startGoogleLink()"));
  assert.match(press, /if \(googlePressed\.current\) return;/);
  assert.match(press, /const prepared = googlePress\.press\(\) \?\? await googlePress\.settled\(\);/);
  assert.match(press, /if \(tabProgrammeProgress\(window\.sessionStorage, held\)\.kind === "starting-point"\) markStartingPointForAccount\(window\.sessionStorage, held\);\s+else prepareAccountFirstGoogleReturn\(window\.sessionStorage, held\);\s+rememberGoogleMarketingChoice\(window\.sessionStorage, held\.id, marketingAllowed\);\s+googlePress\.leave\(prepared\);/);
  assert.match(press, /googlePress\.release\(\);\s+googlePressed\.current = false;\s+setBusy\(false\);/);
  // The button already said "Opening Google…" while busy.
  assert.match(login, /disabled=\{busy\} onClick=\{startGoogle\} type="button">[\s\S]*\{t\(busy \? "Opening Google…" : "Continue with Google"\)\}/);
});

test("the sign-in boundary accepts the prepared request and nothing else new", () => {
  const prepared = {
    provider: "google",
    callbackURL: GOOGLE_AUTH_CALLBACK,
    errorCallbackURL: GOOGLE_AUTH_ERROR_CALLBACK,
    requestSignUp: true,
    disableRedirect: true,
  };
  assert.equal(isAllowedGoogleSignInRequest(prepared), true);
  // Only the literal `true` a prepared request sends; every other value and key stays refused.
  for (const attempt of [
    { ...prepared, disableRedirect: false },
    { ...prepared, disableRedirect: "true" },
    { ...prepared, disableRedirect: 1 },
    { ...prepared, disableRedirect: null },
    { ...prepared, callbackURL: "https://attacker.invalid/callback" },
    { ...prepared, scopes: ["https://mail.google.com/"] },
    { ...prepared, additionalData: { narrative: "sentinel" } },
    { ...prepared, idToken: { token: "sentinel" } },
    { ...prepared, loginHint: "someone@example.test" },
    { ...prepared, newUserCallbackURL: "/admin" },
  ]) assert.equal(isAllowedGoogleSignInRequest(attempt), false, JSON.stringify(attempt));
  // A `/login` callback still cannot create a social account, prepared or not.
  const login = googleLoginCallbacks("/best-offers");
  assert.equal(isAllowedGoogleSignInRequest({ provider: "google", ...login, requestSignUp: true, disableRedirect: true }), false);
  // Linking is a separate boundary and did not gain the key.
  assert.equal(isAllowedGoogleLinkRequest({ provider: "google", callbackURL: GOOGLE_LINK_CALLBACK, errorCallbackURL: GOOGLE_LINK_ERROR_CALLBACK, disableRedirect: true }), false);
  // The route still asks the boundary before anything reaches Better Auth.
  const route = readFileSync("app/api/auth/[...all]/route.ts", "utf8");
  assert.match(route, /const allowed = socialAuthentication\s+\? isAllowedGoogleSignInRequest\(socialRequest\)/);
});

test("the installed library answers a prepared request with the same Google address and no redirect", async () => {
  const auth = betterAuth({
    appName: "B4GAMBLE prepared Google press test",
    baseURL: "http://localhost:3000",
    secret: "K9w!f4Rz2Qm8Yx7Lc3Vp6Ns1Ht5Bg0De",
    logger: { disabled: true },
    socialProviders: {
      google: { clientId: "prepared-press-client", clientSecret: "prepared-press-secret", accessType: "online", disableIdTokenSignIn: true, disableImplicitSignUp: true },
    },
  });
  const ask = (extra: Record<string, unknown>) => auth.handler(new Request("http://localhost:3000/api/auth/sign-in/social", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: "google", callbackURL: GOOGLE_AUTH_CALLBACK, errorCallbackURL: GOOGLE_AUTH_ERROR_CALLBACK, requestSignUp: true, ...extra }),
  }));

  const pressed = await ask({});
  const prepared = await ask({ disableRedirect: true });
  assert.equal(pressed.status, 200);
  assert.equal(prepared.status, 200);
  const pressedAnswer = await pressed.json() as { url: string; redirect: boolean };
  const preparedAnswer = await prepared.json() as { url: string; redirect: boolean };
  assert.equal(pressedAnswer.redirect, true);
  assert.equal(preparedAnswer.redirect, false);
  assert.equal(prepared.headers.get("location"), null, "a prepared request carries no redirect header");
  assert.equal(preparedGoogleAddress(preparedAnswer), preparedAnswer.url);
  assert.equal(preparedGoogleAddress(pressedAnswer), null);

  // What Google receives is the same; only the per-request state and PKCE challenge differ.
  const sent = (url: string) => {
    const address = new URL(url);
    const params = [...address.searchParams.entries()].filter(([name]) => name !== "state" && name !== "code_challenge");
    return { origin: address.origin, path: address.pathname, params: params.sort(([left], [right]) => left.localeCompare(right)) };
  };
  assert.deepEqual(sent(preparedAnswer.url), sent(pressedAnswer.url));
  assert.equal(new URL(preparedAnswer.url).hostname, "accounts.google.com");
  assert.ok(new URL(preparedAnswer.url).searchParams.get("state"));
  assert.notEqual(new URL(preparedAnswer.url).searchParams.get("state"), new URL(pressedAnswer.url).searchParams.get("state"));
});
