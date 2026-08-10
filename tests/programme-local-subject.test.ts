import assert from "node:assert/strict";
import test from "node:test";

import {
  anonymousProgrammeSubject,
  clearProgrammeAccessAuthority,
  clearProgrammeOAuthClaimMarker,
  hasProgrammeAccessAuthority,
  loadProgrammeSubjectContent,
  migrateClaimedJourneyToUser,
  programmeAccountCreationHeaders,
  programmeLocalStorageKeysForTests,
  readProgrammeAccessContinuation,
  readProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
  saveProgrammeSubjectContent,
  transitionProgrammeAccessToUser,
  userProgrammeSubject,
  writeProgrammeAccessContinuation,
  writeProgrammeOAuthClaimMarker,
} from "../lib/programme/local-subject-storage";
import {
  PROGRAMME_ACCESS_HEADER_VALUES,
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_INTENT,
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "../lib/programme/access-contract";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
  entries() { return [...this.values.entries()]; }
}

test("Programme local content and access authority remain isolated across User A and User B", () => {
  const storage = new MemoryStorage();
  const userA = userProgrammeSubject("user-a-id");
  const userB = userProgrammeSubject("user-b-id");
  const sentinelA = {
    momentMap: { situation: "A-MOMENT-SENTINEL" },
    goal: { action: "A-GOAL-SENTINEL" },
    urgeLearning: { earlySignalText: "A-URGE-SENTINEL" },
    activeBoundary: { ruleText: "A-BOUNDARY-SENTINEL" },
  };

  saveProgrammeSubjectContent(storage, userA, sentinelA);
  const journey = anonymousProgrammeSubject(storage);
  writeProgrammeAccessContinuation(storage, journey);
  transitionProgrammeAccessToUser(storage, journey, userA);
  const userBInitial = loadProgrammeSubjectContent<typeof sentinelA>(storage, userB);

  assert.deepEqual(userBInitial, {});
  assert.doesNotMatch(JSON.stringify(userBInitial), /A-(MOMENT|GOAL|URGE|BOUNDARY)-SENTINEL/);
  assert.equal(hasProgrammeAccessAuthority(storage, userA), true);
  assert.equal(hasProgrammeAccessAuthority(storage, userB), false, "User A access must not authorize User B");

  saveProgrammeSubjectContent(storage, userB, { ...sentinelA, momentMap: { situation: "B-MOMENT" } });
  assert.equal(loadProgrammeSubjectContent<typeof sentinelA>(storage, userA).momentMap?.situation, "A-MOMENT-SENTINEL");
});

test("access transition and exact claimed-content migration remain separate operations", () => {
  const storage = new MemoryStorage();
  storage.setItem(programmeLocalStorageKeysForTests.legacy[0], JSON.stringify({ momentMap: { situation: "LEGACY-GLOBAL-SENTINEL" } }));
  storage.setItem(programmeLocalStorageKeysForTests.legacy[1], "18-or-over");
  const journey = anonymousProgrammeSubject(storage);
  const claimant = userProgrammeSubject("claimant-user-id");
  const unrelated = userProgrammeSubject("unrelated-user-id");
  const content = { momentMap: { situation: "CLAIMED-JOURNEY-SENTINEL" } };
  saveProgrammeSubjectContent(storage, journey, content);
  writeProgrammeAccessContinuation(storage, journey);

  assert.equal(storage.getItem(programmeLocalStorageKeysForTests.legacy[0]), null);
  assert.equal(storage.getItem(programmeLocalStorageKeysForTests.legacy[1]), null);
  assert.deepEqual(loadProgrammeSubjectContent<typeof content>(storage, unrelated), {}, "ordinary sign-in must not migrate a journey");

  transitionProgrammeAccessToUser(storage, journey, claimant);
  migrateClaimedJourneyToUser<typeof content>(storage, journey, claimant);
  assert.equal(loadProgrammeSubjectContent<typeof content>(storage, claimant).momentMap?.situation, "CLAIMED-JOURNEY-SENTINEL");
  assert.equal(hasProgrammeAccessAuthority(storage, claimant), true);
  assert.deepEqual(loadProgrammeSubjectContent<typeof content>(storage, journey), {});
  assert.equal(hasProgrammeAccessAuthority(storage, journey), false);
  assert.equal(hasProgrammeAccessAuthority(storage, unrelated), false);
});

