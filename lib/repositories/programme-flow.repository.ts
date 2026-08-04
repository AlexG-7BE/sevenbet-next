import {
  EditorialStatus,
  Prisma,
  type GoalDirection,
  type GoalStatus,
  type ProgrammeMissionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { CONTROL_PROGRAM_SLUG } from "@/lib/programme/contract";

export class ProgrammeFlowRepository {
  constructor(private readonly database: Prisma.TransactionClient = prisma) {}

  transaction<T>(operation: (repository: ProgrammeFlowRepository) => Promise<T>) {
    if (this.database !== prisma) return operation(this);
    return prisma.$transaction(
      (transaction) => operation(new ProgrammeFlowRepository(transaction)),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );
  }

  createAnonymousSession(input: {
    tokenHash: string;
    missionVersion: string;
    evidenceVersion: string;
    expiresAt: Date;
  }) {
    return this.database.anonymousProgrammeSession.create({
      data: { ...input, taskStates: [] },
    });
  }

  findAnonymousSession(tokenHash: string) {
    return this.database.anonymousProgrammeSession.findUnique({
      where: { tokenHash },
      include: { pendingClaim: true },
    });
  }

  updateAnonymousSession(
    id: string,
    input: {
      missionState: ProgrammeMissionStatus;
      taskStates: string[];
      draft: Prisma.InputJsonValue;
      expiresAt: Date;
      lastActivityAt: Date;
    },
  ) {
    return this.database.anonymousProgrammeSession.update({
      where: { id },
      data: input,
    });
  }

  transitionAnonymousSessionToRegistration(id: string, now: Date) {
    return this.database.anonymousProgrammeSession.updateMany({
      where: {
        id,
        missionState: "READY_TO_SAVE",
        deletedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        missionState: "REGISTRATION_REQUIRED",
        lastActivityAt: now,
      },
    });
  }

  upsertPendingClaim(input: {
    anonymousSessionId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.database.pendingProgrammeClaim.upsert({
      where: { anonymousSessionId: input.anonymousSessionId },
      update: {
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        consumedAt: null,
        consumedByUserId: null,
      },
      create: input,
    });
  }

  findClaim(tokenHash: string) {
    return this.database.pendingProgrammeClaim.findUnique({
      where: { tokenHash },
      include: { anonymousSession: true },
    });
  }

  consumeClaim(id: string, userId: string, now: Date) {
    return this.database.pendingProgrammeClaim.updateMany({
      where: { id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now, consumedByUserId: userId },
    });
  }

  completeAnonymousSession(id: string, now: Date) {
    return this.database.anonymousProgrammeSession.update({
      where: { id },
      data: {
        missionState: "COMPLETED",
        draft: Prisma.JsonNull,
        lastActivityAt: now,
        deletedAt: now,
      },
    });
  }

  async findControlProgram() {
    const program = await this.database.program.findFirst({
      where: {
        slug: CONTROL_PROGRAM_SLUG,
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
        publishedVersion: { gt: 0 },
      },
      include: {
        steps: {
          where: { archivedAt: null },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!program) return null;
    const version = await this.database.programVersion.findUnique({
      where: {
        programId_version: {
          programId: program.id,
          version: program.publishedVersion,
        },
      },
    });
    if (!version || version.status !== "PUBLISHED") return null;
    return { program, version };
  }

  findEnrollment(userId: string, programId: string) {
    return this.database.programEnrollment.findUnique({
      where: { userId_programId: { userId, programId } },
    });
  }

  getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId: string;
    timezone: string;
  }) {
    return this.database.programEnrollment.upsert({
      where: {
        userId_programId: { userId: input.userId, programId: input.programId },
      },
      update: {},
      create: input,
    });
  }

  setEnrollmentCurrentStep(enrollmentId: string, currentStepId: string) {
    return this.database.programEnrollment.update({
      where: { id: enrollmentId },
      data: { currentStepId },
    });
  }

  findMissionProgress(enrollmentId: string, missionNumber: number) {
    return this.database.programmeMissionProgress.findUnique({
      where: { enrollmentId_missionNumber: { enrollmentId, missionNumber } },
    });
  }

  upsertMissionProgress(input: {
    enrollmentId: string;
    missionNumber: number;
    status: ProgrammeMissionStatus;
    taskStates: string[];
    draft?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    completedAt?: Date | null;
  }) {
    const { enrollmentId, missionNumber, ...data } = input;
    return this.database.programmeMissionProgress.upsert({
      where: { enrollmentId_missionNumber: { enrollmentId, missionNumber } },
      update: data,
      create: { enrollmentId, missionNumber, ...data },
    });
  }

  updateMissionDraftIfOpen(input: {
    enrollmentId: string;
    missionNumber: number;
    status: ProgrammeMissionStatus;
    taskStates: string[];
    draft: Prisma.InputJsonValue;
  }) {
    return this.database.programmeMissionProgress.updateMany({
      where: {
        enrollmentId: input.enrollmentId,
        missionNumber: input.missionNumber,
        status: { not: "COMPLETED" },
      },
      data: {
        status: input.status,
        taskStates: input.taskStates,
        draft: input.draft,
      },
    });
  }

  findMomentMap(enrollmentId: string) {
    return this.database.momentMap.findUnique({ where: { enrollmentId } });
  }

  createMomentMap(input: {
    enrollmentId: string;
    situation: string;
    cues: string[];
    thoughtOrFeeling: string;
    response: string;
    immediateConsequence: string;
    noticeRule: string;
    neutralFlags: string[];
    notSureFlags: string[];
    missionVersion: string;
    evidenceVersion: string;
  }) {
    return this.database.momentMap.create({ data: input });
  }

  updateMomentMap(id: string, data: Partial<{
    situation: string;
    cues: string[];
    thoughtOrFeeling: string;
    response: string;
    immediateConsequence: string;
    noticeRule: string;
    neutralFlags: string[];
    notSureFlags: string[];
  }>) {
    return this.database.momentMap.update({ where: { id }, data });
  }

  eraseMomentMap(id: string, now: Date) {
    return this.database.momentMap.update({
      where: { id },
      data: {
        situation: "",
        cues: [],
        thoughtOrFeeling: "",
        response: "",
        immediateConsequence: "",
        noticeRule: "",
        neutralFlags: [],
        notSureFlags: [],
        deletedAt: now,
      },
    });
  }

  findCurrentGoal(enrollmentId: string) {
    return this.database.currentGoal.findUnique({ where: { enrollmentId } });
  }

  upsertCurrentGoal(input: {
    enrollmentId: string;
    sourceMomentMapId: string;
    direction: GoalDirection;
    action: string;
    triggerOrSituation: string;
    alternativeAction: string;
    successSignal: string;
    reviewAt: Date;
    confidence: number;
    confidenceAdjustment: string;
    status: GoalStatus;
  }) {
    const { enrollmentId, ...data } = input;
    return this.database.currentGoal.upsert({
      where: { enrollmentId },
      update: { ...data, deletedAt: null },
      create: { enrollmentId, ...data },
    });
  }

  updateCurrentGoal(id: string, data: Partial<{
    direction: GoalDirection;
    action: string;
    triggerOrSituation: string;
    alternativeAction: string;
    successSignal: string;
    reviewAt: Date;
    confidence: number;
    confidenceAdjustment: string;
    status: GoalStatus;
  }>) {
    return this.database.currentGoal.update({ where: { id }, data });
  }

  eraseCurrentGoal(id: string, now: Date) {
    return this.database.currentGoal.update({
      where: { id },
      data: {
        action: "",
        triggerOrSituation: "",
        alternativeAction: "",
        successSignal: "",
        confidenceAdjustment: "",
        deletedAt: now,
      },
    });
  }

  recordProgressEvent(input: {
    enrollmentId: string;
    entityId: string;
    eventKey: string;
    eventType?: string;
  }) {
    return this.database.programProgressEvent.createMany({
      data: [{
        enrollmentId: input.enrollmentId,
        entityId: input.entityId,
        entityType: "STEP",
        eventType: input.eventType ?? "COMPLETED",
        eventKey: input.eventKey,
      }],
      skipDuplicates: true,
    });
  }

  recordMissionXp(input: {
    userId: string;
    programId: string;
    missionNumber: number;
    xp: number;
    awardKey: string;
    sourceArtifactType: string;
    sourceArtifactId: string;
  }) {
    return this.database.userXpEvent.createMany({
      data: [{ ...input, eventType: "MISSION_COMPLETION" }],
      skipDuplicates: true,
    });
  }

  recordActiveDay(input: {
    userId: string;
    enrollmentId: string;
    localDate: Date;
    timezone: string;
    sourceEventKey: string;
    eligibleActivityAt: Date;
  }) {
    return this.database.programmeActiveDay.createMany({
      data: [input],
      skipDuplicates: true,
    });
  }

  voidActiveDay(input: {
    activeDayId: string;
    adminUserId: string;
    reason: string;
    voidedAt: Date;
  }) {
    return this.database.programmeActiveDay.updateMany({
      where: { id: input.activeDayId, voidedAt: null },
      data: {
        voidedAt: input.voidedAt,
        voidReason: input.reason,
        voidedByAdminId: input.adminUserId,
      },
    });
  }

  findFirstPlanAchievement() {
    return this.database.achievement.findFirst({
      where: {
        slug: "first-plan",
        status: EditorialStatus.PUBLISHED,
        active: true,
        archivedAt: null,
      },
    });
  }

  unlockAchievement(input: {
    userId: string;
    achievementId: string;
    awardKey: string;
  }) {
    return this.database.userAchievement.createMany({
      data: [input],
      skipDuplicates: true,
    });
  }

  findDashboardData(userId: string, programId: string) {
    return Promise.all([
      this.database.programEnrollment.findUnique({
        where: { userId_programId: { userId, programId } },
        include: {
          missionProgress: { orderBy: { missionNumber: "asc" } },
          momentMap: true,
          currentGoal: true,
          activeDays: {
            where: { voidedAt: null },
            orderBy: { localDate: "asc" },
          },
        },
      }),
      this.database.userXpEvent.findMany({
        where: { userId, programId },
        orderBy: { createdAt: "asc" },
      }),
      this.database.userAchievement.findMany({
        where: { userId, achievement: { slug: "first-plan" } },
        include: { achievement: true },
      }),
    ]);
  }
}

export const programmeFlowRepository = new ProgrammeFlowRepository();
