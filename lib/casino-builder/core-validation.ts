import type {
  CasinoBuilderValidationIssue,
  CasinoCoreDraft,
} from "./types";

const isoCountries = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" "),
);

const scoreKeys = [
  "editorScore",
  "trustScore",
  "userExperienceScore",
  "paymentsScore",
  "gamesScore",
  "supportScore",
  "responsibleGamblingScore",
] as const;

const licenseStatuses = new Set(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "ARCHIVED", "UNKNOWN"]);
const paymentTypes = new Set(["CARD", "E_WALLET", "BANK_TRANSFER", "CRYPTO", "PREPAID", "OTHER"]);
const availabilityValues = new Set(["AVAILABLE", "RESTRICTED", "NOT_AVAILABLE", "UNKNOWN"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isIsoCountryCode(value: string) {
  return isoCountries.has(value);
}

function issue(path: string, message: string, code: string, severity: "error" | "warning" = "error"): CasinoBuilderValidationIssue {
  return { path, message, code, severity };
}
export function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function normalizeDomain(value: string) {
  const candidate = value.trim().toLowerCase();
  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return parsed.hostname.replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

export function isValidDomain(value: string) {
  if (value.length > 253 || !value.includes(".")) return false;
  return value.split(".").every((label) =>
    label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  );
}

export function normalizeHttpUrl(value: string | null | undefined, fallback?: string) {
  const candidate = value?.trim() || fallback || "";
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function cleanStrings(values: string[], transform: (value: string) => string = (value) => value) {
  return [...new Set(values.map((value) => transform(value.trim())).filter(Boolean))];
}

function nullableString(value: string | null | undefined) {
  return value?.trim() || null;
}

function nullableDecimal(value: string | null | undefined) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function duplicateIssues<T>(records: T[], key: (record: T) => string, path: string, label: string) {
  const seen = new Set<string>();
  const issues: CasinoBuilderValidationIssue[] = [];
  records.forEach((record, index) => {
    const value = key(record);
    if (seen.has(value)) issues.push(issue(`${path}.${index}`, `Duplicate ${label}: ${value}`, `DUPLICATE_${label.toUpperCase().replaceAll(" ", "_")}`));
    seen.add(value);
  });
  return issues;
}

function validateId(id: string, path: string, issues: CasinoBuilderValidationIssue[]) {
  if (!uuidPattern.test(id)) issues.push(issue(path, "Record ID must be a UUID", "INVALID_RECORD_ID"));
}

function validateDate(value: string | null, path: string, issues: CasinoBuilderValidationIssue[]) {
  if (value && Number.isNaN(new Date(value).getTime())) issues.push(issue(path, "Date must be valid", "INVALID_DATE"));
}

function validateDecimal(value: string | null, path: string, issues: CasinoBuilderValidationIssue[]) {
  if (value !== null && (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) < 0)) {
    issues.push(issue(path, "Amount must be a non-negative number with at most two decimals", "INVALID_AMOUNT"));
  }
}

export function normalizeCasinoCoreDraft(input: CasinoCoreDraft): CasinoCoreDraft {
  const domain = normalizeDomain(input.domain);
  const seo = input.seo
    ? {
        ...input.seo,
        title: nullableString(input.seo.title),
        description: nullableString(input.seo.description),
        canonicalUrl: nullableString(input.seo.canonicalUrl),
        socialTitle: nullableString(input.seo.socialTitle),
        socialDescription: nullableString(input.seo.socialDescription),
        socialImage: nullableString(input.seo.socialImage),
        structuredData: input.seo.structuredData.trim(),
        robots: `${input.seo.robotsIndex ? "index" : "noindex"},${input.seo.robotsFollow ? "follow" : "nofollow"}`,
      }
    : null;

  return {
    ...input,
    slug: normalizeSlug(input.slug),
    internalName: nullableString(input.internalName),
    title: input.title.trim(),
    domain,
    websiteUrl: normalizeHttpUrl(input.websiteUrl, domain ? `https://${domain}` : undefined),
    operator: nullableString(input.operator),
    tagline: nullableString(input.tagline),
    summary: nullableString(input.summary),
    description: nullableString(input.description),
    language: input.language.trim().toLowerCase() || "en",
    languages: cleanStrings(input.languages, (value) => value.toLowerCase()),
    currencies: cleanStrings(input.currencies, (value) => value.toUpperCase()),
    generalMetadata: {
      ...input.generalMetadata,
      internalNotes: nullableString(input.generalMetadata.internalNotes),
    },
    seo,
    licenses: input.licenses.map((record) => ({
      ...record,
      authority: record.authority.trim(),
      licenseNumber: nullableString(record.licenseNumber),
      jurisdiction: nullableString(record.jurisdiction),
      status: record.archived ? "ARCHIVED" : record.status.trim().toUpperCase(),
      verificationUrl: nullableString(record.verificationUrl),
      issuedAt: nullableString(record.issuedAt),
      expiresAt: nullableString(record.expiresAt),
      notes: nullableString(record.notes),
    })),
    countries: input.countries
      .map((record) => ({
        ...record,
        countryCode: record.countryCode.trim().toUpperCase(),
        currency: record.currency?.trim().toUpperCase() || null,
        language: record.language?.trim().toLowerCase() || null,
        notes: nullableString(record.notes),
      }))
      .sort((a, b) => a.priority - b.priority || a.countryCode.localeCompare(b.countryCode)),
    paymentMethods: input.paymentMethods
      .map((record) => ({
        ...record,
        methodKey: normalizeSlug(record.methodKey),
        name: record.name.trim(),
        currencies: cleanStrings(record.currencies, (value) => value.toUpperCase()),
        countries: cleanStrings(record.countries, (value) => value.toUpperCase()),
        minimumDeposit: nullableDecimal(record.minimumDeposit),
        maximumDeposit: nullableDecimal(record.maximumDeposit),
        minimumWithdrawal: nullableDecimal(record.minimumWithdrawal),
        maximumWithdrawal: nullableDecimal(record.maximumWithdrawal),
        depositFee: nullableDecimal(record.depositFee),
        withdrawalFee: nullableDecimal(record.withdrawalFee),
        depositProcessingTime: nullableString(record.depositProcessingTime),
        withdrawalTime: nullableString(record.withdrawalTime),
        notes: nullableString(record.notes),
        type: record.type.trim().toUpperCase(),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    gameProviders: input.gameProviders
      .map((record) => ({
        ...record,
        providerKey: normalizeSlug(record.providerKey),
        name: record.name.trim(),
        websiteUrl: nullableString(record.websiteUrl),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    gameCategories: input.gameCategories
      .map((record) => ({
        ...record,
        categoryKey: normalizeSlug(record.categoryKey),
        name: record.name.trim(),
        icon: nullableString(record.icon),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
  };
}

export function validateCasinoCoreDraft(draft: CasinoCoreDraft): CasinoBuilderValidationIssue[] {
  const issues: CasinoBuilderValidationIssue[] = [];
  if (!draft.title) issues.push(issue("general.title", "Public title is required", "TITLE_REQUIRED"));
  if (!draft.slug) issues.push(issue("general.slug", "Slug is required", "SLUG_REQUIRED"));
  if (!isValidDomain(draft.domain)) issues.push(issue("general.domain", "A valid root domain is required", "INVALID_DOMAIN"));
  if (!draft.websiteUrl || !normalizeHttpUrl(draft.websiteUrl)) issues.push(issue("general.websiteUrl", "Website URL must use HTTP or HTTPS", "INVALID_URL"));
  if (draft.foundedYear !== null && (draft.foundedYear < 1800 || draft.foundedYear > new Date().getFullYear())) issues.push(issue("general.foundedYear", "Founded year is outside the supported range", "INVALID_YEAR"));

  const scores = { editorScore: draft.editorScore, ...draft.generalMetadata };
  for (const key of scoreKeys) {
    const value = scores[key];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10)) {
      issues.push(issue(`general.${key}`, "Score must be between 0 and 10", "INVALID_SCORE"));
    }
  }

  if (draft.seo) {
    if (draft.seo.canonicalUrl && !normalizeHttpUrl(draft.seo.canonicalUrl)) issues.push(issue("seo.canonicalUrl", "Canonical URL must use HTTP or HTTPS", "INVALID_CANONICAL_URL"));
    if (draft.seo.socialImage && !normalizeHttpUrl(draft.seo.socialImage)) issues.push(issue("seo.socialImage", "Social image must be an HTTP or HTTPS URL", "INVALID_SOCIAL_IMAGE"));
    if (draft.seo.structuredData) {
      try {
        const parsed = JSON.parse(draft.seo.structuredData);
        if (!parsed || typeof parsed !== "object") issues.push(issue("seo.structuredData", "Structured data must be a JSON object or array", "INVALID_STRUCTURED_DATA"));
      } catch {
        issues.push(issue("seo.structuredData", "Structured data contains malformed JSON", "INVALID_STRUCTURED_DATA"));
      }
    }
  }

  issues.push(...duplicateIssues(draft.licenses, (record) => `${record.authority.toLowerCase()}|${record.licenseNumber?.toLowerCase() || ""}`, "licenses", "license"));
  draft.licenses.forEach((record, index) => {
    validateId(record.id, `licenses.${index}.id`, issues);
    if (!record.authority) issues.push(issue(`licenses.${index}.authority`, "Regulator is required", "LICENSE_AUTHORITY_REQUIRED"));
    if (!licenseStatuses.has(record.status)) issues.push(issue(`licenses.${index}.status`, "License status is not supported", "INVALID_LICENSE_STATUS"));
    if (record.verificationUrl && !normalizeHttpUrl(record.verificationUrl)) issues.push(issue(`licenses.${index}.verificationUrl`, "Verification URL must use HTTP or HTTPS", "INVALID_URL"));
    validateDate(record.issuedAt, `licenses.${index}.issuedAt`, issues);
    validateDate(record.expiresAt, `licenses.${index}.expiresAt`, issues);
    if (record.issuedAt && record.expiresAt && new Date(record.issuedAt) > new Date(record.expiresAt)) issues.push(issue(`licenses.${index}.expiresAt`, "Expiry date must be after issue date", "INVALID_LICENSE_DATES"));
  });

  issues.push(...duplicateIssues(draft.countries, (record) => record.countryCode, "countries", "country"));
  draft.countries.forEach((record, index) => {
    validateId(record.id, `countries.${index}.id`, issues);
    if (!isoCountries.has(record.countryCode)) issues.push(issue(`countries.${index}.countryCode`, "Use a valid ISO 3166-1 alpha-2 country code", "INVALID_COUNTRY_CODE"));
    if (!availabilityValues.has(record.availability)) issues.push(issue(`countries.${index}.availability`, "Country availability is invalid", "INVALID_AVAILABILITY"));
    if (record.minimumAge !== null && (!Number.isInteger(record.minimumAge) || record.minimumAge < 18 || record.minimumAge > 99)) issues.push(issue(`countries.${index}.minimumAge`, "Legal age must be an integer of 18 or higher", "INVALID_LEGAL_AGE"));
    if (record.currency && !/^[A-Z]{3}$/.test(record.currency)) issues.push(issue(`countries.${index}.currency`, "Currency must use a three-letter ISO code", "INVALID_CURRENCY"));
    if (!Number.isInteger(record.priority) || record.priority < 0) issues.push(issue(`countries.${index}.priority`, "Priority must be a non-negative integer", "INVALID_PRIORITY"));
  });

  issues.push(...duplicateIssues(draft.paymentMethods, (record) => record.methodKey, "payments", "payment method"));
  draft.paymentMethods.forEach((record, index) => {
    validateId(record.id, `payments.${index}.id`, issues);
    if (!record.name || !record.methodKey) issues.push(issue(`payments.${index}.name`, "Payment name and code are required", "PAYMENT_NAME_REQUIRED"));
    if (!paymentTypes.has(record.type)) issues.push(issue(`payments.${index}.type`, "Payment type is not supported", "INVALID_PAYMENT_TYPE"));
    if (!record.supportsDeposits && !record.supportsWithdrawals) issues.push(issue(`payments.${index}`, "A payment method must support deposits or withdrawals", "PAYMENT_DIRECTION_REQUIRED"));
    for (const [key, value] of Object.entries({ minimumDeposit: record.minimumDeposit, maximumDeposit: record.maximumDeposit, minimumWithdrawal: record.minimumWithdrawal, maximumWithdrawal: record.maximumWithdrawal, depositFee: record.depositFee, withdrawalFee: record.withdrawalFee })) validateDecimal(value, `payments.${index}.${key}`, issues);
    if (record.minimumDeposit && record.maximumDeposit && Number(record.minimumDeposit) > Number(record.maximumDeposit)) issues.push(issue(`payments.${index}.maximumDeposit`, "Maximum deposit must be at least the minimum deposit", "INVALID_DEPOSIT_RANGE"));
    if (record.minimumWithdrawal && record.maximumWithdrawal && Number(record.minimumWithdrawal) > Number(record.maximumWithdrawal)) issues.push(issue(`payments.${index}.maximumWithdrawal`, "Maximum withdrawal must be at least the minimum withdrawal", "INVALID_WITHDRAWAL_RANGE"));
    record.currencies.forEach((currency) => { if (!/^[A-Z]{3}$/.test(currency)) issues.push(issue(`payments.${index}.currencies`, `Invalid currency code: ${currency}`, "INVALID_CURRENCY")); });
    record.countries.forEach((country) => { if (!isoCountries.has(country)) issues.push(issue(`payments.${index}.countries`, `Invalid country code: ${country}`, "INVALID_COUNTRY_CODE")); });
    if (!Number.isInteger(record.sortOrder) || record.sortOrder < 0) issues.push(issue(`payments.${index}.sortOrder`, "Priority must be a non-negative integer", "INVALID_PRIORITY"));
  });

  issues.push(...duplicateIssues(draft.gameProviders, (record) => record.providerKey, "gameProviders", "game provider"));
  draft.gameProviders.forEach((record, index) => {
    validateId(record.id, `gameProviders.${index}.id`, issues);
    if (!record.name || !record.providerKey) issues.push(issue(`gameProviders.${index}.name`, "Provider name and code are required", "PROVIDER_NAME_REQUIRED"));
    if (record.gameCount !== null && (!Number.isInteger(record.gameCount) || record.gameCount < 0)) issues.push(issue(`gameProviders.${index}.gameCount`, "Game count must be a non-negative integer", "INVALID_GAME_COUNT"));
    if (record.websiteUrl && !normalizeHttpUrl(record.websiteUrl)) issues.push(issue(`gameProviders.${index}.websiteUrl`, "Provider URL must use HTTP or HTTPS", "INVALID_URL"));
    if (!Number.isInteger(record.sortOrder) || record.sortOrder < 0) issues.push(issue(`gameProviders.${index}.sortOrder`, "Priority must be a non-negative integer", "INVALID_PRIORITY"));
  });

  issues.push(...duplicateIssues(draft.gameCategories, (record) => record.categoryKey, "gameCategories", "game category"));
  draft.gameCategories.forEach((record, index) => {
    validateId(record.id, `gameCategories.${index}.id`, issues);
    if (!record.name || !record.categoryKey) issues.push(issue(`gameCategories.${index}.name`, "Category name and code are required", "CATEGORY_NAME_REQUIRED"));
    if (record.gameCount !== null && (!Number.isInteger(record.gameCount) || record.gameCount < 0)) issues.push(issue(`gameCategories.${index}.gameCount`, "Game count must be a non-negative integer", "INVALID_GAME_COUNT"));
    if (!Number.isInteger(record.sortOrder) || record.sortOrder < 0) issues.push(issue(`gameCategories.${index}.sortOrder`, "Priority must be a non-negative integer", "INVALID_PRIORITY"));
  });

  return issues;
}

export function parseStructuredData(value: string) {
  return value.trim() ? JSON.parse(value) as object : null;
}

export function publicationWarnings(draft: CasinoCoreDraft): CasinoBuilderValidationIssue[] {
  const warnings: CasinoBuilderValidationIssue[] = [];
  if (draft.seo?.title && draft.seo.title.length > 60) warnings.push(issue("seo.title", "SEO title is longer than 60 characters", "SEO_TITLE_LENGTH", "warning"));
  if (draft.seo?.description && draft.seo.description.length > 160) warnings.push(issue("seo.description", "SEO description is longer than 160 characters", "SEO_DESCRIPTION_LENGTH", "warning"));
  if (draft.seo?.socialTitle && draft.seo.socialTitle.length > 70) warnings.push(issue("seo.socialTitle", "Social title is longer than 70 characters", "SOCIAL_TITLE_LENGTH", "warning"));
  draft.licenses.forEach((record, index) => {
    if (!record.archived && record.expiresAt && new Date(record.expiresAt) < new Date()) warnings.push(issue(`licenses.${index}.expiresAt`, `${record.authority} license has expired`, "LICENSE_EXPIRED", "warning"));
    if (!record.archived && !record.verified) warnings.push(issue(`licenses.${index}.verified`, `${record.authority} has not been verified`, "LICENSE_UNVERIFIED", "warning"));
  });
  return warnings;
}
