import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { EditorialStatus, Prisma, PrismaClient } from "@prisma/client";

import { CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID } from "@/lib/casino-ingestion/casino-data-population-01-vercel-target";
import { parseCasinoIngestionBundle, type CasinoIngestionBundle } from "@/lib/casino-ingestion/contract";
import {
  deterministicCasinoIngestionId,
  ingestCasinoBundlesInTransaction,
  planCasinoIngestion,
  verifyCasinoBundlesIdempotency,
  verifyCasinoBundlesIdempotencyInTransaction,
  type ReconciliationCounts,
} from "@/lib/casino-ingestion/importer";
import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import {
  CASINO_MARKET_TARGET_MIGRATION,
  casinoMarketRepositoryChecksum,
  casinoMarketRepositoryMigrations,
  runCasinoMarket0025ReadOnlyTransaction,
} from "@/lib/db/casino-market-0025-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";
import { mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";

export const CASINO_DATA_POPULATION_01_MANIFEST_PATH = "data/casino-ingestion/casino-data-population-01/manifest.v1.json";
export const CASINO_DATA_POPULATION_01_MANIFEST_SHA256 = "5c11dc16eb20807fa20a705f0d58d6a64045b95d803f1447c051780d2213c8d2";
export const CASINO_DATA_POPULATION_01_MIGRATION_SHA256 = "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99";
export const CASINO_DATA_POPULATION_01_AUTHORITY = `B4GAMBLE_PRODUCTION_FACTUAL_RELEASE:CASINO-DATA-POPULATION-01:GB:${CASINO_DATA_POPULATION_01_MANIFEST_SHA256}`;
export const CASINO_DATA_POPULATION_01_COMPLETE_STOP = "CASINO_DATA_POPULATION_01_COMPLETE_STOP";

export const CASINO_DATA_POPULATION_01_BUNDLES = [
  { key: "hello-casino", path: "data/casino-ingestion/casino-data-population-01/hello-casino-gb.v1.json", sha256: "9996b4c6ea195bcd259a4b84ade3276057e3a9e17110c71470555b9bc6e94d40" },
  { key: "skol-casino", path: "data/casino-ingestion/casino-data-population-01/skol-casino-gb.v1.json", sha256: "6d934fd81f34f19e9f906bc22a41cc5dcaedfc5669833790043e39a8ca9715b8" },
  { key: "diamond7", path: "data/casino-ingestion/casino-data-population-01/diamond7-gb.v1.json", sha256: "0abec393d1ec974a3212255c6e65ba469798a132e62ded092782d78163960940" },
  { key: "gday-casino", path: "data/casino-ingestion/casino-data-population-01/gday-casino-gb.v1.json", sha256: "3e4d43d3a070e83b73b8f1fb5646e6df77ecd105a32b95cfb08e1faba9efe679" },
  { key: "21-prive", path: "data/casino-ingestion/casino-data-population-01/21-prive-gb.v1.json", sha256: "7619d8019a1deb764a9fe1fdad44c4b8dfefc6d108e44a29ec22e513945a4f97" },
  { key: "slotnite", path: "data/casino-ingestion/casino-data-population-01/slotnite-gb.v1.json", sha256: "013adbd77056271856b0e4a606336fe62f8f613a9836ddab626e5116244989f1" },
  { key: "dragonbet", path: "data/casino-ingestion/casino-data-population-01/dragonbet-gb.v1.json", sha256: "3b8ebaae872deadaa364159cc31333a5dc660e5dae5ba64841db289c63742092" },
] as const;

const EXPECTED_PRODUCTION_BASELINE = {
  casinos: 27,
  markets: 27,
  operators: 2,
  brands: 1,
  licenses: 28,
  licenseEvidence: 4,
  marketEvidence: 24,
  licenseLinks: 3,
  payments: 78,
  providers: 50,
  categories: 64,
  bonuses: 27,
  media: 1,
  images: 75,
  versions: 45,
  revisions: 242,
  seo: 25,
  editorialReviews: 25,
  affiliatePrograms: 5,
  affiliateOffers: 5,
  affiliateTrackingLinks: 5,
  affiliateRouteCountries: 0,
  affiliateRedirects: 5,
  casinoAffiliateLinks: 0,
  legacyAffiliateLinks: 0,
  commercialOpportunities: 60,
  productionEligibleRoutes: 0,
} as const;

type Inventory = { [Key in keyof typeof EXPECTED_PRODUCTION_BASELINE]: number };

const IMPORT_DELTAS: Inventory = {
  casinos: 7,
  markets: 7,
  operators: 2,
  brands: 7,
  licenses: 7,
  licenseEvidence: 14,
  marketEvidence: 53,
  licenseLinks: 7,
  payments: 0,
  providers: 3,
  categories: 14,
  bonuses: 0,
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
};

const PUBLICATION_DELTAS: Inventory = {
  ...Object.fromEntries(Object.keys(IMPORT_DELTAS).map((key) => [key, 0])) as Inventory,
  versions: 7,
  revisions: 7,
};

const EXPECTED_RECONCILIATION = {
  CasinoBrand: { created: 7, unchanged: 0 },
  Casino: { created: 7, unchanged: 0 },
  CasinoOperator: { created: 2, unchanged: 5 },
  CasinoCountry: { created: 7, unchanged: 0 },
  CasinoCountryEvidence: { created: 53, unchanged: 0 },
  CasinoLicense: { created: 7, unchanged: 0 },
  CasinoCountryLicense: { created: 7, unchanged: 0 },
  CasinoLicenseEvidence: { created: 14, unchanged: 0 },
  CasinoGameProvider: { created: 3, unchanged: 0 },
  CasinoGameCategory: { created: 14, unchanged: 0 },
} as const;

type ReleaseEnvironment = Record<string, string | undefined>;
type ReleaseAuthority = "production" | "disposable-test";
type ReleaseEvent = Record<string, unknown>;

type ReleaseOptions = {
  authority?: ReleaseAuthority;
  environment?: ReleaseEnvironment;
  now?: () => Date;
  writeEvent?: (event: ReleaseEvent) => void;
  createPrismaClient?: () => PrismaClient;
  beforePublicationForTestOnly?: () => void | Promise<void>;
};

type PopulationManifest = {
  schemaVersion: string;
  decisionSources: Array<{ path: string; sha256: string }>;
  bundles: Array<{ casinoKey: string; countryCode: string; path: string; sha256: string; sourceFiles: number }>;
  skipped: Array<{ casino: string; reasonCode: string }>;
  assets: { publicationCount: number; fallbackRequired: boolean };
  commercial: { routeWrites: number; productionEligibleRoutes: number };
};

type CandidateState = {
  casinos: number;
  brands: number;
  operators: number;
  markets: number;
  licenses: number;
  evidence: number;
  categories: number;
  providers: number;
  aliases: number;
};

type MigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
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

export class CasinoDataPopulation01ReleaseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoDataPopulation01ReleaseError";
  }
}

