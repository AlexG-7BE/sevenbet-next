import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  EditorialStatus,
  OfferStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { parseCasinoIngestionBundle, type CasinoIngestionBundle } from "@/lib/casino-ingestion/contract";
import {
  deterministicCasinoIngestionId,
  ingestCasinoBundle,
  planCasinoIngestion,
  verifyCasinoBundleIdempotency,
  type ReconciliationCounts,
} from "@/lib/casino-ingestion/importer";
import { BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID } from "@/lib/casino-ingestion/production-factual-vercel-target";
import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import {
  CASINO_MARKET_TARGET_MIGRATION,
  casinoMarketRepositoryChecksum,
  casinoMarketRepositoryMigrations,
  inspectCasinoMarket0025Release,
  inspectCasinoMarket0025ReleaseSnapshot,
  runCasinoMarket0025ReadOnlyTransaction,
  type CasinoMarket0025ReleaseSnapshot,
  type CasinoMarketPreservationCounts,
} from "@/lib/db/casino-market-0025-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";
import { mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";

export const BETSSON_FACTUAL_RELEASE_BUNDLE_PATH = "data/casino-ingestion/betsson-pe-se.v1.json";
export const BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256 = "9f6d15e18e7217fbc9648c86eb8a2ba4ad8aa47fb1e8e06ac7ab60b672f3960c";
export const BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256 = "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99";
export const BETSSON_FACTUAL_RELEASE_AUTHORITY = `B4GAMBLE_PRODUCTION_FACTUAL_RELEASE:BETSSON:PE-SE:${BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256}`;
export const BETSSON_FACTUAL_RELEASE_COMPLETE_STOP = "CASINO_BETSSON_PE_SE_FACTUAL_RELEASE_COMPLETE_STOP";

const EXPECTED_PRODUCTION_BASELINE: CasinoMarketPreservationCounts = {
  casinos: 26n,
  markets: 25n,
  licenses: 25n,
  payments: 56n,
  providers: 50n,
  categories: 50n,
  bonuses: 25n,
  media: 1n,
  routeCountries: 0n,
};

const EXPECTED_RECONCILIATION: Record<string, number> = {
  CasinoBrand: 1,
  Casino: 1,
  CasinoOperator: 2,
  CasinoCountry: 2,
  CasinoCountryEvidence: 24,
  CasinoLicense: 3,
  CasinoCountryLicense: 3,
  CasinoLicenseEvidence: 4,
  CasinoPaymentMethod: 22,
  CasinoGameCategory: 14,
  CasinoBonus: 2,
};

const IMPORT_DELTAS = {
  casinos: 1,
  markets: 2,
  operators: 2,
  brands: 1,
  licenses: 3,
  licenseEvidence: 4,
  marketEvidence: 24,
  licenseLinks: 3,
  payments: 22,
  providers: 0,
  categories: 14,
  bonuses: 2,
  media: 0,
  images: 0,
  versions: 0,
  revisions: 0,
  seo: 0,
  editorialReviews: 0,
  affiliatePrograms: 0,
  affiliateOffers: 0,
  affiliateTrackingLinks: 0,
  affiliateRouteCountries: 0,
  affiliateRedirects: 0,
  casinoAffiliateLinks: 0,
  legacyAffiliateLinks: 0,
  commercialOpportunities: 0,
  productionEligibleRoutes: 0,
} as const;

const PUBLICATION_DELTAS = {
  ...Object.fromEntries(Object.keys(IMPORT_DELTAS).map((key) => [key, 0])),
  versions: 1,
  revisions: 1,
} as Record<keyof typeof IMPORT_DELTAS, number>;

type ReleaseEnvironment = Record<string, string | undefined>;
type ReleaseAuthority = "production" | "disposable-test";
type ReleaseEvent = Record<string, unknown>;

type ReleaseOptions = {
  authority?: ReleaseAuthority;
  environment?: ReleaseEnvironment;
  now?: () => Date;
  writeEvent?: (event: ReleaseEvent) => void;
  createPrismaClient?: () => PrismaClient;
};

type Inventory = Record<keyof typeof IMPORT_DELTAS, number>;

type CandidateState = {
  casinos: number;
  brands: number;
  operators: number;
  markets: number;
  licenses: number;
  bonuses: number;
  aliases: number;
};

const factualAggregateInclude = {
  images: { orderBy: [{ kind: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
  mediaAssets: { orderBy: [{ type: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
  countries: {
    orderBy: { countryCode: Prisma.SortOrder.asc },
    include: {
      operatorProfile: true,
      evidence: { orderBy: { id: Prisma.SortOrder.asc } },
      licenses: {
        orderBy: { casinoLicenseId: Prisma.SortOrder.asc },
        include: { license: { include: { evidence: { orderBy: { id: Prisma.SortOrder.asc } } } } },
      },
      paymentMethods: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { methodKey: Prisma.SortOrder.asc }] },
      gameProviders: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { providerKey: Prisma.SortOrder.asc }] },
      gameCategories: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { categoryKey: Prisma.SortOrder.asc }] },
      bonuses: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { slug: Prisma.SortOrder.asc }] },
      mediaAssets: { orderBy: [{ type: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
    },
  },
  licenses: {
    orderBy: [{ authority: Prisma.SortOrder.asc }, { licenseNumber: Prisma.SortOrder.asc }],
    include: { evidence: { orderBy: { id: Prisma.SortOrder.asc } } },
  },
  paymentMethods: { where: { casinoCountryId: null }, orderBy: { sortOrder: Prisma.SortOrder.asc } },
  gameProviders: { where: { casinoCountryId: null }, orderBy: { sortOrder: Prisma.SortOrder.asc } },
  gameCategories: { where: { casinoCountryId: null }, orderBy: { sortOrder: Prisma.SortOrder.asc } },
  casinoBonuses: { where: { casinoCountryId: null }, orderBy: { sortOrder: Prisma.SortOrder.asc } },
  casinoLinks: { where: { casinoBonusId: null }, orderBy: { priority: Prisma.SortOrder.desc } },
  seo: true,
  operatorProfile: true,
  brandProfile: true,
} satisfies Prisma.CasinoInclude;

type FactualAggregate = Prisma.CasinoGetPayload<{ include: typeof factualAggregateInclude }>;
type QueryClient = PrismaClient | Prisma.TransactionClient;

export class BetssonFactualReleaseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "BetssonFactualReleaseError";
  }
}

