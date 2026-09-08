import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus, OfferStatus, Prisma } from "@prisma/client";

import { parseCasinoIngestionBundle } from "@/lib/casino-ingestion/contract";
import {
  ingestCasinoBundlesInTransaction,
  verifyCasinoBundlesIdempotencyInTransaction,
} from "@/lib/casino-ingestion/importer";
import { verifyCasinoIngestionSources } from "@/lib/casino-ingestion/source-verification";
import { readCasinoEditorMetadata, writeCasinoEditorMetadata } from "@/lib/casino-builder/editor-metadata";
import {
  reconcileSafeOfferCorpusInTransaction,
  verifySafeOfferCorpusInTransaction,
} from "@/lib/casino-offer-corpus/safe-offer-corpus";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";
import { editorialReviewService } from "@/lib/services/editorial-review.service";

const RELEASE = "CASINO-REAL-CATALOG-03";
const CORPUS_PATH = "data/casino-real-catalog-03/catalog.v1.json";
const BUNDLE_PATHS = [
  "data/casino-ingestion/betsafe-ee-lv.v1.json",
  "data/casino-ingestion/inkabet-pe.v1.json",
  "data/casino-ingestion/nordicbet-se.v1.json",
  "data/casino-ingestion/rizk-ca.v1.json",
  "data/casino-ingestion/rizk-rs.v1.json",
  "data/casino-ingestion/starcasino-it.v1.json",
  "data/casino-ingestion/supercasino-nz.v1.json",
] as const;

interface CatalogEntry {
  slug: string;
  title: string;
  score: number;
  foundedYear: number | null;
  summary: string;
  description: string;
  bestFor: string[];
  whyWeLikeIt: string[];
  thingsToKnow: string[];
  responsibleGamblingTools: string[];
  markets: string[];
  publicationMode?: "INFORMATIONAL_ONLY";
}

interface CatalogCorpus {
  schemaVersion: string;
  release: string;
  classification: string;
  approvedAt: string;
  scoreAuthority: string;
  commercialAuthority: boolean;
  entries: CatalogEntry[];
}

function jsonRecord(value: Prisma.JsonValue | null): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Prisma.JsonObject
    : {};
}

async function loadCorpus() {
  const corpus = JSON.parse(await readFile(path.join(process.cwd(), CORPUS_PATH), "utf8")) as CatalogCorpus;
  if (corpus.schemaVersion !== "casino-real-catalog-03.v1" || corpus.release !== RELEASE) {
    throw new Error(`${RELEASE}: release corpus identity mismatch`);
  }
  if (corpus.commercialAuthority !== false) throw new Error(`${RELEASE}: factual/editorial release must not grant commercial authority`);
  const expected = [
    ["inkabet", 9.0],
    ["betsafe", 8.8],
    ["starcasino", 8.7],
    ["supercasino", 8.6],
    ["nordicbet", 8.5],
    ["rizk", 8.4],
  ] as const;
  if (corpus.entries.length !== expected.length) throw new Error(`${RELEASE}: expected exactly six catalog entries`);
  for (const [index, [slug, score]] of expected.entries()) {
    const entry = corpus.entries[index];
    if (!entry || entry.slug !== slug || entry.score !== score) throw new Error(`${RELEASE}: Founder score/order mismatch for ${slug}`);
    if (!Number.isInteger(entry.score * 10)) throw new Error(`${RELEASE}: score must have one decimal place for ${slug}`);
  }
  const rizk = corpus.entries.find((entry) => entry.slug === "rizk");
  if (!rizk || rizk.markets.includes("NZ")) throw new Error(`${RELEASE}: Rizk NZ must remain excluded while legal evidence is contradictory`);
  return corpus;
}

async function loadBundles() {
  const bundles = [];
  for (const bundlePath of BUNDLE_PATHS) {
    const bundle = parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), bundlePath), "utf8")));
    await verifyCasinoIngestionSources(bundle, process.cwd());
    if (bundle.commercialMappings.length !== 0) throw new Error(`${RELEASE}: commercial mappings are not allowed in ${bundlePath}`);
    bundles.push(bundle);
  }
  return bundles;
}

