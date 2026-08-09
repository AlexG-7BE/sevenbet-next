import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";

import { buildDataSubjectDeletionPlan, collectDataSubjectExport, executeDataSubjectDeletion } from "../lib/privacy/data-subject";
import { assertPrivacyDeletionAuthority, parsePrivacyTargetEnvironment } from "../lib/privacy/deletion-confirmation";

type Row = Record<string, unknown>;

function matches(row: Row, where: Row = {}): boolean {
  if (Array.isArray(where.OR)) return where.OR.some((item) => matches(row, item as Row));
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return true;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const rule = value as Row;
      if (Array.isArray(rule.in)) return rule.in.includes(row[key]);
      if ("equals" in rule) return String(row[key]).toLowerCase() === String(rule.equals).toLowerCase();
    }
    return row[key] === value;
  });
}

function model(rows: Row[]) {
  return {
    count: async ({ where }: { where: Row }) => rows.filter((row) => matches(row, where)).length,
    findMany: async ({ where }: { where: Row }) => rows.filter((row) => matches(row, where)).map((row) => ({ ...row })),
    deleteMany: async ({ where }: { where: Row }) => {
      let count = 0;
      for (let index = rows.length - 1; index >= 0; index -= 1) if (matches(rows[index], where)) { rows.splice(index, 1); count += 1; }
      return { count };
    },
    updateMany: async ({ where, data }: { where: Row; data: Row }) => {
      let count = 0;
      for (const row of rows) if (matches(row, where)) { Object.assign(row, data); count += 1; }
      return { count };
    },
  };
}

