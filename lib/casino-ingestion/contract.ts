import { z } from "zod";

const httpsUrl = z.string().trim().url().refine((value) => new URL(value).protocol === "https:", "URL must use HTTPS");
const nullableUrl = httpsUrl.nullable();
const nullableText = z.string().trim().min(1).nullable();
const nullableBoolean = z.boolean().nullable();
const timestamp = z.iso.datetime({ offset: true });
const sourceType = z.enum([
  "OFFICIAL_CASINO",
  "OFFICIAL_OPERATOR",
  "REGULATOR",
  "AFFILIATE_PORTAL",
  "OFFICIAL_TERMS",
  "PARTNER_COMMUNICATION",
  "INTERNAL_RECORD",
  "OTHER",
]);
const classification = z.enum(["DETECTED", "INFERRED", "PROPOSED", "UNKNOWN", "CONTRADICTION"]);
const fieldKey = z.string().trim().min(1).max(160).regex(/^[a-z][A-Za-z0-9_.:-]*$/);
const stableKey = z.string().trim().min(1).max(160).regex(/^[a-z0-9][a-z0-9._:-]*$/);

const sourceFileSchema = z.object({
  path: z.string().trim().min(1).max(500).refine((value) => !value.startsWith("/") && !value.split("/").includes(".."), "Source path must be repository-relative"),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

const evidenceSchema = z.object({
  key: stableKey,
  classification,
  sourceType,
  rawSourceType: nullableText.default(null),
  sourceUrl: nullableUrl,
  sourceReference: z.string().trim().min(1).max(1_000),
  fieldKeys: z.array(fieldKey).min(1).max(100),
  observedAt: timestamp.nullable(),
  lastVerifiedAt: timestamp.nullable(),
  notes: nullableText,
}).strict();

const licenseEvidenceSchema = z.object({
  key: stableKey,
  sourceUrl: nullableUrl,
  sourceReference: z.string().trim().min(1).max(1_000),
  status: z.enum(["VERIFIED", "UNVERIFIED", "EXPIRED", "REJECTED", "UNKNOWN"]),
  observedAt: timestamp.nullable(),
  expiresAt: timestamp.nullable(),
  reviewedAt: timestamp.nullable(),
  notes: nullableText,
}).strict();

const licenseSchema = z.object({
  key: stableKey,
  authority: z.string().trim().min(1).max(200),
  licenseNumber: nullableText,
  jurisdiction: nullableText,
  status: z.string().trim().min(1).max(80),
  canonicalStatus: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED", "UNKNOWN"]),
  verificationUrl: nullableUrl,
  issuedAt: timestamp.nullable(),
  expiresAt: timestamp.nullable(),
  lastVerifiedAt: timestamp.nullable(),
  notes: nullableText,
  evidence: z.array(licenseEvidenceSchema).min(1),
}).strict();

const paymentSchema = z.object({
  key: stableKey,
  name: z.string().trim().min(1).max(200),
  supportsDeposits: nullableBoolean,
  supportsWithdrawals: nullableBoolean,
  currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).max(20),
  minimumDeposit: z.number().nonnegative().nullable(),
  minimumWithdrawal: z.number().nonnegative().nullable(),
  maximumWithdrawal: z.number().nonnegative().nullable(),
  depositProcessingTime: nullableText,
  withdrawalTime: nullableText,
  fees: nullableText,
  crypto: nullableBoolean,
  lastVerifiedAt: timestamp.nullable(),
  notes: nullableText,
  sortOrder: z.number().int().nonnegative(),
}).strict();

const categorySchema = z.object({
  key: stableKey,
  name: z.string().trim().min(1).max(200),
  gameCount: z.number().int().nonnegative().nullable(),
  featured: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
}).strict();

const providerSchema = z.object({
  key: stableKey,
  name: z.string().trim().min(1).max(200),
  websiteUrl: nullableUrl,
  gameCount: z.number().int().nonnegative().nullable(),
  liveCasino: nullableBoolean,
  verifiedAt: timestamp.nullable(),
  sortOrder: z.number().int().nonnegative(),
}).strict();

const bonusSchema = z.object({
  key: stableKey,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(2_000),
  type: z.enum(["WELCOME", "NO_DEPOSIT", "FREE_SPINS", "RELOAD", "CASHBACK", "VIP", "OTHER"]),
  percentage: z.number().nonnegative().nullable(),
  minimumDeposit: z.number().nonnegative().nullable(),
  maximumBonus: z.number().nonnegative().nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  freeSpins: z.number().int().nonnegative().nullable(),
  wageringMultiplier: z.number().nonnegative().nullable(),
  wageringText: nullableText,
  eligibility: nullableText,
  importantConditions: z.array(z.string().trim().min(1).max(500)).max(50),
  termsUrl: nullableUrl,
  startsAt: timestamp.nullable(),
  expiresAt: timestamp.nullable(),
  lastVerifiedAt: timestamp.nullable(),
  sortOrder: z.number().int().nonnegative(),
}).strict();

const operatorSchema = z.object({
  key: stableKey,
  name: z.string().trim().min(1).max(200),
  legalName: nullableText,
  websiteUrl: nullableUrl,
}).strict();

const marketSchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  availability: z.enum(["AVAILABLE", "RESTRICTED", "NOT_AVAILABLE", "UNKNOWN"]),
  localDomain: nullableText,
  localWebsiteUrl: nullableUrl,
  operator: operatorSchema,
  operatingLegalEntity: nullableText,
  termsUrl: nullableUrl,
  privacyUrl: nullableUrl,
  responsibleGamblingUrl: nullableUrl,
  primaryLanguage: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/).nullable(),
  supportedLanguages: z.array(z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)).max(30),
  supportLanguages: z.array(z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)).max(30),
  primaryCurrency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  supportedCurrencies: z.array(z.string().regex(/^[A-Z]{3}$/)).max(20),
  minimumAge: z.number().int().min(18).max(100).nullable(),
  kycSummary: nullableText,
  withdrawalSummary: nullableText,
  supportSummary: nullableText,
  lastVerifiedAt: timestamp.nullable(),
  notes: nullableText,
  evidence: z.array(evidenceSchema).min(1),
  licenses: z.array(licenseSchema),
  payments: z.array(paymentSchema),
  bonuses: z.array(bonusSchema),
  providers: z.array(providerSchema),
  categories: z.array(categorySchema),
}).strict();

const commercialMappingSchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  routeSetupId: z.string().regex(/^\d+$/),
  portalMarketState: z.enum(["APPROVED_IN_PORTAL", "PENDING_APPROVAL", "UNKNOWN"]),
  productionEligible: z.literal(false),
  trackingVerifiedEndToEnd: z.literal(false),
  sourceReference: z.string().trim().min(1).max(1_000),
}).strict();

export const casinoIngestionBundleSchema = z.object({
  schemaVersion: z.literal("casino-market-ingestion.v1"),
  actor: z.string().trim().min(1).max(200),
  sourceFiles: z.array(sourceFileSchema).min(1),
  casino: z.object({
    key: stableKey,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    internalName: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    domain: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+$/),
    websiteUrl: httpsUrl,
    summary: z.string().trim().min(1).max(2_000),
    brand: z.object({
      key: stableKey,
      name: z.string().trim().min(1).max(200),
      domain: nullableText,
    }).strict(),
  }).strict(),
  markets: z.array(marketSchema).length(2),
  commercialMappings: z.array(commercialMappingSchema).length(2),
}).strict().superRefine((bundle, context) => {
  const countryCodes = bundle.markets.map((market) => market.countryCode);
  if (new Set(countryCodes).size !== countryCodes.length) context.addIssue({ code: "custom", message: "Market country codes must be unique", path: ["markets"] });
  for (const market of bundle.markets) {
    for (const [field, values] of [["payments", market.payments], ["categories", market.categories], ["providers", market.providers], ["bonuses", market.bonuses]] as const) {
      const keys = values.map((value) => value.key);
      if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", message: `${field} keys must be unique within ${market.countryCode}`, path: ["markets", countryCodes.indexOf(market.countryCode), field] });
    }
  }
  const commercialCountries = new Set(bundle.commercialMappings.map((entry) => entry.countryCode));
  if (commercialCountries.size !== 2 || countryCodes.some((countryCode) => !commercialCountries.has(countryCode))) {
    context.addIssue({ code: "custom", message: "Commercial mapping countries must exactly match factual markets", path: ["commercialMappings"] });
  }
});

export type CasinoIngestionBundle = z.infer<typeof casinoIngestionBundleSchema>;

export function parseCasinoIngestionBundle(input: unknown) {
  return casinoIngestionBundleSchema.parse(input);
}
