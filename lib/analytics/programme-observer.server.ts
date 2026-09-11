import "server-only";

import { after } from "next/server";

import {
  ANALYTICS_ANONYMOUS_COOKIE,
} from "@/lib/analytics/consent-contract";
import {
  analyticsEnvironment,
  analyticsSigningSecret,
  analyticsTrafficKind,
  readAnalyticsConsent,
  readAnalyticsUuid,
} from "@/lib/analytics/identity.server";
import { recordServerAnalyticsEventBestEffort } from "@/lib/analytics/service.server";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import prisma from "@/lib/db/prisma";
import { requestCookie, anonymousProgrammeCookie } from "@/lib/programme/http";
import { hashOpaqueToken } from "@/lib/programme/security";

function consentedIdentity(headers: Headers) {
  try {
    if (!isProductAnalyticsEnabled()) return null;
    const secret = analyticsSigningSecret();
    if (readAnalyticsConsent(headers, secret) !== "granted") return null;
    return {
      anonymousId: readAnalyticsUuid(headers, ANALYTICS_ANONYMOUS_COOKIE, secret),
      environment: analyticsEnvironment(),
      trafficKind: analyticsTrafficKind(headers),
    };
  } catch {
    return null;
  }
}

export async function observeAnonymousProgrammeStarted(request: Request, occurredAt = new Date()) {
  const identity = consentedIdentity(request.headers);
  const programmeToken = requestCookie(request, anonymousProgrammeCookie);
  if (!identity?.anonymousId || !programmeToken) return "not-consented" as const;
  return recordServerAnalyticsEventBestEffort({
    name: "programme_started",
    dedupeKey: `programme:anonymous:${hashOpaqueToken(programmeToken)}:started`,
    occurredAt,
    anonymousId: identity.anonymousId,
    // The consent endpoint may issue a fresh browser session cookie before its
    // first AnalyticsSession row exists, so anonymous Programme observation
    // intentionally does not assert the session foreign key.
    environment: identity.environment,
    trafficKind: identity.trafficKind,
    programmeStep: 1,
  });
}

export async function observeProgrammeState(userId: string, headers: Headers) {
  const identity = consentedIdentity(headers);
  if (!identity) return { observed: false, reason: "not-consented" as const };
  const enrollment = await prisma.programEnrollment.findFirst({
    where: { userId },
    include: {
      missionProgress: { orderBy: { missionNumber: "asc" } },
      progressEvents: {
        where: { entityType: "STEP", eventType: "COMPLETED" },
        orderBy: { createdAt: "asc" },
      },
      program: { include: { steps: { select: { id: true, order: true } } } },
    },
    orderBy: { startedAt: "asc" },
  });
  if (!enrollment) return { observed: false, reason: "no-enrollment" as const };
  const base = {
    userId,
    anonymousId: identity?.anonymousId,
    // Canonical Programme writes may be observed before the browser ingestion
    // endpoint creates the corresponding session row. Avoid asserting an
    // unverified foreign key; identity remains available through user/anon IDs.
    environment: identity.environment,
    trafficKind: identity.trafficKind,
  };
  const legacyStepOrder = new Map(enrollment.program.steps.map((step) => [step.id, step.order]));
  const completedSteps = new Map<number, Date>();
  for (const mission of enrollment.missionProgress) {
    if (mission.status === "COMPLETED") {
      completedSteps.set(mission.missionNumber, mission.completedAt ?? mission.updatedAt);
    }
  }
  for (const event of enrollment.progressEvents) {
    const step = legacyStepOrder.get(event.entityId);
    if (step && step >= 1 && step <= 10 && !completedSteps.has(step)) completedSteps.set(step, event.createdAt);
  }
  const observations = [
    recordServerAnalyticsEventBestEffort({
      ...base,
      name: "programme_started",
      dedupeKey: `programme:${enrollment.id}:started`,
      occurredAt: enrollment.startedAt,
      programmeStep: 1,
    }),
    ...[...completedSteps.entries()]
      .map(([missionNumber, completedAt]) => recordServerAnalyticsEventBestEffort({
        ...base,
        name: "programme_step_completed",
        dedupeKey: `programme:${enrollment.id}:step:${missionNumber}:completed`,
        occurredAt: completedAt,
        programmeStep: missionNumber,
      })),
  ];
  if (enrollment.completedAt) {
    observations.push(recordServerAnalyticsEventBestEffort({
      ...base,
      name: "programme_completed",
      dedupeKey: `programme:${enrollment.id}:completed`,
      occurredAt: enrollment.completedAt,
    }));
  }
  await Promise.all(observations);
  return { observed: true, enrollmentId: enrollment.id } as const;
}

function scheduleProgrammeObservation(work: () => Promise<unknown>) {
  const contained = () => work().catch(() => {
    console.warn("[analytics] Programme observation failed", {
      analytics_failure_category: "programme_state",
    });
  });
  try { after(contained); } catch { void contained(); }
}

export function scheduleAnonymousProgrammeStartedObservation(request: Request) {
  scheduleProgrammeObservation(() => observeAnonymousProgrammeStarted(request));
}

export function scheduleProgrammeStateObservation(userId: string, headers: Headers) {
  scheduleProgrammeObservation(() => observeProgrammeState(userId, headers));
}
