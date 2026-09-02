import { z } from "zod";

const uuid = z.string().uuid();
const nullableText = z.string().trim().max(5_000).nullable().optional();
const nullableUrl = z.string().trim().url().max(2_048).refine((value) => /^https?:\/\//i.test(value), "URL must use HTTP or HTTPS").nullable().optional();
const isoDate = z.string().datetime({ offset: true }).nullable().optional();
const language = z.string().trim().min(2).max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const currency = z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase());
const decimal = z.union([z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/), z.number().nonnegative()]).nullable().optional();

const paymentSchema = z.object({
  id: uuid.optional(),
  methodKey: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  supportsDeposits: z.boolean().nullable(),
  supportsWithdrawals: z.boolean().nullable(),
  currencies: z.array(currency).max(30).default([]),
  minimumDeposit: decimal,
  minimumWithdrawal: decimal,
  maximumWithdrawal: decimal,
  depositProcessingTime: nullableText,
  withdrawalTime: nullableText,
  fees: nullableText,
  crypto: z.boolean().nullable(),
  lastVerifiedAt: isoDate,
  notes: nullableText,
  sortOrder: z.number().int().nonnegative().max(10_000).default(0),
}).strict();

const providerSchema = z.object({
  id: uuid.optional(),
  providerKey: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  websiteUrl: nullableUrl,
  gameCount: z.number().int().nonnegative().nullable().optional(),
  liveCasino: z.boolean().nullable(),
  verifiedAt: isoDate,
  sortOrder: z.number().int().nonnegative().max(10_000).default(0),
}).strict();

const categorySchema = z.object({
  id: uuid.optional(),
  categoryKey: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  gameCount: z.number().int().nonnegative().nullable().optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().max(10_000).default(0),
}).strict();

const bonusSchema = z.object({
  id: uuid.optional(),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(5_000),
  type: z.enum(["WELCOME", "NO_DEPOSIT", "FREE_SPINS", "RELOAD", "CASHBACK", "VIP", "OTHER"]).default("OTHER"),
  percentage: decimal,
  minimumDeposit: decimal,
  maximumBonus: decimal,
  currency: currency.nullable().optional(),
  freeSpins: z.number().int().nonnegative().nullable().optional(),
  wageringMultiplier: decimal,
  wageringText: nullableText,
  eligibility: nullableText,
  importantConditions: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
  termsUrl: nullableUrl,
  startsAt: isoDate,
  expiresAt: isoDate,
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  offerStatus: z.enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"]).default("DRAFT"),
  lastVerifiedAt: isoDate,
  sortOrder: z.number().int().nonnegative().max(10_000).default(0),
}).strict().superRefine((value, context) => {
  if (value.startsAt && value.expiresAt && new Date(value.startsAt) >= new Date(value.expiresAt)) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be later than start" });
  }
});

const evidenceSchema = z.object({
  id: uuid.optional(),
  classification: z.enum(["DETECTED", "INFERRED", "PROPOSED", "UNKNOWN", "CONTRADICTION"]),
  sourceType: z.enum(["OFFICIAL_CASINO", "OFFICIAL_OPERATOR", "REGULATOR", "AFFILIATE_PORTAL", "OFFICIAL_TERMS", "PARTNER_COMMUNICATION", "INTERNAL_RECORD", "OTHER"]),
  sourceUrl: nullableUrl,
  sourceReference: z.string().trim().max(1_000).nullable().optional(),
  fieldKeys: z.array(z.string().trim().min(1).max(160).regex(/^[a-z][A-Za-z0-9_.:-]*$/)).max(100).default([]),
  observedAt: isoDate,
  lastVerifiedAt: isoDate,
  notes: nullableText,
}).strict().superRefine((value, context) => {
  if (!value.sourceUrl && !value.sourceReference && !value.notes) {
    context.addIssue({ code: "custom", path: ["sourceReference"], message: "Evidence requires a source URL, source reference or notes" });
  }
});

export const casinoMarketProfileMutationSchema = z.object({
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  availability: z.enum(["AVAILABLE", "RESTRICTED", "NOT_AVAILABLE", "UNKNOWN"]),
  localDomain: z.string().trim().max(253).regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i).nullable().optional(),
  localWebsiteUrl: nullableUrl,
  operatorProfileId: uuid.nullable().optional(),
  operatingLegalEntity: z.string().trim().max(500).nullable().optional(),
  termsUrl: nullableUrl,
  privacyUrl: nullableUrl,
  responsibleGamblingUrl: nullableUrl,
  primaryLanguage: language.nullable().optional(),
  supportedLanguages: z.array(language).max(30).default([]),
  supportLanguages: z.array(language).max(30).default([]),
  primaryCurrency: currency.nullable().optional(),
  supportedCurrencies: z.array(currency).max(30).default([]),
  minimumAge: z.number().int().min(18).max(99).nullable().optional(),
  kycSummary: nullableText,
  withdrawalSummary: nullableText,
  supportSummary: nullableText,
  lastVerifiedAt: isoDate,
  notes: nullableText,
  licenseIds: z.array(uuid).max(100).default([]),
  payments: z.array(paymentSchema).max(200).default([]),
  providers: z.array(providerSchema).max(500).default([]),
  categories: z.array(categorySchema).max(100).default([]),
  bonuses: z.array(bonusSchema).max(100).default([]),
  evidence: z.array(evidenceSchema).max(500).default([]),
}).strict().superRefine((value, context) => {
  const unique = (records: Array<{ key: string }>, path: string) => {
    const seen = new Set<string>();
    for (const [index, record] of records.entries()) {
      if (seen.has(record.key)) context.addIssue({ code: "custom", path: [path, index], message: `${path} keys must be unique within a market profile` });
      seen.add(record.key);
    }
  };
  unique(value.payments.map((record) => ({ key: record.methodKey })), "payments");
  unique(value.providers.map((record) => ({ key: record.providerKey })), "providers");
  unique(value.categories.map((record) => ({ key: record.categoryKey })), "categories");
  unique(value.bonuses.map((record) => ({ key: record.slug })), "bonuses");
  unique(value.licenseIds.map((key) => ({ key })), "licenseIds");
});

export type CasinoMarketProfileMutation = z.infer<typeof casinoMarketProfileMutationSchema>;

export function parseCasinoMarketProfileMutation(value: unknown) {
  return casinoMarketProfileMutationSchema.parse(value);
}
