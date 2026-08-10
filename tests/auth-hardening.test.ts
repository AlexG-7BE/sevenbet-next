import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { betterAuth } from "better-auth";

import {
  IDENTITY_ONLY_DISABLED_AUTH_PATHS,
  identityOnlyOAuthAccountDatabaseHooks,
  sanitizeIdentityOnlyOAuthAccount,
} from "../lib/auth/identity-only-oauth";

const BASE_URL = "http://localhost:3000";
const GOOGLE_ACCESS_SECRET_SENTINEL = "GOOGLE_ACCESS_SECRET_SENTINEL";
const GOOGLE_REFRESH_SECRET_SENTINEL = "GOOGLE_REFRESH_SECRET_SENTINEL";
const GOOGLE_ID_SECRET_SENTINEL = "GOOGLE_ID_SECRET_SENTINEL";

function createIdentityOnlyTestAuth() {
  return betterAuth({
    appName: "B4GAMBLE auth hardening test",
    baseURL: BASE_URL,
    secret: "K9w!f4Rz2Qm8Yx7Lc3Vp6Ns1Ht5Bg0De",
    logger: { disabled: true },
    emailAndPassword: { enabled: true },
    account: {
      encryptOAuthTokens: true,
      updateAccountOnSignIn: false,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: false,
        requireLocalEmailVerified: true,
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
        updateUserInfoOnLink: false,
      },
    },
    databaseHooks: identityOnlyOAuthAccountDatabaseHooks,
    disabledPaths: [...IDENTITY_ONLY_DISABLED_AUTH_PATHS],
    socialProviders: {
      google: {
        clientId: "google-client-id-for-test",
        clientSecret: "google-client-secret-for-test",
        accessType: "online",
        disableIdTokenSignIn: true,
        disableImplicitSignUp: true,
      },
    },
    advanced: {
      disableCSRFCheck: true,
      disableOriginCheck: true,
    },
  });
}

function responseCookies(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  return values
    .filter(Boolean)
    .map((value) => value.split(";", 1)[0])
    .join("; ");
}