function fail(code: string, message: string): never {
  throw new BetssonFactualReleaseError(code, message);
}

function fullCommit(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{40}$/.test(value));
}

function stringifyBigInts(value: Record<string, bigint>) {
  return Object.fromEntries(Object.entries(value).map(([key, count]) => [key, count.toString()]));
}

function databaseIdentity(value: string | undefined) {
  if (!value) fail("DISPOSABLE_DATABASE_REQUIRED", "Disposable database bindings are required.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail("DISPOSABLE_DATABASE_REFUSED", "The disposable database identity is invalid.");
  }
  const databaseName = url.pathname.replace(/^\//, "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol)
    || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || !databaseName.endsWith("_ci")
  ) {
    fail("DISPOSABLE_DATABASE_REFUSED", "Execution tests accept only a loopback _ci PostgreSQL database.");
  }
  return [url.protocol, url.username, url.hostname, url.port || "5432", databaseName, url.searchParams.get("schema") ?? "public"].join("|");
}

function loadAuthorisedBundle() {
  const bytes = readFileSync(BETSSON_FACTUAL_RELEASE_BUNDLE_PATH);
  const checksum = createHash("sha256").update(bytes).digest("hex");
  if (checksum !== BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256) {
    fail("BUNDLE_CHECKSUM_MISMATCH", "The frozen Betsson PE/SE bundle checksum does not match authority.");
  }
  const bundle = parseCasinoIngestionBundle(JSON.parse(bytes.toString("utf8")));
  const plan = planCasinoIngestion(bundle);
  if (
    bundle.schemaVersion !== "casino-market-ingestion.v1"
    || bundle.casino.key !== "betsson"
    || bundle.casino.slug !== "betsson"
    || bundle.sourceFiles.length !== 9
    || JSON.stringify(plan.markets) !== JSON.stringify(["PE", "SE"])
    || plan.planned.casinos !== 1
    || plan.planned.marketProfiles !== 2
    || plan.planned.licenses !== 3
    || plan.planned.licenseEvidence !== 4
    || plan.planned.payments !== 22
    || plan.planned.bonuses !== 2
    || plan.planned.providers !== 0
    || plan.planned.categories !== 14
    || plan.planned.marketEvidence !== 24
    || plan.planned.commercialWrites !== 0
  ) {
    fail("BUNDLE_SCOPE_MISMATCH", "The frozen bundle is not the exact one-Casino PE/SE factual plan.");
  }
  return { bundle, checksum, plan };
}

export function isBetssonFactualReleaseRequested(environment: ReleaseEnvironment) {
  return [
    environment.CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY,
    environment.CASINO_BETSSON_PE_SE_RELEASE_SOURCE_COMMIT,
    environment.CASINO_BETSSON_PE_SE_EXPECTED_RELEASE_COMMIT,
    environment.CASINO_BETSSON_PE_SE_EXECUTE_PRODUCTION_RELEASE,
  ].some((value) => value !== undefined);
}