async function selectActor() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error(`${RELEASE}: no governed CMS actor is available`);
  return actor.id;
}

async function assertProductionSchema() {
  const [state] = await prisma.$queryRawUnsafe<Array<{
    unfinished: bigint;
    market_migration: bigint;
    activation_migration: bigint;
  }>>(`
    SELECT
      COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL)::bigint AS unfinished,
      COUNT(*) FILTER (WHERE "migration_name" = '0025_casino_market_profile_architecture' AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS market_migration,
      COUNT(*) FILTER (WHERE "migration_name" = '0032_market_activation_global_fallback' AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS activation_migration
    FROM "_prisma_migrations"
  `);
  if (!state || state.unfinished !== 0n || state.market_migration !== 1n || state.activation_migration !== 1n) {
    throw new Error(`${RELEASE}: Production schema/readiness invariant failed`);
  }
}

function editorialDocument(entry: CatalogEntry): CasinoEditorialDocument {
  const informational = entry.publicationMode === "INFORMATIONAL_ONLY";
  return {
    version: 1,
    title: `${entry.title} Casino Review`,
    summary: entry.summary,
    author: "B4GAMBLE Editorial Team",
    factCheckedAt: "2026-09-08T00:00:00.000Z",
    trustScore: {
      overall: entry.score,
      categories: [],
      confidence: entry.slug === "rizk" ? "medium" : "high",
      evidence: [
        "Exact-market facts are sourced from the checksum-verified CASINO-REAL-CATALOG-03 ingestion corpus.",
        "Editor Score is Founder-approved editorial authority and is independent of affiliate compensation or route eligibility.",
      ],
    },
    sections: [
      {
        id: "overview",
        kind: "overview",
        title: "Overview",
        order: 0,
        blocks: [
          { id: "overview-copy", type: "paragraph", text: entry.description },
          ...(informational ? [{ id: "informational-only", type: "information" as const, title: "Informational review", text: "This review is published for neutral information only. This release does not create a promotional or referral route." }] : []),
        ],
      },
      { id: "best-for", kind: "pros", title: "Best for", order: 1, blocks: [{ id: "best-for-list", type: "pros", items: entry.bestFor }] },
      { id: "why-we-like-it", kind: "trust", title: "Why we like it", order: 2, blocks: [{ id: "why-list", type: "bullet-list", items: entry.whyWeLikeIt }] },
      { id: "things-to-know", kind: "cons", title: "Things to know", order: 3, blocks: [{ id: "know-list", type: "cons", items: entry.thingsToKnow }] },
      { id: "score-method", kind: "notes", title: "How the score works", order: 4, blocks: [{ id: "score-note", type: "information", title: `Editor Score ${entry.score.toFixed(1)}/10`, text: "The score is editorial. It does not grant commercial eligibility, alter jurisdiction checks or activate an affiliate route." }] },
      { id: "review-faq", kind: "faq", title: "FAQ", order: 5, blocks: [{ id: "faq-score", type: "faq", question: `Does ${entry.title}'s score mean B4GAMBLE can send me there?`, answer: "No. Editorial publication and commercial outbound eligibility are independent. Any outbound action requires separate governed route and jurisdiction authority." }] },
    ],
    relatedCasinoIds: [],
    seo: {
      title: `${entry.title} Casino Review & Editor Score | B4GAMBLE`,
      description: `${entry.title} review, exact-market facts and B4GAMBLE Editor Score ${entry.score.toFixed(1)}/10.`,
      canonicalPath: `/casino/${entry.slug}`,
      robots: informational ? "noindex,follow" : "index,follow",
      socialTitle: `${entry.title} Casino Review | B4GAMBLE`,
      socialDescription: entry.summary,
    },
  };
}