function fakeDatabase() {
  const rows = {
    users: [{ id: "user-a", email: "a@example.test", adminUser: null }, { id: "user-b", email: "b@example.test", adminUser: null }] as Row[],
    enrollments: [{ id: "enrollment-a", userId: "user-a" }, { id: "enrollment-b", userId: "user-b" }] as Row[],
    sessions: [{ id: "session-a", userId: "user-a" }, { id: "session-b", userId: "user-b" }] as Row[],
    accounts: [{ id: "account-a", userId: "user-a" }, { id: "account-b", userId: "user-b" }] as Row[],
    enrollmentChildren: [{ id: "child-a", enrollmentId: "enrollment-a" }, { id: "child-b", enrollmentId: "enrollment-b" }] as Row[],
    xp: [{ id: "xp-a", userId: "user-a" }, { id: "xp-b", userId: "user-b" }] as Row[],
    achievements: [{ id: "achievement-a", userId: "user-a" }, { id: "achievement-b", userId: "user-b" }] as Row[],
    activeDays: [{ id: "day-a", userId: "user-a", enrollmentId: "enrollment-a" }, { id: "day-b", userId: "user-b", enrollmentId: "enrollment-b" }] as Row[],
    anonymousSessions: [
      { id: "anonymous-a", draft: { momentMap: "A-LEGACY-DRAFT-SENTINEL" } },
      { id: "anonymous-b", draft: { momentMap: "B-DRAFT-SENTINEL" } },
      { id: "anonymous-unconsumed", draft: { momentMap: "UNCONSUMED-DRAFT-SENTINEL" } },
    ] as Row[],
    claims: [
      { id: "claim-a", anonymousSessionId: "anonymous-a", consumedByUserId: "user-a", anonymousSession: { id: "anonymous-a", draft: { momentMap: "A-LEGACY-DRAFT-SENTINEL" } } },
      { id: "claim-b", anonymousSessionId: "anonymous-b", consumedByUserId: "user-b", anonymousSession: { id: "anonymous-b", draft: { momentMap: "B-DRAFT-SENTINEL" } } },
      { id: "claim-unconsumed", anonymousSessionId: "anonymous-unconsumed", consumedByUserId: null, anonymousSession: { id: "anonymous-unconsumed", draft: { momentMap: "UNCONSUMED-DRAFT-SENTINEL" } } },
    ] as Row[],
    verifications: [{ id: "verification-a", identifier: "a@example.test" }, { id: "verification-b", identifier: "b@example.test" }] as Row[],
    globalCasinos: [{ id: "editorial-casino", status: "PUBLISHED" }] as Row[],
  };
  const child = () => model(rows.enrollmentChildren);
  const database = {
    user: {
      findUnique: async ({ where, select }: { where: Row; select?: Row }) => {
        const user = rows.users.find((row) => matches(row, where));
        if (!user) return null;
        if (!select?.programEnrollments) return { ...user };
        const userId = String(user.id);
        const enrollments = rows.enrollments.filter((row) => row.userId === userId);
        const enrollmentIds = new Set(enrollments.map((row) => row.id));
        const children = rows.enrollmentChildren.filter((row) => enrollmentIds.has(row.enrollmentId));
        return {
          ...user,
          sessions: rows.sessions.filter((row) => row.userId === userId),
          accounts: rows.accounts.filter((row) => row.userId === userId),
          programEnrollments: enrollments.map((enrollment) => ({
            ...enrollment,
            progressEvents: children,
            reflections: children,
            missionProgress: children,
            momentMap: children,
            currentGoal: children,
            urgeLearningRecord: children,
            activeBoundary: children,
            activeDays: rows.activeDays.filter((row) => row.enrollmentId === enrollment.id),
          })),
          xpEvents: rows.xp.filter((row) => row.userId === userId),
          achievements: rows.achievements.filter((row) => row.userId === userId),
          consumedProgrammeClaims: rows.claims.filter((row) => row.consumedByUserId === userId),
          programmeActiveDays: rows.activeDays.filter((row) => row.userId === userId),
        };
      },
      delete: async ({ where }: { where: Row }) => {
        const index = rows.users.findIndex((row) => matches(row, where));
        if (index < 0) throw new Error("User not found");
        return rows.users.splice(index, 1)[0];
      },
    },
    programEnrollment: model(rows.enrollments),
    session: model(rows.sessions),
    account: model(rows.accounts),
    programProgressEvent: child(),
    programReflection: child(),
    programmeMissionProgress: child(),
    momentMap: child(),
    currentGoal: child(),
    urgeLearningRecord: child(),
    activeBoundary: child(),
    userXpEvent: model(rows.xp),
    userAchievement: model(rows.achievements),
    programmeActiveDay: model(rows.activeDays),
    pendingProgrammeClaim: model(rows.claims),
    anonymousProgrammeSession: model(rows.anonymousSessions),
    verification: model(rows.verifications),
    $transaction: async (operation: (transaction: unknown) => Promise<unknown>) => operation(database),
  };
  return { database: database as unknown as PrismaClient, rows };
}

