import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  mediaIngestPartnerBatchInputSchema,
  mediaIngestionPlanSchema,
  type MediaIngestionPlan,
} from "../lib/media-operations/contracts";
import {
  applyPartnerHostedTargetingContext,
  parsePartnerDescription,
  parsePartnerHostedCreative,
  PartnerHostedCreativeParseError,
} from "../lib/media-operations/partner-hosted";
import { classifyPartnerHostedCommercialRoute } from "../lib/media-operations/partner-hosted-repository";
import { buildMediaPlacementPlan, scoreMediaPlacements } from "../lib/media-operations/planner";
import { mediaBatchItemOutcome } from "../lib/media-operations/service";
import { isDraftMediaAssignmentSubjectState } from "../lib/media-operations/repository";
import { commercialCreativePresentationFamily } from "../lib/media/commercial-formats";
import {
  MEDIA_OPERATIONS_BULK_TARGET_MIGRATION,
  assertMediaOperationsBulk0030MigrationRow,
  mediaOperationsBulkMigrationChecksum,
  planMediaOperationsBulk0030Preflight,
} from "../lib/db/media-operations-bulk-0030-release";

const CASINO_ID = "71000000-0000-4000-8000-000000000001";
const OFFER_ID = "71000000-0000-4000-8000-000000000002";
const CREATIVE_ID = "71000000-0000-4000-8000-000000000003";
const HOSTED_ID = "71000000-0000-4000-8000-000000000004";

function hex24(value: number) {
  return value.toString(16).padStart(24, "0");
}

function bannerflow(index: number) {
  return `<script src="https://c.bannerflow.net/a/${hex24(index + 1)}?did=${hex24(index + 101)}&deeplink=on&adgroupid=${hex24(index + 201)}&redirecturl=https://record.betsn.info/creative-${index}/&media=${209000 + index}&campaign=1"></script>`;
}

function hostedPlan(input: {
  width: number;
  height: number;
  commercialRouteValidity: "MATCH" | "MISSING";
  commercialRouteReason?: string | null;
  affiliateOfferId?: string | null;
  state?: "HOSTED_INGESTED" | "REUSED";
}): MediaIngestionPlan {
  return mediaIngestionPlanSchema.parse({
    version: 1,
    id: "71000000-0000-4000-8000-000000000010",
    snippetChecksum: "a".repeat(64),
    state: input.commercialRouteValidity === "MATCH" ? "INGESTED" : "REVIEW_REQUIRED",
    dryRun: false,
    actorId: "71000000-0000-4000-8000-000000000011",
    source: "SYSTEM",
    providerReference: "BANNERFLOW:test",
    requestedContext: { creativeLanguageState: "UNKNOWN" },
    resolvedContext: {
      state: "RESOLVED", source: "DETERMINISTIC", casinoId: CASINO_ID, casinoSlug: "inkabet", casinoTitle: "Inkabet",
      bonusId: null, bonusTitle: null, affiliateOfferId: input.affiliateOfferId ?? null, opportunityId: null,
      partnerIdentifier: null, trackingDestinationState: input.commercialRouteValidity === "MATCH" ? "MATCH" : "NOT_PRESENT", notes: [],
    },
    creatives: [{
      id: CREATIVE_ID, sourceKind: "HOSTED_EMBED", sourceMode: "PARTNER_HOSTED_EMBED", provider: "BANNERFLOW",
      source: { urlHash: "b".repeat(64), origin: "https://c.bannerflow.net", pathname: "/a/test", queryKeys: ["did"] },
      anchor: { urlHash: "c".repeat(64), origin: "https://record.betsn.info", pathname: "/creative", queryKeys: [] },
      declaredWidth: input.width, declaredHeight: input.height, dimensionProvenance: "EXPLICIT_PARTNER_METADATA",
      alt: "Inkabet", title: "Offer", providerDomain: "c.bannerflow.net", providerReference: "BANNERFLOW:test",
      identifiers: {}, languageClues: [], marketClues: [], currencyClues: [], warnings: [], brandLabel: "Inkabet",
      purpose: "Casino offer", countryCode: null, languageCode: null, languageState: "UNKNOWN", currencyCode: null,
    }],
    unsupportedElements: [],
    assets: [{
      creativeId: CREATIVE_ID, state: input.state ?? "HOSTED_INGESTED", sourceMode: "PARTNER_HOSTED_EMBED", provider: "BANNERFLOW",
      assetId: null, hostedCreativeId: HOSTED_ID, renderUrl: `/partner-creatives/${HOSTED_ID}/frame`, firstPartyUrl: null,
      checksum: "d".repeat(64), mimeType: null, width: input.width, height: input.height, animated: true,
      formatFamily: commercialCreativePresentationFamily(input.width, input.height) ?? "UNCLASSIFIED",
      dimensionProvenance: ["EXPLICIT_PARTNER_METADATA"], dimensionsMatch: null, mediaValidity: "VALID",
      commercialRouteValidity: input.commercialRouteValidity, commercialRouteReason: input.commercialRouteReason ?? null,
      placementScores: scoreMediaPlacements(input.width, input.height),
      resolvedSource: { urlHash: "b".repeat(64), origin: "https://c.bannerflow.net", pathname: "/a/test", queryKeys: ["did"] },
      redirectCount: null, duplicate: input.state === "REUSED", failureCode: null, failureMessage: null,
    }],
    semanticResults: [], recommendations: [], warnings: [], operations: [],
    createdAt: "2026-09-06T00:00:00.000Z", updatedAt: "2026-09-06T00:00:00.000Z", analyzedAt: null,
  });
}