function fail(code: string, message: string): never {
  throw new CasinoDataPopulation01ReleaseError(code, message);
}

function checksum(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fullCommit(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{40}$/.test(value));
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

function loadAuthorisedPopulation() {
  const manifestBytes = readFileSync(CASINO_DATA_POPULATION_01_MANIFEST_PATH);
  if (checksum(manifestBytes) !== CASINO_DATA_POPULATION_01_MANIFEST_SHA256) {
    fail("MANIFEST_CHECKSUM_MISMATCH", "The frozen population manifest checksum does not match authority.");
  }
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as PopulationManifest;
  if (
    manifest.schemaVersion !== "casino-data-population-01.v1"
    || manifest.decisionSources.length !== 5
    || manifest.bundles.length !== CASINO_DATA_POPULATION_01_BUNDLES.length
    || manifest.assets.publicationCount !== 0
    || manifest.assets.fallbackRequired !== true
    || manifest.commercial.routeWrites !== 0
    || manifest.commercial.productionEligibleRoutes !== 0
    || JSON.stringify(manifest.skipped.map((entry) => [entry.casino, entry.reasonCode])) !== JSON.stringify([
      ["Betsson", "UNCHANGED_ALREADY_PRESENT"],
      ["Gentleman Jim", "BLOCKED_NO_CURRENT_ACTIVE_GB_CASINO"],
    ])
  ) {
    fail("MANIFEST_SCOPE_MISMATCH", "The manifest does not preserve the exact factual-only population decision.");
  }

  const bundles = CASINO_DATA_POPULATION_01_BUNDLES.map((expected, index) => {
    const entry = manifest.bundles[index];
    if (
      !entry
      || entry.casinoKey !== expected.key
      || entry.countryCode !== "GB"
      || entry.path !== expected.path
      || entry.sha256 !== expected.sha256
      || entry.sourceFiles !== 4
    ) {
      fail("MANIFEST_BUNDLE_MISMATCH", "A population manifest entry does not match the approved bundle list.");
    }
    const bytes = readFileSync(expected.path);
    if (checksum(bytes) !== expected.sha256) fail("BUNDLE_CHECKSUM_MISMATCH", `The approved ${expected.key} bundle checksum does not match.`);
    const bundle = parseCasinoIngestionBundle(JSON.parse(bytes.toString("utf8")));
    const plan = planCasinoIngestion(bundle);
    if (
      bundle.casino.key !== expected.key
      || bundle.sourceFiles.length !== 4
      || JSON.stringify(plan.markets) !== JSON.stringify(["GB"])
      || plan.planned.casinos !== 1
      || plan.planned.marketProfiles !== 1
      || plan.planned.licenses !== 1
      || plan.planned.licenseEvidence !== 2
      || plan.planned.payments !== 0
      || plan.planned.bonuses !== 0
      || plan.planned.commercialWrites !== 0
      || bundle.commercialMappings.length !== 0
      || !bundle.markets[0]?.evidence.some((evidence) => evidence.classification === "UNKNOWN")
    ) {
      fail("BUNDLE_SCOPE_MISMATCH", `The approved ${expected.key} bundle exceeded its exact factual scope.`);
    }
    return bundle;
  });

  const totals = bundles.map(planCasinoIngestion).reduce((result, plan) => ({
    licenses: result.licenses + plan.planned.licenses,
    licenseEvidence: result.licenseEvidence + plan.planned.licenseEvidence,
    marketEvidence: result.marketEvidence + plan.planned.marketEvidence,
    providers: result.providers + plan.planned.providers,
    categories: result.categories + plan.planned.categories,
  }), { licenses: 0, licenseEvidence: 0, marketEvidence: 0, providers: 0, categories: 0 });
  if (JSON.stringify(totals) !== JSON.stringify({ licenses: 7, licenseEvidence: 14, marketEvidence: 53, providers: 3, categories: 14 })) {
    fail("POPULATION_TOTALS_MISMATCH", "The approved bundles do not reproduce the exact factual totals.");
  }
  return { manifest, manifestChecksum: checksum(manifestBytes), bundles };
}

export function isCasinoDataPopulation01Requested(environment: ReleaseEnvironment) {
  return [
    environment.CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY,
    environment.CASINO_DATA_POPULATION_01_RELEASE_SOURCE_COMMIT,
    environment.CASINO_DATA_POPULATION_01_EXPECTED_RELEASE_COMMIT,
    environment.CASINO_DATA_POPULATION_01_EXECUTE_PRODUCTION_RELEASE,
  ].some((value) => value !== undefined);
}

export function assertCasinoDataPopulation01Authority(
  environment: ReleaseEnvironment,
  authority: ReleaseAuthority = "production",
) {
  if (environment.CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY !== CASINO_DATA_POPULATION_01_AUTHORITY) {
    fail("EXECUTION_AUTHORITY_MISMATCH", "The exact non-secret population release authority is required.");
  }
  if (environment.CASINO_DATA_POPULATION_01_EXECUTE_PRODUCTION_RELEASE !== "1") {
    fail("EXECUTE_FLAG_REQUIRED", "The explicit population Production release flag is required.");
  }
  const sourceCommit = environment.CASINO_DATA_POPULATION_01_RELEASE_SOURCE_COMMIT;
  const expectedCommit = environment.CASINO_DATA_POPULATION_01_EXPECTED_RELEASE_COMMIT;
  if (!fullCommit(sourceCommit) || !fullCommit(expectedCommit)) {
    fail("FULL_COMMIT_REQUIRED", "Source and expected release commits must be full lowercase Git SHAs.");
  }
  if (sourceCommit !== expectedCommit) fail("RELEASE_COMMIT_MISMATCH", "The verified source commit does not equal the approved release commit.");
  const repositoryMigrations = casinoMarketRepositoryMigrations();
  if (repositoryMigrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    fail("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must remain the final repository migration.");
  }
  if (casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION) !== CASINO_DATA_POPULATION_01_MIGRATION_SHA256) {
    fail("MIGRATION_CHECKSUM_MISMATCH", "Migration 0025 does not match the approved checksum.");
  }
  loadAuthorisedPopulation();

  if (authority === "disposable-test") {
    if (environment.CI !== "true" || environment.NODE_ENV !== "test") {
      fail("DISPOSABLE_TEST_AUTHORITY_REQUIRED", "Disposable execution requires explicit CI and test authority.");
    }
    if (databaseIdentity(environment.DATABASE_URL) !== databaseIdentity(environment.DIRECT_URL)) {
      fail("DATABASE_IDENTITY_MISMATCH", "Runtime and direct disposable database identities do not match.");
    }
    return {
      releaseCommit: sourceCommit!,
      repositoryMigrations,
      environment: "disposable-test" as const,
      runtimeMode: "disposable" as const,
      directMode: "direct-disposable" as const,
      sameDatabaseIdentity: true as const,
      vercelProjectId: null,
    };
  }

  if (environment.VERCEL_ENV !== "production") fail("PRODUCTION_ENVIRONMENT_REQUIRED", "Population execution requires Vercel Production.");
  if (environment.VERCEL !== "1") fail("VERCEL_BUILD_REQUIRED", "Population execution requires the Vercel build environment.");
  if (environment.VERCEL_PROJECT_ID !== CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID) {
    fail("VERCEL_PROJECT_REFUSED", "The population build is not running in the approved Vercel project.");
  }
  if (!environment.DATABASE_URL || !environment.DIRECT_URL) fail("DATABASE_BINDINGS_REQUIRED", "Approved pooled and direct Production bindings are required.");
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
    releaseCommit: sourceCommit!,
    repositoryMigrations,
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
    vercelProjectId: environment.VERCEL_PROJECT_ID,
  };
}

