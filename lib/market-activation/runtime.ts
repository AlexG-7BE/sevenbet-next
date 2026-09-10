import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PublicAffiliateRoute } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";

import {
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES,
  MARKET_ACTIVATION_EXACT_SUBDIVISION_COUNTRIES,
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
      program: {
        select: {
          id: true,
          casinoId: true,
        },
      },
      countries: { select: { countryCode: true, mode: true } },
    },
  },
  casinoBonus: {
    select: {
      id: true,
      casinoId: true,
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
      countries: { select: { countryCode: true, mode: true } },
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
  requestedMarket: string,
): record is BoundCanonicalMarketActivationRoute {
  const requestedCountry = requestedMarket.slice(0, 2);
  const exactMarket = record.marketCode === requestedMarket;
  const globalFallback = record.marketCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE;
  const offerMarketAllows = globalFallback || Boolean(record.affiliateOffer?.countries.some((entry) => (
    entry.countryCode === record.marketCode && entry.mode === "ALLOW"
  )));
  const trackingMarketAllows = globalFallback || Boolean(record.primaryTrackingLink?.countries.some((entry) => (
    entry.countryCode === record.marketCode && entry.mode === "ALLOW"
  )));
  const scopeAllows = exactMarket
    ? Boolean(record.marketProfile
      && record.marketProfile.casinoId === record.casinoId
      && record.marketProfile.countryCode === record.countryCode
      && record.countryCode === requestedCountry)
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
    && offerMarketAllows
    && trackingMarketAllows
    // MarketActivation is the sole positive and negative CTA authority.
    && Boolean(record.affiliateOffer
      && record.affiliateOffer.casinoId === record.casinoId
      && record.affiliateOffer.program.casinoId === record.casinoId)
    && Boolean(record.affiliateOffer?.casinoBonusId === record.casinoBonusId)
    && Boolean(!record.casinoBonusId || (record.casinoBonus
      && record.casinoBonus.id === record.casinoBonusId
      && record.casinoBonus.casinoId === record.casinoId
      && record.affiliateOffer?.casinoBonusId === record.casinoBonusId))
    && Boolean(record.primaryTrackingLink && record.primaryTrackingLink.offerId === record.affiliateOfferId)
    && Boolean(record.redirectSlug
      && record.redirectSlug.casinoId === record.casinoId
      && record.redirectSlug.affiliateOfferId === record.affiliateOfferId
      && record.redirectSlug.casinoBonusId === record.casinoBonusId
      && isSafePublicSlug(record.redirectSlug.slug))
    && Boolean(record.primaryTrackingLink
      && safeActivationDestination(record.primaryTrackingLink.trackingUrl)
      && safeActivationDestination(record.primaryTrackingLink.destinationUrl));
}

function requestedMarketCode(value: string) {
  const market = value.trim().toUpperCase().replace(/_/g, "-");
  return /^[A-Z]{2}(?:-[A-Z0-9]{1,12})?$/.test(market) && market !== MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
    ? market
    : null;
}

function selectActiveRoutes(
  records: CanonicalMarketActivationRoute[],
  requestedMarket: string,
) {
  const casinoIds = [...new Set(records.map((record) => record.casinoId))].sort();
  return casinoIds.flatMap((casinoId) => {
    const exact = records.find((record) => record.casinoId === casinoId && record.marketCode === requestedMarket);
    if (exact) return activeRouteForCountry(exact, requestedMarket) ? [exact] : [];
    const requestedCountry = requestedMarket.slice(0, 2);
    const subdivision = requestedMarket.includes("-");
    if (subdivision && MARKET_ACTIVATION_EXACT_SUBDIVISION_COUNTRIES.includes(requestedCountry as "AR" | "CA")) return [];
    const parent = subdivision
      ? records.find((record) => record.casinoId === casinoId && record.marketCode === requestedCountry)
      : null;
    if (parent) return activeRouteForCountry(parent, requestedCountry) ? [parent] : [];
    if (MARKET_ACTIVATION_EXACT_SUBDIVISION_COUNTRIES.includes(requestedCountry as "AR" | "CA")) return [];
    const globalFallback = records.find((record) => record.casinoId === casinoId
      && record.marketCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE);
    return globalFallback && activeRouteForCountry(globalFallback, requestedMarket) ? [globalFallback] : [];
  });
}

export class MarketActivationRuntime {
  constructor(private readonly database: Pick<typeof prisma, "marketActivation"> = prisma) {}

  async listActive(casinoIds: string[], countryCode: string): Promise<CanonicalMarketActivationRoute[]> {
    const market = requestedMarketCode(countryCode);
    if (!casinoIds.length || !market) return [];
    const records = await this.database.marketActivation.findMany({
      where: {
        casinoId: { in: casinoIds },
        marketCode: { in: [...new Set([
          market,
          ...(market.includes("-") ? [market.slice(0, 2)] : []),
          MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
        ])] },
        product: "CASINO",
      },
      include: runtimeInclude,
      orderBy: [{ casinoId: "asc" }, { marketCode: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    return selectActiveRoutes(records, market);
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
    const market = requestedMarketCode(countryCode);
    if (!isSafePublicSlug(redirectSlug) || !market) return null;
    const requestedCountry = market.slice(0, 2);
    const marketCodes = [...new Set([
      market,
      ...(market.includes("-") ? [requestedCountry] : []),
    ])];
    const records = await this.database.marketActivation.findMany({
      where: {
        product: "CASINO",
        OR: [
          { marketCode: { in: marketCodes } },
          {
            marketCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
            redirectSlug: { slug: redirectSlug },
          },
        ],
      },
      include: runtimeInclude,
      orderBy: [{ marketCode: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    const exact = records.find((record) => record.marketCode === market && record.redirectSlug?.slug === redirectSlug);
    if (exact && activeRouteForCountry(exact, market)) return exact;
    if (records.some((record) => record.marketCode === market && record.redirectSlug?.slug === redirectSlug)) return null;
    if (market.includes("-") && MARKET_ACTIVATION_EXACT_SUBDIVISION_COUNTRIES.includes(requestedCountry as "AR" | "CA")) return null;
    const parent = market.includes("-")
      ? records.find((record) => record.marketCode === requestedCountry && record.redirectSlug?.slug === redirectSlug)
      : null;
    if (parent && activeRouteForCountry(parent, requestedCountry)) return parent;
    if (parent || MARKET_ACTIVATION_EXACT_SUBDIVISION_COUNTRIES.includes(requestedCountry as "AR" | "CA")) return null;
    const globalFallback = records.find((record) => record.marketCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
      && record.redirectSlug?.slug === redirectSlug);
    if (!globalFallback) return null;
    const exactAuthorityExists = records.some((record) => marketCodes.includes(record.marketCode)
      && record.casinoId === globalFallback.casinoId);
    return !exactAuthorityExists && activeRouteForCountry(globalFallback, market) ? globalFallback : null;
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
      const authority = record.primaryTrackingLink?.countries.find((entry) => entry.countryCode === record.marketCode);
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
        marketCode: record.marketCode,
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