export function assertBetssonFactualReleaseAuthority(
  environment: ReleaseEnvironment,
  authority: ReleaseAuthority = "production",
) {
  if (environment.CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY !== BETSSON_FACTUAL_RELEASE_AUTHORITY) {
    fail("EXECUTION_AUTHORITY_MISMATCH", "The exact non-secret factual release authority is required.");
  }
  if (environment.CASINO_BETSSON_PE_SE_EXECUTE_PRODUCTION_RELEASE !== "1") {
    fail("EXECUTE_FLAG_REQUIRED", "The explicit Betsson PE/SE Production release flag is required.");
  }
  const sourceCommit = environment.CASINO_BETSSON_PE_SE_RELEASE_SOURCE_COMMIT;
  const expectedCommit = environment.CASINO_BETSSON_PE_SE_EXPECTED_RELEASE_COMMIT;
  if (!fullCommit(sourceCommit) || !fullCommit(expectedCommit)) {
    fail("FULL_COMMIT_REQUIRED", "Source and expected release commits must be full lowercase Git SHAs.");
  }
  if (sourceCommit !== expectedCommit) {
    fail("RELEASE_COMMIT_MISMATCH", "The verified source commit does not equal the approved release commit.");
  }
  const repositoryMigrations = casinoMarketRepositoryMigrations();
  if (repositoryMigrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    fail("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must remain the final repository migration.");
  }
  if (casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION) !== BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256) {
    fail("MIGRATION_CHECKSUM_MISMATCH", "Migration 0025 does not match the approved checksum.");
  }
  loadAuthorisedBundle();

  if (authority === "disposable-test") {
    if (environment.CI !== "true" || environment.NODE_ENV !== "test") {
      fail("DISPOSABLE_TEST_AUTHORITY_REQUIRED", "Disposable execution requires explicit CI and test authority.");
    }
    if (databaseIdentity(environment.DATABASE_URL) !== databaseIdentity(environment.DIRECT_URL)) {
      fail("DATABASE_IDENTITY_MISMATCH", "Runtime and direct disposable database identities do not match.");
    }
    return {
      releaseCommit: sourceCommit,
      repositoryMigrations,
      environment: "disposable-test" as const,
      runtimeMode: "disposable" as const,
      directMode: "direct-disposable" as const,
      sameDatabaseIdentity: true as const,
      vercelProjectId: null,
    };
  }

  if (environment.VERCEL_ENV !== "production") fail("PRODUCTION_ENVIRONMENT_REQUIRED", "Factual release execution requires Vercel Production.");
  if (environment.VERCEL !== "1") fail("VERCEL_BUILD_REQUIRED", "Factual release execution requires the Vercel build environment.");
  if (environment.VERCEL_PROJECT_ID !== BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID) {
    fail("VERCEL_PROJECT_REFUSED", "The factual release build is not running in the approved Vercel project.");
  }
  if (!environment.DATABASE_URL || !environment.DIRECT_URL) {
    fail("DATABASE_BINDINGS_REQUIRED", "The approved pooled and direct Production bindings are required.");
  }
  let readiness: ReturnType<typeof assertVercelDatabaseReadiness>;
  try {
    readiness = assertVercelDatabaseReadiness(environment);
  } catch {
    fail("DATABASE_READINESS_REFUSED", "Production database readiness or identity verification failed.");
  }
  if (!readiness.checked || readiness.environment !== "production" || !readiness.sameDatabaseIdentity) {
    fail("DATABASE_IDENTITY_REFUSED", "An unambiguous matching Production database identity is required.");
  }
  return {
    releaseCommit: sourceCommit,
    repositoryMigrations,
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
    vercelProjectId: environment.VERCEL_PROJECT_ID,
  };
}

