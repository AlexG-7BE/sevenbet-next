import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL("../prisma/migrations/0036_partner_casino_runtime_market_support/migration.sql", import.meta.url);
const repositoryPath = new URL("../lib/repositories/partner-tracking-registration.repository.ts", import.meta.url);
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
