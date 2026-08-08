import {
  AffiliateExternalEntityType,
  AffiliateGeoMode,
  AffiliateImportAction,
  AffiliateImportItemStatus,
  AffiliateImportStatus,
  AffiliateMatchMethod,
  AffiliateMatchStatus,
  AffiliateStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  AffiliateImportSummary,
  AffiliatePlannedItem,
  CasinoMatchCandidate,
  NormalizedAffiliateOffer,
} from "@/lib/affiliate-integrations/types";

const programIntegrationInclude = {
  network: true,
  casino: { select: { id: true, title: true, slug: true, domain: true } },
  externalMappings: {
    where: { matchStatus: { in: ["UNMATCHED", "REVIEW_REQUIRED", "CONFLICT"] } },
    select: { id: true, matchStatus: true },
  },
  _count: { select: { offers: true, externalMappings: true, importJobs: true } },
} satisfies Prisma.AffiliateProgramInclude;

const jobInclude = {
  affiliateProgram: {
    select: {
      id: true,
      name: true,
      providerType: true,
      integrationMode: true,
      casino: { select: { id: true, title: true } },
    },
  },
  items: { orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] },
} satisfies Prisma.AffiliateImportJobInclude;

const applicableImportActions = new Set<AffiliateImportAction>([
  AffiliateImportAction.CREATE,
  AffiliateImportAction.UPDATE,
  AffiliateImportAction.NO_CHANGE,
  AffiliateImportAction.ARCHIVE,
]);

export type AffiliateIntegrationProgram = Prisma.AffiliateProgramGetPayload<{ include: typeof programIntegrationInclude }>;
export type AffiliateImportJobAggregate = Prisma.AffiliateImportJobGetPayload<{ include: typeof jobInclude }>;

export interface PreparedAffiliateOfferApply {
  itemId: string;
  providerType: string;
  programId: string;
  casinoId: string;
  offer: NormalizedAffiliateOffer;
  actorId: string;
  trustedAutoActivation: boolean;
  supportsGb: boolean;
  deactivateMissing: boolean;
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function offerMetadata(providerType: string, offer: NormalizedAffiliateOffer, canonicalStatus: AffiliateStatus) {
  return json({
    ...offer.metadata,
    _integration: {
      providerType,
      providerSnapshot: {
        externalName: offer.externalName,
        status: canonicalStatus,
        providerStatus: offer.providerStatus,
        payoutModel: offer.payoutModel,
        payoutAmount: offer.payoutAmount,
        payoutCurrency: offer.payoutCurrency,
        revenueSharePercentage: offer.revenueSharePercentage,
        hybridTerms: offer.hybridTerms,
        countries: offer.countries,
        excludedCountries: offer.excludedCountries,
        currencies: offer.currencies,
        languages: offer.languages,
        devices: offer.devices,
        landingPageUrl: offer.landingPageUrl,
        validFrom: offer.validFrom?.toISOString() ?? null,
        validUntil: offer.validUntil?.toISOString() ?? null,
      },
    },
  });
}

export class AffiliateIntegrationRepository {
  findProgram(id: string) {
    return prisma.affiliateProgram.findUnique({ where: { id }, include: programIntegrationInclude });
  }

  listPrograms(input: { search?: string; take?: number } = {}) {
    const search = input.search?.trim();
    return prisma.affiliateProgram.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { operator: { contains: search, mode: "insensitive" } },
              { providerType: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: programIntegrationInclude,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: Math.min(Math.max(input.take ?? 100, 1), 100),
    });
  }

