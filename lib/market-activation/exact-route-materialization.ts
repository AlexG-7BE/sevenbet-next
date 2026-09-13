import { createHash } from "node:crypto";

import {
  MarketActivationEventType,
  MarketActivationStatus,
  Prisma,
  type MarketActivation,
  type PrismaClient,
} from "@prisma/client";

import { canonicalCommercialMarketKey } from "@/lib/jurisdiction/canonical-commercial-market";

import { MARKET_ACTIVATION_CONTROLLER_VERSION } from "./contract";
import { inspectExactRouteReadiness } from "./exact-route-readiness";

export const EXACT_ROUTE_MATERIALIZATION_VERSION = "COMMERCIAL-CORE-PR3-EXACT-ROUTES-V1";

export const LEGACY_ZZ_MATERIALIZATION_MANIFEST = [
  { casinoSlug: "21-prive", marketCodes: ["IE", "MT"] },
  { casinoSlug: "diamond7", marketCodes: ["IE", "MT"] },
  { casinoSlug: "gday-casino", marketCodes: ["IE", "MT"] },
  { casinoSlug: "hello-casino", marketCodes: ["IE", "MT"] },
  { casinoSlug: "skol-casino", marketCodes: ["IE", "MT"] },
  { casinoSlug: "slotnite", marketCodes: ["IE", "MT"] },
] as const;

const MATERIALIZATION_SOURCE_REFERENCE = "GLOBAL-CURRENT-PARTNER-ROLLOUT-2026-09-10:EXACT-ROUTES";

type MaterializationDatabase = Pick<
  Prisma.TransactionClient,
  "marketActivation" | "casinoCountry"
>;

type LegacyRoute = Prisma.MarketActivationGetPayload<{
  include: { casino: { select: { slug: true } } };
}>;

type ExactRoute = MarketActivation;

export type ExactRouteMaterializationBlocker = Readonly<{
  code:
    | "UNPROVEN_ROUTE_MATERIALIZATION"
    | "LEGACY_ZZ_ROUTE_NOT_HEALTHY"
    | "LEGACY_ZZ_ROUTE_BINDING_INCOMPLETE"
    | "BLOCKED_TARGET_IN_MANIFEST"
    | "EXACT_ROUTE_CONFLICT";
  sourceRouteId: string;
  casinoSlug: string;
  marketCode: string | null;
  detail: string;
}>;

export type ExactRouteCreateOperation = Readonly<{
  sourceRouteId: string;
  targetRouteId: string;
  casinoId: string;
  casinoSlug: string;
  marketCode: string;
  countryCode: string;
  affiliateOfferId: string;
  primaryTrackingLinkId: string;
  redirectSlugId: string;
  casinoBonusId: string | null;
}>;

export type ExactRouteDisableOperation = Readonly<{
  sourceRouteId: string;
  casinoSlug: string;
}>;

