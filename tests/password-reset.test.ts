import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { betterAuth } from "better-auth";

import {
  loginPath,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordResetFailure,
  passwordResetPath,
  passwordResetRequestFailure,
  passwordResetView,
} from "../lib/auth/password-reset";
import { safeAuthReturnTo } from "../lib/auth/return-to";
import { shouldAutoOpenPrivacyChoice } from "../lib/analytics/consent-prompt";
import { publicRoutePolicy } from "../lib/market/routing";

// Production shape: BETTER_AUTH_URL, BETTER_AUTH_TRUSTED_ORIGINS and the
// lifecycle email site URL are all exactly https://b4gamble.com.
const SITE = "https://b4gamble.com";
const PASSWORD = "original-password-1";
const NEW_PASSWORD = "replacement-password-2";

function createResetTestAuth(sent: Array<{ url: string; token: string; email: string }>) {
  return betterAuth({
    appName: "B4GAMBLE password reset test",
    baseURL: SITE,
    secret: "Q7m!r2Vx9Lp4Tz8Nc1Hw6Kb3Fd5Gs0Ja",
    logger: { disabled: true },
    trustedOrigins: [SITE],
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      sendResetPassword: async ({ user, url, token }) => {
        sent.push({ url, token, email: user.email });
      },
    },
    rateLimit: { enabled: false },
    // Better Auth skips origin checks under NODE_ENV=test unless told otherwise;
    // this test must exercise the same redirect validation Production runs.
    advanced: { disableOriginCheck: false },
  });
}

