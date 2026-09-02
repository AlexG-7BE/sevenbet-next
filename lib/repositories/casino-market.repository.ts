import { randomUUID } from "node:crypto";

import {
  CasinoBonusType,
  CasinoCountryAvailability,
  CasinoMarketEvidenceClassification,
  CasinoMarketEvidenceSourceType,
  EditorialStatus,
  OfferStatus,
  Prisma,
} from "@prisma/client";

import type { CasinoMarketProfileMutation } from "@/lib/casino-market/contract";
import { prisma } from "@/lib/db/prisma";

export const casinoMarketProfileInclude = {
  operatorProfile: true,
  evidence: { orderBy: [{ observedAt: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }] },
  licenses: {
    include: { license: { include: { evidence: { orderBy: { observedAt: Prisma.SortOrder.desc } } } } },
  },
  paymentMethods: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { methodKey: Prisma.SortOrder.asc }] },
  gameProviders: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { providerKey: Prisma.SortOrder.asc }] },
  gameCategories: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { categoryKey: Prisma.SortOrder.asc }] },
  bonuses: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { slug: Prisma.SortOrder.asc }] },
  mediaAssets: { where: { status: "ACTIVE" as const }, orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }] },
} satisfies Prisma.CasinoCountryInclude;

export type CasinoMarketProfileRecord = Prisma.CasinoCountryGetPayload<{ include: typeof casinoMarketProfileInclude }>;