test("deletion is dry-run by default at the service boundary and scopes exact User A", async () => {
  const { database, rows } = fakeDatabase();
  const exported = await collectDataSubjectExport(database, "user-a");
  const serializedExport = JSON.stringify(exported);
  assert.match(serializedExport, /user-a/);
  assert.match(serializedExport, /A-LEGACY-DRAFT-SENTINEL/);
  assert.doesNotMatch(serializedExport, /user-b|b@example\.test|B-DRAFT-SENTINEL/);

  const plan = await buildDataSubjectDeletionPlan(database, "user-a");
  assert.equal(plan?.counts.users, 1);
  assert.equal(plan?.counts.sessions, 1);
  assert.equal(plan?.counts.consumedClaims, 1);
  assert.equal(plan?.counts.linkedAnonymousSessions, 1);
  assert.equal(plan?.counts.legacyDraftBearingAnonymousSessions, 1);
  assert.equal(rows.users.length, 2, "planning must not mutate either user");

  await executeDataSubjectDeletion(database, "user-a");
  assert.deepEqual(rows.users.map((row) => row.id), ["user-b"]);
  assert.deepEqual(rows.sessions.map((row) => row.userId), ["user-b"]);
  assert.deepEqual(rows.accounts.map((row) => row.userId), ["user-b"]);
  assert.deepEqual(rows.enrollments.map((row) => row.userId), ["user-b"]);
  assert.deepEqual(rows.xp.map((row) => row.userId), ["user-b"]);
  assert.deepEqual(rows.achievements.map((row) => row.userId), ["user-b"]);
  assert.deepEqual(rows.activeDays.map((row) => row.userId), ["user-b"]);
  assert.deepEqual(rows.verifications.map((row) => row.identifier), ["b@example.test"]);
  assert.equal(rows.claims.find((row) => row.id === "claim-a"), undefined);
  assert.equal(rows.claims.find((row) => row.id === "claim-b")?.consumedByUserId, "user-b");
  assert.equal(rows.claims.find((row) => row.id === "claim-unconsumed")?.consumedByUserId, null);
  assert.deepEqual(rows.anonymousSessions.map((row) => row.id), ["anonymous-b", "anonymous-unconsumed"]);
  assert.match(JSON.stringify(rows.anonymousSessions), /B-DRAFT-SENTINEL|UNCONSUMED-DRAFT-SENTINEL/);
  assert.doesNotMatch(JSON.stringify(rows.anonymousSessions), /A-LEGACY-DRAFT-SENTINEL/);
  assert.deepEqual(rows.globalCasinos, [{ id: "editorial-casino", status: "PUBLISHED" }]);
});

test("destructive CLI confirmation is exact in every environment and doubled for Production", () => {
  const local = parsePrivacyTargetEnvironment("local");
  const preview = parsePrivacyTargetEnvironment("preview");
  const production = parsePrivacyTargetEnvironment("production");
  assert.doesNotThrow(() => assertPrivacyDeletionAuthority({ execute: false, environment: local, userId: "user-a" }));
  assert.throws(() => assertPrivacyDeletionAuthority({ execute: true, environment: local, userId: "user-a" }), /SEVENBET_PRIVACY_DELETE_CONFIRM/);
  assert.throws(() => assertPrivacyDeletionAuthority({ execute: true, environment: preview, userId: "user-a", generalConfirmation: "DELETE:user-b" }), /SEVENBET_PRIVACY_DELETE_CONFIRM/);
  assert.doesNotThrow(() => assertPrivacyDeletionAuthority({ execute: true, environment: preview, userId: "user-a", generalConfirmation: "DELETE:user-a" }));
  assert.throws(() => assertPrivacyDeletionAuthority({ execute: true, environment: production, userId: "user-a", generalConfirmation: "DELETE:user-a" }), /SEVENBET_PRIVACY_PRODUCTION_DELETE_CONFIRM/);
  assert.throws(() => assertPrivacyDeletionAuthority({ execute: true, environment: production, userId: "user-a", productionConfirmation: "DELETE:user-a" }), /SEVENBET_PRIVACY_DELETE_CONFIRM/);
  assert.doesNotThrow(() => assertPrivacyDeletionAuthority({ execute: true, environment: production, userId: "user-a", generalConfirmation: "DELETE:user-a", productionConfirmation: "DELETE:user-a" }));
  assert.throws(() => parsePrivacyTargetEnvironment(undefined), /--environment/);

  const cli = readFileSync("scripts/privacy-data-subject.ts", "utf8");
  assert.match(cli, /--output/);
  assert.match(cli, /--environment/);
  assert.match(cli, /O_EXCL/);
  assert.match(cli, /0o600/);
  assert.match(cli, /process\.argv\.includes\("--execute"\)/);
  assert.match(cli, /SEVENBET_PRIVACY_DELETE_CONFIRM/);
  assert.match(cli, /SEVENBET_PRIVACY_PRODUCTION_DELETE_CONFIRM/);
  assert.doesNotMatch(cli, /VERCEL_ENV|DATABASE_URL/);
  assert.doesNotMatch(cli, /console\.log|JSON\.stringify\(result\).*stdout/s);
});
