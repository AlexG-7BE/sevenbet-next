import "server-only";

import type { AnalyticsEnvironment } from "@prisma/client";

import prisma from "@/lib/db/prisma";

/** How a visitor first reached B4GAMBLE, as stored on their consented analytics session. */
export type AcquisitionTouch = {
  referrerHost: string | null;
  acquisitionSource: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

type SessionTouch = AcquisitionTouch & { startedAt: Date };

const FIRST_TOUCH_SESSION_LIMIT = 50;

function bareHost(host: string) {
  return host.toLowerCase().replace(/^www\./, "");
}

function externalHost(host: string | null, siteHost: string) {
  if (!host) return null;
  const candidate = bareHost(host);
  const site = bareHost(siteHost);
  return candidate === site || candidate.endsWith(`.${site}`) ? null : host;
}

/**
 * The first touch that says where the visitor came from: the earliest session
 * with a campaign parameter, a `source` label or a referrer outside this site.
 * Direct and internal-navigation sessions are skipped, so a later campaign visit
 * is not overwritten by an earlier bookmark. Sessions must be oldest first.
 */
export function firstAcquisitionTouch(sessions: readonly SessionTouch[], siteHost: string): AcquisitionTouch | null {
  for (const session of sessions) {
    const referrerHost = externalHost(session.referrerHost, siteHost);
    const campaign = session.acquisitionSource || session.utmSource || session.utmMedium
      || session.utmCampaign || session.utmContent || session.utmTerm;
    if (!campaign && !referrerHost) continue;
    return {
      referrerHost,
      acquisitionSource: session.acquisitionSource,
      utmSource: session.utmSource,
      utmMedium: session.utmMedium,
      utmCampaign: session.utmCampaign,
      utmContent: session.utmContent,
      utmTerm: session.utmTerm,
    };
  }
  return null;
}

/** The `User.signup*` columns for a first touch. */
export function signupAcquisitionColumns(touch: AcquisitionTouch) {
  return {
    signupReferrerHost: touch.referrerHost,
    signupSource: touch.acquisitionSource,
    signupUtmSource: touch.utmSource,
    signupUtmMedium: touch.utmMedium,
    signupUtmCampaign: touch.utmCampaign,
    signupUtmContent: touch.utmContent,
    signupUtmTerm: touch.utmTerm,
  };
}

/**
 * Reads the first touch of a consented browser. Callers pass the analytics ID
 * only under the analytics grant; sessions owned by another account are ignored.
 */
export async function consentedFirstTouch({
  anonymousId,
  userId,
  environment,
  siteHost,
}: {
  anonymousId: string;
  userId: string;
  environment: AnalyticsEnvironment;
  siteHost: string;
}) {
  const sessions = await prisma.analyticsSession.findMany({
    where: { anonymousId, environment, OR: [{ userId: null }, { userId }] },
    orderBy: { startedAt: "asc" },
    take: FIRST_TOUCH_SESSION_LIMIT,
    select: {
      startedAt: true,
      referrerHost: true,
      acquisitionSource: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      utmTerm: true,
    },
  });
  return firstAcquisitionTouch(sessions, siteHost);
}