function date(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

export class CasinoMarketRepository {
  find(casinoId: string, countryCode: string) {
    return prisma.casinoCountry.findUnique({
      where: { casinoId_countryCode: { casinoId, countryCode } },
      include: casinoMarketProfileInclude,
    });
  }

  list(casinoId: string) {
    return prisma.casinoCountry.findMany({
      where: { casinoId },
      orderBy: { countryCode: "asc" },
      include: casinoMarketProfileInclude,
    });
  }

  async replace(
    casinoId: string,
    countryCode: string,
    input: CasinoMarketProfileMutation,
    actorId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const casino = await tx.casino.findUnique({ where: { id: casinoId }, select: { id: true, title: true, status: true } });
      if (!casino) throw new Error("CASINO_NOT_FOUND");
      if (casino.status !== EditorialStatus.DRAFT) throw new Error("CASINO_MARKET_NOT_DRAFT");

      const existing = await tx.casinoCountry.findUnique({
        where: { casinoId_countryCode: { casinoId, countryCode } },
        select: { id: true, updatedAt: true },
      });
      if (existing && (!input.expectedUpdatedAt || existing.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime())) {
        throw new Error("CASINO_MARKET_EDIT_CONFLICT");
      }
      if (!existing && input.expectedUpdatedAt) throw new Error("CASINO_MARKET_EDIT_CONFLICT");

      if (input.operatorProfileId) {
        const operator = await tx.casinoOperator.findUnique({ where: { id: input.operatorProfileId }, select: { id: true } });
        if (!operator) throw new Error("CASINO_MARKET_OPERATOR_NOT_FOUND");
      }

      const licenseIds = [...new Set(input.licenseIds)];
      const licenses = licenseIds.length
        ? await tx.casinoLicense.findMany({ where: { id: { in: licenseIds }, casinoId }, select: { id: true } })
        : [];
      if (licenses.length !== licenseIds.length) throw new Error("CASINO_MARKET_LICENSE_MISMATCH");

      const profile = await tx.casinoCountry.upsert({
        where: { casinoId_countryCode: { casinoId, countryCode } },
        create: {
          casinoId,
          countryCode,
          availability: input.availability as CasinoCountryAvailability,
          localDomain: input.localDomain?.toLowerCase() ?? null,
          localWebsiteUrl: input.localWebsiteUrl ?? null,
          operatorProfileId: input.operatorProfileId ?? null,
          operatingLegalEntity: input.operatingLegalEntity ?? null,
          termsUrl: input.termsUrl ?? null,
          privacyUrl: input.privacyUrl ?? null,
          responsibleGamblingUrl: input.responsibleGamblingUrl ?? null,
          primaryLanguage: input.primaryLanguage ?? null,
          supportedLanguages: [...new Set(input.supportedLanguages)],
          supportLanguages: [...new Set(input.supportLanguages)],
          primaryCurrency: input.primaryCurrency ?? null,
          supportedCurrencies: [...new Set(input.supportedCurrencies)],
          minimumAge: input.minimumAge ?? null,
          kycSummary: input.kycSummary ?? null,
          withdrawalSummary: input.withdrawalSummary ?? null,
          supportSummary: input.supportSummary ?? null,
          lastVerifiedAt: date(input.lastVerifiedAt),
          notes: input.notes ?? null,
        },
        update: {
          availability: input.availability as CasinoCountryAvailability,
          localDomain: input.localDomain?.toLowerCase() ?? null,
          localWebsiteUrl: input.localWebsiteUrl ?? null,
          operatorProfileId: input.operatorProfileId ?? null,
          operatingLegalEntity: input.operatingLegalEntity ?? null,
          termsUrl: input.termsUrl ?? null,
          privacyUrl: input.privacyUrl ?? null,
          responsibleGamblingUrl: input.responsibleGamblingUrl ?? null,
          primaryLanguage: input.primaryLanguage ?? null,
          supportedLanguages: [...new Set(input.supportedLanguages)],
          supportLanguages: [...new Set(input.supportLanguages)],
          primaryCurrency: input.primaryCurrency ?? null,
          supportedCurrencies: [...new Set(input.supportedCurrencies)],
          minimumAge: input.minimumAge ?? null,
          kycSummary: input.kycSummary ?? null,
          withdrawalSummary: input.withdrawalSummary ?? null,
          supportSummary: input.supportSummary ?? null,
          lastVerifiedAt: date(input.lastVerifiedAt),
          notes: input.notes ?? null,
        },
        select: { id: true },
      });

      await Promise.all([
        tx.casinoCountryLicense.deleteMany({ where: { casinoCountryId: profile.id } }),
        tx.casinoCountryEvidence.deleteMany({ where: { casinoCountryId: profile.id } }),
        tx.casinoPaymentMethod.deleteMany({ where: { casinoCountryId: profile.id } }),
        tx.casinoGameProvider.deleteMany({ where: { casinoCountryId: profile.id } }),
        tx.casinoGameCategory.deleteMany({ where: { casinoCountryId: profile.id } }),
      ]);

      if (licenseIds.length) {
        await tx.casinoCountryLicense.createMany({
          data: licenseIds.map((casinoLicenseId) => ({ casinoId, casinoCountryId: profile.id, casinoLicenseId })),
        });
      }
      if (input.evidence.length) {
        await tx.casinoCountryEvidence.createMany({ data: input.evidence.map((record) => ({
          id: record.id ?? randomUUID(),
          casinoCountryId: profile.id,
          classification: record.classification as CasinoMarketEvidenceClassification,
          sourceType: record.sourceType as CasinoMarketEvidenceSourceType,
          sourceUrl: record.sourceUrl ?? null,
          sourceReference: record.sourceReference ?? null,
          fieldKeys: [...new Set(record.fieldKeys)],
          observedAt: date(record.observedAt),
          lastVerifiedAt: date(record.lastVerifiedAt),
          notes: record.notes ?? null,
        })) });
      }
      if (input.payments.length) {
        await tx.casinoPaymentMethod.createMany({ data: input.payments.map((record) => ({
          id: record.id ?? randomUUID(), casinoId, casinoCountryId: profile.id, methodKey: record.methodKey, name: record.name,
          supportsDeposits: record.supportsDeposits, supportsWithdrawals: record.supportsWithdrawals,
          currencies: [...new Set(record.currencies)], minimumDeposit: record.minimumDeposit, minimumWithdrawal: record.minimumWithdrawal,
          maximumWithdrawal: record.maximumWithdrawal, depositProcessingTime: record.depositProcessingTime ?? null,
          withdrawalTime: record.withdrawalTime ?? null, fees: record.fees ?? null, crypto: record.crypto,
          lastVerifiedAt: date(record.lastVerifiedAt), notes: record.notes ?? null, sortOrder: record.sortOrder,
        })) });
      }
      if (input.providers.length) {
        await tx.casinoGameProvider.createMany({ data: input.providers.map((record) => ({
          id: record.id ?? randomUUID(), casinoId, casinoCountryId: profile.id, providerKey: record.providerKey,
          name: record.name, websiteUrl: record.websiteUrl ?? null, gameCount: record.gameCount ?? null,
          liveCasino: record.liveCasino, verifiedAt: date(record.verifiedAt), sortOrder: record.sortOrder,
        })) });
      }
      if (input.categories.length) {
        await tx.casinoGameCategory.createMany({ data: input.categories.map((record) => ({
          id: record.id ?? randomUUID(), casinoId, casinoCountryId: profile.id, categoryKey: record.categoryKey,
          name: record.name, gameCount: record.gameCount ?? null, featured: record.featured, sortOrder: record.sortOrder,
        })) });
      }

      const retainedBonusIds: string[] = [];
      for (const record of input.bonuses) {
        const existingBonus = await tx.casinoBonus.findFirst({
          where: { OR: [...(record.id ? [{ id: record.id }] : []), { slug: record.slug }] },
          select: { id: true, casinoId: true, casinoCountryId: true },
        });
        if (existingBonus && (existingBonus.casinoId !== casinoId || existingBonus.casinoCountryId !== profile.id)) {
          throw new Error("CASINO_MARKET_BONUS_MISMATCH");
        }
        const id = record.id ?? existingBonus?.id ?? randomUUID();
        retainedBonusIds.push(id);
        await tx.casinoBonus.upsert({
          where: { id },
          create: {
            id, casinoId, casinoCountryId: profile.id, slug: record.slug, title: record.title, summary: record.summary,
            type: record.type as CasinoBonusType, percentage: record.percentage, minimumDeposit: record.minimumDeposit,
            maximumBonus: record.maximumBonus, currency: record.currency ?? null, freeSpins: record.freeSpins ?? null,
            wageringMultiplier: record.wageringMultiplier, wageringText: record.wageringText ?? null,
            eligibility: record.eligibility ?? null, importantConditions: record.importantConditions, termsUrl: record.termsUrl ?? null,
            startsAt: date(record.startsAt), expiresAt: date(record.expiresAt), status: record.status as EditorialStatus,
            offerStatus: record.offerStatus as OfferStatus, lastVerifiedAt: date(record.lastVerifiedAt), sortOrder: record.sortOrder,
            createdBy: actorId, updatedBy: actorId,
          },
          update: {
            slug: record.slug, title: record.title, summary: record.summary, type: record.type as CasinoBonusType,
            percentage: record.percentage, minimumDeposit: record.minimumDeposit, maximumBonus: record.maximumBonus,
            currency: record.currency ?? null, freeSpins: record.freeSpins ?? null, wageringMultiplier: record.wageringMultiplier,
            wageringText: record.wageringText ?? null, eligibility: record.eligibility ?? null,
            importantConditions: record.importantConditions, termsUrl: record.termsUrl ?? null,
            startsAt: date(record.startsAt), expiresAt: date(record.expiresAt), status: record.status as EditorialStatus,
            offerStatus: record.offerStatus as OfferStatus, lastVerifiedAt: date(record.lastVerifiedAt),
            sortOrder: record.sortOrder, updatedBy: actorId,
          },
        });
      }
      await tx.casinoBonus.deleteMany({
        where: { casinoCountryId: profile.id, ...(retainedBonusIds.length ? { id: { notIn: retainedBonusIds } } : {}) },
      });

      await tx.auditLog.create({ data: {
        actorId,
        action: existing ? "update-market-profile" : "create-market-profile",
        entityType: "casino-country",
        entityId: profile.id,
        summary: `${existing ? "Updated" : "Created"} ${countryCode} market profile for ${casino.title}`,
        metadata: { casinoId, countryCode },
      } });

      return tx.casinoCountry.findUniqueOrThrow({ where: { id: profile.id }, include: casinoMarketProfileInclude });
    });
  }
}

export const casinoMarketRepository = new CasinoMarketRepository();
