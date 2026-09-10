import { PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS } from "@/lib/affiliate-routing/partner-route-projection";
import { prisma } from "@/lib/db/prisma";
import { exactSubdivisionCommercialAuthority } from "@/lib/jurisdiction/exact-market-authority";
import { jurisdictionResolver, type JurisdictionResolver } from "@/lib/jurisdiction/resolver";
import type { JurisdictionDecision } from "@/lib/jurisdiction/types";

import type { MarketActivationApplyResult } from "./repository";
import { marketActivationRepository, type MarketActivationRepository } from "./repository";
import {
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  normalizeMarketActivationIntent,
  type MarketActivationIntentInput,
} from "./contract";
import {
  marketActivationRouteVerifier,
  type MarketActivationRouteVerifierPort,
} from "./verifier";

function routeVerificationCurrent(result: MarketActivationApplyResult, now: Date) {
  const checkedAt = result.activation.routeLastCheckedAt;
  return result.activation.status === "ACTIVE"
    && result.activation.routeVerificationStatus === "HEALTHY"
    && checkedAt !== null
    && checkedAt <= now
    && now.getTime() - checkedAt.getTime() < PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS;
}

function routeVerificationRequired(result: MarketActivationApplyResult, now: Date) {
  if (routeVerificationCurrent(result, now)) return false;
  const diagnostics = result.activation.diagnostics && typeof result.activation.diagnostics === "object"
    && !Array.isArray(result.activation.diagnostics)
    ? result.activation.diagnostics as Record<string, unknown>
    : {};
  const preparingReady = result.activation.status === "PREPARING"
    && !diagnostics.internalPending
    && Boolean((result.activation.marketProfileId
      || result.activation.countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE)
      && result.activation.affiliateOfferId
      && result.activation.primaryTrackingLinkId
      && result.activation.redirectSlugId);
  return result.activation.status === "ACTIVE"
    || preparingReady
    || (result.activation.status === "BLOCKED_EXTERNAL"
      && result.activation.externalBlockerSource === "AffiliateRouteHealth");
}

export interface ExactSubdivisionActivationAuthorityPort {
  allowed(intent: ReturnType<typeof normalizeMarketActivationIntent>, parentDecision: JurisdictionDecision): Promise<boolean>;
}

export interface ParentJurisdictionAuthorityPort {
  resolve: Pick<JurisdictionResolver, "resolve">["resolve"];
}

const exactSubdivisionActivationAuthority: ExactSubdivisionActivationAuthorityPort = {
  async allowed(intent, parentDecision) {
    const casinoSlug = intent.casinoSlug ?? (intent.casinoId
      ? (await prisma.casino.findUnique({ where: { id: intent.casinoId }, select: { slug: true } }))?.slug
      : null);
    return Boolean(casinoSlug && exactSubdivisionCommercialAuthority({
      casinoSlug,
      marketCode: intent.marketCode,
      parentDecision,
    }).allowed);
  },
};

export class MarketActivationController {
  constructor(
    private readonly store: Pick<MarketActivationRepository, "apply" | "recordRouteVerification"> = marketActivationRepository,
    private readonly routeVerifier: MarketActivationRouteVerifierPort = marketActivationRouteVerifier,
    private readonly exactSubdivisionAuthority: ExactSubdivisionActivationAuthorityPort = exactSubdivisionActivationAuthority,
    private readonly parentJurisdiction: ParentJurisdictionAuthorityPort = jurisdictionResolver,
  ) {}

  async setDesiredState(input: MarketActivationIntentInput, now = new Date()): Promise<MarketActivationApplyResult> {
    const intent = normalizeMarketActivationIntent(input);
    if (intent.desiredState === "ACTIVE" && intent.marketCode.includes("-")) {
      const parentDecision = await this.parentJurisdiction.resolve({
        requestCountrySignal: { countryCode: intent.countryCode, trust: "TRUSTED", observedAt: now },
        accountCountry: null,
        now,
      });
      if (!await this.exactSubdivisionAuthority.allowed(intent, parentDecision)) {
        throw new Error("MARKET_ACTIVATION_EXACT_SUBDIVISION_AUTHORITY_MISSING");
      }
    }
    let result = await this.store.apply(intent, now);
    if (intent.desiredState !== "ACTIVE") return result;
    for (let attempt = 1; attempt <= 2 && routeVerificationRequired(result, now); attempt += 1) {
      let verification;
      try {
        verification = await this.routeVerifier.verify(result.activation.id, now);
      } catch {
        // A verifier execution failure is internal infrastructure state, not
        // evidence that the partner route is externally broken. Preserve the
        // canonical state and leave PREPARING work resumable after one retry.
        if (attempt === 2) return result;
        continue;
      }
      try {
        result = await this.store.recordRouteVerification(result.activation.id, result.activation.version, verification);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "MARKET_ACTIVATION_VERIFICATION_STALE" || attempt === 2) throw error;
        result = await this.store.apply(intent, now);
      }
    }
    return result;
  }

  activateCasinoInGeo(
    input: Omit<MarketActivationIntentInput, "desiredState">,
    now = new Date(),
  ) {
    return this.setDesiredState({ ...input, desiredState: "ACTIVE" }, now);
  }

  disableCasinoInGeo(
    input: Omit<MarketActivationIntentInput, "desiredState">,
    now = new Date(),
  ) {
    return this.setDesiredState({ ...input, desiredState: "DISABLED" }, now);
  }

  launchCasinoMarket(
    input: Omit<MarketActivationIntentInput, "desiredState">,
    now = new Date(),
  ) {
    return this.activateCasinoInGeo(input, now);
  }

  async applyBatch(inputs: MarketActivationIntentInput[], now = new Date()) {
    const keys = new Set<string>();
    for (const input of inputs) {
      const key = input.idempotencyKey.trim();
      if (keys.has(key)) throw new Error("MARKET_ACTIVATION_BATCH_DUPLICATE_IDEMPOTENCY_KEY");
      keys.add(key);
    }
    return Promise.all(inputs.map(async (input, index) => {
      const identity = {
        index,
        casinoId: input.casinoId ?? null,
        casinoSlug: input.casinoSlug ?? null,
        countryCode: input.countryCode.trim().toUpperCase(),
        product: input.product ?? "CASINO",
      };
      try {
        return { ...identity, ok: true as const, result: await this.setDesiredState(input, now) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const reasonCode = /^MARKET_ACTIVATION_[A-Z0-9_]+$/.test(message)
          ? message
          : "MARKET_ACTIVATION_BATCH_ITEM_FAILED";
        return { ...identity, ok: false as const, reasonCode };
      }
    }));
  }
}

export const marketActivationController = new MarketActivationController();

export function activateCasinoInGeo(input: Omit<MarketActivationIntentInput, "desiredState">, now = new Date()) {
  return marketActivationController.activateCasinoInGeo(input, now);
}

export function launchCasinoMarket(input: Omit<MarketActivationIntentInput, "desiredState">, now = new Date()) {
  return marketActivationController.launchCasinoMarket(input, now);
}
