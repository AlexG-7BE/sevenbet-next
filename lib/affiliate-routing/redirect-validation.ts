import { ValidationError } from "@/lib/services/service-error";

const controlCharacters = /[\u0000-\u001f\u007f]/;
const encodedLineBreak = /%0d|%0a/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedSlugPart = /(?:^|-)(?:api-?key|auth|bearer|password|secret|session|token)(?:-|$)/i;

export function isIsoCountryCode(value: string) {
  const code = value.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || ["EU", "UN", "XA", "XB", "XK", "XX"].includes(code)) return false;
  const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
  return Boolean(name && name !== code && name !== "Unknown Region");
}

export function isIsoCurrencyCode(value: string) {
  const code = value.toUpperCase();
  return /^[A-Z]{3}$/.test(code) && Intl.supportedValuesOf("currency").includes(code);
}

export function normalizeRedirectSlug(value: unknown) {
  if (typeof value !== "string") throw new ValidationError("Redirect slug is required");
  const slug = value.trim().toLowerCase();
  if (slug.length < 3 || slug.length > 80 || !slugPattern.test(slug)) {
    throw new ValidationError("Redirect slug must be 3–80 lowercase letters, numbers, or hyphen-separated words");
  }
  if (reservedSlugPart.test(slug)) throw new ValidationError("Redirect slug contains a reserved security term");
  return slug;
}

export function normalizeCurrencyHint(value: unknown, field = "currency") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !isIsoCurrencyCode(value)) throw new ValidationError(`${field} must be an ISO 4217 currency`);
  return value.toUpperCase();
}

export function normalizeLanguageHint(value: unknown, field = "language") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 24 || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i.test(value)) {
    throw new ValidationError(`${field} must be a short BCP 47 language tag`);
  }
  return value.split("-").map((part, index) => index === 0 ? part.toLowerCase() : part.length === 2 ? part.toUpperCase() : part.toLowerCase()).join("-");
}

export function normalizeCountryHint(value: unknown, field = "country") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !isIsoCountryCode(value)) throw new ValidationError(`${field} must be an ISO 3166-1 alpha-2 country`);
  return value.toUpperCase();
}

export function validateRedirectTargetUrl(value: unknown, { production = process.env.NODE_ENV === "production" } = {}) {
  if (typeof value !== "string" || !value || value.length > 4096) return null;
  if (controlCharacters.test(value) || encodedLineBreak.test(value) || value.includes("\\")) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!url.hostname || !["http:", "https:"].includes(url.protocol)) return null;
  if (production && url.protocol !== "https:") return null;
  if (url.username || url.password || controlCharacters.test(url.href) || encodedLineBreak.test(url.href)) return null;
  return url;
}

export function isAffiliateRedirectEnabled() {
  return process.env.AFFILIATE_REDIRECT_ENGINE_ENABLED === "true";
}

export function countryFromRequest(request: Request) {
  for (const header of ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country"]) {
    const value = request.headers.get(header);
    if (value && isIsoCountryCode(value)) return value.toUpperCase();
  }
  if (process.env.NODE_ENV !== "production" && process.env.AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE === "true") {
    const testCountry = new URL(request.url).searchParams.get("testCountry");
    if (testCountry && isIsoCountryCode(testCountry)) return testCountry.toUpperCase();
  }
  return null;
}

export function preferenceHintsFromRequest(request: Request) {
  const search = new URL(request.url).searchParams;
  return {
    currencyCode: normalizeCurrencyHint(search.get("currency")),
    language: normalizeLanguageHint(search.get("language")),
  };
}
