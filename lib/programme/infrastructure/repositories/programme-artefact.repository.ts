import {
  type BoundaryCategory,
  type BoundaryStatus,
  type EarlySignalCategory,
  type GoalDirection,
  type GoalStatus,
  Prisma,
} from "@prisma/client";

function enumValue<T>(value: string) {
  return value.toUpperCase() as T;
}

export class ProgrammeArtefactRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

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
    direction: string;
    action: string;
    triggerOrSituation: string;
    alternativeAction: string;
    successSignal: string;
    reviewAt: Date;
    confidence: number;
    confidenceAdjustment: string;
    status: string;
  }) {
    const { enrollmentId, direction, status, ...data } = input;
    const persistence = {
      ...data,
      direction: enumValue<GoalDirection>(direction),
      status: enumValue<GoalStatus>(status),
    };
    return this.database.currentGoal.upsert({
      where: { enrollmentId },
      update: { ...persistence, deletedAt: null },
      create: { enrollmentId, ...persistence },
    });
  }

  updateCurrentGoal(id: string, data: Partial<{
    direction: string;
    action: string;
    triggerOrSituation: string;
    alternativeAction: string;
    successSignal: string;
    reviewAt: Date;
    confidence: number;
    confidenceAdjustment: string;
    status: string;
  }>) {
    const { direction, status, ...rest } = data;
    return this.database.currentGoal.update({
      where: { id },
      data: {
        ...rest,
        ...(direction ? { direction: enumValue<GoalDirection>(direction) } : {}),
        ...(status ? { status: enumValue<GoalStatus>(status) } : {}),
      },
    });
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

  findUrgeLearningRecord(enrollmentId: string) {
    return this.database.urgeLearningRecord.findUnique({ where: { enrollmentId } });
  }

  upsertUrgeLearningRecord(input: {
    enrollmentId: string;
    missionVersion: string;
    learningItemId: string;
    evidenceVersion: string;
    reviewedAt: Date;
    scenarioCheckCompletedAt: Date;
    meaningCheckCompletedAt: Date;
    earlySignalCategory: string | null;
    earlySignalText: string | null;
    notNow: boolean;
  }) {
    const { enrollmentId, earlySignalCategory, ...data } = input;
    const persistence = {
      ...data,
      earlySignalCategory: earlySignalCategory
        ? enumValue<EarlySignalCategory>(earlySignalCategory)
        : null,
    };
    return this.database.urgeLearningRecord.upsert({
      where: { enrollmentId },
      update: { ...persistence, deletedAt: null },
      create: { enrollmentId, ...persistence },
    });
  }

  updateUrgeLearningRecord(id: string, data: {
    earlySignalCategory: string | null;
    earlySignalText: string | null;
    notNow: boolean;
  }) {
    return this.database.urgeLearningRecord.update({
      where: { id },
      data: {
        ...data,
        earlySignalCategory: data.earlySignalCategory
          ? enumValue<EarlySignalCategory>(data.earlySignalCategory)
          : null,
      },
    });
  }

  eraseUrgeLearningRecord(id: string, now: Date) {
    return this.database.urgeLearningRecord.update({
      where: { id },
      data: {
        earlySignalCategory: null,
        earlySignalText: null,
        notNow: true,
        deletedAt: now,
      },
    });
  }

  findActiveBoundary(enrollmentId: string) {
    return this.database.activeBoundary.findUnique({ where: { enrollmentId } });
  }

  upsertActiveBoundary(input: {
    enrollmentId: string;
    sourceCurrentGoalId: string | null;
    sourceUrgeLearningRecordId: string | null;
    missionVersion: string;
    evidenceVersion: string;
    category: string;
    triggerType: string;
    triggerText: string | null;
    ruleText: string;
    limitValue: number | null;
    limitUnit: string | null;
    limitPeriod: string | null;
    executionMethod: string;
    executionDetail: string | null;
    copingAction: string;
    reviewAt: Date;
    status: string;
  }) {
    const { enrollmentId, category, status, limitValue, ...data } = input;
    const persistence = {
      ...data,
      category: enumValue<BoundaryCategory>(category),
      status: enumValue<BoundaryStatus>(status),
      limitValue: limitValue === null ? null : new Prisma.Decimal(limitValue),
    };
    return this.database.activeBoundary.upsert({
      where: { enrollmentId },
      update: { ...persistence, deletedAt: null },
      create: { enrollmentId, ...persistence },
    });
  }

  updateActiveBoundary(id: string, data: Partial<{
    category: string;
    triggerType: string;
    triggerText: string | null;
    ruleText: string;
    limitValue: number | null;
    limitUnit: string | null;
    limitPeriod: string | null;
    executionMethod: string;
    executionDetail: string | null;
    copingAction: string;
    reviewAt: Date;
    status: string;
  }>) {
    const { category, status, limitValue, ...rest } = data;
    return this.database.activeBoundary.update({
      where: { id },
      data: {
        ...rest,
        ...(category ? { category: enumValue<BoundaryCategory>(category) } : {}),
        ...(status ? { status: enumValue<BoundaryStatus>(status) } : {}),
        ...(limitValue !== undefined
          ? { limitValue: limitValue === null ? null : new Prisma.Decimal(limitValue) }
          : {}),
      },
    });
  }

  eraseActiveBoundary(id: string, now: Date) {
    return this.database.activeBoundary.update({
      where: { id },
      data: {
        triggerText: null,
        ruleText: "",
        limitValue: null,
        limitUnit: null,
        limitPeriod: null,
        executionDetail: null,
        copingAction: "",
        status: "RETIRED",
        deletedAt: now,
      },
    });
  }
}
