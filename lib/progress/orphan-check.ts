import { createHash } from "node:crypto";

export type ProgressUserIdSources = {
  programEnrollments: string[];
  xpEvents: string[];
  achievements: string[];
};

export type ProgressOrphanReport = {
  sourceCounts: {
    programEnrollments: number;
    xpEvents: number;
    achievements: number;
  };
  distinctReferencedUsers: number;
  existingUsers: number;
  orphanCount: number;
  orphanFingerprints: string[];
};

function distinct(values: string[]) {
  return Array.from(new Set(values));
}

function fingerprint(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

export function buildProgressOrphanReport(
  sources: ProgressUserIdSources,
  existingUserIds: string[],
): ProgressOrphanReport {
  const programEnrollments = distinct(sources.programEnrollments);
  const xpEvents = distinct(sources.xpEvents);
  const achievements = distinct(sources.achievements);
  const referenced = distinct([
    ...programEnrollments,
    ...xpEvents,
    ...achievements,
  ]);
  const existing = new Set(existingUserIds);
  const orphans = referenced.filter((userId) => !existing.has(userId));

  return {
    sourceCounts: {
      programEnrollments: programEnrollments.length,
      xpEvents: xpEvents.length,
      achievements: achievements.length,
    },
    distinctReferencedUsers: referenced.length,
    existingUsers: referenced.filter((userId) => existing.has(userId)).length,
    orphanCount: orphans.length,
    orphanFingerprints: orphans.map(fingerprint).sort(),
  };
}

export class ProgressUserOrphanError extends Error {
  constructor(public readonly report: ProgressOrphanReport) {
    super(`Found ${report.orphanCount} progress user orphan record(s)`);
    this.name = "ProgressUserOrphanError";
  }
}

export function assertNoProgressUserOrphans(report: ProgressOrphanReport) {
  if (report.orphanCount > 0) {
    throw new ProgressUserOrphanError(report);
  }
}
