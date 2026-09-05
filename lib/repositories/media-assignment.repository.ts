import {
  Prisma,
  type MediaPlacement,
  type MediaPlacementVariant,
  type MediaRenderingMode,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { MediaAssignmentSubjectType } from "@/lib/media/placement-media";

const assignmentInclude = { mediaAsset: true } satisfies Prisma.CasinoMediaAssignmentInclude;

export interface MediaAssignmentMutationRecord {
  mediaAssetId: string;
  placement: MediaPlacement;
  variant: MediaPlacementVariant;
  countryCode: string | null;
  languageCode: string | null;
  renderingMode: MediaRenderingMode;
  sortOrder: number;
  active: boolean;
  cropSafe: boolean;
  altTextOverride: string | null;
  focalPointX: Prisma.Decimal | null;
  focalPointY: Prisma.Decimal | null;
  validFrom: Date | null;
  validUntil: Date | null;
  reference: string | null;
}

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entityId: string,
  summary: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: { actorId, action, entityType: "media-assignment", entityId, summary, metadata },
  });
}

export class MediaAssignmentRepository {
  async resolveSubject(subjectType: MediaAssignmentSubjectType, subjectId: string) {
    if (subjectType === "CASINO") {
      const record = await prisma.casino.findUnique({
        where: { id: subjectId },
        select: { id: true, title: true, status: true },
      });
      return record ? { id: record.id, casinoId: record.id, casinoName: record.title, casinoStatus: record.status } : null;
    }
    if (subjectType === "CASINO_BONUS") {
      const record = await prisma.casinoBonus.findUnique({
        where: { id: subjectId },
        select: { id: true, casinoId: true, casino: { select: { title: true, status: true } } },
      });
      return record ? {
        id: record.id,
        casinoId: record.casinoId,
        casinoName: record.casino.title,
        casinoStatus: record.casino.status,
      } : null;
    }
    const record = await prisma.affiliateOffer.findUnique({
      where: { id: subjectId },
      select: { id: true, casinoId: true, casinoBonusId: true, status: true, casino: { select: { title: true, status: true } } },
    });
    return record ? {
      id: record.id,
      casinoId: record.casinoId,
      casinoBonusId: record.casinoBonusId,
      casinoName: record.casino.title,
      casinoStatus: record.casino.status,
      affiliateOfferStatus: record.status,
    } : null;
  }

  async schemaReady() {
    const [record] = await prisma.$queryRaw<Array<{ column_count: number }>>`
      SELECT COUNT(*)::int AS column_count
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
        AND column_name IN ('countryCode', 'languageCode')
    `;
    return record?.column_count === 6;
  }

  async findAsset(id: string) {
    return prisma.mediaAsset.findUnique({ where: { id } });
  }

