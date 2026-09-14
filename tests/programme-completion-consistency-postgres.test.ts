import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { founderOverview, programmeDashboard } from "../lib/analytics/dashboard.server";
import { ANALYTICS_ANONYMOUS_COOKIE, ANALYTICS_CONSENT_COOKIE } from "../lib/analytics/consent-contract";
import { signedAnalyticsConsent, signedAnalyticsUuid } from "../lib/analytics/identity.server";
import { analyticsRange } from "../lib/analytics/metrics";
import { observeProgrammeState } from "../lib/analytics/programme-observer.server";
import { recordServerAnalyticsEventBestEffort } from "../lib/analytics/service.server";
import { prisma } from "../lib/db/prisma";
import { campaignAudienceWhere } from "../lib/email/campaigns.server";
import { queueProgrammeReminders } from "../lib/email/service.server";
import { ProgrammeAiMissionsService } from "../lib/programme/application/programme-ai-missions.service";
import { CONTROL_PROGRAM_SLUG } from "../lib/programme/contract";
import { programmeUnitOfWork } from "../lib/programme/infrastructure/programme-unit-of-work";
import { actionTaskState, completionAwardKey, programAiMissionDefinition } from "../lib/programme/program-ai/mission-registry";

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.match(url.pathname, /(?:test|ci|disposable)/i);
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, name);
  else process.env[name] = value;
}

async function fixtureControlProgram(fixture: string) {
  const existing = await prisma.program.findUnique({
    where: { slug: CONTROL_PROGRAM_SLUG },
    include: {
      steps: { where: { archivedAt: null }, orderBy: { order: "asc" } },
      versions: true,
    },
  });
  if (existing) {
    const version = existing.versions.find((item) => item.version === existing.publishedVersion);
    assert.equal(existing.status, "PUBLISHED");
    assert.equal(existing.steps.length, 10);
    assert.equal(version?.status, "PUBLISHED");
    return { program: existing, steps: existing.steps, version: version!, created: false };
  }

  const program = await prisma.program.create({
    data: {
      slug: CONTROL_PROGRAM_SLUG,
      internalName: "Programme completion consistency fixture",
      title: "Programme completion consistency fixture",
      summary: "Disposable Programme completion consistency fixture",
      introduction: "Disposable Programme completion consistency fixture",
      estimatedTotalMinutes: 10,
      completionRules: [],
      publishedVersion: 1,
      status: "PUBLISHED",
      createdBy: "test:programme-completion-consistency",
      updatedBy: "test:programme-completion-consistency",
    },
  });
  const steps = await Promise.all(Array.from({ length: 10 }, (_, index) => prisma.programStep.create({
    data: {
      programId: program.id,
      slug: `programme-completion-${fixture}-${index + 1}`,
      title: `Mission ${index + 1}`,
      shortTitle: `Mission ${index + 1}`,
      description: "Disposable Programme completion consistency fixture",
      learningObjective: "Verify canonical completion",
      status: "PUBLISHED",
      order: index + 1,
      estimatedMinutes: 1,
      completionMessage: "Complete",
      practicalTakeaway: "Canonical completion is consistent",
      prerequisites: [],
      relatedGuideIds: [],
      relatedResourceIds: [],
      completionRules: [],
      createdBy: "test:programme-completion-consistency",
      updatedBy: "test:programme-completion-consistency",
    },
  })));
  const version = await prisma.programVersion.create({
    data: {
      programId: program.id,
      version: 1,
      status: "PUBLISHED",
      snapshot: {},
      createdBy: "test:programme-completion-consistency",
    },
  });
  return { program, steps, version, created: true };
}

