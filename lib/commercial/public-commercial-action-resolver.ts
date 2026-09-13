import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import type { GbCommercialReadinessDecision } from "@/lib/affiliate-commercial/gb-commercial-route-readiness";
import { worldwideFounderGbAuthorityApplies } from "@/lib/current-partner-worldwide-authority/inventory";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { canonicalCommercialMarketKey } from "@/lib/jurisdiction/canonical-commercial-market";
import { scopedCasinoReferralAllowed } from "@/lib/jurisdiction/scoped-commercial-authority";
import { marketActivationRuntime, type MarketActivationRuntime } from "@/lib/market-activation/runtime";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import {
  gbCommercialReadinessService,
  type GbCommercialReadinessAuthority,
} from "@/lib/services/gb-commercial-readiness.service";

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

/**
 * Canonical public commercial-decision seam.
 *
 * Trusted presentation GEO is normalized once here. MarketActivation then
 * performs one exact lookup and owns low-level health, binding and destination
 * checks. This resolver adds publication, legal and GB evidence boundaries
 * before projecting the sole nullable public action.
 */
export class PublicCommercialActionResolver implements PublicCommercialActionAuthority {
  constructor(
    private readonly routes: Pick<MarketActivationRuntime, "listPublicRoutes"> = marketActivationRuntime,
    private readonly gbCommercialReadiness: GbCommercialReadinessAuthority = gbCommercialReadinessService,
    private readonly redirectEnabled: () => boolean = isAffiliateRedirectEnabled,
  ) {}

  async resolveMany(input: ResolvePublicCommercialActionsInput) {
    const subjects = [...new Map(input.subjects.map((subject) => [subject.casinoId, subject])).values()];
    const decisions = new Map<string, CommercialActionDecision>();
    if (!subjects.length) return decisions;

    const countryCode = normalizedCountry(input.countryCode);
    const authorityMatches = Boolean(countryCode && input.authority?.countryCode === countryCode);
    const marketCode = canonicalCommercialMarketKey({
      countryCode,
      marketCode: input.marketCode ?? countryCode,
      trust: authorityMatches ? "TRUSTED" : "UNTRUSTED",
    });
    const redirectEnabled = this.redirectEnabled();

    const candidates = subjects.filter((subject) => {
      if (!subject.published) {
        decisions.set(subject.casinoId, unavailable("PRODUCT_NOT_PUBLISHED"));
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

    let gbDecisions = new Map<string, GbCommercialReadinessDecision>();
    if (countryCode === "GB") {
      try {
        const now = input.now ?? new Date();
        const requests = candidates.flatMap((subject) => {
          const route = routesByCasino.get(subject.casinoId)?.[0];
          const context = route?.gbCommercialReadinessContext;
          return context && input.authority ? [{
            casinoId: subject.casinoId,
            route: context.route,
            jurisdictionDecision: input.authority,
            redirectContract: context.redirectContract,
            founderWorldwideAuthority: worldwideFounderGbAuthorityApplies(subject.casinoSlug),
            now,
          }] : [];
        });
        gbDecisions = await this.gbCommercialReadiness.evaluateMany(requests);
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
        const readiness = gbDecisions.get(subject.casinoId);
        if (!readiness?.referralReady) {
          decisions.set(
            subject.casinoId,
            unavailable(readiness?.reasonCodes[0] ?? "GB_COMMERCIAL_EVIDENCE_UNAVAILABLE"),
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