async function readInventory(prisma: PrismaClient): Promise<Inventory> {
  return runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => stage("authority_state", async () => {
    const [
      casinos, markets, operators, brands, licenses, licenseEvidence, marketEvidence, licenseLinks,
      payments, providers, categories, bonuses, media, images, versions, revisions, seo, editorialReviews,
      affiliatePrograms, affiliateOffers, affiliateTrackingLinks, affiliateRouteCountries, affiliateRedirects,
      casinoAffiliateLinks, legacyAffiliateLinks, commercialOpportunities, productionEligibleRoutes,
    ] = await Promise.all([
      transaction.casino.count(), transaction.casinoCountry.count(), transaction.casinoOperator.count(), transaction.casinoBrand.count(),
      transaction.casinoLicense.count(), transaction.casinoLicenseEvidence.count(), transaction.casinoCountryEvidence.count(), transaction.casinoCountryLicense.count(),
      transaction.casinoPaymentMethod.count(), transaction.casinoGameProvider.count(), transaction.casinoGameCategory.count(), transaction.casinoBonus.count(),
      transaction.mediaAsset.count(), transaction.casinoImage.count(), transaction.casinoVersion.count(), transaction.casinoRevision.count(),
      transaction.casinoSeo.count(), transaction.editorialReview.count(), transaction.affiliateProgram.count(), transaction.affiliateOffer.count(),
      transaction.affiliateTrackingLink.count(), transaction.affiliateTrackingLinkCountry.count(), transaction.affiliateRedirectSlug.count(),
      transaction.casinoAffiliateLink.count(), transaction.affiliateLink.count(), transaction.commercialOpportunity.count(),
      transaction.affiliateTrackingLinkCountry.count({ where: { productionEligible: true } }),
    ]);
    return {
      casinos, markets, operators, brands, licenses, licenseEvidence, marketEvidence, licenseLinks,
      payments, providers, categories, bonuses, media, images, versions, revisions, seo, editorialReviews,
      affiliatePrograms, affiliateOffers, affiliateTrackingLinks, affiliateRouteCountries, affiliateRedirects,
      casinoAffiliateLinks, legacyAffiliateLinks, commercialOpportunities, productionEligibleRoutes,
    };
  }));
}

async function readCandidateState(prisma: PrismaClient, bundle: CasinoIngestionBundle): Promise<CandidateState> {
  const casinoId = deterministicCasinoIngestionId("betsson:casino");
  const brandId = deterministicCasinoIngestionId("betsson:brand:betsson");
  const operatorNames = bundle.markets.map((market) => market.operator.name);
  const operatorIds = bundle.markets.map((market) => deterministicCasinoIngestionId(`betsson:operator:${market.operator.key}`));
  const marketIds = bundle.markets.map((market) => deterministicCasinoIngestionId(`betsson:market:${market.countryCode}`));
  const domains = bundle.markets.map((market) => market.localDomain).filter((value): value is string => Boolean(value));
  const licenseNumbers = bundle.markets.flatMap((market) => market.licenses.map((license) => license.licenseNumber).filter((value): value is string => Boolean(value)));
  const bonusSlugs = bundle.markets.flatMap((market) => market.bonuses.map((bonus) => bonus.slug));
  return runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => stage("authority_state", async () => {
    const [casinos, brands, operators, markets, licenses, bonuses, aliases] = await Promise.all([
      transaction.casino.count({ where: { OR: [{ id: casinoId }, { slug: "betsson" }, { domain: "betsson.com" }, { title: { equals: "Betsson", mode: "insensitive" } }] } }),
      transaction.casinoBrand.count({ where: { OR: [{ id: brandId }, { name: { equals: "Betsson", mode: "insensitive" } }, { domain: "betsson.com" }] } }),
      transaction.casinoOperator.count({ where: { OR: [{ id: { in: operatorIds } }, { name: { in: operatorNames, mode: "insensitive" } }] } }),
      transaction.casinoCountry.count({ where: { OR: [{ id: { in: marketIds } }, { localDomain: { in: domains } }] } }),
      transaction.casinoLicense.count({ where: { licenseNumber: { in: licenseNumbers } } }),
      transaction.casinoBonus.count({ where: { slug: { in: bonusSlugs } } }),
      transaction.casinoAlias.count({ where: { normalizedValue: "betsson" } }),
    ]);
    return { casinos, brands, operators, markets, licenses, bonuses, aliases };
  }));
}

function assertEmptyCandidateState(state: CandidateState) {
  if (Object.values(state).some((count) => count !== 0)) {
    fail("BETSSON_IDENTITY_COLLISION", "Production contains a pre-existing or ambiguous Betsson identity candidate.");
  }
}

function assertProductionBaseline(snapshot: CasinoMarket0025ReleaseSnapshot) {
  for (const key of Object.keys(EXPECTED_PRODUCTION_BASELINE) as Array<keyof CasinoMarketPreservationCounts>) {
    if (snapshot.counts[key] !== EXPECTED_PRODUCTION_BASELINE[key]) {
      fail("PRODUCTION_BASELINE_MISMATCH", "Production preservation counts differ from the approved pre-import baseline.");
    }
  }
}