test("the bulk contract accepts 100 independent items and rejects 101 or unpaired declared dimensions", () => {
  const items = Array.from({ length: 100 }, (_, index) => ({
    snippet: bannerflow(index), declaredWidth: 300, declaredHeight: 250,
  }));
  assert.equal(mediaIngestPartnerBatchInputSchema.parse({ items }).items.length, 100);
  assert.throws(() => mediaIngestPartnerBatchInputSchema.parse({ items: [...items, items[0]] }));
  assert.throws(() => mediaIngestPartnerBatchInputSchema.parse({ items: [{ snippet: bannerflow(0), declaredWidth: 300 }] }), /supplied together/);
});

test("24 Bannerflow scripts parse independently with declared metadata instead of triggering a multi-script rejection", () => {
  const parsed = Array.from({ length: 24 }, (_, index) => parsePartnerHostedCreative(bannerflow(index), {
    declaredWidth: index % 2 ? 300 : 728,
    declaredHeight: index % 2 ? 250 : 90,
    dimensionProvenance: "EXPLICIT_PARTNER_METADATA",
    title: `Inkabet ${index % 2 ? "300 x 250" : "728 x 90"}`,
    description: "Casino campaign",
  }));
  assert.equal(parsed.length, 24);
  assert.equal(new Set(parsed.map((item) => item?.providerIdentityKey)).size, 24);
  assert.ok(parsed.every((item) => item?.provider === "BANNERFLOW" && item.dimensionProvenance === "EXPLICIT_PARTNER_METADATA"));
  assert.throws(
    () => parsePartnerHostedCreative(`${bannerflow(0)}${bannerflow(1)}`, { declaredWidth: 300, declaredHeight: 250 }),
    (error) => error instanceof PartnerHostedCreativeParseError && error.code === "SCRIPT_COUNT_INVALID",
  );
});

test("dimension provenance follows explicit fields, title patterns, then Description patterns", () => {
  const explicit = parsePartnerDescription(null, { declaredWidth: 300, declaredHeight: 250, dimensionProvenance: "NORMALIZED_SOURCE_FIELD", title: "Inkabet" });
  const title = parsePartnerDescription(null, { title: "Inkabet 728 x 90", description: "Campaign" });
  const description = parsePartnerDescription("Inkabet - Casino - 596 x 70");
  assert.deepEqual([explicit.width, explicit.height, explicit.dimensionProvenance], [300, 250, "NORMALIZED_SOURCE_FIELD"]);
  assert.deepEqual([title.width, title.height, title.dimensionProvenance], [728, 90, "TITLE_PATTERN"]);
  assert.deepEqual([description.width, description.height, description.dimensionProvenance], [596, 70, "DESCRIPTION_PATTERN"]);
});

