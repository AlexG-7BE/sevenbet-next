import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AffiliateImportAction,
  AffiliateMatchMethod,
  AffiliateMatchStatus,
  AffiliateSourcePolicy,
} from "@prisma/client";

import { EverflowAffiliateProviderAdapter } from "../lib/affiliate-integrations/adapters/everflow";
import { ManualAffiliateProviderAdapter } from "../lib/affiliate-integrations/adapters/manual";
import { MockAffiliateProviderAdapter } from "../lib/affiliate-integrations/adapters/mock";
import { mergeProviderFields } from "../lib/affiliate-integrations/conflicts";
import { parseAffiliateImportPayload } from "../lib/affiliate-integrations/import-parser";
import { matchCasino, normalizeCasinoDomain, normalizeCasinoName } from "../lib/affiliate-integrations/matching";
import { normalizeExternalOffer } from "../lib/affiliate-integrations/normalize";
import { findDuplicateExternalIds, summarizeAffiliateImportItems } from "../lib/affiliate-integrations/planning";
import { AffiliateAdapterRegistry } from "../lib/affiliate-integrations/registry";
import { redactAffiliateError, sanitizeAffiliatePayload } from "../lib/affiliate-integrations/sanitize";
import type { AffiliatePlannedItem, ExternalAffiliateOffer } from "../lib/affiliate-integrations/types";
import { resolveAffiliateCandidates, type CandidateOffer } from "../lib/affiliate-routing/candidate-resolver";
import { providerOfferProjection } from "../lib/affiliate-integrations/provider-projection";

function externalOffer(id: string, patch: Partial<ExternalAffiliateOffer> = {}): ExternalAffiliateOffer {
  return {
    externalId: id,
    externalName: `Offer ${id}`,
    casino: { name: "Example Casino", domain: "https://www.example.com/path" },
    status: "ACTIVE",
    commercialModel: "CPA",
    payoutAmount: 100,
    payoutCurrency: "EUR",
    countries: ["GB"],
    currencies: ["EUR"],
    trackingLinks: [{
      externalId: `${id}-link`,
      destinationUrl: "https://example.com/welcome",
      trackingUrl: `https://tracking.example/${id}`,
      active: true,
    }],
    ...patch,
  };
}

test("ManualAdapter parses JSON and paginates without mutating the source", async () => {
  const records = Array.from({ length: 251 }, (_, index) => externalOffer(`offer-${index}`));
  const payload = JSON.stringify(records);
  const adapter = new ManualAffiliateProviderAdapter();
  const context = { programId: "program", providerType: "MANUAL", credentials: null, payload };
  const first = await adapter.fetchOffers(context);
  const second = await adapter.fetchOffers(context, first.nextCursor ?? undefined);
  assert.equal(first.records.length, 250);
  assert.equal(second.records.length, 1);
  assert.equal(JSON.stringify(records), payload);
  assert.deepEqual(adapter.normalizeOffer(first.records[0]), adapter.normalizeOffer(first.records[0]));
});

test("MockAdapter exposes capabilities, pagination, disabled offers, and partial failure", async () => {
  const adapter = new MockAffiliateProviderAdapter({
    pages: [[externalOffer("one")], [externalOffer("two", { status: "DISABLED" })], [externalOffer("three")]],
    failPage: 2,
  });
  const context = { programId: "program", providerType: "MOCK", credentials: null };
  const first = await adapter.fetchOffers(context);
  const second = await adapter.fetchOffers(context, first.nextCursor ?? undefined);
  assert.equal(second.records[0].status, "DISABLED");
  await assert.rejects(() => adapter.fetchOffers(context, second.nextCursor ?? undefined), /page 2 failed/);
  assert.equal(adapter.capabilities.has("incrementalSync"), true);
});

test("adapter registry is allowlisted and capability-aware", () => {
  const manual = new ManualAffiliateProviderAdapter();
  const registry = new AffiliateAdapterRegistry([manual]);
  assert.equal(registry.get("manual"), manual);
  assert.equal(registry.supports("MANUAL", "offers"), true);
  assert.throws(() => registry.get("ARBITRARY"), /not supported/);
  assert.throws(() => registry.register(manual), /already registered/);
});

test("Everflow foundation does not guess a production API", async () => {
  const adapter = new EverflowAffiliateProviderAdapter();
  const disconnected = await adapter.testConnection({ programId: "program", providerType: "EVERFLOW", credentials: null });
  assert.equal(disconnected.ok, false);
  await assert.rejects(
    () => adapter.fetchOffers({ programId: "program", providerType: "EVERFLOW", credentials: { apiKey: "configured" } }),
    /official-schema client/,
  );
});

test("duplicate external IDs are scoped and detected before apply", () => {
  assert.deepEqual([...findDuplicateExternalIds([{ externalId: "same" }, { externalId: "same" }, { externalId: "other" }])], ["same"]);
  assert.equal(findDuplicateExternalIds([{ externalId: "same" }]).size, 0);
});