async function inspectMigrationState(prisma: PrismaClient, repositoryMigrations: string[]) {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    await transaction.$executeRawUnsafe("SET LOCAL statement_timeout = '20s'");
    const rows = await transaction.$queryRawUnsafe<MigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    if (rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
      fail("UNRESOLVED_MIGRATION", "Production contains an unresolved migration row.");
    }
    const completed = rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
    const completedByName = new Map(completed.map((row) => [row.migration_name, row]));
    if (
      completed.length !== repositoryMigrations.length
      || repositoryMigrations.some((name) => completedByName.get(name)?.checksum !== casinoMarketRepositoryChecksum(name))
    ) {
      fail("MIGRATION_HISTORY_MISMATCH", "Production migration history does not exactly match the release repository.");
    }
    return repositoryMigrations.map((name) => ({ migration: name, state: "applied" as const }));
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    maxWait: 5_000,
    timeout: 30_000,
  });
}

async function readInventoryFromQueryClient(database: QueryClient): Promise<Inventory> {
    const [
      casinos, markets, operators, brands, licenses, licenseEvidence, marketEvidence, licenseLinks,
      payments, providers, categories, bonuses, media, images, versions, revisions, seo, editorialReviews,
      affiliatePrograms, affiliateOffers, affiliateTrackingLinks, affiliateRouteCountries, affiliateRedirects,
      casinoAffiliateLinks, legacyAffiliateLinks, commercialOpportunities, productionEligibleRoutes,
    ] = await Promise.all([
      database.casino.count(), database.casinoCountry.count(), database.casinoOperator.count(), database.casinoBrand.count(),
      database.casinoLicense.count(), database.casinoLicenseEvidence.count(), database.casinoCountryEvidence.count(), database.casinoCountryLicense.count(),
      database.casinoPaymentMethod.count(), database.casinoGameProvider.count(), database.casinoGameCategory.count(), database.casinoBonus.count(),
      database.mediaAsset.count(), database.casinoImage.count(), database.casinoVersion.count(), database.casinoRevision.count(),
      database.casinoSeo.count(), database.editorialReview.count(), database.affiliateProgram.count(), database.affiliateOffer.count(),
      database.affiliateTrackingLink.count(), database.affiliateTrackingLinkCountry.count(), database.affiliateRedirectSlug.count(),
      database.casinoAffiliateLink.count(), database.affiliateLink.count(), database.commercialOpportunity.count(),
      database.affiliateTrackingLinkCountry.count({ where: { productionEligible: true } }),
    ]);
    return {
      casinos, markets, operators, brands, licenses, licenseEvidence, marketEvidence, licenseLinks,
      payments, providers, categories, bonuses, media, images, versions, revisions, seo, editorialReviews,
      affiliatePrograms, affiliateOffers, affiliateTrackingLinks, affiliateRouteCountries, affiliateRedirects,
      casinoAffiliateLinks, legacyAffiliateLinks, commercialOpportunities, productionEligibleRoutes,
    };
}