function assertInventoryDelta(before: Inventory, after: Inventory, deltas: Record<keyof Inventory, number>, code: string) {
  for (const key of Object.keys(before) as Array<keyof Inventory>) {
    if (after[key] !== before[key] + deltas[key]) {
      fail(code, `Bounded inventory delta mismatch for ${key}.`);
    }
  }
}

function assertReconciliation(counts: ReconciliationCounts | null) {
  if (!counts || counts.created !== 78 || counts.updated !== 0 || counts.unchanged !== 0) {
    fail("IMPORT_RECONCILIATION_MISMATCH", "The import did not create the exact expected factual row set.");
  }
  const actualModels = Object.keys(counts.byModel).sort();
  const expectedModels = Object.keys(EXPECTED_RECONCILIATION).sort();
  if (JSON.stringify(actualModels) !== JSON.stringify(expectedModels)) {
    fail("IMPORT_MODEL_SCOPE_MISMATCH", "The import touched an unexpected model set.");
  }
  for (const [model, created] of Object.entries(EXPECTED_RECONCILIATION)) {
    const modelCounts = counts.byModel[model];
    if (!modelCounts || modelCounts.created !== created || modelCounts.updated !== 0 || modelCounts.unchanged !== 0) {
      fail("IMPORT_MODEL_RECONCILIATION_MISMATCH", `The import reconciliation mismatch is bounded to ${model}.`);
    }
  }
}

async function loadBetssonAggregate(database: QueryClient): Promise<FactualAggregate> {
  const casino = await database.casino.findUnique({ where: { slug: "betsson" }, include: factualAggregateInclude });
  if (!casino) fail("BETSSON_NOT_FOUND", "The intended Betsson global identity was not found.");
  return casino;
}

function assertFactualAggregate(casino: FactualAggregate, bundle: CasinoIngestionBundle, expectedStatus: EditorialStatus) {
  if (
    casino.id !== deterministicCasinoIngestionId("betsson:casino")
    || casino.slug !== "betsson"
    || casino.title !== "Betsson"
    || casino.internalName !== "Betsson"
    || casino.domain !== "betsson.com"
    || casino.status !== expectedStatus
    || casino.editorScore !== null
    || casino.operatorProfileId !== null
    || casino.languages.length !== 0
    || casino.currencies.length !== 0
    || casino.license !== null
    || casino.country !== null
    || casino.brandProfile?.id !== deterministicCasinoIngestionId("betsson:brand:betsson")
  ) {
    fail("BETSSON_GLOBAL_STATE_MISMATCH", "The Betsson global factual identity does not match the frozen bundle boundary.");
  }
  if (JSON.stringify(casino.countries.map((market) => market.countryCode)) !== JSON.stringify(["PE", "SE"])) {
    fail("MARKET_SET_MISMATCH", "Betsson must contain exactly the PE and SE market profiles.");
  }
  for (const marketBundle of bundle.markets) {
    const market = casino.countries.find((candidate) => candidate.countryCode === marketBundle.countryCode);
    if (
      !market
      || market.id !== deterministicCasinoIngestionId(`betsson:market:${marketBundle.countryCode}`)
      || market.localDomain !== marketBundle.localDomain
      || market.localWebsiteUrl !== marketBundle.localWebsiteUrl
      || market.operatingLegalEntity !== marketBundle.operatingLegalEntity
      || market.primaryLanguage !== marketBundle.primaryLanguage
      || market.primaryCurrency !== marketBundle.primaryCurrency
      || JSON.stringify(market.supportedLanguages) !== JSON.stringify(marketBundle.supportedLanguages)
      || JSON.stringify(market.supportedCurrencies) !== JSON.stringify(marketBundle.supportedCurrencies)
      || market.evidence.length !== marketBundle.evidence.length
      || market.licenses.length !== marketBundle.licenses.length
      || market.paymentMethods.length !== marketBundle.payments.length
      || market.gameProviders.length !== marketBundle.providers.length
      || market.gameCategories.length !== marketBundle.categories.length
      || market.bonuses.length !== marketBundle.bonuses.length
      || market.mediaAssets.length !== 0
    ) {
      fail("MARKET_PROFILE_MISMATCH", `The ${marketBundle.countryCode} profile does not match the frozen factual boundary.`);
    }
    if (market.bonuses.some((bonus) => bonus.status !== EditorialStatus.DRAFT || bonus.offerStatus !== OfferStatus.DRAFT)) {
      fail("BONUS_PUBLICATION_REFUSED", "Factual publication must leave both observed bonus records unpublished and commercially inactive.");
    }
  }
  const pe = casino.countries.find((market) => market.countryCode === "PE")!;
  const se = casino.countries.find((market) => market.countryCode === "SE")!;
  if (
    pe.paymentMethods.some((payment) => payment.methodKey === "swish")
    || se.paymentMethods.some((payment) => payment.methodKey === "yape")
    || JSON.stringify(pe.licenses.map((relation) => relation.license.licenseNumber).sort()) !== JSON.stringify(["11002586010000", "21002586010000"])
    || JSON.stringify(se.licenses.map((relation) => relation.license.licenseNumber)) !== JSON.stringify(["23Si2176"])
  ) {
    fail("CROSS_MARKET_LEAKAGE", "The PE and SE factual profiles are not strictly isolated.");
  }
  if (
    !pe.evidence.some((evidence) => evidence.classification === "CONTRADICTION" && evidence.notes?.includes("21002586020000"))
    || !casino.countries.every((market) => market.evidence.some((evidence) => evidence.classification === "UNKNOWN"))
  ) {
    fail("EVIDENCE_INTEGRITY_MISMATCH", "Contradiction or UNKNOWN evidence was not preserved.");
  }
}

function snapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function publishFactualAggregate(prisma: PrismaClient, bundle: CasinoIngestionBundle, publishedAt: Date) {
  return prisma.$transaction(async (transaction) => {
    const current = await loadBetssonAggregate(transaction);
    assertFactualAggregate(current, bundle, EditorialStatus.DRAFT);
    const [versions, revisions] = await Promise.all([
      transaction.casinoVersion.count({ where: { casinoId: current.id } }),
      transaction.casinoRevision.count({ where: { casinoId: current.id } }),
    ]);
    if (
      current.publishedVersion !== 0
      || current.draftVersion !== 1
      || current.publishedAt !== null
      || versions !== 0
      || revisions !== 0
    ) {
      fail("PUBLICATION_BASELINE_MISMATCH", "Betsson is not in the exact first factual publication state.");
    }

    const actor = "casino-betsson-pe-se-factual-release";
    const versionNumber = current.draftVersion;
    const revision = await transaction.casinoRevision.create({
      data: {
        casinoId: current.id,
        revisionNumber: 1,
        snapshot: snapshot(current),
        summary: "Published the frozen Betsson PE/SE factual profile without commercial activation",
        createdBy: actor,
      },
    });
    const version = await transaction.casinoVersion.create({
      data: {
        casinoId: current.id,
        version: versionNumber,
        status: EditorialStatus.PUBLISHED,
        snapshot: snapshot({
          ...current,
          status: EditorialStatus.PUBLISHED,
          publishedVersion: versionNumber,
          publishedAt,
          scheduledPublishAt: null,
          archivedAt: null,
          updatedAt: publishedAt,
        }),
        publishedAt,
        createdBy: actor,
      },
    });
    await transaction.casino.update({
      where: { id: current.id },
      data: {
        status: EditorialStatus.PUBLISHED,
        publishedVersion: versionNumber,
        draftVersion: { increment: 1 },
        publishedAt,
        scheduledPublishAt: null,
        archivedAt: null,
      },
    });
    return { casinoId: current.id, revisionId: revision.id, versionId: version.id, version: versionNumber };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5_000,
    timeout: 65_000,
  });
}

