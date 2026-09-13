import { createHash } from "node:crypto";

import {
  MarketActivationEventType,
  MarketActivationStatus,
  Prisma,
  type MarketActivation,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { canonicalCommercialMarketKey } from "@/lib/jurisdiction/canonical-commercial-market";

import {
  MARKET_ACTIVATION_CONTROLLER_VERSION,
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

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : null;
}

function snapshotMetadata(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function reconciliationFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
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
    marketCode: input.intent.marketCode,
    product: input.intent.product,
    desiredState: input.intent.desiredState,
    status,
    marketProfileId: input.marketProfileId,
    affiliateOfferId: input.affiliateOfferId,
    primaryTrackingLinkId: input.primaryTrackingLinkId,
    redirectSlugId: input.redirectSlugId,
    casinoBonusId: input.casinoBonusId,
    globalFallbackBlockedCountries: input.intent.desiredState === "DISABLED"
      ? input.current?.globalFallbackBlockedCountries ?? []
      : [],
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
      metadata: json(blocker
        ? { blocker }
        : { redirectSlugId: activation.redirectSlugId, primaryTrackingLinkId: activation.primaryTrackingLinkId }),
    },
  });
}

function canonicalOutcomeUnchanged(current: MarketActivation, data: ReturnType<typeof activationData>) {
  return current.casinoId === data.casinoId
    && current.countryCode === data.countryCode
    && current.marketCode === data.marketCode
    && current.product === data.product
    && current.desiredState === data.desiredState
    && current.status === data.status
    && current.marketProfileId === data.marketProfileId
    && current.affiliateOfferId === data.affiliateOfferId
    && current.primaryTrackingLinkId === data.primaryTrackingLinkId
    && current.redirectSlugId === data.redirectSlugId
    && current.casinoBonusId === data.casinoBonusId
    && current.globalFallbackBlockedCountries.length === data.globalFallbackBlockedCountries.length
    && current.globalFallbackBlockedCountries.every(
      (countryCode, index) => countryCode === data.globalFallbackBlockedCountries[index],
    )
    && current.controllerVersion === data.controllerVersion
    && current.reconciliationFingerprint === data.reconciliationFingerprint
    && current.externalBlockerCode === data.externalBlockerCode
    && current.externalBlockerDetail === data.externalBlockerDetail
    && current.externalBlockerSource === data.externalBlockerSource;
}

