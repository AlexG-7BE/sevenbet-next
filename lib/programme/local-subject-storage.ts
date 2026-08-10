import {
  PROGRAMME_ACCESS_INTENT,
  PROGRAMME_ACCESS_TTL_MS,
  PROGRAMME_ACCESS_VERSION,
  PROGRAMME_AUTH_ACCESS_HEADERS,
  PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE,
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
  type ProgrammeAccessAuthority,
} from "@/lib/programme/access-contract";

export type ProgrammeLocalSubject =
  | { kind: "journey"; id: string }
  | { kind: "user"; id: string };

type SessionStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const JOURNEY_POINTER_KEY = "sevenbet.programme.journey.v2";
const CONTENT_KEY_PREFIX = "sevenbet.programme.local-content.v2";
const ACCESS_CONTINUATION_KEY = "sevenbet.programme.access-continuation.v1";
const USER_ACCESS_KEY_PREFIX = "sevenbet.programme.access-authority.v1";
const OAUTH_CLAIM_MARKER_KEY = "sevenbet.programme.oauth-claim.v1";
const LEGACY_KEYS = ["sevenbet.programme.local-content.v1", "sevenbet.age-attestation.v1"] as const;
const OAUTH_CLAIM_MARKER_VERSION = 1;
const OAUTH_CLAIM_MARKER_TTL_MS = 10 * 60 * 1000;
const OAUTH_CLAIM_INTENT = "PROGRAMME_CLAIM_GOOGLE";
// Client parsing is a UX guard, not proof verification. This narrow allowance
// covers ordinary browser/server wall-clock drift without extending expiry.
const PROGRAMME_ACCESS_CLIENT_CLOCK_SKEW_MS = 5 * 60 * 1000;
const OPAQUE_JOURNEY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProgrammeOAuthClaimMarker = {
  version: 1;
  intent: typeof OAUTH_CLAIM_INTENT;
  journeyId: string;
  createdAt: number;
  expiresAt: number;
};

type ProgrammeAccessMarker = ProgrammeAccessAuthority;

function subjectKey(prefix: string, subject: ProgrammeLocalSubject) {
  return `${prefix}:${subject.kind}:${encodeURIComponent(subject.id)}`;
}

function newOpaqueJourneyId() {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("Secure anonymous Programme journey IDs are unavailable");
  }
  return globalThis.crypto.randomUUID();
}

function removeLegacyGlobalBuckets(storage: SessionStorageLike) {
  for (const key of LEGACY_KEYS) storage.removeItem(key);
}

export function userProgrammeSubject(userId: string): ProgrammeLocalSubject {
  const id = userId.trim();
  if (!id) throw new Error("An authenticated Programme subject requires an exact user ID");
  return { kind: "user", id };
}

export function anonymousProgrammeSubject(storage: SessionStorageLike): ProgrammeLocalSubject {
  removeLegacyGlobalBuckets(storage);
  const existing = storage.getItem(JOURNEY_POINTER_KEY);
  if (existing && OPAQUE_JOURNEY_ID.test(existing)) return { kind: "journey", id: existing };
  const id = newOpaqueJourneyId();
  storage.setItem(JOURNEY_POINTER_KEY, id);
  return { kind: "journey", id };
}

export function rotateAnonymousProgrammeSubject(storage: SessionStorageLike): ProgrammeLocalSubject {
  storage.removeItem(JOURNEY_POINTER_KEY);
  return anonymousProgrammeSubject(storage);
}

export function programmeSubjectsEqual(left: ProgrammeLocalSubject | null, right: ProgrammeLocalSubject | null) {
  return Boolean(left && right && left.kind === right.kind && left.id === right.id);
}

