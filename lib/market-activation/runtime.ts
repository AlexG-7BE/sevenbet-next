import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  canonicalCommercialCountryCode,
  canonicalCommercialMarketKey,
  type CanonicalCommercialMarketKey,
} from "@/lib/jurisdiction/canonical-commercial-market";
import type { GbOperatorEligibilityInput } from "@/lib/jurisdiction/gb-operator-eligibility";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";

import { safeActivationDestination } from "./contract";

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
      archivedAt: true,
      startAt: true,
      expiresAt: true,
      program: {
        select: {
          id: true,
          casinoId: true,
          status: true,
          workflowStatus: true,
          integrationMode: true,
          connectionStatus: true,
          providerAccountId: true,
          credentialReference: true,
          archivedAt: true,
          domainLifecycleStatus: true,
          network: { select: { active: true, archivedAt: true } },
        },
      },
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

export interface MarketActivationPublicRoute {
  casinoId: string;
  slug: string;
  operatorEligibilityContext?: Omit<GbOperatorEligibilityInput, "casino" | "now" | "domainEvidence">;
}

function object(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function storedCanonicalMarketKey(value: string) {
  const canonical = canonicalCommercialMarketKey({
    countryCode: value.slice(0, 2),
    marketCode: value,
    trust: "TRUSTED",
  });
  return canonical === value ? canonical : null;
}

type BoundCanonicalMarketActivationRoute = CanonicalMarketActivationRoute & {
  affiliateOffer: NonNullable<CanonicalMarketActivationRoute["affiliateOffer"]>;
  primaryTrackingLink: NonNullable<CanonicalMarketActivationRoute["primaryTrackingLink"]>;
  redirectSlug: NonNullable<CanonicalMarketActivationRoute["redirectSlug"]>;
};

function activeExactRoute(
  record: CanonicalMarketActivationRoute,
  marketKey: CanonicalCommercialMarketKey,
  now: Date,
): record is BoundCanonicalMarketActivationRoute {
  const countryCode = canonicalCommercialCountryCode(marketKey);
  const profileCoherent = !record.marketProfile || (
    record.marketProfile.casinoId === record.casinoId
    && record.marketProfile.countryCode === countryCode
  );
  return record.marketCode === marketKey
    && record.countryCode === countryCode
    && record.desiredState === "ACTIVE"
    && record.status === "ACTIVE"
    && record.routeVerificationStatus === "HEALTHY"
    && record.routeLastCheckedAt !== null
    && profileCoherent
    && Boolean(record.affiliateOffer
      && record.affiliateOffer.casinoId === record.casinoId
      && record.affiliateOffer.program.casinoId === record.casinoId)
    && Boolean(record.affiliateOffer?.casinoBonusId === record.casinoBonusId)
    && Boolean(!record.casinoBonusId || (record.casinoBonus
      && record.casinoBonus.id === record.casinoBonusId
      && record.casinoBonus.casinoId === record.casinoId
      && record.affiliateOffer?.casinoBonusId === record.casinoBonusId))
    && Boolean(record.primaryTrackingLink
      && record.primaryTrackingLink.offerId === record.affiliateOfferId
      && record.primaryTrackingLink.active
      && !record.primaryTrackingLink.archivedAt
      && (!record.primaryTrackingLink.validFrom || record.primaryTrackingLink.validFrom <= now)
      && (!record.primaryTrackingLink.expiresAt || record.primaryTrackingLink.expiresAt > now))
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

function selectUnambiguousExactRoutes(
  records: CanonicalMarketActivationRoute[],
  marketKey: CanonicalCommercialMarketKey,
  now: Date,
) {
  const byCasino = new Map<string, CanonicalMarketActivationRoute[]>();
  for (const record of records) {
    byCasino.set(record.casinoId, [...(byCasino.get(record.casinoId) ?? []), record]);
  }
  return [...byCasino.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, candidates]) => candidates.length === 1 && activeExactRoute(candidates[0]!, marketKey, now)
      ? [candidates[0] as BoundCanonicalMarketActivationRoute]
      : []);
}

export class MarketActivationRuntime {
  constructor(private readonly database: Pick<typeof prisma, "marketActivation"> = prisma) {}

  async listActive(
    casinoIds: string[],
    requestedMarketKey: string,
    now = new Date(),
  ): Promise<BoundCanonicalMarketActivationRoute[]> {
    if (!casinoIds.length) return [];
    const marketKey = storedCanonicalMarketKey(requestedMarketKey);
    if (!marketKey) return [];
    const records = await this.database.marketActivation.findMany({
      where: {
        casinoId: { in: casinoIds },
        marketCode: marketKey,
        product: "CASINO",
      },
      include: runtimeInclude,
      orderBy: [{ casinoId: "asc" }, { id: "asc" }],
    });
    return selectUnambiguousExactRoutes(records, marketKey, now);
  }

