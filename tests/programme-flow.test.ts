import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { ProgrammeUnitOfWork } from "../lib/programme/infrastructure/programme-unit-of-work";
import {
  missionOneTaskStates,
  missionFourTaskStates,
  missionThreeTaskStates,
  missionTwoTaskStates,
} from "../lib/programme/contract";
import { programmeErrorResponse } from "../lib/programme/http";
import {
  PendingProgrammeClaimUnavailableError,
  ProgrammeDefinitionUnavailableError,
} from "../lib/programme/domain/programme-errors";
import {
  assertProgrammeRateLimit,
  resetProgrammeRateLimitsForTests,
} from "../lib/programme/rate-limit";
import { activeDayStreak, localDateAt } from "../lib/programme/security";
import { ValidationError } from "../lib/services/service-error";
import { ProgrammeFlowService } from "../lib/services/programme-flow.service";

type ProgrammeFlowRepository = ProgrammeUnitOfWork;
import { parseActiveBoundary } from "../lib/programme/validation";

const now = new Date("2026-08-04T10:00:00.000Z");
const programmeId = "10000000-0000-4000-8000-000000000001";
const versionId = "10000000-0000-4000-8000-000000000002";

function goal(sourceMomentMapId: string, base = now) {
  return {
    sourceMomentMapId,
    direction: "pause",
    reviewAt: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 7,
    status: "active",
  };
}

function urgeLearning(notNow = false) {
  return {
    evidenceReviewed: true,
    waveMomentsReviewed: ["cue", "early_signal", "urge_builds", "choice_point"],
    scenarioAnswer: "early_signal",
    signalChoice: notNow ? "not_now" : "local",
    meaningAnswer: "pause_information",
  };
}

function activeBoundary(base = now) {
  return {
    evidenceReviewed: true,
    category: "pause",
    triggerType: "saved_early_signal",
    limitValue: 30,
    executionMethod: "leave_action",
    reviewAt: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    scenarioAnswer: "concrete",
    strengthChecks: [
      "placed_before_pressure",
      "specific",
      "executable",
      "protected_from_in_moment_editing",
    ],
    status: "active",
  };
}

function cloneMemoryState<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map((item) => cloneMemoryState(item)) as T;
  if (value && typeof value === "object") {
    if (typeof (value as { toNumber?: unknown }).toNumber === "function") return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneMemoryState(item)]),
    ) as T;
  }
  return value;
}

class MemoryProgrammeRepository {
  private sequence = 10;
  private transactionQueue: Promise<void> = Promise.resolve();
  private failureStage: string | null = null;
  controlProgramAvailable = true;
  anonymousSessions: any[] = [];
  claims: any[] = [];
  enrollments: any[] = [];
  missions: any[] = [];
  momentMaps: any[] = [];
  goals: any[] = [];
  urgeRecords: any[] = [];
  boundaries: any[] = [];
  xpEvents: any[] = [];
  activeDays: any[] = [];
  unlocks: any[] = [];
  progressEvents: any[] = [];
  readonly sessions = this;
  readonly progress = this;
  readonly artefacts = this;
  readonly rewards = this;
  readonly dashboard = this;

  private id() {
    this.sequence += 1;
    return `10000000-0000-4000-8000-${String(this.sequence).padStart(12, "0")}`;
  }

  failNext(stage: string) {
    this.failureStage = stage;
  }

  private maybeFail(stage: string) {
    if (this.failureStage !== stage) return;
    this.failureStage = null;
    throw new Error(`Injected failure at ${stage}`);
  }

