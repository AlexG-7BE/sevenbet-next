import type { Prisma, PrismaClient } from "@prisma/client";

type AnalyticsIdentityScope = {
  anonymousIds: string[];
  sessionIds: string[];
  sessions: Array<{ id: string; anonymousId: string }>;
  eventWhere: Prisma.AnalyticsEventWhereInput;
  clickWhere: Prisma.OutboundClickWhereInput;
  consentWhere: Prisma.ConsentEventWhereInput;
};

async function collectAnalyticsIdentityScope(database: PrismaClient, userId: string): Promise<AnalyticsIdentityScope> {
  const [directSessions, directEvents, directClicks, directConsents] = await Promise.all([
    database.analyticsSession.findMany({ where: { userId }, select: { id: true, anonymousId: true } }),
    database.analyticsEvent.findMany({ where: { userId }, select: { analyticsSessionId: true, anonymousId: true } }),
    database.outboundClick.findMany({ where: { userId }, select: { analyticsSessionId: true, anonymousId: true } }),
    database.consentEvent.findMany({ where: { userId }, select: { anonymousId: true } }),
  ]);
  const sessionIds = new Set(directSessions.map((item) => item.id));
  const referencedSessionIds = new Set<string>();
  const anonymousIds = new Set(directSessions.map((item) => item.anonymousId));
  for (const item of [...directEvents, ...directClicks]) {
    if (item.analyticsSessionId) referencedSessionIds.add(item.analyticsSessionId);
    if (item.anonymousId) anonymousIds.add(item.anonymousId);
  }
  for (const item of directConsents) if (item.anonymousId) anonymousIds.add(item.anonymousId);

  const sessions = await database.analyticsSession.findMany({
    where: {
      AND: [
        { OR: [{ userId }, { userId: null }] },
        { OR: [
          { userId },
          ...(sessionIds.size || referencedSessionIds.size
            ? [{ id: { in: [...new Set([...sessionIds, ...referencedSessionIds])] } }]
            : []),
          ...(anonymousIds.size ? [{ anonymousId: { in: [...anonymousIds] } }] : []),
        ] },
      ],
    },
    select: { id: true, anonymousId: true },
  });
  for (const session of sessions) {
    sessionIds.add(session.id);
    anonymousIds.add(session.anonymousId);
  }
  const finalSessionIds = [...sessionIds];
  const finalAnonymousIds = [...anonymousIds];
  return {
    anonymousIds: finalAnonymousIds,
    sessionIds: finalSessionIds,
    sessions,
    eventWhere: {
      OR: [
        { userId },
        ...(finalSessionIds.length ? [{ userId: null, analyticsSessionId: { in: finalSessionIds } }] : []),
        ...(finalAnonymousIds.length ? [{ userId: null, anonymousId: { in: finalAnonymousIds } }] : []),
      ],
    },
    clickWhere: {
      OR: [
        { userId },
        ...(finalSessionIds.length ? [{ userId: null, analyticsSessionId: { in: finalSessionIds } }] : []),
        ...(finalAnonymousIds.length ? [{ userId: null, anonymousId: { in: finalAnonymousIds } }] : []),
      ],
    },
    consentWhere: {
      OR: [
        { userId },
        ...(finalAnonymousIds.length ? [{ userId: null, anonymousId: { in: finalAnonymousIds } }] : []),
      ],
    },
  };
}

