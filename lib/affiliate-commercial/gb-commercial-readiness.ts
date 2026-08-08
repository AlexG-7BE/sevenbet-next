import type { CandidateOffer } from "@/lib/affiliate-routing/candidate-resolver";
import type { CasinoBonus, CasinoDomain } from "@/lib/casino-domain/types";
import {
  GB_LICENCE_EVIDENCE_MAX_AGE_MS,
  evaluateGbOperatorEligibility,
  unavailableGbOperatorEligibility,
  isOfficialGamblingCommissionSource,
  type GbOperatorEligibilityDecision,
} from "@/lib/jurisdiction/gb-operator-eligibility";
import type { JurisdictionDecision } from "@/lib/jurisdiction/types";

import type { GbCommercialDomainEvidenceRecord } from "./gb-domain-evidence";
import { GB_PARTNER_AGREEMENT_REVIEW_MAX_AGE_MS, assessGbPartnerAgreement } from "./gb-partner-agreement";

export const GB_TIME_LIMITED_BONUS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const GB_EVERGREEN_BONUS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type GbCommercialReadinessReasonCode =
  | "GB_COMMERCIAL_READY"
  | "GB_COMMERCIAL_EVIDENCE_UNAVAILABLE"
  | "GB_JURISDICTION_COMMERCIAL_DENIED"
  | "GB_JURISDICTION_REFERRAL_DENIED"
  | "GB_PROGRAM_CASINO_MISSING"
  | "GB_PROGRAM_CASINO_MISMATCH"
  | "GB_PROGRAM_INACTIVE"
  | "GB_PROGRAM_UNPUBLISHED"
  | "GB_PROGRAM_DISCONNECTED"
  | "GB_PROGRAM_MARKET_MISSING"
  | "GB_PROGRAM_TRUSTED_AUTO_ACTIVATION_FORBIDDEN"
  | "GB_PARTNER_AGREEMENT_MISSING"
  | "GB_PARTNER_AGREEMENT_INVALID"
  | "GB_PARTNER_AGREEMENT_NOT_EFFECTIVE"
  | "GB_PARTNER_AGREEMENT_EXPIRED"
  | "GB_PARTNER_AGREEMENT_STALE"
  | "GB_PARTNER_MARKET_MISSING"
  | "GB_PARTNER_IDENTITY_MISMATCH"
  | "GB_OPERATOR_PROFILE_MISSING"
  | "GB_OPERATOR_IDENTITY_MISMATCH"
  | "GB_BRAND_OPERATOR_MISMATCH"
  | "GB_OFFER_INACTIVE"
  | "GB_OFFER_NOT_EFFECTIVE"
  | "GB_OFFER_CASINO_MISMATCH"
  | "GB_OFFER_MARKET_NOT_EXPLICITLY_ALLOWED"
  | "GB_DOMAIN_EVIDENCE_MISSING"
  | "GB_DOMAIN_EVIDENCE_INVALID"
  | "GB_DOMAIN_INACTIVE"
  | "GB_DOMAIN_WHITE_LABEL_REVIEW_REQUIRED"
  | "GB_DOMAIN_EVIDENCE_STALE"
  | "GB_DOMAIN_RELATIONSHIP_MISMATCH"
  | "GB_LICENCE_RELATIONSHIP_MISMATCH"
  | "GB_OPERATOR_AUTHORITY_DENIED"
  | "GB_TRACKING_LINK_MISSING"
  | "GB_TRACKING_LINK_INACTIVE"
  | "GB_TRACKING_LINK_UNSAFE"
  | "GB_TRACKING_MARKET_NOT_EXPLICITLY_ALLOWED"
  | "GB_TRACKING_EVIDENCE_MISSING"
  | "GB_TRACKING_EVIDENCE_STALE"
  | "GB_TRACKING_LINK_EXPIRED"
  | "GB_BONUS_MISSING"
  | "GB_BONUS_INACTIVE"
  | "GB_BONUS_NOT_EFFECTIVE"
  | "GB_BONUS_TECHNICAL_TERMS_INCOMPLETE"
  | "GB_BONUS_EVIDENCE_STALE"
  | "GB_REDIRECT_CONTRACT_INVALID";

