import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { POST as issueAccessAuthority } from "../app/api/programme-access/authority/route";
import { programmeAuthAccessDenial } from "../lib/auth/programme-access-policy";
import {
  issueProgrammeAccessProof,
  verifyProgrammeAccessProof,
} from "../lib/auth/programme-access-proof";
import {
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_HEADER_VALUES,
  PROGRAMME_ACCESS_TTL_MS,
  PROGRAMME_AUTH_ACCESS_HEADERS,
} from "../lib/programme/access-contract";

const SECRET = "programme-access-test-secret-with-at-least-32-bytes";
const NOW = Date.parse("2026-08-10T10:00:00.000Z");
const JOURNEY = "c90bfc5e-2e12-4a8b-9b84-52bf15fce684";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

function proofHeaders(journeyId = JOURNEY, now = NOW) {
  const authority = issueProgrammeAccessProof({ journeyId, secret: SECRET, now });
  return {
    [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: authority.proof,
    [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
  };
}

const staticForgedHeaders = {
  [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
  [PROGRAMME_ACCESS_HEADERS.terms]: PROGRAMME_ACCESS_HEADER_VALUES.terms,
  [PROGRAMME_ACCESS_HEADERS.privacy]: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
};

function resign(proof: string, mutate: (claims: Record<string, unknown>) => void) {
  const [, encoded] = proof.split(".");
  const claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(claims);
  const nextEncoded = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const key = createHmac("sha256", SECRET).update("sevenbet/programme-auth-access/hmac-sha256/v1").digest();
  const signature = createHmac("sha256", key).update(`pa1.${nextEncoded}`).digest("base64url");
  return `pa1.${nextEncoded}.${signature}`;
}

test("manually forging all three legacy static headers cannot create an account", async () => {
  for (const boundary of [
    { emailAccountCreation: true, socialAuthentication: false, socialAccountCreation: false },
    { emailAccountCreation: false, socialAuthentication: true, socialAccountCreation: true },
  ]) {
    const denial = programmeAuthAccessDenial(headers(staticForgedHeaders), boundary, { secret: SECRET, now: NOW + 1 });
    assert.ok(denial);
    assert.equal(denial.status, 403);
    assert.equal((await denial.json()).code, "CURRENT_ACCESS_AUTHORITY_REQUIRED");
  }
});

test("authority endpoint issues only from the exact consolidated affirmations and current copy", async () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  process.env.BETTER_AUTH_SECRET = SECRET;
  try {
    const response = await issueAccessAuthority(new Request("http://localhost/api/programme-access/authority", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        journeyId: JOURNEY,
        adultConfirmed: true,
        termsAccepted: true,
        privacyAcknowledged: true,
        termsVersion: PROGRAMME_ACCESS_HEADER_VALUES.terms,
        privacyVersion: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
      }),
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const payload = await response.json() as { authority: { proof: string; journeyId: string } };
    assert.equal(payload.authority.journeyId, JOURNEY);
    assert.match(payload.authority.proof, /^pa1\./);

    const invalid = await issueAccessAuthority(new Request("http://localhost/api/programme-access/authority", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        journeyId: JOURNEY,
        adultConfirmed: true,
        termsAccepted: true,
        privacyAcknowledged: false,
        termsVersion: PROGRAMME_ACCESS_HEADER_VALUES.terms,
        privacyVersion: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
      }),
    }));
    assert.equal(invalid.status, 400);
  } finally {
    if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = originalSecret;
  }
});

test("valid current server proof allows email and Google account creation", () => {
  for (const boundary of [
    { emailAccountCreation: true, socialAuthentication: false, socialAccountCreation: false },
    { emailAccountCreation: false, socialAuthentication: true, socialAccountCreation: true },
  ]) {
    assert.equal(programmeAuthAccessDenial(headers(proofHeaders()), boundary, { secret: SECRET, now: NOW + 1 }), null);
  }
});

