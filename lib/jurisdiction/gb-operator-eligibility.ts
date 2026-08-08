import type { CasinoDomain, CasinoLicence, CasinoLicenceEvidence } from "@/lib/casino-domain/types";

export const GB_LICENCE_EVIDENCE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type GbOperatorEligibilityReasonCode =
  | "GB_OPERATOR_ELIGIBLE"
  | "EVIDENCE_SOURCE_UNAVAILABLE"
  | "ENTITY_SUSPENDED"
  | "PUBLICATION_NOT_ELIGIBLE"
  | "GB_COUNTRY_MISSING"
  | "GB_COUNTRY_UNAVAILABLE"
  | "GB_LICENCE_MISSING"
  | "GB_LICENCE_INACTIVE"
  | "GB_LICENCE_EVIDENCE_MISSING"
  | "GB_LICENCE_EVIDENCE_UNVERIFIED"
  | "GB_LICENCE_EVIDENCE_SOURCE_INVALID"
  | "GB_LICENCE_EVIDENCE_STALE"
  | "GB_LICENCE_EVIDENCE_EXPIRED"
  | "GB_DOMAIN_EVIDENCE_MISSING"
  | "GB_DOMAIN_EVIDENCE_INVALID"
  | "GB_COMMERCIAL_CONTRACT_MISSING"
  | "GB_COMMERCIAL_CONTRACT_INVALID"
  | "GB_REDIRECT_CONTRACT_MISSING"
  | "GB_REDIRECT_CONTRACT_INVALID";

export interface GbDomainEvidence {
  domain: string;
  sourceUrl: string;
  status: "VERIFIED" | "UNVERIFIED" | "EXPIRED" | "REJECTED" | "UNKNOWN";
  observedAt: Date | null;
  expiresAt: Date | null;
}

export interface GbCommercialContractEvidence {
  programActive: boolean;
  programPublished: boolean;
  programConnected: boolean;
  programSupportsGb: boolean;
  offerActive: boolean;
  trackingLinkActive: boolean;
}

export interface GbRedirectContractEvidence {
  slugActive: boolean;
  destinationServerOwned: boolean;
  destinationSafe: boolean;
}

export interface GbOperatorEligibilityDecision {
  editorialEligible: boolean;
  operatorEvidenceEligible: boolean;
  commercialEligible: boolean;
  referralEligible: boolean;
  reasonCodes: GbOperatorEligibilityReasonCode[];
  evidenceCheckedAt: string | null;
  revalidateAt: string | null;
}

export interface GbOperatorEligibilityInput {
  casino: CasinoDomain;
  now: Date;
  domainEvidence?: GbDomainEvidence | null;
  commercialContract?: GbCommercialContractEvidence | null;
  redirectContract?: GbRedirectContractEvidence | null;
}

function normalizeLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function normalizeDomain(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

export function isAcceptedGbGamblingAuthority(value: string) {
  return new Set(["gambling commission", "uk gambling commission"]).has(normalizeLabel(value));
}

export function isOfficialGamblingCommissionSource(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && (host === "gamblingcommission.gov.uk" || host.endsWith(".gamblingcommission.gov.uk"));
  } catch {
    return false;
  }
}

function isGbJurisdiction(value: string | null) {
  return new Set(["gb", "great britain"]).has(normalizeLabel(value));
}

function evidenceRevalidateAt(evidence: { observedAt: Date | null; expiresAt: Date | null }) {
  if (!evidence.observedAt) return null;
  const freshnessEnd = new Date(evidence.observedAt.getTime() + GB_LICENCE_EVIDENCE_MAX_AGE_MS);
  return evidence.expiresAt && evidence.expiresAt < freshnessEnd ? evidence.expiresAt : freshnessEnd;
}

function evidenceFailure(evidence: CasinoLicenceEvidence, now: Date): GbOperatorEligibilityReasonCode | null {
  if (evidence.status !== "VERIFIED") return "GB_LICENCE_EVIDENCE_UNVERIFIED";
  if (!isOfficialGamblingCommissionSource(evidence.sourceUrl)) return "GB_LICENCE_EVIDENCE_SOURCE_INVALID";
  if (!evidence.observedAt || evidence.observedAt > now || now.getTime() - evidence.observedAt.getTime() >= GB_LICENCE_EVIDENCE_MAX_AGE_MS) {
    return "GB_LICENCE_EVIDENCE_STALE";
  }
  if (evidence.expiresAt && evidence.expiresAt <= now) return "GB_LICENCE_EVIDENCE_EXPIRED";
  return null;
}

function activeLicence(licence: CasinoLicence, now: Date) {
  return licence.status === "ACTIVE" && (!licence.expiresAt || licence.expiresAt > now);
}

function uniqueReasons(reasons: GbOperatorEligibilityReasonCode[]) {
  return [...new Set(reasons)];
}

export function unavailableGbOperatorEligibility(reason: GbOperatorEligibilityReasonCode = "EVIDENCE_SOURCE_UNAVAILABLE"): GbOperatorEligibilityDecision {
  return {
    editorialEligible: false,
    operatorEvidenceEligible: false,
    commercialEligible: false,
    referralEligible: false,
    reasonCodes: [reason],
    evidenceCheckedAt: null,
    revalidateAt: null,
  };
}

