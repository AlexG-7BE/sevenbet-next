import assert from "node:assert/strict";
import test from "node:test";

import {
  AffiliateStatus,
  MediaAssetStatus,
  MediaAssetType,
  MediaPlacement,
  MediaPlacementVariant,
  MediaRenderingMode,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import appPrisma from "../lib/db/prisma";
import { assertPlacementMedia0027Schema } from "../lib/db/placement-media-0027-release";
import { mediaAssignmentService } from "../lib/services/media-assignment.service";

const IDS = {
  casino: "27000000-0000-4000-8000-000000000001",
  bonus: "27000000-0000-4000-8000-000000000002",
  network: "27000000-0000-4000-8000-000000000003",
  program: "27000000-0000-4000-8000-000000000004",
  offer: "27000000-0000-4000-8000-000000000005",
  casinoAsset: "27000000-0000-4000-8000-000000000006",
  bonusAsset: "27000000-0000-4000-8000-000000000007",
  offerAsset: "27000000-0000-4000-8000-000000000008",
  unassignedAsset: "27000000-0000-4000-8000-000000000009",
  directoryA: "27000000-0000-4000-8000-000000000010",
  detailB: "27000000-0000-4000-8000-000000000011",
  directoryC: "27000000-0000-4000-8000-000000000012",
  directoryMobile: "27000000-0000-4000-8000-000000000013",
  bonusListing: "27000000-0000-4000-8000-000000000014",
  bestOffer: "27000000-0000-4000-8000-000000000015",
  actor: "27000000-0000-4000-8000-000000000016",
} as const;
const ASSET_IDS = [
  IDS.casinoAsset,
  IDS.bonusAsset,
  IDS.offerAsset,
  IDS.unassignedAsset,
  IDS.directoryA,
  IDS.detailB,
  IDS.directoryC,
  IDS.directoryMobile,
  IDS.bonusListing,
  IDS.bestOffer,
];
const NOW = new Date("2030-06-01T00:00:00.000Z");

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Placement-media PostgreSQL tests require a loopback _ci database");
  }
}

async function cleanup(prisma: PrismaClient) {
  await prisma.affiliateOfferMediaAssignment.deleteMany({ where: { affiliateOfferId: IDS.offer } });
  await prisma.affiliateOffer.deleteMany({ where: { id: IDS.offer } });
  await prisma.affiliateProgram.deleteMany({ where: { id: IDS.program } });
  await prisma.affiliateNetwork.deleteMany({ where: { id: IDS.network } });
  await prisma.casinoBonusMediaAssignment.deleteMany({ where: { casinoBonusId: IDS.bonus } });
  await prisma.casinoBonus.deleteMany({ where: { id: IDS.bonus } });
  await prisma.casinoMediaAssignment.deleteMany({ where: { casinoId: IDS.casino } });
  await prisma.mediaAsset.deleteMany({ where: { id: { in: ASSET_IDS } } });
  await prisma.casino.deleteMany({ where: { id: IDS.casino } });
  await prisma.adminUser.deleteMany({ where: { id: IDS.actor } });
}

