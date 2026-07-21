import {
  MediaAssetStatus,
  MediaAssetType,
  Prisma,
  type MediaStorageProvider,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const mediaInclude = {
  casino: { select: { id: true, title: true, slug: true } },
  casinoBonus: { select: { id: true, casinoId: true, title: true, slug: true } },
  affiliateOffer: { select: { id: true, casinoId: true, internalName: true, publicLabel: true } },
} satisfies Prisma.MediaAssetInclude;

export type MediaAssetRecord = Prisma.MediaAssetGetPayload<{ include: typeof mediaInclude }>;

export interface MediaListFilters {
  casinoId?: string;
  casinoBonusId?: string;
  affiliateOfferId?: string;
  type?: MediaAssetType;
  status?: MediaAssetStatus;
  includeArchived?: boolean;
  skip?: number;
  take?: number;
}

export interface CreateMediaRecordInput {
  type: MediaAssetType;
  storageProvider: MediaStorageProvider;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  altText: string;
  title?: string | null;
  caption?: string | null;
  credit?: string | null;
  sortOrder: number;
  featured: boolean;
  checksum: string;
  metadata?: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  variants?: Prisma.InputJsonValue;
  createdBy: string;
  casinoId?: string | null;
  casinoBonusId?: string | null;
  affiliateOfferId?: string | null;
}

export interface UpdateMediaRecordInput {
  altText?: string;
  title?: string | null;
  caption?: string | null;
  credit?: string | null;
  featured?: boolean;
  casinoBonusId?: string | null;
  affiliateOfferId?: string | null;
  metadata?: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
}

export interface MediaOwnership {
  casino: { id: string } | null;
  casinoBonus: { id: string; casinoId: string } | null;
  affiliateOffer: { id: string; casinoId: string; casinoBonusId: string | null } | null;
}

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entityId: string,
  summary: string,
  metadata?: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({ data: { actorId, action, entityType: "media-asset", entityId, summary, metadata } });
}

function ownerWhere(asset: Pick<MediaAssetRecord, "casinoId" | "casinoBonusId" | "affiliateOfferId" | "type">, excludeId?: string): Prisma.MediaAssetWhereInput {
  return {
    id: excludeId ? { not: excludeId } : undefined,
    casinoId: asset.casinoId,
    casinoBonusId: asset.casinoBonusId,
    affiliateOfferId: asset.affiliateOfferId,
    type: asset.type,
  };
}

function affiliateUsage(value: Prisma.InputJsonValue | Prisma.JsonValue | Prisma.NullTypes.JsonNull | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) && "affiliateUsage" in value && typeof value.affiliateUsage === "string"
    ? value.affiliateUsage
    : null;
}

