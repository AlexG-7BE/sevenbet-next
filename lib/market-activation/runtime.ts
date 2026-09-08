import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PublicAffiliateRoute } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";

import {
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES,
  safeActivationDestination,
} from "./contract";

const runtimeInclude = {
  casino: { select: { id: true, slug: true, title: true } },
  marketProfile: { select: { id: true, casinoId: true, countryCode: true } },
  affiliateOffer: {
    select: {
      id: true,
      casinoId: true,
      casinoBonusId: true,
      programId: true,
      status: true,
      startAt: true,
      expiresAt: true,
      archivedAt: true,
      program: {
        select: {
          id: true,
          casinoId: true,
          status: true,
          workflowStatus: true,
          archivedAt: true,
          network: { select: { active: true, archivedAt: true } },
        },
      },
    },
  },
  casinoBonus: {
    select: {
      id: true,
      casinoId: true,
      status: true,
      offerStatus: true,
      startsAt: true,
      expiresAt: true,
    },
  },
  primaryTrackingLink: {
    select: {
      id: true,
      offerId: true,
      trackingUrl: true,
      destinationUrl: true,
      label: true,
      active: true,
      archivedAt: true,
      validFrom: true,
      expiresAt: true,
    },
  },
  redirectSlug: {
    select: {
      id: true,
      slug: true,
      casinoId: true,
      casinoBonusId: true,
      affiliateOfferId: true,
      active: true,
      archivedAt: true,
    },
  },
} satisfies Prisma.MarketActivationInclude;

export type CanonicalMarketActivationRoute = Prisma.MarketActivationGetPayload<{ include: typeof runtimeInclude }>;

function object(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

type BoundCanonicalMarketActivationRoute = CanonicalMarketActivationRoute & {
  affiliateOffer: NonNullable<CanonicalMarketActivationRoute["affiliateOffer"]>;
  primaryTrackingLink: NonNullable<CanonicalMarketActivationRoute["primaryTrackingLink"]>;
  redirectSlug: NonNullable<CanonicalMarketActivationRoute["redirectSlug"]>;
};

function activeRouteForCountry(
  record: CanonicalMarketActivationRoute,
  requestedCountry: string,
): record is BoundCanonicalMarketActivationRoute {
  const now = Date.now();
  const current = (start: Date | null, end: Date | null) => (!start || start.getTime() <= now) && (!end || end.getTime() > now);
  const exactCountry = record.countryCode === requestedCountry;
  const globalFallback = record.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE;
  const scopeAllows = exactCountry
    ? Boolean(record.marketProfile
      && record.marketProfile.casinoId === record.casinoId
      && record.marketProfile.countryCode === requestedCountry)
    : globalFallback
      && record.marketProfile === null
      && record.globalFallbackBlockedCountries.length > 0
      && record.globalFallbackBlockedCountries.every((country) => /^[A-Z]{2}$/.test(country))
      && MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES.every((country) => (
        record.globalFallbackBlockedCountries.includes(country)
      ))
      && !record.globalFallbackBlockedCountries.includes(requestedCountry);
  return record.desiredState === "ACTIVE"
    && record.status === "ACTIVE"
    && record.routeVerificationStatus === "HEALTHY"
    && record.routeLastCheckedAt !== null
    && scopeAllows
    && Boolean(record.affiliateOffer
      && record.affiliateOffer.casinoId === record.casinoId
      && record.affiliateOffer.program.casinoId === record.casinoId
      && record.affiliateOffer.status === "ACTIVE"
      && !record.affiliateOffer.archivedAt
      && current(record.affiliateOffer.startAt, record.affiliateOffer.expiresAt)
      && record.affiliateOffer.program.status === "ACTIVE"
      && record.affiliateOffer.program.workflowStatus === "PUBLISHED"
      && !record.affiliateOffer.program.archivedAt
      && record.affiliateOffer.program.network.active
      && !record.affiliateOffer.program.network.archivedAt)
    && Boolean(record.affiliateOffer?.casinoBonusId === record.casinoBonusId)
    && Boolean(!record.casinoBonusId || (record.casinoBonus
      && record.casinoBonus.id === record.casinoBonusId
      && record.casinoBonus.casinoId === record.casinoId
      && record.affiliateOffer?.casinoBonusId === record.casinoBonusId
      && record.casinoBonus.status === "PUBLISHED"
      && record.casinoBonus.offerStatus === "ACTIVE"
      && current(record.casinoBonus.startsAt, record.casinoBonus.expiresAt)))
    && Boolean(record.primaryTrackingLink
      && record.primaryTrackingLink.offerId === record.affiliateOfferId
      && record.primaryTrackingLink.active
      && !record.primaryTrackingLink.archivedAt
      && current(record.primaryTrackingLink.validFrom, record.primaryTrackingLink.expiresAt))
    && Boolean(record.redirectSlug
      && record.redirectSlug.casinoId === record.casinoId
      && record.redirectSlug.affiliateOfferId === record.affiliateOfferId
      && record.redirectSlug.casinoBonusId === record.casinoBonusId
      && record.redirectSlug.active
      && !record.redirectSlug.archivedAt
      && isSafePublicSlug(record.redirectSlug.slug))
    && Boolean(record.primaryTrackingLink
      && safeActivationDestination(record.primaryTrackingLink.trackingUrl)
      && safeActivationDestination(record.primaryTrackingLink.destinationUrl));
}

function requestedCountryCode(value: string) {
  const country = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) && country !== MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
    ? country
    : null;
}

