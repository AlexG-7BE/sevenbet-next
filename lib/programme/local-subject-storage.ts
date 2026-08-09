export type ProgrammeLocalSubject =
  | { kind: "journey"; id: string }
  | { kind: "user"; id: string };

type SessionStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const JOURNEY_POINTER_KEY = "sevenbet.programme.journey.v2";
const CONTENT_KEY_PREFIX = "sevenbet.programme.local-content.v2";
const AGE_KEY_PREFIX = "sevenbet.age-attestation.v2";
const OAUTH_CLAIM_MARKER_KEY = "sevenbet.programme.oauth-claim.v1";
const LEGACY_KEYS = ["sevenbet.programme.local-content.v1", "sevenbet.age-attestation.v1"] as const;
const AGE_ATTESTATION_VALUE = "18-or-over";
const OAUTH_CLAIM_MARKER_VERSION = 1;
const OAUTH_CLAIM_MARKER_TTL_MS = 10 * 60 * 1000;
const OAUTH_CLAIM_INTENT = "PROGRAMME_CLAIM_GOOGLE";
const OPAQUE_JOURNEY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProgrammeOAuthClaimMarker = {
  version: 1;
  intent: typeof OAUTH_CLAIM_INTENT;
  journeyId: string;
  createdAt: number;
  expiresAt: number;
};

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

export function hasProgrammeAgeAttestation(storage: SessionStorageLike, subject: ProgrammeLocalSubject) {
  removeLegacyGlobalBuckets(storage);
  return storage.getItem(subjectKey(AGE_KEY_PREFIX, subject)) === AGE_ATTESTATION_VALUE;
}

export function setProgrammeAgeAttestation(storage: SessionStorageLike, subject: ProgrammeLocalSubject) {
  storage.setItem(subjectKey(AGE_KEY_PREFIX, subject), AGE_ATTESTATION_VALUE);
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
  if (hasProgrammeAgeAttestation(storage, journey)) setProgrammeAgeAttestation(storage, user);
  clearProgrammeSubjectContent(storage, journey);
  storage.removeItem(subjectKey(AGE_KEY_PREFIX, journey));
  if (storage.getItem(JOURNEY_POINTER_KEY) === journey.id) storage.removeItem(JOURNEY_POINTER_KEY);
  return content;
}

export const programmeLocalStorageKeysForTests = {
  journeyPointer: JOURNEY_POINTER_KEY,
  contentPrefix: CONTENT_KEY_PREFIX,
  agePrefix: AGE_KEY_PREFIX,
  oauthClaimMarker: OAUTH_CLAIM_MARKER_KEY,
  oauthClaimMarkerTtlMs: OAUTH_CLAIM_MARKER_TTL_MS,
  legacy: LEGACY_KEYS,
} as const;
