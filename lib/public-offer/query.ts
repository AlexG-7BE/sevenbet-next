import type { PublicOfferQuery, PublicOfferSort } from "@/lib/public-offer/public-offer.types";

type SearchValue = string | string[] | undefined;
export type PublicOfferSearchParams = Record<string, SearchValue>;

const sorts = new Set<PublicOfferSort>(["editorial", "newest", "highest-bonus", "lowest-wagering", "lowest-deposit"]);

function first(value: SearchValue) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}
function safeToken(value: SearchValue, pattern: RegExp) {
  const token = first(value);
  return token && pattern.test(token) ? token : undefined;
}

function positiveNumber(value: SearchValue) {
  const token = first(value);
  if (!token) return undefined;
  const parsed = Number(token);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function positiveInteger(value: SearchValue, fallback: number, maximum: number) {
  const parsed = Number(first(value));
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function boolean(value: SearchValue) {
  const token = first(value)?.toLowerCase();
  if (token === "true" || token === "1") return true;
  if (token === "false" || token === "0") return false;
  return undefined;
}

export function parsePublicOfferQuery(searchParams: PublicOfferSearchParams, pageSize = 24): PublicOfferQuery {
  const country = safeToken(searchParams.country, /^[A-Za-z]{2}$/)?.toUpperCase();
  const type = safeToken(searchParams.type, /^[A-Za-z_]{2,32}$/)?.toUpperCase();
  const payment = safeToken(searchParams.payment, /^[A-Za-z0-9 -]{2,64}$/)?.toLowerCase();
  const availabilityToken = first(searchParams.availability)?.toUpperCase();
  const availability = availabilityToken === "AVAILABLE" || availabilityToken === "UNAVAILABLE" ? availabilityToken : undefined;
  const sortToken = first(searchParams.sort) as PublicOfferSort | undefined;
  return {
    country,
    type,
    payment,
    crypto: boolean(searchParams.crypto),
    maxDeposit: positiveNumber(searchParams.maxDeposit),
    maxWagering: positiveNumber(searchParams.maxWagering),
    availability,
    featured: boolean(searchParams.featured),
    recommended: boolean(searchParams.recommended),
    sort: sortToken && sorts.has(sortToken) ? sortToken : "editorial",
    page: positiveInteger(searchParams.page, 1, 10_000),
    pageSize: Math.min(Math.max(pageSize, 1), 100),
  };
}

export function hasPublicOfferFilters(query: PublicOfferQuery) {
  return Boolean(
    query.country || query.type || query.payment || query.crypto !== undefined
    || query.maxDeposit !== undefined || query.maxWagering !== undefined
    || query.availability || query.featured !== undefined || query.recommended !== undefined
    || query.sort !== "editorial" || query.page > 1,
  );
}
