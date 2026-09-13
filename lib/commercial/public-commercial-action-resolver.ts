import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { scopedCasinoReferralAllowed } from "@/lib/jurisdiction/scoped-commercial-authority";
import type { GbOperatorEligibilityDecision } from "@/lib/jurisdiction/gb-operator-eligibility";
import { marketActivationRuntime, type MarketActivationRuntime } from "@/lib/market-activation/runtime";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import {
  canonicalGbOperatorEligibilityContext,
  gbOperatorEligibilityService,
  type GbOperatorEligibilityAuthority,
  type GbOperatorEligibilityEvidenceContext,
} from "@/lib/services/gb-operator-eligibility.service";

import type {
  CommercialActionDecision,
  CommercialActionDecisionReason,
} from "./governed-commercial-action";

export type PublicCommercialActionSubject = Readonly<{
  casinoId: string;
  casinoSlug: string;
  published: boolean;
}>;

export type ResolvePublicCommercialActionsInput = Readonly<{
  subjects: readonly PublicCommercialActionSubject[];
  authority?: CommercialJurisdictionAuthority | null;
  countryCode?: string | null;
  marketCode?: string | null;
  product: "CASINO";
  now?: Date;
}>;

export interface PublicCommercialActionAuthority {
  resolveMany(input: ResolvePublicCommercialActionsInput): Promise<Map<string, CommercialActionDecision>>;
}

function unavailable(reasonCode: CommercialActionDecisionReason): CommercialActionDecision {
  return { action: null, reasonCode };
}

function normalizedCountry(value: string | null | undefined) {
  const country = value?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

function normalizedMarket(value: string | null | undefined, countryCode: string | null) {
  const market = value?.trim().toUpperCase().replace(/_/g, "-") || countryCode;
  return market
    && /^[A-Z]{2}(?:-[A-Z0-9]{1,12})?$/.test(market)
    && market.slice(0, 2) === countryCode
    ? market
    : null;
}

/**
 * Canonical public commercial-decision seam.
 *
 * MarketActivation remains PR1's transitional route source and owns low-level
 * lifecycle, health, binding, destination and GEO fallback checks. This
 * resolver adds the public publication, trusted-market, legal and GB evidence
 * boundaries exactly once before projecting the sole nullable public action.
 */
export class PublicCommercialActionResolver implements PublicCommercialActionAuthority {
  constructor(
    private readonly routes: Pick<MarketActivationRuntime, "listPublicRoutes"> = marketActivationRuntime,
    private readonly gbOperatorEligibility: GbOperatorEligibilityAuthority = gbOperatorEligibilityService,
    private readonly redirectEnabled: () => boolean = isAffiliateRedirectEnabled,
  ) {}

  async resolveMany(input: ResolvePublicCommercialActionsInput) {
    const subjects = [...new Map(input.subjects.map((subject) => [subject.casinoId, subject])).values()];
    const decisions = new Map<string, CommercialActionDecision>();
    if (!subjects.length) return decisions;

    const countryCode = normalizedCountry(input.countryCode);
    const marketCode = normalizedMarket(input.marketCode, countryCode);
    const authorityMatches = Boolean(countryCode && input.authority?.countryCode === countryCode);
    const redirectEnabled = this.redirectEnabled();

    const candidates = subjects.filter((subject) => {
      if (!subject.published) {
        decisions.set(subject.casinoId, unavailable("PRODUCT_NOT_PUBLISHED"));
        return false;
      }
      if (isTemporaryDemoCasinoId(subject.casinoId)) {
        decisions.set(subject.casinoId, unavailable("DEMONSTRATION_RECORD"));
        return false;
      }
      if (!countryCode || !marketCode || !authorityMatches) {
        decisions.set(subject.casinoId, unavailable("MARKET_CONTEXT_INVALID"));
        return false;
      }
      if (!redirectEnabled) {
        decisions.set(subject.casinoId, unavailable("REDIRECT_ENGINE_DISABLED"));
        return false;
      }
      if (!scopedCasinoReferralAllowed(input.authority, subject.casinoSlug)) {
        decisions.set(subject.casinoId, unavailable(input.authority?.reasonCode ?? "UNKNOWN_LOCATION"));
        return false;
      }
      return true;
    });

    if (!candidates.length || !countryCode || !marketCode) return decisions;

    let routes: Awaited<ReturnType<MarketActivationRuntime["listPublicRoutes"]>>;
    try {
      routes = await this.routes.listPublicRoutes(
        candidates.map((subject) => subject.casinoId),
        marketCode,
        input.now,
      );
    } catch {
      for (const subject of candidates) decisions.set(subject.casinoId, unavailable("NO_GOVERNED_ROUTE"));
      return decisions;
    }

    const routesByCasino = new Map<string, typeof routes>();
    for (const route of routes) {
      routesByCasino.set(route.casinoId, [...(routesByCasino.get(route.casinoId) ?? []), route]);
    }

    let gbDecisions = new Map<string, GbOperatorEligibilityDecision>();
    if (countryCode === "GB") {
      const routeContexts = new Map<string, GbOperatorEligibilityEvidenceContext>();
      for (const subject of candidates) {
        const route = routesByCasino.get(subject.casinoId)?.[0];
        routeContexts.set(
          subject.casinoId,
          canonicalGbOperatorEligibilityContext(route?.operatorEligibilityContext),
        );
      }
      try {
        gbDecisions = await this.gbOperatorEligibility.evaluateMany(
          candidates.map((subject) => subject.casinoId),
          input.now ?? new Date(),
          routeContexts,
        );
      } catch {
        for (const subject of candidates) {
          decisions.set(subject.casinoId, unavailable("EVIDENCE_SOURCE_UNAVAILABLE"));
        }
        return decisions;
      }
    }

    for (const subject of candidates) {
      const casinoRoutes = routesByCasino.get(subject.casinoId) ?? [];
      const uniqueRoutes = [...new Map(casinoRoutes.map((route) => [route.slug, route])).values()];
      if (!uniqueRoutes.length) {
        decisions.set(subject.casinoId, unavailable("NO_GOVERNED_ROUTE"));
        continue;
      }
      if (uniqueRoutes.length !== 1) {
        decisions.set(subject.casinoId, unavailable("AMBIGUOUS_GOVERNED_ROUTE"));
        continue;
      }
      const route = uniqueRoutes[0];
      if (!route?.slug || !isSafePublicSlug(route.slug)) {
        decisions.set(subject.casinoId, unavailable("UNSAFE_GOVERNED_ROUTE"));
        continue;
      }
      if (countryCode === "GB") {
        const operatorDecision = gbDecisions.get(subject.casinoId);
        if (!operatorDecision?.referralEligible) {
          decisions.set(
            subject.casinoId,
            unavailable(operatorDecision?.reasonCodes[0] ?? "EVIDENCE_SOURCE_UNAVAILABLE"),
          );
          continue;
        }
      }
      decisions.set(subject.casinoId, {
        action: { href: `/r/${route.slug}` },
        reasonCode: "AVAILABLE",
      });
    }

    return decisions;
  }
}

export const publicCommercialActionResolver = new PublicCommercialActionResolver();
