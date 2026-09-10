import { createHash } from "node:crypto";

import {
  MarketActivationEventType,
  MarketActivationStatus,
  Prisma,
  type MarketActivation,
} from "@prisma/client";

import { founderGlobalPartnerRoutePolicy } from "@/lib/affiliate-routing/partner-route-projection";
import { prisma } from "@/lib/db/prisma";

import {
  MARKET_ACTIVATION_CONTROLLER_VERSION,
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  safeActivationDestination,
  type MarketActivationRouteVerificationResult,
  type NormalizedMarketActivationIntent,
} from "./contract";
import { marketEvidenceBlocksActivation } from "./market-evidence";

type Transaction = Prisma.TransactionClient;

const activationResultInclude = {
  casino: { select: { id: true, slug: true, title: true } },
  marketProfile: { select: { id: true, countryCode: true, availability: true } },
  affiliateOffer: { select: { id: true, publicLabel: true } },
  primaryTrackingLink: { select: { id: true, label: true } },
  redirectSlug: { select: { id: true, slug: true } },
  casinoBonus: { select: { id: true, slug: true, title: true } },
  intents: { orderBy: { createdAt: Prisma.SortOrder.desc }, take: 1 },
} satisfies Prisma.MarketActivationInclude;

type ActivationResultRecord = Prisma.MarketActivationGetPayload<{ include: typeof activationResultInclude }>;

export interface MarketActivationApplyResult {
  idempotent: boolean;
  activation: ActivationResultRecord;
}

interface ExternalBlocker {
  code: string;
  detail: string;
  source: string;
}

interface InternalPending {
  code: string;
  detail: string;
  source: string;
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function appendUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : null;
}

function lifecycleInactive(value: string | null) {
  return value === "SUSPENDED" || value === "ARCHIVED";
}

function snapshotMetadata(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function globalEvidence(metadata: Prisma.JsonValue) {
  const visibility = snapshotMetadata(snapshotMetadata(metadata).commercialVisibility as Prisma.JsonValue);
  return typeof visibility.evidenceId === "string" ? visibility.evidenceId.trim() : "";
}

type ActivationTrackingCandidate = {
  id: string;
  active: boolean;
  priority: number;
  metadata: Prisma.JsonValue;
  countries: Array<{
    countryCode: string;
    mode: string;
    productionEligibilityEvidence: string | null;
  }>;
};

function normalizedMarketHost(localWebsiteUrl: string | null, localDomain: string | null) {
  if (localWebsiteUrl) {
    try {
      return new URL(localWebsiteUrl).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      // The ingestion contract normally rejects malformed URLs. A malformed
      // historical value is not allowed to influence route selection.
    }
  }
  return localDomain?.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "") || null;
}

function hostBelongsToMarket(host: unknown, marketHost: string | null) {
  if (typeof host !== "string" || !marketHost) return false;
  const normalized = host.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  return normalized === marketHost || normalized.endsWith(`.${marketHost}`);
}

function importedRouteMetadata(metadata: Prisma.JsonValue) {
  const imported = snapshotMetadata(snapshotMetadata(metadata).betssonCommercialRoutesV1 as Prisma.JsonValue);
  return {
    exactCountryCode: typeof imported.exactCountryCode === "string" ? imported.exactCountryCode.trim().toUpperCase() : null,
    explicitLanguageCode: typeof imported.explicitLanguageCode === "string" ? imported.explicitLanguageCode.trim().toLowerCase() : null,
    healthFinalHost: typeof imported.healthFinalHost === "string" ? imported.healthFinalHost.trim().toLowerCase() : null,
    healthStatus: typeof imported.healthStatus === "string" ? imported.healthStatus.trim().toUpperCase() : null,
    purpose: typeof imported.purpose === "string" ? imported.purpose.trim().toUpperCase() : null,
  };
}

export function selectActivationTrackingCandidate<T extends ActivationTrackingCandidate>(input: {
  candidates: T[];
  countryCode: string;
  localWebsiteUrl: string | null;
  localDomain: string | null;
  existingTrackingId: string | null;
}) {
  const countryCode = input.countryCode.trim().toUpperCase();
  const marketHost = normalizedMarketHost(input.localWebsiteUrl, input.localDomain);
  const scored = input.candidates.flatMap((candidate, order) => {
    const country = candidate.countries.find((entry) => entry.countryCode.toUpperCase() === countryCode && entry.mode === "ALLOW");
    if (!country) return [];
    const imported = importedRouteMetadata(candidate.metadata);
    if (imported.exactCountryCode && imported.exactCountryCode !== countryCode) return [];
    const exactImportedRoute = imported.exactCountryCode === countryCode;
    const finalHostMatchesMarket = hostBelongsToMarket(imported.healthFinalHost, marketHost);
    const purposeScore = imported.purpose === "HOMEPAGE" || imported.purpose === "CASINO_LOBBY" ? 500
      : imported.purpose === "CASINO_WELCOME_OFFER" ? 400
        : imported.purpose === "REGISTRATION" ? 200
          : imported.purpose ? 100 : 0;
    const observedHealthScore = imported.healthStatus === "HEALTHY" ? 800
      : finalHostMatchesMarket && imported.healthStatus === "EXTERNAL_CHALLENGE" ? 700
        : finalHostMatchesMarket && imported.healthStatus === "CROSS_GEO" ? 600
          : 0;
    const score = (exactImportedRoute ? 10_000 : 0)
      + (finalHostMatchesMarket ? 2_000 : 0)
      + observedHealthScore
      + purposeScore
      + (imported.explicitLanguageCode ? 0 : 40)
      + (candidate.active ? 20 : 0)
      + Math.max(0, Math.min(candidate.priority, 100))
      + (candidate.id === input.existingTrackingId ? 5 : 0)
      + (country.productionEligibilityEvidence?.trim() ? 1 : 0);
    return [{ candidate, score, order }];
  });
  return scored.sort((left, right) => right.score - left.score || left.order - right.order)[0]?.candidate ?? null;
}

function reconciliationFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function nextRevision(tx: Transaction, model: "offer" | "tracking" | "redirect", id: string) {
  if (model === "offer") return ((await tx.affiliateOfferRevision.aggregate({ where: { offerId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0) + 1;
  if (model === "tracking") return ((await tx.affiliateTrackingLinkRevision.aggregate({ where: { trackingLinkId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0) + 1;
  return ((await tx.affiliateRedirectRevision.aggregate({ where: { redirectSlugId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0) + 1;
}

function activationData(input: {
  current: MarketActivation | null;
  intent: NormalizedMarketActivationIntent;
  casinoId: string;
  marketProfileId: string | null;
  affiliateOfferId: string | null;
  primaryTrackingLinkId: string | null;
  redirectSlugId: string | null;
  casinoBonusId: string | null;
  globalFallbackBlockedCountries: string[];
  blocker: ExternalBlocker | null;
  internalPending: InternalPending | null;
  diagnostics: Prisma.InputJsonValue;
  reconciliationFingerprint: string;
  now: Date;
}) {
  const sameReconciliation = input.current?.reconciliationFingerprint === input.reconciliationFingerprint;
  const status = input.intent.desiredState === "DISABLED"
    ? MarketActivationStatus.DISABLED
    : input.internalPending
      ? MarketActivationStatus.PREPARING
      : input.blocker
        ? MarketActivationStatus.BLOCKED_EXTERNAL
        : sameReconciliation
          && input.current?.status === "ACTIVE"
          && input.current.routeVerificationStatus === "HEALTHY"
          ? MarketActivationStatus.ACTIVE
          : MarketActivationStatus.PREPARING;
  return {
    casinoId: input.casinoId,
    countryCode: input.intent.countryCode,
    product: input.intent.product,
    desiredState: input.intent.desiredState,
    status,
    marketProfileId: input.marketProfileId,
    affiliateOfferId: input.affiliateOfferId,
    primaryTrackingLinkId: input.primaryTrackingLinkId,
    redirectSlugId: input.redirectSlugId,
    casinoBonusId: input.casinoBonusId,
    globalFallbackBlockedCountries: input.globalFallbackBlockedCountries,
    version: (input.current?.version ?? -1) + 1,
    controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
    reconciliationFingerprint: input.reconciliationFingerprint,
    requestedBy: input.intent.actorId,
    requestedAt: input.now,
    requestReason: input.intent.reason,
    sourceReferences: input.intent.sourceReferences,
    activatedAt: status === "ACTIVE" ? input.current?.activatedAt ?? input.now : input.current?.activatedAt ?? null,
    disabledAt: status === "DISABLED" ? input.now : null,
    blockedAt: status === "BLOCKED_EXTERNAL" ? input.now : null,
    lastReconciledAt: input.now,
    routeVerificationStatus: sameReconciliation ? input.current?.routeVerificationStatus ?? "NOT_CHECKED" : "NOT_CHECKED",
    routeLastCheckedAt: sameReconciliation ? input.current?.routeLastCheckedAt ?? null : null,
    routeFinalHost: sameReconciliation ? input.current?.routeFinalHost ?? null : null,
    routeVerificationDetail: sameReconciliation ? input.current?.routeVerificationDetail ?? null : null,
    externalBlockerCode: input.blocker?.code ?? null,
    externalBlockerDetail: input.blocker?.detail ?? null,
    externalBlockerSource: input.blocker?.source ?? null,
    diagnostics: input.diagnostics,
    updatedAt: input.now,
  };
}

async function recordEvents(
  tx: Transaction,
  activation: MarketActivation,
  intentId: string,
  input: NormalizedMarketActivationIntent,
  previous: MarketActivation | null,
  repairs: string[],
  blocker: ExternalBlocker | null,
  now: Date,
  noOp = false,
) {
  const maximum = await tx.marketActivationEvent.aggregate({ where: { activationId: activation.id }, _max: { sequence: true } });
  let sequence = maximum._max.sequence ?? 0;
  const common = {
    activationId: activation.id,
    intentId,
    previousDesiredState: previous?.desiredState ?? null,
    previousStatus: previous?.status ?? null,
    desiredState: activation.desiredState,
    actorId: input.actorId,
    origin: input.origin,
    reason: input.reason,
    controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
    occurredAt: now,
  };
  await tx.marketActivationEvent.create({
    data: {
      ...common,
      sequence: ++sequence,
      type: MarketActivationEventType.INTENT_ACCEPTED,
      status: activation.status,
      metadata: json({ idempotencyKey: input.idempotencyKey, payloadHash: input.payloadHash, sourceReferences: input.sourceReferences }),
    },
  });
  if (noOp) {
    await tx.marketActivationEvent.create({
      data: {
        ...common,
        sequence: ++sequence,
        type: MarketActivationEventType.NOOP,
        status: activation.status,
        metadata: json({ reason: "CANONICAL_STATE_ALREADY_CONVERGED" }),
      },
    });
    return;
  }
  if (repairs.length) {
    await tx.marketActivationEvent.create({
      data: {
        ...common,
        sequence: ++sequence,
        type: MarketActivationEventType.RECONCILED,
        status: activation.status,
        metadata: json({ repairs }),
      },
    });
  }
  const type = activation.status === "ACTIVE"
    ? MarketActivationEventType.ACTIVATED
    : activation.status === "DISABLED"
      ? MarketActivationEventType.DISABLED
      : activation.status === "PREPARING"
        ? MarketActivationEventType.PREPARING
        : MarketActivationEventType.BLOCKED_EXTERNAL;
  await tx.marketActivationEvent.create({
    data: {
      ...common,
      sequence: ++sequence,
      type,
      status: activation.status,
      metadata: json(blocker ? { blocker } : { redirectSlugId: activation.redirectSlugId, primaryTrackingLinkId: activation.primaryTrackingLinkId }),
    },
  });
}

function canonicalOutcomeUnchanged(current: MarketActivation, data: ReturnType<typeof activationData>) {
  return current.casinoId === data.casinoId
    && current.countryCode === data.countryCode
    && current.product === data.product
    && current.desiredState === data.desiredState
    && current.status === data.status
    && current.marketProfileId === data.marketProfileId
    && current.affiliateOfferId === data.affiliateOfferId
    && current.primaryTrackingLinkId === data.primaryTrackingLinkId
    && current.redirectSlugId === data.redirectSlugId
    && current.casinoBonusId === data.casinoBonusId
    && JSON.stringify(current.globalFallbackBlockedCountries) === JSON.stringify(data.globalFallbackBlockedCountries)
    && current.controllerVersion === data.controllerVersion
    && current.reconciliationFingerprint === data.reconciliationFingerprint
    && current.externalBlockerCode === data.externalBlockerCode
    && current.externalBlockerDetail === data.externalBlockerDetail
    && current.externalBlockerSource === data.externalBlockerSource;
}

export class MarketActivationRepository {
  async apply(intent: NormalizedMarketActivationIntent, now = new Date()): Promise<MarketActivationApplyResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        return await prisma.$transaction((tx) => this.applyInTransaction(tx, intent, now), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        lastError = error;
        if (!["P2002", "P2034"].includes(errorCode(error) ?? "") || attempt === 4) throw error;
      }
    }
    throw lastError;
  }

  async recordRouteVerification(
    activationId: string,
    expectedVersion: number,
    verification: MarketActivationRouteVerificationResult,
  ): Promise<MarketActivationApplyResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const current = await tx.marketActivation.findUnique({ where: { id: activationId } });
          if (!current) throw new Error("MARKET_ACTIVATION_NOT_FOUND");
          if (current.version !== expectedVersion) throw new Error("MARKET_ACTIVATION_VERIFICATION_STALE");
          if (current.desiredState !== "ACTIVE" || !current.primaryTrackingLinkId) {
            throw new Error("MARKET_ACTIVATION_VERIFICATION_NOT_APPLICABLE");
          }
          if (snapshotMetadata(current.diagnostics).internalPending) {
            throw new Error("MARKET_ACTIVATION_INTERNAL_PREPARATION_INCOMPLETE");
          }
          const healthy = verification.status === "HEALTHY";
          await tx.affiliateTrackingLink.update({
            where: { id: current.primaryTrackingLinkId },
            data: {
              lastCheckedAt: verification.checkedAt,
              ...(healthy ? { verifiedAt: verification.checkedAt } : {}),
              updatedBy: MARKET_ACTIVATION_CONTROLLER_VERSION,
            },
          });
          const compatibility = await tx.affiliateTrackingLinkCountry.updateMany({
            where: { trackingLinkId: current.primaryTrackingLinkId, countryCode: current.countryCode },
            data: {
              productionEligible: healthy,
              productionEligibilityVerifiedAt: verification.checkedAt,
              productionEligibilityExpiresAt: healthy ? null : verification.checkedAt,
            },
          });
          if (compatibility.count !== 1) throw new Error("MARKET_ACTIVATION_TRACKING_COUNTRY_PROJECTION_MISSING");

          const previousStatus = current.status;
          const diagnostics = snapshotMetadata(current.diagnostics);
          const data = {
            status: healthy ? MarketActivationStatus.ACTIVE : MarketActivationStatus.BLOCKED_EXTERNAL,
            version: current.version + 1,
            activatedAt: healthy ? current.activatedAt ?? verification.checkedAt : current.activatedAt,
            blockedAt: healthy ? null : verification.checkedAt,
            lastReconciledAt: verification.checkedAt,
            routeVerificationStatus: verification.status,
            routeLastCheckedAt: verification.checkedAt,
            routeFinalHost: verification.finalHost,
            routeVerificationDetail: verification.reason,
            externalBlockerCode: healthy ? null : `ROUTE_VERIFICATION_${verification.status}`,
            externalBlockerDetail: healthy ? null : verification.reason,
            externalBlockerSource: healthy ? null : "AffiliateRouteHealth",
            diagnostics: json({
              ...diagnostics,
              routeVerification: {
                status: verification.status,
                reason: verification.reason,
                checkedAt: verification.checkedAt,
                method: verification.method,
                statusCode: verification.statusCode,
                durationMs: verification.durationMs,
                redirectCount: verification.redirectCount,
                finalHost: verification.finalHost,
              },
            }),
            updatedAt: verification.checkedAt,
          };
          const changed = await tx.marketActivation.updateMany({
            where: { id: current.id, version: current.version },
            data,
          });
          if (changed.count !== 1) throw new Error("MARKET_ACTIVATION_VERIFICATION_STALE");
          const latestIntent = await tx.marketActivationIntent.findFirst({
            where: { activationId: current.id },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          });
          const maximum = await tx.marketActivationEvent.aggregate({
            where: { activationId: current.id },
            _max: { sequence: true },
          });
          await tx.marketActivationEvent.create({ data: {
            activationId: current.id,
            intentId: latestIntent?.id ?? null,
            sequence: (maximum._max.sequence ?? 0) + 1,
            type: healthy ? MarketActivationEventType.ACTIVATED : MarketActivationEventType.BLOCKED_EXTERNAL,
            previousDesiredState: current.desiredState,
            previousStatus,
            desiredState: current.desiredState,
            status: data.status,
            actorId: latestIntent?.actorId ?? current.requestedBy,
            origin: latestIntent?.origin ?? "SYSTEM",
            reason: healthy ? "Bound route passed current external verification." : "Bound route failed current external verification.",
            controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
            metadata: json({
              verificationStatus: verification.status,
              reason: verification.reason,
              method: verification.method,
              statusCode: verification.statusCode,
              durationMs: verification.durationMs,
              redirectCount: verification.redirectCount,
              finalHost: verification.finalHost,
            }),
            occurredAt: verification.checkedAt,
          } });
          return {
            idempotent: false,
            activation: await tx.marketActivation.findUniqueOrThrow({ where: { id: current.id }, include: activationResultInclude }),
          };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        lastError = error;
        if (!["P2002", "P2034"].includes(errorCode(error) ?? "") || attempt === 4) throw error;
      }
    }
    throw lastError;
  }

  private async applyInTransaction(tx: Transaction, intent: NormalizedMarketActivationIntent, now: Date): Promise<MarketActivationApplyResult> {
    const priorIntent = await tx.marketActivationIntent.findUnique({
      where: { idempotencyKey: intent.idempotencyKey },
      include: { activation: { include: activationResultInclude } },
    });
    if (priorIntent) {
      if (priorIntent.payloadHash !== intent.payloadHash) throw new Error("MARKET_ACTIVATION_IDEMPOTENCY_CONFLICT");
      return { idempotent: true, activation: priorIntent.activation };
    }

    const casino = await tx.casino.findFirst({
      where: intent.casinoId ? { id: intent.casinoId } : { slug: intent.casinoSlug! },
      select: {
        id: true,
        slug: true,
        status: true,
        domainPublicationStatus: true,
        archivedAt: true,
        countries: {
          where: { countryCode: intent.countryCode },
          take: 1,
          select: {
            id: true,
            casinoId: true,
            countryCode: true,
            availability: true,
            localDomain: true,
            localWebsiteUrl: true,
            primaryLanguage: true,
            primaryCurrency: true,
            lastVerifiedAt: true,
            evidence: { select: { classification: true, fieldKeys: true } },
            _count: { select: { licenses: true, paymentMethods: true } },
          },
        },
        versions: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1, select: { id: true, version: true } },
      },
    });
    if (!casino) throw new Error("MARKET_ACTIVATION_CASINO_NOT_FOUND");

    const existing = await tx.marketActivation.findUnique({
      where: { casinoId_countryCode_product: { casinoId: casino.id, countryCode: intent.countryCode, product: intent.product } },
    });
    if (intent.expectedVersion !== null && (existing?.version ?? 0) !== intent.expectedVersion) {
      throw new Error("MARKET_ACTIVATION_VERSION_CONFLICT");
    }

    if (intent.desiredState === "DISABLED") {
      return this.disableInTransaction(tx, intent, casino, existing, now);
    }

    const globalFallback = intent.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE;
    const marketProfile = globalFallback ? null : casino.countries[0] ?? null;
    const routeSelector = intent.redirectSlugId
      ? { id: intent.redirectSlugId }
      : intent.redirectSlug
        ? { slug: intent.redirectSlug }
        : existing?.redirectSlugId
          ? { id: existing.redirectSlugId }
          : null;
    const redirect = routeSelector
      ? await tx.affiliateRedirectSlug.findFirst({ where: routeSelector, include: {
          affiliateOffer: { include: {
            countries: true,
            program: { include: { network: true } },
            trackingLinks: { include: { countries: true }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }] },
          } },
        } })
      : await tx.affiliateRedirectSlug.findFirst({
          where: { casinoId: casino.id, affiliateOfferId: { not: null } },
          orderBy: [{ active: "desc" }, { createdAt: "asc" }, { id: "asc" }],
          include: {
            affiliateOffer: { include: {
              countries: true,
              program: { include: { network: true } },
              trackingLinks: { include: { countries: true }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }] },
            } },
          },
        });
    const offer = redirect?.affiliateOffer ?? null;
    const selectedTrackingId = intent.primaryTrackingLinkId ?? null;
    const tracking = selectedTrackingId
      ? offer?.trackingLinks.find((entry) => entry.id === selectedTrackingId) ?? null
      : globalFallback && offer
        ? offer.trackingLinks.find((entry) => founderGlobalPartnerRoutePolicy({
            programMetadata: offer.program.metadata,
            programSupportedCountries: offer.program.supportedCountries,
            offerGeoMode: offer.geoMode,
            offerCountries: offer.countries,
            trackingMetadata: entry.metadata,
            trackingGeoMode: entry.geoMode,
            trackingCountries: entry.countries,
          })) ?? null
        : offer && marketProfile
        ? selectActivationTrackingCandidate({
            candidates: offer.trackingLinks,
            countryCode: intent.countryCode,
            localWebsiteUrl: marketProfile.localWebsiteUrl,
            localDomain: marketProfile.localDomain,
            existingTrackingId: existing?.primaryTrackingLinkId ?? null,
          })
        : offer?.trackingLinks.find((entry) => entry.id === existing?.primaryTrackingLinkId)
          ?? offer?.trackingLinks.find((entry) => entry.countries.some((country) => country.countryCode === intent.countryCode && country.mode === "ALLOW"))
          ?? null;
    const trackingCountry = tracking?.countries.find((entry) => entry.countryCode === intent.countryCode) ?? null;
    const offerCountry = offer?.countries.find((entry) => entry.countryCode === intent.countryCode) ?? null;
    const evidence = trackingCountry?.productionEligibilityEvidence?.trim() || (tracking ? globalEvidence(tracking.metadata) : "");
    const globalFallbackPolicy = globalFallback && offer && tracking ? founderGlobalPartnerRoutePolicy({
      programMetadata: offer.program.metadata,
      programSupportedCountries: offer.program.supportedCountries,
      offerGeoMode: offer.geoMode,
      offerCountries: offer.countries,
      trackingMetadata: tracking.metadata,
      trackingGeoMode: tracking.geoMode,
      trackingCountries: tracking.countries,
    }) : null;
    const globalRouteAllowed = Boolean(globalFallbackPolicy);

    let blocker: ExternalBlocker | null = null;
    let internalPending: InternalPending | null = null;
    if (casino.archivedAt) internalPending = { code: "CASINO_RESTORE_PENDING", detail: "The internally archived Casino projection must be restored under the current desired state.", source: "Casino.archivedAt" };
    else if (!marketProfile && !globalFallback) internalPending = { code: "MARKET_PROFILE_PENDING", detail: `The exact ${intent.countryCode} market profile must be ingested from evidence before finalization.`, source: "CasinoCountry" };
    else if (marketProfile && marketEvidenceBlocksActivation(marketProfile.evidence)) blocker = { code: "MARKET_EVIDENCE_CONTRADICTION", detail: "The exact market profile contains a runtime-critical contradiction.", source: "CasinoCountryEvidence" };
    else if (marketProfile && ["RESTRICTED", "NOT_AVAILABLE"].includes(marketProfile.availability)) blocker = { code: "MARKET_UNAVAILABLE", detail: `The exact market profile is ${marketProfile.availability}.`, source: "CasinoCountry.availability" };
    else if (!casino.versions.length) internalPending = { code: "PUBLIC_PROJECTION_PENDING", detail: "The evidence-backed Casino draft must be projected through the existing publication workflow.", source: "CasinoVersion" };
    else if (!redirect) blocker = { code: "AFFILIATE_DESTINATION_MISSING", detail: "No evidenced affiliate destination is available through a canonical route.", source: "AffiliateRedirectSlug" };
    else if (redirect.casinoId !== casino.id) throw new Error("MARKET_ACTIVATION_REDIRECT_CASINO_MISMATCH");
    else if (!offer) blocker = { code: "AFFILIATE_OFFER_MISSING", detail: "The selected redirect has no stored affiliate offer.", source: "AffiliateRedirectSlug.affiliateOfferId" };
    else if (intent.affiliateOfferId && offer.id !== intent.affiliateOfferId) throw new Error("MARKET_ACTIVATION_AFFILIATE_OFFER_MISMATCH");
    else if (offer.casinoId !== casino.id || offer.program.casinoId !== casino.id) throw new Error("MARKET_ACTIVATION_COMMERCIAL_IDENTITY_MISMATCH");
    else if (offer.archivedAt || offer.program.archivedAt || offer.program.network.archivedAt) internalPending = { code: "COMMERCIAL_SOURCE_RESTORE_PENDING", detail: "An internally archived commercial projection must be reconciled before route verification.", source: "AffiliateNetwork/AffiliateProgram/AffiliateOffer" };
    else if (offer.expiresAt && offer.expiresAt <= now) blocker = { code: "OFFER_EXPIRED", detail: "The evidenced affiliate offer has expired.", source: "AffiliateOffer.expiresAt" };
    else if (offer.startAt && offer.startAt > now) blocker = { code: "OFFER_NOT_YET_VALID", detail: "The evidenced affiliate offer is not yet valid.", source: "AffiliateOffer.startAt" };
    else if (!tracking) blocker = { code: "TRACKING_LINK_MISSING", detail: intent.primaryTrackingLinkId
      ? "The requested evidenced tracking link is not bound to the selected offer."
      : `No exact ${intent.countryCode} tracking link is stored for the selected offer.`, source: "AffiliateTrackingLinkCountry" };
    else if (tracking.offerId !== offer.id) throw new Error("MARKET_ACTIVATION_TRACKING_OFFER_MISMATCH");
    else if (tracking.archivedAt) internalPending = { code: "TRACKING_LINK_RESTORE_PENDING", detail: "The internally archived evidenced route must be reconciled before verification.", source: "AffiliateTrackingLink.archivedAt" };
    else if (tracking.expiresAt && tracking.expiresAt <= now) blocker = { code: "TRACKING_LINK_EXPIRED", detail: "The evidenced tracking link has expired.", source: "AffiliateTrackingLink.expiresAt" };
    else if (tracking.validFrom && tracking.validFrom > now) blocker = { code: "TRACKING_LINK_NOT_YET_VALID", detail: "The evidenced tracking link is not yet valid.", source: "AffiliateTrackingLink.validFrom" };
    else if (!safeActivationDestination(tracking.destinationUrl) || !safeActivationDestination(tracking.trackingUrl)) blocker = { code: "UNSAFE_TRACKING_DESTINATION", detail: "The stored destination is not a credential-free HTTPS URL.", source: "AffiliateTrackingLink" };
    else if (globalFallback && !globalRouteAllowed) blocker = { code: "GLOBAL_FALLBACK_AUTHORITY_MISSING", detail: "The route does not carry the complete evidenced global-default authority and GEO policy.", source: "AffiliateProgram/AffiliateTrackingLink.metadata" };
    else if (trackingCountry?.mode === "BLOCK") blocker = { code: "TRACKING_MARKET_BLOCKED", detail: `The evidenced tracking record explicitly blocks ${intent.countryCode}.`, source: "AffiliateTrackingLinkCountry.mode" };
    else if (!evidence) blocker = { code: "TRACKING_EVIDENCE_MISSING", detail: "No source reference is attached to the stored exact-market destination.", source: "AffiliateTrackingLinkCountry.productionEligibilityEvidence" };

    const fingerprint = reconciliationFingerprint({
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      desiredState: intent.desiredState,
      casinoId: casino.id,
      countryCode: intent.countryCode,
      product: intent.product,
      marketProfileId: marketProfile?.id ?? null,
      marketAvailability: marketProfile?.availability ?? null,
      publishedVersion: casino.versions[0]?.version ?? null,
      affiliateOfferId: offer?.id ?? null,
      offerStartAt: offer?.startAt?.toISOString() ?? null,
      offerExpiresAt: offer?.expiresAt?.toISOString() ?? null,
      primaryTrackingLinkId: tracking?.id ?? null,
      trackingDestinationHash: tracking ? reconciliationFingerprint(tracking.destinationUrl) : null,
      trackingUrlHash: tracking ? reconciliationFingerprint(tracking.trackingUrl) : null,
      trackingValidFrom: tracking?.validFrom?.toISOString() ?? null,
      trackingExpiresAt: tracking?.expiresAt?.toISOString() ?? null,
      redirectSlugId: redirect?.id ?? null,
      evidence: evidence || null,
      globalFallbackBlockedCountries: globalFallbackPolicy?.blockedCountries ?? [],
      internalPending,
      externalBlocker: blocker,
    });
    const compatibilityActive = Boolean(
      !blocker
      && !internalPending
      && existing?.status === "ACTIVE"
      && existing.routeVerificationStatus === "HEALTHY"
      && existing.reconciliationFingerprint === fingerprint,
    );
    const repairs: string[] = [];
    if (!blocker && redirect && offer && tracking && (marketProfile || globalFallback)) {
      if (!offer.program.network.active) {
        await tx.affiliateNetwork.update({ where: { id: offer.program.networkId }, data: { active: true, updatedBy: intent.actorId } });
        repairs.push("AFFILIATE_NETWORK_ACTIVE");
      }
      const supportedCountries = globalFallback
        ? [...offer.program.supportedCountries].map((entry) => entry.toUpperCase()).sort()
        : appendUnique(offer.program.supportedCountries.map((entry) => entry.toUpperCase()), intent.countryCode).sort();
      if (offer.program.status !== "ACTIVE" || offer.program.workflowStatus !== "PUBLISHED" || lifecycleInactive(offer.program.domainLifecycleStatus)
        || JSON.stringify(supportedCountries) !== JSON.stringify([...offer.program.supportedCountries].map((entry) => entry.toUpperCase()).sort())) {
        await tx.affiliateProgram.update({ where: { id: offer.program.id }, data: {
          status: "ACTIVE",
          workflowStatus: "PUBLISHED",
          domainLifecycleStatus: lifecycleInactive(offer.program.domainLifecycleStatus) ? "ACTIVE" : offer.program.domainLifecycleStatus,
          supportedCountries,
          updatedBy: intent.actorId,
        } });
        repairs.push("AFFILIATE_PROGRAM_COMPATIBILITY_PROJECTED");
      }
      if (offer.status !== "ACTIVE" || (!globalFallback && offer.geoMode !== "ALLOW") || lifecycleInactive(offer.domainLifecycleStatus)) {
        await tx.affiliateOfferRevision.create({ data: {
          offerId: offer.id,
          revisionNumber: await nextRevision(tx, "offer", offer.id),
          snapshot: json(offer),
          summary: `Before ${MARKET_ACTIVATION_CONTROLLER_VERSION} compatibility projection`,
          createdBy: intent.actorId,
        } });
        await tx.affiliateOffer.update({ where: { id: offer.id }, data: {
          status: "ACTIVE",
          geoMode: globalFallback ? offer.geoMode : "ALLOW",
          domainLifecycleStatus: lifecycleInactive(offer.domainLifecycleStatus) ? "ACTIVE" : offer.domainLifecycleStatus,
          updatedBy: intent.actorId,
        } });
        repairs.push("AFFILIATE_OFFER_COMPATIBILITY_PROJECTED");
      }
      if (!globalFallback && !offerCountry) {
        await tx.affiliateOfferCountry.create({ data: { offerId: offer.id, countryCode: intent.countryCode, mode: "ALLOW" } });
        repairs.push("AFFILIATE_OFFER_COUNTRY_PROJECTED");
      } else if (!globalFallback && offerCountry && offerCountry.mode !== "ALLOW") {
        await tx.affiliateOfferCountry.update({ where: { id: offerCountry.id }, data: { mode: "ALLOW" } });
        repairs.push("AFFILIATE_OFFER_COUNTRY_PROJECTED");
      }
      if (tracking.active !== true || (!globalFallback && tracking.geoMode !== "ALLOW")) {
        await tx.affiliateTrackingLinkRevision.create({ data: {
          trackingLinkId: tracking.id,
          revisionNumber: await nextRevision(tx, "tracking", tracking.id),
          destinationUrl: tracking.destinationUrl,
          trackingUrl: tracking.trackingUrl,
          summary: `Before ${MARKET_ACTIVATION_CONTROLLER_VERSION} compatibility projection`,
          createdBy: intent.actorId,
        } });
        await tx.affiliateTrackingLink.update({ where: { id: tracking.id }, data: {
          active: true,
          geoMode: globalFallback ? tracking.geoMode : "ALLOW",
          updatedBy: intent.actorId,
        } });
        repairs.push("TRACKING_LINK_COMPATIBILITY_PROJECTED");
      }
      const projectionNote = `${MARKET_ACTIVATION_CONTROLLER_VERSION} compatibility projection`;
      const projectionNotes = trackingCountry?.productionEligibilityNotes?.includes(projectionNote)
        ? trackingCountry.productionEligibilityNotes
        : [trackingCountry?.productionEligibilityNotes, projectionNote].filter(Boolean).join("; ");
      const trackingProjectionChanged = !trackingCountry
        || trackingCountry.mode !== "ALLOW"
        || trackingCountry.productionEligible !== compatibilityActive
        || (compatibilityActive && trackingCountry.productionEligibilityExpiresAt !== null)
        || trackingCountry.productionEligibilityEvidence !== evidence
        || trackingCountry.productionEligibilityNotes !== projectionNotes;
      if (trackingProjectionChanged) {
        await tx.affiliateTrackingLinkCountry.upsert({
          where: { trackingLinkId_countryCode: { trackingLinkId: tracking.id, countryCode: intent.countryCode } },
          create: {
            trackingLinkId: tracking.id,
            countryCode: intent.countryCode,
            mode: "ALLOW",
            productionEligible: compatibilityActive,
            productionEligibilityVerifiedAt: compatibilityActive ? existing?.routeLastCheckedAt ?? now : null,
            productionEligibilityEvidence: evidence,
            productionEligibilityNotes: projectionNote,
          },
          update: {
            mode: "ALLOW",
            productionEligible: compatibilityActive,
            productionEligibilityVerifiedAt: compatibilityActive
              ? existing?.routeLastCheckedAt ?? now
              : trackingCountry?.productionEligibilityVerifiedAt,
            productionEligibilityExpiresAt: compatibilityActive ? null : trackingCountry?.productionEligibilityExpiresAt,
            productionEligibilityEvidence: evidence,
            productionEligibilityNotes: projectionNotes,
          },
        });
        repairs.push("TRACKING_COUNTRY_COMPATIBILITY_PROJECTED");
      }
      const disabledAlternates = await tx.affiliateTrackingLinkCountry.updateMany({
        where: {
          countryCode: intent.countryCode,
          trackingLinkId: { not: tracking.id },
          trackingLink: { offerId: offer.id },
          productionEligible: true,
        },
        data: { productionEligible: false, productionEligibilityExpiresAt: now },
      });
      if (disabledAlternates.count) repairs.push("ALTERNATE_TRACKING_COMPATIBILITY_DISABLED");
      if (!redirect.active || redirect.archivedAt || redirect.affiliateOfferId !== offer.id) {
        await tx.affiliateRedirectRevision.create({ data: {
          redirectSlugId: redirect.id,
          revisionNumber: await nextRevision(tx, "redirect", redirect.id),
          snapshot: json(redirect),
          summary: `Before ${MARKET_ACTIVATION_CONTROLLER_VERSION} compatibility projection`,
          createdBy: intent.actorId,
        } });
        await tx.affiliateRedirectSlug.update({ where: { id: redirect.id }, data: {
          active: true,
          archivedAt: null,
          affiliateOfferId: offer.id,
          updatedBy: intent.actorId,
        } });
        repairs.push("REDIRECT_COMPATIBILITY_PROJECTED");
      }
    } else if (tracking) {
      await tx.affiliateTrackingLinkCountry.updateMany({
        where: { trackingLinkId: tracking.id, countryCode: intent.countryCode, productionEligible: true },
        data: { productionEligible: false, productionEligibilityExpiresAt: now },
      });
    }
    const diagnostics = json({
      classification: "DETECTED",
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      publicIdentity: { publishedSnapshot: Boolean(casino.versions.length), casinoStatus: casino.status, domainPublicationStatus: casino.domainPublicationStatus },
      activationScope: globalFallback ? "GLOBAL_FALLBACK" : "EXACT_COUNTRY",
      marketProfile: marketProfile ? {
        availability: marketProfile.availability,
        licenceRecords: marketProfile._count.licenses,
        paymentRecords: marketProfile._count.paymentMethods,
        lastVerifiedAt: marketProfile.lastVerifiedAt,
        unknownFields: [!marketProfile.primaryLanguage && "primaryLanguage", !marketProfile.primaryCurrency && "primaryCurrency"].filter(Boolean),
      } : null,
      binding: { redirectSlug: redirect?.slug ?? null, evidenceReference: evidence || null },
      internalRepairs: repairs,
      internalPending,
      externalBlocker: blocker,
      legacyFieldsAreCompatibilityProjection: true,
    });
    const data = activationData({
      current: existing,
      intent,
      casinoId: casino.id,
      marketProfileId: marketProfile?.id ?? null,
      affiliateOfferId: offer?.id ?? null,
      primaryTrackingLinkId: tracking?.id ?? null,
      redirectSlugId: redirect?.id ?? null,
      casinoBonusId: redirect?.casinoBonusId ?? offer?.casinoBonusId ?? null,
      globalFallbackBlockedCountries: globalFallbackPolicy?.blockedCountries ?? [],
      blocker,
      internalPending,
      diagnostics,
      reconciliationFingerprint: fingerprint,
      now,
    });
    const noOp = Boolean(existing && repairs.length === 0 && canonicalOutcomeUnchanged(existing, data));
    const activation = noOp
      ? existing!
      : existing
        ? await this.optimisticUpdate(tx, existing, data)
        : await tx.marketActivation.create({ data });
    const storedIntent = await tx.marketActivationIntent.create({ data: {
      activationId: activation.id,
      idempotencyKey: intent.idempotencyKey,
      desiredState: intent.desiredState,
      origin: intent.origin,
      actorId: intent.actorId,
      reason: intent.reason,
      sourceReferences: intent.sourceReferences,
      payloadHash: intent.payloadHash,
      createdAt: now,
    } });
    await recordEvents(tx, activation, storedIntent.id, intent, existing, repairs, blocker, now, noOp);
    return { idempotent: false, activation: await tx.marketActivation.findUniqueOrThrow({ where: { id: activation.id }, include: activationResultInclude }) };
  }

  private async disableInTransaction(
    tx: Transaction,
    intent: NormalizedMarketActivationIntent,
    casino: { id: string; slug: string },
    existing: MarketActivation | null,
    now: Date,
  ): Promise<MarketActivationApplyResult> {
    const repairs: string[] = [];
    if (existing?.affiliateOfferId) {
      const projection = await tx.affiliateTrackingLinkCountry.updateMany({
        where: { countryCode: intent.countryCode, productionEligible: true, trackingLink: { offerId: existing.affiliateOfferId } },
        data: { productionEligible: false, productionEligibilityExpiresAt: now },
      });
      if (projection.count) repairs.push("TRACKING_COUNTRY_COMPATIBILITY_DISABLED");
    }
    const fingerprint = reconciliationFingerprint({
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      desiredState: intent.desiredState,
      casinoId: casino.id,
      countryCode: intent.countryCode,
      product: intent.product,
      marketProfileId: existing?.marketProfileId ?? null,
      affiliateOfferId: existing?.affiliateOfferId ?? null,
      primaryTrackingLinkId: existing?.primaryTrackingLinkId ?? null,
      redirectSlugId: existing?.redirectSlugId ?? null,
      globalFallbackBlockedCountries: existing?.globalFallbackBlockedCountries ?? [],
    });
    const diagnostics = json({
      classification: "DETECTED",
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      disabledByIntent: true,
      legacyFieldsAreCompatibilityProjection: true,
    });
    const data = activationData({
      current: existing,
      intent,
      casinoId: casino.id,
      marketProfileId: existing?.marketProfileId ?? null,
      affiliateOfferId: existing?.affiliateOfferId ?? null,
      primaryTrackingLinkId: existing?.primaryTrackingLinkId ?? null,
      redirectSlugId: existing?.redirectSlugId ?? null,
      casinoBonusId: existing?.casinoBonusId ?? null,
      globalFallbackBlockedCountries: existing?.globalFallbackBlockedCountries ?? [],
      blocker: null,
      internalPending: null,
      diagnostics,
      reconciliationFingerprint: fingerprint,
      now,
    });
    const noOp = Boolean(existing && repairs.length === 0 && canonicalOutcomeUnchanged(existing, data));
    const activation = noOp
      ? existing!
      : existing
        ? await this.optimisticUpdate(tx, existing, data)
        : await tx.marketActivation.create({ data });
    const storedIntent = await tx.marketActivationIntent.create({ data: {
      activationId: activation.id,
      idempotencyKey: intent.idempotencyKey,
      desiredState: intent.desiredState,
      origin: intent.origin,
      actorId: intent.actorId,
      reason: intent.reason,
      sourceReferences: intent.sourceReferences,
      payloadHash: intent.payloadHash,
      createdAt: now,
    } });
    await recordEvents(tx, activation, storedIntent.id, intent, existing, repairs, null, now, noOp);
    return { idempotent: false, activation: await tx.marketActivation.findUniqueOrThrow({ where: { id: activation.id }, include: activationResultInclude }) };
  }

  private async optimisticUpdate(tx: Transaction, current: MarketActivation, data: ReturnType<typeof activationData>) {
    const changed = await tx.marketActivation.updateMany({ where: { id: current.id, version: current.version }, data });
    if (changed.count !== 1) throw new Error("MARKET_ACTIVATION_VERSION_CONFLICT");
    return tx.marketActivation.findUniqueOrThrow({ where: { id: current.id } });
  }
}

export const marketActivationRepository = new MarketActivationRepository();