test("access continuation is versioned, bounded, current-journey-only and contains no private content", () => {
  const storage = new MemoryStorage();
  const journey = anonymousProgrammeSubject(storage);
  const now = Date.parse("2026-08-10T10:00:00.000Z");

  writeProgrammeAccessContinuation(storage, journey, now);
  const serialized = storage.getItem(programmeLocalStorageKeysForTests.accessContinuation) || "";
  const marker = readProgrammeAccessContinuation(storage, now + 1_000);

  assert.ok(marker);
  assert.equal(marker.intent, PROGRAMME_ACCESS_INTENT);
  assert.equal(marker.journeyId, journey.id);
  assert.equal(marker.termsVersion, PROGRAMME_TERMS_VERSION);
  assert.equal(marker.privacyVersion, PROGRAMME_PRIVACY_VERSION);
  assert.equal(marker.expiresAt - marker.createdAt, programmeLocalStorageKeysForTests.accessTtlMs);
  assert.doesNotMatch(serialized, /moment|goal|urge|boundary|self.?check|limit|health|email|google|token|affiliate/i);
  assert.deepEqual(programmeAccountCreationHeaders(storage, journey, now + 1_000), {
    [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
    [PROGRAMME_ACCESS_HEADERS.terms]: PROGRAMME_ACCESS_HEADER_VALUES.terms,
    [PROGRAMME_ACCESS_HEADERS.privacy]: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
  });
});

test("access continuation rejects expired, future, malformed, mismatched and obsolete-copy markers", () => {
  const now = Date.parse("2026-08-10T10:00:00.000Z");

  for (const scenario of ["expired", "future", "malformed", "mismatched", "obsolete"] as const) {
    const storage = new MemoryStorage();
    const journey = anonymousProgrammeSubject(storage);
    if (scenario === "malformed") {
      storage.setItem(programmeLocalStorageKeysForTests.accessContinuation, "{not-json");
    } else {
      writeProgrammeAccessContinuation(storage, journey, scenario === "future" ? now + 60_000 : now);
      if (scenario === "mismatched") storage.setItem(programmeLocalStorageKeysForTests.journeyPointer, crypto.randomUUID());
      if (scenario === "obsolete") {
        const marker = JSON.parse(storage.getItem(programmeLocalStorageKeysForTests.accessContinuation) || "{}");
        marker.termsVersion = "obsolete";
        storage.setItem(programmeLocalStorageKeysForTests.accessContinuation, JSON.stringify(marker));
      }
    }
    const readAt = scenario === "expired"
      ? now + programmeLocalStorageKeysForTests.accessTtlMs
      : now;
    assert.equal(readProgrammeAccessContinuation(storage, readAt), null, scenario);
    assert.equal(storage.getItem(programmeLocalStorageKeysForTests.accessContinuation), null, `${scenario} marker is removed`);
  }
});

test("sign-out rotation starts a new anonymous namespace without prior in-memory content", () => {
  const storage = new MemoryStorage();
  const before = anonymousProgrammeSubject(storage);
  saveProgrammeSubjectContent(storage, before, { momentMap: { situation: "SIGNED-IN-SUBJECT-SENTINEL" } });
  writeProgrammeAccessContinuation(storage, before);
  clearProgrammeAccessAuthority(storage, before);
  const after = rotateAnonymousProgrammeSubject(storage);
  assert.notEqual(after.id, before.id);
  assert.deepEqual(loadProgrammeSubjectContent(storage, after), {});
  assert.equal(hasProgrammeAccessAuthority(storage, after), false);
});

test("OAuth claim continuation stores only a bounded exact-journey marker", () => {
  const storage = new MemoryStorage();
  const journey = anonymousProgrammeSubject(storage);
  const now = Date.parse("2026-08-09T10:00:00.000Z");

  writeProgrammeOAuthClaimMarker(storage, journey, now);
  const serialized = storage.getItem(programmeLocalStorageKeysForTests.oauthClaimMarker) || "";

  assert.deepEqual(readProgrammeOAuthClaimMarker(storage, now + 1_000), journey);
  assert.match(serialized, /PROGRAMME_CLAIM_GOOGLE/);
  assert.match(serialized, new RegExp(journey.id));
  assert.doesNotMatch(serialized, /moment|cue|signal|boundary|reflection|email|token/i);

  clearProgrammeOAuthClaimMarker(storage);
  assert.equal(readProgrammeOAuthClaimMarker(storage, now + 2_000), null);
});

test("OAuth claim continuation rejects stale, future, malformed and mismatched markers", () => {
  const now = Date.parse("2026-08-09T10:00:00.000Z");

  for (const scenario of ["expired", "future", "malformed", "mismatched"] as const) {
    const storage = new MemoryStorage();
    const journey = anonymousProgrammeSubject(storage);
    if (scenario === "malformed") {
      storage.setItem(programmeLocalStorageKeysForTests.oauthClaimMarker, "{not-json");
    } else {
      writeProgrammeOAuthClaimMarker(
        storage,
        journey,
        scenario === "future" ? now + 60_000 : now,
      );
      if (scenario === "mismatched") storage.setItem(programmeLocalStorageKeysForTests.journeyPointer, crypto.randomUUID());
    }
    const readAt = scenario === "expired"
      ? now + programmeLocalStorageKeysForTests.oauthClaimMarkerTtlMs
      : now;
    assert.equal(readProgrammeOAuthClaimMarker(storage, readAt), null, scenario);
    assert.equal(storage.getItem(programmeLocalStorageKeysForTests.oauthClaimMarker), null, `${scenario} marker is removed`);
  }
});
