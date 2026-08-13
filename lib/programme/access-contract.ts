export const PROGRAMME_ACCESS_INTENT = "PROGRAMME_ACCESS";
export const PROGRAMME_ACCESS_VERSION = 1;
export const PROGRAMME_ACCESS_TTL_MS = 60 * 60 * 1000;
export const PROGRAMME_AUTH_ACCESS_PROOF_VERSION = 1;
export const PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE = "PROGRAMME_AUTH_ACCESS";

export const PROGRAMME_TERMS_VERSION = "terms:effective-2026-08-07:updated-2026-08-09";
export const PROGRAMME_PRIVACY_VERSION = "privacy:effective-2026-08-09:updated-2026-08-13";

export const PROGRAMME_ACCESS_HEADERS = {
  age: "x-sevenbet-age-attestation",
  terms: "x-sevenbet-terms-acceptance",
  privacy: "x-sevenbet-privacy-acknowledgement",
} as const;

export const PROGRAMME_AUTH_ACCESS_HEADERS = {
  proof: "x-sevenbet-programme-access-proof",
  journey: "x-sevenbet-programme-access-journey",
} as const;

export const PROGRAMME_ACCESS_HEADER_VALUES = {
  age: "18-or-over",
  terms: PROGRAMME_TERMS_VERSION,
  privacy: PROGRAMME_PRIVACY_VERSION,
} as const;

export type ProgrammeAccessAuthority = {
  version: typeof PROGRAMME_ACCESS_VERSION;
  intent: typeof PROGRAMME_ACCESS_INTENT;
  purpose: typeof PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE;
  journeyId: string;
  createdAt: number;
  expiresAt: number;
  termsVersion: typeof PROGRAMME_TERMS_VERSION;
  privacyVersion: typeof PROGRAMME_PRIVACY_VERSION;
  adultConfirmedAt: number;
  termsAcceptedAt: number;
  privacyAcknowledgedAt: number;
  proof: string;
};