export class MediaRepository {
  async list(filters: MediaListFilters = {}) {
    const where: Prisma.MediaAssetWhereInput = {
      ...(filters.casinoId ? { casinoId: filters.casinoId } : {}),
      ...(filters.casinoBonusId ? { casinoBonusId: filters.casinoBonusId } : {}),
      ...(filters.affiliateOfferId ? { affiliateOfferId: filters.affiliateOfferId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : !filters.includeArchived ? { status: { not: MediaAssetStatus.ARCHIVED } } : {}),
    };
    const [records, total] = await prisma.$transaction([
      prisma.mediaAsset.findMany({
        where,
        include: mediaInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        skip: Math.max(filters.skip ?? 0, 0),
        take: Math.min(Math.max(filters.take ?? 100, 1), 200),
      }),
      prisma.mediaAsset.count({ where }),
    ]);
    return { records, total };
  }

  async findById(id: string) {
    return prisma.mediaAsset.findUnique({ where: { id }, include: mediaInclude });
  }

  async findDuplicateChecksum(checksum: string, input: { casinoId?: string | null; casinoBonusId?: string | null; affiliateOfferId?: string | null; type: MediaAssetType }) {
    return prisma.mediaAsset.findFirst({
      where: {
        checksum,
        casinoId: input.casinoId ?? null,
        casinoBonusId: input.casinoBonusId ?? null,
        affiliateOfferId: input.affiliateOfferId ?? null,
        type: input.type,
        status: { not: MediaAssetStatus.ARCHIVED },
      },
      include: mediaInclude,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }

  async resolveOwnership(casinoId?: string | null, casinoBonusId?: string | null, affiliateOfferId?: string | null): Promise<MediaOwnership> {
    const [casino, casinoBonus, affiliateOffer] = await Promise.all([
      casinoId ? prisma.casino.findUnique({ where: { id: casinoId }, select: { id: true } }) : null,
      casinoBonusId ? prisma.casinoBonus.findUnique({ where: { id: casinoBonusId }, select: { id: true, casinoId: true } }) : null,
      affiliateOfferId ? prisma.affiliateOffer.findUnique({ where: { id: affiliateOfferId }, select: { id: true, casinoId: true, casinoBonusId: true } }) : null,
    ]);
    return { casino, casinoBonus, affiliateOffer };
  }

  async nextSortOrder(input: { casinoId?: string | null; casinoBonusId?: string | null; affiliateOfferId?: string | null; type: MediaAssetType }) {
    const record = await prisma.mediaAsset.findFirst({
      where: { casinoId: input.casinoId ?? null, casinoBonusId: input.casinoBonusId ?? null, affiliateOfferId: input.affiliateOfferId ?? null, type: input.type },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return (record?.sortOrder ?? 0) + 1000;
  }

  async create(input: CreateMediaRecordInput) {
    return prisma.$transaction(async (tx) => {
      if (input.featured) {
        await tx.mediaAsset.updateMany({
          where: { casinoId: input.casinoId ?? null, casinoBonusId: input.casinoBonusId ?? null, affiliateOfferId: input.affiliateOfferId ?? null, type: input.type, featured: true },
          data: { featured: false },
        });
      }
      if (input.affiliateOfferId && affiliateUsage(input.metadata) === "LANDING") {
        await tx.mediaAsset.updateMany({
          where: { affiliateOfferId: input.affiliateOfferId, type: input.type, metadata: { path: ["affiliateUsage"], equals: "LANDING" } },
          data: { affiliateOfferId: null },
        });
      }
      const record = await tx.mediaAsset.create({
        data: {
          ...input,
          status: MediaAssetStatus.ACTIVE,
          metadata: input.metadata ?? Prisma.JsonNull,
          variants: input.variants ?? Prisma.JsonNull,
        },
        include: mediaInclude,
      });
      if (record.type === MediaAssetType.SOCIAL_IMAGE && record.featured && record.casinoId) {
        await tx.casinoSeo.updateMany({ where: { casinoId: record.casinoId }, data: { socialImage: record.publicUrl } });
      }
      await audit(tx, input.createdBy, "upload", record.id, `Uploaded ${record.type.toLowerCase().replaceAll("_", " ")} media`, { type: record.type, storageProvider: record.storageProvider });
      return record;
    });
  }

  async update(id: string, input: UpdateMediaRecordInput, actorId: string, expectedUpdatedAt?: Date) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.mediaAsset.findUnique({ where: { id }, include: mediaInclude });
      if (!current) throw new Error("MEDIA_NOT_FOUND");
      if (expectedUpdatedAt && current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) throw new Error("MEDIA_EDIT_CONFLICT");
      const nextOwner = {
        casinoId: current.casinoId,
        casinoBonusId: input.casinoBonusId !== undefined ? input.casinoBonusId : current.casinoBonusId,
        affiliateOfferId: input.affiliateOfferId !== undefined ? input.affiliateOfferId : current.affiliateOfferId,
        type: current.type,
      };
      if (input.featured) await tx.mediaAsset.updateMany({ where: { ...ownerWhere(nextOwner, id), featured: true }, data: { featured: false } });
      if (nextOwner.affiliateOfferId && affiliateUsage(input.metadata) === "LANDING") {
        await tx.mediaAsset.updateMany({
          where: { id: { not: id }, affiliateOfferId: nextOwner.affiliateOfferId, type: current.type, metadata: { path: ["affiliateUsage"], equals: "LANDING" } },
          data: { affiliateOfferId: null },
        });
      }
      const record = await tx.mediaAsset.update({
        where: { id },
        data: input,
        include: mediaInclude,
      });
      if (record.type === MediaAssetType.SOCIAL_IMAGE && record.casinoId) {
        if (record.featured) await tx.casinoSeo.updateMany({ where: { casinoId: record.casinoId }, data: { socialImage: record.publicUrl } });
        else await tx.casinoSeo.updateMany({ where: { casinoId: record.casinoId, socialImage: record.publicUrl }, data: { socialImage: null } });
      }
      const ownerLinked = (!current.casinoBonusId && Boolean(record.casinoBonusId)) || (!current.affiliateOfferId && Boolean(record.affiliateOfferId));
      const ownerUnlinked = (Boolean(current.casinoBonusId) && !record.casinoBonusId) || (Boolean(current.affiliateOfferId) && !record.affiliateOfferId);
      const action = ownerLinked ? "link" : ownerUnlinked ? "unlink" : "update";
      await audit(tx, actorId, action, id, `${action === "update" ? "Updated" : action === "link" ? "Linked" : "Unlinked"} media metadata or usage`, { featured: record.featured, type: record.type });
      return record;
    });
  }

  async setArchived(id: string, archived: boolean, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.mediaAsset.findUnique({ where: { id }, include: mediaInclude });
      if (!current) throw new Error("MEDIA_NOT_FOUND");
      const record = await tx.mediaAsset.update({
        where: { id },
        data: { status: archived ? MediaAssetStatus.ARCHIVED : MediaAssetStatus.ACTIVE, archivedAt: archived ? new Date() : null, featured: archived ? false : current.featured },
        include: mediaInclude,
      });
      if (archived && current.casinoId && current.type === MediaAssetType.SOCIAL_IMAGE) {
        await tx.casinoSeo.updateMany({ where: { casinoId: current.casinoId, socialImage: current.publicUrl }, data: { socialImage: null } });
      }
      await audit(tx, actorId, archived ? "archive" : "restore", id, `${archived ? "Archived" : "Restored"} media asset`, { type: current.type });
      return record;
    });
  }

