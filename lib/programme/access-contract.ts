export const PROGRAMME_ACCESS_INTENT = "PROGRAMME_ACCESS";
export const PROGRAMME_ACCESS_VERSION = 1;
export const PROGRAMME_ACCESS_TTL_MS = 60 * 60 * 1000;

export const PROGRAMME_TERMS_VERSION = "terms:effective-2026-08-07:updated-2026-08-09";
export const PROGRAMME_PRIVACY_VERSION = "privacy:effective-2026-08-09:updated-2026-08-09";

export const PROGRAMME_ACCESS_HEADERS = {
  age: "x-sevenbet-age-attestation",
  terms: "x-sevenbet-terms-acceptance",
  privacy: "x-sevenbet-privacy-acknowledgement",
} as const;

export const PROGRAMME_ACCESS_HEADER_VALUES = {
  age: "18-or-over",
  terms: PROGRAMME_TERMS_VERSION,
  privacy: PROGRAMME_PRIVACY_VERSION,
} as const;

export function hasProgrammeAccountCreationHeaders(headers: Pick<Headers, "get">) {
  return headers.get(PROGRAMME_ACCESS_HEADERS.age) === PROGRAMME_ACCESS_HEADER_VALUES.age
    && headers.get(PROGRAMME_ACCESS_HEADERS.terms) === PROGRAMME_ACCESS_HEADER_VALUES.terms
    && headers.get(PROGRAMME_ACCESS_HEADERS.privacy) === PROGRAMME_ACCESS_HEADER_VALUES.privacy;
}
