import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { betterAuth } from "better-auth";
import { createEmailVerificationToken } from "better-auth/api";

import {
  customerEmailVerificationOptions,
  EMAIL_VERIFICATION_LINK_SECONDS,
  type VerificationEmailDelivery,
} from "../lib/auth/email-verification";
import {
  clearGoogleMarketingChoice,
  rememberGoogleMarketingChoice,
  takeGoogleMarketingChoice,
} from "../lib/customers/email-preference-client";
import { runAfterResponse } from "../lib/http/after-response";

// Production shape: BETTER_AUTH_URL, BETTER_AUTH_TRUSTED_ORIGINS and the
// lifecycle email site URL are all exactly https://b4gamble.com.
const SITE = "https://b4gamble.com";
const SECRET = "V3n!q8Rz2Lx6Tp9Mc4Hw1Kb7Fd0Gs5Ja";
const PASSWORD = "correct horse battery staple";

type Sent = { user: { id: string; name: string; email: string }; url: string };

function createVerificationTestAuth(deliver: VerificationEmailDelivery) {
  return betterAuth({
    appName: "B4GAMBLE email verification test",
    baseURL: SITE,
    secret: SECRET,
    logger: { disabled: true },
    trustedOrigins: [SITE],
    emailAndPassword: { enabled: true, autoSignIn: true },
    emailVerification: customerEmailVerificationOptions(deliver),
    rateLimit: { enabled: false },
    // Better Auth skips origin checks under NODE_ENV=test unless told otherwise;
    // these tests must exercise the redirect validation Production runs.
    advanced: { disableOriginCheck: false },
  });
}

