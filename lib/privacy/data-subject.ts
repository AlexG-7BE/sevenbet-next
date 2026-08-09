import type { PrismaClient } from "@prisma/client";

export async function findDataSubjectUser(database: PrismaClient, identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;
  return database.user.findFirst({
    where: { OR: [{ id: identifier.trim() }, { email: normalized }] },
    select: { id: true, email: true, name: true, emailVerified: true, image: true, createdAt: true, updatedAt: true },
  });
}

export async function collectDataSubjectExport(database: PrismaClient, userId: string) {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      sessions: { select: { id: true, expiresAt: true, createdAt: true, updatedAt: true, ipAddress: true, userAgent: true } },
      accounts: { select: { id: true, accountId: true, providerId: true, scope: true, createdAt: true, updatedAt: true } },
      adminUser: { select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } },
      programEnrollments: {
        include: {
          progressEvents: true,
          reflections: true,
          missionProgress: true,
          momentMap: true,
          currentGoal: true,
          urgeLearningRecord: true,
          activeBoundary: true,
          activeDays: true,
        },
      },
      xpEvents: true,
      achievements: { include: { achievement: { select: { slug: true, title: true } } } },
      consumedProgrammeClaims: {
        select: {
          id: true,
          anonymousSessionId: true,
          expiresAt: true,
          consumedAt: true,
          createdAt: true,
          anonymousSession: {
            select: {
              missionState: true,
              taskStates: true,
              draft: true,
              missionVersion: true,
              evidenceVersion: true,
              expiresAt: true,
              lastActivityAt: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
        },
      },
      programmeActiveDays: true,
    },
  });
  if (!user) return null;
  const verifications = await database.verification.findMany({
    where: { identifier: { equals: user.email, mode: "insensitive" } },
    select: { id: true, identifier: true, expiresAt: true, createdAt: true, updatedAt: true },
  });
  return {
    schemaVersion: "sevenbet-data-subject-export.v1",
    generatedAt: new Date().toISOString(),
    securityNote: "Authentication tokens, password hashes and verification secrets are intentionally excluded.",
    user,
    verifications,
  };
}

export async function buildDataSubjectDeletionPlan(database: PrismaClient, userId: string) {
  const user = await database.user.findUnique({ where: { id: userId }, select: { id: true, email: true, adminUser: { select: { id: true } } } });
  if (!user) return null;
  const enrollmentIds = (await database.programEnrollment.findMany({ where: { userId }, select: { id: true } })).map((item) => item.id);
  const enrollmentWhere = { enrollmentId: { in: enrollmentIds } };
  const [
    sessions, accounts, enrollments, progressEvents, reflections, missionProgress,
    momentMaps, currentGoals, urgeRecords, boundaries, xpEvents, achievements,
    activeDays, consumedClaims, verifications,
  ] = await Promise.all([
    database.session.count({ where: { userId } }),
    database.account.count({ where: { userId } }),
    database.programEnrollment.count({ where: { userId } }),
    database.programProgressEvent.count({ where: enrollmentWhere }),
    database.programReflection.count({ where: enrollmentWhere }),
    database.programmeMissionProgress.count({ where: enrollmentWhere }),
    database.momentMap.count({ where: enrollmentWhere }),
    database.currentGoal.count({ where: enrollmentWhere }),
    database.urgeLearningRecord.count({ where: enrollmentWhere }),
    database.activeBoundary.count({ where: enrollmentWhere }),
    database.userXpEvent.count({ where: { userId } }),
    database.userAchievement.count({ where: { userId } }),
    database.programmeActiveDay.count({ where: { userId } }),
    database.pendingProgrammeClaim.count({ where: { consumedByUserId: userId } }),
    database.verification.count({ where: { identifier: { equals: user.email, mode: "insensitive" } } }),
  ]);
  return {
    schemaVersion: "sevenbet-data-subject-deletion-plan.v1",
    generatedAt: new Date().toISOString(),
    userId,
    email: user.email,
    blockedByAdminProfile: Boolean(user.adminUser),
    counts: { users: 1, sessions, accounts, enrollments, progressEvents, reflections, missionProgress, momentMaps, currentGoals, urgeRecords, boundaries, xpEvents, achievements, activeDays, consumedClaims, verifications },
    backupCaveat: "Deletion applies to the active application database. Provider backups may retain encrypted copies until their independently verified expiry and must not be selectively restored without reapplying the erasure.",
  };
}

export async function executeDataSubjectDeletion(database: PrismaClient, userId: string) {
  const plan = await buildDataSubjectDeletionPlan(database, userId);
  if (!plan) return null;
  if (plan.blockedByAdminProfile) throw new Error("Data subject has a staff profile; manual legal and audit-record review is required");
  await database.$transaction(async (transaction) => {
    const enrollmentIds = (await transaction.programEnrollment.findMany({ where: { userId }, select: { id: true } })).map((item) => item.id);
    const enrollmentWhere = { enrollmentId: { in: enrollmentIds } };
    await transaction.activeBoundary.deleteMany({ where: enrollmentWhere });
    await transaction.currentGoal.deleteMany({ where: enrollmentWhere });
    await transaction.urgeLearningRecord.deleteMany({ where: enrollmentWhere });
    await transaction.programReflection.deleteMany({ where: enrollmentWhere });
    await transaction.programProgressEvent.deleteMany({ where: enrollmentWhere });
    await transaction.programmeMissionProgress.deleteMany({ where: enrollmentWhere });
    await transaction.programmeActiveDay.deleteMany({ where: { OR: [{ userId }, enrollmentWhere] } });
    await transaction.momentMap.deleteMany({ where: enrollmentWhere });
    await transaction.programEnrollment.deleteMany({ where: { userId } });
    await transaction.userXpEvent.deleteMany({ where: { userId } });
    await transaction.userAchievement.deleteMany({ where: { userId } });
    await transaction.session.deleteMany({ where: { userId } });
    await transaction.account.deleteMany({ where: { userId } });
    await transaction.pendingProgrammeClaim.updateMany({ where: { consumedByUserId: userId }, data: { consumedByUserId: null } });
    await transaction.verification.deleteMany({ where: { identifier: { equals: plan.email, mode: "insensitive" } } });
    await transaction.user.delete({ where: { id: userId } });
  });
  return { ...plan, executedAt: new Date().toISOString(), status: "deleted" as const };
}
