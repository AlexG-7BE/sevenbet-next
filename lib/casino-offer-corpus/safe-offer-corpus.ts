import { EditorialStatus, OfferStatus, Prisma } from "@prisma/client";

import { deterministicCasinoIngestionId } from "@/lib/casino-ingestion/importer";
import {
  readCasinoEditorMetadata,
  writeCasinoEditorMetadata,
  type CasinoEditorMetadata,
} from "@/lib/casino-builder/editor-metadata";

export const SAFE_OFFER_CORPUS_RELEASE = "SAFE-OFFER-CORPUS-01";
export const SAFE_OFFER_CORPUS_SOURCE = "research_staging/betsson-network-2026-09-07/direct-links.normalized.csv";
export const SAFE_OFFER_CORPUS_OBSERVED_AT = "2026-09-07T11:55:00.000Z";

type SafeOfferScope =
  | { kind: "COUNTRY"; countryCode: string; geoMode: "ALLOW"; allowedCountries: string[] }
  | { kind: "ROW"; countryCode: null; geoMode: "GLOBAL"; allowedCountries: [] };

export interface SafeOfferCorpusDefinition {
  sourceRow: number;
  sourceTitle: string;
  casinoSlug: string;
  bonusSlug: string;
  title: string;
  summary: string;
  scope: SafeOfferScope;
}

export const safeOfferCorpusDefinitions: readonly SafeOfferCorpusDefinition[] = Object.freeze([
  {
    sourceRow: 10,
    sourceTitle: "StarCasino IT | Bonus Benvenuto Casino",
    casinoSlug: "starcasino",
    bonusSlug: "starcasino-it-welcome",
    title: "Bonus Benvenuto Casino",
    summary: "The authorised partner corpus confirms an Italian casino welcome-offer route. Material offer mechanics are not established by that evidence.",
    scope: { kind: "COUNTRY", countryCode: "IT", geoMode: "ALLOW", allowedCountries: ["IT"] },
  },
  {
    sourceRow: 38,
    sourceTitle: "RIZK EN/ROW | Casino Welcome Offer",
    casinoSlug: "rizk",
    bonusSlug: "rizk-row-welcome",
    title: "Casino Welcome Offer",
    summary: "The authorised partner corpus confirms a genuine ROW casino welcome-offer route. Material offer mechanics are not established by that evidence.",
    scope: { kind: "ROW", countryCode: null, geoMode: "GLOBAL", allowedCountries: [] },
  },
  {
    sourceRow: 56,
    sourceTitle: "NordicBet EN | ROW | Casino Welcome Offer",
    casinoSlug: "nordicbet",
    bonusSlug: "nordicbet-row-welcome",
    title: "Casino Welcome Offer",
    summary: "The authorised partner corpus confirms a genuine ROW casino welcome-offer route. Material offer mechanics are not established by that evidence.",
    scope: { kind: "ROW", countryCode: null, geoMode: "GLOBAL", allowedCountries: [] },
  },
]);

const materialTermsUnknown = "Material offer mechanics are not established by the source evidence.";

export function safeOfferCorpusBonusId(definition: SafeOfferCorpusDefinition) {
  return deterministicCasinoIngestionId(`${SAFE_OFFER_CORPUS_RELEASE}:${definition.bonusSlug}`);
}

function bonusMetadata(definition: SafeOfferCorpusDefinition): CasinoEditorMetadata["bonuses"][string] {
  return {
    internalName: definition.title,
    shortTerms: materialTermsUnknown,
    amount: null,
    wageringBase: "OTHER",
    minimumOdds: null,
    maximumBet: null,
    eligibleGames: [],
    excludedGames: [],
    eligiblePaymentMethods: [],
    excludedPaymentMethods: [],
    newPlayersOnly: false,
    existingPlayersAllowed: false,
    promoCode: null,
    evergreen: false,
    featured: false,
    exclusive: false,
    notes: `${SAFE_OFFER_CORPUS_RELEASE}: direct-link route-existence evidence only; no commercial authority.`,
    geoMode: definition.scope.geoMode,
    allowedCountries: definition.scope.allowedCountries,
    blockedCountries: [],
  };
}

function comparableBonus(definition: SafeOfferCorpusDefinition, casinoId: string, casinoCountryId: string | null) {
  return {
    id: safeOfferCorpusBonusId(definition),
    casinoId,
    casinoCountryId,
    slug: definition.bonusSlug,
    title: definition.title,
    summary: definition.summary,
    type: "WELCOME" as const,
    percentage: null,
    minimumDeposit: null,
    maximumBonus: null,
    currency: null,
    freeSpins: null,
    wageringMultiplier: null,
    wageringText: materialTermsUnknown,
    eligibility: null,
    importantConditions: [] as string[],
    termsUrl: null,
    startsAt: null,
    expiresAt: null,
    offerStatus: OfferStatus.ACTIVE,
    lastVerifiedAt: new Date(SAFE_OFFER_CORPUS_OBSERVED_AT),
    sortOrder: 0,
  };
}