async function assertPublishedProjection(prisma: PrismaClient, bundle: CasinoIngestionBundle) {
  const casino = await loadBetssonAggregate(prisma);
  assertFactualAggregate(casino, bundle, EditorialStatus.PUBLISHED);
  if (casino.publishedVersion !== 1 || casino.draftVersion !== 2 || !casino.publishedAt) {
    fail("PUBLICATION_STATE_MISMATCH", "Betsson did not reach the exact first published factual state.");
  }
  const [version, revision] = await Promise.all([
    prisma.casinoVersion.findUnique({ where: { casinoId_version: { casinoId: casino.id, version: 1 } } }),
    prisma.casinoRevision.findUnique({ where: { casinoId_revisionNumber: { casinoId: casino.id, revisionNumber: 1 } } }),
  ]);
  if (!version || version.status !== EditorialStatus.PUBLISHED || !version.publishedAt || !revision) {
    fail("PUBLICATION_EVIDENCE_MISSING", "The factual publication version or revision is missing.");
  }
  const mapped = mapPublishedCasino({
    casinoId: casino.id,
    version: version.version,
    status: version.status,
    snapshot: version.snapshot,
    publishedAt: version.publishedAt,
    archivedAt: casino.archivedAt,
  }, [], { redirectEnabled: false, now: casino.publishedAt });
  if (!mapped || mapped.editorScore !== null || mapped.affiliate.available || mapped.bonuses.length !== 0) {
    fail("PUBLIC_PROJECTION_MISMATCH", "The public factual projection is unavailable or broadened into editorial/commercial authority.");
  }
  const pe = projectPublicCasinoMarket(mapped, "PE");
  const se = projectPublicCasinoMarket(mapped, "SE");
  const unqualified = projectPublicCasinoMarket(mapped, "");
  if (
    pe.domain !== "www.betsson.pe"
    || !pe.currencies.includes("PEN")
    || pe.currencies.includes("SEK")
    || !pe.payments.some((payment) => payment.key === "yape")
    || pe.payments.some((payment) => payment.key === "swish")
    || !pe.licenses.every((license) => license.authority === "MINCETUR")
    || pe.affiliate.available
    || pe.bonuses.length !== 0
  ) {
    fail("PE_PUBLIC_PROJECTION_MISMATCH", "The PE public projection is not exact or commercially fail-closed.");
  }
  if (
    se.domain !== "www.betsson.com/sv"
    || !se.currencies.includes("SEK")
    || se.currencies.includes("PEN")
    || !se.payments.some((payment) => payment.key === "swish")
    || se.payments.some((payment) => payment.key === "yape")
    || !se.licenses.every((license) => license.authority === "Spelinspektionen")
    || se.affiliate.available
    || se.bonuses.length !== 0
  ) {
    fail("SE_PUBLIC_PROJECTION_MISMATCH", "The SE public projection is not exact or commercially fail-closed.");
  }
  if (
    unqualified.marketProfiles.length !== 0
    || unqualified.countries.length !== 0
    || unqualified.licenses.length !== 0
    || unqualified.payments.length !== 0
    || unqualified.categories.length !== 0
    || unqualified.bonuses.length !== 0
    || unqualified.affiliate.available
  ) {
    fail("UNQUALIFIED_PUBLIC_PROJECTION_MISMATCH", "The unqualified public projection synthesized exact-market facts.");
  }
  return { casino, version, revision };
}