  transaction<T>(operation: (repository: any) => Promise<T>) {
    const run = this.transactionQueue.then(async () => {
      const snapshot = cloneMemoryState({
        sequence: this.sequence,
        anonymousSessions: this.anonymousSessions,
        claims: this.claims,
        enrollments: this.enrollments,
        missions: this.missions,
        momentMaps: this.momentMaps,
        goals: this.goals,
        urgeRecords: this.urgeRecords,
        boundaries: this.boundaries,
        xpEvents: this.xpEvents,
        activeDays: this.activeDays,
        unlocks: this.unlocks,
        progressEvents: this.progressEvents,
      });
      try {
        return await operation(this);
      } catch (error) {
        this.sequence = snapshot.sequence;
        this.anonymousSessions = snapshot.anonymousSessions;
        this.claims = snapshot.claims;
        this.enrollments = snapshot.enrollments;
        this.missions = snapshot.missions;
        this.momentMaps = snapshot.momentMaps;
        this.goals = snapshot.goals;
        this.urgeRecords = snapshot.urgeRecords;
        this.boundaries = snapshot.boundaries;
        this.xpEvents = snapshot.xpEvents;
        this.activeDays = snapshot.activeDays;
        this.unlocks = snapshot.unlocks;
        this.progressEvents = snapshot.progressEvents;
        throw error;
      }
    });
    this.transactionQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  serializable<T>(operation: (unitOfWork: ProgrammeUnitOfWork) => Promise<T>) {
    return this.transaction(() => operation(this as unknown as ProgrammeUnitOfWork));
  }

  snapshot<T>(operation: (unitOfWork: ProgrammeUnitOfWork) => Promise<T>) {
    return this.transaction(() => operation(this as unknown as ProgrammeUnitOfWork));
  }

  async createAnonymousSession(input: any) {
    const row = {
      id: this.id(),
      ...input,
      missionState: "NOT_STARTED",
      taskStates: [],
      draft: null,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.anonymousSessions.push(row);
    return row;
  }

  async findAnonymousSession(tokenHash: string) {
    const row = this.anonymousSessions.find((item) => item.tokenHash === tokenHash);
    return row ? { ...row, pendingClaim: this.claims.find((item) => item.anonymousSessionId === row.id) ?? null } : null;
  }

  async updateAnonymousSession(id: string, input: any) {
    const row = this.anonymousSessions.find((item) => item.id === id)!;
    Object.assign(row, input, { updatedAt: input.lastActivityAt });
    return row;
  }

  async transitionAnonymousSessionToRegistration(id: string, at: Date) {
    const row = this.anonymousSessions.find(
      (item) => item.id === id && item.missionState === "READY_TO_SAVE" && !item.deletedAt && item.expiresAt > at,
    );
    if (!row) return { count: 0 };
    Object.assign(row, { missionState: "REGISTRATION_REQUIRED", lastActivityAt: at });
    return { count: 1 };
  }

  async upsertPendingClaim(input: any) {
    let row = this.claims.find((item) => item.anonymousSessionId === input.anonymousSessionId);
    if (row) Object.assign(row, input, { consumedAt: null, consumedByUserId: null });
    else {
      row = { id: this.id(), ...input, consumedAt: null, consumedByUserId: null, createdAt: now };
      this.claims.push(row);
    }
    return row;
  }

  async findClaim(tokenHash: string) {
    const row = this.claims.find((item) => item.tokenHash === tokenHash);
    const anonymousSession = row && this.anonymousSessions.find((item) => item.id === row.anonymousSessionId);
    return row && anonymousSession ? { ...row, anonymousSession } : null;
  }

  async consumeClaim(id: string, userId: string, at: Date) {
    const row = this.claims.find((item) => item.id === id && !item.consumedAt && item.expiresAt > at);
    if (!row) return { count: 0 };
    Object.assign(row, { consumedAt: at, consumedByUserId: userId });
    return { count: 1 };
  }

  async completeAnonymousSession(id: string, at: Date) {
    const row = this.anonymousSessions.find((item) => item.id === id)!;
    Object.assign(row, { missionState: "COMPLETED", draft: null, deletedAt: at });
    return row;
  }

  async findControlProgram() {
    if (!this.controlProgramAvailable) return null;
    return {
      program: {
        id: programmeId,
        slug: "sevenbet-10-step-control-program",
        steps: Array.from({ length: 10 }, (_, index) => ({
          id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          order: index + 1,
        })),
      },
      version: { id: versionId, status: "PUBLISHED" },
    } as any;
  }

  async findEnrollment(userId: string, targetProgramId: string) {
    return this.enrollments.find((item) => item.userId === userId && item.programId === targetProgramId) ?? null;
  }

  async getOrCreateEnrollment(input: any) {
    const existing = await this.findEnrollment(input.userId, input.programId);
    if (existing) return existing;
    const row = { id: this.id(), startedAt: now, completedAt: null, ...input };
    this.enrollments.push(row);
    return row;
  }

  async setEnrollmentCurrentStep(enrollmentId: string, currentStepId: string) {
    const row = this.enrollments.find((item) => item.id === enrollmentId)!;
    row.currentStepId = currentStepId;
    return row;
  }

  async findMissionProgress(enrollmentId: string, missionNumber: number) {
    return this.missions.find((item) => item.enrollmentId === enrollmentId && item.missionNumber === missionNumber) ?? null;
  }

  async upsertMissionProgress(input: any) {
    let row = await this.findMissionProgress(input.enrollmentId, input.missionNumber);
    if (row) Object.assign(row, input, { updatedAt: input.completedAt ?? now });
    else {
      row = { id: this.id(), createdAt: now, updatedAt: now, ...input };
      this.missions.push(row);
    }
    return row;
  }

  async updateMissionDraftIfOpen(input: any) {
    const row = await this.findMissionProgress(input.enrollmentId, input.missionNumber);
    if (!row || row.status === "COMPLETED") return { count: 0 };
    Object.assign(row, input, { updatedAt: now });
    return { count: 1 };
  }

  async findMomentMap(enrollmentId: string) {
    return this.momentMaps.find((item) => item.enrollmentId === enrollmentId) ?? null;
  }

  async createMomentMap(input: any) {
    const row = { id: this.id(), createdAt: now, updatedAt: now, deletedAt: null, ...input };
    this.momentMaps.push(row);
    return row;
  }

  async updateMomentMap(id: string, data: any) {
    const row = this.momentMaps.find((item) => item.id === id)!;
    Object.assign(row, data, { updatedAt: new Date(now.getTime() + 1_000) });
    return row;
  }

  async eraseMomentMap(id: string, at: Date) {
    return this.updateMomentMap(id, {
      situation: "", cues: [], thoughtOrFeeling: "", response: "",
      immediateConsequence: "", noticeRule: "", neutralFlags: [], notSureFlags: [], deletedAt: at,
    });
  }

  async findCurrentGoal(enrollmentId: string) {
    return this.goals.find((item) => item.enrollmentId === enrollmentId) ?? null;
  }

  async upsertCurrentGoal(input: any) {
    let row = await this.findCurrentGoal(input.enrollmentId);
    if (row) Object.assign(row, input, { updatedAt: now, deletedAt: null });
    else {
      row = { id: this.id(), createdAt: now, updatedAt: now, deletedAt: null, ...input };
      this.goals.push(row);
    }
    return row;
  }

  async updateCurrentGoal(id: string, data: any) {
    const row = this.goals.find((item) => item.id === id)!;
    Object.assign(row, data, { updatedAt: new Date(now.getTime() + 1_000) });
    return row;
  }

  async eraseCurrentGoal(id: string, at: Date) {
    return this.updateCurrentGoal(id, {
      action: "", triggerOrSituation: "", alternativeAction: "",
      successSignal: "", confidenceAdjustment: "", deletedAt: at,
    });
  }

  async findUrgeLearningRecord(enrollmentId: string) {
    return this.urgeRecords.find((item) => item.enrollmentId === enrollmentId) ?? null;
  }

  async upsertUrgeLearningRecord(input: any) {
    let row = await this.findUrgeLearningRecord(input.enrollmentId);
    if (row) Object.assign(row, input, { updatedAt: now, deletedAt: null });
    else {
      row = { id: this.id(), createdAt: now, updatedAt: now, deletedAt: null, ...input };
      this.urgeRecords.push(row);
    }
    return row;
  }

  async updateUrgeLearningRecord(id: string, data: any) {
    const row = this.urgeRecords.find((item) => item.id === id)!;
    Object.assign(row, data, { updatedAt: new Date(now.getTime() + 1_000) });
    return row;
  }

  async eraseUrgeLearningRecord(id: string, at: Date) {
    return this.updateUrgeLearningRecord(id, {
      earlySignalCategory: null,
      earlySignalText: null,
      notNow: true,
      deletedAt: at,
    });
  }

  async findActiveBoundary(enrollmentId: string) {
    return this.boundaries.find((item) => item.enrollmentId === enrollmentId) ?? null;
  }

  async upsertActiveBoundary(input: any) {
    let row = await this.findActiveBoundary(input.enrollmentId);
    if (row) Object.assign(row, input, { updatedAt: now, deletedAt: null });
    else {
      row = { id: this.id(), createdAt: now, updatedAt: now, deletedAt: null, ...input };
      this.boundaries.push(row);
    }
    return row;
  }

  async updateActiveBoundary(id: string, data: any) {
    const row = this.boundaries.find((item) => item.id === id)!;
    Object.assign(row, data, { updatedAt: new Date(now.getTime() + 1_000) });
    return row;
  }

  async eraseActiveBoundary(id: string, at: Date) {
    return this.updateActiveBoundary(id, {
      triggerText: null,
      ruleText: "",
      limitValue: null,
      limitUnit: null,
      limitPeriod: null,
      executionDetail: null,
      copingAction: "",
      status: "RETIRED",
      deletedAt: at,
    });
  }

  async recordProgressEvent(input: any) {
    const existing = this.progressEvents.find(
      (item) => item.enrollmentId === input.enrollmentId && item.eventKey === input.eventKey,
    );
    if (existing) return { count: 0 };
    this.progressEvents.push({ id: this.id(), createdAt: now, ...input });
    return { count: 1 };
  }

  async recordMissionXp(input: any) {
    this.maybeFail("recordMissionXp");
    const existing = this.xpEvents.find((item) => item.userId === input.userId && item.awardKey === input.awardKey);
    if (existing) return { count: 0 };
    this.xpEvents.push({ id: this.id(), eventType: "MISSION_COMPLETION", createdAt: now, ...input });
    return { count: 1 };
  }

  async recordActiveDay(input: any) {
    this.maybeFail("recordActiveDay");
    const key = input.localDate.toISOString().slice(0, 10);
    const existing = this.activeDays.find(
      (item) => item.userId === input.userId && item.localDate.toISOString().slice(0, 10) === key,
    );
    if (existing) return { count: 0 };
    this.activeDays.push({ id: this.id(), createdAt: now, voidedAt: null, voidReason: null, ...input });
    return { count: 1 };
  }

  async findFirstPlanAchievement() {
    return { id: "30000000-0000-4000-8000-000000000001", slug: "first-plan" } as any;
  }

  async findBoundaryBuiltAchievement() {
    return { id: "30000000-0000-4000-8000-000000000002", slug: "boundary-built" } as any;
  }

  async findAchievement(slug: string) {
    return slug === "boundary-built"
      ? this.findBoundaryBuiltAchievement()
      : this.findFirstPlanAchievement();
  }

  async unlockAchievement(input: any) {
    this.maybeFail("unlockAchievement");
    if (this.unlocks.some((item) => item.userId === input.userId && item.awardKey === input.awardKey)) return { count: 0 };
    this.unlocks.push({
      id: this.id(),
      awardedAt: now,
      ...input,
      achievement: input.achievementId.endsWith("2")
        ? { id: input.achievementId, slug: "boundary-built", title: "Boundary Built" }
        : { id: input.achievementId, slug: "first-plan", title: "First Plan" },
    });
    return { count: 1 };
  }

  async voidActiveDay(input: any) {
    const row = this.activeDays.find(
      (item) => item.id === input.activeDayId && !item.voidedAt,
    );
    if (!row) return { count: 0 };
    Object.assign(row, {
      voidedAt: input.voidedAt,
      voidReason: input.reason,
      voidedByAdminId: input.adminUserId,
    });
    return { count: 1 };
  }

  async findDashboardData(userId: string, targetProgramId: string) {
    const enrollment = await this.findEnrollment(userId, targetProgramId);
    const aggregate = enrollment
      ? {
          ...enrollment,
          missionProgress: this.missions
            .filter((item) => item.enrollmentId === enrollment.id)
            .sort((a, b) => a.missionNumber - b.missionNumber),
          momentMap: await this.findMomentMap(enrollment.id),
          currentGoal: await this.findCurrentGoal(enrollment.id),
          urgeLearningRecord: await this.findUrgeLearningRecord(enrollment.id),
          activeBoundary: await this.findActiveBoundary(enrollment.id),
          activeDays: this.activeDays.filter((item) => item.enrollmentId === enrollment.id && !item.voidedAt),
        }
      : null;
    return [
      aggregate,
      this.xpEvents.filter((item) => item.userId === userId && item.programId === targetProgramId),
      this.unlocks.filter((item) => item.userId === userId),
    ] as any;
  }
}

async function startMissionOne(service: ProgrammeFlowService) {
  const created = await service.createAnonymousSession(now);
  await service.saveMissionOneDraft(created.token, {
    taskStates: [...missionOneTaskStates],
  }, now);
  const claim = await service.createPendingClaim(created.token, now);
  return { ...created, claim };
}

async function registeredFlow(completionDate = now) {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(service);
  const dashboard = await service.redeemPendingClaim("user-1", started.claim.claimToken, "Asia/Almaty", now);
  const mapId = dashboard.momentMap!.id;
  await service.saveMissionTwoDraft("user-1", {
    taskStates: [...missionTwoTaskStates],
    currentGoal: goal(mapId, completionDate),
  });
  return { repository, service, started, dashboard, mapId };
}

async function missionThreeFlow(completionDate = now) {
  const flow = await registeredFlow(completionDate);
  await flow.service.completeMissionTwo("user-1", completionDate);
  await flow.service.saveMissionThreeDraft("user-1", {
    taskStates: [...missionThreeTaskStates],
    urgeLearning: urgeLearning(),
  });
  return flow;
}

async function missionFourFlow(completionDate = now) {
  const flow = await missionThreeFlow(completionDate);
  await flow.service.completeMissionThree("user-1", completionDate);
  await flow.service.saveMissionFourDraft("user-1", {
    taskStates: [...missionFourTaskStates],
    activeBoundary: activeBoundary(completionDate),
  });
  return flow;
}

test("anonymous Mission 01 reaches registration_required without persistent XP", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(service);
  assert.equal(started.session.state, "not_started");
  assert.equal(repository.anonymousSessions[0].missionState, "REGISTRATION_REQUIRED");
  assert.equal(repository.xpEvents.length, 0);
});

test("anonymous autosave stores neutral continuity and concurrent claim creation has one winner", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const created = await service.createAnonymousSession(now);
  await service.saveMissionOneDraft(created.token, {
    taskStates: ["brief"],
  }, now);
  await service.saveMissionOneDraft(created.token, {
    taskStates: [...missionOneTaskStates],
  }, now);
  assert.deepEqual(repository.anonymousSessions[0].draft, { contentStorage: "browser_session" });
  assert.doesNotMatch(JSON.stringify(repository.anonymousSessions[0]), /After work|offer notification|felt more urgent/);
  const attempts = await Promise.allSettled([
    service.createPendingClaim(created.token, now),
    service.createPendingClaim(created.token, now),
  ]);
  assert.equal(attempts.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((item) => item.status === "rejected").length, 1);
  assert.equal(repository.claims.length, 1);
});