function normalized(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Prisma.Decimal) return value.toString();
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalized(entry)]));
  }
  return value;
}

function equivalent(current: Record<string, unknown>, desired: Record<string, unknown>) {
  return Object.entries(desired).every(([key, value]) => (
    JSON.stringify(normalized(current[key])) === JSON.stringify(normalized(value))
  ));
}

export interface SafeOfferCorpusReconciliationResult {
  created: string[];
  updated: string[];
  unchanged: string[];
  metadataUpdated: string[];
}

export async function reconcileSafeOfferCorpusInTransaction(
  tx: Prisma.TransactionClient,
  actorId: string,
): Promise<SafeOfferCorpusReconciliationResult> {
  const result: SafeOfferCorpusReconciliationResult = {
    created: [],
    updated: [],
    unchanged: [],
    metadataUpdated: [],
  };

  const casinos = await tx.casino.findMany({
    where: { slug: { in: safeOfferCorpusDefinitions.map((definition) => definition.casinoSlug) } },
    select: {
      id: true,
      slug: true,
      reviewBlocks: true,
      editorScore: true,
      countries: { select: { id: true, countryCode: true } },
    },
  });
  const casinoBySlug = new Map(casinos.map((casino) => [casino.slug, casino]));
  if (casinoBySlug.size !== safeOfferCorpusDefinitions.length) {
    throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: one or more governed casinos are missing`);
  }

  const ids = safeOfferCorpusDefinitions.map(safeOfferCorpusBonusId);
  const slugs = safeOfferCorpusDefinitions.map((definition) => definition.bonusSlug);
  const collisions = await tx.casinoBonus.findMany({
    where: { OR: [{ id: { in: ids } }, { slug: { in: slugs } }] },
  });
  for (const collision of collisions) {
    const definition = safeOfferCorpusDefinitions.find((candidate) => (
      safeOfferCorpusBonusId(candidate) === collision.id || candidate.bonusSlug === collision.slug
    ));
    if (!definition || collision.id !== safeOfferCorpusBonusId(definition) || collision.slug !== definition.bonusSlug) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: deterministic bonus identity collision`);
    }
  }

  for (const definition of safeOfferCorpusDefinitions) {
    const casino = casinoBySlug.get(definition.casinoSlug)!;
    const marketProfile = definition.scope.kind === "COUNTRY"
      ? casino.countries.find((country) => country.countryCode === definition.scope.countryCode)
      : null;
    if (definition.scope.kind === "COUNTRY" && !marketProfile) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.casinoSlug} is missing ${definition.scope.countryCode}`);
    }

    const desired = comparableBonus(definition, casino.id, marketProfile?.id ?? null);
    const current = collisions.find((candidate) => candidate.id === desired.id);
    if (current && (current.casinoId !== desired.casinoId || current.casinoCountryId !== desired.casinoCountryId)) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} cannot move between casino or market scopes`);
    }

    if (!current) {
      await tx.casinoBonus.create({
        data: {
          ...desired,
          status: EditorialStatus.DRAFT,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });
      result.created.push(definition.bonusSlug);
    } else if (equivalent(current as unknown as Record<string, unknown>, desired)) {
      result.unchanged.push(definition.bonusSlug);
    } else {
      await tx.casinoBonus.update({
        where: { id: desired.id },
        data: {
          title: desired.title,
          summary: desired.summary,
          type: desired.type,
          percentage: desired.percentage,
          minimumDeposit: desired.minimumDeposit,
          maximumBonus: desired.maximumBonus,
          currency: desired.currency,
          freeSpins: desired.freeSpins,
          wageringMultiplier: desired.wageringMultiplier,
          wageringText: desired.wageringText,
          eligibility: desired.eligibility,
          importantConditions: desired.importantConditions,
          termsUrl: desired.termsUrl,
          startsAt: desired.startsAt,
          expiresAt: desired.expiresAt,
          offerStatus: desired.offerStatus,
          lastVerifiedAt: desired.lastVerifiedAt,
          sortOrder: desired.sortOrder,
          updatedBy: actorId,
        },
      });
      result.updated.push(definition.bonusSlug);
    }

    const metadata = readCasinoEditorMetadata(casino.reviewBlocks);
    const desiredMetadata = bonusMetadata(definition);
    if (!equivalent(
      (metadata.bonuses[desired.id] ?? {}) as Record<string, unknown>,
      desiredMetadata as unknown as Record<string, unknown>,
    )) {
      metadata.bonuses[desired.id] = desiredMetadata;
      await tx.casino.update({
        where: { id: casino.id },
        data: {
          reviewBlocks: writeCasinoEditorMetadata(casino.reviewBlocks, metadata),
          updatedBy: actorId,
        },
      });
      result.metadataUpdated.push(definition.bonusSlug);
    }

    if (!current || result.updated.includes(definition.bonusSlug) || result.metadataUpdated.includes(definition.bonusSlug)) {
      await tx.auditLog.create({
        data: {
          actorId,
          action: "safe-offer-corpus-reconcile",
          entityType: "casinoBonus",
          entityId: desired.id,
          summary: `${SAFE_OFFER_CORPUS_RELEASE}: reconciled ${definition.bonusSlug}`,
          metadata: {
            release: SAFE_OFFER_CORPUS_RELEASE,
            source: SAFE_OFFER_CORPUS_SOURCE,
            sourceRow: definition.sourceRow,
            sourceScope: definition.scope.kind,
            commercialAuthorityGranted: false,
            materialTermsKnown: false,
          },
        },
      });
    }
  }

  return result;
}