test("casino matching follows mapping, domain, brand, alias, then review", () => {
  const casinos = [{
    id: "casino",
    title: "Example Casino",
    internalName: "Example",
    domain: "example.com",
    aliases: [
      { type: "BRAND" as const, normalizedValue: normalizeCasinoName("Example Gaming") },
      { type: "DOMAIN" as const, normalizedValue: "example.co.uk" },
    ],
  }];
  assert.equal(matchCasino({ external: { name: "Unknown" }, existingMapping: { internalEntityId: "casino", matchStatus: AffiliateMatchStatus.MATCHED }, casinos }).method, AffiliateMatchMethod.EXTERNAL_MAPPING);
  assert.equal(matchCasino({ external: { name: "Unknown", domain: "https://www.example.com/welcome" }, casinos }).method, AffiliateMatchMethod.DOMAIN);
  assert.equal(matchCasino({ external: { name: "Example Casino" }, casinos }).method, AffiliateMatchMethod.BRAND);
  assert.equal(matchCasino({ external: { name: "Example Gaming" }, casinos }).method, AffiliateMatchMethod.ALIAS);
  assert.equal(matchCasino({ external: { name: "Unrelated" }, casinos }).status, AffiliateMatchStatus.REVIEW_REQUIRED);
  assert.equal(normalizeCasinoDomain("https://WWW.Example.com/path"), "example.com");
});

test("source-of-truth policies preserve manual fields and update provider fields", () => {
  const merged = mergeProviderFields({
    current: { notes: "Manual note", status: "ACTIVE", payoutAmount: "120", landingPageUrl: "https://old.example" },
    previousProvider: { notes: null, status: "ACTIVE", payoutAmount: "100", landingPageUrl: "https://old.example" },
    nextProvider: { notes: "Provider note", status: "PAUSED", payoutAmount: "110", landingPageUrl: "https://new.example" },
    rules: {
      notes: AffiliateSourcePolicy.MANUAL_WINS,
      status: AffiliateSourcePolicy.PROVIDER_WINS,
      payoutAmount: AffiliateSourcePolicy.REVIEW_ON_CONFLICT,
      landingPageUrl: AffiliateSourcePolicy.PROVIDER_WINS,
    },
  });
  assert.equal(merged.value.notes, "Manual note");
  assert.equal(merged.value.status, "PAUSED");
  assert.equal(merged.value.landingPageUrl, "https://new.example");
  assert.deepEqual(merged.conflicts, ["payoutAmount"]);
});

test("normalization rejects malformed tracking and landing URLs", () => {
  assert.throws(() => normalizeExternalOffer(externalOffer("bad", { landingPageUrl: "http://unsafe.example" })), /HTTPS/);
  assert.throws(() => normalizeExternalOffer(externalOffer("bad-link", {
    trackingLinks: [{ externalId: "bad", destinationUrl: "https://example.com", trackingUrl: "javascript:alert(1)" }],
  })), /HTTPS/);
});

test("provider projection cannot auto-activate GB offers or tracking links", () => {
  const normalized = normalizeExternalOffer(externalOffer("gb-safe"));
  const gbProjection = providerOfferProjection(normalized, true, true);
  assert.equal(gbProjection.status, "DRAFT");
  assert.equal(gbProjection.trackingLinks[0].active, false);
  const nonGbProjection = providerOfferProjection(normalized, true, false);
  assert.equal(nonGbProjection.status, "ACTIVE");
  assert.equal(nonGbProjection.trackingLinks[0].active, true);
  const repository = readFileSync("lib/repositories/affiliate-integration.repository.ts", "utf8");
  assert.match(repository, /allowAutoActivation = input\.trustedAutoActivation && !input\.supportsGb/);
  assert.match(repository, /input\.supportsGb && input\.offer\.status !== AffiliateStatus\.ARCHIVED/);
});

test("CSV and JSON parser rejects malformed and oversized input", () => {
  const csv = "externalId,externalName,casinoName,casinoDomain\noffer-1,Welcome,Example,example.com";
  assert.equal(parseAffiliateImportPayload(csv)[0].casino.name, "Example");
  assert.throws(() => parseAffiliateImportPayload('{"records":'), /malformed/);
  assert.throws(() => parseAffiliateImportPayload("externalId,__proto__,casinoName\n1,x,Example"), /unsafe/);
  assert.throws(() => parseAffiliateImportPayload("x".repeat(513 * 1024)), /512 KB/);
});

test("external payloads redact secrets and prototype keys", () => {
  const payload = JSON.parse('{"name":"offer","apiKey":"secret-value","nested":{"password":"hidden"},"__proto__":{"polluted":true}}');
  const sanitized = sanitizeAffiliatePayload(payload);
  assert.equal(sanitized.apiKey, "[redacted]");
  assert.deepEqual((sanitized.nested as Record<string, unknown>).password, "[redacted]");
  assert.equal(Object.hasOwn(sanitized, "__proto__"), false);
  assert.doesNotMatch(redactAffiliateError(new Error("token=abc123 Authorization: Bearer xyz")), /abc123|xyz/);
});

