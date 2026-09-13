import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { CommercialActivationRecord } from "./contract";
import type { CommercialActivationInspection } from "./planner";

type CommercialClient = Prisma.TransactionClient | typeof prisma;

function number(value: Prisma.Decimal | number | null) {
  return value === null ? null : Number(value);
}

function networkCurrent(record: {
  name: string; slug: string; type: string; websiteUrl: string | null; active: boolean; archivedAt: Date | null;
}) {
  return {
    name: record.name,
    slug: record.slug,
    type: record.type,
    websiteUrl: record.websiteUrl,
    active: record.active,
    archivedAt: record.archivedAt,
  };
}

function programCurrent(record: {
  casinoId: string | null; externalProgramId: string | null; name: string; operator: string; status: string;
  domainLifecycleStatus: string | null; workflowStatus: string; accountReference: string | null; defaultCurrency: string | null;
  supportedCountries: string[]; supportedCurrencies: string[]; trustedAutoActivation: boolean; archivedAt: Date | null; metadata: Prisma.JsonValue;
}) {
  return {
    casinoId: record.casinoId,
    externalProgramId: record.externalProgramId,
    name: record.name,
    operator: record.operator,
    status: record.status,
    domainLifecycleStatus: record.domainLifecycleStatus,
    workflowStatus: record.workflowStatus,
    accountReference: record.accountReference,
    defaultCurrency: record.defaultCurrency,
    supportedCountries: [...record.supportedCountries].sort(),
    supportedCurrencies: [...record.supportedCurrencies].sort(),
    trustedAutoActivation: record.trustedAutoActivation,
    archivedAt: record.archivedAt,
    metadata: record.metadata,
  };
}

function offerCurrent(record: {
  casinoId: string; externalOfferId: string | null; externalName: string | null; internalName: string; publicLabel: string; offerType: string;
  status: string; domainLifecycleStatus: string | null; payoutModel: string; payoutAmount: Prisma.Decimal | null; payoutCurrency: string | null;
  revenueSharePercentage: Prisma.Decimal | null; hybridTerms: string | null; languages: string[]; devices: string[];
  landingPageUrl: string | null; startAt: Date | null; expiresAt: Date | null; evergreen: boolean; priority: number; archivedAt: Date | null;
  metadata: Prisma.JsonValue; currencies: Array<{ currencyCode: string }>;
}) {
  return {
    casinoId: record.casinoId,
    externalOfferId: record.externalOfferId,
    externalName: record.externalName,
    internalName: record.internalName,
    publicLabel: record.publicLabel,
    offerType: record.offerType,
    status: record.status,
    domainLifecycleStatus: record.domainLifecycleStatus,
    payoutModel: record.payoutModel,
    payoutAmount: number(record.payoutAmount),
    payoutCurrency: record.payoutCurrency,
    revenueSharePercentage: number(record.revenueSharePercentage),
    hybridTerms: record.hybridTerms,
    languages: [...record.languages].sort(),
    devices: [...record.devices].sort(),
    landingPageUrl: record.landingPageUrl,
    startAt: record.startAt,
    expiresAt: record.expiresAt,
    evergreen: record.evergreen,
    priority: record.priority,
    archivedAt: record.archivedAt,
    metadata: record.metadata,
    currencies: record.currencies.map((entry) => entry.currencyCode).sort(),
  };
}

