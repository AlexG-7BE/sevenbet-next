import { Prisma, type AdminRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { CommercialActivationBundle, CommercialActivationRecord } from "./contract";
import {
  desiredActivationState,
  type CommercialActivationInspection,
  planCommercialActivationRecord,
} from "./planner";

type CommercialClient = Prisma.TransactionClient | typeof prisma;

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

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
  revenueSharePercentage: Prisma.Decimal | null; hybridTerms: string | null; geoMode: string; languages: string[]; devices: string[];
  landingPageUrl: string | null; startAt: Date | null; expiresAt: Date | null; evergreen: boolean; priority: number; archivedAt: Date | null;
  metadata: Prisma.JsonValue; countries: Array<{ countryCode: string; mode: string }>; currencies: Array<{ currencyCode: string }>;
}, countryCode: string) {
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
    geoMode: record.geoMode,
    languages: [...record.languages].sort(),
    devices: [...record.devices].sort(),
    landingPageUrl: record.landingPageUrl,
    startAt: record.startAt,
    expiresAt: record.expiresAt,
    evergreen: record.evergreen,
    priority: record.priority,
    archivedAt: record.archivedAt,
    metadata: record.metadata,
    countryAuthority: record.countries.find((entry) => entry.countryCode.toUpperCase() === countryCode) ?? null,
    currencies: record.currencies.map((entry) => entry.currencyCode).sort(),
  };
}