async function ingestFactualBundles(
  bundles: Awaited<ReturnType<typeof loadBundles>>,
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '150s'");
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '10s'");
    await tx.$executeRawUnsafe("SET LOCAL idle_in_transaction_session_timeout = '180s'");

    const ingestion = new Array<Awaited<ReturnType<typeof ingestCasinoBundlesInTransaction>>[number]>();
    for (const bundle of bundles) {
      ingestion.push(...await ingestCasinoBundlesInTransaction(tx, [bundle]));
    }

    const idempotency = new Array<Awaited<ReturnType<typeof verifyCasinoBundlesIdempotencyInTransaction>>>();
    for (const bundle of bundles) {
      idempotency.push(await verifyCasinoBundlesIdempotencyInTransaction(tx, [bundle]));
    }

    const expectedOffers = bundles.flatMap((bundle) => bundle.markets.flatMap((market) =>
      market.bonuses.map((bonus) => ({
        casinoSlug: bundle.casino.slug,
        countryCode: market.countryCode,
        bonusSlug: bonus.slug,
      })),
    ));
    const expectedBySlug = new Map(expectedOffers.map((offer) => [offer.bonusSlug, offer]));
    if (expectedBySlug.size !== expectedOffers.length) throw new Error(`${RELEASE}: duplicate factual bonus slug in controlled bundles`);
    const existingOffers = await tx.casinoBonus.findMany({
      where: { slug: { in: [...expectedBySlug.keys()] } },
      select: {
        id: true,
        slug: true,
        casinoCountryId: true,
        offerStatus: true,
        casino: { select: { slug: true } },
        marketProfile: { select: { countryCode: true } },
      },
    });
    if (existingOffers.length !== expectedBySlug.size) throw new Error(`${RELEASE}: factual bonus publication set is incomplete`);
    for (const offer of existingOffers) {
      const expected = expectedBySlug.get(offer.slug);
      if (!expected
        || !offer.casinoCountryId
        || offer.casino.slug !== expected.casinoSlug
        || offer.marketProfile?.countryCode !== expected.countryCode) {
        throw new Error(`${RELEASE}: factual bonus publication scope mismatch for ${offer.slug}`);
      }
    }
    const activation = await tx.casinoBonus.updateMany({
      where: {
        id: { in: existingOffers.map((offer) => offer.id) },
        offerStatus: { not: OfferStatus.ACTIVE },
      },
      data: { offerStatus: OfferStatus.ACTIVE },
    });

    const safeOfferCorpus = await reconcileSafeOfferCorpusInTransaction(tx, actorId);

    return {
      ingestion,
      idempotency,
      publication: { expected: expectedOffers.length, activated: activation.count },
      safeOfferCorpus,
    };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 180_000,
  });
}

async function returnToDraft(casinoId: string, actorId: string) {
  let casino = await casinoService.getCasinoById(casinoId);
  if (casino.status !== EditorialStatus.DRAFT) {
    casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actorId, casino.updatedAt);
  }
  return casino;
}

async function syncEditorial(entry: CatalogEntry, casinoId: string, actorId: string) {
  let review = await editorialReviewService.getByCasinoId(casinoId);
  if (review && review.status !== "DRAFT") review = await editorialReviewService.transition(review.id, "DRAFT", actorId);
  review = await editorialReviewService.saveDraft(casinoId, editorialDocument(entry), `${RELEASE}: factual/editorial review`, actorId);
  review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
  review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
  const revision = review.revisions.find((candidate) => candidate.revisionNumber === review?.draftRevisionNumber);
  if (!revision) throw new Error(`${RELEASE}: missing editorial revision for ${entry.slug}`);
  await editorialReviewService.publish(review.id, revision.id, actorId);
}

