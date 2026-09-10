import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

const requiredConstraints = [
  "CasinoMediaAssignment_retired_inactive_check",
  "CasinoBonusMediaAssignment_retired_inactive_check",
  "AffiliateOfferMediaAssignment_retired_inactive_check",
  "CasinoPartnerHostedCreativeAssignment_retired_inactive_check",
  "CasinoBonusPartnerHostedCreativeAssignment_retired_inactive_che",
  "AffiliateOfferPartnerHostedCreativeAssignment_retired_inactive_",
  "PartnerHostedCreative_retired_inactive_check",
  "MediaCreativeSet_retired_archived_check",
  "MediaCreativeVariant_retired_inactive_check",
  "MediaRevision_retired_inactive_check",
];

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

test("migration 0034 installs every fail-closed retirement constraint", async () => {
  assertDisposablePostgres();
  const prisma = new PrismaClient();
  try {
    const constraints = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`
      SELECT con.conname AS name
      FROM pg_constraint AS con
      JOIN pg_namespace AS ns ON ns.oid = con.connamespace
      WHERE ns.nspname = 'public'
        AND con.conname LIKE '%retired%'
      ORDER BY con.conname
    `);
    assert.deepEqual(constraints.map((entry) => entry.name).sort(), [...requiredConstraints].sort());
    const [active] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT (
        (SELECT COUNT(*) FROM "CasinoMediaAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "CasinoBonusMediaAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "AffiliateOfferMediaAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "CasinoPartnerHostedCreativeAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "CasinoBonusPartnerHostedCreativeAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "AffiliateOfferPartnerHostedCreativeAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "PartnerHostedCreative" WHERE "active" = true OR "archivedAt" IS NULL)
        + (SELECT COUNT(*) FROM "MediaCreativeSet" WHERE "status" <> 'ARCHIVED' OR "archivedAt" IS NULL)
        + (SELECT COUNT(*) FROM "MediaCreativeVariant" WHERE "status" IN ('PREPARED', 'ACTIVE'))
        + (SELECT COUNT(*) FROM "MediaRevision" WHERE "status" IN ('PREPARED', 'ACTIVE'))
      )::bigint AS count
    `);
    assert.equal(active?.count, 0n);
  } finally {
    await prisma.$disconnect();
  }
});
