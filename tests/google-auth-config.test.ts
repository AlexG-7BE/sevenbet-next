import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isGoogleAuthAvailable,
  resolveGoogleAuthConfig,
} from "../lib/auth/google-config";
import {
  GOOGLE_AUTH_CALLBACK,
  GOOGLE_AUTH_ERROR_CALLBACK,
  isAllowedGoogleSignInRequest,
} from "../lib/auth/google-flow";

test("Google authentication fails closed unless both credentials are complete", () => {
  assert.equal(resolveGoogleAuthConfig({}), null);
  assert.equal(resolveGoogleAuthConfig({ GOOGLE_CLIENT_ID: "client" }), null);
  assert.equal(resolveGoogleAuthConfig({ GOOGLE_CLIENT_SECRET: "secret" }), null);
  assert.equal(resolveGoogleAuthConfig({ GOOGLE_CLIENT_ID: " ", GOOGLE_CLIENT_SECRET: "secret" }), null);
  assert.equal(isGoogleAuthAvailable({ GOOGLE_CLIENT_ID: "client", GOOGLE_CLIENT_SECRET: "secret" }), true);
  assert.deepEqual(
    resolveGoogleAuthConfig({ GOOGLE_CLIENT_ID: " client ", GOOGLE_CLIENT_SECRET: " secret " }),
    { clientId: "client", clientSecret: "secret" },
  );
});

test("Google uses Better Auth's bounded identity provider and safe linking options", () => {
  const config = readFileSync("lib/auth/config.ts", "utf8");
  const provider = config.slice(config.indexOf("socialProviders"), config.indexOf("trustedOrigins"));
  const route = readFileSync("app/api/auth/[...all]/route.ts", "utf8");

  assert.match(config, /encryptOAuthTokens: true/);
  assert.match(config, /requireLocalEmailVerified: true/);
  assert.match(config, /allowDifferentEmails: false/);
  assert.match(config, /allowUnlinkingAll: false/);
  assert.match(config, /updateUserInfoOnLink: false/);
  assert.match(provider, /google:/);
  assert.match(provider, /accessType: "online"/);
  assert.match(provider, /disableImplicitSignUp: true/);
  assert.doesNotMatch(provider, /scope|gmail|contacts|calendar|offline/i);
  assert.match(route, /sign-in\/social/);
  assert.match(route, /x-sevenbet-age-attestation/);
});

test("Google credentials remain server-named and are never public build variables", () => {
  const sources = [
    readFileSync("lib/auth/google-config.ts", "utf8"),
    readFileSync("lib/auth/config.ts", "utf8"),
    readFileSync("app/program/page.tsx", "utf8"),
  ].join("\n");

  assert.match(sources, /GOOGLE_CLIENT_ID/);
  assert.match(sources, /GOOGLE_CLIENT_SECRET/);
  assert.doesNotMatch(sources, /NEXT_PUBLIC_GOOGLE|clientSecret=|client_secret/);
});

test("the Google initiation boundary allows only fixed internal callbacks and no scope override", () => {
  const allowed = {
    provider: "google",
    callbackURL: GOOGLE_AUTH_CALLBACK,
    errorCallbackURL: GOOGLE_AUTH_ERROR_CALLBACK,
    requestSignUp: false,
  };
  assert.equal(isAllowedGoogleSignInRequest(allowed), true);
  assert.equal(isAllowedGoogleSignInRequest({ ...allowed, requestSignUp: true }), true);

  for (const attempt of [
    { ...allowed, provider: "github" },
    { ...allowed, callbackURL: "https://attacker.invalid/callback" },
    { ...allowed, errorCallbackURL: "/admin" },
    { ...allowed, scopes: ["https://mail.google.com/"] },
    { ...allowed, additionalData: { narrative: "sentinel" } },
    { ...allowed, idToken: { token: "sentinel" } },
    { ...allowed, requestSignUp: "true" },
  ]) {
    assert.equal(isAllowedGoogleSignInRequest(attempt), false);
  }
});