async function syncCasino(entry: CatalogEntry, actorId: string) {
  const aggregate = await prisma.casino.findUnique({ where: { slug: entry.slug } });
  if (!aggregate) throw new Error(`${RELEASE}: factual importer did not create ${entry.slug}`);
  if (aggregate.slug.startsWith("demo-") || aggregate.domain.includes("example")) throw new Error(`${RELEASE}: synthetic identity detected for ${entry.slug}`);

  await returnToDraft(aggregate.id, actorId);
  let current = await casinoService.getCasinoById(aggregate.id);
  const metadata = readCasinoEditorMetadata(current.reviewBlocks);
  metadata.general = {
    ...metadata.general,
    trustScore: entry.score,
    featured: false,
    recommended: false,
    internalNotes: `${RELEASE}: Founder-approved overall score; category/filter facts are evidence-driven; commercial authority unchanged.`,
  };

  const tracking = {
    ...jsonRecord(current.trackingMetadata),
    release: RELEASE,
    profilePublicationMode: entry.publicationMode ?? "FACTUAL_EDITORIAL_COMPLETE",
    factualEnrichmentPending: false,
    commercialReferralAuthority: false,
  };

  current = await casinoService.updateCasino(current.id, {
    title: entry.title,
    summary: entry.summary,
    description: entry.description,
    foundedYear: entry.foundedYear,
    editorScore: entry.score,
    pros: entry.bestFor,
    cons: entry.thingsToKnow,
    responsibleGamblingTools: entry.responsibleGamblingTools,
    reviewBlocks: writeCasinoEditorMetadata(current.reviewBlocks, metadata),
    lastReviewedAt: new Date("2026-09-08T00:00:00.000Z"),
    updatedBy: actorId,
    expectedUpdatedAt: current.updatedAt,
  });

  const seo = editorialDocument(entry).seo;
  await prisma.casinoSeo.upsert({
    where: { casinoId: current.id },
    create: {
      casinoId: current.id,
      title: seo.title,
      description: seo.description,
      canonicalUrl: seo.canonicalPath ?? `/casino/${entry.slug}`,
      robots: seo.robots ?? "index,follow",
      socialTitle: seo.socialTitle ?? seo.title,
      socialDescription: seo.socialDescription ?? seo.description,
    },
    update: {
      title: seo.title,
      description: seo.description,
      canonicalUrl: seo.canonicalPath ?? `/casino/${entry.slug}`,
      robots: seo.robots ?? "index,follow",
      socialTitle: seo.socialTitle ?? seo.title,
      socialDescription: seo.socialDescription ?? seo.description,
    },
  });
  await prisma.casino.update({
    where: { id: current.id },
    data: { trackingMetadata: tracking as Prisma.InputJsonValue, updatedBy: actorId },
  });

  await syncEditorial(entry, current.id, actorId);
  current = await casinoService.getCasinoById(current.id);
  current = await casinoService.transitionWorkflow(current.id, EditorialStatus.IN_REVIEW, actorId, current.updatedAt);
  current = await casinoService.transitionWorkflow(current.id, EditorialStatus.APPROVED, actorId, current.updatedAt);
  await casinoService.publishCasino(current.id, actorId, current.updatedAt);
  await prisma.casino.update({ where: { id: current.id }, data: { domainPublicationStatus: "PUBLISHED", updatedBy: actorId } });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "casino-real-catalog-03-publish",
      entityType: "casino",
      entityId: current.id,
      summary: `${RELEASE}: published ${entry.title} with Founder-approved score ${entry.score.toFixed(1)}`,
      metadata: {
        release: RELEASE,
        score: entry.score,
        markets: entry.markets,
        informationalOnly: entry.publicationMode === "INFORMATIONAL_ONLY",
        referralAuthorityGranted: false,
        featuredForced: false,
        recommendedForced: false,
      },
    },
  });
}