test("explicit hosted targeting fills silent provider metadata and rejects contradictions or ambiguous fan-out", () => {
  const parsed = parsePartnerHostedCreative(bannerflow(0), {
    declaredWidth: 300,
    declaredHeight: 250,
    title: "Inkabet 300 x 250",
  });
  assert.ok(parsed);
  if (!parsed) return;
  const scoped = applyPartnerHostedTargetingContext(parsed, {
    targetCountryCodes: ["PE"],
    creativeLanguage: null,
    creativeLanguageState: "NEUTRAL",
  });
  assert.equal(parsed.description.countryCode, null, "the parsed source evidence stays immutable");
  assert.equal(parsed.description.languageState, "UNKNOWN");
  assert.equal(scoped.creative.description.countryCode, "PE");
  assert.equal(scoped.creative.description.languageState, "NEUTRAL");
  assert.deepEqual(scoped.notes, [
    "HOSTED_COUNTRY_FROM_EXPLICIT_TARGET_CONTEXT:PE",
    "HOSTED_LANGUAGE_FROM_EXPLICIT_TARGET_CONTEXT:NEUTRAL",
  ]);

  const sweden = parsePartnerHostedCreative(bannerflow(1), {
    declaredWidth: 300,
    declaredHeight: 250,
    title: "Betsson - SE - 300 x 250",
  });
  assert.ok(sweden);
  assert.throws(
    () => applyPartnerHostedTargetingContext(sweden!, { targetCountryCodes: ["PE"] }),
    (error) => error instanceof PartnerHostedCreativeParseError && error.code === "HOSTED_TARGET_COUNTRY_CONTRADICTION",
  );
  assert.throws(
    () => applyPartnerHostedTargetingContext(parsed, { targetCountryCodes: ["EE", "LV"] }),
    (error) => error instanceof PartnerHostedCreativeParseError && error.code === "HOSTED_TARGET_COUNTRY_AMBIGUOUS",
  );
});

test("draft media subject policy permits a draft offer below a published Casino without weakening Casino or CasinoBonus controls", () => {
  assert.equal(isDraftMediaAssignmentSubjectState({
    subjectType: "AFFILIATE_OFFER", casinoId: CASINO_ID, casinoStatus: "PUBLISHED", subjectStatus: "DRAFT",
  }), true);
  assert.equal(isDraftMediaAssignmentSubjectState({
    subjectType: "AFFILIATE_OFFER", casinoId: CASINO_ID, casinoStatus: "PUBLISHED", subjectStatus: "ACTIVE",
  }), false);
  assert.equal(isDraftMediaAssignmentSubjectState({
    subjectType: "CASINO", casinoId: CASINO_ID, casinoStatus: "PUBLISHED", subjectStatus: "PUBLISHED",
  }), false);
  assert.equal(isDraftMediaAssignmentSubjectState({
    subjectType: "CASINO_BONUS", casinoId: CASINO_ID, casinoStatus: "PUBLISHED", subjectStatus: "DRAFT",
  }), false);
});

test("mixed real-world dimensions classify and score by physical placement fit", () => {
  const expected = new Map([
    ["265x265", "CARD"], ["300x250", "CARD"], ["596x70", "STRIP"], ["640x100", "STRIP"],
    ["728x90", "WIDE"], ["940x250", "WIDE"], ["980x120", "WIDE"],
  ]);
  for (const [dimensions, family] of expected) {
    const [width, height] = dimensions.split("x").map(Number);
    assert.equal(commercialCreativePresentationFamily(width, height), family, dimensions);
    assert.ok(scoreMediaPlacements(width, height).length > 0, dimensions);
  }
  assert.deepEqual(scoreMediaPlacements(940, 250)[0], {
    placement: "CASINO_OFFER_BLOCK", variant: "DESKTOP", score: 82, fit: "COMPATIBLE",
  });
});