export function loadProgrammeSubjectContent<T extends object>(storage: SessionStorageLike, subject: ProgrammeLocalSubject): Partial<T> {
  removeLegacyGlobalBuckets(storage);
  try {
    const value = JSON.parse(storage.getItem(subjectKey(CONTENT_KEY_PREFIX, subject)) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Partial<T> : {};
  } catch {
    return {};
  }
}

export function saveProgrammeSubjectContent<T extends object>(storage: SessionStorageLike, subject: ProgrammeLocalSubject, value: T) {
  storage.setItem(subjectKey(CONTENT_KEY_PREFIX, subject), JSON.stringify(value));
}

export function clearProgrammeSubjectContent(storage: SessionStorageLike, subject: ProgrammeLocalSubject) {
  storage.removeItem(subjectKey(CONTENT_KEY_PREFIX, subject));
}

function parseProgrammeAccessMarker(raw: string | null, now: number) {
  if (!raw) return null;
  try {
    const marker = JSON.parse(raw) as Partial<ProgrammeAccessMarker>;
    const valid = marker.version === PROGRAMME_ACCESS_VERSION
      && marker.intent === PROGRAMME_ACCESS_INTENT
      && marker.purpose === PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE
      && typeof marker.journeyId === "string"
      && OPAQUE_JOURNEY_ID.test(marker.journeyId)
      && typeof marker.createdAt === "number"
      && Number.isSafeInteger(marker.createdAt)
      && typeof marker.expiresAt === "number"
      && Number.isSafeInteger(marker.expiresAt)
      && marker.createdAt <= now + PROGRAMME_ACCESS_CLIENT_CLOCK_SKEW_MS
      && marker.expiresAt > now
      && marker.expiresAt - marker.createdAt === PROGRAMME_ACCESS_TTL_MS
      && marker.termsVersion === PROGRAMME_TERMS_VERSION
      && marker.privacyVersion === PROGRAMME_PRIVACY_VERSION
      && marker.adultConfirmedAt === marker.createdAt
      && marker.termsAcceptedAt === marker.createdAt
      && marker.privacyAcknowledgedAt === marker.createdAt
      && typeof marker.proof === "string"
      && /^pa1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(marker.proof)
      && marker.proof.length <= 4096;
    return valid ? marker as ProgrammeAccessMarker : null;
  } catch {
    return null;
  }
}

export function writeProgrammeAccessContinuation(
  storage: SessionStorageLike,
  subject: ProgrammeLocalSubject,
  authority: ProgrammeAccessAuthority,
  now = Date.now(),
) {
  if (subject.kind !== "journey" || !OPAQUE_JOURNEY_ID.test(subject.id)) {
    throw new Error("Programme access continuation requires an exact anonymous journey");
  }
  if (storage.getItem(JOURNEY_POINTER_KEY) !== subject.id) {
    throw new Error("Programme access continuation requires the current anonymous journey");
  }
  const marker = parseProgrammeAccessMarker(JSON.stringify(authority), now);
  if (!marker || marker.journeyId !== subject.id) {
    throw new Error("Programme access continuation requires current server authority for the exact journey");
  }
  storage.setItem(ACCESS_CONTINUATION_KEY, JSON.stringify(marker));
  return marker;
}

export function clearProgrammeAccessContinuation(storage: SessionStorageLike) {
  storage.removeItem(ACCESS_CONTINUATION_KEY);
}

export function readProgrammeAccessContinuation(storage: SessionStorageLike, now = Date.now()) {
  const marker = parseProgrammeAccessMarker(storage.getItem(ACCESS_CONTINUATION_KEY), now);
  if (!marker || storage.getItem(JOURNEY_POINTER_KEY) !== marker.journeyId) {
    clearProgrammeAccessContinuation(storage);
    return null;
  }
  return marker;
}

function readUserProgrammeAccess(storage: SessionStorageLike, subject: ProgrammeLocalSubject, now: number) {
  if (subject.kind !== "user") return null;
  const key = subjectKey(USER_ACCESS_KEY_PREFIX, subject);
  const marker = parseProgrammeAccessMarker(storage.getItem(key), now);
  if (!marker) storage.removeItem(key);
  return marker;
}

export function hasProgrammeAccessAuthority(
  storage: SessionStorageLike,
  subject: ProgrammeLocalSubject,
  now = Date.now(),
) {
  removeLegacyGlobalBuckets(storage);
  if (subject.kind === "journey") {
    const marker = readProgrammeAccessContinuation(storage, now);
    return marker?.journeyId === subject.id;
  }
  return Boolean(readUserProgrammeAccess(storage, subject, now));
}

export function programmeAccessExpiresAt(
  storage: SessionStorageLike,
  subject: ProgrammeLocalSubject,
  now = Date.now(),
) {
  const marker = subject.kind === "journey"
    ? readProgrammeAccessContinuation(storage, now)
    : readUserProgrammeAccess(storage, subject, now);
  return marker?.expiresAt ?? null;
}

export function programmeAuthAccessHeaders(
  storage: SessionStorageLike,
  subject: ProgrammeLocalSubject,
  now = Date.now(),
): Record<string, string> {
  if (!hasProgrammeAccessAuthority(storage, subject, now)) return {};
  const marker = subject.kind === "journey"
    ? readProgrammeAccessContinuation(storage, now)
    : readUserProgrammeAccess(storage, subject, now);
  if (!marker) return {};
  return {
    [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: marker.proof,
    [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: marker.journeyId,
  };
}

export function transitionProgrammeAccessToUser(
  storage: SessionStorageLike,
  journey: ProgrammeLocalSubject,
  user: ProgrammeLocalSubject,
  now = Date.now(),
) {
  if (journey.kind !== "journey" || user.kind !== "user") {
    throw new Error("Programme access can transition only from an exact journey to an exact user");
  }
  const marker = readProgrammeAccessContinuation(storage, now);
  if (!marker || marker.journeyId !== journey.id) {
    throw new Error("Programme access continuation is missing, expired or mismatched");
  }
  storage.setItem(subjectKey(USER_ACCESS_KEY_PREFIX, user), JSON.stringify(marker));
  clearProgrammeAccessContinuation(storage);
  if (storage.getItem(JOURNEY_POINTER_KEY) === journey.id) storage.removeItem(JOURNEY_POINTER_KEY);
  return marker;
}

export function clearProgrammeAccessAuthority(storage: SessionStorageLike, subject: ProgrammeLocalSubject) {
  if (subject.kind === "journey") {
    const marker = readProgrammeAccessContinuation(storage);
    if (!marker || marker.journeyId === subject.id) clearProgrammeAccessContinuation(storage);
    return;
  }
  storage.removeItem(subjectKey(USER_ACCESS_KEY_PREFIX, subject));
}

export function writeProgrammeOAuthClaimMarker(
  storage: SessionStorageLike,
  subject: ProgrammeLocalSubject,
  now = Date.now(),
) {
  if (subject.kind !== "journey" || !OPAQUE_JOURNEY_ID.test(subject.id)) {
    throw new Error("OAuth claim continuation requires an exact anonymous journey");
  }
  const marker: ProgrammeOAuthClaimMarker = {
    version: OAUTH_CLAIM_MARKER_VERSION,
    intent: OAUTH_CLAIM_INTENT,
    journeyId: subject.id,
    createdAt: now,
    expiresAt: now + OAUTH_CLAIM_MARKER_TTL_MS,
  };
  storage.setItem(OAUTH_CLAIM_MARKER_KEY, JSON.stringify(marker));
  return marker;
}

export function clearProgrammeOAuthClaimMarker(storage: SessionStorageLike) {
  storage.removeItem(OAUTH_CLAIM_MARKER_KEY);
}

export function readProgrammeOAuthClaimMarker(
  storage: SessionStorageLike,
  now = Date.now(),
): ProgrammeLocalSubject | null {
  try {
    const raw = storage.getItem(OAUTH_CLAIM_MARKER_KEY);
    if (!raw) return null;
    const marker = JSON.parse(raw) as Partial<ProgrammeOAuthClaimMarker>;
    const journeyId = typeof marker.journeyId === "string" ? marker.journeyId : null;
    const valid = marker.version === OAUTH_CLAIM_MARKER_VERSION
      && marker.intent === OAUTH_CLAIM_INTENT
      && Boolean(journeyId && OPAQUE_JOURNEY_ID.test(journeyId))
      && typeof marker.createdAt === "number"
      && Number.isFinite(marker.createdAt)
      && typeof marker.expiresAt === "number"
      && Number.isFinite(marker.expiresAt)
      && marker.createdAt <= now
      && marker.expiresAt > now
      && marker.expiresAt - marker.createdAt === OAUTH_CLAIM_MARKER_TTL_MS
      && storage.getItem(JOURNEY_POINTER_KEY) === journeyId;
    if (!valid || !journeyId) {
      clearProgrammeOAuthClaimMarker(storage);
      return null;
    }
    return { kind: "journey", id: journeyId };
  } catch {
    clearProgrammeOAuthClaimMarker(storage);
    return null;
  }
}

export function migrateClaimedJourneyToUser<T extends object>(
  storage: SessionStorageLike,
  journey: ProgrammeLocalSubject,
  user: ProgrammeLocalSubject,
): Partial<T> {
  if (journey.kind !== "journey" || user.kind !== "user") {
    throw new Error("Only an exact claimed anonymous journey can be migrated to an authenticated user");
  }
  const content = loadProgrammeSubjectContent<T>(storage, journey);
  if (Object.keys(content).length > 0) saveProgrammeSubjectContent(storage, user, content);
  clearProgrammeSubjectContent(storage, journey);
  if (storage.getItem(JOURNEY_POINTER_KEY) === journey.id) storage.removeItem(JOURNEY_POINTER_KEY);
  return content;
}

export const programmeLocalStorageKeysForTests = {
  journeyPointer: JOURNEY_POINTER_KEY,
  contentPrefix: CONTENT_KEY_PREFIX,
  accessContinuation: ACCESS_CONTINUATION_KEY,
  userAccessPrefix: USER_ACCESS_KEY_PREFIX,
  accessTtlMs: PROGRAMME_ACCESS_TTL_MS,
  accessClientClockSkewMs: PROGRAMME_ACCESS_CLIENT_CLOCK_SKEW_MS,
  oauthClaimMarker: OAUTH_CLAIM_MARKER_KEY,
  oauthClaimMarkerTtlMs: OAUTH_CLAIM_MARKER_TTL_MS,
  legacy: LEGACY_KEYS,
} as const;