async function readInventory(prisma: PrismaClient): Promise<Inventory> {
  return runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => stage(
    "authority_state",
    () => readInventoryFromQueryClient(transaction),
  ));
}

function assertProductionBaseline(inventory: Inventory) {
  for (const key of Object.keys(EXPECTED_PRODUCTION_BASELINE) as Array<keyof Inventory>) {
    if (inventory[key] !== EXPECTED_PRODUCTION_BASELINE[key]) {
      fail("PRODUCTION_BASELINE_MISMATCH", `Production baseline mismatch for ${key}.`);
    }
  }
}

function assertInventoryDelta(before: Inventory, after: Inventory, deltas: Inventory, code: string) {
  for (const key of Object.keys(before) as Array<keyof Inventory>) {
    if (after[key] !== before[key] + deltas[key]) fail(code, `Bounded inventory delta mismatch for ${key}.`);
  }
}

function deterministicIds(bundles: CasinoIngestionBundle[]) {
  const ids = {
    casinos: [] as string[],
    brands: [] as string[],
    operators: [] as string[],
    markets: [] as string[],
    licenses: [] as string[],
    evidence: [] as string[],
    categories: [] as string[],
    providers: [] as string[],
  };
  for (const bundle of bundles) {
    ids.casinos.push(deterministicCasinoIngestionId(`${bundle.casino.key}:casino`));
    ids.brands.push(deterministicCasinoIngestionId(`${bundle.casino.key}:brand:${bundle.casino.brand.key}`));
    for (const market of bundle.markets) {
      ids.operators.push(deterministicCasinoIngestionId(`${bundle.casino.key}:operator:${market.operator.key}`));
      ids.markets.push(deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}`));
      for (const evidence of market.evidence) {
        ids.evidence.push(deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:evidence:${evidence.key}`));
      }
      for (const license of market.licenses) {
        ids.licenses.push(deterministicCasinoIngestionId(`${bundle.casino.key}:license:${market.countryCode}:${license.key}`));
        for (const evidence of license.evidence) {
          ids.evidence.push(deterministicCasinoIngestionId(`${bundle.casino.key}:license:${market.countryCode}:${license.key}:evidence:${evidence.key}`));
        }
      }
      for (const category of market.categories) ids.categories.push(deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:category:${category.key}`));
      for (const provider of market.providers) ids.providers.push(deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:provider:${provider.key}`));
    }
  }
  return ids;
}

async function readCandidateStateFromQueryClient(database: QueryClient, bundles: CasinoIngestionBundle[]): Promise<CandidateState> {
  const ids = deterministicIds(bundles);
  const slugs = bundles.map((bundle) => bundle.casino.slug);
  const domains = bundles.map((bundle) => bundle.casino.domain);
  const titles = bundles.map((bundle) => bundle.casino.title);
  const brandNames = bundles.map((bundle) => bundle.casino.brand.name);
  const brandDomains = bundles.map((bundle) => bundle.casino.brand.domain).filter((value): value is string => Boolean(value));
  const operatorNames = [...new Set(bundles.flatMap((bundle) => bundle.markets.map((market) => market.operator.name)))];
  const localDomains = bundles.flatMap((bundle) => bundle.markets.map((market) => market.localDomain)).filter((value): value is string => Boolean(value));
  const licenseNumbers = bundles.flatMap((bundle) => bundle.markets.flatMap((market) => market.licenses.map((license) => license.licenseNumber))).filter((value): value is string => Boolean(value));
  const normalizedAliases = [...new Set([...slugs, ...titles.map((title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))])];
    const [casinos, brands, operators, markets, licenses, countryEvidence, licenseEvidence, categories, providers, aliases] = await Promise.all([
      database.casino.count({ where: { OR: [{ id: { in: ids.casinos } }, { slug: { in: slugs } }, { domain: { in: domains } }, { title: { in: titles, mode: "insensitive" } }] } }),
      database.casinoBrand.count({ where: { OR: [{ id: { in: ids.brands } }, { name: { in: brandNames, mode: "insensitive" } }, { domain: { in: brandDomains } }] } }),
      database.casinoOperator.count({ where: { OR: [{ id: { in: ids.operators } }, { name: { in: operatorNames, mode: "insensitive" } }] } }),
      database.casinoCountry.count({ where: { OR: [{ id: { in: ids.markets } }, { localDomain: { in: localDomains } }] } }),
      database.casinoLicense.count({ where: { OR: [{ id: { in: ids.licenses } }, { licenseNumber: { in: licenseNumbers } }] } }),
      database.casinoCountryEvidence.count({ where: { id: { in: ids.evidence } } }),
      database.casinoLicenseEvidence.count({ where: { id: { in: ids.evidence } } }),
      database.casinoGameCategory.count({ where: { id: { in: ids.categories } } }),
      database.casinoGameProvider.count({ where: { id: { in: ids.providers } } }),
      database.casinoAlias.count({ where: { normalizedValue: { in: normalizedAliases } } }),
    ]);
    return { casinos, brands, operators, markets, licenses, evidence: countryEvidence + licenseEvidence, categories, providers, aliases };
}

