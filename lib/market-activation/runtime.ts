import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PublicAffiliateRoute } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";

import { safeActivationDestination } from "./contract";

const runtimeInclude = {
  casino: { select: { id: true, slug: true, title: true } },
  marketProfile: { select: { id: true, casinoId: true, countryCode: true } },
  affiliateOffer: { select: { id: true, casinoId: true, casinoBonusId: true, programId: true } },
  primaryTrackingLink: {
    select: {
      id: true,
      offerId: true,
      trackingUrl: true,
      destinationUrl: true,
      label: true,
    },
  },
  redirectSlug: {
    select: {
      id: true,
      slug: true,
      casinoId: true,
      casinoBonusId: true,
      affiliateOfferId: true,
    },
  },
} satisfies Prisma.MarketActivationInclude;

export type CanonicalMarketActivationRoute = Prisma.MarketActivationGetPayload<{ include: typeof runtimeInclude }>;

function object(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function exactActiveRoute(record: CanonicalMarketActivationRoute): record is CanonicalMarketActivationRoute & {
  marketProfile: NonNullable<CanonicalMarketActivationRoute["marketProfile"]>;
  affiliateOffer: NonNullable<CanonicalMarketActivationRoute["affiliateOffer"]>;
  primaryTrackingLink: NonNullable<CanonicalMarketActivationRoute["primaryTrackingLink"]>;
  redirectSlug: NonNullable<CanonicalMarketActivationRoute["redirectSlug"]>;
} {
  return record.desiredState === "ACTIVE"
    && record.status === "ACTIVE"
    && record.routeVerificationStatus === "HEALTHY"
    && record.routeLastCheckedAt !== null
    && Boolean(record.marketProfile && record.marketProfile.casinoId === record.casinoId && record.marketProfile.countryCode === record.countryCode)
    && Boolean(record.affiliateOffer && record.affiliateOffer.casinoId === record.casinoId)
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

export class MarketActivationRuntime {
  constructor(private readonly database: Pick<typeof prisma, "marketActivation"> = prisma) {}

  async listActive(casinoIds: string[], countryCode: string): Promise<CanonicalMarketActivationRoute[]> {
    const country = countryCode.trim().toUpperCase();
    if (!casinoIds.length || !/^[A-Z]{2}$/.test(country)) return [];
    const records = await this.database.marketActivation.findMany({
      where: {
        casinoId: { in: casinoIds },
        countryCode: country,
        product: "CASINO",
        desiredState: "ACTIVE",
        status: "ACTIVE",
      },
      include: runtimeInclude,
      orderBy: [{ casinoId: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    return records.filter(exactActiveRoute);
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
    const country = countryCode.trim().toUpperCase();
    if (!isSafePublicSlug(redirectSlug) || !/^[A-Z]{2}$/.test(country)) return null;
    const activation = await this.database.marketActivation.findFirst({
      where: {
        countryCode: country,
        product: "CASINO",
        desiredState: "ACTIVE",
        status: "ACTIVE",
        redirectSlug: { slug: redirectSlug },
      },
      include: runtimeInclude,
    });
    return activation && exactActiveRoute(activation) ? activation : null;
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