export async function runBetssonProductionFactualRelease(options: ReleaseOptions = {}) {
  const environment = options.environment ?? process.env;
  const releaseAuthority = options.authority ?? "production";
  const authority = assertBetssonFactualReleaseAuthority(environment, releaseAuthority);
  const { bundle, checksum, plan } = loadAuthorisedBundle();
  const createPrismaClient = options.createPrismaClient ?? (() => createCasinoMarket0025AdminClient(environment));
  const writeEvent = options.writeEvent ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`));
  const now = options.now ?? (() => new Date());
  const prisma = createPrismaClient();
  let databaseConnectionOccurred = false;
  let importPerformed = false;
  let publicationPerformed = false;

  try {
    databaseConnectionOccurred = true;
    const migration = await inspectCasinoMarket0025ReleaseSnapshot(prisma, authority.repositoryMigrations);
    if (releaseAuthority === "production") assertProductionBaseline(migration);
    const [before, candidates] = await Promise.all([readInventory(prisma), readCandidateState(prisma, bundle)]);
    assertEmptyCandidateState(candidates);
    writeEvent({
      event: "casino_betsson_pe_se_production_release_preflight_verified",
      timestamp: now().toISOString(),
      environment: authority.environment,
      releaseCommit: authority.releaseCommit,
      vercelProjectId: authority.vercelProjectId,
      runtimeMode: authority.runtimeMode,
      directMode: authority.directMode,
      sameDatabaseIdentity: authority.sameDatabaseIdentity,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256,
      migrationStates: migration.plan.migrationStates,
      bundleSha256: checksum,
      sourceFilesVerifiedByBundle: bundle.sourceFiles.length,
      plan: plan.planned,
      preservationCounts: stringifyBigInts(migration.counts),
      candidates,
      commercialBefore: {
        affiliatePrograms: before.affiliatePrograms,
        affiliateOffers: before.affiliateOffers,
        affiliateTrackingLinks: before.affiliateTrackingLinks,
        affiliateRouteCountries: before.affiliateRouteCountries,
        affiliateRedirects: before.affiliateRedirects,
        productionEligibleRoutes: before.productionEligibleRoutes,
      },
      migrationExecutionAuthorised: false,
      runtimePromotionAuthorised: false,
    });

    const imported = await ingestCasinoBundle(prisma, bundle);
    importPerformed = true;
    assertReconciliation(imported.reconciliation);
    const afterImport = await readInventory(prisma);
    assertInventoryDelta(before, afterImport, IMPORT_DELTAS, "IMPORT_INVENTORY_DELTA_MISMATCH");
    const importedAggregate = await loadBetssonAggregate(prisma);
    assertFactualAggregate(importedAggregate, bundle, EditorialStatus.DRAFT);
    const importIdempotency = await verifyCasinoBundleIdempotency(prisma, bundle);
    if (importIdempotency.created !== 0 || importIdempotency.updated !== 0 || importIdempotency.unchanged !== 78) {
      fail("IMPORT_IDEMPOTENCY_MISMATCH", "The read-only post-import comparison was not exactly idempotent.");
    }
    writeEvent({
      event: "casino_betsson_pe_se_production_import_succeeded",
      timestamp: now().toISOString(),
      casinoId: importedAggregate.id,
      markets: importedAggregate.countries.map((market) => ({ id: market.id, countryCode: market.countryCode })),
      reconciliation: imported.reconciliation,
      idempotency: { mode: "READ_ONLY_COMPARISON", created: 0, updated: 0, unchanged: importIdempotency.unchanged },
      importExecutions: 1,
      commercialMutation: false,
    });

    const publication = await publishFactualAggregate(prisma, bundle, now());
    publicationPerformed = true;
    const afterPublication = await readInventory(prisma);
    assertInventoryDelta(afterImport, afterPublication, PUBLICATION_DELTAS, "PUBLICATION_INVENTORY_DELTA_MISMATCH");
    const published = await assertPublishedProjection(prisma, bundle);
    const finalIdempotency = await verifyCasinoBundleIdempotency(prisma, bundle);
    if (finalIdempotency.created !== 0 || finalIdempotency.updated !== 0 || finalIdempotency.unchanged !== 78) {
      fail("FINAL_IDEMPOTENCY_MISMATCH", "The final read-only bundle comparison was not exactly idempotent.");
    }
    const steadyState = await inspectCasinoMarket0025Release(prisma, authority.repositoryMigrations);
    writeEvent({
      event: "casino_betsson_pe_se_factual_publication_succeeded",
      timestamp: now().toISOString(),
      casinoId: publication.casinoId,
      versionId: publication.versionId,
      revisionId: publication.revisionId,
      version: publication.version,
      status: published.casino.status,
      editorScore: published.casino.editorScore,
      bonusPublicationState: published.casino.countries.map((market) => ({
        countryCode: market.countryCode,
        statuses: market.bonuses.map((bonus) => ({ status: bonus.status, offerStatus: bonus.offerStatus })),
      })),
      steadyState,
      publicMarkets: ["PE", "SE"],
      crossMarketLeakage: false,
      affiliateActionAvailable: false,
    });
    writeEvent({
      event: "casino_betsson_pe_se_production_factual_release_succeeded",
      timestamp: now().toISOString(),
      releaseCommit: authority.releaseCommit,
      bundleSha256: checksum,
      mutationPerformed: true,
      importPerformed: true,
      publicationPerformed: true,
      importExecutions: 1,
      migrationExecutionAuthorised: false,
      runtimePromotionAuthorised: false,
      commercialMutation: false,
      productionEligibleRoutesBefore: before.productionEligibleRoutes,
      productionEligibleRoutesAfter: afterPublication.productionEligibleRoutes,
      affiliateRouteCountriesBefore: before.affiliateRouteCountries,
      affiliateRouteCountriesAfter: afterPublication.affiliateRouteCountries,
      finalInventory: afterPublication,
      idempotency: { mode: "READ_ONLY_COMPARISON", created: 0, updated: 0, unchanged: finalIdempotency.unchanged },
    });
    return {
      state: "factual_release_succeeded" as const,
      mutationPerformed: true as const,
      importPerformed: true as const,
      publicationPerformed: true as const,
      casinoId: publication.casinoId,
      versionId: publication.versionId,
      revisionId: publication.revisionId,
    };
  } catch (error) {
    const code = error instanceof BetssonFactualReleaseError
      ? error.code
      : "UNEXPECTED_FACTUAL_RELEASE_FAILURE";
    writeEvent({
      event: "casino_betsson_pe_se_production_factual_release_failed",
      code,
      databaseConnectionOccurred,
      importPerformed,
      publicationPerformed,
      mutationStatus: publicationPerformed ? "import_and_publication_completed" : importPerformed ? "import_completed_publication_not_confirmed" : "none",
    });
    throw new BetssonFactualReleaseError(code, code);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

export async function runBetssonProductionFactualReleaseAndStop(options: ReleaseOptions = {}): Promise<never> {
  await runBetssonProductionFactualRelease(options);
  throw new BetssonFactualReleaseError(BETSSON_FACTUAL_RELEASE_COMPLETE_STOP, BETSSON_FACTUAL_RELEASE_COMPLETE_STOP);
}