export type ExactRouteMaterializationPlan = Readonly<{
  version: typeof EXACT_ROUTE_MATERIALIZATION_VERSION;
  mode: "PLAN";
  classification: "DETECTED";
  readyToApply: boolean;
  boundedByExplicitManifest: true;
  unboundedLegacyScopeInferred: false;
  before: { routeCount: number; activeLegacyZzCount: number };
  after: { routeCount: number; activeLegacyZzCount: number };
  create: ExactRouteCreateOperation[];
  disable: ExactRouteDisableOperation[];
  blockers: ExactRouteMaterializationBlocker[];
  semanticProjection: Array<{
    sourceRouteId: string;
    casinoSlug: string;
    marketCode: string;
    legacyRoutableWithinManifest: boolean;
    exactRoutableAfterPlan: boolean;
  }>;
}>;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function deterministicUuid(value: string) {
  const bytes = sha256(value).slice(0, 32).split("");
  bytes[12] = "4";
  bytes[16] = ((parseInt(bytes[16]!, 16) & 0x3) | 0x8).toString(16);
  const hash = bytes.join("");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function bindingComplete(route: LegacyRoute) {
  return Boolean(route.affiliateOfferId && route.primaryTrackingLinkId && route.redirectSlugId);
}

function bindingMatches(route: ExactRoute, operation: ExactRouteCreateOperation) {
  return route.affiliateOfferId === operation.affiliateOfferId
    && route.primaryTrackingLinkId === operation.primaryTrackingLinkId
    && route.redirectSlugId === operation.redirectSlugId
    && route.casinoBonusId === operation.casinoBonusId;
}

function canonicalManifestMarkets(casinoSlug: string) {
  const manifest = LEGACY_ZZ_MATERIALIZATION_MANIFEST.find((entry) => entry.casinoSlug === casinoSlug);
  if (!manifest) return null;
  return manifest.marketCodes.map((marketCode) => canonicalCommercialMarketKey({
    countryCode: marketCode.slice(0, 2),
    marketCode,
    trust: "TRUSTED",
  }));
}

export async function planExactRouteMaterialization(
  database: MaterializationDatabase,
): Promise<ExactRouteMaterializationPlan> {
  const [routeCount, legacyRoutes] = await Promise.all([
    database.marketActivation.count(),
    database.marketActivation.findMany({
      where: { marketCode: "ZZ", desiredState: "ACTIVE" },
      include: { casino: { select: { slug: true } } },
      orderBy: [{ casinoId: "asc" }, { id: "asc" }],
    }),
  ]);
  const create: ExactRouteCreateOperation[] = [];
  const disable: ExactRouteDisableOperation[] = [];
  const blockers: ExactRouteMaterializationBlocker[] = [];
  const semanticProjection: ExactRouteMaterializationPlan["semanticProjection"][number][] = [];

  for (const source of legacyRoutes) {
    const casinoSlug = source.casino.slug;
    const manifestMarkets = canonicalManifestMarkets(casinoSlug);
    if (!manifestMarkets || manifestMarkets.some((market) => !market)) {
      blockers.push({
        code: "UNPROVEN_ROUTE_MATERIALIZATION",
        sourceRouteId: source.id,
        casinoSlug,
        marketCode: null,
        detail: "No explicit approved exact-market manifest exists for this legacy fallback.",
      });
      continue;
    }
    if (source.status !== "ACTIVE" || source.routeVerificationStatus !== "HEALTHY" || !source.routeLastCheckedAt) {
      blockers.push({
        code: "LEGACY_ZZ_ROUTE_NOT_HEALTHY",
        sourceRouteId: source.id,
        casinoSlug,
        marketCode: null,
        detail: "Legacy fallback is not an ACTIVE + HEALTHY source that can be copied safely.",
      });
      continue;
    }
    if (!bindingComplete(source)) {
      blockers.push({
        code: "LEGACY_ZZ_ROUTE_BINDING_INCOMPLETE",
        sourceRouteId: source.id,
        casinoSlug,
        marketCode: null,
        detail: "Legacy fallback lacks an exact Offer, TrackingLink or RedirectSlug binding.",
      });
      continue;
    }

    const exactRoutes = await database.marketActivation.findMany({
      where: {
        casinoId: source.casinoId,
        product: source.product,
        marketCode: { in: manifestMarkets as string[] },
      },
      orderBy: [{ marketCode: "asc" }, { id: "asc" }],
    });
    for (const marketKey of manifestMarkets) {
      if (!marketKey) continue;
      const marketCode = String(marketKey);
      const operation: ExactRouteCreateOperation = {
        sourceRouteId: source.id,
        targetRouteId: deterministicUuid(EXACT_ROUTE_MATERIALIZATION_VERSION + ":route:" + source.id + ":" + marketCode),
        casinoId: source.casinoId,
        casinoSlug,
        marketCode,
        countryCode: marketCode.slice(0, 2),
        affiliateOfferId: source.affiliateOfferId!,
        primaryTrackingLinkId: source.primaryTrackingLinkId!,
        redirectSlugId: source.redirectSlugId!,
        casinoBonusId: source.casinoBonusId,
      };
      const blocked = source.globalFallbackBlockedCountries.includes(operation.countryCode);
      const existing = exactRoutes.filter((route) => route.marketCode === marketCode);
      let exactRoutableAfterPlan = true;
      if (blocked) {
        exactRoutableAfterPlan = false;
        blockers.push({
          code: "BLOCKED_TARGET_IN_MANIFEST",
          sourceRouteId: source.id,
          casinoSlug,
          marketCode,
          detail: "The explicit target is blocked by the legacy source and cannot be materialized.",
        });
      } else if (existing.length > 1) {
        exactRoutableAfterPlan = false;
        blockers.push({
          code: "EXACT_ROUTE_CONFLICT",
          sourceRouteId: source.id,
          casinoSlug,
          marketCode,
          detail: "More than one exact target route exists.",
        });
      } else if (existing[0] && (
        !bindingMatches(existing[0], operation)
        || existing[0].desiredState !== "ACTIVE"
        || existing[0].status !== "ACTIVE"
        || existing[0].routeVerificationStatus !== "HEALTHY"
      )) {
        exactRoutableAfterPlan = false;
        blockers.push({
          code: "EXACT_ROUTE_CONFLICT",
          sourceRouteId: source.id,
          casinoSlug,
          marketCode,
          detail: "Existing exact target does not match the healthy source binding.",
        });
      } else if (!existing[0]) {
        create.push(operation);
      }
      semanticProjection.push({
        sourceRouteId: source.id,
        casinoSlug,
        marketCode,
        legacyRoutableWithinManifest: !blocked,
        exactRoutableAfterPlan,
      });
    }
    disable.push({ sourceRouteId: source.id, casinoSlug });
  }

  create.sort((left, right) => left.casinoSlug.localeCompare(right.casinoSlug)
    || left.marketCode.localeCompare(right.marketCode)
    || left.sourceRouteId.localeCompare(right.sourceRouteId));
  disable.sort((left, right) => left.casinoSlug.localeCompare(right.casinoSlug)
    || left.sourceRouteId.localeCompare(right.sourceRouteId));
  blockers.sort((left, right) => left.casinoSlug.localeCompare(right.casinoSlug)
    || (left.marketCode ?? "").localeCompare(right.marketCode ?? "")
    || left.code.localeCompare(right.code));
  semanticProjection.sort((left, right) => left.casinoSlug.localeCompare(right.casinoSlug)
    || left.marketCode.localeCompare(right.marketCode));

  return {
    version: EXACT_ROUTE_MATERIALIZATION_VERSION,
    mode: "PLAN",
    classification: "DETECTED",
    readyToApply: blockers.length === 0,
    boundedByExplicitManifest: true,
    unboundedLegacyScopeInferred: false,
    before: { routeCount, activeLegacyZzCount: legacyRoutes.length },
    after: {
      routeCount: routeCount + create.length,
      activeLegacyZzCount: blockers.length ? legacyRoutes.length : 0,
    },
    create,
    disable,
    blockers,
    semanticProjection,
  };
}

async function nextEventSequence(database: MaterializationDatabase, activationId: string) {
  const maximum = await database.marketActivation.findUnique({
    where: { id: activationId },
    select: { events: { orderBy: { sequence: "desc" }, take: 1, select: { sequence: true } } },
  });
  return (maximum?.events[0]?.sequence ?? 0) + 1;
}

async function applyPlan(
  transaction: Prisma.TransactionClient,
  plan: ExactRouteMaterializationPlan,
  now: Date,
) {
  for (const operation of plan.create) {
    const source = await transaction.marketActivation.findUniqueOrThrow({ where: { id: operation.sourceRouteId } });
    const profile = await transaction.casinoCountry.findUnique({
      where: {
        casinoId_countryCode: {
          casinoId: operation.casinoId,
          countryCode: operation.countryCode,
        },
      },
      select: { id: true },
    });
    const sourceReferences = [...new Set([...source.sourceReferences, MATERIALIZATION_SOURCE_REFERENCE])].sort();
    const fingerprint = sha256(JSON.stringify({
      version: EXACT_ROUTE_MATERIALIZATION_VERSION,
      sourceRouteId: source.id,
      marketCode: operation.marketCode,
      affiliateOfferId: operation.affiliateOfferId,
      primaryTrackingLinkId: operation.primaryTrackingLinkId,
      redirectSlugId: operation.redirectSlugId,
      casinoBonusId: operation.casinoBonusId,
    }));
    await transaction.marketActivation.create({
      data: {
        id: operation.targetRouteId,
        casinoId: operation.casinoId,
        countryCode: operation.countryCode,
        marketCode: operation.marketCode,
        product: source.product,
        desiredState: "ACTIVE",
        status: "ACTIVE",
        marketProfileId: profile?.id ?? null,
        affiliateOfferId: operation.affiliateOfferId,
        primaryTrackingLinkId: operation.primaryTrackingLinkId,
        redirectSlugId: operation.redirectSlugId,
        casinoBonusId: operation.casinoBonusId,
        version: 1,
        controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
        reconciliationFingerprint: fingerprint,
        requestedBy: EXACT_ROUTE_MATERIALIZATION_VERSION,
        requestedAt: now,
        requestReason: "Materialize an explicitly evidenced exact route before retiring legacy ZZ runtime authority.",
        sourceReferences,
        activatedAt: source.activatedAt ?? now,
        lastReconciledAt: now,
        routeVerificationStatus: source.routeVerificationStatus,
        routeLastCheckedAt: source.routeLastCheckedAt,
        routeFinalHost: source.routeFinalHost,
        routeVerificationDetail: source.routeVerificationDetail,
        globalFallbackBlockedCountries: [],
        diagnostics: {
          classification: "DETECTED",
          materializationVersion: EXACT_ROUTE_MATERIALIZATION_VERSION,
          sourceLegacyRouteId: source.id,
          legacyGeoFieldsAreNonAuthoritative: true,
        },
        createdAt: now,
        updatedAt: now,
      },
    });
    const intentId = deterministicUuid(EXACT_ROUTE_MATERIALIZATION_VERSION + ":intent:" + source.id + ":" + operation.marketCode);
    await transaction.marketActivationIntent.create({
      data: {
        id: intentId,
        activationId: operation.targetRouteId,
        idempotencyKey: EXACT_ROUTE_MATERIALIZATION_VERSION + ":materialize:" + source.id + ":" + operation.marketCode,
        desiredState: "ACTIVE",
        origin: "RECONCILER",
        actorId: EXACT_ROUTE_MATERIALIZATION_VERSION,
        reason: "Explicit exact-route materialization from approved legacy route evidence.",
        sourceReferences,
        payloadHash: sha256(EXACT_ROUTE_MATERIALIZATION_VERSION + ":materialize:" + source.id + ":" + operation.marketCode),
        createdAt: now,
      },
    });
    await transaction.marketActivationEvent.create({
      data: {
        activationId: operation.targetRouteId,
        intentId,
        sequence: 1,
        type: MarketActivationEventType.ACTIVATED,
        desiredState: "ACTIVE",
        status: "ACTIVE",
        actorId: EXACT_ROUTE_MATERIALIZATION_VERSION,
        origin: "RECONCILER",
        reason: "Exact route materialized from explicit approved evidence.",
        controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
        metadata: { sourceLegacyRouteId: source.id, marketCode: operation.marketCode },
        occurredAt: now,
      },
    });
  }

  for (const operation of plan.disable) {
    const source = await transaction.marketActivation.findUniqueOrThrow({ where: { id: operation.sourceRouteId } });
    const version = source.version + 1;
    const changed = await transaction.marketActivation.updateMany({
      where: { id: source.id, version: source.version, desiredState: "ACTIVE", marketCode: "ZZ" },
      data: {
        desiredState: "DISABLED",
        status: MarketActivationStatus.DISABLED,
        version,
        controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
        reconciliationFingerprint: sha256(EXACT_ROUTE_MATERIALIZATION_VERSION + ":disable:" + source.id + ":" + version),
        requestedBy: EXACT_ROUTE_MATERIALIZATION_VERSION,
        requestedAt: now,
        requestReason: "Retire legacy ZZ authority after explicit exact routes are verified.",
        disabledAt: now,
        blockedAt: null,
        lastReconciledAt: now,
        externalBlockerCode: null,
        externalBlockerDetail: null,
        externalBlockerSource: null,
        diagnostics: {
          classification: "DETECTED",
          materializationVersion: EXACT_ROUTE_MATERIALIZATION_VERSION,
          retiredLegacyZz: true,
          legacyGeoFieldsAreNonAuthoritative: true,
        },
        updatedAt: now,
      },
    });
    if (changed.count !== 1) throw new Error("EXACT_ROUTE_MATERIALIZATION_SOURCE_CHANGED");
    const intentId = deterministicUuid(EXACT_ROUTE_MATERIALIZATION_VERSION + ":disable-intent:" + source.id);
    await transaction.marketActivationIntent.create({
      data: {
        id: intentId,
        activationId: source.id,
        idempotencyKey: EXACT_ROUTE_MATERIALIZATION_VERSION + ":disable:" + source.id,
        desiredState: "DISABLED",
        origin: "RECONCILER",
        actorId: EXACT_ROUTE_MATERIALIZATION_VERSION,
        reason: "Legacy ZZ retired after exact route materialization.",
        sourceReferences: [...new Set([...source.sourceReferences, MATERIALIZATION_SOURCE_REFERENCE])].sort(),
        payloadHash: sha256(EXACT_ROUTE_MATERIALIZATION_VERSION + ":disable:" + source.id),
        createdAt: now,
      },
    });
    await transaction.marketActivationEvent.create({
      data: {
        activationId: source.id,
        intentId,
        sequence: await nextEventSequence(transaction, source.id),
        type: MarketActivationEventType.DISABLED,
        previousDesiredState: source.desiredState,
        previousStatus: source.status,
        desiredState: "DISABLED",
        status: "DISABLED",
        actorId: EXACT_ROUTE_MATERIALIZATION_VERSION,
        origin: "RECONCILER",
        reason: "Legacy ZZ authority retired after explicit exact route materialization.",
        controllerVersion: MARKET_ACTIVATION_CONTROLLER_VERSION,
        metadata: { materializationVersion: EXACT_ROUTE_MATERIALIZATION_VERSION },
        occurredAt: now,
      },
    });
  }
}

export async function applyExactRouteMaterialization(
  database: PrismaClient,
  now = new Date(),
) {
  return database.$transaction(async (transaction) => {
    const before = await planExactRouteMaterialization(transaction);
    const readinessBefore = await inspectExactRouteReadiness(transaction);
    const nonMaterializationBlockers = readinessBefore.blockers.filter(
      (blocker) => blocker.code !== "LEGACY_ZZ_ROUTE_REQUIRES_MATERIALIZATION",
    );
    if (nonMaterializationBlockers.length) {
      throw new Error("EXACT_ROUTE_READINESS_BLOCKED:" + nonMaterializationBlockers
        .map((blocker) => blocker.code + "=" + blocker.count)
        .join(","));
    }
    if (!before.readyToApply) {
      throw new Error("UNPROVEN_ROUTE_MATERIALIZATION:" + before.blockers
        .map((blocker) => blocker.casinoSlug + ":" + blocker.code + ":" + (blocker.marketCode ?? "ZZ"))
        .join(","));
    }
    await applyPlan(transaction, before, now);
    const after = await planExactRouteMaterialization(transaction);
    const readinessAfter = await inspectExactRouteReadiness(transaction);
    if (!after.readyToApply || after.create.length || after.disable.length || after.before.activeLegacyZzCount || !readinessAfter.ready) {
      throw new Error("EXACT_ROUTE_MATERIALIZATION_POSTCONDITION_FAILED");
    }
    return {
      version: EXACT_ROUTE_MATERIALIZATION_VERSION,
      mode: "APPLY" as const,
      before,
      after,
      readinessBefore,
      readinessAfter,
      createdRouteCount: before.create.length,
      disabledLegacyZzCount: before.disable.length,
      idempotent: before.create.length === 0 && before.disable.length === 0,
    };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 120_000,
  });
}