function post(path: string, body: unknown) {
  return new Request(`${SITE}/api/auth${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: SITE,
      // Any first-party cookie makes Better Auth verify the Origin header too.
      cookie: "b4g_presentation=en",
    },
    body: JSON.stringify(body),
  });
}

test("reset paths carry only a safe return target in a query Better Auth accepts as a relative redirect", () => {
  assert.equal(passwordResetPath(null), "/reset-password");
  assert.equal(passwordResetPath("/program"), "/reset-password");
  assert.equal(passwordResetPath("/de/program"), "/reset-password?returnTo=%2Fde%2Fprogram");
  assert.equal(passwordResetPath("https://attacker.invalid/x"), "/reset-password");
  assert.equal(passwordResetPath("//attacker.invalid"), "/reset-password");
  assert.equal(passwordResetPath("/reset-password?returnTo=%2Fde%2Fprogram"), "/reset-password");
  assert.equal(loginPath("/sv/program"), "/login?returnTo=%2Fsv%2Fprogram");
  assert.equal(loginPath(undefined), "/login");
  // Characters encodeURIComponent leaves alone would fail Better Auth's relative-path check.
  const unusual = passwordResetPath("/program/mission?step=(1)!*'~");
  assert.match(unusual, /^\/(?!\/|\\|%2f|%5c)[\w\-.+/@]*(?:\?[\w\-.+/=&%@]*)?$/);
  assert.equal(new URL(unusual, SITE).searchParams.get("returnTo"), safeAuthReturnTo("/program/mission?step=(1)!*'~"));
  // Neither auth page can become a post-login destination (no loops).
  assert.equal(safeAuthReturnTo("/reset-password"), "/program");
  assert.equal(safeAuthReturnTo("/reset-password?token=abc"), "/program");
  assert.equal(safeAuthReturnTo("/login"), "/program");
});

test("reset page view follows Better Auth's token and error query contract", () => {
  assert.deepEqual(passwordResetView({ token: null, error: null }), { kind: "request" });
  assert.deepEqual(passwordResetView({ token: "AbCdEfGh12345678IjKlMnOp", error: null }), { kind: "reset", token: "AbCdEfGh12345678IjKlMnOp" });
  assert.deepEqual(passwordResetView({ token: null, error: "INVALID_TOKEN" }), { kind: "invalid" });
  assert.deepEqual(passwordResetView({ token: "AbCdEfGh12345678IjKlMnOp", error: "INVALID_TOKEN" }), { kind: "invalid" });
  assert.deepEqual(passwordResetView({ token: "<script>", error: null }), { kind: "invalid" });
  assert.deepEqual(passwordResetView({ token: "", error: null }), { kind: "invalid" });
});

test("client error mapping never distinguishes accounts and keeps expired links recoverable", () => {
  assert.equal(passwordResetRequestFailure(null), null);
  assert.equal(passwordResetRequestFailure({ status: 429 }), "RATE_LIMITED");
  assert.equal(passwordResetRequestFailure({ status: 400, code: "VALIDATION_ERROR" }), "INVALID_EMAIL");
  assert.equal(passwordResetRequestFailure({ status: 403, code: "INVALID_REDIRECT_URL" }), "FAILED");
  assert.equal(passwordResetRequestFailure({ status: 503, code: "AUTH_SERVICE_UNAVAILABLE" }), "FAILED");
  assert.equal(passwordResetFailure(null), null);
  assert.equal(passwordResetFailure({ status: 400, code: "INVALID_TOKEN" }), "INVALID_LINK");
  assert.equal(passwordResetFailure({ status: 400, code: "USER_NOT_FOUND" }), "INVALID_LINK");
  assert.equal(passwordResetFailure({ status: 400, code: "PASSWORD_TOO_SHORT" }), "TOO_SHORT");
  assert.equal(passwordResetFailure({ status: 400, code: "PASSWORD_TOO_LONG" }), "TOO_LONG");
  assert.equal(passwordResetFailure({ status: 429 }), "RATE_LIMITED");
  assert.equal(passwordResetFailure({ status: 500 }), "FAILED");
  assert.equal(PASSWORD_MIN_LENGTH, 8);
  assert.equal(PASSWORD_MAX_LENGTH, 128);
});

test("installed Better Auth 1.7.1 sends, lands, resets once and signs in with the new password", async () => {
  const sent: Array<{ url: string; token: string; email: string }> = [];
  const auth = createResetTestAuth(sent);
  const email = "reset-customer@example.com";
  await auth.api.signUpEmail({ body: { email, password: PASSWORD, name: "Reset Customer" } });
  const redirectTo = passwordResetPath("/de/program");

  // Unknown and known emails get byte-identical answers; only the known one is sent.
  const unknown = await auth.handler(post("/request-password-reset", { email: "nobody@example.com", redirectTo }));
  const known = await auth.handler(post("/request-password-reset", { email, redirectTo }));
  assert.equal(unknown.status, 200);
  assert.equal(known.status, 200);
  assert.deepEqual(await unknown.json(), await known.json());
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, email);

  // The emailed action URL passes lib/email/service.server.ts: same origin as the site, no credentials.
  const action = new URL(sent[0].url);
  assert.equal(action.origin, SITE);
  assert.equal(action.username, "");
  assert.equal(action.password, "");
  assert.equal(action.pathname, `/api/auth/reset-password/${sent[0].token}`);
  assert.equal(action.searchParams.get("callbackURL"), redirectTo);

  // A foreign redirect is refused, so the relative one above really passed the origin check.
  const hostile = await auth.handler(post("/request-password-reset", { email, redirectTo: "https://attacker.invalid/reset-password" }));
  assert.equal(hostile.status, 403);
  assert.equal(sent.length, 1);

  // The emailed link lands on the reset page with the token and the Programme language.
  const landing = await auth.handler(new Request(sent[0].url));
  assert.equal(landing.status, 302);
  const landed = new URL(landing.headers.get("location") ?? "", SITE);
  assert.equal(landed.origin, SITE);
  assert.equal(landed.pathname, "/reset-password");
  assert.equal(landed.searchParams.get("returnTo"), "/de/program");
  assert.deepEqual(passwordResetView({ token: landed.searchParams.get("token"), error: landed.searchParams.get("error") }), { kind: "reset", token: sent[0].token });

  const bogus = await auth.handler(new Request(`${SITE}/api/auth/reset-password/NotARealToken000000000000?callbackURL=${encodeURIComponent(redirectTo)}`));
  const bogusLanding = new URL(bogus.headers.get("location") ?? "", SITE);
  assert.equal(bogusLanding.pathname, "/reset-password");
  assert.equal(bogusLanding.searchParams.get("error"), "INVALID_TOKEN");
  assert.deepEqual(passwordResetView({ token: bogusLanding.searchParams.get("token"), error: bogusLanding.searchParams.get("error") }), { kind: "invalid" });

  // A too-short password is refused without using up the link.
  const short = await auth.handler(post("/reset-password", { newPassword: "short", token: sent[0].token }));
  assert.equal(short.status, 400);
  assert.equal(passwordResetFailure({ status: short.status, ...(await short.json() as { code: string }) }), "TOO_SHORT");

  const reset = await auth.handler(post("/reset-password", { newPassword: NEW_PASSWORD, token: sent[0].token }));
  assert.equal(reset.status, 200);
  assert.deepEqual(await reset.json(), { status: true });

  const reused = await auth.handler(post("/reset-password", { newPassword: "another-password-3", token: sent[0].token }));
  assert.equal(reused.status, 400);
  assert.equal(passwordResetFailure({ status: reused.status, ...(await reused.json() as { code: string }) }), "INVALID_LINK");

  const withNew = await auth.handler(post("/sign-in/email", { email, password: NEW_PASSWORD }));
  assert.equal(withNew.status, 200);
  const withOld = await auth.handler(post("/sign-in/email", { email, password: PASSWORD }));
  assert.equal(withOld.status, 401);
});

test("reset route is wired like /login and uses the exact Better Auth 1.7.1 client calls", () => {
  const login = readFileSync("components/auth/LoginExperience.tsx", "utf8");
  const experience = readFileSync("components/auth/PasswordResetExperience.tsx", "utf8");
  const page = readFileSync("app/(public)/reset-password/page.tsx", "utf8");
  const config = readFileSync("lib/auth/config.ts", "utf8");
  const middleware = readFileSync("middleware.ts", "utf8");

  assert.doesNotMatch(login, /<span className=\{styles\.forgot\}>/);
  assert.match(login, /<Link className=\{styles\.forgot\} href=\{passwordResetPath\(returnTo\)\}>\{t\("Forgot password\?"\)\}<\/Link>/);
  assert.match(experience, /authClient\.requestPasswordReset\(\{\s*email: email\.trim\(\)\.toLowerCase\(\),\s*redirectTo: passwordResetPath\(returnTo\),\s*\}\)/);
  assert.match(experience, /authClient\.resetPassword\(\{ newPassword: password, token \}\)/);
  assert.doesNotMatch(experience, /forgetPassword/);
  assert.match(experience, /autoComplete="new-password" maxLength=\{PASSWORD_MAX_LENGTH\} minLength=\{PASSWORD_MIN_LENGTH\}/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  // The confirmation promises a one-hour link: Better Auth's default lifetime, not overridden here.
  assert.match(config, /sendResetPassword: async/);
  assert.doesNotMatch(config, /resetPasswordTokenExpiresIn|minPasswordLength|maxPasswordLength/);
  assert.match(middleware, /pathname === "\/login" \|\| pathname === "\/reset-password"/);

  assert.equal(publicRoutePolicy("/reset-password"), publicRoutePolicy("/login"));
  const base = { consentState: "unknown" as const, dismissed: false, automated: false, automationOptIn: false };
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, pathname: "/reset-password" }), false);
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, pathname: "/reset-passwords" }), true);
});