  async reorder(ids: string[], actorId: string) {
    return prisma.$transaction(async (tx) => {
      const records = await tx.mediaAsset.findMany({ where: { id: { in: ids } }, include: mediaInclude });
      if (records.length !== ids.length) throw new Error("MEDIA_NOT_FOUND");
      const owner = records[0];
      if (records.some((record) => record.casinoId !== owner.casinoId || record.casinoBonusId !== owner.casinoBonusId || record.affiliateOfferId !== owner.affiliateOfferId || record.type !== owner.type)) {
        throw new Error("MEDIA_REORDER_OWNERSHIP_MISMATCH");
      }
      await Promise.all(ids.map((id, index) => tx.mediaAsset.update({ where: { id }, data: { sortOrder: (index + 1) * 1000 } })));
      await audit(tx, actorId, "reorder", owner.casinoId || owner.casinoBonusId || owner.affiliateOfferId || owner.id, `Reordered ${ids.length} media assets`, { type: owner.type, ids });
      return tx.mediaAsset.findMany({ where: { id: { in: ids } }, include: mediaInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }] });
    });
  }

  async usage(id: string) {
    const asset = await this.findById(id);
    if (!asset) return null;
    const seoCount = asset.casinoId ? await prisma.casinoSeo.count({ where: { casinoId: asset.casinoId, socialImage: asset.publicUrl } }) : 0;
    const reasons = [
      asset.featured ? "featured media" : null,
      asset.casinoBonusId ? "casino bonus creative" : null,
      asset.affiliateOfferId ? "affiliate offer creative" : null,
      seoCount ? "casino SEO social image" : null,
    ].filter((value): value is string => Boolean(value));
    return { asset, inUse: reasons.length > 0, reasons };
  }

  async markStorageDeleteFailed(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.mediaAsset.update({ where: { id }, data: { status: MediaAssetStatus.STORAGE_DELETE_FAILED }, include: mediaInclude });
      await audit(tx, actorId, "storage-delete-failed", id, "Storage cleanup failed; manual review required", { storageProvider: record.storageProvider });
      return record;
    });
  }

  async deleteRecord(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.mediaAsset.findUnique({ where: { id } });
      if (!record) throw new Error("MEDIA_NOT_FOUND");
      await audit(tx, actorId, "delete", id, "Deleted unused archived media record", { type: record.type, storageProvider: record.storageProvider });
      await tx.mediaAsset.delete({ where: { id } });
      return record;
    });
  }

  async recordCompensationFailure(actorId: string, checksum: string, storageProvider: MediaStorageProvider) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "upload-cleanup-failed",
        entityType: "media-storage",
        entityId: checksum.slice(0, 16),
        summary: "Database creation failed and uploaded object cleanup also failed",
        metadata: { storageProvider },
      },
    }).catch(() => undefined);
  }
}

export const mediaRepository = new MediaRepository();
