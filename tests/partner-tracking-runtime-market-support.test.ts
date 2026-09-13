import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL("../prisma/migrations/0036_partner_casino_runtime_market_support/migration.sql", import.meta.url);
const commercialCoreMigrationPath = new URL("../prisma/migrations/0039_commercial_core_partner_relationship/migration.sql", import.meta.url);
const repositoryPath = new URL("../lib/repositories/partner-tracking-registration.repository.ts", import.meta.url);
const servicePath = new URL("../lib/commercial/partner-tracking-registration-service.ts", import.meta.url);
const mcpServicePath = new URL("../lib/commercial/commercial-mcp-service.ts", import.meta.url);
const founderEvidencePath = new URL("../lib/commercial/founder-route-verification-evidence.ts", import.meta.url);
const publicResolverPath = new URL("../lib/commercial/public-commercial-action-resolver.ts", import.meta.url);
const buildPreflightPath = new URL("../scripts/vercel-build-preflight.ts", import.meta.url);

test("runtime Partner market support is additive, exact-market keyed, and independent from activation authority", async () => {
  const [schema, migration, repository, buildPreflight] = await Promise.all([
    readFile(schemaPath, "utf8"),
    readFile(migrationPath, "utf8"),
    readFile(repositoryPath, "utf8"),
    readFile(buildPreflightPath, "utf8"),
  ]);

  assert.match(schema, /model PartnerCasinoMarketSupport \{/);
  assert.match(schema, /@@unique\(\[opportunityId, casinoId, marketCode\]\)/);
  assert.match(schema, /marketProfile\s+CasinoCountry\s+@relation\(fields: \[casinoCountryId, casinoId, countryCode\]/);
  assert.match(migration, /CREATE TABLE "PartnerCasinoMarketSupport"/);
  assert.match(migration, /"marketCode" <> 'ZZ'/);
  assert.match(migration, /left\("marketCode", 2\) = "countryCode"/);
  assert.doesNotMatch(migration, /\b(?:UPDATE|DELETE)\s+"CasinoCountry"/i);
  assert.doesNotMatch(migration, /INSERT INTO "PartnerCasinoMarketSupport"/i);

  assert.match(repository, /partnerCasinoMarketSupport\.findMany/);
  assert.match(repository, /supportOrigin === "RUNTIME"/);
  assert.doesNotMatch(repository, /PARTNER_CASINO_GEO_UNSUPPORTED/);
  assert.match(buildPreflight, /RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION = "0036_partner_casino_runtime_market_support"/);
  assert.match(buildPreflight, /Production DB-first release requires completed.*RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION/s);
});

test("PR2 relationship migration is additive, CRM-independent, and strongly bound", async () => {
  const [schema, migration, buildPreflight] = await Promise.all([
    readFile(schemaPath, "utf8"),
    readFile(commercialCoreMigrationPath, "utf8"),
    readFile(buildPreflightPath, "utf8"),
  ]);

  assert.match(schema, /model PartnerCasinoRelationship \{/);
  assert.match(schema, /@@unique\(\[partnerId, casinoId\]\)/);
  assert.match(schema, /endedAt\s+DateTime\?/);
  assert.match(schema, /relationshipId\s+String\?/);
  assert.match(schema, /opportunityId\s+String\?/);
  assert.match(schema, /@@unique\(\[relationshipId, marketCode\]\)/);
  assert.match(schema, /references: \[id, partnerId, casinoId\]/);
  const relationshipModel = schema.match(/model PartnerCasinoRelationship \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(relationshipModel, /\b(?:status|approved|eligible|ready)\b/i);

  assert.match(migration, /CREATE TABLE "PartnerCasinoRelationship"/);
  assert.match(migration, /ALTER COLUMN "opportunityId" DROP NOT NULL/);
  assert.match(migration, /ON DELETE SET NULL/);
  assert.match(migration, /PartnerCasinoMarketSupport_relationship_fkey/);
  assert.match(migration, /relationshipId" IS NOT NULL OR "opportunityId" IS NOT NULL/);
  assert.doesNotMatch(migration, /^\s*(?:INSERT|UPDATE|DELETE)\b/im);
  assert.doesNotMatch(migration, /CommercialOpportunity"\s+WHERE|FROM\s+"CommercialOpportunity"/i);

  assert.match(buildPreflight, /COMMERCIAL_CORE_PARTNER_RELATIONSHIP_MIGRATION = "0039_commercial_core_partner_relationship"/);
  assert.match(buildPreflight, /Production DB-first release requires completed.*COMMERCIAL_CORE_PARTNER_RELATIONSHIP_MIGRATION/s);
});

test("PR2 canonical registration path contains no CRM permission dependency and MCP only delegates", async () => {
  const [repository, service, mcpService, founderEvidence, publicResolver] = await Promise.all([
    readFile(repositoryPath, "utf8"),
    readFile(servicePath, "utf8"),
    readFile(mcpServicePath, "utf8"),
    readFile(founderEvidencePath, "utf8"),
    readFile(publicResolverPath, "utf8"),
  ]);

  assert.doesNotMatch(repository, /commercialOpportunity\.|commercialTask\.|commercialActivity\./);
  assert.doesNotMatch(repository, /stage\s*!==?\s*["']ACTIVE|CURRENT_PARTNER_RECORD_UNAVAILABLE|PARTNER_CASINO_RELATIONSHIP_MISMATCH/);
  assert.match(repository, /partnerCasinoRelationship\.(?:findUnique|create)/);
  assert.match(repository, /relationshipId_marketCode/);
  assert.match(repository, /opportunityId: null/);
  assert.doesNotMatch(repository, /network\.(?:active|archivedAt)/);
  assert.match(repository, /affiliateNetwork\.update\([\s\S]{0,240}archivedAt: null/);

  assert.doesNotMatch(service, /commercialOpportunity|CommercialMcp|CURRENT_PARTNER_(?:RECORDS|INVENTORY)/);
  assert.match(service, /repository\.resolveTarget/);
  assert.match(service, /marketActivationController/);
  assert.match(service, /founderRouteVerificationEvidence/);
  assert.match(service, /repository\.recordAudit/);

  assert.match(mcpService, /partnerTrackingRegistrationService\.register/);
  assert.doesNotMatch(mcpService, /GOLDENPLAY|goldenPlayFounderOverride|new PartnerTrackingRegistrationService/);
  assert.match(founderEvidence, /FOUNDER_GOLDENPLAY_ROUTE_OVERRIDE_2026_09_11/);
  assert.match(founderEvidence, /This is verification evidence, not Partner, relationship/);

  assert.doesNotMatch(publicResolver, /commercialOpportunity|CommercialMcp|PartnerCasinoMarketSupport|PartnerCasinoRelationship/i);
});
