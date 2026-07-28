import type { CasinoDomain, CasinoEligibility, CasinoLicence } from "./types";

function currentVerifiedLicence(licence: CasinoLicence, now: Date) {
  if (licence.status !== "ACTIVE" || (licence.expiresAt && licence.expiresAt <= now)) return false;
  return licence.evidence.some((evidence) => evidence.status === "VERIFIED" && (!evidence.expiresAt || evidence.expiresAt > now));
}

/**
 * Strictly evaluates the new domain only. It is deliberately not used to alter
 * legacy public presentation or redirects until a governed policy is activated.
 */
export function evaluateCasinoEligibility(casino: CasinoDomain, countryCode: string | null, now = new Date()): CasinoEligibility {
  if (casino.lifecycleStatus === "SUSPENDED" || casino.publicationStatus === "SUSPENDED" || casino.operator.lifecycleStatus === "SUSPENDED" || casino.brand.lifecycleStatus === "SUSPENDED") {
    return { eligible: false, reason: "ENTITY_SUSPENDED" };
  }
  if (casino.publicationStatus !== "PUBLISHED") return { eligible: false, reason: "PUBLICATION_NOT_ELIGIBLE" };
  if (!countryCode) return { eligible: false, reason: "LICENCE_EVIDENCE_MISSING" };
  const availability = casino.availability.find((item) => item.countryCode === countryCode.toUpperCase());
  if (!availability || availability.state !== "AVAILABLE") return { eligible: false, reason: "LICENCE_EVIDENCE_MISSING" };
  if (!casino.licences.length) return { eligible: false, reason: "LICENCE_EVIDENCE_MISSING" };
  if (!casino.licences.some((licence) => currentVerifiedLicence(licence, now))) return { eligible: false, reason: "LICENCE_EVIDENCE_INVALID" };
  return { eligible: true, reason: "ELIGIBLE" };
}

/** Evaluates the commercial sub-entity without changing legacy redirect behaviour. */
export function evaluateAffiliateOfferEligibility(casino: CasinoDomain, offerId: string, countryCode: string | null, now = new Date()): CasinoEligibility {
  const casinoEligibility = evaluateCasinoEligibility(casino, countryCode, now);
  if (!casinoEligibility.eligible) return casinoEligibility;
  const offer = casino.affiliateOffers.find((candidate) => candidate.id === offerId);
  const program = offer && casino.affiliatePrograms.find((candidate) => candidate.id === offer.programId);
  if (!offer || !program || offer.lifecycleStatus === "SUSPENDED" || program.lifecycleStatus === "SUSPENDED") return { eligible: false, reason: "ENTITY_SUSPENDED" };
  if (offer.status !== "ACTIVE" || (offer.startsAt && offer.startsAt > now) || (offer.expiresAt && offer.expiresAt <= now)) return { eligible: false, reason: "PUBLICATION_NOT_ELIGIBLE" };
  return { eligible: true, reason: "ELIGIBLE" };
}