test("import summary covers create, update, conflict, error, and unmatched", () => {
  const base: Omit<AffiliatePlannedItem, "action" | "matchStatus"> = {
    entityType: "OFFER",
    externalId: "one",
    externalName: "One",
    externalDomain: null,
    matchMethod: null,
    matchConfidence: null,
    internalEntityId: null,
    before: null,
    after: null,
    sourcePayload: {},
    errors: [],
    conflictFields: [],
  };
  const items: AffiliatePlannedItem[] = [
    { ...base, externalId: "create", action: AffiliateImportAction.CREATE, matchStatus: AffiliateMatchStatus.MATCHED },
    { ...base, externalId: "update", action: AffiliateImportAction.UPDATE, matchStatus: AffiliateMatchStatus.MATCHED },
    { ...base, externalId: "conflict", action: AffiliateImportAction.CONFLICT, matchStatus: AffiliateMatchStatus.CONFLICT },
    { ...base, externalId: "error", action: AffiliateImportAction.ERROR, matchStatus: AffiliateMatchStatus.REVIEW_REQUIRED },
  ];
  assert.deepEqual(summarizeAffiliateImportItems(items), {
    total: 4, create: 1, update: 1, noChange: 0, skipped: 0, conflicts: 1, errors: 1, unmatched: 1,
  });
});

test("dry-run, idempotency, missing-record safety, and partial failure are explicit in sync code", () => {
  const service = readFileSync("lib/services/affiliate-sync.service.ts", "utf8");
  const repository = readFileSync("lib/repositories/affiliate-integration.repository.ts", "utf8");
  assert.match(service, /createPreviewJob/);
  assert.doesNotMatch(service.slice(service.indexOf("async preview"), service.indexOf("async apply")), /applyOfferItem/);
  assert.match(repository, /item\.action === AffiliateImportAction\.NO_CHANGE/);
  assert.match(service, /program\.deactivateMissing/);
  assert.match(service, /markItemFailed/);
  assert.match(repository, /prisma\.\$transaction/);
});

test("admin integration APIs require affiliate.manage", () => {
  for (const file of [
    "app/api/admin/affiliate/imports/preview/route.ts",
    "app/api/admin/affiliate/imports/[jobId]/apply/route.ts",
    "app/api/admin/affiliate/jobs/route.ts",
    "app/api/admin/affiliate/jobs/[jobId]/route.ts",
    "app/api/admin/affiliate/mappings/route.ts",
    "app/api/admin/affiliate/mappings/[mappingId]/match/route.ts",
    "app/api/admin/affiliate/programs/[programId]/connection-test/route.ts",
  ]) {
    assert.match(readFileSync(file, "utf8"), /requireAdminPermission\(request, "affiliate\.manage"\)/);
  }
});

test("redirect excludes links before validFrom and inactive programs", () => {
  const now = new Date("2030-01-01T00:00:00.000Z");
  const offer: CandidateOffer = {
    id: "offer",
    casinoId: "casino",
    casinoBonusId: null,
    priority: 1,
    geoMode: "GLOBAL",
    countries: [],
    currencies: [],
    program: { name: "Program", status: "ACTIVE", network: { name: "Network", active: true } },
    trackingLinks: [{
      id: "link",
      label: "Link",
      destinationUrl: "https://example.com",
      trackingUrl: "https://tracking.example",
      geoMode: "GLOBAL",
      countries: [],
      currencyCode: null,
      active: true,
      priority: 1,
      verifiedAt: now,
      validFrom: "2030-02-01T00:00:00.000Z",
      expiresAt: null,
      archivedAt: null,
      updatedAt: now,
    }],
  };
  assert.equal(resolveAffiliateCandidates([offer], { casinoId: "casino", now }).winner, null);
  offer.trackingLinks[0].validFrom = null;
  offer.program.status = "PAUSED";
  assert.equal(resolveAffiliateCandidates([offer], { casinoId: "casino", now }).winner, null);
});

test("migration 0010 is additive and keeps redirects provider-independent", () => {
  const migration = readFileSync("prisma/migrations/0010_affiliate_integration_foundation/migration.sql", "utf8");
  assert.match(migration, /CREATE TABLE "AffiliateExternalMapping"/);
  assert.match(migration, /CREATE TABLE "AffiliateImportJob"/);
  assert.match(migration, /CREATE TABLE "AffiliateImportItem"/);
  assert.match(migration, /ON DELETE CASCADE ON UPDATE CASCADE/);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE FROM)\b/);
  const redirectRoute = readFileSync("app/r/[slug]/route.ts", "utf8");
  assert.doesNotMatch(redirectRoute, /EVERFLOW|fetch\(|AffiliateProviderAdapter|credentials/i);
});
