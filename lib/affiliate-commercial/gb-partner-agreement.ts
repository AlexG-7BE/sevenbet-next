export const GB_PARTNER_AGREEMENT_REVIEW_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export type GbPartnerRelationshipType = "DIRECT_OPERATOR" | "AFFILIATE_NETWORK";
export type GbPartnerCommercialModel = "CPA" | "REV_SHARE" | "HYBRID" | "OTHER";
export type GbPartnerApprovedChannel = "EDITORIAL_CONTENT" | "CASINO_REVIEW" | "BONUS_PAGE" | "DIRECT_LINK";
export type GbPartnerAgreementSourceType = "EXTERNAL_DOCUMENT_REFERENCE" | "AFFILIATE_DASHBOARD" | "PARTNER_CONFIRMATION";

export interface GbPartnerAgreement {
  authorityVersion: "gb-partner-authority.v1";
  relationshipType: GbPartnerRelationshipType;
  partnerLegalName: string;
  operatorOrProgrammeIdentity: string;
  agreementReference: string;
  agreementStatus: "ACTIVE";
  effectiveAt: Date;
  expiresAt: Date | null;
  approvedMarkets: string[];
  approvedChannels: GbPartnerApprovedChannel[];
  commercialModel: GbPartnerCommercialModel;
  sourceType: GbPartnerAgreementSourceType;
  sourceReference: string;
  reviewedAt: Date;
  reviewedBy: string;
  complianceContactReference: string | null;
}

export type GbPartnerAgreementReadResult =
  | { ok: true; agreement: GbPartnerAgreement }
  | { ok: false; reason: "MISSING" | "INVALID" };

export type GbPartnerAgreementAssessmentReason = "MISSING" | "INVALID" | "NOT_EFFECTIVE" | "EXPIRED" | "STALE" | "MARKET_MISSING" | "CHANNEL_NOT_APPROVED" | "IDENTITY_MISMATCH";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function requiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalString(value: unknown) {
  return value === undefined || value === null || value === "" ? null : requiredString(value);
}

function date(value: unknown) {
  const text = requiredString(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function stringEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : null;
}

function enumList<T extends string>(value: unknown, allowed: readonly T[]): T[] | null {
  if (!Array.isArray(value) || !value.length) return null;
  const values = [...new Set(value)];
  return values.every((entry) => typeof entry === "string" && allowed.includes(entry as T)) ? values as T[] : null;
}

export function readGbPartnerAgreement(metadata: unknown): GbPartnerAgreementReadResult {
  const container = record(metadata);
  if (!container || !("gbCommercialAuthority" in container)) return { ok: false, reason: "MISSING" };
  const value = record(container.gbCommercialAuthority);
  if (!value) return { ok: false, reason: "INVALID" };

  const authorityVersion = stringEnum(value.authorityVersion, ["gb-partner-authority.v1"] as const);
  const relationshipType = stringEnum(value.relationshipType, ["DIRECT_OPERATOR", "AFFILIATE_NETWORK"] as const);
  const partnerLegalName = requiredString(value.partnerLegalName);
  const operatorOrProgrammeIdentity = requiredString(value.operatorOrProgrammeIdentity);
  const agreementReference = requiredString(value.agreementReference);
  const agreementStatus = stringEnum(value.agreementStatus, ["ACTIVE"] as const);
  const effectiveAt = date(value.effectiveAt);
  const expiresAt = value.expiresAt === undefined || value.expiresAt === null || value.expiresAt === "" ? null : date(value.expiresAt);
  const approvedMarkets = Array.isArray(value.approvedMarkets)
    ? [...new Set(value.approvedMarkets.map((entry) => typeof entry === "string" ? entry.trim().toUpperCase() : ""))].filter(Boolean)
    : null;
  const approvedChannels = enumList(value.approvedChannels, ["EDITORIAL_CONTENT", "CASINO_REVIEW", "BONUS_PAGE", "DIRECT_LINK"] as const);
  const commercialModel = stringEnum(value.commercialModel, ["CPA", "REV_SHARE", "HYBRID", "OTHER"] as const);
  const sourceType = stringEnum(value.sourceType, ["EXTERNAL_DOCUMENT_REFERENCE", "AFFILIATE_DASHBOARD", "PARTNER_CONFIRMATION"] as const);
  const sourceReference = requiredString(value.sourceReference);
  const reviewedAt = date(value.reviewedAt);
  const reviewedBy = requiredString(value.reviewedBy);
  const complianceContactReference = optionalString(value.complianceContactReference);

  if (!authorityVersion || !relationshipType || !partnerLegalName || !operatorOrProgrammeIdentity || !agreementReference
    || !agreementStatus || !effectiveAt || !approvedMarkets?.length || !approvedChannels || !commercialModel
    || !sourceType || !sourceReference || !reviewedAt || (value.expiresAt && !expiresAt) || !reviewedBy
    || (value.complianceContactReference && !complianceContactReference)) {
    return { ok: false, reason: "INVALID" };
  }

  return {
    ok: true,
    agreement: {
      authorityVersion,
      relationshipType,
      partnerLegalName,
      operatorOrProgrammeIdentity,
      agreementReference,
      agreementStatus,
      effectiveAt,
      expiresAt,
      approvedMarkets,
      approvedChannels,
      commercialModel,
      sourceType,
      sourceReference,
      reviewedAt,
      reviewedBy,
      complianceContactReference,
    },
  };
}

function normalizeLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

export function assessGbPartnerAgreement(input: {
  metadata: unknown;
  expectedIdentity: string | null | undefined;
  now: Date;
  requiredChannels?: readonly GbPartnerApprovedChannel[];
}) {
  const result = readGbPartnerAgreement(input.metadata);
  if (!result.ok) return { agreement: null, reasons: [result.reason] as GbPartnerAgreementAssessmentReason[] };
  const { agreement } = result;
  const reasons: GbPartnerAgreementAssessmentReason[] = [];
  if (agreement.effectiveAt > input.now) reasons.push("NOT_EFFECTIVE");
  if (agreement.expiresAt && agreement.expiresAt <= input.now) reasons.push("EXPIRED");
  if (agreement.reviewedAt > input.now || input.now.getTime() - agreement.reviewedAt.getTime() >= GB_PARTNER_AGREEMENT_REVIEW_MAX_AGE_MS) reasons.push("STALE");
  if (!agreement.approvedMarkets.includes("GB")) reasons.push("MARKET_MISSING");
  if (input.requiredChannels?.some((channel) => !agreement.approvedChannels.includes(channel))) reasons.push("CHANNEL_NOT_APPROVED");
  if (!input.expectedIdentity || normalizeLabel(agreement.operatorOrProgrammeIdentity) !== normalizeLabel(input.expectedIdentity)) reasons.push("IDENTITY_MISMATCH");
  return { agreement, reasons };
}