export async function findDataSubjectUser(database: PrismaClient, identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;
  return database.user.findFirst({
    where: { OR: [{ id: identifier.trim() }, { email: { equals: normalized, mode: "insensitive" } }] },
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
          programmeStartingPoint: true,
        },
      },
      programmeSensitiveInputAuthorities: {
        select: {
          id: true,
          purposeVersion: true,
          statementVersion: true,
          confirmedAt: true,
          withdrawnAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      programmeAccessAcceptance: {
        select: {
          id: true,
          adultSelfAttestedAt: true,
          termsAcceptedAt: true,
          privacyAcknowledgedAt: true,
          termsVersionAtAcceptance: true,
          privacyVersionAtAcceptance: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      analyticsSessions: {
        select: {
          id: true,
          anonymousId: true,
          environment: true,
          trafficKind: true,
          startedAt: true,
          lastActivityAt: true,
          expiresAt: true,
          landingPath: true,
          locale: true,
          countryCode: true,
          referrerHost: true,
          acquisitionSource: true,
          deviceCategory: true,
        },
      },
      analyticsEvents: {
        select: {
          id: true,
          type: true,
          environment: true,
          trafficKind: true,
          occurredAt: true,
          pagePath: true,
          locale: true,
          countryCode: true,
          referrerHost: true,
          acquisitionSource: true,
          deviceCategory: true,
          casinoId: true,
          affiliateOfferId: true,
          affiliateNetworkId: true,
          placement: true,
          programmeStep: true,
          outboundClickId: true,
          emailMessageId: true,
        },
        orderBy: { occurredAt: "asc" },
      },
      outboundClicks: {
        select: {
          id: true,
          state: true,
          blockedReason: true,
          environment: true,
          trafficKind: true,
          attemptedAt: true,
          resolvedAt: true,
          sourcePage: true,
          locale: true,
          countryCode: true,
          acquisitionSource: true,
          placement: true,
          requestedSlug: true,
          casinoId: true,
          affiliateOfferId: true,
          affiliateNetworkId: true,
        },
        orderBy: { attemptedAt: "asc" },
      },
      consentEvents: {
        select: {
          id: true,
          purpose: true,
          action: true,
          source: true,
          policyVersion: true,
          locale: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: "asc" },
      },
      emailPreference: true,
      emailMessages: {
        select: {
          id: true,
          campaignId: true,
          purpose: true,
          status: true,
          environment: true,
          locale: true,
          recipientEmail: true,
          subject: true,
          templateVersion: true,
          provider: true,
          providerMessageId: true,
          attemptCount: true,
          queuedAt: true,
          sentAt: true,
          deliveredAt: true,
          bouncedAt: true,
          clickedAt: true,
          unsubscribedAt: true,
          failedAt: true,
          deliveryErrorCode: true,
          isTest: true,
          template: { select: { key: true, type: true } },
          providerEvents: {
            select: { providerEventId: true, type: true, occurredAt: true, receivedAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
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
  const analyticsScope = await collectAnalyticsIdentityScope(database, userId);
  const [analyticsSessions, analyticsEvents, outboundClicks, consentEvents, verifications] = await Promise.all([
    database.analyticsSession.findMany({
      where: { id: { in: analyticsScope.sessionIds } },
      select: {
        id: true,
        anonymousId: true,
        environment: true,
        trafficKind: true,
        startedAt: true,
        lastActivityAt: true,
        expiresAt: true,
        landingPath: true,
        locale: true,
        countryCode: true,
        referrerHost: true,
        acquisitionSource: true,
        deviceCategory: true,
      },
      orderBy: { startedAt: "asc" },
    }),
    database.analyticsEvent.findMany({
      where: analyticsScope.eventWhere,
      select: {
        id: true,
        type: true,
        environment: true,
        trafficKind: true,
        occurredAt: true,
        pagePath: true,
        locale: true,
        countryCode: true,
        referrerHost: true,
        acquisitionSource: true,
        deviceCategory: true,
        casinoId: true,
        affiliateOfferId: true,
        affiliateNetworkId: true,
        placement: true,
        programmeStep: true,
        outboundClickId: true,
        emailMessageId: true,
      },
      orderBy: { occurredAt: "asc" },
    }),
    database.outboundClick.findMany({
      where: analyticsScope.clickWhere,
      select: {
        id: true,
        state: true,
        blockedReason: true,
        environment: true,
        trafficKind: true,
        attemptedAt: true,
        resolvedAt: true,
        sourcePage: true,
        locale: true,
        countryCode: true,
        acquisitionSource: true,
        placement: true,
        requestedSlug: true,
        casinoId: true,
        affiliateOfferId: true,
        affiliateNetworkId: true,
      },
      orderBy: { attemptedAt: "asc" },
    }),
    database.consentEvent.findMany({
      where: analyticsScope.consentWhere,
      select: {
        id: true,
        purpose: true,
        action: true,
        source: true,
        policyVersion: true,
        locale: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "asc" },
    }),
    database.verification.findMany({
      where: { identifier: { equals: user.email, mode: "insensitive" } },
      select: { id: true, identifier: true, expiresAt: true, createdAt: true, updatedAt: true },
    }),
  ]);
  return {
    schemaVersion: "sevenbet-data-subject-export.v1",
    generatedAt: new Date().toISOString(),
    securityNote: "Authentication tokens, password hashes and verification secrets are intentionally excluded.",
    user: { ...user, analyticsSessions, analyticsEvents, outboundClicks, consentEvents },
    verifications,
  };
}

export async function buildDataSubjectDeletionPlan(database: PrismaClient, userId: string) {
  const user = await database.user.findUnique({ where: { id: userId }, select: { id: true, email: true, adminUser: { select: { id: true } } } });
  if (!user) return null;
  const enrollmentIds = (await database.programEnrollment.findMany({ where: { userId }, select: { id: true } })).map((item) => item.id);
  const enrollmentWhere = { enrollmentId: { in: enrollmentIds } };
  const consumedClaimRows = await database.pendingProgrammeClaim.findMany({
    where: { consumedByUserId: userId },
    select: { id: true, anonymousSessionId: true, anonymousSession: { select: { id: true, draft: true } } },
  });
  const linkedAnonymousSessionIds = new Set(consumedClaimRows.map((claim) => claim.anonymousSessionId));
  const legacyDraftBearingAnonymousSessions = consumedClaimRows.filter((claim) => claim.anonymousSession.draft !== null).length;
  const analyticsScope = await collectAnalyticsIdentityScope(database, userId);
  const [
    sessions, accounts, enrollments, progressEvents, reflections, missionProgress,
    momentMaps, currentGoals, urgeRecords, boundaries, xpEvents, achievements,
    activeDays, startingPoints, sensitiveInputAuthorities, accessAcceptances, verifications,
    analyticsEvents, outboundClicks, consentEvents, emailMessages, emailPreference,
    emailUnsubscribeTokens,
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
    database.programmeStartingPoint.count({ where: { userId } }),
    database.programmeSensitiveInputAuthority.count({ where: { userId } }),
    database.programmeAccessAcceptance.count({ where: { userId } }),
    database.verification.count({ where: { identifier: { equals: user.email, mode: "insensitive" } } }),
    database.analyticsEvent.count({ where: analyticsScope.eventWhere }),
    database.outboundClick.count({ where: analyticsScope.clickWhere }),
    database.consentEvent.count({ where: analyticsScope.consentWhere }),
    database.emailMessage.count({ where: { userId } }),
    database.customerEmailPreference.count({ where: { userId } }),
    database.emailUnsubscribeToken.count({ where: { userId } }),
  ]);
  return {
    schemaVersion: "sevenbet-data-subject-deletion-plan.v1",
    generatedAt: new Date().toISOString(),
    userId,
    email: user.email,
    blockedByAdminProfile: Boolean(user.adminUser),
    counts: {
      users: 1,
      sessions,
      accounts,
      enrollments,
      progressEvents,
      reflections,
      missionProgress,
      momentMaps,
      currentGoals,
      urgeRecords,
      boundaries,
      xpEvents,
      achievements,
      activeDays,
      startingPoints,
      sensitiveInputAuthorities,
      accessAcceptances,
      analyticsSessions: analyticsScope.sessions.length,
      analyticsEvents,
      outboundClicks,
      consentEvents,
      emailMessages,
      emailPreference,
      emailUnsubscribeTokens,
      consumedClaims: consumedClaimRows.length,
      linkedAnonymousSessions: linkedAnonymousSessionIds.size,
      legacyDraftBearingAnonymousSessions,
      verifications,
    },
    backupCaveat: "Deletion applies to the active application database. Provider backups may retain encrypted copies until their independently verified expiry and must not be selectively restored without reapplying the erasure.",
  };
}

export async function executeDataSubjectDeletion(database: PrismaClient, userId: string) {
  const plan = await buildDataSubjectDeletionPlan(database, userId);
  if (!plan) return null;
  if (plan.blockedByAdminProfile) throw new Error("Data subject has a staff profile; manual legal and audit-record review is required");
  await database.$transaction(async (transaction) => {
    // Capture the exact consumed claim/session ownership set before deleting the
    // account. The User relation otherwise becomes null and loses erasure scope.
    const consumedClaims = await transaction.pendingProgrammeClaim.findMany({
      where: { consumedByUserId: userId },
      select: { id: true, anonymousSessionId: true },
    });
    const consumedClaimIds = consumedClaims.map((claim) => claim.id);
    const linkedAnonymousSessionIds = [...new Set(consumedClaims.map((claim) => claim.anonymousSessionId))];
    const enrollmentIds = (await transaction.programEnrollment.findMany({ where: { userId }, select: { id: true } })).map((item) => item.id);
    const enrollmentWhere = { enrollmentId: { in: enrollmentIds } };
    const [directAnalyticsSessions, directAnalyticsEvents, directOutboundClicks, directConsentEvents] = await Promise.all([
      transaction.analyticsSession.findMany({ where: { userId }, select: { id: true, anonymousId: true } }),
      transaction.analyticsEvent.findMany({ where: { userId }, select: { analyticsSessionId: true, anonymousId: true } }),
      transaction.outboundClick.findMany({ where: { userId }, select: { analyticsSessionId: true, anonymousId: true } }),
      transaction.consentEvent.findMany({ where: { userId }, select: { anonymousId: true } }),
    ]);
    const analyticsSessionIdSet = new Set(directAnalyticsSessions.map((item) => item.id));
    const referencedAnalyticsSessionIdSet = new Set<string>();
    const analyticsAnonymousIdSet = new Set(directAnalyticsSessions.map((item) => item.anonymousId));
    for (const item of [...directAnalyticsEvents, ...directOutboundClicks]) {
      if (item.analyticsSessionId) referencedAnalyticsSessionIdSet.add(item.analyticsSessionId);
      if (item.anonymousId) analyticsAnonymousIdSet.add(item.anonymousId);
    }
    for (const item of directConsentEvents) if (item.anonymousId) analyticsAnonymousIdSet.add(item.anonymousId);
    const analyticsSessions = await transaction.analyticsSession.findMany({
      where: {
        AND: [
          { OR: [{ userId }, { userId: null }] },
          { OR: [
            { userId },
            ...(analyticsSessionIdSet.size || referencedAnalyticsSessionIdSet.size
              ? [{ id: { in: [...new Set([...analyticsSessionIdSet, ...referencedAnalyticsSessionIdSet])] } }]
              : []),
            ...(analyticsAnonymousIdSet.size ? [{ anonymousId: { in: [...analyticsAnonymousIdSet] } }] : []),
          ] },
        ],
      },
      select: { id: true, anonymousId: true },
    });
    for (const session of analyticsSessions) {
      analyticsSessionIdSet.add(session.id);
      analyticsAnonymousIdSet.add(session.anonymousId);
    }
    const analyticsSessionIds = [...analyticsSessionIdSet];
    const analyticsAnonymousIds = [...analyticsAnonymousIdSet];
    const analyticsEventWhere: Prisma.AnalyticsEventWhereInput = {
      OR: [
        { userId },
        ...(analyticsSessionIds.length ? [{ userId: null, analyticsSessionId: { in: analyticsSessionIds } }] : []),
        ...(analyticsAnonymousIds.length ? [{ userId: null, anonymousId: { in: analyticsAnonymousIds } }] : []),
      ],
    };
    const outboundClickWhere: Prisma.OutboundClickWhereInput = {
      OR: [
        { userId },
        ...(analyticsSessionIds.length ? [{ userId: null, analyticsSessionId: { in: analyticsSessionIds } }] : []),
        ...(analyticsAnonymousIds.length ? [{ userId: null, anonymousId: { in: analyticsAnonymousIds } }] : []),
      ],
    };
    const consentEventWhere: Prisma.ConsentEventWhereInput = {
      OR: [
        { userId },
        ...(analyticsAnonymousIds.length ? [{ userId: null, anonymousId: { in: analyticsAnonymousIds } }] : []),
      ],
    };
    const emailMessageIds = (await transaction.emailMessage.findMany({
      where: { userId },
      select: { id: true },
    })).map((item) => item.id);
    await transaction.activeBoundary.deleteMany({ where: enrollmentWhere });
    await transaction.currentGoal.deleteMany({ where: enrollmentWhere });
    await transaction.urgeLearningRecord.deleteMany({ where: enrollmentWhere });
    await transaction.programReflection.deleteMany({ where: enrollmentWhere });
    await transaction.programProgressEvent.deleteMany({ where: enrollmentWhere });
    await transaction.programmeMissionProgress.deleteMany({ where: enrollmentWhere });
    await transaction.programmeActiveDay.deleteMany({ where: { OR: [{ userId }, enrollmentWhere] } });
    await transaction.programmeStartingPoint.deleteMany({ where: { userId } });
    await transaction.momentMap.deleteMany({ where: enrollmentWhere });
    await transaction.programEnrollment.deleteMany({ where: { userId } });
    await transaction.userXpEvent.deleteMany({ where: { userId } });
    await transaction.userAchievement.deleteMany({ where: { userId } });
    await transaction.session.deleteMany({ where: { userId } });
    await transaction.account.deleteMany({ where: { userId } });
    await transaction.programmeSensitiveInputAuthority.deleteMany({ where: { userId } });
    await transaction.programmeAccessAcceptance.deleteMany({ where: { userId } });
    await transaction.analyticsEvent.deleteMany({ where: analyticsEventWhere });
    await transaction.outboundClick.deleteMany({ where: outboundClickWhere });
    await transaction.consentEvent.deleteMany({ where: consentEventWhere });
    await transaction.analyticsSession.deleteMany({ where: { id: { in: analyticsSessionIds } } });
    if (emailMessageIds.length > 0) {
      await transaction.emailProviderEvent.deleteMany({ where: { messageId: { in: emailMessageIds } } });
    }
    await transaction.emailUnsubscribeToken.deleteMany({ where: { userId } });
    await transaction.emailMessage.deleteMany({ where: { userId } });
    await transaction.customerEmailPreference.deleteMany({ where: { userId } });
    if (consumedClaimIds.length > 0) await transaction.pendingProgrammeClaim.deleteMany({ where: { id: { in: consumedClaimIds } } });
    if (linkedAnonymousSessionIds.length > 0) await transaction.anonymousProgrammeSession.deleteMany({ where: { id: { in: linkedAnonymousSessionIds } } });
    await transaction.verification.deleteMany({ where: { identifier: { equals: plan.email, mode: "insensitive" } } });
    await transaction.user.delete({ where: { id: userId } });
  });
  return { ...plan, executedAt: new Date().toISOString(), status: "deleted" as const };
}
