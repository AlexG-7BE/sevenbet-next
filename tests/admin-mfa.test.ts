import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { base32 } from "@better-auth/utils/base32";

import {
  ADMIN_MFA_MANAGEMENT_PATHS,
  ADMIN_SESSION_CREATION_PATHS,
  isAdminMfaManagementPath,
  isAllowedAdminSessionCreationPath,
} from "../lib/auth/admin-mfa-policy";

const BASE_URL = "http://localhost:3000";
const EMAIL = "admin-mfa@example.test";
const PASSWORD = "Admin-Mfa-Test-Password-42!";

class CookieJar {
  private readonly values = new Map<string, string>();

  apply(response: Response) {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    for (const value of headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""]) {
      if (!value) continue;
      const [pair] = value.split(";", 1);
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const cookieValue = pair.slice(separator + 1);
      if (/max-age=0/i.test(value) || !cookieValue) this.values.delete(name);
      else this.values.set(name, cookieValue);
    }
  }

  header() {
    return [...this.values].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

function createMfaTestAuth() {
  return betterAuth({
    appName: "B4GAMBLE Admin MFA test",
    baseURL: BASE_URL,
    secret: "S7cP4xNv2rY9kH6dQ3mB8tL5wF1aG0eZ",
    logger: { disabled: true },
    emailAndPassword: { enabled: true },
    session: { cookieCache: { enabled: false } },
    databaseHooks: {
      user: {
        update: {
          after: async (user, context) => {
            if (
              context?.path === "/two-factor/verify-totp" &&
              user.twoFactorEnabled === true
            ) {
              await context.context.internalAdapter.deleteUserSessions(user.id);
            }
          },
        },
      },
    },
    plugins: [
      twoFactor({
        issuer: "B4GAMBLE Admin",
        skipVerificationOnEnable: false,
        trustDeviceMaxAge: 0,
        totpOptions: { digits: 6, period: 30 },
        backupCodeOptions: { storeBackupCodes: "encrypted" },
        accountLockout: {
          enabled: true,
          maxFailedAttempts: 10,
          durationSeconds: 900,
        },
      }),
    ],
    rateLimit: { enabled: false },
    disabledPaths: [
      "/two-factor/disable",
      "/two-factor/send-otp",
      "/two-factor/verify-otp",
    ],
    advanced: {
      disableCSRFCheck: true,
      disableOriginCheck: true,
    },
  });
}

async function post(
  auth: ReturnType<typeof createMfaTestAuth>,
  path: string,
  body: Record<string, unknown>,
  jar?: CookieJar,
) {
  const headers = new Headers({ "content-type": "application/json" });
  if (jar?.header()) headers.set("cookie", jar.header());
  const response = await auth.handler(new Request(`${BASE_URL}/api/auth${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }));
  jar?.apply(response);
  return response;
}

async function session(auth: ReturnType<typeof createMfaTestAuth>, jar: CookieJar) {
  const response = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`, {
    headers: { cookie: jar.header() },
  }));
  return response.json() as Promise<unknown>;
}

async function signInChallenge(auth: ReturnType<typeof createMfaTestAuth>) {
  const jar = new CookieJar();
  const response = await post(auth, "/sign-in/email", {
    email: EMAIL,
    password: PASSWORD,
  }, jar);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    twoFactorRedirect: true,
    twoFactorMethods: ["totp"],
  });
  assert.equal(await session(auth, jar), null, "a second-factor challenge is not a session");
  return jar;
}

test("Admin session and MFA management policy is exact and fail closed", () => {
  assert.deepEqual(ADMIN_SESSION_CREATION_PATHS, [
    "/sign-in/email",
    "/two-factor/verify-totp",
    "/two-factor/verify-backup-code",
  ]);
  assert.deepEqual(ADMIN_MFA_MANAGEMENT_PATHS, [
    "/two-factor/enable",
    "/two-factor/generate-backup-codes",
    "/two-factor/get-totp-uri",
  ]);

  for (const path of ADMIN_SESSION_CREATION_PATHS) {
    assert.equal(isAllowedAdminSessionCreationPath(path), true);
  }
  for (const path of [undefined, "/callback/google", "/sign-in/social", "/verify-email"]) {
    assert.equal(isAllowedAdminSessionCreationPath(path), false);
  }
  assert.equal(isAdminMfaManagementPath("/two-factor/enable"), true);
  assert.equal(isAdminMfaManagementPath("/two-factor/disable"), false);
});