function unsignedGoogleIdToken(profile: {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    aud: "google-client-id-for-test",
    azp: "google-client-id-for-test",
    sub: profile.sub,
    email: profile.email,
    email_verified: profile.emailVerified,
    name: profile.name,
    picture: "https://example.com/profile.png",
    iss: "https://accounts.google.com",
    iat: now,
    exp: now + 3600,
  })}.test-signature`;
}

test("identity-only account sanitizer strips Google credential material on CREATE", () => {
  const sanitized = sanitizeIdentityOnlyOAuthAccount({
    id: "account-google",
    userId: "user-a",
    providerId: "google",
    accountId: "google-sub-a",
    accessToken: GOOGLE_ACCESS_SECRET_SENTINEL,
    refreshToken: GOOGLE_REFRESH_SECRET_SENTINEL,
    idToken: GOOGLE_ID_SECRET_SENTINEL,
    accessTokenExpiresAt: new Date("2026-08-09T12:00:00.000Z"),
    refreshTokenExpiresAt: new Date("2026-08-10T12:00:00.000Z"),
    scope: "openid,email,profile",
  });

  assert.deepEqual(
    {
      id: sanitized.id,
      userId: sanitized.userId,
      providerId: sanitized.providerId,
      accountId: sanitized.accountId,
    },
    {
      id: "account-google",
      userId: "user-a",
      providerId: "google",
      accountId: "google-sub-a",
    },
  );
  for (const field of [
    "accessToken",
    "refreshToken",
    "idToken",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
    "scope",
  ] as const) {
    assert.equal(sanitized[field], null, `${field} must not be durable`);
  }
  assert.doesNotMatch(JSON.stringify(sanitized), /GOOGLE_(ACCESS|REFRESH|ID)_SECRET_SENTINEL/);
});

test("identity-only account sanitizer strips partial OAuth material on UPDATE", () => {
  const sanitized = sanitizeIdentityOnlyOAuthAccount({
    accessToken: GOOGLE_ACCESS_SECRET_SENTINEL,
    refreshToken: GOOGLE_REFRESH_SECRET_SENTINEL,
    idToken: GOOGLE_ID_SECRET_SENTINEL,
    scope: "openid,email,profile",
  });

  assert.deepEqual(sanitized, {
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
  });
});

test("credential password account writes remain unchanged", () => {
  const credential = {
    userId: "user-a",
    providerId: "credential",
    accountId: "user-a",
    password: "PASSWORD_HASH_SENTINEL",
  };

  assert.equal(sanitizeIdentityOnlyOAuthAccount(credential), credential);
  assert.equal(sanitizeIdentityOnlyOAuthAccount({ password: "UPDATED_PASSWORD_HASH_SENTINEL" }).password, "UPDATED_PASSWORD_HASH_SENTINEL");
});

test("configured Better Auth database hooks prevent token persistence on create and update", async () => {
  const auth = createIdentityOnlyTestAuth();
  const context = await auth.$context;
  const user = await context.internalAdapter.createUser({
    email: "returning-google@example.com",
    emailVerified: true,
    name: "Returning Google User",
  });
  const created = await context.internalAdapter.createAccount({
    userId: user.id,
    providerId: "google",
    accountId: "google-stable-subject",
    accessToken: GOOGLE_ACCESS_SECRET_SENTINEL,
    refreshToken: GOOGLE_REFRESH_SECRET_SENTINEL,
    idToken: GOOGLE_ID_SECRET_SENTINEL,
    accessTokenExpiresAt: new Date("2026-08-09T12:00:00.000Z"),
    refreshTokenExpiresAt: new Date("2026-08-10T12:00:00.000Z"),
    scope: "openid,email,profile",
  });

  assert.ok(created);
  assert.equal(created.userId, user.id);
  assert.equal(created.providerId, "google");
  assert.equal(created.accountId, "google-stable-subject");
  assert.equal(created.accessToken, null);
  assert.equal(created.refreshToken, null);
  assert.equal(created.idToken, null);
  assert.equal(created.scope, null);

  await context.internalAdapter.updateAccount(created.id, {
    accessToken: GOOGLE_ACCESS_SECRET_SENTINEL,
    refreshToken: GOOGLE_REFRESH_SECRET_SENTINEL,
    idToken: GOOGLE_ID_SECRET_SENTINEL,
    accessTokenExpiresAt: new Date("2026-08-11T12:00:00.000Z"),
    refreshTokenExpiresAt: new Date("2026-08-12T12:00:00.000Z"),
    scope: "openid,email,profile",
  });

  const accounts = await context.internalAdapter.findAccounts(user.id);
  assert.equal(accounts.length, 1, "returning auth must retain one provider association");
  assert.equal(accounts[0]?.id, created.id);
  assert.equal(accounts[0]?.accountId, "google-stable-subject");
  assert.equal(accounts[0]?.accessToken, null);
  assert.equal(accounts[0]?.refreshToken, null);
  assert.equal(accounts[0]?.idToken, null);
  assert.equal(accounts[0]?.accessTokenExpiresAt, null);
  assert.equal(accounts[0]?.refreshTokenExpiresAt, null);
  assert.equal(accounts[0]?.scope, null);
  assert.doesNotMatch(JSON.stringify(accounts), /GOOGLE_(ACCESS|REFRESH|ID)_SECRET_SENTINEL/);

  const session = await context.internalAdapter.createSession(user.id);
  assert.equal(session?.userId, user.id, "the retained provider relationship still supports a session");
});

test("configured hooks preserve credential account password persistence", async () => {
  const auth = createIdentityOnlyTestAuth();
  const context = await auth.$context;
  const user = await context.internalAdapter.createUser({
    email: "credential@example.com",
    emailVerified: true,
    name: "Credential User",
  });
  const account = await context.internalAdapter.createAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: "PASSWORD_HASH_SENTINEL",
  });

  assert.equal(account.password, "PASSWORD_HASH_SENTINEL");
  const updated = await context.internalAdapter.updateAccount(account.id, {
    password: "UPDATED_PASSWORD_HASH_SENTINEL",
  });
  assert.equal(updated?.password, "UPDATED_PASSWORD_HASH_SENTINEL");
});

test("installed authorization-code flow creates, returns and safely same-email links without durable Google credentials", async () => {
  const auth = createIdentityOnlyTestAuth();
  const context = await auth.$context;
  const originalFetch = globalThis.fetch;
  let activeProfile = {
    sub: "google-first-subject",
    email: "first-google@example.com",
    emailVerified: true,
    name: "First Google User",
  };
  let tokenExchangeCalls = 0;

  globalThis.fetch = (async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    assert.equal(url, "https://oauth2.googleapis.com/token");
    tokenExchangeCalls += 1;
    if (tokenExchangeCalls % 2 === 0) {
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    }
    return Response.json({
      access_token: GOOGLE_ACCESS_SECRET_SENTINEL,
      refresh_token: GOOGLE_REFRESH_SECRET_SENTINEL,
      id_token: unsignedGoogleIdToken(activeProfile),
      expires_in: 3600,
      scope: "openid email profile",
      token_type: "Bearer",
    });
  }) as typeof fetch;

  async function completeRedirect(requestSignUp: boolean) {
    const start = await auth.handler(new Request(`${BASE_URL}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "google",
        callbackURL: "/program?auth=google-return",
        errorCallbackURL: "/program?auth=google-error",
        requestSignUp,
      }),
    }));
    assert.equal(start.status, 200);
    const payload = await start.json() as { url: string };
    const state = new URL(payload.url).searchParams.get("state");
    assert.ok(state);
    const callbackUrl = `${BASE_URL}/api/auth/callback/google?code=synthetic-code&state=${encodeURIComponent(state)}`;
    const callbackCookie = responseCookies(start);
    const callback = await auth.handler(new Request(callbackUrl, { headers: { cookie: callbackCookie } }));
    assert.ok([302, 303].includes(callback.status));
    const replay = await auth.handler(new Request(callbackUrl, { headers: { cookie: callbackCookie } }));
    assert.ok([302, 303].includes(replay.status));
    assert.match(replay.headers.get("location") || "", /auth=google-error/);
    return callback;
  }

  try {
    const firstCallback = await completeRedirect(true);
    const first = await context.internalAdapter.findUserByEmail(activeProfile.email, { includeAccounts: true });
    assert.ok(first);
    assert.equal(first.accounts.length, 1);
    assert.equal(first.accounts[0]?.providerId, "google");
    assert.equal(first.accounts[0]?.accountId, activeProfile.sub);
    assert.equal(first.accounts[0]?.accessToken, null);
    assert.equal(first.accounts[0]?.refreshToken, null);
    assert.equal(first.accounts[0]?.idToken, null);
    assert.equal(first.accounts[0]?.scope, null);

    const firstSession = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`, {
      headers: { cookie: responseCookies(firstCallback) },
    }));
    assert.equal(firstSession.status, 200);
    assert.equal((await firstSession.json() as { user: { id: string } }).user.id, first.user.id);

    const returningCallback = await completeRedirect(false);
    const returning = await context.internalAdapter.findUserByEmail(activeProfile.email, { includeAccounts: true });
    assert.ok(returning);
    assert.equal(returning.user.id, first.user.id);
    assert.equal(returning.accounts.length, 1);
    assert.equal(returning.accounts[0]?.id, first.accounts[0]?.id);
    assert.equal(returning.accounts[0]?.idToken, null);
    const returningSession = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`, {
      headers: { cookie: responseCookies(returningCallback) },
    }));
    assert.equal(returningSession.status, 200);
    assert.equal((await returningSession.json() as { user: { id: string } }).user.id, first.user.id);

    const localUser = await context.internalAdapter.createUser({
      email: "verified-local@example.com",
      emailVerified: true,
      name: "Verified Local User",
    });
    await context.internalAdapter.createAccount({
      userId: localUser.id,
      providerId: "credential",
      accountId: localUser.id,
      password: "LOCAL_PASSWORD_HASH_SENTINEL",
    });
    activeProfile = {
      sub: "google-link-subject",
      email: localUser.email,
      emailVerified: true,
      name: "Verified Local User",
    };

    await completeRedirect(true);
    const linked = await context.internalAdapter.findUserByEmail(localUser.email, { includeAccounts: true });
    assert.ok(linked);
    assert.equal(linked.user.id, localUser.id, "same-email linking must not create a duplicate user");
    assert.deepEqual(linked.accounts.map((account) => account.providerId).sort(), ["credential", "google"]);
    const googleAccount = linked.accounts.find((account) => account.providerId === "google");
    assert.equal(googleAccount?.accountId, activeProfile.sub);
    assert.equal(googleAccount?.accessToken, null);
    assert.equal(googleAccount?.refreshToken, null);
    assert.equal(googleAccount?.idToken, null);
    assert.equal(googleAccount?.scope, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("disabled Better Auth provider capabilities reject unauthenticated and authenticated HTTP requests", async () => {
  const auth = createIdentityOnlyTestAuth();
  const signUpResponse = await auth.handler(new Request(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Authenticated Test User",
      email: "authenticated@example.com",
      password: "correct horse battery staple",
    }),
  }));
  assert.equal(signUpResponse.status, 200);
  const cookie = signUpResponse.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie, "sign-up must establish a real authenticated test session");

  const requests: Array<[string, "GET" | "POST"]> = [
    ["/link-social", "POST"],
    ["/get-access-token", "POST"],
    ["/refresh-token", "POST"],
    ["/account-info", "GET"],
  ];

  for (const [path, method] of requests) {
    for (const authenticated of [false, true]) {
      const response = await auth.handler(new Request(`${BASE_URL}/api/auth${path}`, {
        method,
        headers: authenticated ? { cookie } : undefined,
      }));
      assert.equal(response.status, 404, `${path} must be unavailable (${authenticated ? "authenticated" : "unauthenticated"})`);
      assert.equal(await response.text(), "Not Found");
    }
  }

  const sessionBeforeSignOut = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`, {
    headers: { cookie },
  }));
  assert.equal((await sessionBeforeSignOut.json() as { user: { email: string } }).user.email, "authenticated@example.com");
  const signOut = await auth.handler(new Request(`${BASE_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie },
  }));
  assert.equal(signOut.status, 200);
  const sessionAfterSignOut = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`, {
    headers: { cookie },
  }));
  assert.equal(await sessionAfterSignOut.json(), null, "sign-out must invalidate the B4GAMBLE session");
});

test("normal redirect OAuth and required session endpoints remain available while direct ID-token sign-in is denied", async () => {
  const auth = createIdentityOnlyTestAuth();

  const redirectSignIn = await auth.handler(new Request(`${BASE_URL}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "google",
      callbackURL: "/program?auth=google-return",
      errorCallbackURL: "/program?auth=google-error",
      requestSignUp: false,
    }),
  }));
  assert.notEqual(redirectSignIn.status, 404);
  assert.equal(redirectSignIn.status, 200);
  const redirectPayload = await redirectSignIn.json() as { url: string };
  assert.match(redirectPayload.url, /accounts\.google\.com/);

  const directIdToken = await auth.handler(new Request(`${BASE_URL}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "google",
      callbackURL: "/program",
      idToken: { token: GOOGLE_ID_SECRET_SENTINEL },
    }),
  }));
  assert.notEqual(directIdToken.status, 200);
  assert.notEqual(directIdToken.status, 404);
  assert.doesNotMatch(await directIdToken.text(), new RegExp(GOOGLE_ID_SECRET_SENTINEL));

  const state = new URL(redirectPayload.url).searchParams.get("state");
  const stateCookie = redirectSignIn.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(state);
  assert.ok(stateCookie);
  const callback = await auth.handler(new Request(
    `${BASE_URL}/api/auth/callback/google?error=access_denied&state=${encodeURIComponent(state)}`,
    { headers: { cookie: stateCookie } },
  ));
  assert.notEqual(callback.status, 404, "the Google authorization-code callback must remain registered");

  const session = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`));
  assert.equal(session.status, 200);

  const signOut = await auth.handler(new Request(`${BASE_URL}/api/auth/sign-out`, { method: "POST" }));
  assert.notEqual(signOut.status, 404, "sign-out must remain registered");
});