export class MarketActivationRepository {
  async apply(intent: NormalizedMarketActivationIntent, now = new Date()): Promise<MarketActivationApplyResult> {
    let lastError: unknown;
    const retryLimit = 6;
    for (let attempt = 1; attempt <= retryLimit; attempt += 1) {
      try {
        return await prisma.$transaction((tx) => this.applyInTransaction(tx, intent, now), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        lastError = error;
        if (!["P2002", "P2034"].includes(errorCode(error) ?? "") || attempt === retryLimit) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 25));
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
    const retryLimit = 6;
    for (let attempt = 1; attempt <= retryLimit; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const current = await tx.marketActivation.findUnique({ where: { id: activationId } });
          if (!current) throw new Error("MARKET_ACTIVATION_NOT_FOUND");
          if (current.version !== expectedVersion) throw new Error("MARKET_ACTIVATION_VERIFICATION_STALE");
          if (current.desiredState !== "ACTIVE" || !current.primaryTrackingLinkId) {
            throw new Error("MARKET_ACTIVATION_VERIFICATION_NOT_APPLICABLE");
          }
          const canonicalKey = canonicalCommercialMarketKey({
            countryCode: current.countryCode,
            marketCode: current.marketCode,
            trust: "TRUSTED",
          });
          if (!canonicalKey || canonicalKey !== current.marketCode) {
            throw new Error("MARKET_ACTIVATION_NON_CANONICAL_ROUTE");
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
        if (!["P2002", "P2034"].includes(errorCode(error) ?? "") || attempt === retryLimit) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 25));
      }
    }
    throw lastError;
  }

  private async applyInTransaction(
    tx: Transaction,
    intent: NormalizedMarketActivationIntent,
    now: Date,
  ): Promise<MarketActivationApplyResult> {
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
            primaryLanguage: true,
            primaryCurrency: true,
            lastVerifiedAt: true,
            evidence: { select: { classification: true, fieldKeys: true } },
            _count: { select: { licenses: true, paymentMethods: true } },
          },
        },
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true },
        },
      },
    });
    if (!casino) throw new Error("MARKET_ACTIVATION_CASINO_NOT_FOUND");

    const existing = await tx.marketActivation.findUnique({
      where: { casinoId_marketCode_product: { casinoId: casino.id, marketCode: intent.marketCode, product: intent.product } },
    });
    if (intent.expectedVersion !== null && (existing?.version ?? 0) !== intent.expectedVersion) {
      throw new Error("MARKET_ACTIVATION_VERSION_CONFLICT");
    }
    if (intent.desiredState === "DISABLED") {
      if (!existing) throw new Error("MARKET_ACTIVATION_ROUTE_NOT_FOUND");
      return this.disableInTransaction(tx, intent, casino, existing, now);
    }

    const marketProfile = casino.countries[0] ?? null;
    const [redirect, offer, tracking] = await Promise.all([
      intent.redirectSlugId
        ? tx.affiliateRedirectSlug.findUnique({ where: { id: intent.redirectSlugId } })
        : tx.affiliateRedirectSlug.findUnique({ where: { slug: intent.redirectSlug! } }),
      tx.affiliateOffer.findUnique({
        where: { id: intent.affiliateOfferId! },
        include: { program: { select: { casinoId: true } } },
      }),
      tx.affiliateTrackingLink.findUnique({ where: { id: intent.primaryTrackingLinkId! } }),
    ]);

    let blocker: ExternalBlocker | null = null;
    let internalPending: InternalPending | null = null;
    if (casino.archivedAt) {
      internalPending = { code: "CASINO_RESTORE_PENDING", detail: "The internally archived Casino projection must be restored under the current desired state.", source: "Casino.archivedAt" };
    } else if (marketProfile && marketEvidenceBlocksActivation(marketProfile.evidence)) {
      blocker = { code: "MARKET_EVIDENCE_CONTRADICTION", detail: "The factual market profile contains a runtime-critical contradiction.", source: "CasinoCountryEvidence" };
    } else if (marketProfile && ["RESTRICTED", "NOT_AVAILABLE"].includes(marketProfile.availability)) {
      blocker = { code: "MARKET_UNAVAILABLE", detail: `The factual market profile is ${marketProfile.availability}.`, source: "CasinoCountry.availability" };
    } else if (!casino.versions.length) {
      internalPending = { code: "PUBLIC_PROJECTION_PENDING", detail: "The evidence-backed Casino draft must be projected through the existing publication workflow.", source: "CasinoVersion" };
    } else if (!redirect) {
      blocker = { code: "AFFILIATE_DESTINATION_MISSING", detail: "The explicitly selected redirect does not exist.", source: "AffiliateRedirectSlug" };
    } else if (redirect.casinoId !== casino.id) {
      throw new Error("MARKET_ACTIVATION_REDIRECT_CASINO_MISMATCH");
    } else if (!offer) {
      blocker = { code: "AFFILIATE_OFFER_MISSING", detail: "The explicitly selected affiliate offer does not exist.", source: "AffiliateOffer" };
    } else if (offer.casinoId !== casino.id || offer.program.casinoId !== casino.id) {
      throw new Error("MARKET_ACTIVATION_COMMERCIAL_IDENTITY_MISMATCH");
    } else if (redirect.affiliateOfferId !== offer.id) {
      throw new Error("MARKET_ACTIVATION_REDIRECT_OFFER_MISMATCH");
    } else if (redirect.casinoBonusId !== offer.casinoBonusId) {
      throw new Error("MARKET_ACTIVATION_REDIRECT_BONUS_MISMATCH");
    } else if (!redirect.active || redirect.archivedAt) {
      internalPending = { code: "REDIRECT_RESTORE_PENDING", detail: "The explicitly selected controlled redirect is inactive or archived.", source: "AffiliateRedirectSlug" };
    } else if (offer.expiresAt && offer.expiresAt <= now) {
      blocker = { code: "OFFER_EXPIRED", detail: "The evidenced affiliate offer has expired.", source: "AffiliateOffer.expiresAt" };
    } else if (offer.startAt && offer.startAt > now) {
      blocker = { code: "OFFER_NOT_YET_VALID", detail: "The evidenced affiliate offer is not yet valid.", source: "AffiliateOffer.startAt" };
    } else if (!tracking) {
      blocker = { code: "TRACKING_LINK_MISSING", detail: "The explicitly selected tracking link does not exist.", source: "AffiliateTrackingLink" };
    } else if (tracking.offerId !== offer.id) {
      throw new Error("MARKET_ACTIVATION_TRACKING_OFFER_MISMATCH");
    } else if (tracking.expiresAt && tracking.expiresAt <= now) {
      blocker = { code: "TRACKING_LINK_EXPIRED", detail: "The evidenced tracking link has expired.", source: "AffiliateTrackingLink.expiresAt" };
    } else if (tracking.validFrom && tracking.validFrom > now) {
      blocker = { code: "TRACKING_LINK_NOT_YET_VALID", detail: "The evidenced tracking link is not yet valid.", source: "AffiliateTrackingLink.validFrom" };
    } else if (!safeActivationDestination(tracking.destinationUrl) || !safeActivationDestination(tracking.trackingUrl)) {
      blocker = { code: "UNSAFE_TRACKING_DESTINATION", detail: "The stored destination is not a credential-free HTTPS URL.", source: "AffiliateTrackingLink" };
    }

    const fingerprint = reconciliationFingerprint({
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      desiredState: intent.desiredState,
      casinoId: casino.id,
      countryCode: intent.countryCode,
      marketCode: intent.marketCode,
      product: intent.product,
      marketProfileId: marketProfile?.id ?? null,
      marketAvailability: marketProfile?.availability ?? null,
      publishedVersion: casino.versions[0]?.version ?? null,
      affiliateOfferId: offer?.id ?? intent.affiliateOfferId,
      offerStartAt: offer?.startAt?.toISOString() ?? null,
      offerExpiresAt: offer?.expiresAt?.toISOString() ?? null,
      primaryTrackingLinkId: tracking?.id ?? intent.primaryTrackingLinkId,
      trackingDestinationHash: tracking ? reconciliationFingerprint(tracking.destinationUrl) : null,
      trackingUrlHash: tracking ? reconciliationFingerprint(tracking.trackingUrl) : null,
      trackingValidFrom: tracking?.validFrom?.toISOString() ?? null,
      trackingExpiresAt: tracking?.expiresAt?.toISOString() ?? null,
      redirectSlugId: redirect?.id ?? intent.redirectSlugId,
      redirectActive: redirect?.active ?? null,
      redirectArchivedAt: redirect?.archivedAt?.toISOString() ?? null,
      evidence: intent.sourceReferences,
      internalPending,
      externalBlocker: blocker,
    });
    const diagnostics = json({
      classification: "DETECTED",
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      publicIdentity: {
        publishedSnapshot: Boolean(casino.versions.length),
        casinoStatus: casino.status,
        domainPublicationStatus: casino.domainPublicationStatus,
      },
      activationScope: "EXACT_CANONICAL_MARKET",
      marketProfile: marketProfile ? {
        availability: marketProfile.availability,
        licenceRecords: marketProfile._count.licenses,
        paymentRecords: marketProfile._count.paymentMethods,
        lastVerifiedAt: marketProfile.lastVerifiedAt,
        unknownFields: [!marketProfile.primaryLanguage && "primaryLanguage", !marketProfile.primaryCurrency && "primaryCurrency"].filter(Boolean),
      } : null,
      binding: {
        redirectSlug: redirect?.slug ?? null,
        evidenceReferences: intent.sourceReferences,
      },
      internalPending,
      externalBlocker: blocker,
      legacyGeoFieldsAreNonAuthoritative: true,
      legacyAffiliateLifecycleFieldsAreNonAuthoritative: true,
    });
    const data = activationData({
      current: existing,
      intent,
      casinoId: casino.id,
      marketProfileId: marketProfile?.id ?? null,
      affiliateOfferId: offer?.id ?? intent.affiliateOfferId,
      primaryTrackingLinkId: tracking?.id ?? intent.primaryTrackingLinkId,
      redirectSlugId: redirect?.id ?? intent.redirectSlugId,
      casinoBonusId: redirect?.casinoBonusId ?? offer?.casinoBonusId ?? null,
      blocker,
      internalPending,
      diagnostics,
      reconciliationFingerprint: fingerprint,
      now,
    });
    const noOp = Boolean(existing && canonicalOutcomeUnchanged(existing, data));
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
    await recordEvents(tx, activation, storedIntent.id, intent, existing, blocker, now, noOp);
    return {
      idempotent: false,
      activation: await tx.marketActivation.findUniqueOrThrow({ where: { id: activation.id }, include: activationResultInclude }),
    };
  }

  private async disableInTransaction(
    tx: Transaction,
    intent: NormalizedMarketActivationIntent,
    casino: { id: string; slug: string },
    existing: MarketActivation,
    now: Date,
  ): Promise<MarketActivationApplyResult> {
    const fingerprint = reconciliationFingerprint({
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      desiredState: intent.desiredState,
      casinoId: casino.id,
      countryCode: intent.countryCode,
      marketCode: intent.marketCode,
      product: intent.product,
      marketProfileId: existing.marketProfileId,
      affiliateOfferId: existing.affiliateOfferId,
      primaryTrackingLinkId: existing.primaryTrackingLinkId,
      redirectSlugId: existing.redirectSlugId,
    });
    const diagnostics = json({
      classification: "DETECTED",
      controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
      disabledByIntent: true,
      legacyGeoFieldsAreNonAuthoritative: true,
      legacyAffiliateLifecycleFieldsAreNonAuthoritative: true,
    });
    const data = activationData({
      current: existing,
      intent,
      casinoId: casino.id,
      marketProfileId: existing.marketProfileId,
      affiliateOfferId: existing.affiliateOfferId,
      primaryTrackingLinkId: existing.primaryTrackingLinkId,
      redirectSlugId: existing.redirectSlugId,
      casinoBonusId: existing.casinoBonusId,
      blocker: null,
      internalPending: null,
      diagnostics,
      reconciliationFingerprint: fingerprint,
      now,
    });
    const noOp = canonicalOutcomeUnchanged(existing, data);
    const activation = noOp
      ? existing
      : await this.optimisticUpdate(tx, existing, data);
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
    await recordEvents(tx, activation, storedIntent.id, intent, existing, null, now, noOp);
    return {
      idempotent: false,
      activation: await tx.marketActivation.findUniqueOrThrow({ where: { id: activation.id }, include: activationResultInclude }),
    };
  }

  private async optimisticUpdate(
    tx: Transaction,
    current: MarketActivation,
    data: ReturnType<typeof activationData>,
  ) {
    const changed = await tx.marketActivation.updateMany({ where: { id: current.id, version: current.version }, data });
    if (changed.count !== 1) throw new Error("MARKET_ACTIVATION_VERSION_CONFLICT");
    return tx.marketActivation.findUniqueOrThrow({ where: { id: current.id } });
  }
}

export const marketActivationRepository = new MarketActivationRepository();
