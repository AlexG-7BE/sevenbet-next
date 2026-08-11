import { EditorialStatus, Prisma } from "@prisma/client";

export class ProgrammeRewardRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

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

  recordProgrammeAiXp(input: {
    userId: string;
    programId: string;
    missionNumber: number;
    xp: number;
    awardKey: string;
    sourceArtifactType: string;
    sourceArtifactId: string;
  }) {
    return this.database.userXpEvent.createMany({
      data: [{ ...input, eventType: "STEP_COMPLETION" }],
      skipDuplicates: true,
    });
  }

  /**
   * Missions 02–10 use action-specific award keys while retaining the deployed
   * MISSION_COMPLETION discriminator required by UserXpEvent_mission_source_check.
   */
  recordProgrammeAiMissionXp(input: {
    userId: string;
    programId: string;
    missionNumber: number;
    xp: number;
    awardKey: string;
    sourceArtifactType: "PROGRAM_AI_MISSION_PROGRESS";
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

  findAchievement(slug: string) {
    return this.database.achievement.findFirst({
      where: {
        slug,
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
}
