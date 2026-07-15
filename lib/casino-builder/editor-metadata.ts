import type { Prisma } from "@prisma/client";

import type { CasinoBuilderGeneralMetadata } from "./types";

export interface CasinoEditorMetadata {
  version: 2;
  general: CasinoBuilderGeneralMetadata;
  licenses: Record<string, { archived: boolean }>;
  countries: Record<string, {
    currency: string | null;
    language: string | null;
    priority: number;
    archived: boolean;
  }>;
  payments: Record<string, {
    maximumDeposit: string | null;
    depositFee: string | null;
    withdrawalFee: string | null;
    type: string;
    countries: string[];
    verified: boolean;
    notes: string | null;
    archived: boolean;
  }>;
  providers: Record<string, { featured: boolean; archived: boolean }>;
  categories: Record<string, { icon: string | null; archived: boolean }>;
  bonuses: Record<string, {
    internalName: string;
    shortTerms: string | null;
    amount: string | null;
    wageringBase: string;
    minimumOdds: string | null;
    maximumBet: string | null;
    eligibleGames: string[];
    excludedGames: string[];
    eligiblePaymentMethods: string[];
    excludedPaymentMethods: string[];
    newPlayersOnly: boolean;
    existingPlayersAllowed: boolean;
    promoCode: string | null;
    evergreen: boolean;
    featured: boolean;
    exclusive: boolean;
    notes: string | null;
    geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
    allowedCountries: string[];
    blockedCountries: string[];
  }>;
}

const metadataKey = "__sevenbetCasinoEditor";

export const emptyGeneralMetadata: CasinoBuilderGeneralMetadata = {
  trustScore: null,
  userExperienceScore: null,
  paymentsScore: null,
  gamesScore: null,
  supportScore: null,
  responsibleGamblingScore: null,
  featured: false,
  recommended: false,
  internalNotes: null,
};

export function emptyCasinoEditorMetadata(): CasinoEditorMetadata {
  return {
    version: 2,
    general: { ...emptyGeneralMetadata },
    licenses: {},
    countries: {},
    payments: {},
    providers: {},
    categories: {},
    bonuses: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readCasinoEditorMetadata(value: Prisma.JsonValue | null): CasinoEditorMetadata {
  if (!isRecord(value) || !isRecord(value[metadataKey])) {
    return emptyCasinoEditorMetadata();
  }

  const stored = value[metadataKey] as Partial<CasinoEditorMetadata>;
  const defaults = emptyCasinoEditorMetadata();
  return {
    version: 2,
    general: isRecord(stored.general)
      ? { ...defaults.general, ...stored.general }
      : defaults.general,
    licenses: isRecord(stored.licenses) ? stored.licenses as CasinoEditorMetadata["licenses"] : {},
    countries: isRecord(stored.countries) ? stored.countries as CasinoEditorMetadata["countries"] : {},
    payments: isRecord(stored.payments) ? stored.payments as CasinoEditorMetadata["payments"] : {},
    providers: isRecord(stored.providers) ? stored.providers as CasinoEditorMetadata["providers"] : {},
    categories: isRecord(stored.categories) ? stored.categories as CasinoEditorMetadata["categories"] : {},
    bonuses: isRecord(stored.bonuses) ? stored.bonuses as CasinoEditorMetadata["bonuses"] : {},
  };
}

export function writeCasinoEditorMetadata(
  value: Prisma.JsonValue | null,
  metadata: CasinoEditorMetadata,
): Prisma.InputJsonValue {
  const next = isRecord(value)
    ? { ...value, [metadataKey]: metadata }
    : { reviewContent: value ?? null, [metadataKey]: metadata };

  return JSON.parse(JSON.stringify(next)) as Prisma.InputJsonValue;
}