test("Admin MFA config uses official encrypted TOTP without a parallel auth system", () => {
  const config = readFileSync("lib/auth/config.ts", "utf8");
  const hooks = readFileSync("lib/auth/admin-mfa.server.ts", "utf8");
  const login = readFileSync("components/admin/AdminLoginForm.tsx", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync("prisma/migrations/0042_admin_mfa/migration.sql", "utf8");

  assert.match(config, /twoFactor\(\{/);
  assert.match(config, /storeBackupCodes: "encrypted"/);
  assert.match(config, /skipVerificationOnEnable: false/);
  assert.match(config, /trustDeviceMaxAge: 0/);
  assert.match(config, /rateLimit: \{ enabled: false \}/);
  assert.match(config, /"\/two-factor\/disable"/);
  assert.match(hooks, /deleteUserSessions\(user\.id\)/);
  assert.match(login, /router\.replace\(getAdminMfaEnrollmentUrl\(callbackUrl\)\)/);
  assert.doesNotMatch(`${config}\n${hooks}`, /program(me)?|affiliate|commercial/i);
  assert.match(schema, /model TwoFactor \{/);
  assert.match(schema, /twoFactorEnabled\s+Boolean\?\s+@default\(false\)/);
  assert.match(migration, /CREATE TABLE "TwoFactor"/);
  assert.match(migration, /ON DELETE CASCADE ON UPDATE CASCADE/);
});

test("official TOTP enrollment, challenge limits, and one-use backup codes work", async () => {
  const auth = createMfaTestAuth();
  const enrollmentJar = new CookieJar();
  const signup = await post(auth, "/sign-up/email", {
    email: EMAIL,
    name: "Admin MFA Test",
    password: PASSWORD,
  }, enrollmentJar);
  assert.equal(signup.status, 200);

  const oldSessionCookie = enrollmentJar.header();
  const enabled = await post(auth, "/two-factor/enable", {
    method: "totp",
    password: PASSWORD,
  }, enrollmentJar);
  assert.equal(enabled.status, 200);
  const material = await enabled.json() as {
    method: "totp";
    totpURI: string;
    backupCodes: string[];
  };
  assert.equal(material.method, "totp");
  assert.equal(material.backupCodes.length, 10);

  const secret = new URL(material.totpURI).searchParams.get("secret");
  assert.ok(secret);
  const rawSecret = new TextDecoder().decode(base32.decode(secret));
  const generated = await auth.api.generateTOTP({ body: { secret: rawSecret } });
  const failedEnrollment = await post(auth, "/two-factor/verify-totp", {
    code: generated.code === "000000" ? "000001" : "000000",
    trustDevice: false,
  }, enrollmentJar);
  assert.equal(failedEnrollment.status, 401);
  const notYetEnrolled = await session(auth, enrollmentJar) as { user?: { twoFactorEnabled?: boolean } } | null;
  assert.equal(notYetEnrolled?.user?.twoFactorEnabled, false);

  const verified = await post(auth, "/two-factor/verify-totp", {
    code: generated.code,
    trustDevice: false,
  }, enrollmentJar);
  const verifiedPayload = await verified.clone().json().catch(() => null);
  assert.equal(verified.status, 200, JSON.stringify(verifiedPayload));
  assert.doesNotMatch(
    (verified.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.().join("\n") ?? "",
    /two_factor_trust/i,
  );

  const oldSessionResponse = await auth.handler(new Request(`${BASE_URL}/api/auth/get-session`, {
    headers: { cookie: oldSessionCookie },
  }));
  assert.equal(await oldSessionResponse.json(), null, "the pre-enrollment session is revoked");
  const enrolledSession = await session(auth, enrollmentJar) as { user?: { twoFactorEnabled?: boolean } } | null;
  assert.equal(enrolledSession?.user?.twoFactorEnabled, true);

  const exhausted = await signInChallenge(auth);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const failure = await post(auth, "/two-factor/verify-totp", {
      code: "000000",
      trustDevice: false,
    }, exhausted);
    assert.equal(failure.status, 401);
  }
  const overBudget = await post(auth, "/two-factor/verify-totp", {
    code: "000000",
    trustDevice: false,
  }, exhausted);
  assert.equal(overBudget.status, 400);
  assert.match(JSON.stringify(await overBudget.json()), /TOO_MANY_ATTEMPTS/);

  const totpChallenge = await signInChallenge(auth);
  const currentCode = await auth.api.generateTOTP({ body: { secret: rawSecret } });
  const totpSignIn = await post(auth, "/two-factor/verify-totp", {
    code: currentCode.code,
    trustDevice: false,
  }, totpChallenge);
  assert.equal(totpSignIn.status, 200);
  assert.ok(await session(auth, totpChallenge));
  const logout = await post(auth, "/sign-out", {}, totpChallenge);
  assert.equal(logout.status, 200);
  assert.equal(await session(auth, totpChallenge), null);

  const backupChallenge = await signInChallenge(auth);
  const backupSignIn = await post(auth, "/two-factor/verify-backup-code", {
    code: material.backupCodes[0],
    disableSession: false,
    trustDevice: false,
  }, backupChallenge);
  assert.equal(backupSignIn.status, 200);
  assert.ok(await session(auth, backupChallenge));

  const replayChallenge = await signInChallenge(auth);
  const replay = await post(auth, "/two-factor/verify-backup-code", {
    code: material.backupCodes[0],
    disableSession: false,
    trustDevice: false,
  }, replayChallenge);
  assert.equal(replay.status, 401);
  assert.match(JSON.stringify(await replay.json()), /INVALID_BACKUP_CODE/);
});