function trackingCurrent(record: {
  externalLinkId: string | null; label: string; destinationUrl: string; trackingUrl: string; landingPage: string | null; geoMode: string;
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
    geoMode: record.geoMode,
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

function trackingCountryCurrent(record: {
  countryCode: string; mode: string; productionEligible: boolean; productionEligibilityVerifiedAt: Date | null;
  productionEligibilityExpiresAt: Date | null; productionEligibilityEvidence: string | null; productionEligibilityNotes: string | null;
}) {
  return {
    countryCode: record.countryCode,
    mode: record.mode,
    productionEligible: record.productionEligible,
    productionEligibilityVerifiedAt: record.productionEligibilityVerifiedAt,
    productionEligibilityExpiresAt: record.productionEligibilityExpiresAt,
    productionEligibilityEvidence: record.productionEligibilityEvidence,
    productionEligibilityNotes: record.productionEligibilityNotes,
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
    include: { countries: true, currencies: true },
  }) : null;
  const trackingLink = offer ? await client.affiliateTrackingLink.findFirst({
    where: { offerId: offer.id, externalLinkId: record.trackingLink.externalLinkId },
    include: { countries: { where: { countryCode: record.market.countryCode }, take: 1 } },
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
      current: offerCurrent(offer, record.market.countryCode),
      metadata: offer.metadata,
      currencies: offer.currencies.map((entry) => entry.currencyCode),
    } : null,
    trackingLink: trackingLink ? {
      id: trackingLink.id,
      offerId: trackingLink.offerId,
      current: trackingCurrent(trackingLink),
      metadata: trackingLink.metadata,
    } : null,
    trackingCountry: trackingLink?.countries[0] ? { id: trackingLink.countries[0].id, current: trackingCountryCurrent(trackingLink.countries[0]) } : null,
    redirect: redirect ? {
      id: redirect.id,
      casinoId: redirect.casinoId,
      affiliateOfferId: redirect.affiliateOfferId,
      casinoBonusId: redirect.casinoBonusId,
      current: redirectCurrent(redirect),
    } : null,
  };
}

async function nextRevision(client: Prisma.TransactionClient, model: "offer" | "tracking" | "redirect", id: string) {
  if (model === "offer") return (await client.affiliateOfferRevision.aggregate({ where: { offerId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0;
  if (model === "tracking") return (await client.affiliateTrackingLinkRevision.aggregate({ where: { trackingLinkId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0;
  return (await client.affiliateRedirectRevision.aggregate({ where: { redirectSlugId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0;
}

const activationRoles = new Set<AdminRole>(["SUPER_ADMIN", "ADMIN", "AFFILIATE_MANAGER"]);

export class CommercialActivationRepository {
  inspect(record: CommercialActivationRecord) {
    return inspectWithClient(prisma, record);
  }

  async apply(bundle: CommercialActivationBundle, actorId: string, now: Date) {
    const actor = await prisma.adminUser.findUnique({ where: { id: actorId }, select: { id: true, role: true } });
    if (!actor || !activationRoles.has(actor.role)) throw new Error("COMMERCIAL_ACTIVATION_ACTOR_UNAUTHORIZED");
    return prisma.$transaction(async (tx) => {
      const applied: Array<{ key: string; changed: boolean; ids: { networkId: string; programId: string; offerId: string; trackingLinkId: string; redirectId: string } }> = [];
      for (const record of bundle.records) {
        const inspection = await inspectWithClient(tx, record);
        const plan = planCommercialActivationRecord(bundle, record, inspection, now);
        if (!plan.ready) throw new Error(`COMMERCIAL_ACTIVATION_BLOCKED:${plan.blockedReasons.join(",")}`);
        const desired = desiredActivationState(bundle, record, inspection);
        const changed = Object.values(plan.actions).some((action) => action === "CREATE" || action === "UPDATE");

        const network = inspection.network
          ? plan.actions.network === "UPDATE"
            ? await tx.affiliateNetwork.update({ where: { id: inspection.network.id }, data: { ...desired.network, updatedBy: actorId } })
            : await tx.affiliateNetwork.findUniqueOrThrow({ where: { id: inspection.network.id } })
          : await tx.affiliateNetwork.create({ data: { ...desired.network, createdBy: actorId, updatedBy: actorId } });

        const programData = { ...desired.program, metadata: json(desired.program.metadata), updatedBy: actorId };
        const program = inspection.program
          ? plan.actions.program === "UPDATE"
            ? await tx.affiliateProgram.update({ where: { id: inspection.program.id }, data: programData })
            : await tx.affiliateProgram.findUniqueOrThrow({ where: { id: inspection.program.id } })
          : await tx.affiliateProgram.create({
            data: {
              ...programData,
              networkId: network.id,
              providerType: "MANUAL",
              integrationMode: "MANUAL",
              connectionStatus: "CONFIGURED",
              sourceOfTruth: json({ authorityVersion: bundle.schemaVersion, sourceSystem: bundle.source.system, bundleId: bundle.bundleId }),
              createdBy: actorId,
            },
          });

        const { countryAuthority, currencies, ...desiredOffer } = desired.offer;
        let offer;
        if (inspection.offer) {
          const current = await tx.affiliateOffer.findUniqueOrThrow({ where: { id: inspection.offer.id }, include: { countries: true, currencies: true } });
          if (plan.actions.offer === "UPDATE") {
            await tx.affiliateOfferRevision.create({
              data: { offerId: current.id, revisionNumber: (await nextRevision(tx, "offer", current.id)) + 1, snapshot: json(current), summary: `Before ${bundle.schemaVersion} apply`, createdBy: actorId },
            });
            offer = await tx.affiliateOffer.update({ where: { id: current.id }, data: { ...desiredOffer, metadata: json(desiredOffer.metadata), updatedBy: actorId } });
          } else offer = current;
        } else {
          offer = await tx.affiliateOffer.create({ data: { ...desiredOffer, casinoId: inspection.casino!.id, programId: program.id, metadata: json(desiredOffer.metadata), createdBy: actorId, updatedBy: actorId } });
        }
        await tx.affiliateOfferCountry.upsert({
          where: { offerId_countryCode: { offerId: offer.id, countryCode: countryAuthority.countryCode } },
          create: { offerId: offer.id, ...countryAuthority },
          update: { mode: countryAuthority.mode },
        });
        for (const currencyCode of currencies) {
          await tx.affiliateOfferCurrency.upsert({
            where: { offerId_currencyCode: { offerId: offer.id, currencyCode } },
            create: { offerId: offer.id, currencyCode },
            update: {},
          });
        }

        let trackingLink;
        if (inspection.trackingLink) {
          const current = await tx.affiliateTrackingLink.findUniqueOrThrow({ where: { id: inspection.trackingLink.id } });
          if (plan.actions.trackingLink === "UPDATE") {
            await tx.affiliateTrackingLinkRevision.create({
              data: {
                trackingLinkId: current.id,
                revisionNumber: (await nextRevision(tx, "tracking", current.id)) + 1,
                destinationUrl: current.destinationUrl,
                trackingUrl: current.trackingUrl,
                summary: `Before ${bundle.schemaVersion} apply`,
                createdBy: actorId,
              },
            });
            trackingLink = await tx.affiliateTrackingLink.update({ where: { id: current.id }, data: { ...desired.trackingLink, metadata: json(desired.trackingLink.metadata), updatedBy: actorId } });
          } else trackingLink = current;
        } else {
          trackingLink = await tx.affiliateTrackingLink.create({ data: { ...desired.trackingLink, offerId: offer.id, metadata: json(desired.trackingLink.metadata), createdBy: actorId, updatedBy: actorId } });
        }
        await tx.affiliateTrackingLinkCountry.upsert({
          where: { trackingLinkId_countryCode: { trackingLinkId: trackingLink.id, countryCode: desired.trackingCountry.countryCode } },
          create: { trackingLinkId: trackingLink.id, ...desired.trackingCountry },
          update: desired.trackingCountry,
        });

        const redirectData = { ...desired.redirect, casinoId: inspection.casino!.id, affiliateOfferId: offer.id, updatedBy: actorId };
        let redirect;
        if (inspection.redirect) {
          const current = await tx.affiliateRedirectSlug.findUniqueOrThrow({ where: { id: inspection.redirect.id } });
          if (plan.actions.redirect === "UPDATE") {
            await tx.affiliateRedirectRevision.create({
              data: { redirectSlugId: current.id, revisionNumber: (await nextRevision(tx, "redirect", current.id)) + 1, snapshot: json(current), summary: `Before ${bundle.schemaVersion} apply`, createdBy: actorId },
            });
            redirect = await tx.affiliateRedirectSlug.update({ where: { id: current.id }, data: redirectData });
          } else redirect = current;
        } else {
          redirect = await tx.affiliateRedirectSlug.create({ data: { ...redirectData, createdBy: actorId } });
          await tx.affiliateRedirectRevision.create({
            data: { redirectSlugId: redirect.id, revisionNumber: 1, snapshot: json(redirect), summary: `Created by ${bundle.schemaVersion}`, createdBy: actorId },
          });
        }

        if (changed) {
          await tx.auditLog.create({
            data: {
              actorId,
              action: "commercial-activation-apply",
              entityType: "partner-route",
              entityId: redirect.id,
              summary: `Applied ${bundle.schemaVersion} for ${record.casino.slug} × ${record.market.countryCode}`,
              metadata: json({ bundleId: bundle.bundleId, recordFingerprint: plan.fingerprint, countryCode: record.market.countryCode }),
            },
          });
        }
        applied.push({ key: plan.key, changed, ids: { networkId: network.id, programId: program.id, offerId: offer.id, trackingLinkId: trackingLink.id, redirectId: redirect.id } });
      }
      return applied;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}

export const commercialActivationRepository = new CommercialActivationRepository();