test("Mission 02 is unavailable without an authenticated enrollment", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  await assert.rejects(() => service.getMissionTwoDraft("anonymous"), /enrollment not found/i);
  const route = readFileSync("app/api/program/missions/02/route.ts", "utf8");
  assert.match(route, /requireCurrentUser\(request\.headers\)/);
});

test("claim redemption saves a neutral continuity marker, gives exactly 60 XP and is one-use", async () => {
  const { repository, service, started, dashboard } = await registeredFlow();
  assert.equal(dashboard.totalXp, 60);
  assert.equal(dashboard.momentMap?.noticeRule, "");
  assert.equal(repository.momentMaps[0].noticeRule, "[stored only in this browser session]");
  assert.equal(repository.xpEvents.length, 1);
  await assert.rejects(
    () => service.redeemPendingClaim("user-1", started.claim.claimToken, "Asia/Almaty", now),
    /already been used/i,
  );
  assert.equal(repository.xpEvents.length, 1);
  assert.equal(repository.momentMaps.length, 1);
});

test("invalid claims fail closed without creating persistent Programme state", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  await assert.rejects(
    () => service.redeemPendingClaim("user-1", "unknown-claim", "UTC", now),
    PendingProgrammeClaimUnavailableError,
  );
  assert.equal(repository.enrollments.length, 0);
  assert.equal(repository.momentMaps.length, 0);
  assert.equal(repository.xpEvents.length, 0);
});