test("real Mission 10 completion canonically closes the enrollment and every existing downstream", async () => {
  assertDisposablePostgres();
  const fixture = randomUUID();
  const userId = `programme-completion-${fixture}`;
  const replayUserId = `programme-completion-replay-${fixture}`;
  const completedAt = new Date("2001-06-02T03:04:05.678Z");
  const startedAt = new Date("2001-06-01T03:04:05.678Z");
  const analyticsSecret = `programme-completion-postgres-${fixture}`;
  const oldEnvironment = {
    ANALYTICS_SIGNING_SECRET: process.env.ANALYTICS_SIGNING_SECRET,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
    PROGRAMME_REMINDER_INACTIVITY_DAYS: process.env.PROGRAMME_REMINDER_INACTIVITY_DAYS,
    PROGRAM_AI_V1_ENABLED: process.env.PROGRAM_AI_V1_ENABLED,
  };
  process.env.ANALYTICS_SIGNING_SECRET = analyticsSecret;
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
  process.env.PROGRAMME_REMINDER_INACTIVITY_DAYS = "7";
  process.env.PROGRAM_AI_V1_ENABLED = "true";

  let programId: string | null = null;
  try {
    const { program, steps, version, created } = await fixtureControlProgram(fixture);
    if (created) programId = program.id;
    await prisma.user.createMany({
      data: [userId, replayUserId].map((id) => ({
        id,
        name: "Programme completion consistency fixture",
        email: `${id}@example.invalid`,
        emailVerified: true,
        lastSeenAt: startedAt,
        createdAt: startedAt,
      })),
    });
    await prisma.customerEmailPreference.create({
      data: { userId, marketingAllowed: true, consentedAt: startedAt },
    });
    const [enrollment, replayEnrollment] = await Promise.all([userId, replayUserId].map((id) => prisma.programEnrollment.create({
      data: {
        userId: id,
        programId: program.id,
        programVersionId: version.id,
        currentStepId: steps[9]!.id,
        startedAt,
        timezone: "UTC",
      },
    })));
    const missionTen = programAiMissionDefinition(10)!;
    const taskStates = missionTen.actions.map((action) => actionTaskState(10, action.id));
    await prisma.programmeMissionProgress.createMany({
      data: [
        { enrollmentId: enrollment.id, missionNumber: 9, status: "COMPLETED", taskStates: [], completedAt: startedAt },
        { enrollmentId: enrollment.id, missionNumber: 10, status: "IN_PROGRESS", taskStates },
        { enrollmentId: replayEnrollment.id, missionNumber: 9, status: "COMPLETED", taskStates: [], completedAt: startedAt },
        { enrollmentId: replayEnrollment.id, missionNumber: 10, status: "COMPLETED", taskStates, completedAt },
      ],
    });

    const service = new ProgrammeAiMissionsService(programmeUnitOfWork);
    const result = await service.complete(userId, 10, completedAt);
    assert.equal(result.xpAwarded, 25);
    const [storedEnrollment, storedMission] = await Promise.all([
      prisma.programEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } }),
      prisma.programmeMissionProgress.findUniqueOrThrow({
        where: { enrollmentId_missionNumber: { enrollmentId: enrollment.id, missionNumber: 10 } },
      }),
    ]);
    assert.equal(storedMission.status, "COMPLETED");
    assert.equal(storedMission.completedAt?.toISOString(), completedAt.toISOString());
    assert.equal(storedEnrollment.completedAt?.toISOString(), storedMission.completedAt?.toISOString());

    const countsBeforeReplay = await Promise.all([
      prisma.userXpEvent.count({ where: { userId, awardKey: completionAwardKey(10) } }),
      prisma.programProgressEvent.count({ where: { enrollmentId: enrollment.id } }),
      prisma.programmeActiveDay.count({ where: { enrollmentId: enrollment.id } }),
    ]);
    assert.deepEqual(countsBeforeReplay, [1, 1, 1]);
    const replay = await service.complete(userId, 10, new Date("2001-06-03T04:05:06.789Z"));
    assert.equal(replay.xpAwarded, 0);
    assert.deepEqual(await Promise.all([
      prisma.userXpEvent.count({ where: { userId, awardKey: completionAwardKey(10) } }),
      prisma.programProgressEvent.count({ where: { enrollmentId: enrollment.id } }),
      prisma.programmeActiveDay.count({ where: { enrollmentId: enrollment.id } }),
    ]), countsBeforeReplay);
    assert.equal((await prisma.programEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).completedAt?.toISOString(), completedAt.toISOString());

    const repairReplay = await service.complete(replayUserId, 10, new Date("2001-07-01T00:00:00.000Z"));
    assert.equal(repairReplay.xpAwarded, 0);
    assert.equal((await prisma.programEnrollment.findUniqueOrThrow({ where: { id: replayEnrollment.id } })).completedAt?.toISOString(), completedAt.toISOString());
    assert.equal(await prisma.userXpEvent.count({ where: { userId: replayUserId } }), 0);
    assert.equal(await prisma.programProgressEvent.count({ where: { enrollmentId: replayEnrollment.id } }), 0);

    const anonymousId = randomUUID();
    const headers = new Headers({
      cookie: `${ANALYTICS_CONSENT_COOKIE}=${signedAnalyticsConsent("granted", analyticsSecret)}; ${ANALYTICS_ANONYMOUS_COOKIE}=${signedAnalyticsUuid(anonymousId, analyticsSecret)}`,
      "user-agent": "Programme completion consistency integration",
    });
    assert.equal((await observeProgrammeState(userId, headers)).observed, true);
    assert.equal((await observeProgrammeState(userId, headers)).observed, true);
    const completionEvent = await prisma.analyticsEvent.findUniqueOrThrow({
      where: { dedupeKey: `programme:${enrollment.id}:completed` },
    });
    assert.equal(completionEvent.occurredAt.toISOString(), completedAt.toISOString());
    assert.equal(await prisma.analyticsEvent.count({
      where: { dedupeKey: `programme:${enrollment.id}:completed` },
    }), 1);

    const range = analyticsRange({ range: "custom", from: "2001-06-01", to: "2001-06-03" }, completedAt);
    const [founder, programme] = await Promise.all([founderOverview(range), programmeDashboard(range)]);
    assert.equal(founder.programmeStarts, 2);
    assert.equal(founder.programmeCompletions, 2);
    assert.equal(programme.starts, 2);
    assert.equal(programme.completions, 2);
    assert.equal(programme.steps[9]?.completed, 2);

    const completedAudience = campaignAudienceWhere({
      locale: null,
      countryCode: null,
      programmeSegment: "COMPLETED",
      inactiveDays: null,
      newUsersOnly: false,
    });
    const incompleteAudience = campaignAudienceWhere({
      locale: null,
      countryCode: null,
      programmeSegment: "NOT_COMPLETED",
      inactiveDays: null,
      newUsersOnly: false,
    });
    assert.equal(await prisma.user.count({ where: { AND: [{ id: userId }, completedAudience] } }), 1);
    assert.equal(await prisma.user.count({ where: { AND: [{ id: userId }, incompleteAudience] } }), 0);
    await queueProgrammeReminders();
    assert.equal(await prisma.emailMessage.count({ where: { userId, purpose: "PROGRAMME_REMINDER" } }), 0);

    assert.equal(await recordServerAnalyticsEventBestEffort({
      name: "programme_completed",
      dedupeKey: `programme:${enrollment.id}:forced-ingestion-failure`,
      occurredAt: completedAt,
      userId: `missing-${fixture}`,
    }), "failed");
    assert.equal((await prisma.programEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).completedAt?.toISOString(), completedAt.toISOString());
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [userId, replayUserId] } } }).catch(() => undefined);
    if (programId) await prisma.program.deleteMany({ where: { id: programId } }).catch(() => undefined);
    restoreEnvironment("ANALYTICS_SIGNING_SECRET", oldEnvironment.ANALYTICS_SIGNING_SECRET);
    restoreEnvironment("NEXT_PUBLIC_ANALYTICS_ENABLED", oldEnvironment.NEXT_PUBLIC_ANALYTICS_ENABLED);
    restoreEnvironment("PROGRAMME_REMINDER_INACTIVITY_DAYS", oldEnvironment.PROGRAMME_REMINDER_INACTIVITY_DAYS);
    restoreEnvironment("PROGRAM_AI_V1_ENABLED", oldEnvironment.PROGRAM_AI_V1_ENABLED);
  }
});

test.after(async () => {
  await prisma.$disconnect();
});