  async listMatchingCasinos(): Promise<CasinoMatchCandidate[]> {
    return prisma.casino.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        title: true,
        internalName: true,
        domain: true,
        aliases: { select: { type: true, normalizedValue: true } },
      },
      orderBy: { title: "asc" },
    });
  }

  findMapping(input: {
    providerType: string;
    programId: string;
    entityType: AffiliateExternalEntityType;
    externalId: string;
  }) {
    return prisma.affiliateExternalMapping.findUnique({
      where: {
        providerType_affiliateProgramId_entityType_externalId: {
          providerType: input.providerType,
          affiliateProgramId: input.programId,
          entityType: input.entityType,
          externalId: input.externalId,
        },
      },
    });
  }

  findOfferByExternalId(programId: string, externalOfferId: string) {
    return prisma.affiliateOffer.findFirst({
      where: { programId, externalOfferId },
      include: {
        countries: true,
        currencies: true,
        trackingLinks: { include: { countries: true } },
      },
    });
  }

  listProviderOffers(programId: string, providerType: string) {
    return prisma.affiliateOffer.findMany({
      where: {
        programId,
        externalOfferId: { not: null },
        metadata: { path: ["_integration", "providerType"], equals: providerType },
      },
      select: {
        id: true,
        externalOfferId: true,
        externalName: true,
        casinoId: true,
        status: true,
        metadata: true,
      },
    });
  }

  async createPreviewJob(input: {
    programId: string;
    providerType: string;
    mode: "FULL" | "INCREMENTAL";
    initiatedBy: string;
    items: AffiliatePlannedItem[];
    summary: AffiliateImportSummary;
    errorSummary?: string[];
  }) {
    return prisma.affiliateImportJob.create({
      data: {
        affiliateProgramId: input.programId,
        providerType: input.providerType,
        mode: input.mode,
        status: input.summary.errors || input.summary.conflicts || input.summary.unmatched || input.errorSummary?.length
          ? AffiliateImportStatus.COMPLETED_WITH_ERRORS
          : AffiliateImportStatus.COMPLETED,
        dryRun: true,
        startedAt: new Date(),
        completedAt: new Date(),
        initiatedBy: input.initiatedBy,
        summary: json(input.summary),
        errorSummary: input.errorSummary?.length ? json(input.errorSummary) : Prisma.JsonNull,
        items: {
          create: input.items.map((item) => ({
            entityType: AffiliateExternalEntityType.OFFER,
            externalId: item.externalId,
            externalName: item.externalName,
            externalDomain: item.externalDomain,
            action: item.action,
            status: item.action === AffiliateImportAction.ERROR
              ? AffiliateImportItemStatus.FAILED
              : item.action === AffiliateImportAction.SKIP || item.action === AffiliateImportAction.CONFLICT
                ? AffiliateImportItemStatus.SKIPPED
                : AffiliateImportItemStatus.PENDING,
            internalEntityId: item.internalEntityId,
            matchStatus: item.matchStatus,
            matchMethod: item.matchMethod,
            matchConfidence: item.matchConfidence,
            before: item.before ? json(item.before) : Prisma.JsonNull,
            after: item.after ? json(item.after) : Prisma.JsonNull,
            sourcePayload: json(item.sourcePayload),
            errors: item.errors.length ? json(item.errors) : Prisma.JsonNull,
            conflictFields: item.conflictFields,
          })),
        },
      },
      include: jobInclude,
    });
  }

  listJobs(input: { programId?: string; status?: AffiliateImportStatus; take?: number } = {}) {
    return prisma.affiliateImportJob.findMany({
      where: {
        ...(input.programId ? { affiliateProgramId: input.programId } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      include: {
        affiliateProgram: { select: { id: true, name: true, providerType: true } },
        _count: { select: { items: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: Math.min(Math.max(input.take ?? 100, 1), 100),
    });
  }

  getJob(id: string) {
    return prisma.affiliateImportJob.findUnique({ where: { id }, include: jobInclude });
  }

  listMappings(input: {
    programId?: string;
    matchStatus?: AffiliateMatchStatus;
    entityType?: AffiliateExternalEntityType;
    take?: number;
  } = {}) {
    return prisma.affiliateExternalMapping.findMany({
      where: {
        ...(input.programId ? { affiliateProgramId: input.programId } : {}),
        ...(input.matchStatus ? { matchStatus: input.matchStatus } : {}),
        ...(input.entityType ? { entityType: input.entityType } : {}),
      },
      include: { affiliateProgram: { select: { id: true, name: true, providerType: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: Math.min(Math.max(input.take ?? 100, 1), 100),
    });
  }

  listConflictItems(input: { programId?: string; take?: number } = {}) {
    return prisma.affiliateImportItem.findMany({
      where: {
        action: AffiliateImportAction.CONFLICT,
        ...(input.programId ? { job: { affiliateProgramId: input.programId } } : {}),
      },
      include: {
        job: {
          select: {
            id: true,
            affiliateProgramId: true,
            createdAt: true,
            affiliateProgram: { select: { id: true, name: true, providerType: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: Math.min(Math.max(input.take ?? 100, 1), 100),
    });
  }

  async upsertMapping(input: {
    providerType: string;
    programId: string;
    entityType: AffiliateExternalEntityType;
    externalId: string;
    internalEntityId?: string | null;
    externalName?: string | null;
    externalDomain?: string | null;
    fingerprint?: string | null;
    sourcePayload?: Record<string, unknown> | null;
    matchStatus: AffiliateMatchStatus;
    matchMethod?: AffiliateMatchMethod | null;
    matchConfidence?: number | null;
    matchedBy?: string | null;
  }, client: Prisma.TransactionClient | typeof prisma = prisma) {
    return client.affiliateExternalMapping.upsert({
      where: {
        providerType_affiliateProgramId_entityType_externalId: {
          providerType: input.providerType,
          affiliateProgramId: input.programId,
          entityType: input.entityType,
          externalId: input.externalId,
        },
      },
      create: {
        providerType: input.providerType,
        affiliateProgramId: input.programId,
        entityType: input.entityType,
        externalId: input.externalId,
        internalEntityId: input.internalEntityId,
        externalName: input.externalName,
        externalDomain: input.externalDomain,
        fingerprint: input.fingerprint,
        sourcePayload: input.sourcePayload ? json(input.sourcePayload) : Prisma.JsonNull,
        matchStatus: input.matchStatus,
        matchMethod: input.matchMethod,
        matchConfidence: input.matchConfidence,
        matchedBy: input.matchedBy,
        lastSeenAt: new Date(),
        lastSyncedAt: input.internalEntityId ? new Date() : null,
      },
      update: {
        internalEntityId: input.internalEntityId,
        externalName: input.externalName,
        externalDomain: input.externalDomain,
        fingerprint: input.fingerprint,
        sourcePayload: input.sourcePayload ? json(input.sourcePayload) : Prisma.JsonNull,
        matchStatus: input.matchStatus,
        matchMethod: input.matchMethod,
        matchConfidence: input.matchConfidence,
        matchedBy: input.matchedBy,
        lastSeenAt: new Date(),
        lastSyncedAt: input.internalEntityId ? new Date() : null,
      },
    });
  }

  async manualMatch(input: {
    mappingId: string;
    casinoId: string;
    actorId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const casino = await tx.casino.findUnique({ where: { id: input.casinoId }, select: { id: true } });
      if (!casino) throw new Error("CASINO_NOT_FOUND");
      const current = await tx.affiliateExternalMapping.findUnique({ where: { id: input.mappingId } });
      if (!current || current.entityType !== AffiliateExternalEntityType.CASINO) throw new Error("CASINO_MAPPING_NOT_FOUND");
      const mapping = await tx.affiliateExternalMapping.update({
        where: { id: input.mappingId },
        data: {
          internalEntityId: input.casinoId,
          matchStatus: AffiliateMatchStatus.MATCHED,
          matchMethod: AffiliateMatchMethod.MANUAL,
          matchConfidence: 1,
          matchedBy: input.actorId,
          lastSyncedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          action: "affiliate-manual-match",
          entityType: "affiliate-external-mapping",
          entityId: mapping.id,
          summary: `Matched external ${mapping.entityType.toLowerCase()} to casino`,
        },
      });
      return mapping;
    });
  }

  async updateConnection(input: {
    programId: string;
    status: "CONNECTED" | "CONFIGURED" | "DISCONNECTED" | "ERROR";
    message?: string | null;
    actorId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const program = await tx.affiliateProgram.update({
        where: { id: input.programId },
        data: {
          connectionStatus: input.status,
          lastConnectionTestAt: new Date(),
          lastSyncError: input.status === "ERROR" ? input.message?.slice(0, 2_000) : null,
          updatedBy: input.actorId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          action: "affiliate-connection-test",
          entityType: "affiliate-program",
          entityId: program.id,
          summary: `Connection test completed with ${input.status}`,
        },
      });
      return program;
    });
  }

  async beginApply(jobId: string) {
    const result = await prisma.affiliateImportJob.updateMany({
      where: {
        id: jobId,
        dryRun: true,
        status: { in: [AffiliateImportStatus.COMPLETED, AffiliateImportStatus.COMPLETED_WITH_ERRORS] },
      },
      data: { dryRun: false, status: AffiliateImportStatus.RUNNING, startedAt: new Date(), completedAt: null },
    });
    if (result.count !== 1) throw new Error("IMPORT_JOB_ALREADY_APPLIED");
    return prisma.affiliateImportJob.findUniqueOrThrow({ where: { id: jobId }, include: jobInclude });
  }

  async applyOfferItem(input: PreparedAffiliateOfferApply) {
    return prisma.$transaction(async (tx) => {
      const allowAutoActivation = input.trustedAutoActivation && !input.supportsGb;
      const item = await tx.affiliateImportItem.findUnique({ where: { id: input.itemId } });
      if (!item || item.status === AffiliateImportItemStatus.APPLIED) return item;
      if (!applicableImportActions.has(item.action)) {
        return tx.affiliateImportItem.update({
          where: { id: input.itemId },
          data: { status: AffiliateImportItemStatus.SKIPPED },
        });
      }
      if (item.action === AffiliateImportAction.NO_CHANGE) {
        return tx.affiliateImportItem.update({
          where: { id: input.itemId },
          data: { status: AffiliateImportItemStatus.APPLIED },
        });
      }

      let existing = await tx.affiliateOffer.findFirst({
        where: { programId: input.programId, externalOfferId: input.offer.externalId },
        include: { trackingLinks: true },
      });

      const status = input.supportsGb && input.offer.status !== AffiliateStatus.ARCHIVED
        ? AffiliateStatus.DRAFT
        : input.offer.status;
      const geoMode = input.offer.countries.length
        ? AffiliateGeoMode.ALLOW
        : input.offer.excludedCountries.length
          ? AffiliateGeoMode.BLOCK
          : AffiliateGeoMode.GLOBAL;
      const geoCountries = input.offer.countries.length ? input.offer.countries : input.offer.excludedCountries;
      const common = {
        casinoId: input.casinoId,
        externalName: input.offer.externalName,
        offerType: input.offer.offerType,
        status,
        payoutModel: input.offer.payoutModel,
        payoutAmount: input.offer.payoutAmount,
        payoutCurrency: input.offer.payoutCurrency,
        revenueSharePercentage: input.offer.revenueSharePercentage,
        hybridTerms: input.offer.hybridTerms,
        geoMode,
        languages: input.offer.languages,
        devices: input.offer.devices,
        landingPageUrl: input.offer.landingPageUrl,
        startAt: input.offer.validFrom,
        expiresAt: input.offer.validUntil,
        evergreen: !input.offer.validUntil,
        priority: input.offer.priority,
        metadata: offerMetadata(input.providerType, input.offer, status),
        sourceUpdatedAt: input.offer.sourceUpdatedAt,
        lastSyncedAt: new Date(),
        archivedAt: status === AffiliateStatus.ARCHIVED ? new Date() : null,
        updatedBy: input.actorId,
      };

      if (!existing) {
        existing = await tx.affiliateOffer.create({
          data: {
            ...common,
            programId: input.programId,
            externalOfferId: input.offer.externalId,
            internalName: input.offer.externalName,
            publicLabel: input.offer.externalName,
            createdBy: input.actorId,
            countries: { create: geoCountries.map((countryCode) => ({ countryCode, mode: geoMode })) },
            currencies: { create: input.offer.currencies.map((currencyCode) => ({ currencyCode })) },
          },
          include: { trackingLinks: true },
        });
      } else {
        await tx.affiliateOfferRevision.create({
          data: {
            offerId: existing.id,
            revisionNumber: (await tx.affiliateOfferRevision.count({ where: { offerId: existing.id } })) + 1,
            snapshot: json(existing),
            summary: `Before ${input.providerType} sync`,
            createdBy: input.actorId,
          },
        });
        existing = await tx.affiliateOffer.update({
          where: { id: existing.id },
          data: {
            ...common,
            countries: {
              deleteMany: {},
              create: geoCountries.map((countryCode) => ({ countryCode, mode: geoMode })),
            },
            currencies: {
              deleteMany: {},
              create: input.offer.currencies.map((currencyCode) => ({ currencyCode })),
            },
          },
          include: { trackingLinks: true },
        });
      }

      const seenLinkIds: string[] = [];
      for (const link of input.offer.trackingLinks) {
        const linkGeoMode = link.countries.length ? AffiliateGeoMode.ALLOW : AffiliateGeoMode.GLOBAL;
        const current = await tx.affiliateTrackingLink.findFirst({
          where: { offerId: existing.id, externalLinkId: link.externalId },
        });
        const linkData = {
          label: link.label,
          destinationUrl: link.destinationUrl,
          trackingUrl: link.trackingUrl,
          geoMode: linkGeoMode,
          currencyCode: link.currencyCode,
          deviceTarget: link.devices[0] ?? "ALL",
          language: link.languages[0] ?? null,
          campaign: link.campaign,
          subIdTemplate: link.subIdTemplate,
          validFrom: link.validFrom,
          expiresAt: link.validUntil,
          active: allowAutoActivation && link.active,
          priority: link.priority,
          source: input.providerType,
          metadata: json(link.metadata),
          archivedAt: null,
          updatedBy: input.actorId,
        };
        if (current) {
          await tx.affiliateTrackingLinkRevision.create({
            data: {
              trackingLinkId: current.id,
              revisionNumber: (await tx.affiliateTrackingLinkRevision.count({ where: { trackingLinkId: current.id } })) + 1,
              destinationUrl: current.destinationUrl,
              trackingUrl: current.trackingUrl,
              summary: `Before ${input.providerType} sync`,
              createdBy: input.actorId,
            },
          });
          await tx.affiliateTrackingLink.update({
            where: { id: current.id },
            data: {
              ...linkData,
              countries: {
                deleteMany: {},
                create: link.countries.map((countryCode) => ({ countryCode, mode: linkGeoMode })),
              },
            },
          });
          seenLinkIds.push(current.id);
        } else {
          const created = await tx.affiliateTrackingLink.create({
            data: {
              ...linkData,
              offerId: existing.id,
              externalLinkId: link.externalId,
              createdBy: input.actorId,
              countries: { create: link.countries.map((countryCode) => ({ countryCode, mode: linkGeoMode })) },
            },
          });
          seenLinkIds.push(created.id);
        }
      }

      if (input.deactivateMissing) {
        await tx.affiliateTrackingLink.updateMany({
          where: { offerId: existing.id, source: input.providerType, id: { notIn: seenLinkIds } },
          data: { active: false, archivedAt: new Date(), updatedBy: input.actorId },
        });
      }

      await this.upsertMapping({
        providerType: input.providerType,
        programId: input.programId,
        entityType: AffiliateExternalEntityType.OFFER,
        externalId: input.offer.externalId,
        internalEntityId: existing.id,
        externalName: input.offer.externalName,
        externalDomain: input.offer.casino.domain,
        sourcePayload: input.offer as unknown as Record<string, unknown>,
        matchStatus: AffiliateMatchStatus.MATCHED,
        matchMethod: AffiliateMatchMethod.EXTERNAL_MAPPING,
        matchConfidence: 1,
        matchedBy: input.actorId,
      }, tx);
      await tx.affiliateImportItem.update({
        where: { id: input.itemId },
        data: {
          internalEntityId: existing.id,
          status: AffiliateImportItemStatus.APPLIED,
          matchStatus: AffiliateMatchStatus.MATCHED,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          action: item.action.toLowerCase(),
          entityType: "affiliate-import-offer",
          entityId: existing.id,
          summary: `${item.action} imported affiliate offer`,
        },
      });
      return existing;
    });
  }

  markItemFailed(itemId: string, message: string) {
    return prisma.affiliateImportItem.update({
      where: { id: itemId },
      data: {
        status: AffiliateImportItemStatus.FAILED,
        errors: json([message]),
      },
    });
  }

  async archiveMissingOfferItem(input: {
    itemId: string;
    programId: string;
    actorId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.affiliateImportItem.findUnique({ where: { id: input.itemId } });
      if (!item || item.status === AffiliateImportItemStatus.APPLIED) return item;
      if (!item.internalEntityId) throw new Error("IMPORTED_OFFER_NOT_FOUND");
      const offer = await tx.affiliateOffer.findFirst({
        where: { id: item.internalEntityId, programId: input.programId },
      });
      if (!offer) throw new Error("IMPORTED_OFFER_NOT_FOUND");
      if (offer.status !== AffiliateStatus.ARCHIVED || !offer.archivedAt) {
        await tx.affiliateOfferRevision.create({
          data: {
            offerId: offer.id,
            revisionNumber: (await tx.affiliateOfferRevision.count({ where: { offerId: offer.id } })) + 1,
            snapshot: json(offer),
            summary: "Before provider missing-record archive",
            createdBy: input.actorId,
          },
        });
        await tx.affiliateOffer.update({
          where: { id: offer.id },
          data: {
            status: AffiliateStatus.ARCHIVED,
            archivedAt: new Date(),
            lastSyncedAt: new Date(),
            updatedBy: input.actorId,
            trackingLinks: {
              updateMany: {
                where: {},
                data: { active: false, archivedAt: new Date(), updatedBy: input.actorId },
              },
            },
          },
        });
      }
      await tx.affiliateImportItem.update({
        where: { id: item.id },
        data: { status: AffiliateImportItemStatus.APPLIED },
      });
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          action: "archive",
          entityType: "affiliate-import-offer",
          entityId: offer.id,
          summary: "Archived provider offer missing from an explicit full sync",
        },
      });
      return offer;
    });
  }

  async finishApply(input: {
    jobId: string;
    status: AffiliateImportStatus;
    summary: AffiliateImportSummary;
    errors: string[];
    programId: string;
    actorId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const completedAt = new Date();
      const job = await tx.affiliateImportJob.update({
        where: { id: input.jobId },
        data: {
          status: input.status,
          summary: json(input.summary),
          errorSummary: input.errors.length ? json(input.errors) : Prisma.JsonNull,
          completedAt,
        },
      });
      await tx.affiliateProgram.update({
        where: { id: input.programId },
        data: {
          lastSyncAt: completedAt,
          lastSuccessfulSyncAt: input.status === AffiliateImportStatus.COMPLETED ? completedAt : undefined,
          lastSyncStatus: input.status,
          lastSyncError: input.errors.length ? input.errors.join("; ").slice(0, 2_000) : null,
          updatedBy: input.actorId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          action: "affiliate-import-apply",
          entityType: "affiliate-import-job",
          entityId: job.id,
          summary: `Affiliate import finished with ${input.status}`,
        },
      });
      return job;
    });
  }
}

export const affiliateIntegrationRepository = new AffiliateIntegrationRepository();