test("claim and Programme availability use distinct safe error contracts", async () => {
  const missingClaimRepository = new MemoryProgrammeRepository();
  const missingClaimService = new ProgrammeFlowService(missingClaimRepository as unknown as ProgrammeFlowRepository);
  await assert.rejects(
    () => missingClaimService.redeemPendingClaim("user-1", "unknown-claim", "UTC", now),
    PendingProgrammeClaimUnavailableError,
  );

  const missingProgrammeRepository = new MemoryProgrammeRepository();
  const missingProgrammeService = new ProgrammeFlowService(missingProgrammeRepository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(missingProgrammeService);
  missingProgrammeRepository.controlProgramAvailable = false;
  await assert.rejects(
    () => missingProgrammeService.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", now),
    ProgrammeDefinitionUnavailableError,
  );
  assert.equal(missingProgrammeRepository.claims[0].consumedAt, null);
  assert.equal(missingProgrammeRepository.enrollments.length, 0);
  assert.equal(missingProgrammeRepository.xpEvents.length, 0);
});

test("failed Programme lookup can retry once with exactly-once claim, completion and XP", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(service);
  repository.controlProgramAvailable = false;
  await assert.rejects(
    () => service.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", now),
    ProgrammeDefinitionUnavailableError,
  );
  repository.controlProgramAvailable = true;
  const dashboard = await service.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", now);
  assert.equal(dashboard.totalXp, 60);
  assert.equal(repository.claims.filter((claim) => claim.consumedAt).length, 1);
  assert.equal(repository.missions.filter((mission) => mission.missionNumber === 1 && mission.status === "COMPLETED").length, 1);
  assert.equal(repository.xpEvents.length, 1);
  await assert.rejects(
    () => service.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", now),
    /already been used/i,
  );
  assert.equal(repository.xpEvents.length, 1);
});

test("one pending claim cannot be redeemed concurrently by two users", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(service);
  const attempts = await Promise.allSettled([
    service.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", now),
    service.redeemPendingClaim("user-2", started.claim.claimToken, "UTC", now),
  ]);
  assert.equal(attempts.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((item) => item.status === "rejected").length, 1);
  assert.equal(repository.enrollments.length, 1);
  assert.equal(repository.momentMaps.length, 1);
  assert.equal(repository.xpEvents.length, 1);
  assert.ok(["user-1", "user-2"].includes(repository.claims[0].consumedByUserId));
});