function selectActiveRoutes(
  records: CanonicalMarketActivationRoute[],
  requestedCountry: string,
) {
  const casinoIds = [...new Set(records.map((record) => record.casinoId))].sort();
  return casinoIds.flatMap((casinoId) => {
    const exact = records.find((record) => record.casinoId === casinoId && record.countryCode === requestedCountry);
    if (exact) return activeRouteForCountry(exact, requestedCountry) ? [exact] : [];
    const globalFallback = records.find((record) => record.casinoId === casinoId
      && record.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE);
    return globalFallback && activeRouteForCountry(globalFallback, requestedCountry) ? [globalFallback] : [];
  });
}

export class MarketActivationRuntime {
  constructor(private readonly database: Pick<typeof prisma, "marketActivation"> = prisma) {}

  async listActive(casinoIds: string[], countryCode: string): Promise<CanonicalMarketActivationRoute[]> {
    const country = requestedCountryCode(countryCode);
    if (!casinoIds.length || !country) return [];
    const records = await this.database.marketActivation.findMany({
      where: {
        casinoId: { in: casinoIds },
        countryCode: { in: [country, MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE] },
        product: "CASINO",
      },
      include: runtimeInclude,
      orderBy: [{ casinoId: "asc" }, { countryCode: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    return selectActiveRoutes(records, country);
  }

  async listPublicRoutes(casinoIds: string[], countryCode: string): Promise<PublicAffiliateRoute[]> {
    return (await this.listActive(casinoIds, countryCode)).map((activation) => ({
      casinoId: activation.casinoId,
      casinoBonusId: activation.casinoBonusId,
      affiliateOfferId: activation.affiliateOfferId,
      slug: activation.redirectSlug!.slug,
    }));
  }

  async resolveRedirect(redirectSlug: string, countryCode: string) {
    const country = requestedCountryCode(countryCode);
    if (!isSafePublicSlug(redirectSlug) || !country) return null;
    const records = await this.database.marketActivation.findMany({
      where: {
        product: "CASINO",
        OR: [
          { countryCode: country },
          {
            countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
            redirectSlug: { slug: redirectSlug },
          },
        ],
      },
      include: runtimeInclude,
      orderBy: [{ countryCode: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    const exact = records.find((record) => record.countryCode === country && record.redirectSlug?.slug === redirectSlug);
    if (exact && activeRouteForCountry(exact, country)) return exact;
    const globalFallback = records.find((record) => record.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
      && record.redirectSlug?.slug === redirectSlug);
    if (!globalFallback) return null;
    const exactAuthorityExists = records.some((record) => record.countryCode === country
      && record.casinoId === globalFallback.casinoId);
    return !exactAuthorityExists && activeRouteForCountry(globalFallback, country) ? globalFallback : null;
  }

  async isActive(input: { casinoId: string; countryCode: string; redirectId?: string; offerId?: string; trackingLinkId?: string }) {
    const records = await this.listActive([input.casinoId], input.countryCode);
    return records.some((record) => (!input.redirectId || record.redirectSlugId === input.redirectId)
      && (!input.offerId || record.affiliateOfferId === input.offerId)
      && (!input.trackingLinkId || record.primaryTrackingLinkId === input.trackingLinkId));
  }

  async diagnostics() {
    const records = await this.database.marketActivation.findMany({
      include: {
        casino: { select: { slug: true } },
        affiliateOffer: { select: { status: true, geoMode: true, program: { select: { status: true, workflowStatus: true, network: { select: { active: true } } } } } },
        primaryTrackingLink: { select: { active: true, geoMode: true, countries: true } },
        redirectSlug: { select: { active: true, archivedAt: true, slug: true } },
      },
      orderBy: [{ countryCode: "asc" }, { casinoId: "asc" }],
    });
    return records.map((record) => {
      const storedDiagnostics = object(record.diagnostics);
      const authority = record.primaryTrackingLink?.countries.find((entry) => entry.countryCode === record.countryCode);
      const drift = record.status === "ACTIVE" ? [
        record.affiliateOffer?.status !== "ACTIVE" && "LEGACY_OFFER_STATUS_DRIFT",
        record.affiliateOffer?.program.status !== "ACTIVE" && "LEGACY_PROGRAM_STATUS_DRIFT",
        record.affiliateOffer?.program.workflowStatus !== "PUBLISHED" && "LEGACY_PROGRAM_WORKFLOW_DRIFT",
        record.affiliateOffer?.program.network.active !== true && "LEGACY_NETWORK_DRIFT",
        record.primaryTrackingLink?.active !== true && "LEGACY_TRACKING_DRIFT",
        authority?.productionEligible !== true && "LEGACY_PRODUCTION_ELIGIBILITY_DRIFT",
        record.redirectSlug?.active !== true && "LEGACY_REDIRECT_DRIFT",
      ].filter(Boolean) : [];
      return {
        id: record.id,
        casinoSlug: record.casino.slug,
        countryCode: record.countryCode,
        product: record.product,
        desiredState: record.desiredState,
        status: record.status,
        version: record.version,
        redirectSlug: record.redirectSlug?.slug ?? null,
        externalBlocker: record.externalBlockerCode ? {
          code: record.externalBlockerCode,
          detail: record.externalBlockerDetail,
          source: record.externalBlockerSource,
        } : null,
        internalPending: storedDiagnostics.internalPending ?? null,
        routeVerification: {
          status: record.routeVerificationStatus,
          checkedAt: record.routeLastCheckedAt,
          finalHost: record.routeFinalHost,
          detail: record.routeVerificationDetail,
        },
        compatibilityDrift: drift,
        lastReconciledAt: record.lastReconciledAt,
      };
    });
  }
}

export const marketActivationRuntime = new MarketActivationRuntime();