async function readCandidateState(prisma: PrismaClient, bundles: CasinoIngestionBundle[]): Promise<CandidateState> {
  return runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => stage(
    "authority_state",
    () => readCandidateStateFromQueryClient(transaction, bundles),
  ));
}

function assertEmptyCandidateState(state: CandidateState) {
  if (Object.values(state).some((count) => count !== 0)) {
    fail("POPULATION_IDENTITY_COLLISION", `Production contains a pre-existing or ambiguous population identity candidate: ${JSON.stringify(state)}.`);
  }
}

function aggregateReconciliation(results: Array<{ reconciliation: ReconciliationCounts | null }>) {
  const totals: ReconciliationCounts = { created: 0, updated: 0, unchanged: 0, byModel: {} };
  for (const result of results) {
    if (!result.reconciliation) fail("IMPORT_RECONCILIATION_MISSING", "An import result omitted reconciliation counts.");
    totals.created += result.reconciliation.created;
    totals.updated += result.reconciliation.updated;
    totals.unchanged += result.reconciliation.unchanged;
    for (const [model, counts] of Object.entries(result.reconciliation.byModel)) {
      const current = totals.byModel[model] ?? { created: 0, updated: 0, unchanged: 0 };
      totals.byModel[model] = {
        created: current.created + counts.created,
        updated: current.updated + counts.updated,
        unchanged: current.unchanged + counts.unchanged,
      };
    }
  }
  return totals;
}

function assertReconciliation(counts: ReconciliationCounts) {
  if (counts.created !== 121 || counts.updated !== 0 || counts.unchanged !== 5) {
    fail("IMPORT_RECONCILIATION_MISMATCH", "The population import did not create the exact expected factual row set.");
  }
  if (JSON.stringify(Object.keys(counts.byModel).sort()) !== JSON.stringify(Object.keys(EXPECTED_RECONCILIATION).sort())) {
    fail("IMPORT_MODEL_SCOPE_MISMATCH", "The population import touched an unexpected model set.");
  }
  for (const [model, expected] of Object.entries(EXPECTED_RECONCILIATION)) {
    const actual = counts.byModel[model];
    if (!actual || actual.created !== expected.created || actual.updated !== 0 || actual.unchanged !== expected.unchanged) {
      fail("IMPORT_MODEL_RECONCILIATION_MISMATCH", `The population reconciliation mismatch is bounded to ${model}.`);
    }
  }
}

async function loadFactualAggregate(database: QueryClient, slug: string): Promise<FactualAggregate> {
  const casino = await database.casino.findUnique({ where: { slug }, include: factualAggregateInclude });
  if (!casino) fail("POPULATION_CASINO_NOT_FOUND", `The intended ${slug} Casino was not found.`);
  return casino;
}

function assertFactualAggregate(casino: FactualAggregate, bundle: CasinoIngestionBundle, expectedStatus: EditorialStatus) {
  const marketBundle = bundle.markets[0]!;
  const market = casino.countries[0];
  if (
    casino.id !== deterministicCasinoIngestionId(`${bundle.casino.key}:casino`)
    || casino.slug !== bundle.casino.slug
    || casino.title !== bundle.casino.title
    || casino.internalName !== bundle.casino.internalName
    || casino.domain !== bundle.casino.domain
    || casino.websiteUrl !== bundle.casino.websiteUrl
    || casino.status !== expectedStatus
    || casino.editorScore !== null
    || casino.operatorProfileId !== null
    || casino.languages.length !== 0
    || casino.currencies.length !== 0
    || casino.license !== null
    || casino.country !== null
    || casino.brandProfile?.id !== deterministicCasinoIngestionId(`${bundle.casino.key}:brand:${bundle.casino.brand.key}`)
    || casino.images.length !== 0
    || casino.mediaAssets.length !== 0
    || casino.casinoLinks.length !== 0
    || casino.countries.length !== 1
    || !market
    || market.countryCode !== "GB"
    || market.id !== deterministicCasinoIngestionId(`${bundle.casino.key}:market:GB`)
    || market.localDomain !== marketBundle.localDomain
    || market.localWebsiteUrl !== marketBundle.localWebsiteUrl
    || market.operatingLegalEntity !== marketBundle.operatingLegalEntity
    || market.evidence.length !== marketBundle.evidence.length
    || market.licenses.length !== 1
    || market.licenses[0]!.license.evidence.length !== 2
    || market.paymentMethods.length !== 0
    || market.bonuses.length !== 0
    || market.gameProviders.length !== marketBundle.providers.length
    || market.gameCategories.length !== marketBundle.categories.length
    || market.mediaAssets.length !== 0
  ) {
    fail("FACTUAL_AGGREGATE_MISMATCH", `${bundle.casino.key} does not match the frozen factual boundary.`);
  }
  if (!market.evidence.some((evidence) => evidence.classification === "UNKNOWN")) {
    fail("UNKNOWN_EVIDENCE_MISSING", `${bundle.casino.key} did not retain explicit UNKNOWN evidence.`);
  }
  const hasContradiction = market.evidence.some((evidence) => evidence.classification === "CONTRADICTION");
  if ((bundle.casino.key === "dragonbet") !== hasContradiction) {
    fail("CONTRADICTION_STATE_MISMATCH", "The DragonBet-only contradiction boundary changed.");
  }
}

