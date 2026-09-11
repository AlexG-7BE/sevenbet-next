import { createHash } from "node:crypto";

import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";

export const MARKET_ACTIVATION_CONTROLLER_VERSION = "MARKET-ACTIVATION-V2";
// ISO 3166-1 reserves ZZ for private use. MarketActivation uses it only for a
// pre-existing, explicitly evidenced global-default route. It is never a
// factual CasinoCountry and exact country activations always take precedence.
export const MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE = "ZZ";
export const MARKET_ACTIVATION_GLOBAL_FALLBACK_REQUIRED_BLOCKED_COUNTRIES = [
  "DK",
  "ES",
  "FI",
  "NO",
  "CL",
  "SE",
  "GB",
] as const;
export const MARKET_ACTIVATION_EXACT_SUBDIVISION_COUNTRIES = ["AR", "CA"] as const;

export type MarketActivationProduct = "CASINO";
export type MarketActivationDesiredState = "ACTIVE" | "DISABLED";
export type MarketActivationIntentOrigin = "FOUNDER" | "ADMIN" | "SYSTEM" | "BACKFILL" | "RECONCILER";
export type MarketActivationRouteVerificationResult = {
  status: "HEALTHY" | "DEGRADED" | "EXTERNAL_CHALLENGE" | "BROKEN" | "EXPIRED" | "CROSS_GEO" | "ATTRIBUTION_FAILURE";
  reason: string;
  checkedAt: Date;
  method: "HEAD" | "GET" | null;
  statusCode: number | null;
  durationMs: number | null;
  redirectCount: number | null;
  finalHost: string | null;
};

export interface MarketActivationIntentInput {
  casinoId?: string;
  casinoSlug?: string;
  countryCode: string;
  product?: MarketActivationProduct;
  desiredState?: MarketActivationDesiredState;
  redirectSlugId?: string;
  redirectSlug?: string;
  affiliateOfferId?: string;
  primaryTrackingLinkId?: string;
  actorId: string;
  origin: MarketActivationIntentOrigin;
  reason: string;
  sourceReferences: string[];
  idempotencyKey: string;
  expectedVersion?: number;
}

export interface NormalizedMarketActivationIntent {
  casinoId: string | null;
  casinoSlug: string | null;
  marketCode: string;
  countryCode: string;
  product: MarketActivationProduct;
  desiredState: MarketActivationDesiredState;
  redirectSlugId: string | null;
  redirectSlug: string | null;
  affiliateOfferId: string | null;
  primaryTrackingLinkId: string | null;
  actorId: string;
  origin: MarketActivationIntentOrigin;
  reason: string;
  sourceReferences: string[];
  idempotencyKey: string;
  expectedVersion: number | null;
  payloadHash: string;
}

function requiredText(value: string, field: string, maximum = 500) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`MARKET_ACTIVATION_${field.toUpperCase()}_REQUIRED`);
  if (normalized.length > maximum) throw new Error(`MARKET_ACTIVATION_${field.toUpperCase()}_TOO_LONG`);
  return normalized;
}

function optionalText(value: string | undefined) {
  return value?.trim() || null;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, stable(entry)]));
}

export function activationPayloadHash(value: Omit<NormalizedMarketActivationIntent, "payloadHash">) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function normalizeMarketActivationIntent(input: MarketActivationIntentInput): NormalizedMarketActivationIntent {
  const casinoId = optionalText(input.casinoId);
  const casinoSlug = optionalText(input.casinoSlug)?.toLowerCase() ?? null;
  if ((casinoId ? 1 : 0) + (casinoSlug ? 1 : 0) !== 1) {
    throw new Error("MARKET_ACTIVATION_EXACTLY_ONE_CASINO_IDENTITY_REQUIRED");
  }
  if (casinoSlug && !isSafePublicSlug(casinoSlug)) throw new Error("MARKET_ACTIVATION_CASINO_SLUG_INVALID");
  const marketCode = requiredText(input.countryCode, "country_code", 16).toUpperCase().replace(/_/g, "-");
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,12})?$/.test(marketCode)) throw new Error("MARKET_ACTIVATION_COUNTRY_CODE_INVALID");
  const countryCode = marketCode.slice(0, 2);
  const product = input.product ?? "CASINO";
  if (product !== "CASINO") throw new Error("MARKET_ACTIVATION_PRODUCT_UNSUPPORTED");
  const desiredState = input.desiredState ?? "ACTIVE";
  if (desiredState !== "ACTIVE" && desiredState !== "DISABLED") throw new Error("MARKET_ACTIVATION_DESIRED_STATE_INVALID");
  const redirectSlug = optionalText(input.redirectSlug)?.toLowerCase() ?? null;
  if (redirectSlug && !isSafePublicSlug(redirectSlug)) throw new Error("MARKET_ACTIVATION_REDIRECT_SLUG_INVALID");
  if (input.expectedVersion !== undefined && (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0)) {
    throw new Error("MARKET_ACTIVATION_EXPECTED_VERSION_INVALID");
  }
  const sourceReferences = [...new Set(input.sourceReferences.map((value) => value.trim()).filter(Boolean))].sort();
  if (!sourceReferences.length) throw new Error("MARKET_ACTIVATION_SOURCE_REFERENCE_REQUIRED");
  if (sourceReferences.length > 50 || sourceReferences.some((value) => value.length > 500)) {
    throw new Error("MARKET_ACTIVATION_SOURCE_REFERENCES_INVALID");
  }
  const normalizedWithoutHash = {
    casinoId,
    casinoSlug,
    marketCode,
    countryCode,
    product,
    desiredState,
    redirectSlugId: optionalText(input.redirectSlugId),
    redirectSlug,
    affiliateOfferId: optionalText(input.affiliateOfferId),
    primaryTrackingLinkId: optionalText(input.primaryTrackingLinkId),
    actorId: requiredText(input.actorId, "actor_id", 200),
    origin: input.origin,
    reason: requiredText(input.reason, "reason", 1_000),
    sourceReferences,
    idempotencyKey: requiredText(input.idempotencyKey, "idempotency_key", 300),
    expectedVersion: input.expectedVersion ?? null,
  } satisfies Omit<NormalizedMarketActivationIntent, "payloadHash">;
  if (!["FOUNDER", "ADMIN", "SYSTEM", "BACKFILL", "RECONCILER"].includes(normalizedWithoutHash.origin)) {
    throw new Error("MARKET_ACTIVATION_ORIGIN_INVALID");
  }
  if (
    marketCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
    && !["FOUNDER", "BACKFILL", "RECONCILER"].includes(normalizedWithoutHash.origin)
  ) {
    throw new Error("MARKET_ACTIVATION_GLOBAL_FALLBACK_ORIGIN_INVALID");
  }
  return { ...normalizedWithoutHash, payloadHash: activationPayloadHash(normalizedWithoutHash) };
}

export function safeActivationDestination(value: string) {
  try {
    const destination = new URL(value);
    return destination.protocol === "https:" && !destination.username && !destination.password;
  } catch {
    return false;
  }
}