test("an exact governed canonical route remains authoritative when its external HTTP probe returns 400", () => {
  const result = classifyPartnerHostedCommercialRoute({
    affiliateOfferId: OFFER_ID, redirectSlugId: "route", redirectSlug: "inkabet", trackingLinkId: "tracking",
    expectedOperatorHost: "inkabet.pe", relationshipState: "MATCH", reason: null, matchAuthority: "EXACT_GOVERNED_ROUTE",
  }, {
    status: "BROKEN", reason: "HTTP_400", method: "HEAD", statusCode: 400, durationMs: 15, redirectCount: 0, finalHost: "record.betsn.info",
  });
  assert.equal(result.validity, "MATCH");
  assert.equal(result.destinationVerificationState, "VERIFIED");
  assert.equal(result.reason, null);
  assert.equal(result.verifiedFinalHost, null, "a failed advisory probe does not become verified final-host evidence");
});

test("an exact governed Bannerflow match remains accepted when its external HTTP probe returns 403", () => {
  const result = classifyPartnerHostedCommercialRoute({
    affiliateOfferId: OFFER_ID, redirectSlugId: "route", redirectSlug: "inkabet", trackingLinkId: "tracking",
    expectedOperatorHost: "inkabet.pe", relationshipState: "MATCH", reason: null, matchAuthority: "EXACT_GOVERNED_ROUTE",
  }, {
    status: "EXTERNAL_CHALLENGE", reason: "HTTP_403", method: "GET", statusCode: 403, durationMs: 15, redirectCount: 0, finalHost: "record.betsn.info",
  });
  assert.equal(result.validity, "MATCH");
  assert.equal(result.destinationVerificationState, "VERIFIED");
  assert.equal(result.reason, null);
});

test("an exact governed Bannerflow match remains accepted when its external HTTP probe times out", () => {
  const result = classifyPartnerHostedCommercialRoute({
    affiliateOfferId: OFFER_ID, redirectSlugId: "route", redirectSlug: "inkabet", trackingLinkId: "tracking",
    expectedOperatorHost: "inkabet.pe", relationshipState: "MATCH", reason: null, matchAuthority: "EXACT_GOVERNED_ROUTE",
  }, {
    status: "BROKEN", reason: "TIMEOUT", method: "GET", statusCode: null, durationMs: 12_000, redirectCount: 0, finalHost: null,
  });
  assert.equal(result.validity, "MATCH");
  assert.equal(result.destinationVerificationState, "VERIFIED");
  assert.equal(result.reason, null);
});

test("missing canonical routes remain scored but carry the precise apply blocker", () => {
  const plan = hostedPlan({ width: 300, height: 250, commercialRouteValidity: "MISSING", commercialRouteReason: "CANONICAL_COMMERCIAL_ROUTE_REQUIRED" });
  const recommendations = buildMediaPlacementPlan(plan, { bonus: null, existingAssignments: [] });
  assert.equal(plan.assets[0].mediaValidity, "VALID");
  assert.equal(plan.assets[0].commercialRouteValidity, "MISSING");
  assert.ok(plan.assets[0].placementScores?.some((item) => item.placement === "BONUS_LISTING_CARD"));
  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0].applyEligibility, "BLOCKED");
  assert.equal(recommendations[0].applyBlocker, "CANONICAL_COMMERCIAL_ROUTE_REQUIRED");
});

test("wide hosted inventory targets scored offer placements and is not collapsed into the directory", () => {
  const plan = hostedPlan({ width: 940, height: 250, commercialRouteValidity: "MATCH", affiliateOfferId: OFFER_ID });
  const recommendations = buildMediaPlacementPlan(plan, { bonus: null, existingAssignments: [] });
  assert.ok(recommendations.some((item) => item.placement === "CASINO_OFFER_BLOCK" && item.variant === "DESKTOP" && item.score === 82));
  assert.equal(recommendations.some((item) => item.placement === "CASINO_DIRECTORY_CARD"), false);
});

