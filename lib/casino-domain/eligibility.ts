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
  if (casino.lifecycleStatus === "SUSPENDED" || casino.publicationStatus === "SUSPENDED" || casino.affiliatePrograms.some((program) => program.suspended)) {
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
