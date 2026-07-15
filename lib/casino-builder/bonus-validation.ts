import type {
  CasinoBuilderBonus,
  CasinoBuilderCountry,
  CasinoBuilderValidationIssue,
  CasinoBonusDraft,
} from "./types";
import { isIsoCountryCode, normalizeHttpUrl, normalizeSlug } from "./core-validation";

export const casinoBonusTypes = [
  "WELCOME",
  "NO_DEPOSIT",
  "FREE_SPINS",
  "RELOAD",
  "CASHBACK",
  "VIP",
  "OTHER",
] as const;

export const casinoBonusOfferStatuses = ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"] as const;
export const casinoBonusGeoModes = ["GLOBAL", "ALLOW", "BLOCK"] as const;
export const maximumCasinoBonuses = 100;
export const maximumBonusListItems = 100;

type BonusType = typeof casinoBonusTypes[number];
type OfferStatus = typeof casinoBonusOfferStatuses[number];
type GeoMode = typeof casinoBonusGeoModes[number];

function issue(path: string, message: string, code: string, severity: "error" | "warning" = "error"): CasinoBuilderValidationIssue {
  return { path, message, code, severity };
}

function cleanString(value: string | null | undefined) {
  return value?.trim() || null;
}

function cleanList(values: string[], transform: (value: string) => string = (value) => value) {
  return [...new Set(values.map((value) => transform(value.trim())).filter(Boolean))];
}

function normalizeDecimal(value: string | null | undefined) {
  const clean = value?.trim();
  return clean || null;
}

function isNonNegativeDecimal(value: string | null) {
  return value === null || (/^\d+(?:\.\d{1,2})?$/.test(value) && Number(value) >= 0);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function exactKeys(record: Record<string, unknown>, allowed: Set<string>, path: string) {
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new Error(`${path} contains unknown fields: ${unknown.join(", ")}`);
  }
}

const bonusDraftKeys = new Set<keyof CasinoBonusDraft>([
  "id", "slug", "internalName", "title", "summary", "shortTerms", "amount", "type",
  "percentage", "minimumDeposit", "maximumBonus", "currency", "freeSpins",
  "wageringMultiplier", "wageringBase", "minimumOdds", "maximumBet", "wageringText",
  "eligibility", "eligibleGames", "excludedGames", "eligiblePaymentMethods",
  "excludedPaymentMethods", "newPlayersOnly", "existingPlayersAllowed", "promoCode",
  "importantConditions", "termsUrl", "startsAt", "expiresAt", "evergreen", "featured",
  "exclusive", "notes", "geoMode", "allowedCountries", "blockedCountries", "status",
  "offerStatus", "sortOrder",
]);
const wageringBases = new Set(["BONUS", "DEPOSIT", "DEPOSIT_AND_BONUS", "OTHER"]);