test("per-item outcome classification preserves success, reuse, review, and rejection in one mixed batch", () => {
  const ingested = hostedPlan({ width: 300, height: 250, commercialRouteValidity: "MATCH" });
  const reused = hostedPlan({ width: 300, height: 250, commercialRouteValidity: "MATCH", state: "REUSED" });
  const review = hostedPlan({ width: 300, height: 250, commercialRouteValidity: "MISSING", commercialRouteReason: "CANONICAL_COMMERCIAL_ROUTE_REQUIRED" });
  assert.equal(mediaBatchItemOutcome({ index: 0, plan: ingested, error: null, dryRun: false }).state, "INGESTED");
  assert.equal(mediaBatchItemOutcome({ index: 1, plan: reused, error: null, dryRun: false }).state, "REUSED");
  const reviewOutcome = mediaBatchItemOutcome({ index: 2, plan: review, error: null, dryRun: false });
  assert.equal(reviewOutcome.state, "REVIEW_REQUIRED");
  assert.deepEqual(reviewOutcome.reasonCodes, ["CANONICAL_COMMERCIAL_ROUTE_REQUIRED"]);
  assert.deepEqual(mediaBatchItemOutcome({ index: 3, plan: null, error: { code: "BANNERFLOW_DID_INVALID", message: "bad" }, dryRun: false }), {
    index: 3, state: "REJECTED", planId: null, creativeIds: [], assetIds: [], hostedCreativeIds: [], reasonCodes: ["BANNERFLOW_DID_INVALID"],
  });
});

test("bulk implementation remains inert, bounded, auditable, and migration-only changes commercial validation constraints", () => {
  const parser = readFileSync("lib/media-operations/partner-hosted.ts", "utf8");
  const service = readFileSync("lib/media-operations/service.ts", "utf8");
  const migration = readFileSync("prisma/migrations/0030_media_operations_bulk_contract/migration.sql", "utf8");
  assert.doesNotMatch(parser, /\beval\s*\(|new Function|document\.|dangerouslySetInnerHTML/);
  assert.match(service, /mapWithConcurrency\(input\.items, 4/);
  assert.match(service, /entityType: "media-ingestion-batch"|saveBatch/);
  assert.match(service, /rawSnippetsPersisted: false/);
  assert.doesNotMatch(migration, /^\s*(?:DELETE|TRUNCATE|DROP TABLE|ALTER TABLE[^;]+DROP COLUMN)\b/im);
  assert.match(migration, /DROP CONSTRAINT "PartnerHostedCreative_validated_destination_check"/);
  assert.match(migration, /affiliateOfferId.*redirectSlugId.*trackingLinkId.*destinationVerifiedAt/s);
});

test("the DB-first release gate requires one checksum-matched 0030 after 0029", () => {
  const row0029 = { migration_name: "0029_vetted_partner_hosted_creatives", checksum: "prior", finished_at: new Date(), rolled_back_at: null };
  const row0030 = { migration_name: MEDIA_OPERATIONS_BULK_TARGET_MIGRATION, checksum: mediaOperationsBulkMigrationChecksum(), finished_at: new Date(), rolled_back_at: null };
  assert.deepEqual(planMediaOperationsBulk0030Preflight({
    rows: [row0029],
    repositoryMigrations: ["0029_vetted_partner_hosted_creatives", MEDIA_OPERATIONS_BULK_TARGET_MIGRATION],
  }), { state: "schema_pending", pending: [MEDIA_OPERATIONS_BULK_TARGET_MIGRATION] });
  assert.equal(planMediaOperationsBulk0030Preflight({
    rows: [row0029, row0030],
    repositoryMigrations: ["0029_vetted_partner_hosted_creatives", MEDIA_OPERATIONS_BULK_TARGET_MIGRATION],
  }).state, "schema_ready");
  assert.equal(assertMediaOperationsBulk0030MigrationRow([row0030]).applied, true);
  assert.throws(() => assertMediaOperationsBulk0030MigrationRow([{ ...row0030, checksum: "wrong" }]), /checksum mismatch/);
});
