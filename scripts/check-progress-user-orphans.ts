import prisma from "../lib/db/prisma";
import {
  assertNoProgressUserOrphans,
  buildProgressOrphanReport,
} from "../lib/progress/orphan-check";

async function checkProgressUserOrphans() {
  const [enrollmentRows, xpRows, achievementRows] = await Promise.all([
    prisma.programEnrollment.findMany({
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.userXpEvent.findMany({
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.userAchievement.findMany({
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const referencedUserIds = Array.from(
    new Set([
      ...enrollmentRows.map((row) => row.userId),
      ...xpRows.map((row) => row.userId),
      ...achievementRows.map((row) => row.userId),
    ]),
  );
  const existingUsers = referencedUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: referencedUserIds } },
        select: { id: true },
      })
    : [];

  const report = buildProgressOrphanReport(
    {
      programEnrollments: enrollmentRows.map((row) => row.userId),
      xpEvents: xpRows.map((row) => row.userId),
      achievements: achievementRows.map((row) => row.userId),
    },
    existingUsers.map((user) => user.id),
  );

  console.info("Progress user orphan preflight");
  console.info({
    ...report.sourceCounts,
    distinctReferencedUsers: report.distinctReferencedUsers,
    existingUsers: report.existingUsers,
    orphanCount: report.orphanCount,
    orphanFingerprints: report.orphanFingerprints,
  });

  assertNoProgressUserOrphans(report);
  console.info("Progress user orphan preflight passed");
}

checkProgressUserOrphans()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown progress preflight failure";
    console.error(`Progress user orphan preflight failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