export function evaluateGbOperatorEligibility(input: GbOperatorEligibilityInput): GbOperatorEligibilityDecision {
  const { casino, now } = input;
  const reasons: GbOperatorEligibilityReasonCode[] = [];
  const entitySuspended = [casino.lifecycleStatus, casino.operator.lifecycleStatus, casino.brand.lifecycleStatus, casino.publicationStatus].includes("SUSPENDED");
  if (entitySuspended) reasons.push("ENTITY_SUSPENDED");
  if (casino.publicationStatus !== "PUBLISHED") reasons.push("PUBLICATION_NOT_ELIGIBLE");
  const editorialEligible = !entitySuspended && casino.publicationStatus === "PUBLISHED";

  const availability = casino.availability.find((item) => item.countryCode.toUpperCase() === "GB");
  if (!availability) reasons.push("GB_COUNTRY_MISSING");
  else if (availability.state !== "AVAILABLE") reasons.push("GB_COUNTRY_UNAVAILABLE");

  const applicableLicences = casino.licences.filter((licence) => isAcceptedGbGamblingAuthority(licence.authority) && isGbJurisdiction(licence.jurisdiction));
  if (!applicableLicences.length) reasons.push("GB_LICENCE_MISSING");
  const currentLicences = applicableLicences.filter((licence) => activeLicence(licence, now));
  if (applicableLicences.length && !currentLicences.length) reasons.push("GB_LICENCE_INACTIVE");

  const evidenceCandidates = currentLicences.flatMap((licence) => licence.evidence);
  if (currentLicences.length && !evidenceCandidates.length) reasons.push("GB_LICENCE_EVIDENCE_MISSING");
  const assessedEvidence = evidenceCandidates.map((evidence) => ({ evidence, failure: evidenceFailure(evidence, now) }));
  const validEvidence = assessedEvidence
    .filter((item) => !item.failure)
    .map((item) => item.evidence)
    .sort((left, right) => (right.observedAt?.getTime() ?? 0) - (left.observedAt?.getTime() ?? 0));
  if (evidenceCandidates.length && !validEvidence.length) {
    reasons.push(...assessedEvidence.flatMap((item) => item.failure ? [item.failure] : []));
  }

  const domainEvidence = input.domainEvidence;
  let domainValid = false;
  if (!domainEvidence) reasons.push("GB_DOMAIN_EVIDENCE_MISSING");
  else {
    domainValid = domainEvidence.status === "VERIFIED"
      && normalizeDomain(domainEvidence.domain) === normalizeDomain(casino.domain)
      && isOfficialGamblingCommissionSource(domainEvidence.sourceUrl)
      && Boolean(domainEvidence.observedAt)
      && domainEvidence.observedAt! <= now
      && now.getTime() - domainEvidence.observedAt!.getTime() < GB_LICENCE_EVIDENCE_MAX_AGE_MS
      && !(domainEvidence.expiresAt && domainEvidence.expiresAt <= now);
    if (!domainValid) reasons.push("GB_DOMAIN_EVIDENCE_INVALID");
  }

  const evidenceCheckedAt = [validEvidence[0]?.observedAt ?? null, domainValid ? domainEvidence?.observedAt ?? null : null]
    .filter((value): value is Date => Boolean(value))
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const revalidateAt = [validEvidence[0] ? evidenceRevalidateAt(validEvidence[0]) : null, domainValid && domainEvidence ? evidenceRevalidateAt(domainEvidence) : null]
    .filter((value): value is Date => Boolean(value))
    .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

  const operatorEvidenceEligible = editorialEligible
    && availability?.state === "AVAILABLE"
    && currentLicences.length > 0
    && validEvidence.length > 0
    && domainValid;

  const commercial = input.commercialContract;
  if (!commercial) reasons.push("GB_COMMERCIAL_CONTRACT_MISSING");
  else if (!Object.values(commercial).every(Boolean)) reasons.push("GB_COMMERCIAL_CONTRACT_INVALID");
  const commercialEligible = operatorEvidenceEligible && Boolean(commercial && Object.values(commercial).every(Boolean));

  const redirect = input.redirectContract;
  if (!redirect) reasons.push("GB_REDIRECT_CONTRACT_MISSING");
  else if (!Object.values(redirect).every(Boolean)) reasons.push("GB_REDIRECT_CONTRACT_INVALID");
  const referralEligible = commercialEligible && Boolean(redirect && Object.values(redirect).every(Boolean));

  if (referralEligible) reasons.push("GB_OPERATOR_ELIGIBLE");
  return {
    editorialEligible,
    operatorEvidenceEligible,
    commercialEligible,
    referralEligible,
    reasonCodes: uniqueReasons(reasons),
    evidenceCheckedAt: evidenceCheckedAt?.toISOString() ?? null,
    revalidateAt: revalidateAt?.toISOString() ?? null,
  };
}