test("application config preserves safe implicit linking, age enforcement and the exact identity-only perimeter", () => {
  const config = readFileSync("lib/auth/config.ts", "utf8");
  const route = readFileSync("app/api/auth/[...all]/route.ts", "utf8");
  const accessContract = readFileSync("lib/programme/access-contract.ts", "utf8");
  const accessPolicy = readFileSync("lib/auth/programme-access-policy.ts", "utf8");

  assert.match(config, /updateAccountOnSignIn: false/);
  assert.match(config, /disableIdTokenSignIn: true/);
  assert.match(config, /disableImplicitLinking: false/);
  assert.match(config, /requireLocalEmailVerified: true/);
  assert.match(config, /allowDifferentEmails: false/);
  assert.match(config, /allowUnlinkingAll: false/);
  assert.match(config, /identityOnlyOAuthAccountDatabaseHooks/);
  assert.match(config, /IDENTITY_ONLY_DISABLED_AUTH_PATHS/);
  assert.doesNotMatch(config, /trustedProviders/);
  assert.match(route, /programmeAuthAccessDenial/);
  assert.match(accessPolicy, /PROGRAMME_ACCESS_HEADERS\.age/);
  assert.match(accessContract, /x-sevenbet-age-attestation/);
  assert.match(route, /sign-in\/social/);
});