  async loadResolutionContext(input: {
    casinoId: string;
    subjectType: MediaAssignmentSubjectType;
    subjectId: string;
  }) {
    const [casino, bonusAssignments, offer] = await Promise.all([
      prisma.casino.findUnique({
        where: { id: input.casinoId },
        select: {
          id: true,
          title: true,
          mediaAssets: {
            where: { casinoCountryId: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
            include: {
              casinoMediaAssignments: { select: { countryCode: true, languageCode: true } },
              casinoBonusMediaAssignments: { select: { countryCode: true, languageCode: true } },
              affiliateOfferMediaAssignments: { select: { countryCode: true, languageCode: true } },
            },
          },
          mediaAssignments: { include: assignmentInclude },
        },
      }),
      input.subjectType === "CASINO_BONUS"
        ? prisma.casinoBonus.findUnique({
            where: { id: input.subjectId },
            select: { mediaAssignments: { include: assignmentInclude } },
          })
        : null,
      input.subjectType === "AFFILIATE_OFFER"
        ? prisma.affiliateOffer.findUnique({
            where: { id: input.subjectId },
            select: {
              casinoBonus: { select: { mediaAssignments: { include: assignmentInclude } } },
              mediaAssignments: { include: assignmentInclude },
            },
          })
        : null,
    ]);
    if (!casino) return null;
    const targetScopedAssetIds = casino.mediaAssets.flatMap((asset) => {
      const assignments = [
        ...asset.casinoMediaAssignments,
        ...asset.casinoBonusMediaAssignments,
        ...asset.affiliateOfferMediaAssignments,
      ];
      return assignments.some((assignment) =>
        assignment.countryCode !== null || assignment.languageCode !== null,
      ) ? [asset.id] : [];
    });
    const assets = casino.mediaAssets.map(({
      affiliateOfferMediaAssignments: _affiliateAssignments,
      casinoBonusMediaAssignments: _bonusAssignments,
      casinoMediaAssignments: _casinoAssignments,
      ...asset
    }) => asset);
    return {
      casinoName: casino.title,
      casinoAssignments: casino.mediaAssignments,
      casinoBonusAssignments: bonusAssignments?.mediaAssignments ?? offer?.casinoBonus?.mediaAssignments ?? [],
      affiliateOfferAssignments: offer?.mediaAssignments ?? [],
      legacyMediaAssets: assets,
      targetScopedAssetIds,
      assets,
    };
  }

  async assign(
    subjectType: MediaAssignmentSubjectType,
    subjectId: string,
    input: MediaAssignmentMutationRecord,
    actorId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const where = {
        placement: input.placement,
        variant: input.variant,
        countryCode: input.countryCode,
        languageCode: input.languageCode,
        active: true,
      };
      if (subjectType === "CASINO") {
        const replaced = input.active
          ? await tx.casinoMediaAssignment.updateMany({ where: { casinoId: subjectId, ...where }, data: { active: false } })
          : { count: 0 };
        const record = await tx.casinoMediaAssignment.create({
          data: { casinoId: subjectId, ...input },
          include: assignmentInclude,
        });
        await audit(tx, actorId, "assign", record.id, `Assigned ${input.placement} media`, {
          subjectType, subjectId, mediaAssetId: input.mediaAssetId, placement: input.placement,
          variant: input.variant, countryCode: input.countryCode, languageCode: input.languageCode,
          replacedAssignments: replaced.count,
        });
        return record;
      }
      if (subjectType === "CASINO_BONUS") {
        const replaced = input.active
          ? await tx.casinoBonusMediaAssignment.updateMany({ where: { casinoBonusId: subjectId, ...where }, data: { active: false } })
          : { count: 0 };
        const record = await tx.casinoBonusMediaAssignment.create({
          data: { casinoBonusId: subjectId, ...input },
          include: assignmentInclude,
        });
        await audit(tx, actorId, "assign", record.id, `Assigned ${input.placement} media`, {
          subjectType, subjectId, mediaAssetId: input.mediaAssetId, placement: input.placement,
          variant: input.variant, countryCode: input.countryCode, languageCode: input.languageCode,
          replacedAssignments: replaced.count,
        });
        return record;
      }
      const replaced = input.active
        ? await tx.affiliateOfferMediaAssignment.updateMany({ where: { affiliateOfferId: subjectId, ...where }, data: { active: false } })
        : { count: 0 };
      const record = await tx.affiliateOfferMediaAssignment.create({
        data: { affiliateOfferId: subjectId, ...input },
        include: assignmentInclude,
      });
      await audit(tx, actorId, "assign", record.id, `Assigned ${input.placement} partner media`, {
        subjectType, subjectId, mediaAssetId: input.mediaAssetId, placement: input.placement,
        variant: input.variant, countryCode: input.countryCode, languageCode: input.languageCode,
        replacedAssignments: replaced.count,
      });
      return record;
    });
  }

  async unassign(
    subjectType: MediaAssignmentSubjectType,
    subjectId: string,
    assignmentId: string,
    actorId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const where = { id: assignmentId };
      const result = subjectType === "CASINO"
        ? await tx.casinoMediaAssignment.deleteMany({ where: { casinoId: subjectId, ...where } })
        : subjectType === "CASINO_BONUS"
          ? await tx.casinoBonusMediaAssignment.deleteMany({ where: { casinoBonusId: subjectId, ...where } })
          : await tx.affiliateOfferMediaAssignment.deleteMany({ where: { affiliateOfferId: subjectId, ...where } });
      if (result.count) {
        await audit(tx, actorId, "unassign", assignmentId, "Removed one media placement relationship", {
          subjectType, subjectId, assignmentId, assignmentsRemoved: result.count,
        });
      }
      return result.count;
    });
  }

  async setActive(
    subjectType: MediaAssignmentSubjectType,
    subjectId: string,
    assignmentId: string,
    active: boolean,
    actorId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      if (subjectType === "CASINO") {
        const current = await tx.casinoMediaAssignment.findFirst({ where: { id: assignmentId, casinoId: subjectId } });
        if (!current) return null;
        if (active) await tx.casinoMediaAssignment.updateMany({
          where: {
            casinoId: subjectId,
            placement: current.placement,
            variant: current.variant,
            countryCode: current.countryCode,
            languageCode: current.languageCode,
            active: true,
            id: { not: assignmentId },
          },
          data: { active: false },
        });
        const record = await tx.casinoMediaAssignment.update({
          where: { id: assignmentId },
          data: { active },
          include: assignmentInclude,
        });
        await audit(tx, actorId, active ? "activate" : "deactivate", assignmentId, `${active ? "Activated" : "Deactivated"} media assignment`, {
          subjectType, subjectId, assignmentId, placement: current.placement, variant: current.variant,
          countryCode: current.countryCode, languageCode: current.languageCode,
        });
        return record;
      }
      if (subjectType === "CASINO_BONUS") {
        const current = await tx.casinoBonusMediaAssignment.findFirst({ where: { id: assignmentId, casinoBonusId: subjectId } });
        if (!current) return null;
        if (active) await tx.casinoBonusMediaAssignment.updateMany({
          where: {
            casinoBonusId: subjectId,
            placement: current.placement,
            variant: current.variant,
            countryCode: current.countryCode,
            languageCode: current.languageCode,
            active: true,
            id: { not: assignmentId },
          },
          data: { active: false },
        });
        const record = await tx.casinoBonusMediaAssignment.update({
          where: { id: assignmentId },
          data: { active },
          include: assignmentInclude,
        });
        await audit(tx, actorId, active ? "activate" : "deactivate", assignmentId, `${active ? "Activated" : "Deactivated"} media assignment`, {
          subjectType, subjectId, assignmentId, placement: current.placement, variant: current.variant,
          countryCode: current.countryCode, languageCode: current.languageCode,
        });
        return record;
      }
      const current = await tx.affiliateOfferMediaAssignment.findFirst({ where: { id: assignmentId, affiliateOfferId: subjectId } });
      if (!current) return null;
      if (active) await tx.affiliateOfferMediaAssignment.updateMany({
        where: {
          affiliateOfferId: subjectId,
          placement: current.placement,
          variant: current.variant,
          countryCode: current.countryCode,
          languageCode: current.languageCode,
          active: true,
          id: { not: assignmentId },
        },
        data: { active: false },
      });
      const record = await tx.affiliateOfferMediaAssignment.update({
        where: { id: assignmentId },
        data: { active },
        include: assignmentInclude,
      });
      await audit(tx, actorId, active ? "activate" : "deactivate", assignmentId, `${active ? "Activated" : "Deactivated"} partner media assignment`, {
        subjectType, subjectId, assignmentId, placement: current.placement, variant: current.variant,
        countryCode: current.countryCode, languageCode: current.languageCode,
      });
      return record;
    });
  }

  async listAssetUsage(assetIds: string[]) {
    if (!assetIds.length) return [];
    const [casino, bonuses, offers] = await Promise.all([
      prisma.casinoMediaAssignment.findMany({
        where: { mediaAssetId: { in: assetIds } },
        select: { id: true, mediaAssetId: true, casinoId: true, placement: true, variant: true, countryCode: true, languageCode: true, active: true },
      }),
      prisma.casinoBonusMediaAssignment.findMany({
        where: { mediaAssetId: { in: assetIds } },
        select: { id: true, mediaAssetId: true, casinoBonusId: true, placement: true, variant: true, countryCode: true, languageCode: true, active: true },
      }),
      prisma.affiliateOfferMediaAssignment.findMany({
        where: { mediaAssetId: { in: assetIds } },
        select: { id: true, mediaAssetId: true, affiliateOfferId: true, placement: true, variant: true, countryCode: true, languageCode: true, active: true },
      }),
    ]);
    return [
      ...casino.map((record) => ({ ...record, subjectType: "CASINO" as const, subjectId: record.casinoId })),
      ...bonuses.map((record) => ({ ...record, subjectType: "CASINO_BONUS" as const, subjectId: record.casinoBonusId })),
      ...offers.map((record) => ({ ...record, subjectType: "AFFILIATE_OFFER" as const, subjectId: record.affiliateOfferId })),
    ];
  }
}

export const mediaAssignmentRepository = new MediaAssignmentRepository();