async function verifyState(corpus: CatalogCorpus) {
  const state = [];
  for (const entry of corpus.entries) {
    const casino = await prisma.casino.findUnique({
      where: { slug: entry.slug },
      include: {
        countries: {
          select: {
            countryCode: true,
            availability: true,
            paymentMethods: { select: { id: true } },
            gameProviders: { select: { id: true } },
            gameCategories: { select: { id: true } },
            bonuses: { select: { id: true } },
          },
        },
        seo: true,
        editorialReview: { select: { status: true, publishedRevisionId: true } },
        versions: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (!casino) throw new Error(`${RELEASE}: ${entry.slug} missing after release`);
    if (casino.status !== "PUBLISHED" || casino.domainPublicationStatus !== "PUBLISHED") throw new Error(`${RELEASE}: ${entry.slug} is not published`);
    if (casino.editorScore !== entry.score) throw new Error(`${RELEASE}: ${entry.slug} score mismatch`);
    if (casino.editorialReview?.status !== "PUBLISHED" || !casino.editorialReview.publishedRevisionId) throw new Error(`${RELEASE}: ${entry.slug} review is not published`);
    const actualMarkets = casino.countries.map((market) => market.countryCode).sort();
    for (const market of entry.markets) if (!actualMarkets.includes(market)) throw new Error(`${RELEASE}: ${entry.slug} missing market ${market}`);
    if (entry.slug === "rizk" && actualMarkets.includes("NZ")) throw new Error(`${RELEASE}: Rizk NZ unexpectedly entered runtime publication`);
    const activeRedirects = await prisma.affiliateRedirectSlug.count({ where: { casinoId: casino.id, active: true, archivedAt: null } });
    if (entry.slug === "starcasino") {
      if (casino.seo?.robots !== "noindex,follow") throw new Error(`${RELEASE}: StarCasino must remain noindex informational-only`);
      if (activeRedirects !== 0) throw new Error(`${RELEASE}: StarCasino must not gain an outbound route`);
    }
    const snapshot = casino.versions[0]?.snapshot as Prisma.JsonObject | undefined;
    if (!snapshot || snapshot.editorScore !== entry.score) throw new Error(`${RELEASE}: ${entry.slug} latest published snapshot is stale`);
    const snapshotCountries = Array.isArray(snapshot.countries) ? snapshot.countries as Prisma.JsonObject[] : [];
    const snapshotBonuses = snapshotCountries.flatMap((market) => Array.isArray(market.bonuses) ? market.bonuses as Prisma.JsonObject[] : []);
    if (snapshotBonuses.length !== casino.countries.reduce((sum, market) => sum + market.bonuses.length, 0)) {
      throw new Error(`${RELEASE}: ${entry.slug} published bonus snapshot count mismatch`);
    }
    if (snapshotBonuses.some((bonus) => bonus.status !== "PUBLISHED" || bonus.offerStatus !== "ACTIVE")) {
      throw new Error(`${RELEASE}: ${entry.slug} contains a non-public bonus in its published snapshot`);
    }
    state.push({
      slug: entry.slug,
      score: casino.editorScore,
      markets: actualMarkets,
      payments: casino.countries.reduce((sum, market) => sum + market.paymentMethods.length, 0),
      providers: casino.countries.reduce((sum, market) => sum + market.gameProviders.length, 0),
      categories: casino.countries.reduce((sum, market) => sum + market.gameCategories.length, 0),
      bonuses: casino.countries.reduce((sum, market) => sum + market.bonuses.length, 0),
      activeRedirects,
      robots: casino.seo?.robots ?? null,
    });
  }
  const safeOfferCorpus = await prisma.$transaction((tx) => verifySafeOfferCorpusInTransaction(tx));
  console.info(JSON.stringify({ release: RELEASE, verified: true, state, safeOfferCorpus }, null, 2));
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "build-preflight" && mode !== "verify") throw new Error(`${RELEASE}: use build-preflight or verify`);
  const corpus = await loadCorpus();
  if (mode === "build-preflight" && process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: RELEASE, skipped: true, reason: "non-production" }));
    return;
  }
  await assertProductionSchema();
  if (mode === "build-preflight") {
    const bundles = await loadBundles();
    const actorId = await selectActor();
    const ingestion = await ingestFactualBundles(bundles, actorId);
    console.info(JSON.stringify({ release: RELEASE, ingestion }, null, 2));
    for (const entry of corpus.entries) await syncCasino(entry, actorId);
  }
  await verifyState(corpus);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : `${RELEASE}: failed`);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
