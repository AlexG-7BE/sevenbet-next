import { AffiliateGeoMode, AffiliateStatus, Prisma } from "@prisma/client";

import type { ActiveOfferQuery, AffiliateOfferInput, AffiliateTrackingLinkInput } from "@/lib/affiliate/types";
import { prisma } from "@/lib/db/prisma";

const offerAggregateInclude = {
  program: { include: { network: true } },
  casino: { select: { id: true, title: true, slug: true } },
  casinoBonus: { select: { id: true, casinoId: true, title: true, slug: true } },
  countries: { orderBy: { countryCode: Prisma.SortOrder.asc } },
  currencies: { orderBy: { currencyCode: Prisma.SortOrder.asc } },
  trackingLinks: {
    orderBy: [{ priority: Prisma.SortOrder.desc }, { updatedAt: Prisma.SortOrder.desc }],
    include: { countries: { orderBy: { countryCode: Prisma.SortOrder.asc } } },
  },
  revisions: { orderBy: { revisionNumber: Prisma.SortOrder.desc }, take: 20 },
} satisfies Prisma.AffiliateOfferInclude;

const offerListInclude = {
  program: { select: { id: true, name: true, status: true, network: { select: { id: true, name: true, active: true } } } },
  casino: { select: { id: true, title: true, slug: true } },
  casinoBonus: { select: { id: true, title: true, slug: true } },
  _count: { select: { trackingLinks: true } },
} satisfies Prisma.AffiliateOfferInclude;

export type AffiliateOfferAggregate = Prisma.AffiliateOfferGetPayload<{ include: typeof offerAggregateInclude }>;
export type AffiliateOfferListItem = Prisma.AffiliateOfferGetPayload<{ include: typeof offerListInclude }>;

export interface AffiliateOfferStore {
  list(input?: { programId?: string; casinoId?: string; status?: AffiliateStatus; search?: string }): Promise<AffiliateOfferListItem[]>;
  findById(id: string): Promise<AffiliateOfferAggregate | null>;
  existsExternalOfferId(programId: string, externalOfferId: string, excludeId?: string): Promise<boolean>;
  findDuplicateExternalLinkId(programId: string, externalLinkIds: string[], excludeOfferId?: string): Promise<string | null>;
  findCasinoBonus(casinoId: string, casinoBonusId?: string | null): Promise<{ casinoExists: boolean; bonusCasinoId: string | null }>;
  create(input: AffiliateOfferInput, actorId: string): Promise<AffiliateOfferAggregate>;
  update(id: string, input: AffiliateOfferInput, actorId: string): Promise<AffiliateOfferAggregate>;
  archive(id: string, actorId: string): Promise<AffiliateOfferAggregate>;
  listRevisions(id: string): Promise<AffiliateOfferAggregate["revisions"]>;
  listTrackingHistory(trackingLinkId: string): Promise<Array<{ id: string; revisionNumber: number; destinationUrl: string; trackingUrl: string; summary: string; createdBy: string; createdAt: Date }>>;
  findActiveCandidates(input: ActiveOfferQuery): Promise<AffiliateOfferAggregate[]>;
}

function jsonSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function linkData(link: AffiliateTrackingLinkInput, actorId: string) {
  return {
    externalLinkId: link.externalLinkId,
    label: link.label,
    destinationUrl: link.destinationUrl,
    trackingUrl: link.trackingUrl,
    landingPage: link.landingPage,
    geoMode: link.geoMode,
    currencyCode: link.currencyCode,
    deviceTarget: link.deviceTarget ?? "ALL",
    language: link.language,
    promoCode: link.promoCode,
    campaign: link.campaign,
    creativeReference: link.creativeReference,
    verifiedAt: link.verifiedAt,
    lastCheckedAt: link.lastCheckedAt,
    expiresAt: link.expiresAt,
    active: link.active,
    priority: link.priority,
    source: link.source ?? "MANUAL",
    archivedAt: link.active ? null : undefined,
    updatedBy: actorId,
  };
}

async function createTrackingRevision(tx: Prisma.TransactionClient, link: AffiliateOfferAggregate["trackingLinks"][number], actorId: string, summary: string) {
  const latest = await tx.affiliateTrackingLinkRevision.findFirst({ where: { trackingLinkId: link.id }, orderBy: { revisionNumber: "desc" }, select: { revisionNumber: true } });
  await tx.affiliateTrackingLinkRevision.create({ data: { trackingLinkId: link.id, revisionNumber: (latest?.revisionNumber ?? 0) + 1, destinationUrl: link.destinationUrl, trackingUrl: link.trackingUrl, summary, createdBy: actorId } });
}