  async listPublicRoutes(
    casinoIds: string[],
    marketKey: string,
    now = new Date(),
  ): Promise<MarketActivationPublicRoute[]> {
    return (await this.listActive(casinoIds, marketKey, now)).map((activation) => ({
      casinoId: activation.casinoId,
      slug: activation.redirectSlug!.slug,
      ...(activation.countryCode === "GB" ? {
        operatorEligibilityContext: {
          commercialContract: {
            programActive: activation.affiliateOffer.program.status === "ACTIVE"
              && !activation.affiliateOffer.program.archivedAt
              && !["SUSPENDED", "ARCHIVED"].includes(activation.affiliateOffer.program.domainLifecycleStatus ?? "")
              && activation.affiliateOffer.program.network.active
              && !activation.affiliateOffer.program.network.archivedAt,
            programPublished: activation.affiliateOffer.program.workflowStatus === "PUBLISHED",
            programConnected: activation.affiliateOffer.program.integrationMode === "MANUAL"
              || (activation.affiliateOffer.program.connectionStatus === "CONNECTED"
                && Boolean(activation.affiliateOffer.program.providerAccountId)
                && Boolean(activation.affiliateOffer.program.credentialReference)),
            offerActive: activation.affiliateOffer.status === "ACTIVE"
              && !activation.affiliateOffer.archivedAt
              && (!activation.affiliateOffer.startAt || activation.affiliateOffer.startAt <= now)
              && (!activation.affiliateOffer.expiresAt || activation.affiliateOffer.expiresAt > now),
            trackingLinkActive: activation.primaryTrackingLink.active
              && !activation.primaryTrackingLink.archivedAt
              && (!activation.primaryTrackingLink.validFrom || activation.primaryTrackingLink.validFrom <= now)
              && (!activation.primaryTrackingLink.expiresAt || activation.primaryTrackingLink.expiresAt > now),
          },
          redirectContract: {
            slugActive: activation.redirectSlug.active && !activation.redirectSlug.archivedAt,
            destinationServerOwned: true,
            destinationSafe: safeActivationDestination(activation.primaryTrackingLink.trackingUrl)
              && safeActivationDestination(activation.primaryTrackingLink.destinationUrl),
          },
        },
      } : {}),
    }));
  }

  async resolveRedirect(
    redirectSlug: string,
    requestedMarketKey: string,
    now = new Date(),
  ) {
    if (!isSafePublicSlug(redirectSlug)) return null;
    const marketKey = storedCanonicalMarketKey(requestedMarketKey);
    if (!marketKey) return null;
    const records = await this.database.marketActivation.findMany({
      where: {
        product: "CASINO",
        marketCode: marketKey,
        redirectSlug: { slug: redirectSlug },
      },
      include: runtimeInclude,
      orderBy: [{ id: "asc" }],
    });
    return records.length === 1 && activeExactRoute(records[0]!, marketKey, now) ? records[0]! : null;
  }

  async isActive(input: {
    casinoId: string;
    countryCode: string;
    redirectId?: string;
    offerId?: string;
    trackingLinkId?: string;
    now?: Date;
  }) {
    const marketKey = canonicalCommercialMarketKey({
      countryCode: input.countryCode.slice(0, 2),
      marketCode: input.countryCode,
      trust: "TRUSTED",
    });
    if (!marketKey) return false;
    const records = await this.listActive([input.casinoId], marketKey, input.now);
    return records.some((record) => (!input.redirectId || record.redirectSlugId === input.redirectId)
      && (!input.offerId || record.affiliateOfferId === input.offerId)
      && (!input.trackingLinkId || record.primaryTrackingLinkId === input.trackingLinkId));
  }

  async diagnostics() {
    const records = await this.database.marketActivation.findMany({
      include: {
        casino: { select: { slug: true } },
        affiliateOffer: { select: { status: true, program: { select: { status: true, workflowStatus: true, network: { select: { active: true } } } } } },
        primaryTrackingLink: { select: { active: true } },
        redirectSlug: { select: { active: true, archivedAt: true, slug: true } },
      },
      orderBy: [{ marketCode: "asc" }, { casinoId: "asc" }],
    });
    return records.map((record) => {
      const storedDiagnostics = object(record.diagnostics);
      const drift = record.status === "ACTIVE" ? [
        record.affiliateOffer?.status !== "ACTIVE" && "LEGACY_OFFER_STATUS_DRIFT",
        record.affiliateOffer?.program.status !== "ACTIVE" && "LEGACY_PROGRAM_STATUS_DRIFT",
        record.affiliateOffer?.program.workflowStatus !== "PUBLISHED" && "LEGACY_PROGRAM_WORKFLOW_DRIFT",
        record.affiliateOffer?.program.network.active !== true && "LEGACY_NETWORK_DRIFT",
        record.primaryTrackingLink?.active !== true && "LEGACY_TRACKING_DRIFT",
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
