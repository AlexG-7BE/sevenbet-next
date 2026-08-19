import { EditorialStatus, OfferStatus, type Prisma } from "@prisma/client";

import type { CasinoDomain, CasinoLifecycleStatus, CasinoPublicationStatus, LicenceEvidenceStatus, LicenceStatus } from "@/lib/casino-domain/types";

import type { CasinoAggregate } from "./casino.repository";

const publicationStatus: Record<EditorialStatus, CasinoPublicationStatus> = { DRAFT: "DRAFT", IN_REVIEW: "IN_REVIEW", APPROVED: "APPROVED", SCHEDULED: "APPROVED", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" };
const offerStatus: Record<OfferStatus, CasinoDomain["bonuses"][number]["offerStatus"]> = { DRAFT: "DRAFT", ACTIVE: "ACTIVE", PAUSED: "PAUSED", EXPIRED: "EXPIRED", ARCHIVED: "ARCHIVED" };
function decimal(value: Prisma.Decimal | null) { return value === null ? null : Number(value); }
function legacyLicenceStatus(value: string): LicenceStatus { return ["ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"].includes(value.toUpperCase()) ? value.toUpperCase() as LicenceStatus : "UNKNOWN"; }
function legacyEvidenceStatus(_licence: CasinoAggregate["licenses"][number]): LicenceEvidenceStatus { return "UNKNOWN"; }
function lifecycle(value: CasinoLifecycleStatus | null | undefined, fallback: CasinoLifecycleStatus = "ACTIVE") { return value ?? fallback; }

/** Infrastructure boundary: maps Prisma aggregate values into immutable domain data. */
export function mapCasinoAggregateToDomain(casino: CasinoAggregate): CasinoDomain {
  const lifecycleStatus = lifecycle(casino.domainLifecycleStatus, casino.archivedAt ? "ARCHIVED" : "ACTIVE");
  return {
    id: casino.id, slug: casino.slug, name: casino.title, domain: casino.domain,
    operator: { id: casino.operatorProfile?.id ?? null, name: casino.operatorProfile?.name ?? casino.operator, legalName: casino.operatorProfile?.legalName ?? null, lifecycleStatus: lifecycle(casino.operatorProfile?.status) },
    brand: { id: casino.brandProfile?.id ?? null, operatorId: casino.brandProfile?.operatorId ?? null, name: casino.brandProfile?.name ?? casino.title, lifecycleStatus: lifecycle(casino.brandProfile?.status) },
    lifecycleStatus, publicationStatus: casino.domainPublicationStatus ?? publicationStatus[casino.status],
    licences: casino.licenses.map((licence) => ({ id: licence.id, authority: licence.authority, number: licence.licenseNumber, jurisdiction: licence.jurisdiction, status: licence.canonicalStatus ?? legacyLicenceStatus(licence.status), expiresAt: licence.expiresAt, verifiedAt: licence.lastVerifiedAt, evidence: licence.evidence.length ? licence.evidence.map((evidence) => ({ id: evidence.id, sourceUrl: evidence.sourceUrl, sourceReference: evidence.sourceReference, status: evidence.status, observedAt: evidence.observedAt, expiresAt: evidence.expiresAt, reviewedAt: evidence.reviewedAt })) : [{ id: `legacy:${licence.id}`, sourceUrl: licence.verificationUrl, sourceReference: null, status: legacyEvidenceStatus(licence), observedAt: licence.lastVerifiedAt, expiresAt: licence.expiresAt, reviewedAt: licence.lastVerifiedAt }] })),
    availability: casino.countries.map((country) => ({ countryCode: country.countryCode, state: country.availability, minimumAge: country.minimumAge })),
    languages: casino.languages, currencies: casino.currencies,
    bonuses: casino.casinoBonuses.map((bonus) => ({ id: bonus.id, slug: bonus.slug, title: bonus.title, summary: bonus.summary, type: bonus.type, percentage: decimal(bonus.percentage), currency: bonus.currency, freeSpins: bonus.freeSpins, eligibility: bonus.eligibility, lastVerifiedAt: bonus.lastVerifiedAt, lifecycleStatus: lifecycle(bonus.domainLifecycleStatus), publicationStatus: publicationStatus[bonus.status], offerStatus: offerStatus[bonus.offerStatus], startsAt: bonus.startsAt, expiresAt: bonus.expiresAt, terms: { wageringText: bonus.wageringText, wageringMultiplier: decimal(bonus.wageringMultiplier), minimumDeposit: decimal(bonus.minimumDeposit), maximumBonus: decimal(bonus.maximumBonus), termsUrl: bonus.termsUrl, importantConditions: bonus.importantConditions } })),
    affiliatePrograms: casino.affiliatePrograms.map((program) => ({ id: program.id, name: program.name, operator: program.operator, status: program.status, publicationStatus: publicationStatus[program.workflowStatus], lifecycleStatus: lifecycle(program.domainLifecycleStatus) })),
    affiliateOffers: casino.affiliatePrograms.flatMap((program) => program.offers.map((offer) => ({ id: offer.id, programId: program.id, status: offer.status, lifecycleStatus: lifecycle(offer.domainLifecycleStatus), countries: offer.countries.filter((country) => country.mode === "ALLOW").map((country) => country.countryCode), currencies: offer.currencies.map((currency) => currency.currencyCode), startsAt: offer.startAt, expiresAt: offer.expiresAt }))),
    seo: { title: casino.seo?.title ?? null, description: casino.seo?.description ?? null, canonicalUrl: casino.seo?.canonicalUrl ?? null, robots: casino.seo?.robots ?? null },
    responsibleGambling: { tools: casino.responsibleGamblingTools }, tracking: { affiliateProgramIds: casino.affiliatePrograms.map((program) => program.id) },
  };
}
