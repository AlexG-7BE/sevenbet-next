import { AffiliateSourcePolicy } from "@prisma/client";

import type { AffiliateSourceRules } from "./types";

export const defaultAffiliateSourceRules: Record<string, AffiliateSourcePolicy> = {
  externalOfferId: AffiliateSourcePolicy.PROVIDER_WINS,
  externalName: AffiliateSourcePolicy.PROVIDER_WINS,
  status: AffiliateSourcePolicy.PROVIDER_WINS,
  trackingLinks: AffiliateSourcePolicy.PROVIDER_WINS,
  payoutModel: AffiliateSourcePolicy.REVIEW_ON_CONFLICT,
  payoutAmount: AffiliateSourcePolicy.REVIEW_ON_CONFLICT,
  payoutCurrency: AffiliateSourcePolicy.REVIEW_ON_CONFLICT,
  revenueSharePercentage: AffiliateSourcePolicy.REVIEW_ON_CONFLICT,
  hybridTerms: AffiliateSourcePolicy.REVIEW_ON_CONFLICT,
  landingPageUrl: AffiliateSourcePolicy.PROVIDER_WINS,
  countries: AffiliateSourcePolicy.PROVIDER_WINS,
  currencies: AffiliateSourcePolicy.PROVIDER_WINS,
  languages: AffiliateSourcePolicy.PROVIDER_WINS,
  devices: AffiliateSourcePolicy.PROVIDER_WINS,
  validFrom: AffiliateSourcePolicy.PROVIDER_WINS,
  validUntil: AffiliateSourcePolicy.PROVIDER_WINS,
  internalName: AffiliateSourcePolicy.MANUAL_WINS,
  publicLabel: AffiliateSourcePolicy.MANUAL_WINS,
  terms: AffiliateSourcePolicy.MANUAL_WINS,
  notes: AffiliateSourcePolicy.MANUAL_WINS,
};

function same(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function empty(value: unknown) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

export function mergeProviderFields(input: {
  current: Record<string, unknown>;
  previousProvider: Record<string, unknown>;
  nextProvider: Record<string, unknown>;
  rules?: AffiliateSourceRules;
}) {
  const output = { ...input.current };
  const conflicts: string[] = [];
  for (const [field, providerValue] of Object.entries(input.nextProvider)) {
    const policy = input.rules?.[field] ?? defaultAffiliateSourceRules[field] ?? AffiliateSourcePolicy.MANUAL_WINS;
    const currentValue = input.current[field];
    const previousValue = input.previousProvider[field];
    const manuallyChanged = !same(currentValue, previousValue);

    if (policy === AffiliateSourcePolicy.PROVIDER_WINS) output[field] = providerValue;
    if (policy === AffiliateSourcePolicy.PROVIDER_IF_EMPTY && empty(currentValue)) output[field] = providerValue;
    if (policy === AffiliateSourcePolicy.REVIEW_ON_CONFLICT) {
      if (manuallyChanged && !same(currentValue, providerValue)) conflicts.push(field);
      else output[field] = providerValue;
    }
  }
  return { value: output, conflicts };
}