test("PostgreSQL enforces Option C typed ownership, checks, safe delete and non-destructive unassign", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();
  try {
    assert.equal(await mediaAssignmentService.schemaReady(), true);
    const verifiedSchema = await assertPlacementMedia0027Schema(prisma);
    assert.deepEqual(verifiedSchema.tables, [
      "CasinoMediaAssignment",
      "CasinoBonusMediaAssignment",
      "AffiliateOfferMediaAssignment",
    ]);
    await cleanup(prisma);
    await prisma.casino.create({
      data: {
        id: IDS.casino,
        slug: "placement-media-postgres-test",
        title: "Placement media test",
        domain: "placement-media-postgres-test.invalid",
        createdBy: "placement-media-test",
        updatedBy: "placement-media-test",
      },
    });
    await prisma.adminUser.create({
      data: {
        id: IDS.actor,
        email: "placement-media-postgres@invalid.example",
        name: "Placement media integration actor",
        role: "SUPER_ADMIN",
      },
    });
    await prisma.casinoBonus.create({
      data: {
        id: IDS.bonus,
        casinoId: IDS.casino,
        slug: "placement-media-postgres-bonus",
        title: "Placement media bonus",
        summary: "Fixture",
        createdBy: "placement-media-test",
        updatedBy: "placement-media-test",
      },
    });
    await prisma.affiliateNetwork.create({
      data: {
        id: IDS.network,
        name: "Placement media network",
        slug: "placement-media-postgres-network",
        createdBy: "placement-media-test",
        updatedBy: "placement-media-test",
      },
    });
    await prisma.affiliateProgram.create({
      data: {
        id: IDS.program,
        networkId: IDS.network,
        casinoId: IDS.casino,
        name: "Placement media program",
        operator: "Fixture operator",
        createdBy: "placement-media-test",
        updatedBy: "placement-media-test",
      },
    });
    await prisma.affiliateOffer.create({
      data: {
        id: IDS.offer,
        programId: IDS.program,
        casinoId: IDS.casino,
        casinoBonusId: IDS.bonus,
        internalName: "Placement media offer",
        publicLabel: "Placement media offer",
        offerType: "WELCOME",
        createdBy: "placement-media-test",
        updatedBy: "placement-media-test",
      },
    });
    for (const [id, type] of [
      [IDS.casinoAsset, MediaAssetType.HERO],
      [IDS.bonusAsset, MediaAssetType.BONUS_CREATIVE],
      [IDS.offerAsset, MediaAssetType.AFFILIATE_CREATIVE],
      [IDS.unassignedAsset, MediaAssetType.HERO],
      [IDS.directoryA, MediaAssetType.HERO],
      [IDS.detailB, MediaAssetType.HERO],
      [IDS.directoryC, MediaAssetType.HERO],
      [IDS.directoryMobile, MediaAssetType.HERO],
      [IDS.bonusListing, MediaAssetType.BONUS_CREATIVE],
      [IDS.bestOffer, MediaAssetType.BONUS_CREATIVE],
    ] as const) {
      await prisma.mediaAsset.create({
        data: {
          id,
          type,
          storageKey: `placement-media-postgres/${id}`,
          publicUrl: `/placement-media/${id}.png`,
          originalFilename: `${id}.png`,
          mimeType: "image/png",
          width: 1200,
          height: 900,
          sizeBytes: 100,
          altText: "Controlled fixture",
          status: MediaAssetStatus.ACTIVE,
          createdBy: "placement-media-test",
          casinoId: IDS.casino,
        },
      });
    }

    const casinoAssignment = await prisma.casinoMediaAssignment.create({
      data: {
        casinoId: IDS.casino,
        mediaAssetId: IDS.casinoAsset,
        placement: MediaPlacement.CASINO_DIRECTORY_CARD,
        variant: MediaPlacementVariant.MOBILE,
        renderingMode: MediaRenderingMode.COVER,
        cropSafe: true,
        focalPointX: new Prisma.Decimal("0.2"),
        focalPointY: new Prisma.Decimal("0.8"),
      },
    });
    const bonusAssignment = await prisma.casinoBonusMediaAssignment.create({
      data: {
        casinoBonusId: IDS.bonus,
        mediaAssetId: IDS.bonusAsset,
        placement: MediaPlacement.OFFER_DETAIL,
      },
    });
    const offerAssignment = await prisma.affiliateOfferMediaAssignment.create({
      data: {
        affiliateOfferId: IDS.offer,
        mediaAssetId: IDS.offerAsset,
        placement: MediaPlacement.OFFER_DETAIL,
      },
    });
    assert.equal(casinoAssignment.variant, MediaPlacementVariant.MOBILE);
    assert.equal(bonusAssignment.placement, MediaPlacement.OFFER_DETAIL);
    assert.equal(offerAssignment.placement, MediaPlacement.OFFER_DETAIL);

    await assert.rejects(() => prisma.casinoBonusMediaAssignment.create({
      data: { casinoBonusId: IDS.bonus, mediaAssetId: IDS.unassignedAsset, placement: MediaPlacement.CASINO_LOGO },
    }), /constraint|check/i);
    await assert.rejects(() => prisma.affiliateOfferMediaAssignment.create({
      data: { affiliateOfferId: IDS.offer, mediaAssetId: IDS.unassignedAsset, placement: MediaPlacement.CASINO_COMPARE },
    }), /constraint|check/i);
    await assert.rejects(() => prisma.casinoMediaAssignment.create({
      data: {
        casinoId: IDS.casino,
        mediaAssetId: IDS.unassignedAsset,
        placement: MediaPlacement.CASINO_DETAIL_HERO,
        focalPointX: new Prisma.Decimal("1.1"),
        focalPointY: new Prisma.Decimal("0.5"),
      },
    }), /constraint|check/i);
    await assert.rejects(() => prisma.casinoMediaAssignment.create({
      data: {
        casinoId: IDS.casino,
        mediaAssetId: IDS.unassignedAsset,
        placement: MediaPlacement.CASINO_DETAIL_HERO,
        validFrom: NOW,
        validUntil: NOW,
      },
    }), /constraint|check/i);
    await assert.rejects(() => prisma.casinoMediaAssignment.create({
      data: {
        casinoId: IDS.casino,
        mediaAssetId: IDS.unassignedAsset,
        placement: MediaPlacement.CASINO_DETAIL_HERO,
        sortOrder: -1,
      },
    }), /constraint|check/i);
    await assert.rejects(() => prisma.casinoMediaAssignment.create({
      data: {
        casinoId: IDS.casino,
        mediaAssetId: IDS.unassignedAsset,
        placement: MediaPlacement.CASINO_DETAIL_HERO,
        renderingMode: MediaRenderingMode.COVER,
        cropSafe: false,
      },
    }), /constraint|check/i);
    await assert.rejects(() => prisma.casinoMediaAssignment.create({
      data: {
        casinoId: "27000000-0000-4000-8000-000000000099",
        mediaAssetId: IDS.unassignedAsset,
        placement: MediaPlacement.CASINO_DETAIL_HERO,
      },
    }), /foreign key|constraint/i);
    await assert.rejects(() => prisma.$executeRawUnsafe(`
      INSERT INTO "CasinoMediaAssignment" (
        "id", "casinoId", "mediaAssetId", "placement", "variant", "renderingMode", "sortOrder", "active", "cropSafe", "createdAt", "updatedAt"
      ) VALUES (
        '27000000-0000-4000-8000-000000000098', '${IDS.casino}', '${IDS.unassignedAsset}', 'CASINO_DETAIL_HERO', 'TABLET', 'AUTO', 0, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `), /MediaPlacementVariant|invalid input value/i);

    await assert.rejects(() => prisma.mediaAsset.delete({ where: { id: IDS.casinoAsset } }), /foreign key|constraint/i);
    await prisma.casinoMediaAssignment.delete({ where: { id: casinoAssignment.id } });
    assert.equal(await prisma.mediaAsset.count({ where: { id: IDS.casinoAsset } }), 1);
    await prisma.mediaAsset.delete({ where: { id: IDS.casinoAsset } });

    const directoryA = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      mediaAssetId: IDS.directoryA,
      placement: "CASINO_DIRECTORY_CARD",
      actorId: IDS.actor,
    });
    await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      mediaAssetId: IDS.detailB,
      placement: "CASINO_DETAIL_HERO",
      actorId: IDS.actor,
    });
    let casinoPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
    });
    assert.equal(casinoPlacements.resolved.CASINO_DIRECTORY_CARD.asset?.id, IDS.directoryA);
    assert.equal(casinoPlacements.resolved.CASINO_DETAIL_HERO.asset?.id, IDS.detailB);

    const directoryC = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      mediaAssetId: IDS.directoryC,
      placement: "CASINO_DIRECTORY_CARD",
      actorId: IDS.actor,
    });
    casinoPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
    });
    assert.equal(casinoPlacements.resolved.CASINO_DIRECTORY_CARD.asset?.id, IDS.directoryC);
    assert.equal(casinoPlacements.resolved.CASINO_DETAIL_HERO.asset?.id, IDS.detailB);
    assert.equal((await prisma.casinoMediaAssignment.findUniqueOrThrow({ where: { id: directoryA.id } })).active, false);

    await mediaAssignmentService.unassignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      assignmentId: directoryC.id,
      actorId: IDS.actor,
    });
    casinoPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
    });
    assert.equal(casinoPlacements.resolved.CASINO_DIRECTORY_CARD.source, "LEGACY_HERO");
    assert.equal(casinoPlacements.resolved.CASINO_DETAIL_HERO.asset?.id, IDS.detailB);
    assert.equal(await prisma.mediaAsset.count({ where: { id: { in: [IDS.detailB, IDS.directoryC] } } }), 2);

    const mobile = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      mediaAssetId: IDS.directoryMobile,
      placement: "CASINO_DIRECTORY_CARD",
      variant: "MOBILE",
      actorId: IDS.actor,
    });
    const [defaultResolution, mobileResolution] = await Promise.all([
      mediaAssignmentService.listEffectivePlacements({ casinoId: IDS.casino, subjectType: "CASINO", subjectId: IDS.casino }),
      mediaAssignmentService.listEffectivePlacements({ casinoId: IDS.casino, subjectType: "CASINO", subjectId: IDS.casino, requestedVariant: "MOBILE" }),
    ]);
    assert.notEqual(defaultResolution.resolved.CASINO_DIRECTORY_CARD.assignment?.id, mobile.id);
    assert.equal(mobileResolution.resolved.CASINO_DIRECTORY_CARD.asset?.id, IDS.directoryMobile);

    const mobileCover = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      mediaAssetId: IDS.directoryMobile,
      placement: "CASINO_DIRECTORY_CARD",
      variant: "MOBILE",
      renderingMode: "COVER",
      cropSafe: true,
      focalPointX: 0.25,
      focalPointY: 0.75,
      actorId: IDS.actor,
    });
    const covered = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO",
      subjectId: IDS.casino,
      requestedVariant: "MOBILE",
    });
    assert.equal(covered.resolved.CASINO_DIRECTORY_CARD.assignment?.id, mobileCover.id);
    assert.equal(covered.resolved.CASINO_DIRECTORY_CARD.renderingMode, "COVER");
    assert.deepEqual(covered.resolved.CASINO_DIRECTORY_CARD.focalPoint, { x: 0.25, y: 0.75 });

    const listing = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
      mediaAssetId: IDS.bonusListing,
      placement: "BONUS_LISTING_CARD",
      actorId: IDS.actor,
    });
    const featured = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
      mediaAssetId: IDS.bestOffer,
      placement: "BEST_OFFER_FEATURED",
      actorId: IDS.actor,
    });
    let bonusPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
    });
    assert.equal(bonusPlacements.resolved.BONUS_LISTING_CARD.asset?.id, IDS.bonusListing);
    assert.equal(bonusPlacements.resolved.BEST_OFFER_FEATURED.asset?.id, IDS.bestOffer);

    await mediaAssignmentService.setAssignmentActive({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
      assignmentId: featured.id,
      active: false,
      actorId: IDS.actor,
    });
    bonusPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
    });
    assert.equal(bonusPlacements.resolved.BEST_OFFER_FEATURED.asset?.id, IDS.bonusListing);
    await mediaAssignmentService.setAssignmentActive({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
      assignmentId: featured.id,
      active: true,
      actorId: IDS.actor,
    });

    await mediaAssignmentService.unassignMedia({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
      assignmentId: listing.id,
      actorId: IDS.actor,
    });
    bonusPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "CASINO_BONUS",
      subjectId: IDS.bonus,
    });
    assert.equal(bonusPlacements.resolved.BEST_OFFER_FEATURED.asset?.id, IDS.bestOffer);
    assert.equal(await prisma.mediaAsset.count({ where: { id: IDS.bonusListing } }), 1);
    await assert.rejects(() => prisma.mediaAsset.delete({ where: { id: IDS.bestOffer } }), /foreign key|constraint/i);

    await prisma.affiliateOffer.update({ where: { id: IDS.offer }, data: { status: AffiliateStatus.ACTIVE } });
    const partnerSpecific = await mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "AFFILIATE_OFFER",
      subjectId: IDS.offer,
      mediaAssetId: IDS.offerAsset,
      placement: "BEST_OFFER_FEATURED",
      actorId: IDS.actor,
    });
    const partnerPlacements = await mediaAssignmentService.listEffectivePlacements({
      casinoId: IDS.casino,
      subjectType: "AFFILIATE_OFFER",
      subjectId: IDS.offer,
    });
    assert.equal(partnerPlacements.resolved.BEST_OFFER_FEATURED.assignment?.id, partnerSpecific.id);
    await prisma.affiliateOffer.update({ where: { id: IDS.offer }, data: { status: AffiliateStatus.ARCHIVED } });
    await assert.rejects(() => mediaAssignmentService.assignMedia({
      casinoId: IDS.casino,
      subjectType: "AFFILIATE_OFFER",
      subjectId: IDS.offer,
      mediaAssetId: IDS.offerAsset,
      placement: "BEST_OFFER_SECONDARY",
      actorId: IDS.actor,
    }), /Restore the Affiliate Offer/);

    await prisma.casinoBonus.delete({ where: { id: IDS.bonus } });
    assert.equal(await prisma.casinoBonusMediaAssignment.count({ where: { id: bonusAssignment.id } }), 0);
    assert.equal(await prisma.mediaAsset.count({ where: { id: IDS.bonusAsset } }), 1);
    assert.equal((await prisma.affiliateOffer.findUniqueOrThrow({ where: { id: IDS.offer } })).casinoBonusId, null);

    await prisma.affiliateOffer.delete({ where: { id: IDS.offer } });
    assert.equal(await prisma.affiliateOfferMediaAssignment.count({ where: { id: offerAssignment.id } }), 0);
    assert.equal(await prisma.mediaAsset.count({ where: { id: IDS.offerAsset } }), 1);
  } finally {
    await cleanup(prisma).catch(() => undefined);
    await prisma.$disconnect();
    await appPrisma.$disconnect();
  }
});
