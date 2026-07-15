import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/0006_casino_foundation/migration.sql",
  "utf8",
);

const aggregateModels = [
  "Casino",
  "CasinoVersion",
  "CasinoRevision",
  "CasinoImage",
  "CasinoCountry",
  "CasinoLicense",
  "CasinoPaymentMethod",
  "CasinoGameProvider",
  "CasinoGameCategory",
  "CasinoBonus",
  "CasinoAffiliateLink",
  "CasinoSeo",
];

test("casino foundation declares the complete aggregate without removing legacy offers", () => {
  for (const model of aggregateModels) {
    assert.match(schema, new RegExp(`model ${model} \\{`));
  }

  assert.match(schema, /model Bonus \{/);
  assert.match(schema, /model AffiliateLink \{/);
  assert.match(schema, /bonuses\s+Bonus\[\]/);
  assert.match(schema, /affiliateLinks\s+AffiliateLink\[\]/);
});

test("migration 0006 is additive and does not rewrite casino data", () => {
  assert.doesNotMatch(
    migration,
    /^(?:DROP|TRUNCATE|DELETE FROM|UPDATE |ALTER TABLE .* DROP)/m,
  );
  assert.match(migration, /ALTER TABLE "Casino"/);
  assert.doesNotMatch(migration, /DROP TABLE "Bonus"/);
  assert.doesNotMatch(migration, /DROP TABLE "AffiliateLink"/);

  for (const model of aggregateModels.slice(1)) {
    assert.match(migration, new RegExp(`CREATE TABLE "${model}"`));
  }
});

test("casino ownership and optional bonus links use the intended delete behavior", () => {
  const casinoOwnedTables = aggregateModels.slice(1);

  for (const table of casinoOwnedTables) {
    assert.match(
      migration,
      new RegExp(
        `"${table}_casinoId_fkey"[\\s\\S]*?REFERENCES "Casino"\\("id"\\) ON DELETE CASCADE ON UPDATE CASCADE`,
      ),
    );
  }

  assert.match(
    migration,
    /"CasinoAffiliateLink_casinoBonusId_fkey"[\s\S]*?REFERENCES "CasinoBonus"\("id"\) ON DELETE SET NULL ON UPDATE CASCADE/,
  );
});

test("version and revision numbers are unique per casino", () => {
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "CasinoVersion_casinoId_version_key" ON "CasinoVersion"\("casinoId", "version"\)/,
  );
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "CasinoRevision_casinoId_revisionNumber_key" ON "CasinoRevision"\("casinoId", "revisionNumber"\)/,
  );
});