function trackingCurrent(record: {
  externalLinkId: string | null; label: string; destinationUrl: string; trackingUrl: string; landingPage: string | null;
  currencyCode: string | null; language: string | null; campaign: string | null; subIdTemplate: string | null; verifiedAt: Date | null;
  lastCheckedAt: Date | null; validFrom: Date | null; expiresAt: Date | null; active: boolean; priority: number; source: string;
  archivedAt: Date | null; metadata: Prisma.JsonValue;
}) {
  return {
    externalLinkId: record.externalLinkId,
    label: record.label,
    destinationUrl: record.destinationUrl,
    trackingUrl: record.trackingUrl,
    landingPage: record.landingPage,
    currencyCode: record.currencyCode,
    language: record.language,
    campaign: record.campaign,
    subIdTemplate: record.subIdTemplate,
    verifiedAt: record.verifiedAt,
    lastCheckedAt: record.lastCheckedAt,
    validFrom: record.validFrom,
    expiresAt: record.expiresAt,
    active: record.active,
    priority: record.priority,
    source: record.source,
    archivedAt: record.archivedAt,
    metadata: record.metadata,
  };
}

function redirectCurrent(record: {
  slug: string; casinoId: string; casinoBonusId: string | null; affiliateOfferId: string | null; defaultCurrency: string | null;
  defaultLanguage: string | null; active: boolean; archivedAt: Date | null;
}) {
  return {
    slug: record.slug,
    casinoId: record.casinoId,
    casinoBonusId: record.casinoBonusId,
    affiliateOfferId: record.affiliateOfferId,
    defaultCurrency: record.defaultCurrency,
    defaultLanguage: record.defaultLanguage,
    active: record.active,
    archivedAt: record.archivedAt,
  };
}

async function inspectWithClient(client: CommercialClient, record: CommercialActivationRecord): Promise<CommercialActivationInspection> {
  const casino = await client.casino.findUnique({
    where: { slug: record.casino.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      countries: {
        where: { countryCode: record.market.countryCode },
        select: {
          id: true, casinoId: true, countryCode: true, availability: true, primaryCurrency: true,
          supportedCurrencies: true, primaryLanguage: true, supportedLanguages: true,
        },
        take: 1,
      },
    },
  });
  const network = await client.affiliateNetwork.findUnique({ where: { slug: record.network.slug } });
  const program = network ? await client.affiliateProgram.findFirst({
    where: { networkId: network.id, externalProgramId: record.program.externalProgramId },
  }) : null;
  const offer = program ? await client.affiliateOffer.findFirst({
    where: { programId: program.id, externalOfferId: record.offer.externalOfferId },
    include: { currencies: true },
  }) : null;
  const trackingLink = offer ? await client.affiliateTrackingLink.findFirst({
    where: { offerId: offer.id, externalLinkId: record.trackingLink.externalLinkId },
  }) : null;
  const redirect = await client.affiliateRedirectSlug.findUnique({ where: { slug: record.redirect.slug } });
  return {
    casino: casino ? {
      id: casino.id,
      slug: casino.slug,
      title: casino.title,
      marketProfile: casino.countries[0] ?? null,
    } : null,
    network: network ? { id: network.id, current: networkCurrent(network) } : null,
    program: program ? { id: program.id, casinoId: program.casinoId, operator: program.operator, current: programCurrent(program), metadata: program.metadata } : null,
    offer: offer ? {
      id: offer.id,
      casinoId: offer.casinoId,
      casinoBonusId: offer.casinoBonusId,
      current: offerCurrent(offer),
      metadata: offer.metadata,
      currencies: offer.currencies.map((entry) => entry.currencyCode),
    } : null,
    trackingLink: trackingLink ? {
      id: trackingLink.id,
      offerId: trackingLink.offerId,
      current: trackingCurrent(trackingLink),
      metadata: trackingLink.metadata,
    } : null,
    redirect: redirect ? {
      id: redirect.id,
      casinoId: redirect.casinoId,
      affiliateOfferId: redirect.affiliateOfferId,
      casinoBonusId: redirect.casinoBonusId,
      current: redirectCurrent(redirect),
    } : null,
  };
}

/** Read-only compatibility inspection for the retired activation-bundle preview. */
export class CommercialActivationRepository {
  inspect(record: CommercialActivationRecord) {
    return inspectWithClient(prisma, record);
  }
}

export const commercialActivationRepository = new CommercialActivationRepository();
