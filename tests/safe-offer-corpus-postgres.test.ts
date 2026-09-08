import assert from "node:assert/strict";
import test from "node:test";

import { EditorialStatus, PrismaClient } from "@prisma/client";

import {
  reconcileSafeOfferCorpusInTransaction,
  safeOfferCorpusDefinitions,
  verifySafeOfferCorpusInTransaction,
} from "../lib/casino-offer-corpus/safe-offer-corpus";
import { readCasinoEditorMetadata } from "../lib/casino-builder/editor-metadata";

const ACTOR_ID = "c2220000-0000-4000-8000-000000000001";
const STAR_ID = "c2220000-0000-4000-8000-000000000010";
const STAR_IT_ID = "c2220000-0000-4000-8000-000000000011";
const RIZK_ID = "c2220000-0000-4000-8000-000000000020";
const NORDICBET_ID = "c2220000-0000-4000-8000-000000000030";
const CREATED_BY = "safe-offer-corpus-postgres-test";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Safe offer corpus PostgreSQL test requires a loopback _ci database");
  }
}

async function protectedCounts(prisma: PrismaClient) {
  const [offers, tracking, redirects, activations, sets, revisions] = await Promise.all([
    prisma.affiliateOffer.count(),
    prisma.affiliateTrackingLink.count(),
    prisma.affiliateRedirectSlug.count(),
    prisma.marketActivation.count(),
    prisma.mediaCreativeSet.count(),
    prisma.mediaRevision.count(),
  ]);
  return { offers, tracking, redirects, activations, sets, revisions };
}

test("bounded offer corpus reconciliation is transactional, idempotent and authority-neutral", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();
  const governedSlugs = safeOfferCorpusDefinitions.map((definition) => definition.casinoSlug);

  try {
    await prisma.casino.deleteMany({ where: { slug: { in: governedSlugs } } });
    await prisma.adminUser.deleteMany({ where: { id: ACTOR_ID } });
    await prisma.adminUser.create({
      data: { id: ACTOR_ID, email: "safe-offer-corpus-postgres@example.invalid", name: "Safe offer test", role: "ADMIN" },
    });
    await prisma.casino.createMany({
      data: [
        { id: STAR_ID, slug: "starcasino", title: "StarCasino", domain: "starcasino.test.invalid", editorScore: 8.7, status: EditorialStatus.PUBLISHED, createdBy: CREATED_BY, updatedBy: CREATED_BY },
        { id: RIZK_ID, slug: "rizk", title: "Rizk", domain: "rizk.test.invalid", editorScore: 8.4, status: EditorialStatus.PUBLISHED, createdBy: CREATED_BY, updatedBy: CREATED_BY },
        { id: NORDICBET_ID, slug: "nordicbet", title: "NordicBet", domain: "nordicbet.test.invalid", editorScore: 8.5, status: EditorialStatus.PUBLISHED, createdBy: CREATED_BY, updatedBy: CREATED_BY },
      ],
    });
    await prisma.casinoCountry.create({
      data: { id: STAR_IT_ID, casinoId: STAR_ID, countryCode: "IT", availability: "AVAILABLE" },
    });

    const before = await protectedCounts(prisma);
    const first = await prisma.$transaction((tx) => reconcileSafeOfferCorpusInTransaction(tx, ACTOR_ID));
    assert.deepEqual(first, {
      created: ["starcasino-it-welcome", "rizk-row-welcome", "nordicbet-row-welcome"],
      updated: [],
      unchanged: [],
      metadataUpdated: ["starcasino-it-welcome", "rizk-row-welcome", "nordicbet-row-welcome"],
    });

    const second = await prisma.$transaction((tx) => reconcileSafeOfferCorpusInTransaction(tx, ACTOR_ID));
    assert.deepEqual(second, {
      created: [],
      updated: [],
      unchanged: ["starcasino-it-welcome", "rizk-row-welcome", "nordicbet-row-welcome"],
      metadataUpdated: [],
    });
    assert.deepEqual(await protectedCounts(prisma), before);

    const bonuses = await prisma.casinoBonus.findMany({
      where: { casino: { slug: { in: governedSlugs } } },
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        casinoCountryId: true,
        title: true,
        percentage: true,
        maximumBonus: true,
        currency: true,
        freeSpins: true,
        wageringMultiplier: true,
        termsUrl: true,
        offerStatus: true,
        casino: { select: { slug: true, reviewBlocks: true } },
      },
    });
    assert.equal(bonuses.length, 3);
    assert.equal(bonuses.find((bonus) => bonus.slug === "starcasino-it-welcome")?.casinoCountryId, STAR_IT_ID);
    assert.equal(bonuses.find((bonus) => bonus.slug === "rizk-row-welcome")?.casinoCountryId, null);
    assert.equal(bonuses.find((bonus) => bonus.slug === "nordicbet-row-welcome")?.casinoCountryId, null);
    assert.equal(bonuses.every((bonus) => bonus.offerStatus === "ACTIVE"), true);
    assert.equal(bonuses.every((bonus) => bonus.percentage === null && bonus.maximumBonus === null
      && bonus.currency === null && bonus.freeSpins === null && bonus.wageringMultiplier === null && bonus.termsUrl === null), true);
    for (const bonus of bonuses) {
      const metadata = readCasinoEditorMetadata(bonus.casino.reviewBlocks).bonuses[bonus.id];
      assert.ok(metadata);
      assert.equal(metadata.geoMode, bonus.casino.slug === "starcasino" ? "ALLOW" : "GLOBAL");
      assert.deepEqual(metadata.allowedCountries, bonus.casino.slug === "starcasino" ? ["IT"] : []);
    }
    assert.equal(await prisma.auditLog.count({ where: { actorId: ACTOR_ID, action: "safe-offer-corpus-reconcile" } }), 3);

    await prisma.casinoBonus.updateMany({
      where: { casino: { slug: { in: governedSlugs } } },
      data: { status: EditorialStatus.PUBLISHED },
    });
    for (const casinoSlug of governedSlugs) {
      const casino = await prisma.casino.findUniqueOrThrow({
        where: { slug: casinoSlug },
        select: {
          id: true,
          reviewBlocks: true,
          casinoBonuses: { select: { id: true, slug: true, status: true, offerStatus: true } },
        },
      });
      await prisma.casinoVersion.create({
        data: {
          casinoId: casino.id,
          version: 1,
          status: EditorialStatus.PUBLISHED,
          publishedAt: new Date("2030-01-01T00:00:00.000Z"),
          createdBy: CREATED_BY,
          snapshot: {
            id: casino.id,
            slug: casinoSlug,
            status: EditorialStatus.PUBLISHED,
            reviewBlocks: casino.reviewBlocks,
            casinoBonuses: casino.casinoBonuses,
          },
        },
      });
    }
    const verified = await prisma.$transaction((tx) => verifySafeOfferCorpusInTransaction(tx));
    assert.deepEqual(verified.map(({ slug, scope, actionBindings, mediaBindings }) => ({ slug, scope, actionBindings, mediaBindings })), [
      { slug: "starcasino-it-welcome", scope: "COUNTRY", actionBindings: 0, mediaBindings: 0 },
      { slug: "rizk-row-welcome", scope: "ROW", actionBindings: 0, mediaBindings: 0 },
      { slug: "nordicbet-row-welcome", scope: "ROW", actionBindings: 0, mediaBindings: 0 },
    ]);
  } finally {
    await prisma.casino.deleteMany({ where: { slug: { in: governedSlugs } } });
    await prisma.adminUser.deleteMany({ where: { id: ACTOR_ID } });
    await prisma.$disconnect();
  }
});