test("Mission 01 claim redemption rolls back claim, artefact and progress on failure", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(service);
  repository.failNext("recordActiveDay");
  await assert.rejects(
    () => service.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", now),
    /Injected failure at recordActiveDay/,
  );
  assert.equal(repository.claims[0].consumedAt, null);
  assert.equal(repository.enrollments.length, 0);
  assert.equal(repository.momentMaps.length, 0);
  assert.equal(repository.missions.length, 0);
  assert.equal(repository.xpEvents.length, 0);
  assert.equal(repository.activeDays.length, 0);
  assert.equal(repository.anonymousSessions[0].missionState, "REGISTRATION_REQUIRED");
  assert.ok(repository.anonymousSessions[0].draft);
});

test("Dashboard after Mission 01 has the approved state", async () => {
  const { dashboard } = await registeredFlow();
  assert.equal(dashboard.totalXp, 60);
  assert.equal(dashboard.currentMission, 2);
  assert.equal(dashboard.missions[0].status, "completed");
  assert.equal(dashboard.missions[1].status, "current");
  assert.equal(dashboard.activeDays, 1);
  assert.equal(dashboard.achievements[0].state, "locked");
  assert.equal(dashboard.missions.length, 10);
  assert.ok(dashboard.evidence.mission01.length > 0);
});

test("Mission 02 draft is owner-scoped and incomplete tasks cannot complete", async () => {
  const { repository, service, mapId } = await registeredFlow();
  const missionTwo = repository.missions.find((item) => item.missionNumber === 2)!;
  missionTwo.taskStates = [];
  missionTwo.draft = null;
  await service.saveMissionTwoDraft("user-1", {
    taskStates: missionTwoTaskStates.slice(0, 7),
    currentGoal: goal(mapId),
  });
  await assert.rejects(() => service.completeMissionTwo("user-1", now), /task states are incomplete/i);
  await assert.rejects(() => service.getMissionTwoDraft("user-2"), /enrollment not found/i);
  assert.equal(repository.xpEvents.length, 1);
});

test("Mission 02 remains locked until Mission 01 is completed", async () => {
  const { repository, service, mapId } = await registeredFlow();
  repository.missions.find((item) => item.missionNumber === 1)!.status = "IN_PROGRESS";
  await assert.rejects(
    () => service.saveMissionTwoDraft("user-1", {
      taskStates: [...missionTwoTaskStates],
      currentGoal: goal(mapId),
    }),
    /Mission 01 must be completed/i,
  );
});

test("Mission 02 completion awards 80 XP, First Plan and Mission 03 exactly once", async () => {
  const { repository, service } = await registeredFlow();
  const [first, retry] = await Promise.all([
    service.completeMissionTwo("user-1", now),
    service.completeMissionTwo("user-1", now),
  ]);
  assert.equal(first.totalXp, 140);
  assert.equal(retry.totalXp, 140);
  assert.equal(repository.xpEvents.length, 2);
  assert.equal(repository.xpEvents.reduce((sum, item) => sum + item.xp, 0), 140);
  assert.equal(first.achievements[0].state, "earned");
  assert.equal(first.currentMission, 3);
  assert.equal(first.missions[1].status, "completed");
  assert.equal(first.missions[2].status, "current");
});

test("Mission 02 completion rolls back goal, progression, XP and achievement together", async () => {
  const { repository, service } = await registeredFlow();
  repository.failNext("unlockAchievement");
  await assert.rejects(
    () => service.completeMissionTwo("user-1", now),
    /Injected failure at unlockAchievement/,
  );
  assert.equal(repository.goals.length, 0);
  assert.equal(repository.missions.find((item) => item.missionNumber === 2)?.status, "READY_TO_SAVE");
  assert.equal(repository.missions.some((item) => item.missionNumber === 3), false);
  assert.equal(repository.xpEvents.length, 1);
  assert.equal(repository.unlocks.length, 0);
  const dashboard = await service.completeMissionTwo("user-1", now);
  assert.equal(dashboard.totalXp, 140);
});

test("Mission 03 is authenticated, resumable and rejects incomplete learning checks", async () => {
  const { repository, service } = await registeredFlow();
  await service.completeMissionTwo("user-1", now);
  await service.saveMissionThreeDraft("user-1", {
    taskStates: missionThreeTaskStates.slice(0, 7),
    urgeLearning: { ...urgeLearning(), meaningAnswer: "proof_failure" },
  });
  await assert.rejects(
    () => service.completeMissionThree("user-1", now),
    /task states are incomplete/i,
  );
  const draft = await service.getMissionThreeDraft("user-1");
  assert.equal(draft.taskStates.length, 7);
  assert.equal(repository.xpEvents.length, 2);
  await assert.rejects(() => service.getMissionThreeDraft("user-2"), /enrollment not found/i);
  const route = readFileSync("app/api/program/missions/03/route.ts", "utf8");
  assert.match(route, /requireCurrentUser\(request\.headers\)/);
});

test("Mission 03 remains locked until Mission 02 is completed", async () => {
  const { service } = await registeredFlow();
  await assert.rejects(
    () => service.saveMissionThreeDraft("user-1", {
      taskStates: [...missionThreeTaskStates],
      urgeLearning: urgeLearning(),
    }),
    /Mission 02 must be completed/i,
  );
});

test("Mission 03 accepts empty unanswered checks during early autosave", async () => {
  const { service } = await registeredFlow();
  await service.completeMissionTwo("user-1", now);
  const saved = await service.saveMissionThreeDraft("user-1", {
    taskStates: ["brief"],
    urgeLearning: {
      evidenceReviewed: false,
      waveMomentsReviewed: [],
      scenarioAnswer: "",
      meaningAnswer: "",
    },
  });
  assert.deepEqual(saved.taskStates, ["brief"]);
  assert.equal(saved.status, "in_progress");
});