function record(value: Prisma.JsonValue | undefined): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};
}

function list(value: Prisma.JsonValue | undefined): Prisma.JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function publishedSnapshotBonusLocations(snapshot: Prisma.JsonObject) {
  const global = list(snapshot.casinoBonuses).map((value) => ({
    countryCode: null,
    bonus: record(value),
  }));
  const marketSpecific = list(snapshot.countries).flatMap((value) => {
    const country = record(value);
    const countryCode = typeof country.countryCode === "string" ? country.countryCode : null;
    return list(country.bonuses).map((bonus) => ({
      countryCode,
      bonus: record(bonus),
    }));
  });
  return [...global, ...marketSpecific];
}

export async function verifySafeOfferCorpusInTransaction(tx: Prisma.TransactionClient) {
  const state = [];
  for (const definition of safeOfferCorpusDefinitions) {
    const id = safeOfferCorpusBonusId(definition);
    const bonus = await tx.casinoBonus.findUnique({
      where: { id },
      include: {
        casino: {
          select: {
            slug: true,
            editorScore: true,
            countries: { select: { id: true, countryCode: true } },
            versions: {
              where: { status: EditorialStatus.PUBLISHED },
              orderBy: { version: "desc" },
              take: 1,
              select: { snapshot: true },
            },
          },
        },
        affiliateLinks: { select: { id: true } },
        affiliateOffers: { select: { id: true } },
        redirectSlugs: { select: { id: true } },
        mediaAssignments: { select: { id: true } },
        partnerHostedAssignments: { select: { id: true } },
        marketActivations: { select: { id: true } },
        mediaCreativeSets: { select: { id: true } },
      },
    });
    if (!bonus || bonus.slug !== definition.bonusSlug || bonus.casino.slug !== definition.casinoSlug) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} is missing`);
    }
    const expectedCountryId = definition.scope.kind === "COUNTRY"
      ? bonus.casino.countries.find((country) => country.countryCode === definition.scope.countryCode)?.id
      : null;
    if (bonus.casinoCountryId !== expectedCountryId) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} scope mismatch`);
    }
    if (bonus.status !== EditorialStatus.PUBLISHED || bonus.offerStatus !== OfferStatus.ACTIVE) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} is not published and active`);
    }
    if (bonus.affiliateLinks.length || bonus.affiliateOffers.length || bonus.redirectSlugs.length
      || bonus.mediaAssignments.length || bonus.partnerHostedAssignments.length
      || bonus.marketActivations.length || bonus.mediaCreativeSets.length) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} crossed a protected authority boundary`);
    }

    const snapshot = record(bonus.casino.versions[0]?.snapshot);
    const publishedLocations = publishedSnapshotBonusLocations(snapshot)
      .filter((entry) => entry.bonus.id === id);
    const expectedCountryCode = definition.scope.kind === "COUNTRY"
      ? definition.scope.countryCode
      : null;
    if (publishedLocations.length !== 1 || publishedLocations[0]?.countryCode !== expectedCountryCode) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} published snapshot scope mismatch`);
    }
    const publishedBonus = publishedLocations[0].bonus;
    if (publishedBonus.status !== EditorialStatus.PUBLISHED || publishedBonus.offerStatus !== OfferStatus.ACTIVE) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} is absent from the latest published snapshot`);
    }
    const metadata = readCasinoEditorMetadata(snapshot.reviewBlocks ?? null);
    const extension = metadata.bonuses[id];
    if (!extension || extension.geoMode !== definition.scope.geoMode
      || JSON.stringify(extension.allowedCountries) !== JSON.stringify(definition.scope.allowedCountries)) {
      throw new Error(`${SAFE_OFFER_CORPUS_RELEASE}: ${definition.bonusSlug} published GEO metadata mismatch`);
    }

    state.push({
      slug: definition.bonusSlug,
      casinoSlug: definition.casinoSlug,
      scope: definition.scope.kind,
      countryCode: definition.scope.countryCode,
      editorScore: bonus.casino.editorScore,
      actionBindings: 0,
      mediaBindings: 0,
    });
  }
  return state;
}
