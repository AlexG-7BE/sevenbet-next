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
  GOOGLE_LINK_CALLBACK,
  GOOGLE_LINK_ERROR_CALLBACK,
  googleLoginCallbacks,
  isAllowedGoogleLinkRequest,
  isAllowedGoogleSignInRequest,
} from "../lib/auth/google-flow";
import { safeAuthReturnTo } from "../lib/auth/return-to";

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
  const provider = config.slice(config.indexOf("socialProviders"), config.indexOf("databaseHooks"));
  const route = readFileSync("app/api/auth/[...all]/route.ts", "utf8");
  const accessContract = readFileSync("lib/programme/access-contract.ts", "utf8");
  const accessPolicy = readFileSync("lib/auth/programme-access-policy.ts", "utf8");
  const accessProof = readFileSync("lib/auth/programme-access-proof.ts", "utf8");

  assert.match(config, /encryptOAuthTokens: true/);
  assert.match(config, /updateAccountOnSignIn: false/);
  assert.match(config, /appName: "B4GAMBLE"/);
  assert.match(config, /requireLocalEmailVerified: true/);
  assert.match(config, /allowDifferentEmails: false/);
  assert.match(config, /allowUnlinkingAll: false/);
  assert.match(config, /updateUserInfoOnLink: false/);
  assert.match(provider, /google:/);
  assert.match(provider, /accessType: "online"/);
  assert.match(provider, /disableIdTokenSignIn: true/);
  assert.match(provider, /disableImplicitSignUp: true/);
  assert.doesNotMatch(provider, /scope|gmail|contacts|calendar|offline/i);
  assert.match(route, /sign-in\/social/);
  assert.match(route, /programmeAuthAccessDenial/);
  assert.match(accessPolicy, /verifyProgrammeAccessProof/);
  assert.match(accessPolicy, /PROGRAMME_AUTH_ACCESS_HEADERS\.proof/);
  assert.match(accessPolicy, /PROGRAMME_AUTH_ACCESS_HEADERS\.journey/);
  assert.match(accessProof, /createHmac/);
  assert.match(accessProof, /sevenbet\/programme-auth-access\/hmac-sha256\/v1/);
  assert.match(accessContract, /x-sevenbet-age-attestation/);
  assert.match(accessContract, /x-sevenbet-terms-acceptance/);
  assert.match(accessContract, /x-sevenbet-privacy-acknowledgement/);
  assert.match(accessContract, /x-sevenbet-programme-access-proof/);
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

  const login = googleLoginCallbacks("/best-offers?from=login#shortlist");
  assert.equal(isAllowedGoogleSignInRequest({ provider: "google", ...login, requestSignUp: false }), true);
  assert.equal(isAllowedGoogleSignInRequest({ provider: "google", ...login, requestSignUp: true }), false, "standalone login cannot create a social account");
});

test("explicit Google linking accepts only exact same-origin callback pairs and no credential or scope input", () => {
  const programme = { provider: "google", callbackURL: GOOGLE_LINK_CALLBACK, errorCallbackURL: GOOGLE_LINK_ERROR_CALLBACK };
  assert.equal(isAllowedGoogleLinkRequest(programme), true);
  const login = { provider: "google", ...googleLoginCallbacks("/program?resume=1", "link") };
  assert.equal(isAllowedGoogleLinkRequest(login), true);

  for (const attempt of [
    { ...programme, provider: "github" },
    { ...programme, callbackURL: "https://attacker.invalid" },
    { ...programme, errorCallbackURL: "/login?auth=google-link-error&returnTo=%2Fadmin" },
    { ...programme, scopes: ["openid"] },
    { ...programme, idToken: { token: "sentinel" } },
    { ...programme, additionalData: { role: "admin" } },
    { ...programme, disableRedirect: true },
    { ...programme, requestSignUp: true },
  ]) assert.equal(isAllowedGoogleLinkRequest(attempt), false);
});

test("login return paths reject external, protocol-relative, control and login-loop destinations", () => {
  assert.equal(safeAuthReturnTo("/best-offers?from=login#shortlist"), "/best-offers?from=login#shortlist");
  for (const unsafe of [
    "https://attacker.invalid/path",
    "//attacker.invalid/path",
    "/\\attacker.invalid/path",
    "/login?returnTo=/admin",
    "/login/recovery",
    "/path\nheader: injected",
    "javascript:alert(1)",
    undefined,
  ]) assert.equal(safeAuthReturnTo(unsafe), "/program");
});

test("privacy and operations evidence describe only the implemented Google boundary", () => {
  const privacy = readFileSync("app/(public)/privacy/page.tsx", "utf8");
  const processors = readFileSync("docs/04_Compliance/Processor-and-International-Transfer-Register.md", "utf8");
  const retention = readFileSync("docs/04_Compliance/Personal-Data-Retention-Schedule.md", "utf8");
  const runbook = readFileSync("docs/06_Operations/Google-Authentication-and-Email-Readiness.md", "utf8");
  const exampleEnvironment = readFileSync(".env.example", "utf8");

  assert.match(privacy, /If you choose Google sign-in/);
  assert.match(privacy, /does not provide B4GAMBLE with your date of birth, contacts, mailbox contents or a gambling profile/);
  assert.match(privacy, /Google sign-in, age confirmation, Terms acceptance and Programme participation do not create reminder or marketing permission/);
  assert.match(privacy, /Google credentials are used transiently by the server to verify the sign-in and are stripped before the application account relationship is stored/);
  assert.match(processors, /Google Identity \/ OAuth/);
  assert.match(processors, /external activation not verified/);
  assert.match(retention, /Google claim-continuation marker/);
  assert.match(retention, /Authentication sessions and accounts/);
  assert.match(retention, /Access, refresh and ID tokens, token expiry metadata and scope are stripped before create\/update persistence/);
  assert.match(runbook, /http:\/\/localhost:4173\/api\/auth\/callback\/google/);
  assert.match(runbook, /https:\/\/b4gamble\.com\/api\/auth\/callback\/google/);
  assert.match(runbook, /EMAIL DELIVERY NOT CONFIGURED/);
  assert.match(exampleEnvironment, /GOOGLE_CLIENT_ID=""/);
  assert.match(exampleEnvironment, /GOOGLE_CLIENT_SECRET=""/);
  assert.doesNotMatch(exampleEnvironment, /GOOGLE_CLIENT_(ID|SECRET)="[^\"]+"/);
});