test("Mission 03 completion awards exactly 90 XP and makes Mission 04 current", async () => {
  const { repository, service } = await missionThreeFlow();
  const [first, retry] = await Promise.all([
    service.completeMissionThree("user-1", now),
    service.completeMissionThree("user-1", now),
  ]);
  assert.equal(first.totalXp, 230);
  assert.equal(retry.totalXp, 230);
  assert.equal(repository.xpEvents.length, 3);
  assert.equal(repository.xpEvents.reduce((sum, item) => sum + item.xp, 0), 230);
  assert.equal(first.currentMission, 4);
  assert.equal(first.missions[2].status, "completed");
  assert.equal(first.missions[3].status, "current");
  assert.equal(first.achievements[0].state, "earned");
  assert.equal(first.urgeLearningRecord?.earlySignalCategory, null);
  assert.equal(first.urgeLearningRecord?.earlySignalText, null);
  assert.ok(first.evidence.mission03.length >= 4);
});

test("Mission 03 completion rolls back learning record, progression and XP on failure", async () => {
  const { repository, service } = await missionThreeFlow();
  repository.failNext("recordActiveDay");
  await assert.rejects(
    () => service.completeMissionThree("user-1", now),
    /Injected failure at recordActiveDay/,
  );
  assert.equal(repository.urgeRecords.length, 0);
  assert.equal(repository.missions.find((item) => item.missionNumber === 3)?.status, "READY_TO_SAVE");
  assert.equal(repository.missions.some((item) => item.missionNumber === 4), false);
  assert.equal(repository.xpEvents.length, 2);
  const dashboard = await service.completeMissionThree("user-1", now);
  assert.equal(dashboard.totalXp, 230);
});

test("Mission 03 not-now path completes without compulsory personal disclosure", async () => {
  const flow = await registeredFlow();
  await flow.service.completeMissionTwo("user-1", now);
  await flow.service.saveMissionThreeDraft("user-1", {
    taskStates: [...missionThreeTaskStates],
    urgeLearning: urgeLearning(true),
  });
  const dashboard = await flow.service.completeMissionThree("user-1", now);
  assert.equal(dashboard.totalXp, 230);
  assert.equal(dashboard.urgeLearningRecord?.notNow, true);
  assert.equal(dashboard.urgeLearningRecord?.earlySignalCategory, null);
  assert.equal(dashboard.urgeLearningRecord?.earlySignalText, null);
});

test("Mission 03 signal continuity can be changed without accepting narrative", async () => {
  const { repository, service } = await missionThreeFlow();
  await service.completeMissionThree("user-1", now);
  const updated = await service.updateUrgeLearningRecord("user-1", {
    signalChoice: "local",
  });
  assert.equal(updated.earlySignalCategory, null);
  await assert.rejects(
    () => service.updateUrgeLearningRecord("user-1", { earlySignalText: "My shoulders tense", signalChoice: "local" }),
    /unsupported fields/i,
  );
  await service.deleteUrgeLearningRecord("user-1", now);
  assert.equal(repository.urgeRecords[0].earlySignalText, null);
  assert.ok(repository.urgeRecords[0].deletedAt);
  const dashboard = await service.getDashboard("user-1");
  assert.equal(dashboard.urgeLearningRecord, null);
  assert.equal(dashboard.currentMission, 4);
  assert.equal(dashboard.totalXp, 230);
});

test("Mission 04 is authenticated, resumable and requires all structure checks", async () => {
  const flow = await missionThreeFlow();
  await flow.service.completeMissionThree("user-1", now);
  await flow.service.saveMissionFourDraft("user-1", {
    taskStates: missionFourTaskStates.slice(0, 8),
    activeBoundary: {
      ...activeBoundary(),
      strengthChecks: ["placed_before_pressure", "specific"],
    },
  });
  await assert.rejects(
    () => flow.service.completeMissionFour("user-1", now),
    /task states are incomplete/i,
  );
  const draft = await flow.service.getMissionFourDraft("user-1");
  assert.equal(draft.taskStates.length, 8);
  assert.equal(flow.repository.xpEvents.length, 3);
  await assert.rejects(() => flow.service.getMissionFourDraft("user-2"), /enrollment not found/i);
  const route = readFileSync("app/api/program/missions/04/route.ts", "utf8");
  assert.match(route, /requireCurrentUser\(request\.headers\)/);
});

test("Mission 04 remains locked until Mission 03 is completed", async () => {
  const { service } = await missionThreeFlow();
  await assert.rejects(
    () => service.saveMissionFourDraft("user-1", {
      taskStates: [...missionFourTaskStates],
      activeBoundary: activeBoundary(),
    }),
    /Mission 03 must be completed/i,
  );
});

test("Mission 04 validation rejects unsupported or incomplete boundary structures", () => {
  assert.throws(
    () => parseActiveBoundary({ ...activeBoundary(), category: "unsupported" }, { complete: true, now }),
    /category is not supported/i,
  );
  assert.throws(() => parseActiveBoundary({ ...activeBoundary(), ruleText: "sensitive narrative" }, { complete: true, now }), /unsupported fields/i);
  assert.throws(() => parseActiveBoundary({ ...activeBoundary(), copingAction: "sensitive narrative" }, { complete: true, now }), /unsupported fields/i);
  assert.throws(
    () => parseActiveBoundary({ ...activeBoundary(), strengthChecks: ["specific"] }, { complete: true, now }),
    /Every boundary strength check is required/i,
  );
});