export class AffiliateOfferRepository implements AffiliateOfferStore {
  async list(input: { programId?: string; casinoId?: string; status?: AffiliateStatus; search?: string } = {}) {
    const search = input.search?.trim();
    return prisma.affiliateOffer.findMany({
      where: {
        ...(input.programId ? { programId: input.programId } : {}),
        ...(input.casinoId ? { casinoId: input.casinoId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(search ? { OR: [{ internalName: { contains: search, mode: "insensitive" } }, { publicLabel: { contains: search, mode: "insensitive" } }, { externalOfferId: { contains: search, mode: "insensitive" } }] } : {}),
      },
      include: offerListInclude,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });
  }

  async findById(id: string) {
    return prisma.affiliateOffer.findUnique({ where: { id }, include: offerAggregateInclude });
  }

  async existsExternalOfferId(programId: string, externalOfferId: string, excludeId?: string) {
    return (await prisma.affiliateOffer.count({ where: { programId, externalOfferId, ...(excludeId ? { id: { not: excludeId } } : {}) } })) > 0;
  }

  async findDuplicateExternalLinkId(programId: string, externalLinkIds: string[], excludeOfferId?: string) {
    if (!externalLinkIds.length) return null;
    const link = await prisma.affiliateTrackingLink.findFirst({
      where: {
        externalLinkId: { in: externalLinkIds },
        offer: { programId, ...(excludeOfferId ? { id: { not: excludeOfferId } } : {}) },
      },
      select: { externalLinkId: true },
    });
    return link?.externalLinkId ?? null;
  }

  async findCasinoBonus(casinoId: string, casinoBonusId?: string | null) {
    const [casino, bonus] = await Promise.all([
      prisma.casino.findUnique({ where: { id: casinoId }, select: { id: true } }),
      casinoBonusId ? prisma.casinoBonus.findUnique({ where: { id: casinoBonusId }, select: { casinoId: true } }) : Promise.resolve(null),
    ]);
    return { casinoExists: Boolean(casino), bonusCasinoId: bonus?.casinoId ?? null };
  }

  async create(input: AffiliateOfferInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const offer = await tx.affiliateOffer.create({
        data: {
          programId: input.programId, casinoId: input.casinoId, casinoBonusId: input.casinoBonusId,
          externalOfferId: input.externalOfferId, internalName: input.internalName, publicLabel: input.publicLabel,
          offerType: input.offerType, status: input.status, payoutModel: input.payoutModel,
          payoutAmount: input.payoutAmount, payoutCurrency: input.payoutCurrency,
          revenueSharePercentage: input.revenueSharePercentage, hybridTerms: input.hybridTerms,
          cookieDurationDays: input.cookieDurationDays, geoMode: input.geoMode, startAt: input.startAt,
          expiresAt: input.expiresAt, evergreen: input.evergreen, featured: input.featured,
          priority: input.priority, terms: input.terms, notes: input.notes, createdBy: actorId, updatedBy: actorId,
          countries: { create: input.countries }, currencies: { create: input.currencies.map((currencyCode) => ({ currencyCode })) },
          trackingLinks: { create: input.trackingLinks.map((link) => ({ ...linkData(link, actorId), createdBy: actorId, countries: { create: link.countries } })) },
        },
        include: offerAggregateInclude,
      });
      await tx.auditLog.create({ data: { actorId, action: "create", entityType: "affiliate-offer", entityId: offer.id, summary: `Created affiliate offer: ${offer.internalName}` } });
      return offer;
    });
  }