test("returning email needs no creation proof while returning Google keeps signed adult access", async () => {
  assert.equal(programmeAuthAccessDenial(headers(), {
    emailAccountCreation: false,
    socialAuthentication: false,
    socialAccountCreation: false,
  }, { secret: SECRET, now: NOW }), null);

  const googleWithoutProof = programmeAuthAccessDenial(headers(staticForgedHeaders), {
    emailAccountCreation: false,
    socialAuthentication: true,
    socialAccountCreation: false,
  }, { secret: SECRET, now: NOW + 1 });
  assert.ok(googleWithoutProof);
  assert.equal((await googleWithoutProof.json()).code, "CURRENT_ACCESS_AUTHORITY_REQUIRED");

  assert.equal(programmeAuthAccessDenial(headers(proofHeaders()), {
    emailAccountCreation: false,
    socialAuthentication: true,
    socialAccountCreation: false,
  }, { secret: SECRET, now: NOW + 1 }), null);
});

test("proof is bound to its signature, original 60-minute TTL and exact journey", () => {
  const authority = issueProgrammeAccessProof({ journeyId: JOURNEY, secret: SECRET, now: NOW });
  assert.equal(authority.expiresAt - authority.createdAt, PROGRAMME_ACCESS_TTL_MS);
  assert.equal(verifyProgrammeAccessProof({ proof: authority.proof, journeyId: JOURNEY, secret: SECRET, now: NOW + 1 }).ok, true);

  const modified = `${authority.proof.slice(0, -1)}${authority.proof.endsWith("A") ? "B" : "A"}`;
  assert.deepEqual(verifyProgrammeAccessProof({ proof: modified, journeyId: JOURNEY, secret: SECRET, now: NOW + 1 }), { ok: false, reason: "signature" });
  assert.deepEqual(verifyProgrammeAccessProof({ proof: authority.proof, journeyId: "2db9293d-fd2a-423e-8424-61552342ed86", secret: SECRET, now: NOW + 1 }), { ok: false, reason: "journey" });
  assert.deepEqual(verifyProgrammeAccessProof({ proof: authority.proof, journeyId: JOURNEY, secret: SECRET, now: NOW + PROGRAMME_ACCESS_TTL_MS }), { ok: false, reason: "time" });

  const wrongDuration = resign(authority.proof, (claims) => { claims.expiresAt = NOW + PROGRAMME_ACCESS_TTL_MS + 1; });
  assert.deepEqual(verifyProgrammeAccessProof({ proof: wrongDuration, journeyId: JOURNEY, secret: SECRET, now: NOW + 1 }), { ok: false, reason: "time" });
});

test("version, purpose, intent, copy and issuance-time tampering fail closed even with a valid test signature", () => {
  const proof = issueProgrammeAccessProof({ journeyId: JOURNEY, secret: SECRET, now: NOW }).proof;
  const scenarios: Array<[string, (claims: Record<string, unknown>) => void, string]> = [
    ["version", (claims) => { claims.proofVersion = 2; }, "version"],
    ["purpose", (claims) => { claims.purpose = "PROGRAMME_CLAIM_GOOGLE"; }, "purpose"],
    ["intent", (claims) => { claims.intent = "PROGRAMME_CONTENT_CLAIM"; }, "intent"],
    ["terms", (claims) => { claims.termsVersion = "obsolete"; }, "copy"],
    ["privacy", (claims) => { claims.privacyVersion = "obsolete"; }, "copy"],
    ["future", (claims) => { claims.createdAt = NOW + 60_000; claims.adultConfirmedAt = NOW + 60_000; claims.termsAcceptedAt = NOW + 60_000; claims.privacyAcknowledgedAt = NOW + 60_000; claims.expiresAt = NOW + 60_000 + PROGRAMME_ACCESS_TTL_MS; }, "time"],
  ];
  for (const [name, mutate, reason] of scenarios) {
    assert.deepEqual(
      verifyProgrammeAccessProof({ proof: resign(proof, mutate), journeyId: JOURNEY, secret: SECRET, now: NOW + 1 }),
      { ok: false, reason },
      name,
    );
  }
});