test("Mission 04 completion awards exactly 100 XP, Boundary Built and Mission 05", async () => {
  const { repository, service } = await missionFourFlow();
  const [first, retry] = await Promise.all([
    service.completeMissionFour("user-1", now),
    service.completeMissionFour("user-1", now),
  ]);
  assert.equal(first.totalXp, 330);
  assert.equal(retry.totalXp, 330);
  assert.equal(repository.xpEvents.length, 4);
  assert.equal(repository.xpEvents.reduce((sum, item) => sum + item.xp, 0), 330);
  assert.equal(first.currentMission, 5);
  assert.equal(first.missions[3].status, "completed");
  assert.equal(first.missions[4].status, "current");
  assert.equal(first.achievements.find((item) => item.slug === "boundary-built")?.state, "earned");
  assert.equal(first.activeBoundary?.category, "pause");
  assert.equal(first.activeBoundary?.limitValue, 30);
  assert.equal(first.activeBoundary?.triggerText, "");
  assert.equal(repository.boundaries[0].triggerText, "[stored only in this browser session]");
  assert.ok(first.evidence.mission04.length >= 4);
  assert.equal(first.activeDays, 1);
});

test("Mission 04 completion rolls back artefact and progression when reward persistence fails", async () => {
  const { repository, service } = await missionFourFlow();
  repository.failNext("recordMissionXp");
  await assert.rejects(
    () => service.completeMissionFour("user-1", now),
    /Injected failure at recordMissionXp/,
  );
  assert.equal(repository.boundaries.length, 0);
  assert.equal(repository.missions.find((item) => item.missionNumber === 4)?.status, "READY_TO_SAVE");
  assert.equal(repository.missions.some((item) => item.missionNumber === 5), false);
  assert.equal(repository.xpEvents.length, 3);
});

test("Mission 04 completion rolls back artefact, progression and XP when achievement persistence fails", async () => {
  const { repository, service } = await missionFourFlow();
  repository.failNext("unlockAchievement");
  await assert.rejects(
    () => service.completeMissionFour("user-1", now),
    /Injected failure at unlockAchievement/,
  );
  assert.equal(repository.boundaries.length, 0);
  assert.equal(repository.missions.find((item) => item.missionNumber === 4)?.status, "READY_TO_SAVE");
  assert.equal(repository.missions.some((item) => item.missionNumber === 5), false);
  assert.equal(repository.xpEvents.length, 3);
  assert.equal(repository.unlocks.length, 1);
});

test("Mission 04 structured continuity can be edited or erased without rewriting XP or completion", async () => {
  const { repository, service } = await missionFourFlow();
  await service.completeMissionFour("user-1", now);
  const changed = await service.updateActiveBoundary("user-1", {
    reviewAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "paused",
  }, now);
  assert.equal(changed.status, "paused");
  await assert.rejects(() => service.updateActiveBoundary("user-1", { ruleText: "raw content" }, now), /unsupported fields/i);
  await service.deleteActiveBoundary("user-1", now);
  assert.equal(repository.boundaries[0].ruleText, "");
  assert.ok(repository.boundaries[0].deletedAt);
  const dashboard = await service.getDashboard("user-1");
  assert.equal(dashboard.activeBoundary, null);
  assert.equal(dashboard.currentMission, 5);
  assert.equal(dashboard.totalXp, 330);
});

test("same local day is one active day; next local day advances the streak", async () => {
  const sameDay = await registeredFlow();
  const dashboard = await sameDay.service.completeMissionTwo("user-1", now);
  assert.equal(dashboard.activeDays, 1);
  assert.equal(dashboard.currentStreak, 1);

  const nextDay = new Date("2026-08-05T10:00:00.000Z");
  const later = await registeredFlow(nextDay);
  const laterDashboard = await later.service.completeMissionTwo("user-1", nextDay);
  assert.equal(laterDashboard.activeDays, 2);
  assert.equal(laterDashboard.currentStreak, 2);
  assert.equal(activeDayStreak(["2026-08-04", "2026-08-05"]), 2);
  assert.equal(localDateAt(now, "Asia/Almaty"), "2026-08-04");
});

test("commercial activity cannot enter the Programme reward or active-day ledger", async () => {
  const { repository, service } = await registeredFlow();
  await service.completeMissionTwo("user-1", now);
  assert.ok(repository.xpEvents.every((item) => item.eventType === "MISSION_COMPLETION"));
  assert.ok(repository.activeDays.every((item) => item.sourceEventKey.startsWith("programme:mission:")));
  const serviceSource = readFileSync("lib/services/programme-flow.service.ts", "utf8");
  assert.doesNotMatch(serviceSource, /affiliate|casino|bonus|deposit/i);
});

test("foreign artefacts cannot be read, edited or deleted", async () => {
  const { service } = await missionFourFlow();
  await service.completeMissionFour("user-1", now);
  const emptyDashboard = await service.getDashboard("user-2");
  assert.equal(emptyDashboard.currentMission, 1);
  assert.equal(emptyDashboard.totalXp, 0);
  assert.equal(emptyDashboard.missions[0].status, "current");
  assert.equal(emptyDashboard.missions.filter((mission: { status: string }) => mission.status === "completed").length, 0);
  await assert.rejects(() => service.updateMomentMap("user-2", { situation: "foreign" }), /stored only in this browser session/i);
  await assert.rejects(() => service.deleteMomentMap("user-2", now), /enrollment not found/i);
  await assert.rejects(() => service.updateCurrentGoal("user-2", { action: "foreign" }, now), /enrollment not found/i);
  await assert.rejects(() => service.deleteCurrentGoal("user-2", now), /enrollment not found/i);
  await assert.rejects(
    () => service.updateUrgeLearningRecord("user-2", { notNow: true }),
    /enrollment not found/i,
  );
  await assert.rejects(() => service.deleteUrgeLearningRecord("user-2", now), /enrollment not found/i);
  await assert.rejects(
    () => service.updateActiveBoundary("user-2", { ruleText: "foreign" }, now),
    /enrollment not found/i,
  );
  await assert.rejects(() => service.deleteActiveBoundary("user-2", now), /enrollment not found/i);
});