async function assertBetssonUnchanged(database: QueryClient) {
  const betsson = await loadFactualAggregate(database, "betsson");
  if (
    betsson.status !== EditorialStatus.PUBLISHED
    || betsson.editorScore !== null
    || betsson.publishedVersion !== 1
    || betsson.draftVersion !== 2
    || JSON.stringify(betsson.countries.map((market) => market.countryCode)) !== JSON.stringify(["PE", "SE"])
  ) {
    fail("BETSSON_BASELINE_MISMATCH", "The previously published Betsson PE/SE aggregate changed.");
  }
  const version = await database.casinoVersion.findUnique({ where: { casinoId_version: { casinoId: betsson.id, version: 1 } } });
  if (!version || version.status !== EditorialStatus.PUBLISHED || !version.publishedAt) {
    fail("BETSSON_PUBLICATION_MISSING", "The prior Betsson published version is missing.");
  }
  const mapped = mapPublishedCasino({
    casinoId: betsson.id,
    version: version.version,
    status: version.status,
    snapshot: version.snapshot,
    publishedAt: version.publishedAt,
    archivedAt: betsson.archivedAt,
  }, [], { redirectEnabled: false, now: betsson.publishedAt ?? undefined });
  if (!mapped) fail("BETSSON_PUBLIC_PROJECTION_MISSING", "The prior Betsson public projection is missing.");
  const pe = projectPublicCasinoMarket(mapped, "PE");
  const se = projectPublicCasinoMarket(mapped, "SE");
  if (
    pe.domain !== "www.betsson.pe"
    || se.domain !== "www.betsson.com/sv"
    || !pe.payments.some((payment) => payment.key === "yape")
    || pe.payments.some((payment) => payment.key === "swish")
    || !se.payments.some((payment) => payment.key === "swish")
    || se.payments.some((payment) => payment.key === "yape")
    || pe.affiliate.available
    || se.affiliate.available
  ) {
    fail("BETSSON_MARKET_PROJECTION_MISMATCH", "The prior Betsson PE/SE projections changed or leaked.");
  }
  return { casinoId: betsson.id, versionId: version.id };
}

function snapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function publishFactualAggregates(transaction: Prisma.TransactionClient, bundles: CasinoIngestionBundle[], publishedAt: Date) {
    const publications: Array<{ casinoId: string; slug: string; revisionId: string; versionId: string; version: number }> = [];
    for (const bundle of [...bundles].sort((left, right) => left.casino.key.localeCompare(right.casino.key))) {
      const current = await loadFactualAggregate(transaction, bundle.casino.slug);
      assertFactualAggregate(current, bundle, EditorialStatus.DRAFT);
      const [versions, revisions] = await Promise.all([
        transaction.casinoVersion.count({ where: { casinoId: current.id } }),
        transaction.casinoRevision.count({ where: { casinoId: current.id } }),
      ]);
      if (current.publishedVersion !== 0 || current.draftVersion !== 1 || current.publishedAt !== null || versions !== 0 || revisions !== 0) {
        fail("PUBLICATION_BASELINE_MISMATCH", `${bundle.casino.key} is not in its exact first factual publication state.`);
      }
      const actor = "casino-data-population-01-production-release";
      const versionNumber = current.draftVersion;
      const revision = await transaction.casinoRevision.create({
        data: {
          casinoId: current.id,
          revisionNumber: 1,
          snapshot: snapshot(current),
          summary: "Published the frozen exact-market factual profile without asset or commercial activation",
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
      publications.push({ casinoId: current.id, slug: current.slug, revisionId: revision.id, versionId: version.id, version: versionNumber });
    }
    return publications;
}

async function assertPublishedProjections(prisma: QueryClient, bundles: CasinoIngestionBundle[]) {
  const projections: Array<{ casinoId: string; slug: string; versionId: string }> = [];
  for (const bundle of bundles) {
    const casino = await loadFactualAggregate(prisma, bundle.casino.slug);
    assertFactualAggregate(casino, bundle, EditorialStatus.PUBLISHED);
    if (casino.publishedVersion !== 1 || casino.draftVersion !== 2 || !casino.publishedAt) {
      fail("PUBLICATION_STATE_MISMATCH", `${bundle.casino.key} did not reach the exact first published factual state.`);
    }
    const [version, revision] = await Promise.all([
      prisma.casinoVersion.findUnique({ where: { casinoId_version: { casinoId: casino.id, version: 1 } } }),
      prisma.casinoRevision.findUnique({ where: { casinoId_revisionNumber: { casinoId: casino.id, revisionNumber: 1 } } }),
    ]);
    if (!version || version.status !== EditorialStatus.PUBLISHED || !version.publishedAt || !revision) {
      fail("PUBLICATION_EVIDENCE_MISSING", `${bundle.casino.key} is missing its factual publication version or revision.`);
    }
    const mapped = mapPublishedCasino({
      casinoId: casino.id,
      version: version.version,
      status: version.status,
      snapshot: version.snapshot,
      publishedAt: version.publishedAt,
      archivedAt: casino.archivedAt,
    }, [], { redirectEnabled: false, now: casino.publishedAt });
    if (
      !mapped
      || mapped.slug !== bundle.casino.slug
      || mapped.editorScore !== null
      || mapped.affiliate.available
      || mapped.bonuses.length !== 0
      || mapped.media.logo !== null
      || mapped.media.hero !== null
      || mapped.media.screenshots.length !== 0
      || mapped.media.gallery.length !== 0
      || mapped.media.socialImage !== null
    ) {
      fail("PUBLIC_PROJECTION_MISMATCH", `${bundle.casino.key} is unavailable or broadened beyond factual authority.`);
    }
    const gb = projectPublicCasinoMarket(mapped, "GB");
    const unqualified = projectPublicCasinoMarket(mapped, "");
    const se = projectPublicCasinoMarket(mapped, "SE");
    const pe = projectPublicCasinoMarket(mapped, "PE");
    const marketBundle = bundle.markets[0]!;
    if (
      gb.domain !== marketBundle.localDomain
      || JSON.stringify(gb.marketProfiles.map((market) => market.countryCode)) !== JSON.stringify(["GB"])
      || JSON.stringify(gb.countries.map((country) => country.countryCode)) !== JSON.stringify(["GB"])
      || gb.licenses.length !== 1
      || gb.licenses[0]!.authority !== "Gambling Commission"
      || gb.payments.length !== 0
      || gb.bonuses.length !== 0
      || gb.providers.length !== marketBundle.providers.length
      || gb.categories.length !== marketBundle.categories.length
      || gb.affiliate.available
      || !gb.marketProfiles[0]!.evidence.some((evidence) => evidence.classification === "UNKNOWN")
      || (bundle.casino.key === "dragonbet") !== gb.marketProfiles[0]!.evidence.some((evidence) => evidence.classification === "CONTRADICTION")
    ) {
      fail("GB_PUBLIC_PROJECTION_MISMATCH", `${bundle.casino.key} does not expose the exact GB factual projection.`);
    }
    for (const isolated of [unqualified, se, pe]) {
      if (
        isolated.marketProfiles.length !== 0
        || isolated.countries.length !== 0
        || isolated.licenses.length !== 0
        || isolated.payments.length !== 0
        || isolated.providers.length !== 0
        || isolated.categories.length !== 0
        || isolated.bonuses.length !== 0
        || isolated.affiliate.available
      ) {
        fail("NON_GB_PUBLIC_LEAKAGE", `${bundle.casino.key} leaked GB facts outside the GB projection.`);
      }
    }
    projections.push({ casinoId: casino.id, slug: casino.slug, versionId: version.id });
  }
  return projections;
}

export async function runCasinoDataPopulation01ProductionRelease(options: ReleaseOptions = {}) {
  const environment = options.environment ?? process.env;
  const releaseAuthority = options.authority ?? "production";
  const authority = assertCasinoDataPopulation01Authority(environment, releaseAuthority);
  const { manifestChecksum, bundles } = loadAuthorisedPopulation();
  if (options.beforePublicationForTestOnly && releaseAuthority !== "disposable-test") {
    fail("TEST_HOOK_REFUSED", "The publication failure hook is available only to disposable execution tests.");
  }
  const createPrismaClient = options.createPrismaClient ?? (() => createCasinoMarket0025AdminClient(environment));
  const writeEvent = options.writeEvent ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`));
  const now = options.now ?? (() => new Date());
  const prisma = createPrismaClient();
  let databaseConnectionOccurred = false;
  let importPerformed = false;
  let publicationPerformed = false;

  try {
    databaseConnectionOccurred = true;
    const migrationStates = await inspectMigrationState(prisma, authority.repositoryMigrations);
    const before = await readInventory(prisma);
    if (releaseAuthority === "production") assertProductionBaseline(before);
    const [candidates, betsson] = await Promise.all([
      readCandidateState(prisma, bundles),
      assertBetssonUnchanged(prisma),
    ]);
    assertEmptyCandidateState(candidates);
    writeEvent({
      event: "casino_data_population_01_production_release_preflight_verified",
      timestamp: now().toISOString(),
      environment: authority.environment,
      releaseCommit: authority.releaseCommit,
      vercelProjectId: authority.vercelProjectId,
      runtimeMode: authority.runtimeMode,
      directMode: authority.directMode,
      sameDatabaseIdentity: authority.sameDatabaseIdentity,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: CASINO_DATA_POPULATION_01_MIGRATION_SHA256,
      migrationStates,
      manifestSha256: manifestChecksum,
      bundleCount: bundles.length,
      sourceFilesBound: 28,
      decisionRecordsBound: 5,
      preservationCounts: before,
      candidates,
      betsson,
      migrationExecutionAuthorised: false,
      runtimePromotionAuthorised: false,
    });

    const atomicRelease = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe("SET LOCAL statement_timeout = '150s'");
      await transaction.$executeRawUnsafe("SET LOCAL lock_timeout = '10s'");
      await transaction.$executeRawUnsafe("SET LOCAL idle_in_transaction_session_timeout = '180s'");

      const transactionBefore = await readInventoryFromQueryClient(transaction);
      if (JSON.stringify(transactionBefore) !== JSON.stringify(before)) {
        fail("PRODUCTION_BASELINE_CHANGED", "Production inventory changed after the read-only preflight.");
      }
      if (releaseAuthority === "production") assertProductionBaseline(transactionBefore);
      const [transactionCandidates] = await Promise.all([
        readCandidateStateFromQueryClient(transaction, bundles),
        assertBetssonUnchanged(transaction),
      ]);
      assertEmptyCandidateState(transactionCandidates);

      const importedResults = await ingestCasinoBundlesInTransaction(transaction, bundles);
      const reconciliation = aggregateReconciliation(importedResults);
      assertReconciliation(reconciliation);
      const afterImport = await readInventoryFromQueryClient(transaction);
      assertInventoryDelta(transactionBefore, afterImport, IMPORT_DELTAS, "IMPORT_INVENTORY_DELTA_MISMATCH");
      for (const bundle of bundles) {
        assertFactualAggregate(await loadFactualAggregate(transaction, bundle.casino.slug), bundle, EditorialStatus.DRAFT);
      }
      const importIdempotency = await verifyCasinoBundlesIdempotencyInTransaction(transaction, bundles);
      if (importIdempotency.created !== 0 || importIdempotency.updated !== 0 || importIdempotency.unchanged !== 126) {
        fail("IMPORT_IDEMPOTENCY_MISMATCH", "The in-transaction post-import comparison was not exactly idempotent.");
      }

      await options.beforePublicationForTestOnly?.();
      const publications = await publishFactualAggregates(transaction, bundles, now());
      const afterPublication = await readInventoryFromQueryClient(transaction);
      assertInventoryDelta(afterImport, afterPublication, PUBLICATION_DELTAS, "PUBLICATION_INVENTORY_DELTA_MISMATCH");
      const projections = await assertPublishedProjections(transaction, bundles);
      const finalIdempotency = await verifyCasinoBundlesIdempotencyInTransaction(transaction, bundles);
      if (finalIdempotency.created !== 0 || finalIdempotency.updated !== 0 || finalIdempotency.unchanged !== 126) {
        fail("FINAL_IDEMPOTENCY_MISMATCH", "The final in-transaction bundle comparison was not exactly idempotent.");
      }
      await assertBetssonUnchanged(transaction);
      return { reconciliation, importIdempotency, publications, afterPublication, projections, finalIdempotency };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 180_000,
    });
    importPerformed = true;
    publicationPerformed = true;

    const postCommitInventory = await readInventory(prisma);
    if (JSON.stringify(postCommitInventory) !== JSON.stringify(atomicRelease.afterPublication)) {
      fail("POST_COMMIT_INVENTORY_MISMATCH", "The committed Production inventory does not match the atomic release result.");
    }
    const postCommitProjections = await assertPublishedProjections(prisma, bundles);
    if (JSON.stringify(postCommitProjections) !== JSON.stringify(atomicRelease.projections)) {
      fail("POST_COMMIT_PROJECTION_MISMATCH", "The committed public projections do not match the atomic release result.");
    }
    const finalIdempotency = await verifyCasinoBundlesIdempotency(prisma, bundles);
    if (finalIdempotency.created !== 0 || finalIdempotency.updated !== 0 || finalIdempotency.unchanged !== 126) {
      fail("POST_COMMIT_IDEMPOTENCY_MISMATCH", "The committed read-only bundle comparison was not exactly idempotent.");
    }
    await assertBetssonUnchanged(prisma);
    const steadyState = { migrationStates: await inspectMigrationState(prisma, authority.repositoryMigrations) };

    writeEvent({
      event: "casino_data_population_01_production_import_succeeded",
      timestamp: now().toISOString(),
      reconciliation: atomicRelease.reconciliation,
      idempotency: { mode: "IN_ATOMIC_TRANSACTION_COMPARISON", created: 0, updated: 0, unchanged: atomicRelease.importIdempotency.unchanged },
      importExecutions: 1,
      committedWithPublication: true,
      commercialMutation: false,
    });
    writeEvent({
      event: "casino_data_population_01_factual_publication_succeeded",
      timestamp: now().toISOString(),
      publications: atomicRelease.publications,
      projections: postCommitProjections,
      steadyState,
      publicMarkets: ["GB"],
      nonGbLeakage: false,
      affiliateActionAvailable: false,
      assetsPublished: 0,
    });
    writeEvent({
      event: "casino_data_population_01_production_factual_release_succeeded",
      timestamp: now().toISOString(),
      releaseCommit: authority.releaseCommit,
      manifestSha256: manifestChecksum,
      mutationPerformed: true,
      importPerformed: true,
      publicationPerformed: true,
      importExecutions: 1,
      migrationExecutionAuthorised: false,
      runtimePromotionAuthorised: false,
      commercialMutation: false,
      productionEligibleRoutesBefore: before.productionEligibleRoutes,
      productionEligibleRoutesAfter: postCommitInventory.productionEligibleRoutes,
      affiliateRouteCountriesBefore: before.affiliateRouteCountries,
      affiliateRouteCountriesAfter: postCommitInventory.affiliateRouteCountries,
      finalInventory: postCommitInventory,
      idempotency: { mode: "READ_ONLY_COMPARISON", created: 0, updated: 0, unchanged: finalIdempotency.unchanged },
      atomicTransaction: true,
    });
    return {
      state: "factual_release_succeeded" as const,
      mutationPerformed: true as const,
      importPerformed: true as const,
      publicationPerformed: true as const,
      publications: atomicRelease.publications,
      finalInventory: postCommitInventory,
    };
  } catch (error) {
    const code = error instanceof CasinoDataPopulation01ReleaseError
      ? error.code
      : "UNEXPECTED_CASINO_DATA_POPULATION_01_RELEASE_FAILURE";
    writeEvent({
      event: "casino_data_population_01_production_factual_release_failed",
      code,
      databaseConnectionOccurred,
      importPerformed,
      publicationPerformed,
      mutationStatus: publicationPerformed ? "atomic_import_and_publication_completed" : "none",
    });
    if (releaseAuthority === "disposable-test") throw error;
    throw new CasinoDataPopulation01ReleaseError(code, code);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

export async function runCasinoDataPopulation01ProductionReleaseAndStop(options: ReleaseOptions = {}): Promise<never> {
  await runCasinoDataPopulation01ProductionRelease(options);
  throw new CasinoDataPopulation01ReleaseError(CASINO_DATA_POPULATION_01_COMPLETE_STOP, CASINO_DATA_POPULATION_01_COMPLETE_STOP);
}
