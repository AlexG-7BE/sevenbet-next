import { createHmac, timingSafeEqual } from "node:crypto";

import {
  PROGRAMME_ACCESS_INTENT,
  PROGRAMME_ACCESS_TTL_MS,
  PROGRAMME_ACCESS_VERSION,
  PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE,
  PROGRAMME_AUTH_ACCESS_PROOF_VERSION,
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
  type ProgrammeAccessAuthority,
} from "@/lib/programme/access-contract";

const SIGNING_DOMAIN = "sevenbet/programme-auth-access/hmac-sha256/v1";
const TOKEN_PREFIX = "pa1";
const MAX_PROOF_LENGTH = 4096;
const OPAQUE_JOURNEY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

type ProgrammeAccessProofClaims = {
  proofVersion: typeof PROGRAMME_AUTH_ACCESS_PROOF_VERSION;
  version: typeof PROGRAMME_ACCESS_VERSION;
  intent: typeof PROGRAMME_ACCESS_INTENT;
  purpose: typeof PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE;
  journeyId: string;
  createdAt: number;
  expiresAt: number;
  termsVersion: typeof PROGRAMME_TERMS_VERSION;
  privacyVersion: typeof PROGRAMME_PRIVACY_VERSION;
  adultConfirmedAt: number;
  termsAcceptedAt: number;
  privacyAcknowledgedAt: number;
};

export type ProgrammeAccessProofFailure =
  | "malformed"
  | "signature"
  | "version"
  | "intent"
  | "purpose"
  | "journey"
  | "time"
  | "copy";

function signingKey(secret: string) {
  return createHmac("sha256", secret).update(SIGNING_DOMAIN, "utf8").digest();
}

function signatureFor(encodedClaims: string, secret: string) {
  return createHmac("sha256", signingKey(secret))
    .update(`${TOKEN_PREFIX}.${encodedClaims}`, "utf8")
    .digest();
}

function exactClaimKeys(value: Record<string, unknown>) {
  const expected = [
    "adultConfirmedAt",
    "createdAt",
    "expiresAt",
    "intent",
    "journeyId",
    "privacyAcknowledgedAt",
    "privacyVersion",
    "proofVersion",
    "purpose",
    "termsAcceptedAt",
    "termsVersion",
    "version",
  ];
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expected);
}

export function programmeAccessSigningSecret(
  environment: { BETTER_AUTH_SECRET?: string } = process.env as { BETTER_AUTH_SECRET?: string },
) {
  const secret = environment.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new Error("Programme access signing is not configured");
  return secret;
}

export function issueProgrammeAccessProof({
  journeyId,
  secret,
  now = Date.now(),
}: {
  journeyId: string;
  secret: string;
  now?: number;
}): ProgrammeAccessAuthority {
  if (!OPAQUE_JOURNEY_ID.test(journeyId)) throw new Error("An exact opaque Programme journey is required");
  if (!Number.isSafeInteger(now) || now < 0) throw new Error("A valid issuance time is required");
  if (!secret.trim()) throw new Error("Programme access signing is not configured");

  const claims: ProgrammeAccessProofClaims = {
    proofVersion: PROGRAMME_AUTH_ACCESS_PROOF_VERSION,
    version: PROGRAMME_ACCESS_VERSION,
    intent: PROGRAMME_ACCESS_INTENT,
    purpose: PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE,
    journeyId,
    createdAt: now,
    expiresAt: now + PROGRAMME_ACCESS_TTL_MS,
    termsVersion: PROGRAMME_TERMS_VERSION,
    privacyVersion: PROGRAMME_PRIVACY_VERSION,
    adultConfirmedAt: now,
    termsAcceptedAt: now,
    privacyAcknowledgedAt: now,
  };
  const encodedClaims = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const proof = `${TOKEN_PREFIX}.${encodedClaims}.${signatureFor(encodedClaims, secret).toString("base64url")}`;
  const { proofVersion: _proofVersion, ...authority } = claims;
  return { ...authority, proof };
}

export function verifyProgrammeAccessProof({
  proof,
  journeyId,
  secret,
  now = Date.now(),
}: {
  proof: string | null;
  journeyId: string | null;
  secret: string;
  now?: number;
}): { ok: true; authority: ProgrammeAccessAuthority } | { ok: false; reason: ProgrammeAccessProofFailure } {
  if (
    !proof
    || proof.length > MAX_PROOF_LENGTH
    || !journeyId
    || !OPAQUE_JOURNEY_ID.test(journeyId)
    || !secret.trim()
  ) return { ok: false, reason: "malformed" };

  const parts = proof.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX || !BASE64URL.test(parts[1]) || !BASE64URL.test(parts[2])) {
    return { ok: false, reason: "malformed" };
  }

  const suppliedSignature = Buffer.from(parts[2], "base64url");
  const expectedSignature = signatureFor(parts[1], secret);
  if (suppliedSignature.length !== expectedSignature.length || !timingSafeEqual(suppliedSignature, expectedSignature)) {
    return { ok: false, reason: "signature" };
  }

  let claims: Record<string, unknown>;
  try {
    const value = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value) || !exactClaimKeys(value)) {
      return { ok: false, reason: "malformed" };
    }
    claims = value;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (claims.proofVersion !== PROGRAMME_AUTH_ACCESS_PROOF_VERSION || claims.version !== PROGRAMME_ACCESS_VERSION) {
    return { ok: false, reason: "version" };
  }
  if (claims.intent !== PROGRAMME_ACCESS_INTENT) return { ok: false, reason: "intent" };
  if (claims.purpose !== PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE) return { ok: false, reason: "purpose" };
  if (claims.journeyId !== journeyId) return { ok: false, reason: "journey" };
  if (claims.termsVersion !== PROGRAMME_TERMS_VERSION || claims.privacyVersion !== PROGRAMME_PRIVACY_VERSION) {
    return { ok: false, reason: "copy" };
  }

  const createdAt = claims.createdAt;
  const expiresAt = claims.expiresAt;
  if (
    typeof createdAt !== "number"
    || !Number.isSafeInteger(createdAt)
    || typeof expiresAt !== "number"
    || !Number.isSafeInteger(expiresAt)
    || createdAt > now
    || expiresAt <= now
    || expiresAt - createdAt !== PROGRAMME_ACCESS_TTL_MS
    || claims.adultConfirmedAt !== createdAt
    || claims.termsAcceptedAt !== createdAt
    || claims.privacyAcknowledgedAt !== createdAt
  ) return { ok: false, reason: "time" };

  const authority: ProgrammeAccessAuthority = {
    version: PROGRAMME_ACCESS_VERSION,
    intent: PROGRAMME_ACCESS_INTENT,
    purpose: PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE,
    journeyId,
    createdAt,
    expiresAt,
    termsVersion: PROGRAMME_TERMS_VERSION,
    privacyVersion: PROGRAMME_PRIVACY_VERSION,
    adultConfirmedAt: createdAt,
    termsAcceptedAt: createdAt,
    privacyAcknowledgedAt: createdAt,
    proof,
  };
  return { ok: true, authority };
}