test("repeated Dashboard reads are stable and do not mutate Programme state", async () => {
  const { repository, service } = await missionFourFlow();
  await service.completeMissionFour("user-1", now);
  const counts = {
    missions: repository.missions.length,
    xp: repository.xpEvents.length,
    achievements: repository.unlocks.length,
    activeDays: repository.activeDays.length,
  };
  const first = await service.getDashboard("user-1");
  const second = await service.getDashboard("user-1");
  assert.deepEqual(second, first);
  assert.deepEqual(
    {
      missions: repository.missions.length,
      xp: repository.xpEvents.length,
      achievements: repository.unlocks.length,
      activeDays: repository.activeDays.length,
    },
    counts,
  );
});

test("active-day correction requires SUPER_ADMIN and is idempotent", async () => {
  const { repository, service } = await registeredFlow();
  const activeDayId = repository.activeDays[0].id;
  await assert.rejects(
    () => service.voidActiveDay(
      { id: "admin-1", role: "EDITOR" },
      activeDayId,
      "Correction requested by operations",
      now,
    ),
    /SUPER_ADMIN access required/i,
  );
  await service.voidActiveDay(
    { id: "admin-1", role: "SUPER_ADMIN" },
    activeDayId,
    "Correction requested by operations",
    now,
  );
  assert.equal(repository.activeDays[0].voidReason, "Correction requested by operations");
  assert.equal((await service.getDashboard("user-1")).activeDays, 0);
  await assert.rejects(
    () => service.voidActiveDay(
      { id: "admin-1", role: "SUPER_ADMIN" },
      activeDayId,
      "Correction requested by operations",
      now,
    ),
    /Active day not found/i,
  );
});

test("expired claims are rejected without persistence", async () => {
  const repository = new MemoryProgrammeRepository();
  const service = new ProgrammeFlowService(repository as unknown as ProgrammeFlowRepository);
  const started = await startMissionOne(service);
  const expiredAt = new Date(now.getTime() + 31 * 60 * 1000);
  await assert.rejects(
    () => service.redeemPendingClaim("user-1", started.claim.claimToken, "UTC", expiredAt),
    /expired/i,
  );
  assert.equal(repository.enrollments.length, 0);
  assert.equal(repository.xpEvents.length, 0);
});

test("artefact deletion scrubs personal content while retaining a tombstone", async () => {
  const { repository, service } = await registeredFlow();
  await service.completeMissionTwo("user-1", now);
  await service.deleteCurrentGoal("user-1", now);
  await service.deleteMomentMap("user-1", now);
  assert.equal(repository.goals[0].action, "");
  assert.equal(repository.momentMaps[0].situation, "");
  assert.ok(repository.goals[0].deletedAt);
  assert.ok(repository.momentMaps[0].deletedAt);
  const dashboard = await service.getDashboard("user-1");
  assert.equal(dashboard.currentGoal, null);
  assert.equal(dashboard.momentMap, null);
});

test("schema and migration enforce idempotency, ownership, confidence and non-negative XP", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync(
    "prisma/migrations/0015_active_control_program_flow/migration.sql",
    "utf8",
  );
  const missionThreeMigration = readFileSync(
    "prisma/migrations/0016_mission_03_urge_learning/migration.sql",
    "utf8",
  );
  const missionFourMigration = readFileSync(
    "prisma/migrations/0017_mission_04_active_boundary/migration.sql",
    "utf8",
  );
  assert.match(schema, /@@unique\(\[userId, localDate\]\)/);
  assert.match(schema, /@@unique\(\[enrollmentId, missionNumber\]\)/);
  assert.match(migration, /UserXpEvent_non_negative_check/);
  assert.match(migration, /CurrentGoal_confidence_check/);
  assert.match(migration, /PendingProgrammeClaim_tokenHash_key/);
  assert.match(migration, /ON DELETE CASCADE ON UPDATE CASCADE/);
  assert.match(schema, /model UrgeLearningRecord/);
  assert.match(missionThreeMigration, /UrgeLearningRecord_signal_choice_check/);
  assert.match(missionThreeMigration, /UrgeLearningRecord_enrollmentId_key/);
  assert.match(schema, /model ActiveBoundary/);
  assert.match(missionFourMigration, /ActiveBoundary_material_value_check/);
  assert.match(missionFourMigration, /ActiveBoundary_enrollmentId_key/);
  assert.match(missionFourMigration, /boundary-built/);
});

test("Control Programme seed uses current B4GAMBLE naming without changing its fixed slug", () => {
  const seed = readFileSync("scripts/seed-active-control-program.ts", "utf8");
  assert.match(seed, /B4GAMBLE Active Control Programme/);
  assert.match(seed, /B4GAMBLE 10-Step Control Programme/);
  assert.doesNotMatch(seed, /SevenBet Active Control Program|SevenBet 10-Step Control Program/);
  assert.match(seed, /CONTROL_PROGRAM_SLUG/);
});

test("validation rejects invalid confidence and client-authored reward fields", async () => {
  const { service, mapId } = await registeredFlow();
  await assert.rejects(
    () => service.saveMissionTwoDraft("user-1", {
      taskStates: [...missionTwoTaskStates],
      currentGoal: { ...goal(mapId), confidence: 11 },
    }),
    ValidationError,
  );
  await assert.rejects(
    () => service.saveMissionTwoDraft("user-1", {
      taskStates: [...missionTwoTaskStates],
      currentGoal: { ...goal(mapId), xp: 999 },
    }),
    ValidationError,
  );
});

test("rate-limit errors keep the normalized public response contract", async () => {
  resetProgrammeRateLimitsForTests();
  assertProgrammeRateLimit("regression-rate-limit", { limit: 1, windowMs: 60_000 }, 1);
  let captured: unknown;
  try {
    assertProgrammeRateLimit("regression-rate-limit", { limit: 1, windowMs: 60_000 }, 2);
  } catch (error) {
    captured = error;
  }
  const response = programmeErrorResponse(captured);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Too many programme requests",
    code: "RATE_LIMITED",
  });
});
