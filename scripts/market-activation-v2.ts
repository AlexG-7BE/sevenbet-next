import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

import { Prisma } from "@prisma/client";

import { marketActivationController } from "../lib/market-activation/controller";
import {
  MARKET_ACTIVATION_CONTROLLER_VERSION,
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  safeActivationDestination,
  type MarketActivationIntentInput,
} from "../lib/market-activation/contract";
import { marketActivationRuntime } from "../lib/market-activation/runtime";
import { partnerRouteService } from "../lib/services/partner-route.service";
import { prisma } from "../lib/db/prisma";

const RELEASE = MARKET_ACTIVATION_CONTROLLER_VERSION;
const RECONCILIATION_SEMANTICS = "CANONICAL-CANDIDATE-RESELECTION-V2";
const BASE_MIGRATION = "0031_market_activation_v2";
const MIGRATION = "0032_market_activation_global_fallback";
const GLOBAL_FALLBACK_SHADOW_COUNTRY = "KZ";
const GLOBAL_FALLBACK_SOURCE = "LEGACY:CASINO-COMMERCIAL-VISIBILITY-03:GLOBAL-DEFAULT";
const EXPECTED_GLOBAL_FALLBACKS = [
  "21-prive:21-prive-welcome",
  "diamond7:diamond7-welcome",
  "gday-casino:gday-casino-welcome",
  "hello-casino:hello-casino-welcome",
  "skol-casino:skol-casino-welcome",
  "slotnite:slotnite-welcome",
] as const;
const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const PREVIEW_RESOURCE_ID = "store_hLPkkgamL7rJNmCe";
const PREVIEW_DATABASE_FINGERPRINT = "cebafba022854f716ee4a92a71b5dc9e7d14600fbf144be1598cd90583a775da";
const PRODUCTION_RESOURCE_ID = "store_1I4F54ETrwSKS42o";
const PRODUCTION_DATABASE_FINGERPRINT = "ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e";
const FOUNDER_SOURCE = "FOUNDER:B4GAMBLE-CANONICAL-MARKET-ACTIVATION-MIGRATION:sha256-9601a2a66f0a566a1a08758fff303fe63133a9ab3e192df9a4d33f85cc9f25b8";

type Target = "preview" | "production";
type MigrationRow = { migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null };

const golden = [
  { casinoSlug: "inkabet", countryCode: "PE", redirectSlug: "inkabet-casino" },
  { casinoSlug: "betsson", countryCode: "PE", redirectSlug: "betsson-casino" },
  { casinoSlug: "betsafe", countryCode: "EE", redirectSlug: "betsafe-casino" },
  { casinoSlug: "betsafe", countryCode: "LV", redirectSlug: "betsafe-casino" },
] as const;

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function databaseFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function repositorySha() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function targetEnvironment(): Target {
  const target = process.env.MARKET_ACTIVATION_V2_TARGET;
  if (target !== "preview" && target !== "production") throw new Error("MARKET_ACTIVATION_EXPLICIT_TARGET_REQUIRED");
  return target;
}

function assertWriteAuthority() {
  if (process.env.MARKET_ACTIVATION_V2_CONFIRM !== RELEASE) throw new Error(`Write refused. Set MARKET_ACTIVATION_V2_CONFIRM=${RELEASE}.`);
  if (process.env.ALLOW_MARKET_ACTIVATION_V2_WRITE !== "true") throw new Error("MARKET_ACTIVATION_WRITE_FLAG_REQUIRED");
  const target = targetEnvironment();
  if (process.env.VERCEL_ENV !== target) throw new Error("MARKET_ACTIVATION_VERCEL_ENV_MISMATCH");
  if (process.env.MARKET_ACTIVATION_V2_PROJECT_ID !== PROJECT_ID || process.env.MARKET_ACTIVATION_V2_ORG_ID !== ORG_ID) {
    throw new Error("MARKET_ACTIVATION_VERCEL_IDENTITY_MISMATCH");
  }
  const fingerprint = databaseFingerprint();
  if (process.env.MARKET_ACTIVATION_V2_DATABASE_FINGERPRINT !== fingerprint) {
    throw new Error(`Write refused. Independently verify and set MARKET_ACTIVATION_V2_DATABASE_FINGERPRINT=${fingerprint}.`);
  }
  if (target === "production") {
    if (fingerprint !== PRODUCTION_DATABASE_FINGERPRINT || process.env.MARKET_ACTIVATION_V2_DATABASE_RESOURCE_ID !== PRODUCTION_RESOURCE_ID) {
      throw new Error("MARKET_ACTIVATION_PRODUCTION_DATABASE_IDENTITY_MISMATCH");
    }
  } else {
    if (fingerprint !== PREVIEW_DATABASE_FINGERPRINT
      || process.env.MARKET_ACTIVATION_V2_DATABASE_RESOURCE_ID !== PREVIEW_RESOURCE_ID) {
      throw new Error("MARKET_ACTIVATION_PREVIEW_ISOLATION_NOT_PROVEN");
    }
  }
  const sha = repositorySha();
  if (process.env.MARKET_ACTIVATION_V2_EXPECTED_SHA !== sha) throw new Error(`Write refused. Confirm repository SHA ${sha}.`);
  return { target, fingerprint, repositorySha: sha };
}