export interface GbCommercialReadinessDecision {
  jurisdictionAuthority: boolean;
  partnerAuthority: boolean;
  operatorAuthority: boolean;
  domainAuthority: boolean;
  programAuthority: boolean;
  offerAuthority: boolean;
  trackingAuthority: boolean;
  bonusAuthority: boolean;
  redirectAuthority: boolean;
  commercialReady: boolean;
  referralReady: boolean;
  reasonCodes: GbCommercialReadinessReasonCode[];
  operatorEligibility: GbOperatorEligibilityDecision;
  checkedAt: string;
  evidenceCheckedAt: string | null;
  revalidateAt: string | null;
}

export interface GbCommercialReadinessInput {
  casino: CasinoDomain;
  offer: CandidateOffer;
  trackingLinkId: string;
  domainEvidence: GbCommercialDomainEvidenceRecord | null;
  jurisdictionDecision: JurisdictionDecision;
  redirectContract: { slugActive: boolean; destinationServerOwned: boolean; destinationSafe: boolean };
  now: Date;
}

function asDate(value?: Date | string | null) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function normalizeDomain(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

function safeHttps(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function explicitGbAllow(mode: CandidateOffer["geoMode"], rules: CandidateOffer["countries"]) {
  return mode === "ALLOW" && rules.some((rule) => rule.mode === "ALLOW" && rule.countryCode.toUpperCase() === "GB");
}

function bonusReasons(bonus: CasinoBonus | null, casinoDomain: string, now: Date) {
  const reasons: GbCommercialReadinessReasonCode[] = [];
  const dates: Date[] = [];
  if (!bonus) return { reasons: ["GB_BONUS_MISSING" as const], dates };
  if (bonus.offerStatus !== "ACTIVE" || bonus.publicationStatus !== "PUBLISHED" || ["SUSPENDED", "ARCHIVED"].includes(bonus.lifecycleStatus)) {
    reasons.push("GB_BONUS_INACTIVE");
  }
  if ((bonus.startsAt && bonus.startsAt > now) || (bonus.expiresAt && bonus.expiresAt <= now)) reasons.push("GB_BONUS_NOT_EFFECTIVE");
  const headlineValuePresent = Boolean((bonus.percentage && bonus.percentage > 0) || (bonus.terms.maximumBonus && bonus.terms.maximumBonus > 0) || (bonus.freeSpins && bonus.freeSpins > 0));
  const termsComplete = Boolean(
    bonus.title.trim()
    && bonus.summary.trim()
    && bonus.eligibility?.trim()
    && bonus.terms.importantConditions.length
    && bonus.terms.termsUrl
    && safeHttps(bonus.terms.termsUrl)
    && normalizeDomain(bonus.terms.termsUrl) === normalizeDomain(casinoDomain)
    && headlineValuePresent
    && (!bonus.freeSpins || bonus.terms.importantConditions.some((condition) => /free spin/i.test(condition)))
    && (!bonus.terms.wageringMultiplier || bonus.terms.wageringText?.trim()),
  );
  if (!termsComplete) reasons.push("GB_BONUS_TECHNICAL_TERMS_INCOMPLETE");
  const maxAge = bonus.expiresAt ? GB_TIME_LIMITED_BONUS_MAX_AGE_MS : GB_EVERGREEN_BONUS_MAX_AGE_MS;
  if (!bonus.lastVerifiedAt || bonus.lastVerifiedAt > now || now.getTime() - bonus.lastVerifiedAt.getTime() >= maxAge) {
    reasons.push("GB_BONUS_EVIDENCE_STALE");
  } else {
    dates.push(bonus.lastVerifiedAt, new Date(bonus.lastVerifiedAt.getTime() + maxAge));
  }
  return { reasons, dates };
}

export function unavailableGbCommercialReadiness(): GbCommercialReadinessDecision {
  return {
    jurisdictionAuthority: false,
    partnerAuthority: false,
    operatorAuthority: false,
    domainAuthority: false,
    programAuthority: false,
    offerAuthority: false,
    trackingAuthority: false,
    bonusAuthority: false,
    redirectAuthority: false,
    commercialReady: false,
    referralReady: false,
    reasonCodes: ["GB_COMMERCIAL_EVIDENCE_UNAVAILABLE"],
    operatorEligibility: unavailableGbOperatorEligibility(),
    checkedAt: new Date().toISOString(),
    evidenceCheckedAt: null,
    revalidateAt: null,
  };
}

export function evaluateGbCommercialReadiness(input: GbCommercialReadinessInput): GbCommercialReadinessDecision {
  const { casino, offer, now } = input;
  const reasons: GbCommercialReadinessReasonCode[] = [];
  const checkedDates: Date[] = [];
  const revalidationDates: Date[] = [];

  if (input.jurisdictionDecision.countryCode !== "GB" || !input.jurisdictionDecision.commercialAllowed) reasons.push("GB_JURISDICTION_COMMERCIAL_DENIED");
  if (input.jurisdictionDecision.countryCode !== "GB" || !input.jurisdictionDecision.referralAllowed) reasons.push("GB_JURISDICTION_REFERRAL_DENIED");

  const program = offer.program;
  if (!program.casinoId) reasons.push("GB_PROGRAM_CASINO_MISSING");
  else if (program.casinoId !== casino.id) reasons.push("GB_PROGRAM_CASINO_MISMATCH");
  if (program.status !== "ACTIVE" || program.archivedAt || ["SUSPENDED", "ARCHIVED"].includes(program.domainLifecycleStatus ?? "") || program.network.active !== true || program.network.archivedAt) reasons.push("GB_PROGRAM_INACTIVE");
  if (program.workflowStatus !== "PUBLISHED") reasons.push("GB_PROGRAM_UNPUBLISHED");
  if (program.integrationMode !== "MANUAL" && (program.connectionStatus !== "CONNECTED" || !program.providerAccountId || !program.credentialReference)) reasons.push("GB_PROGRAM_DISCONNECTED");
  if (!program.supportedCountries?.includes("GB")) reasons.push("GB_PROGRAM_MARKET_MISSING");
  if (program.trustedAutoActivation) reasons.push("GB_PROGRAM_TRUSTED_AUTO_ACTIVATION_FORBIDDEN");

  const structuredOperatorIdentity = casino.operator.legalName || casino.operator.name;
  if (!casino.operator.id || !structuredOperatorIdentity) reasons.push("GB_OPERATOR_PROFILE_MISSING");
  if (!program.operator || normalizeLabel(program.operator) !== normalizeLabel(structuredOperatorIdentity)) reasons.push("GB_OPERATOR_IDENTITY_MISMATCH");
  if (casino.brand.id && casino.brand.operatorId !== casino.operator.id) reasons.push("GB_BRAND_OPERATOR_MISMATCH");

  const agreementAssessment = assessGbPartnerAgreement({ metadata: program.metadata, expectedIdentity: program.operator, now });
  const agreementReasonMap = {
    MISSING: "GB_PARTNER_AGREEMENT_MISSING",
    INVALID: "GB_PARTNER_AGREEMENT_INVALID",
    NOT_EFFECTIVE: "GB_PARTNER_AGREEMENT_NOT_EFFECTIVE",
    EXPIRED: "GB_PARTNER_AGREEMENT_EXPIRED",
    STALE: "GB_PARTNER_AGREEMENT_STALE",
    MARKET_MISSING: "GB_PARTNER_MARKET_MISSING",
    IDENTITY_MISMATCH: "GB_PARTNER_IDENTITY_MISMATCH",
  } as const;
  reasons.push(...agreementAssessment.reasons.map((reason) => agreementReasonMap[reason]));
  if (agreementAssessment.agreement) {
    const agreement = agreementAssessment.agreement;
    if (normalizeLabel(agreement.operatorOrProgrammeIdentity) !== normalizeLabel(structuredOperatorIdentity)) reasons.push("GB_PARTNER_IDENTITY_MISMATCH");
    checkedDates.push(agreement.reviewedAt);
    revalidationDates.push(new Date(agreement.reviewedAt.getTime() + GB_PARTNER_AGREEMENT_REVIEW_MAX_AGE_MS));
    if (agreement.expiresAt) revalidationDates.push(agreement.expiresAt);
  }

  if (offer.status !== "ACTIVE" || offer.archivedAt || ["SUSPENDED", "ARCHIVED"].includes(offer.domainLifecycleStatus ?? "")) reasons.push("GB_OFFER_INACTIVE");
  const offerStart = asDate(offer.startAt);
  const offerEnd = asDate(offer.expiresAt);
  if ((offerStart && offerStart > now) || (offerEnd && offerEnd <= now)) reasons.push("GB_OFFER_NOT_EFFECTIVE");
  if (offer.casinoId !== casino.id || (offer.casinoBonus && offer.casinoBonus.casinoId !== casino.id)) reasons.push("GB_OFFER_CASINO_MISMATCH");
  if (!explicitGbAllow(offer.geoMode, offer.countries)) reasons.push("GB_OFFER_MARKET_NOT_EXPLICITLY_ALLOWED");

  const domainEvidence = input.domainEvidence;
  let validDomainEvidence = false;
  if (!domainEvidence) {
    reasons.push("GB_DOMAIN_EVIDENCE_MISSING");
  } else {
    const observedAt = asDate(domainEvidence.observedAt);
    const revalidateAt = asDate(domainEvidence.revalidateAt);
    const currentLicence = casino.licences.find((licence) => licence.id === domainEvidence.licenceId && licence.status === "ACTIVE" && (!licence.expiresAt || licence.expiresAt > now));
    if (domainEvidence.authorityVersion !== "gb-domain-evidence.v1" || !isOfficialGamblingCommissionSource(domainEvidence.officialSourceUrl)
      || normalizeDomain(domainEvidence.domain) !== normalizeDomain(casino.domain) || !observedAt || !revalidateAt) {
      reasons.push("GB_DOMAIN_EVIDENCE_INVALID");
    } else if (domainEvidence.domainStatus === "INACTIVE") {
      reasons.push("GB_DOMAIN_INACTIVE");
    } else if (domainEvidence.domainStatus === "WHITE_LABEL" || domainEvidence.relationshipType === "WHITE_LABEL") {
      reasons.push("GB_DOMAIN_WHITE_LABEL_REVIEW_REQUIRED");
    } else if (observedAt > now || now.getTime() - observedAt.getTime() >= GB_LICENCE_EVIDENCE_MAX_AGE_MS || revalidateAt <= now) {
      reasons.push("GB_DOMAIN_EVIDENCE_STALE");
    } else {
      if (domainEvidence.casinoId !== casino.id || domainEvidence.operatorId !== casino.operator.id || domainEvidence.brandId !== casino.brand.id) {
        reasons.push("GB_DOMAIN_RELATIONSHIP_MISMATCH");
      }
      if (!currentLicence || normalizeLabel(currentLicence.number) !== normalizeLabel(domainEvidence.licenceAccountReference)) {
        reasons.push("GB_LICENCE_RELATIONSHIP_MISMATCH");
      }
      validDomainEvidence = !reasons.includes("GB_DOMAIN_RELATIONSHIP_MISMATCH") && !reasons.includes("GB_LICENCE_RELATIONSHIP_MISMATCH");
      checkedDates.push(observedAt);
      revalidationDates.push(revalidateAt, new Date(observedAt.getTime() + GB_LICENCE_EVIDENCE_MAX_AGE_MS));
    }
  }

  const link = offer.trackingLinks.find((candidate) => candidate.id === input.trackingLinkId);
  if (!link) {
    reasons.push("GB_TRACKING_LINK_MISSING");
  } else {
    if (!link.active || link.archivedAt) reasons.push("GB_TRACKING_LINK_INACTIVE");
    if (!safeHttps(link.destinationUrl) || !safeHttps(link.trackingUrl)) reasons.push("GB_TRACKING_LINK_UNSAFE");
    if (!explicitGbAllow(link.geoMode, link.countries)) reasons.push("GB_TRACKING_MARKET_NOT_EXPLICITLY_ALLOWED");
    const verifiedAt = asDate(link.verifiedAt);
    const lastCheckedAt = asDate(link.lastCheckedAt);
    if (!verifiedAt || !lastCheckedAt) {
      reasons.push("GB_TRACKING_EVIDENCE_MISSING");
    } else if (verifiedAt > now || lastCheckedAt > now || now.getTime() - verifiedAt.getTime() >= GB_LICENCE_EVIDENCE_MAX_AGE_MS || now.getTime() - lastCheckedAt.getTime() >= GB_LICENCE_EVIDENCE_MAX_AGE_MS) {
      reasons.push("GB_TRACKING_EVIDENCE_STALE");
    } else {
      checkedDates.push(verifiedAt, lastCheckedAt);
      revalidationDates.push(new Date(verifiedAt.getTime() + GB_LICENCE_EVIDENCE_MAX_AGE_MS), new Date(lastCheckedAt.getTime() + GB_LICENCE_EVIDENCE_MAX_AGE_MS));
    }
    const linkStart = asDate(link.validFrom);
    const linkEnd = asDate(link.expiresAt);
    if ((linkStart && linkStart > now) || (linkEnd && linkEnd <= now)) reasons.push("GB_TRACKING_LINK_EXPIRED");
    if (linkEnd) revalidationDates.push(linkEnd);
  }

  if (offer.casinoBonusId) {
    const bonus = bonusReasons(casino.bonuses.find((candidate) => candidate.id === offer.casinoBonusId) ?? null, casino.domain, now);
    reasons.push(...bonus.reasons);
    if (bonus.dates[0]) checkedDates.push(bonus.dates[0]);
    if (bonus.dates[1]) revalidationDates.push(bonus.dates[1]);
  }

  if (!Object.values(input.redirectContract).every(Boolean)) reasons.push("GB_REDIRECT_CONTRACT_INVALID");

  const commercialContract = {
    programActive: program.status === "ACTIVE" && !program.archivedAt && !["SUSPENDED", "ARCHIVED"].includes(program.domainLifecycleStatus ?? "") && program.network.active === true && !program.network.archivedAt,
    programPublished: program.workflowStatus === "PUBLISHED",
    programConnected: program.integrationMode === "MANUAL" || (program.connectionStatus === "CONNECTED" && Boolean(program.providerAccountId) && Boolean(program.credentialReference)),
    programSupportsGb: program.supportedCountries?.includes("GB") === true,
    offerActive: offer.status === "ACTIVE" && !offer.archivedAt && !["SUSPENDED", "ARCHIVED"].includes(offer.domainLifecycleStatus ?? ""),
    trackingLinkActive: link?.active === true && !link.archivedAt,
  };
  const operatorEligibility = evaluateGbOperatorEligibility({
    casino,
    now,
    domainEvidence: validDomainEvidence && domainEvidence ? {
      domain: domainEvidence.domain,
      sourceUrl: domainEvidence.officialSourceUrl,
      status: "VERIFIED",
      observedAt: asDate(domainEvidence.observedAt),
      expiresAt: asDate(domainEvidence.revalidateAt),
    } : null,
    commercialContract,
    redirectContract: input.redirectContract,
  });
  if (!operatorEligibility.referralEligible) reasons.push("GB_OPERATOR_AUTHORITY_DENIED");

  if (operatorEligibility.evidenceCheckedAt) checkedDates.push(new Date(operatorEligibility.evidenceCheckedAt));
  if (operatorEligibility.revalidateAt) revalidationDates.push(new Date(operatorEligibility.revalidateAt));
  if (input.jurisdictionDecision.revalidateAt) revalidationDates.push(new Date(input.jurisdictionDecision.revalidateAt));

  const reasonCodes = unique(reasons);
  const jurisdictionAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_JURISDICTION_"));
  const partnerAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_PARTNER_"));
  const operatorAuthority = operatorEligibility.operatorEvidenceEligible && !reasonCodes.some((reason) => reason.startsWith("GB_OPERATOR_") || reason.startsWith("GB_BRAND_"));
  const domainAuthority = validDomainEvidence && !reasonCodes.some((reason) => reason.startsWith("GB_DOMAIN_") || reason === "GB_LICENCE_RELATIONSHIP_MISMATCH");
  const programAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_PROGRAM_"));
  const offerAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_OFFER_"));
  const trackingAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_TRACKING_"));
  const bonusAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_BONUS_"));
  const redirectAuthority = !reasonCodes.some((reason) => reason.startsWith("GB_REDIRECT_"));
  const ready = jurisdictionAuthority && partnerAuthority && operatorAuthority && domainAuthority && programAuthority && offerAuthority && trackingAuthority && bonusAuthority && redirectAuthority;
  return {
    jurisdictionAuthority,
    partnerAuthority,
    operatorAuthority,
    domainAuthority,
    programAuthority,
    offerAuthority,
    trackingAuthority,
    bonusAuthority,
    redirectAuthority,
    commercialReady: ready,
    referralReady: ready,
    reasonCodes: ready ? ["GB_COMMERCIAL_READY"] : reasonCodes,
    operatorEligibility,
    checkedAt: now.toISOString(),
    evidenceCheckedAt: checkedDates.sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() ?? null,
    revalidateAt: revalidationDates.filter((date) => !Number.isNaN(date.getTime())).sort((left, right) => left.getTime() - right.getTime())[0]?.toISOString() ?? null,
  };
}