  async update(id: string, input: AffiliateOfferInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.affiliateOffer.findUnique({ where: { id }, include: offerAggregateInclude });
      if (!current) throw new Error("AFFILIATE_OFFER_NOT_FOUND");
      const latest = await tx.affiliateOfferRevision.findFirst({ where: { offerId: id }, orderBy: { revisionNumber: "desc" }, select: { revisionNumber: true } });
      await tx.affiliateOfferRevision.create({ data: { offerId: id, revisionNumber: (latest?.revisionNumber ?? 0) + 1, snapshot: jsonSnapshot(current), summary: "Updated affiliate offer and terms", createdBy: actorId } });

      const incomingIds = new Set(input.trackingLinks.flatMap((link) => link.id ? [link.id] : []));
      for (const existing of current.trackingLinks) {
        if (!incomingIds.has(existing.id)) {
          await createTrackingRevision(tx, existing, actorId, "Archived tracking link removed from offer aggregate");
          await tx.affiliateTrackingLink.update({ where: { id: existing.id }, data: { active: false, archivedAt: new Date(), updatedBy: actorId } });
        }
      }
      for (const link of input.trackingLinks) {
        if (link.id) {
          const existing = current.trackingLinks.find((item) => item.id === link.id);
          if (!existing) throw new Error("AFFILIATE_TRACKING_LINK_OWNERSHIP");
          await createTrackingRevision(tx, existing, actorId, "Updated tracking destination");
          await tx.affiliateTrackingLink.update({ where: { id: link.id }, data: { ...linkData(link, actorId), countries: { deleteMany: {}, create: link.countries } } });
        } else {
          await tx.affiliateTrackingLink.create({ data: { offerId: id, ...linkData(link, actorId), createdBy: actorId, countries: { create: link.countries } } });
        }
      }

      const offer = await tx.affiliateOffer.update({
        where: { id },
        data: {
          programId: input.programId, casinoId: input.casinoId, casinoBonusId: input.casinoBonusId,
          externalOfferId: input.externalOfferId, internalName: input.internalName, publicLabel: input.publicLabel,
          offerType: input.offerType, status: input.status, payoutModel: input.payoutModel,
          payoutAmount: input.payoutAmount, payoutCurrency: input.payoutCurrency,
          revenueSharePercentage: input.revenueSharePercentage, hybridTerms: input.hybridTerms,
          cookieDurationDays: input.cookieDurationDays, geoMode: input.geoMode, startAt: input.startAt,
          expiresAt: input.expiresAt, evergreen: input.evergreen, featured: input.featured,
          priority: input.priority, terms: input.terms, notes: input.notes,
          archivedAt: input.status === AffiliateStatus.ARCHIVED ? new Date() : null, updatedBy: actorId,
          countries: { deleteMany: {}, create: input.countries },
          currencies: { deleteMany: {}, create: input.currencies.map((currencyCode) => ({ currencyCode })) },
        },
        include: offerAggregateInclude,
      });
      await tx.auditLog.create({ data: { actorId, action: input.status === AffiliateStatus.ARCHIVED ? "archive" : "update", entityType: "affiliate-offer", entityId: id, summary: `Updated affiliate offer: ${offer.internalName}` } });
      return offer;
    });
  }

  async findActiveCandidates(input: ActiveOfferQuery) {
    const now = input.now ?? new Date();
    return prisma.affiliateOffer.findMany({
      where: {
        casinoId: input.casinoId,
        ...(input.casinoBonusId ? { OR: [{ casinoBonusId: input.casinoBonusId }, { casinoBonusId: null }] } : { casinoBonusId: null }),
        status: AffiliateStatus.ACTIVE,
        archivedAt: null,
        program: { status: AffiliateStatus.ACTIVE, archivedAt: null, network: { active: true, archivedAt: null } },
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          ...(input.countryCode ? [{ OR: [{ geoMode: AffiliateGeoMode.GLOBAL }, { countries: { some: { countryCode: input.countryCode.toUpperCase(), mode: AffiliateGeoMode.ALLOW } } }, { AND: [{ geoMode: AffiliateGeoMode.BLOCK }, { countries: { none: { countryCode: input.countryCode.toUpperCase() } } }] }] }] : []),
          ...(input.currencyCode ? [{ OR: [{ currencies: { none: {} } }, { currencies: { some: { currencyCode: input.currencyCode.toUpperCase() } } }] }] : []),
        ],
      },
      include: offerAggregateInclude,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });
  }

  async archive(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.affiliateOffer.findUnique({ where: { id }, include: offerAggregateInclude });
      if (!current) throw new Error("AFFILIATE_OFFER_NOT_FOUND");
      const latest = await tx.affiliateOfferRevision.findFirst({ where: { offerId: id }, orderBy: { revisionNumber: "desc" }, select: { revisionNumber: true } });
      await tx.affiliateOfferRevision.create({ data: { offerId: id, revisionNumber: (latest?.revisionNumber ?? 0) + 1, snapshot: jsonSnapshot(current), summary: "Archived affiliate offer", createdBy: actorId } });
      for (const link of current.trackingLinks.filter((item) => item.active)) {
        await createTrackingRevision(tx, link, actorId, "Disabled because offer was archived");
      }
      const offer = await tx.affiliateOffer.update({
        where: { id },
        data: { status: AffiliateStatus.ARCHIVED, archivedAt: new Date(), updatedBy: actorId, trackingLinks: { updateMany: { where: {}, data: { active: false, archivedAt: new Date(), updatedBy: actorId } } } },
        include: offerAggregateInclude,
      });
      await tx.auditLog.create({ data: { actorId, action: "archive", entityType: "affiliate-offer", entityId: id, summary: `Archived affiliate offer: ${offer.internalName}` } });
      return offer;
    });
  }

  async listRevisions(id: string) {
    return prisma.affiliateOfferRevision.findMany({ where: { offerId: id }, orderBy: { revisionNumber: "desc" } });
  }

  async listTrackingHistory(trackingLinkId: string) {
    return prisma.affiliateTrackingLinkRevision.findMany({ where: { trackingLinkId }, orderBy: { revisionNumber: "desc" } });
  }
}

export const affiliateOfferRepository = new AffiliateOfferRepository();
