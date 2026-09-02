import { z } from "zod";

export const COMMERCIAL_ACTIVATION_BUNDLE_VERSION = "commercial-activation-bundle.v1" as const;

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const countryCode = z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase());
const currencyCode = z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase());
const languageCode = z.string().trim().min(2).max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const boundedText = z.string().trim().min(1).max(1_000);
const optionalText = z.string().trim().min(1).max(1_000).nullable().optional();
const isoDate = z.string().datetime({ offset: true });
const optionalIsoDate = isoDate.nullable().optional();
const httpsUrl = z.string().trim().url().max(2_048).superRefine((value, context) => {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    context.addIssue({ code: "custom", message: "URL must be credential-free HTTPS" });
  }
});

const commercialEvidenceSchema = z.object({
  decision: z.literal("APPROVED_FOR_PRODUCTION"),
  currentMarketStatus: boundedText,
  sourceType: z.enum(["AFFILIATE_DASHBOARD", "PARTNER_CONFIRMATION", "EXTERNAL_DOCUMENT_REFERENCE"]),
  sourceReference: boundedText,
  sourceUrl: httpsUrl.nullable().optional(),
  observedAt: isoDate,
  verifiedAt: isoDate,
  expiresAt: isoDate,
  reviewedBy: boundedText,
  notes: optionalText,
  requirements: z.object({
    existingCommercialAuthority: z.boolean(),
    operatorMarketLicenceEvidence: z.boolean(),
    exactOperatorDomainEvidence: z.boolean(),
    requestedAdvertisingWithinOperatorAuthority: z.boolean(),
    promotionalCopyReviewCleared: z.boolean(),
    hgcAffiliateSuitabilityEvidence: z.boolean(),
    partnerApproved: z.boolean(),
    offerActive: z.boolean(),
    trackingReady: z.boolean(),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (new Date(value.observedAt) > new Date(value.verifiedAt)) {
    context.addIssue({ code: "custom", path: ["observedAt"], message: "Observation cannot be later than verification" });
  }
  if (new Date(value.expiresAt) <= new Date(value.verifiedAt)) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "Evidence expiry must be later than verification" });
  }
});

const gbPartnerAuthoritySchema = z.object({
  authorityVersion: z.literal("gb-partner-authority.v1"),
  relationshipType: z.enum(["DIRECT_OPERATOR", "AFFILIATE_NETWORK"]),
  partnerLegalName: boundedText,
  operatorOrProgrammeIdentity: boundedText,
  agreementReference: boundedText,
  agreementStatus: z.literal("ACTIVE"),
  effectiveAt: isoDate,
  expiresAt: optionalIsoDate,
  approvedMarkets: z.array(countryCode).min(1).max(30),
  approvedChannels: z.array(z.enum(["EDITORIAL_CONTENT", "CASINO_REVIEW", "BONUS_PAGE", "DIRECT_LINK"])).min(1).max(4),
  commercialModel: z.enum(["CPA", "REV_SHARE", "HYBRID", "OTHER"]),
  sourceType: z.enum(["EXTERNAL_DOCUMENT_REFERENCE", "AFFILIATE_DASHBOARD", "PARTNER_CONFIRMATION"]),
  sourceReference: boundedText,
  reviewedAt: isoDate,
  reviewedBy: boundedText,
  complianceContactReference: optionalText,
}).strict();

const routeHealthSchema = z.object({
  expectedFinalHost: z.string().trim().min(1).max(253).toLowerCase(),
  expectedPathPrefix: z.string().trim().min(1).max(500).startsWith("/").nullable().optional(),
  requiredAttributionParameters: z.array(z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_.-]+$/)).max(30).default([]),
}).strict();