export function parseCasinoBonusDrafts(value: unknown): CasinoBonusDraft[] {
  if (!Array.isArray(value) || value.length > maximumCasinoBonuses) {
    throw new Error(`casinoBonuses must be an array with at most ${maximumCasinoBonuses} records`);
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`casinoBonuses.${index} must be an object`);
    }
    const record = entry as Record<string, unknown>;
    exactKeys(record, bonusDraftKeys as Set<string>, `casinoBonuses.${index}`);
    const requiredStrings = ["id", "slug", "internalName", "title", "summary", "type", "wageringBase", "geoMode", "status", "offerStatus"];
    if (!requiredStrings.every((key) => typeof record[key] === "string")) {
      throw new Error(`casinoBonuses.${index} has invalid required fields`);
    }
    const maximumStringLengths: Record<string, number> = {
      id: 36,
      slug: 160,
      internalName: 200,
      title: 200,
      summary: 5000,
      type: 30,
      wageringBase: 40,
      geoMode: 20,
      status: 30,
      offerStatus: 30,
    };
    if (requiredStrings.some((key) => (record[key] as string).length > maximumStringLengths[key])) {
      throw new Error(`casinoBonuses.${index} contains an oversized string`);
    }
    const nullableStrings = ["shortTerms", "amount", "percentage", "minimumDeposit", "maximumBonus", "currency", "wageringMultiplier", "minimumOdds", "maximumBet", "wageringText", "eligibility", "promoCode", "termsUrl", "startsAt", "expiresAt", "notes"];
    if (!nullableStrings.every((key) => record[key] === null || typeof record[key] === "string")) {
      throw new Error(`casinoBonuses.${index} has invalid optional fields`);
    }
    if (nullableStrings.some((key) => typeof record[key] === "string" && (record[key] as string).length > (key === "termsUrl" ? 2048 : 5000))) {
      throw new Error(`casinoBonuses.${index} contains an oversized optional field`);
    }
    const arrays = ["eligibleGames", "excludedGames", "eligiblePaymentMethods", "excludedPaymentMethods", "importantConditions", "allowedCountries", "blockedCountries"];
    if (!arrays.every((key) => Array.isArray(record[key]) && (record[key] as unknown[]).length <= maximumBonusListItems && (record[key] as unknown[]).every((item) => typeof item === "string" && item.length <= 200))) {
      throw new Error(`casinoBonuses.${index} has an invalid or oversized list`);
    }
    const booleans = ["newPlayersOnly", "existingPlayersAllowed", "evergreen", "featured", "exclusive"];
    if (!booleans.every((key) => typeof record[key] === "boolean") || typeof record.sortOrder !== "number" || (record.freeSpins !== null && typeof record.freeSpins !== "number")) {
      throw new Error(`casinoBonuses.${index} has invalid flags or priority`);
    }
    return entry as CasinoBonusDraft;
  });
}

