import assert from "node:assert/strict";
import test from "node:test";

import {
  anonymousProgrammeSubject,
  clearProgrammeOAuthClaimMarker,
  hasProgrammeAgeAttestation,
  loadProgrammeSubjectContent,
  migrateClaimedJourneyToUser,
  programmeLocalStorageKeysForTests,
  readProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
  saveProgrammeSubjectContent,
  setProgrammeAgeAttestation,
  userProgrammeSubject,
  writeProgrammeOAuthClaimMarker,
} from "../lib/programme/local-subject-storage";

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

test("Programme local content and age attestation remain isolated across User A and User B", () => {
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
  setProgrammeAgeAttestation(storage, userA);
  const userBInitial = loadProgrammeSubjectContent<typeof sentinelA>(storage, userB);

  assert.deepEqual(userBInitial, {});
  assert.doesNotMatch(JSON.stringify(userBInitial), /A-(MOMENT|GOAL|URGE|BOUNDARY)-SENTINEL/);
  assert.equal(hasProgrammeAgeAttestation(storage, userA), true);
  assert.equal(hasProgrammeAgeAttestation(storage, userB), false, "User A attestation must not authorize User B");

  saveProgrammeSubjectContent(storage, userB, { ...sentinelA, momentMap: { situation: "B-MOMENT" } });
  assert.equal(loadProgrammeSubjectContent<typeof sentinelA>(storage, userA).momentMap?.situation, "A-MOMENT-SENTINEL");
});

test("only the exact current claimed anonymous journey migrates, then its source is removed", () => {
  const storage = new MemoryStorage();
  storage.setItem(programmeLocalStorageKeysForTests.legacy[0], JSON.stringify({ momentMap: { situation: "LEGACY-GLOBAL-SENTINEL" } }));
  storage.setItem(programmeLocalStorageKeysForTests.legacy[1], "18-or-over");
  const journey = anonymousProgrammeSubject(storage);
  const claimant = userProgrammeSubject("claimant-user-id");
  const unrelated = userProgrammeSubject("unrelated-user-id");
  const content = { momentMap: { situation: "CLAIMED-JOURNEY-SENTINEL" } };
  saveProgrammeSubjectContent(storage, journey, content);
  setProgrammeAgeAttestation(storage, journey);

  assert.equal(storage.getItem(programmeLocalStorageKeysForTests.legacy[0]), null);
  assert.equal(storage.getItem(programmeLocalStorageKeysForTests.legacy[1]), null);
  assert.deepEqual(loadProgrammeSubjectContent<typeof content>(storage, unrelated), {}, "ordinary sign-in must not migrate a journey");

  migrateClaimedJourneyToUser<typeof content>(storage, journey, claimant);
  assert.equal(loadProgrammeSubjectContent<typeof content>(storage, claimant).momentMap?.situation, "CLAIMED-JOURNEY-SENTINEL");
  assert.equal(hasProgrammeAgeAttestation(storage, claimant), true);
  assert.deepEqual(loadProgrammeSubjectContent<typeof content>(storage, journey), {});
  assert.equal(hasProgrammeAgeAttestation(storage, journey), false);
});

test("sign-out rotation starts a new anonymous namespace without prior in-memory content", () => {
  const storage = new MemoryStorage();
  const before = anonymousProgrammeSubject(storage);
  saveProgrammeSubjectContent(storage, before, { momentMap: { situation: "SIGNED-IN-SUBJECT-SENTINEL" } });
  const after = rotateAnonymousProgrammeSubject(storage);
  assert.notEqual(after.id, before.id);
  assert.deepEqual(loadProgrammeSubjectContent(storage, after), {});
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