const activationRecordSchema = z.object({
  casino: z.object({ slug, expectedName: boundedText.nullable().optional() }).strict(),
  market: z.object({
    countryCode,
    currencyCode,
    languageCode,
  }).strict(),
  network: z.object({
    slug,
    name: boundedText,
    type: z.enum(["EVERFLOW", "INCOME_ACCESS", "MYAFFILIATES", "NETREFER", "DIRECT", "OTHER"]).default("OTHER"),
    websiteUrl: httpsUrl.nullable().optional(),
  }).strict(),
  program: z.object({
    externalProgramId: boundedText,
    name: boundedText,
    operator: boundedText,
    accountReference: boundedText,
    defaultCurrency: currencyCode.nullable().optional(),
    gbPartnerAuthority: gbPartnerAuthoritySchema.nullable().optional(),
  }).strict(),
  offer: z.object({
    externalOfferId: boundedText,
    externalName: boundedText,
    internalName: boundedText,
    publicLabel: boundedText,
    offerType: boundedText,
    payoutModel: z.enum(["CPA", "CPL", "REV_SHARE", "HYBRID", "FLAT"]),
    payoutAmount: z.number().nonnegative().finite().nullable().optional(),
    payoutCurrency: currencyCode.nullable().optional(),
    revenueSharePercentage: z.number().min(0).max(100).finite().nullable().optional(),
    hybridTerms: optionalText,
    landingPageUrl: httpsUrl,
    languages: z.array(languageCode).min(1).max(30),
    devices: z.array(boundedText).max(30).default([]),
    validFrom: optionalIsoDate,
    expiresAt: optionalIsoDate,
    priority: z.number().int().min(-10_000).max(10_000).default(0),
  }).strict(),
  trackingLink: z.object({
    externalLinkId: boundedText,
    label: boundedText,
    destinationUrl: httpsUrl,
    trackingUrl: httpsUrl,
    landingPage: optionalText,
    campaign: optionalText,
    campaignId: optionalText,
    linkingCode: optionalText,
    subIdTemplate: optionalText,
    validFrom: optionalIsoDate,
    expiresAt: optionalIsoDate,
    priority: z.number().int().min(-10_000).max(10_000).default(0),
  }).strict(),
  redirect: z.object({
    slug,
  }).strict(),
  routeHealth: routeHealthSchema,
  commercialEvidence: commercialEvidenceSchema,
}).strict().superRefine((value, context) => {
  const { payoutModel, payoutAmount, payoutCurrency, revenueSharePercentage, hybridTerms } = value.offer;
  if (["CPA", "CPL", "FLAT"].includes(payoutModel) && (payoutAmount == null || !payoutCurrency)) {
    context.addIssue({ code: "custom", path: ["offer", "payoutAmount"], message: `${payoutModel} requires payoutAmount and payoutCurrency` });
  }
  if (payoutModel === "REV_SHARE" && revenueSharePercentage == null) {
    context.addIssue({ code: "custom", path: ["offer", "revenueSharePercentage"], message: "REV_SHARE requires revenueSharePercentage" });
  }
  if (payoutModel === "HYBRID" && !hybridTerms) {
    context.addIssue({ code: "custom", path: ["offer", "hybridTerms"], message: "HYBRID requires explicit hybridTerms" });
  }
  if (value.offer.validFrom && value.offer.expiresAt && new Date(value.offer.expiresAt) <= new Date(value.offer.validFrom)) {
    context.addIssue({ code: "custom", path: ["offer", "expiresAt"], message: "Offer expiry must be later than its start" });
  }
  if (value.trackingLink.validFrom && value.trackingLink.expiresAt && new Date(value.trackingLink.expiresAt) <= new Date(value.trackingLink.validFrom)) {
    context.addIssue({ code: "custom", path: ["trackingLink", "expiresAt"], message: "Tracking-link expiry must be later than its start" });
  }
  if (value.market.countryCode === "GB") {
    const authority = value.program.gbPartnerAuthority;
    if (!authority) context.addIssue({ code: "custom", path: ["program", "gbPartnerAuthority"], message: "GB activation requires typed partner authority" });
    if (authority && (!authority.approvedMarkets.includes("GB") || !authority.approvedChannels.includes("DIRECT_LINK"))) {
      context.addIssue({ code: "custom", path: ["program", "gbPartnerAuthority"], message: "GB authority must approve GB and DIRECT_LINK" });
    }
  } else if (value.program.gbPartnerAuthority) {
    context.addIssue({ code: "custom", path: ["program", "gbPartnerAuthority"], message: "GB partner authority is only valid for GB records" });
  }
});

export const commercialActivationBundleSchema = z.object({
  schemaVersion: z.literal(COMMERCIAL_ACTIVATION_BUNDLE_VERSION),
  bundleId: slug,
  generatedAt: isoDate,
  source: z.object({
    system: z.literal("PARTNER_PORTAL"),
    exportReference: boundedText,
  }).strict(),
  records: z.array(activationRecordSchema).min(1).max(500),
}).strict().superRefine((value, context) => {
  const routeKeys = new Set<string>();
  const redirectSlugs = new Set<string>();
  for (const [index, record] of value.records.entries()) {
    const routeKey = [record.network.slug, record.program.externalProgramId, record.offer.externalOfferId, record.trackingLink.externalLinkId, record.market.countryCode].join("|");
    if (routeKeys.has(routeKey)) context.addIssue({ code: "custom", path: ["records", index], message: "Duplicate exact Casino × GEO route" });
    routeKeys.add(routeKey);
    if (redirectSlugs.has(record.redirect.slug)) context.addIssue({ code: "custom", path: ["records", index, "redirect", "slug"], message: "Redirect slugs must be unique within a bundle" });
    redirectSlugs.add(record.redirect.slug);
  }
});

export type CommercialActivationBundle = z.infer<typeof commercialActivationBundleSchema>;
export type CommercialActivationRecord = CommercialActivationBundle["records"][number];

export function parseCommercialActivationBundle(value: unknown) {
  return commercialActivationBundleSchema.parse(value);
}