function post(path: string, body: unknown, cookie = "b4g_presentation=en") {
  return new Request(`${SITE}/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE, cookie },
    body: JSON.stringify(body),
  });
}

function sessionCookie(response: Response) {
  return response.headers.getSetCookie()
    .map((value) => value.split(";")[0]!)
    .filter((value) => value.includes("session_token=") && !value.endsWith("="))
    .join("; ");
}

function jwtLifetimeSeconds(url: string) {
  const token = new URL(url).searchParams.get("token") ?? "";
  const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { iat: number; exp: number };
  return payload.exp - payload.iat;
}

test("an email sign-up is sent one confirmation link that passes the email origin check and signs the customer in on any device", async () => {
  const sent: Sent[] = [];
  const auth = createVerificationTestAuth((input) => { sent.push(input); });
  const email = "new-customer@example.com";

  const signUp = await auth.handler(post("/sign-up/email", { email, password: PASSWORD, name: "new-customer", callbackURL: "/de/program" }));
  assert.equal(signUp.status, 200);
  assert.ok(sessionCookie(signUp), "sign-up still signs the customer in at once");
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.user.email, email);

  // lib/email/service.server.ts only sends a link on the site origin without credentials.
  const link = new URL(sent[0]!.url);
  assert.equal(link.origin, SITE);
  assert.equal(link.username, "");
  assert.equal(link.password, "");
  assert.equal(link.pathname, "/api/auth/verify-email");
  assert.equal(link.searchParams.get("callbackURL"), "/de/program");
  assert.equal(jwtLifetimeSeconds(sent[0]!.url), EMAIL_VERIFICATION_LINK_SECONDS);
  assert.equal(EMAIL_VERIFICATION_LINK_SECONDS, 24 * 60 * 60);

  // Opened in a mail app's browser without the sign-up cookie: confirmed,
  // signed in there, and landed on the Programme in the customer's language.
  const opened = await auth.handler(new Request(sent[0]!.url));
  assert.equal(opened.status, 302);
  assert.equal(opened.headers.get("location"), "/de/program");
  const cookie = sessionCookie(opened);
  assert.ok(cookie, "the confirmation link signs the customer in");
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  assert.equal(session?.user.email, email);
  assert.equal(session?.user.emailVerified, true);

  // Opening it again only lands on the Programme; it is no longer a sign-in link.
  const reopened = await auth.handler(new Request(sent[0]!.url));
  assert.equal(reopened.status, 302);
  assert.equal(reopened.headers.get("location"), "/de/program");
  assert.equal(sessionCookie(reopened), "");
});

test("sign-up never waits for, or fails because of, email delivery", async () => {
  const hanging = createVerificationTestAuth(({ user, url }) => runAfterResponse(
    () => new Promise(() => { void user; void url; }),
    () => undefined,
  ));
  const started = Date.now();
  const slow = await hanging.handler(post("/sign-up/email", { email: "slow-provider@example.com", password: PASSWORD, name: "slow" }));
  assert.equal(slow.status, 200);
  assert.ok(Date.now() - started < 5_000);

  const throwing = createVerificationTestAuth(() => { throw new Error("provider exploded"); });
  const failed = await throwing.handler(post("/sign-up/email", { email: "broken-provider@example.com", password: PASSWORD, name: "broken" }));
  assert.equal(failed.status, 200);
  assert.ok(sessionCookie(failed));

  let reported = false;
  runAfterResponse(async () => { throw new Error("delivery failed"); }, () => { reported = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reported, true);
});

test("a foreign landing page is refused and an expired link lands on the Programme with a readable error", async () => {
  const sent: Sent[] = [];
  const auth = createVerificationTestAuth((input) => { sent.push(input); });
  const hostile = await auth.handler(post("/sign-up/email", { email: "hostile@example.com", password: PASSWORD, name: "hostile", callbackURL: "https://attacker.invalid/program" }));
  assert.equal(hostile.status, 403);
  assert.equal(sent.length, 0);

  const expiredToken = await createEmailVerificationToken(SECRET, "someone@example.com", undefined, -60);
  const expired = await auth.handler(new Request(`${SITE}/api/auth/verify-email?token=${expiredToken}&callbackURL=${encodeURIComponent("/sv/program")}`));
  assert.equal(expired.status, 302);
  assert.equal(expired.headers.get("location"), "/sv/program?error=TOKEN_EXPIRED");
  assert.equal(sessionCookie(expired), "");
});

test("a signed-in unconfirmed customer can ask for the link again; a confirmed one cannot", async () => {
  const sent: Sent[] = [];
  const auth = createVerificationTestAuth((input) => { sent.push(input); });
  const email = "resend@example.com";
  const signUp = await auth.handler(post("/sign-up/email", { email, password: PASSWORD, name: "resend", callbackURL: "/program" }));
  const cookie = sessionCookie(signUp);
  const resend = await auth.handler(post("/send-verification-email", { email, callbackURL: "/program" }, cookie));
  assert.equal(resend.status, 200);
  assert.equal(sent.length, 2);
  assert.equal(new URL(sent[1]!.url).searchParams.get("callbackURL"), "/program");

  const foreign = await auth.handler(post("/send-verification-email", { email: "someone-else@example.com", callbackURL: "/program" }, cookie));
  assert.equal(foreign.status, 400);
  assert.equal(sent.length, 2);

  await auth.handler(new Request(sent[1]!.url));
  const verifiedCookie = sessionCookie(await auth.handler(post("/sign-in/email", { email, password: PASSWORD })));
  const again = await auth.handler(post("/send-verification-email", { email, callbackURL: "/program" }, verifiedCookie));
  assert.equal(again.status, 400);
  assert.equal(sent.length, 2);
});

test("the Google opt-in survives the redirect only for its own journey, once, and only when ticked", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  const journey = "4f7c1d2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f";
  const now = 1_800_000_000_000;

  rememberGoogleMarketingChoice(storage, journey, true, now);
  assert.equal(takeGoogleMarketingChoice(storage, journey, now + 60_000), true);
  assert.equal(takeGoogleMarketingChoice(storage, journey, now + 60_000), false, "a choice is recorded once");

  rememberGoogleMarketingChoice(storage, journey, true, now);
  rememberGoogleMarketingChoice(storage, journey, false, now);
  assert.equal(takeGoogleMarketingChoice(storage, journey, now), false, "unticking before leaving removes it");

  rememberGoogleMarketingChoice(storage, journey, true, now);
  assert.equal(takeGoogleMarketingChoice(storage, "0b9a8c7d-6e5f-4a3b-9c2d-1e0f9a8b7c6d", now), false, "another journey never inherits it");
  assert.equal(values.size, 0);

  rememberGoogleMarketingChoice(storage, journey, true, now);
  assert.equal(takeGoogleMarketingChoice(storage, journey, now + 10 * 60 * 1000 + 1), false, "it expires after ten minutes");

  rememberGoogleMarketingChoice(storage, journey, true, now);
  clearGoogleMarketingChoice(storage);
  assert.equal(takeGoogleMarketingChoice(storage, journey, now), false);

  values.set("sevenbet.programme.google-marketing-choice.v1", "{not json");
  assert.equal(takeGoogleMarketingChoice(storage, journey, now), false);
  values.set("sevenbet.programme.google-marketing-choice.v1", JSON.stringify({ version: 1, journeyId: journey, expiresAt: now + 24 * 60 * 60 * 1000 }));
  assert.equal(takeGoogleMarketingChoice(storage, journey, now), false, "a forged far-future expiry is refused");
});

test("the application wires verification, the Google opt-in and immediate welcome through the existing services", () => {
  const config = readFileSync("lib/auth/config.ts", "utf8");
  const route = readFileSync("app/api/auth/[...all]/route.ts", "utf8");
  const experience = readFileSync("components/programme/ProgramAiExperience.tsx", "utf8");
  const presentation = readFileSync("components/programme/ProgramAiFinalPresentation.tsx", "utf8");
  const home = readFileSync("components/programme/ProgramAiHome.tsx", "utf8");
  const observer = readFileSync("lib/customers/auth-observer.server.ts", "utf8");
  const hooks = readFileSync("lib/customers/auth-hooks.server.ts", "utf8");

  // Verification: sent on sign-up, delivered after the response, one cooldown, the shared auth sender.
  assert.match(config, /emailVerification: customerEmailVerificationOptions\(\(\{ user, url \}\) => runAfterResponse\(/);
  assert.match(config, /verificationEmailRecentlyQueued\(user\.id\)[\s\S]*sendAuthEmail\(\{ user, actionUrl: url, templateKey: "EMAIL_VERIFICATION" \}\)/);
  assert.doesNotMatch(config, /backgroundTasks/);
  assert.match(experience, /authClient\.signUp\.email\(\{[^}]*callbackURL: programmePath,/);
  // Only a signed-in customer may ask for the link again.
  assert.match(route, /pathname\.endsWith\("\/send-verification-email"\)/);
  assert.match(route, /if \(verificationResend\) \{[\s\S]*getServerSession\(downstreamRequest\.headers\)[\s\S]*AUTHENTICATION_REQUIRED[\s\S]*\}\s*const response = await dispatchAuth/);
  assert.match(home, /authClient\.sendVerificationEmail\(\{ email, callbackURL: programmePath \}\)/);

  // One opt-in, asked once, localised, carried across Google and recorded by the preference service.
  assert.equal(presentation.match(/PROGRAMME_MARKETING_OPT_IN_LABEL/g)?.length, 2);
  assert.match(presentation, /<span>\{t\(PROGRAMME_MARKETING_OPT_IN_LABEL\)\}<\/span>/);
  assert.match(presentation, /onGoogle\(\{ marketingAllowed: marketingChoiceShown && marketingAllowed \}\)/);
  assert.match(experience, /rememberGoogleMarketingChoice\(window\.sessionStorage, subject\.id, input\.marketingAllowed\)/);
  assert.match(experience, /takeGoogleMarketingChoice\(window\.sessionStorage, journey\.id\)\s*\? saveProgrammeMarketingPreference\(locale\)/);

  // Welcome: both sign-up signals deliver through the claimed queue, after the response.
  assert.match(observer, /await deliverWelcomeEmail\(user\.id\)/);
  assert.match(hooks, /runAfterResponse\(async \(\) => \{[\s\S]*deliverWelcomeEmail\(session\.userId\)/);
});