async function migrationChecksum(name: string) {
  return sha256(await readFile(`prisma/migrations/${name}/migration.sql`));
}

async function assertMigrationSuffix() {
  const migrations = (await readdir("prisma/migrations", { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (migrations.at(-1) !== MIGRATION) throw new Error(`${MIGRATION} must be the exact migration suffix.`);
}

async function completedMigrations() {
  return prisma.$queryRawUnsafe<MigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

async function assertPriorMigrationState() {
  await assertMigrationSuffix();
  const rows = await completedMigrations();
  const unfinished = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
  if (unfinished.length) throw new Error(`UNFINISHED_MIGRATIONS:${unfinished.map((row) => row.migration_name).join(",")}`);
  const completed = new Set(rows.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name));
  const directories = (await readdir("prisma/migrations", { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name < MIGRATION)
    .map((entry) => entry.name);
  const missing = directories.filter((name) => !completed.has(name));
  if (missing.length) throw new Error(`PRIOR_MIGRATIONS_MISSING:${missing.join(",")}`);
}

async function assertMigrationApplied() {
  const allRows = await completedMigrations();
  const verified = [];
  for (const name of [BASE_MIGRATION, MIGRATION]) {
    const expected = await migrationChecksum(name);
    const completed = allRows.filter((row) => row.migration_name === name && row.finished_at && !row.rolled_back_at);
    if (completed.length !== 1 || completed[0].checksum !== expected) {
      throw new Error(`MARKET_ACTIVATION_MIGRATION_NOT_EXACTLY_ONCE_OR_CHECKSUM_MISMATCHED:${name}`);
    }
    verified.push({ migration: name, checksum: expected, attempts: allRows.filter((row) => row.migration_name === name).length });
  }
  return { migration: MIGRATION, verified };
}

async function migrate() {
  const authority = assertWriteAuthority();
  await assertPriorMigrationState();
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: process.env });
  return { authority, ...(await assertMigrationApplied()) };
}

async function legacyEligibleSnapshot(now = new Date()) {
  const profiles = await prisma.casinoCountry.findMany({
    select: { casinoId: true, countryCode: true },
    orderBy: [{ countryCode: "asc" }, { casinoId: "asc" }],
  });
  const groups = new Map<string, string[]>();
  for (const profile of profiles) groups.set(profile.countryCode, [...(groups.get(profile.countryCode) ?? []), profile.casinoId]);
  const selected = new Map<string, Awaited<ReturnType<typeof partnerRouteService.resolve>>[number]>();
  for (const [countryCode, casinoIds] of groups) {
    const routes = await partnerRouteService.resolve(casinoIds, countryCode, {
      now,
      commercialAllowed: true,
      referralAllowed: true,
      redirectEnabled: true,
    });
    for (const route of routes.filter((entry) => entry.productionEligible)
      .sort((left, right) => left.redirect.id.localeCompare(right.redirect.id) || left.tracking.id.localeCompare(right.tracking.id))) {
      const key = `${route.casino.id}:${countryCode}:CASINO`;
      if (!selected.has(key)) selected.set(key, route);
    }
  }
  const globalCasinoIds = (await prisma.casino.findMany({
    where: {
      versions: { some: { status: "PUBLISHED" } },
      redirectSlugs: { some: { affiliateOfferId: { not: null } } },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  })).map((casino) => casino.id);
  const globalRoutes = await partnerRouteService.resolve(
    globalCasinoIds,
    MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
    { now, commercialAllowed: true, referralAllowed: true, redirectEnabled: true },
  );
  for (const route of globalRoutes.filter((entry) => entry.productionEligible)
    .sort((left, right) => left.redirect.id.localeCompare(right.redirect.id) || left.tracking.id.localeCompare(right.tracking.id))) {
    const key = `${route.casino.id}:${MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE}:CASINO`;
    if (!selected.has(key)) selected.set(key, route);
  }
  return [...selected.values()];
}

function assertExpectedGlobalFallbacks(routes: Array<{ casino: { slug: string }; redirect: { slug: string } }>) {
  const actual = routes.map((route) => `${route.casino.slug}:${route.redirect.slug}`).sort();
  const expected = [...EXPECTED_GLOBAL_FALLBACKS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`GLOBAL_FALLBACK_SNAPSHOT_CHANGED:expected=${expected.join(",")}:actual=${actual.join(",")}`);
  }
}

async function backfill(now = new Date()) {
  const authority = assertWriteAuthority();
  await assertMigrationApplied();
  const legacy = await legacyEligibleSnapshot(now);
  assertExpectedGlobalFallbacks(legacy.filter((route) => route.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE));
  const results = [];
  for (const route of legacy) {
    const globalFallback = route.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE;
    results.push(await marketActivationController.activateCasinoInGeo({
      casinoId: route.casino.id,
      countryCode: route.countryCode,
      product: "CASINO",
      redirectSlugId: route.redirect.id,
      affiliateOfferId: route.offer.id,
      primaryTrackingLinkId: route.tracking.id,
      actorId: RELEASE,
      origin: "BACKFILL",
      reason: globalFallback
        ? "Preserve a currently Production-eligible, Founder-evidenced global-default route as an explicit canonical fallback."
        : "Preserve a currently Production-eligible exact-market route during canonical-authority expansion.",
      sourceReferences: globalFallback
        ? [FOUNDER_SOURCE, GLOBAL_FALLBACK_SOURCE]
        : ["LEGACY_PARTNER_ROUTE_PROJECTION", route.tracking.countryAuthority?.productionEligibilityEvidence ?? FOUNDER_SOURCE],
      idempotencyKey: `${RELEASE}:backfill:${route.casino.id}:${route.countryCode}:CASINO`,
    }, now));
  }
  return { authority, legacyEligibleCombinations: legacy.length, results: results.map(summary) };
}

async function activateGolden(now = new Date()) {
  const authority = assertWriteAuthority();
  await assertMigrationApplied();
  const results = [];
  for (const fixture of golden) {
    results.push(await marketActivationController.activateCasinoInGeo({
      ...fixture,
      product: "CASINO",
      actorId: RELEASE,
      origin: "FOUNDER",
      reason: `Founder-authorized canonical activation for ${fixture.casinoSlug} × ${fixture.countryCode} × CASINO.`,
      sourceReferences: [FOUNDER_SOURCE],
      idempotencyKey: `${RELEASE}:founder:${fixture.casinoSlug}:${fixture.countryCode}:CASINO`,
    }, now));
  }
  results.push(await marketActivationController.disableCasinoInGeo({
    casinoSlug: "betsson",
    countryCode: "CL",
    product: "CASINO",
    actorId: RELEASE,
    origin: "FOUNDER",
    reason: "Founder-authorized negative fixture: Betsson × CL × CASINO must remain inactive.",
    sourceReferences: [FOUNDER_SOURCE],
    idempotencyKey: `${RELEASE}:founder:betsson:CL:CASINO:disabled`,
  }, now));
  return { authority, results: results.map(summary) };
}

function summary(result: Awaited<ReturnType<typeof marketActivationController.setDesiredState>>) {
  return {
    idempotent: result.idempotent,
    casinoSlug: result.activation.casino.slug,
    countryCode: result.activation.countryCode,
    product: result.activation.product,
    desiredState: result.activation.desiredState,
    status: result.activation.status,
    version: result.activation.version,
    redirectSlug: result.activation.redirectSlug?.slug ?? null,
    routeVerificationStatus: result.activation.routeVerificationStatus,
    routeLastCheckedAt: result.activation.routeLastCheckedAt,
    routeFinalHost: result.activation.routeFinalHost,
    externalBlockerCode: result.activation.externalBlockerCode,
  };
}

async function reconcile(now = new Date()) {
  const authority = assertWriteAuthority();
  await assertMigrationApplied();
  const records = await prisma.marketActivation.findMany({ orderBy: [{ countryCode: "asc" }, { casinoId: "asc" }] });
  const results = [];
  for (const record of records) {
    const input: MarketActivationIntentInput = {
      casinoId: record.casinoId,
      countryCode: record.countryCode,
      product: record.product,
      desiredState: record.desiredState,
      redirectSlugId: record.redirectSlugId ?? undefined,
      affiliateOfferId: record.affiliateOfferId ?? undefined,
      actorId: RELEASE,
      origin: "RECONCILER",
      reason: `Reconcile desired ${record.desiredState} state from canonical activation version ${record.version}.`,
      sourceReferences: record.sourceReferences.length ? record.sourceReferences : [FOUNDER_SOURCE],
      // A reconciliation key identifies both the source activation version and
      // the payload semantics. Changing route-selection inputs while reusing an
      // older key would correctly raise an idempotency conflict in Production.
      idempotencyKey: `${RELEASE}:reconcile:${RECONCILIATION_SEMANTICS}:${record.id}:from-version-${record.version}`,
      expectedVersion: record.version,
    };
    results.push(await marketActivationController.setDesiredState(input, now));
  }
  return { authority, reconciled: results.length, results: results.map(summary) };
}

async function schemaAvailable() {
  const [row] = await prisma.$queryRaw<Array<{ available: boolean }>>(Prisma.sql`
    SELECT to_regclass('public."MarketActivation"') IS NOT NULL AS available
  `);
  return row?.available === true;
}

async function inventory() {
  const legacyAuthorityRows = await prisma.affiliateTrackingLinkCountry.count({ where: { productionEligible: true } });
  const draftPrograms = await prisma.affiliateProgram.count({ where: { OR: [{ status: { not: "ACTIVE" } }, { workflowStatus: { not: "PUBLISHED" } }] } });
  const legacyEligible = await legacyEligibleSnapshot();
  const legacyGlobalFallbacks = legacyEligible.filter((route) => route.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE);
  assertExpectedGlobalFallbacks(legacyGlobalFallbacks);
  const schema = await schemaAvailable();
  const activations = schema ? await prisma.marketActivation.groupBy({ by: ["desiredState", "status"], _count: { _all: true } }) : [];
  return {
    release: RELEASE,
    classification: "DETECTED",
    databaseFingerprint: databaseFingerprint(),
    schemaAvailable: schema,
    legacyCompatibilityAuthorityRows: legacyAuthorityRows,
    legacyIncompletePrograms: draftPrograms,
    legacyEligibleCombinations: legacyEligible.length,
    legacyExactEligibleCombinations: legacyEligible.length - legacyGlobalFallbacks.length,
    legacyGlobalFallbacks: legacyGlobalFallbacks.map((route) => ({
      casinoSlug: route.casino.slug,
      redirectSlug: route.redirect.slug,
    })),
    activationCounts: activations,
    goldenPrerequisites: await Promise.all(golden.map(async (fixture) => {
      const casino = await prisma.casino.findUnique({
        where: { slug: fixture.casinoSlug },
        select: {
          id: true,
          countries: { where: { countryCode: fixture.countryCode }, select: { id: true, availability: true }, take: 2 },
          versions: { where: { status: "PUBLISHED" }, select: { id: true }, take: 2 },
          _count: { select: { mediaAssignments: true, partnerHostedAssignments: true } },
          redirectSlugs: {
            where: { slug: fixture.redirectSlug },
            select: {
              id: true,
              affiliateOffer: {
                select: {
                  id: true,
                  status: true,
                  program: { select: { status: true, workflowStatus: true } },
                  trackingLinks: {
                    where: { countries: { some: { countryCode: fixture.countryCode, mode: "ALLOW" } } },
                    orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }],
                    take: 2,
                    select: {
                      id: true,
                      destinationUrl: true,
                      trackingUrl: true,
                      countries: { where: { countryCode: fixture.countryCode }, select: { productionEligibilityEvidence: true } },
                    },
                  },
                },
              },
            },
            take: 2,
          },
        },
      });
      const route = casino?.redirectSlugs[0] ?? null;
      const tracking = route?.affiliateOffer?.trackingLinks[0] ?? null;
      return {
        ...fixture,
        casinoId: casino?.id ?? null,
        exactMarketProfiles: casino?.countries.length ?? 0,
        marketAvailability: casino?.countries[0]?.availability ?? null,
        publishedProjection: Boolean(casino?.versions.length),
        redirectRows: casino?.redirectSlugs.length ?? 0,
        affiliateOfferId: route?.affiliateOffer?.id ?? null,
        offerStatus: route?.affiliateOffer?.status ?? null,
        programmeStatus: route?.affiliateOffer?.program.status ?? null,
        programmeWorkflow: route?.affiliateOffer?.program.workflowStatus ?? null,
        exactTrackingCandidates: route?.affiliateOffer?.trackingLinks.length ?? 0,
        primaryTrackingLinkId: tracking?.id ?? null,
        storedEvidence: Boolean(tracking?.countries[0]?.productionEligibilityEvidence?.trim()),
        safeDestinations: Boolean(tracking && safeActivationDestination(tracking.destinationUrl) && safeActivationDestination(tracking.trackingUrl)),
        expectedFinalHost: tracking && safeActivationDestination(tracking.destinationUrl) ? new URL(tracking.destinationUrl).hostname.toLowerCase() : null,
        mediaAssignments: (casino?._count.mediaAssignments ?? 0) + (casino?._count.partnerHostedAssignments ?? 0),
      };
    })),
    betssonCl: {
      existingActivation: schema ? await prisma.marketActivation.count({ where: { casino: { slug: "betsson" }, countryCode: "CL", product: "CASINO" } }) : 0,
      exactMarketProfile: await prisma.casinoCountry.count({ where: { casino: { slug: "betsson" }, countryCode: "CL" } }),
      legacyEligibleLinks: await prisma.affiliateTrackingLinkCountry.count({ where: { trackingLink: { offer: { casino: { slug: "betsson" } } }, countryCode: "CL", productionEligible: true } }),
    },
    runtimeAuthority: "MarketActivation",
  };
}

async function shadow(now = new Date()) {
  if (!(await schemaAvailable())) return { release: RELEASE, schemaAvailable: false, comparisons: [], matches: 0, mismatches: 0 };
  const profiles = await prisma.casinoCountry.findMany({ select: { casinoId: true, countryCode: true }, orderBy: [{ countryCode: "asc" }, { casinoId: "asc" }] });
  const comparisons = [];
  for (const profile of profiles) {
    const [legacy, canonical] = await Promise.all([
      partnerRouteService.resolve([profile.casinoId], profile.countryCode, { now, commercialAllowed: true, referralAllowed: true, redirectEnabled: true }),
      marketActivationRuntime.listActive([profile.casinoId], profile.countryCode),
    ]);
    const legacyActive = legacy.some((route) => route.productionEligible);
    const canonicalActive = canonical.length > 0;
    comparisons.push({
      scope: "EXACT_COUNTRY",
      casinoId: profile.casinoId,
      countryCode: profile.countryCode,
      redirectSlug: null,
      legacyActive,
      canonicalActive,
      match: legacyActive === canonicalActive,
    });
  }
  const globalRoutes = (await legacyEligibleSnapshot(now))
    .filter((route) => route.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE);
  assertExpectedGlobalFallbacks(globalRoutes);
  for (const route of globalRoutes) {
    const [legacy, canonical] = await Promise.all([
      partnerRouteService.resolve([route.casino.id], GLOBAL_FALLBACK_SHADOW_COUNTRY, {
        now,
        commercialAllowed: true,
        referralAllowed: true,
        redirectEnabled: true,
      }),
      marketActivationRuntime.listActive([route.casino.id], GLOBAL_FALLBACK_SHADOW_COUNTRY),
    ]);
    const legacyActive = legacy.some((candidate) => candidate.productionEligible
      && candidate.redirect.id === route.redirect.id
      && candidate.offer.id === route.offer.id
      && candidate.tracking.id === route.tracking.id);
    const canonicalActive = canonical.some((activation) => activation.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
      && activation.redirectSlugId === route.redirect.id
      && activation.affiliateOfferId === route.offer.id
      && activation.primaryTrackingLinkId === route.tracking.id);
    comparisons.push({
      scope: "GLOBAL_FALLBACK",
      casinoId: route.casino.id,
      countryCode: GLOBAL_FALLBACK_SHADOW_COUNTRY,
      redirectSlug: route.redirect.slug,
      legacyActive,
      canonicalActive,
      match: legacyActive === canonicalActive,
    });
  }
  return {
    release: RELEASE,
    comparisons,
    matches: comparisons.filter((entry) => entry.match).length,
    mismatches: comparisons.filter((entry) => !entry.match).length,
  };
}

async function verify() {
  await assertMigrationApplied();
  const diagnostics = await marketActivationRuntime.diagnostics();
  const outcomes = [];
  for (const fixture of golden) {
    const activation = await prisma.marketActivation.findFirst({
      where: { casino: { slug: fixture.casinoSlug }, countryCode: fixture.countryCode, product: "CASINO" },
      include: {
        casino: { select: { _count: { select: {
          mediaAssignments: { where: { active: true, OR: [{ countryCode: fixture.countryCode }, { countryCode: null }] } },
          partnerHostedAssignments: { where: { active: true, OR: [{ countryCode: fixture.countryCode }, { countryCode: null }] } },
        } } } },
        redirectSlug: { select: { slug: true } },
      },
    });
    const route = await marketActivationRuntime.resolveRedirect(fixture.redirectSlug, fixture.countryCode);
    const mediaAssignments = activation
      ? activation.casino._count.mediaAssignments + activation.casino._count.partnerHostedAssignments
      : 0;
    const exactInternalBindingsReady = Boolean(activation?.desiredState === "ACTIVE"
      && activation.marketProfileId
      && activation.affiliateOfferId
      && activation.primaryTrackingLinkId
      && activation.redirectSlugId
      && activation.redirectSlug?.slug === fixture.redirectSlug
      && mediaAssignments > 0);
    const ok = exactInternalBindingsReady && activation?.status === "ACTIVE"
      && activation.routeVerificationStatus === "HEALTHY" && Boolean(activation.routeLastCheckedAt && activation.routeFinalHost)
      && Boolean(route);
    const boundedExternalRouteBlocker = exactInternalBindingsReady
      && activation?.desiredState === "ACTIVE"
      && activation.status === "BLOCKED_EXTERNAL"
      && activation.routeVerificationStatus !== "NOT_CHECKED"
      && activation.externalBlockerSource === "AffiliateRouteHealth"
      && activation.externalBlockerCode === `ROUTE_VERIFICATION_${activation.routeVerificationStatus}`
      && Boolean(activation.externalBlockerDetail && activation.routeLastCheckedAt);
    outcomes.push({
      ...fixture,
      ok,
      internallyReconciled: ok || boundedExternalRouteBlocker,
      boundedExternalRouteBlocker,
      desiredState: activation?.desiredState ?? null,
      status: activation?.status ?? null,
      routeVerificationStatus: activation?.routeVerificationStatus ?? null,
      routeLastCheckedAt: activation?.routeLastCheckedAt ?? null,
      routeFinalHost: activation?.routeFinalHost ?? null,
      externalBlockerCode: activation?.externalBlockerCode ?? null,
      externalBlockerDetail: activation?.externalBlockerDetail ?? null,
      externalBlockerSource: activation?.externalBlockerSource ?? null,
      mediaAssignments,
    });
  }
  const betssonCl = await prisma.marketActivation.findFirst({ where: { casino: { slug: "betsson" }, countryCode: "CL", product: "CASINO" } });
  const betssonClRoute = await marketActivationRuntime.resolveRedirect("betsson-casino", "CL");
  const negativeOk = (!betssonCl || betssonCl.status !== "ACTIVE" || betssonCl.desiredState !== "ACTIVE") && !betssonClRoute;
  const globalFallbacks = await prisma.marketActivation.findMany({
    where: { countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE, product: "CASINO" },
    include: { casino: { select: { slug: true } }, redirectSlug: { select: { slug: true } } },
    orderBy: [{ casino: { slug: "asc" } }, { id: "asc" }],
  });
  assertExpectedGlobalFallbacks(globalFallbacks.flatMap((activation) => activation.redirectSlug
    ? [{ casino: activation.casino, redirect: activation.redirectSlug }]
    : []));
  const globalOutcomes = [];
  for (const activation of globalFallbacks) {
    const [allowed, chile, greatBritain] = await Promise.all([
      marketActivationRuntime.listActive([activation.casinoId], GLOBAL_FALLBACK_SHADOW_COUNTRY),
      marketActivationRuntime.listActive([activation.casinoId], "CL"),
      marketActivationRuntime.listActive([activation.casinoId], "GB"),
    ]);
    const fallbackAllowed = allowed.some((route) => route.id === activation.id);
    const fallbackBlockedInChile = chile.every((route) => route.id !== activation.id);
    const fallbackBlockedInGreatBritain = greatBritain.every((route) => route.id !== activation.id);
    globalOutcomes.push({
      casinoSlug: activation.casino.slug,
      redirectSlug: activation.redirectSlug?.slug ?? null,
      ok: activation.desiredState === "ACTIVE"
        && activation.status === "ACTIVE"
        && activation.marketProfileId === null
        && activation.routeVerificationStatus === "HEALTHY"
        && fallbackAllowed
        && fallbackBlockedInChile
        && fallbackBlockedInGreatBritain,
      allowedCountry: GLOBAL_FALLBACK_SHADOW_COUNTRY,
      fallbackAllowed,
      fallbackBlockedInChile,
      fallbackBlockedInGreatBritain,
    });
  }
  if (outcomes.some((entry) => !entry.internallyReconciled) || !negativeOk || globalOutcomes.some((entry) => !entry.ok)) {
    throw new Error("MARKET_ACTIVATION_INTERNAL_OR_GLOBAL_VERIFICATION_FAILED");
  }
  return {
    release: RELEASE,
    verified: outcomes.every((entry) => entry.ok) && negativeOk && globalOutcomes.every((entry) => entry.ok),
    internalVerificationPassed: true,
    externallyBlockedGoldenFixtures: outcomes.filter((entry) => entry.boundedExternalRouteBlocker).map((entry) => ({
      casinoSlug: entry.casinoSlug,
      countryCode: entry.countryCode,
      externalBlockerCode: entry.externalBlockerCode,
      externalBlockerDetail: entry.externalBlockerDetail,
      externalBlockerSource: entry.externalBlockerSource,
    })),
    outcomes,
    betssonCl: { ok: negativeOk, desiredState: betssonCl?.desiredState ?? null, status: betssonCl?.status ?? null },
    globalFallbacks: globalOutcomes,
    diagnostics,
  };
}

async function release() {
  const migration = await migrate();
  const backfillResult = await backfill();
  const goldenResult = await activateGolden();
  const shadowResult = await shadow();
  if (shadowResult.mismatches !== 0) throw new Error(`MARKET_ACTIVATION_SHADOW_MISMATCHES:${shadowResult.mismatches}`);
  const reconcileResult = await reconcile();
  const verification = await verify();
  return { migration, backfill: backfillResult, golden: goldenResult, shadow: shadowResult, reconcile: reconcileResult, verification };
}

async function main() {
  const mode = process.argv[2] ?? "audit";
  const result = mode === "audit" ? await inventory()
    : mode === "migrate" ? await migrate()
      : mode === "backfill" ? await backfill()
        : mode === "activate-golden" ? await activateGolden()
          : mode === "reconcile" ? await reconcile()
            : mode === "shadow" ? await shadow()
              : mode === "verify" ? await verify()
                : mode === "release" ? await release()
                  : null;
  if (!result) throw new Error("Usage: market-activation-v2.ts <audit|migrate|backfill|activate-golden|reconcile|shadow|verify|release>");
  console.info(JSON.stringify(result, null, 2));
}

void main().finally(() => prisma.$disconnect());