export function normalizeCasinoBonusDrafts(records: CasinoBonusDraft[]): CasinoBonusDraft[] {
  return records
    .map((record) => ({
      ...record,
      slug: normalizeSlug(record.slug),
      internalName: record.internalName.trim(),
      title: record.title.trim(),
      summary: record.summary.trim(),
      shortTerms: cleanString(record.shortTerms),
      amount: normalizeDecimal(record.amount),
      type: record.type.trim().toUpperCase(),
      percentage: normalizeDecimal(record.percentage),
      minimumDeposit: normalizeDecimal(record.minimumDeposit),
      maximumBonus: normalizeDecimal(record.maximumBonus),
      currency: record.currency?.trim().toUpperCase() || null,
      wageringMultiplier: normalizeDecimal(record.wageringMultiplier),
      wageringBase: record.wageringBase.trim().toUpperCase(),
      minimumOdds: normalizeDecimal(record.minimumOdds),
      maximumBet: normalizeDecimal(record.maximumBet),
      wageringText: cleanString(record.shortTerms),
      eligibility: cleanString(record.eligibility),
      eligibleGames: cleanList(record.eligibleGames),
      excludedGames: cleanList(record.excludedGames),
      eligiblePaymentMethods: cleanList(record.eligiblePaymentMethods, (item) => normalizeSlug(item)),
      excludedPaymentMethods: cleanList(record.excludedPaymentMethods, (item) => normalizeSlug(item)),
      promoCode: record.promoCode?.trim().toUpperCase() || null,
      importantConditions: cleanList(record.importantConditions),
      termsUrl: cleanString(record.termsUrl),
      startsAt: cleanString(record.startsAt),
      expiresAt: cleanString(record.expiresAt),
      notes: cleanString(record.notes),
      geoMode: record.geoMode.trim().toUpperCase() as GeoMode,
      allowedCountries: cleanList(record.allowedCountries, (item) => item.toUpperCase()),
      blockedCountries: cleanList(record.blockedCountries, (item) => item.toUpperCase()),
      offerStatus: record.offerStatus.trim().toUpperCase(),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
}

export function validateCasinoBonusDrafts(
  records: CasinoBonusDraft[],
  casinoCountries: CasinoBuilderCountry[],
): CasinoBuilderValidationIssue[] {
  const issues: CasinoBuilderValidationIssue[] = [];
  const slugs = new Set<string>();
  const knownCountryCodes = new Set(
    casinoCountries
      .filter((country) => !country.archived)
      .map((country) => country.countryCode),
  );
  const availableCountryCodes = new Set(
    casinoCountries
      .filter((country) => !country.archived && country.availability !== "NOT_AVAILABLE")
      .map((country) => country.countryCode),
  );

  records.forEach((record, index) => {
    const path = `bonuses.${index}`;
    if (!isUuid(record.id)) issues.push(issue(`${path}.id`, "Bonus ID must be a UUID", "INVALID_BONUS_ID"));
    if (!record.slug) issues.push(issue(`${path}.slug`, "Bonus slug is required", "BONUS_SLUG_REQUIRED"));
    if (slugs.has(record.slug)) issues.push(issue(`${path}.slug`, `Duplicate bonus slug: ${record.slug}`, "DUPLICATE_BONUS_SLUG"));
    slugs.add(record.slug);
    if (!record.title) issues.push(issue(`${path}.title`, "Public title is required", "BONUS_TITLE_REQUIRED"));
    if (!(casinoBonusTypes as readonly string[]).includes(record.type)) issues.push(issue(`${path}.type`, "Bonus type is not supported by CasinoBonusType", "INVALID_BONUS_TYPE"));
    if (!(casinoBonusOfferStatuses as readonly string[]).includes(record.offerStatus)) issues.push(issue(`${path}.offerStatus`, "Offer status is invalid", "INVALID_OFFER_STATUS"));
    if (!(casinoBonusGeoModes as readonly string[]).includes(record.geoMode)) issues.push(issue(`${path}.geoMode`, "GEO mode is invalid", "INVALID_GEO_MODE"));
    if (!wageringBases.has(record.wageringBase)) issues.push(issue(`${path}.wageringBase`, "Wagering base is invalid", "INVALID_WAGERING_BASE"));
    if (!Number.isInteger(record.sortOrder) || record.sortOrder < 0) issues.push(issue(`${path}.sortOrder`, "Priority must be a non-negative integer", "INVALID_BONUS_PRIORITY"));
    if (record.percentage !== null && (!isNonNegativeDecimal(record.percentage) || Number(record.percentage) > 1000)) issues.push(issue(`${path}.percentage`, "Percentage must be between 0 and 1000", "INVALID_BONUS_PERCENTAGE"));

    for (const [field, value] of Object.entries({ amount: record.amount, minimumDeposit: record.minimumDeposit, maximumBonus: record.maximumBonus, wageringMultiplier: record.wageringMultiplier, minimumOdds: record.minimumOdds, maximumBet: record.maximumBet })) {
      if (!isNonNegativeDecimal(value)) issues.push(issue(`${path}.${field}`, "Value must be a non-negative number with at most two decimals", "INVALID_BONUS_AMOUNT"));
    }
    if (record.freeSpins !== null && (!Number.isInteger(record.freeSpins) || record.freeSpins < 0)) issues.push(issue(`${path}.freeSpins`, "Free spins must be a non-negative integer", "INVALID_FREE_SPINS"));
    if (record.minimumDeposit && record.maximumBonus && Number(record.maximumBonus) < Number(record.minimumDeposit)) issues.push(issue(`${path}.maximumBonus`, "Maximum amount cannot be lower than minimum deposit", "INVALID_BONUS_AMOUNT_RANGE"));
    if (record.currency && !/^[A-Z]{3}$/.test(record.currency)) issues.push(issue(`${path}.currency`, "Currency must use a three-letter ISO code", "INVALID_BONUS_CURRENCY"));
    if (record.termsUrl && !normalizeHttpUrl(record.termsUrl)) issues.push(issue(`${path}.termsUrl`, "Terms URL must use HTTP or HTTPS", "INVALID_BONUS_TERMS_URL"));
    if (record.startsAt && Number.isNaN(new Date(record.startsAt).getTime())) issues.push(issue(`${path}.startsAt`, "Start date is invalid", "INVALID_BONUS_DATE"));
    if (record.expiresAt && Number.isNaN(new Date(record.expiresAt).getTime())) issues.push(issue(`${path}.expiresAt`, "Expiry date is invalid", "INVALID_BONUS_DATE"));
    if (record.startsAt && record.expiresAt && new Date(record.startsAt) >= new Date(record.expiresAt)) issues.push(issue(`${path}.expiresAt`, "Expiry must be later than start", "INVALID_BONUS_DATE_RANGE"));
    if (record.evergreen && record.expiresAt) issues.push(issue(`${path}.expiresAt`, "Evergreen bonuses cannot have an expiry date", "EVERGREEN_EXPIRY_CONFLICT"));
    if (record.newPlayersOnly && record.existingPlayersAllowed) issues.push(issue(`${path}.eligibility`, "A bonus cannot be new-player-only and allow existing players", "BONUS_ELIGIBILITY_CONFLICT"));

    const allowed = new Set(record.allowedCountries);
    const blocked = new Set(record.blockedCountries);
    for (const country of [...allowed, ...blocked]) {
      if (!isIsoCountryCode(country)) issues.push(issue(`${path}.countries`, `Invalid ISO country code: ${country}`, "INVALID_BONUS_COUNTRY"));
      else if (!knownCountryCodes.has(country)) issues.push(issue(`${path}.countries`, `${country} is not an active CasinoCountry record`, "BONUS_COUNTRY_NOT_ACTIVE"));
      else if (allowed.has(country) && !availableCountryCodes.has(country)) issues.push(issue(`${path}.countries`, `${country} is not available in CasinoCountry`, "BONUS_COUNTRY_NOT_AVAILABLE"));
    }
    for (const country of allowed) {
      if (blocked.has(country)) issues.push(issue(`${path}.countries`, `${country} cannot be both allowed and blocked`, "BONUS_COUNTRY_CONFLICT"));
    }
    if (record.geoMode === "GLOBAL" && (allowed.size || blocked.size)) issues.push(issue(`${path}.geoMode`, "Global bonuses cannot contain allow or block lists", "BONUS_GEO_MODE_CONFLICT"));
    if (record.geoMode === "ALLOW" && (!allowed.size || blocked.size)) issues.push(issue(`${path}.geoMode`, "Allow mode requires an allow list and no block list", "BONUS_GEO_MODE_CONFLICT"));
    if (record.geoMode === "BLOCK" && (allowed.size || !blocked.size)) issues.push(issue(`${path}.geoMode`, "Block mode requires a block list and no allow list", "BONUS_GEO_MODE_CONFLICT"));

    const eligibleMethods = new Set(record.eligiblePaymentMethods);
    record.excludedPaymentMethods.forEach((method) => {
      if (eligibleMethods.has(method)) issues.push(issue(`${path}.paymentMethods`, `${method} cannot be both eligible and excluded`, "BONUS_PAYMENT_CONFLICT"));
    });
    const eligibleGames = new Set(record.eligibleGames.map((game) => game.toLowerCase()));
    record.excludedGames.forEach((game) => {
      if (eligibleGames.has(game.toLowerCase())) issues.push(issue(`${path}.games`, `${game} cannot be both eligible and excluded`, "BONUS_GAME_CONFLICT"));
    });
  });
  return issues;
}

function geoSignature(record: CasinoBonusDraft) {
  const countries = record.geoMode === "ALLOW" ? record.allowedCountries : record.geoMode === "BLOCK" ? record.blockedCountries : ["GLOBAL"];
  return `${record.type}|${record.geoMode}|${[...countries].sort().join(",")}|${record.promoCode || ""}`;
}

export function casinoBonusPublicationIssues(records: CasinoBuilderBonus[]): CasinoBuilderValidationIssue[] {
  const issues: CasinoBuilderValidationIssue[] = [];
  const activeSignatures = new Map<string, number>();
  records.forEach((record, index) => {
    if (record.offerStatus !== "ACTIVE") return;
    const path = `bonuses.${index}`;
    if (!record.shortTerms && !record.termsUrl) issues.push(issue(`${path}.terms`, "Active bonuses need short terms or a terms URL", "BONUS_TERMS_REQUIRED"));
    if (record.geoMode === "ALLOW" && !record.allowedCountries.length) issues.push(issue(`${path}.geoMode`, "Active bonus requires at least one allowed country or global availability", "BONUS_GEO_REQUIRED"));
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      issues.push(issue(`${path}.expiresAt`, "Active bonus has expired", "BONUS_EXPIRED", record.featured ? "error" : "warning"));
    }
    if (!record.affiliateLinks.length) issues.push(issue(`${path}.affiliateLinks`, "Active bonus has no affiliate link", "BONUS_AFFILIATE_LINK_MISSING", "warning"));
    const signature = geoSignature(record);
    if (activeSignatures.has(signature)) issues.push(issue(path, "Another active offer has the same type, GEO and promo code", "DUPLICATE_ACTIVE_BONUS", "warning"));
    activeSignatures.set(signature, index);
  });
  return issues;
}

export function createCasinoBonus(id: string, priority: number): CasinoBuilderBonus {
  return {
    id,
    slug: `bonus-${id.slice(0, 8)}`,
    internalName: "New bonus",
    title: "New bonus",
    summary: "",
    shortTerms: null,
    amount: null,
    type: "OTHER",
    percentage: null,
    minimumDeposit: null,
    maximumBonus: null,
    currency: null,
    freeSpins: null,
    wageringMultiplier: null,
    wageringBase: "BONUS",
    minimumOdds: null,
    maximumBet: null,
    wageringText: null,
    eligibility: null,
    eligibleGames: [],
    excludedGames: [],
    eligiblePaymentMethods: [],
    excludedPaymentMethods: [],
    newPlayersOnly: false,
    existingPlayersAllowed: true,
    promoCode: null,
    importantConditions: [],
    termsUrl: null,
    startsAt: null,
    expiresAt: null,
    evergreen: false,
    featured: false,
    exclusive: false,
    notes: null,
    geoMode: "GLOBAL",
    allowedCountries: [],
    blockedCountries: [],
    status: "DRAFT",
    offerStatus: "DRAFT",
    lastVerifiedAt: null,
    sortOrder: priority,
    affiliateLinks: [],
  };
}

export function casinoBonusToDraft(record: CasinoBuilderBonus): CasinoBonusDraft {
  const {
    affiliateLinks: _affiliateLinks,
    lastVerifiedAt: _lastVerifiedAt,
    ...draft
  } = record;
  return draft;
}

export function duplicateCasinoBonus(record: CasinoBuilderBonus, id: string) {
  return {
    ...record,
    id,
    slug: `${record.slug}-copy-${id.slice(0, 8)}`,
    internalName: `${record.internalName} copy`,
    title: `${record.title} copy`,
    status: "DRAFT" as const,
    offerStatus: "DRAFT",
    lastVerifiedAt: null,
    sortOrder: record.sortOrder + 1,
    affiliateLinks: [],
  };
}

export function setCasinoBonusArchived(record: CasinoBuilderBonus, archived: boolean) {
  return {
    ...record,
    offerStatus: archived ? "ARCHIVED" : "DRAFT",
  };
}

export function reorderCasinoBonuses(records: CasinoBuilderBonus[], sourceIndex: number, targetIndex: number) {
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= records.length || targetIndex >= records.length) return records;
  const next = [...records];
  const [record] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, record);
  return next.map((entry, index) => ({ ...entry, sortOrder: (index + 1) * 1000 }));
}
