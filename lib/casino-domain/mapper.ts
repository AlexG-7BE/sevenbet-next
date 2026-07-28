import { EditorialStatus, OfferStatus, type Prisma } from "@prisma/client";

import type { CasinoAggregate } from "@/lib/repositories/casino.repository";

import type { CasinoDomain, CasinoLifecycleStatus, CasinoPublicationStatus, LicenceEvidenceStatus, LicenceStatus } from "./types";

const publicationStatus: Record<EditorialStatus, CasinoPublicationStatus> = { DRAFT: "DRAFT", IN_REVIEW: "IN_REVIEW", APPROVED: "APPROVED", SCHEDULED: "APPROVED", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" };
const offerStatus: Record<OfferStatus, CasinoDomain["bonuses"][number]["offerStatus"]> = { DRAFT: "DRAFT", ACTIVE: "ACTIVE", PAUSED: "PAUSED", EXPIRED: "EXPIRED", ARCHIVED: "ARCHIVED" };
function decimal(value: Prisma.Decimal | null) { return value === null ? null : Number(value); }
function status(value: string): LicenceStatus { return ["ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"].includes(value.toUpperCase()) ? value.toUpperCase() as LicenceStatus : "UNKNOWN"; }
function evidenceStatus(licence: CasinoAggregate["licenses"][number]): LicenceEvidenceStatus { return licence.lastVerifiedAt ? "VERIFIED" : "UNKNOWN"; }

/** Mapping boundary: Prisma types end here and no caller receives them. */
export function mapCasinoAggregateToDomain(casino: CasinoAggregate): CasinoDomain {
  const lifecycleStatus: CasinoLifecycleStatus = casino.domainLifecycleStatus ?? (casino.archivedAt ? "ARCHIVED" : "ACTIVE");
  return {
    id: casino.id, slug: casino.slug, name: casino.title,
    operator: { id: casino.operatorProfile?.id ?? null, name: casino.operatorProfile?.name ?? casino.operator }, brand: { id: casino.brandProfile?.id ?? null, name: casino.brandProfile?.name ?? casino.title },
    lifecycleStatus, publicationStatus: casino.domainPublicationStatus ?? publicationStatus[casino.status],
    licences: casino.licenses.map((licence) => ({ id: licence.id, authority: licence.authority, number: licence.licenseNumber, jurisdiction: licence.jurisdiction, status: licence.canonicalStatus ?? status(licence.status), expiresAt: licence.expiresAt, verifiedAt: licence.lastVerifiedAt, evidence: licence.evidence.length ? licence.evidence.map((evidence) => ({ id: evidence.id, sourceUrl: evidence.sourceUrl, sourceReference: evidence.sourceReference, status: evidence.status, observedAt: evidence.observedAt, expiresAt: evidence.expiresAt, reviewedAt: evidence.reviewedAt })) : [{ id: `legacy:${licence.id}`, sourceUrl: licence.verificationUrl, sourceReference: null, status: evidenceStatus(licence), observedAt: licence.lastVerifiedAt, expiresAt: licence.expiresAt, reviewedAt: licence.lastVerifiedAt }] })),
    availability: casino.countries.map((country) => ({ countryCode: country.countryCode, state: country.availability, minimumAge: country.minimumAge })),
    languages: casino.languages, currencies: casino.currencies,
    bonuses: casino.casinoBonuses.map((bonus) => ({ id: bonus.id, slug: bonus.slug, title: bonus.title, publicationStatus: publicationStatus[bonus.status], offerStatus: offerStatus[bonus.offerStatus], startsAt: bonus.startsAt, expiresAt: bonus.expiresAt, terms: { wageringText: bonus.wageringText, wageringMultiplier: decimal(bonus.wageringMultiplier), minimumDeposit: decimal(bonus.minimumDeposit), maximumBonus: decimal(bonus.maximumBonus), termsUrl: bonus.termsUrl, importantConditions: bonus.importantConditions } })),
    affiliatePrograms: casino.affiliatePrograms.map((program) => ({ id: program.id, name: program.name, operator: program.operator, status: program.status, publicationStatus: publicationStatus[program.workflowStatus], suspended: program.status === "ARCHIVED" || program.workflowStatus === "ARCHIVED" })),
    affiliateOffers: casino.affiliatePrograms.flatMap((program) => program.offers.map((offer) => ({ id: offer.id, programId: program.id, status: offer.status, countries: offer.countries.filter((country) => country.mode === "ALLOW").map((country) => country.countryCode), currencies: offer.currencies.map((currency) => currency.currencyCode), startsAt: offer.startAt, expiresAt: offer.expiresAt }))),
    seo: { title: casino.seo?.title ?? null, description: casino.seo?.description ?? null, canonicalUrl: casino.seo?.canonicalUrl ?? null, robots: casino.seo?.robots ?? null },
    responsibleGambling: { tools: casino.responsibleGamblingTools }, tracking: { affiliateProgramIds: [] },
  };
}
