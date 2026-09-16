import type { AffiliateRouteHealthStatus } from "@/lib/affiliate-health/checker";
import { marketActivationRouteVerifier, type MarketActivationRouteVerifierPort } from "@/lib/market-activation/verifier";
import { affiliateRouteHealthRepository, type AffiliateRouteHealthClaim, type AffiliateRouteHealthClaimStore } from "@/lib/repositories/affiliate-route-health.repository";

import { ValidationError } from "./service-error";

export interface AffiliateRouteHealthResult {
  routeKey: string;
  casinoId: string;
  casinoSlug: string;
  countryCode: string;
  marketCode: string;
  redirectId: string | null;
  redirectSlug: string | null;
  offerId: string | null;
  trackingLinkId: string | null;
  status: AffiliateRouteHealthStatus;
  reason: string;
  method: "HEAD" | "GET" | null;
  statusCode: number | null;
  durationMs: number | null;
  redirectCount: number | null;
  finalHost: string | null;
  verificationSource: "DIRECT" | null;
  checkedAt: string;
  lastDirectSuccessAt: string | null;
  evidenceRevision: string;
}

function routeKey(claim: AffiliateRouteHealthClaim) {
  return `${claim.casinoSlug}:${claim.marketCode}:${claim.redirectSlug ?? "missing-redirect"}:${claim.activationId}`;
}

function lastPersistedDirectSuccess(claim: AffiliateRouteHealthClaim) {
  return claim.persistedVerificationStatus === "HEALTHY" ? claim.persistedLastCheckedAt?.toISOString() ?? null : null;
}

function evidenceRevision(claim: AffiliateRouteHealthClaim) {
  return `market-activation:${claim.activationId}:v${claim.activationVersion}`;
}

function unavailableResult(claim: AffiliateRouteHealthClaim, status: AffiliateRouteHealthStatus, reason: string, checkedAt: Date): AffiliateRouteHealthResult {
  return {
    routeKey: routeKey(claim),
    casinoId: claim.casinoId,
    casinoSlug: claim.casinoSlug,
    countryCode: claim.countryCode,
    marketCode: claim.marketCode,
    redirectId: claim.redirectId,
    redirectSlug: claim.redirectSlug,
    offerId: claim.offerId,
    trackingLinkId: claim.trackingLinkId,
    status,
    reason,
    method: null,
    statusCode: null,
    durationMs: null,
    redirectCount: null,
    finalHost: null,
    verificationSource: null,
    checkedAt: checkedAt.toISOString(),
    lastDirectSuccessAt: lastPersistedDirectSuccess(claim),
    evidenceRevision: evidenceRevision(claim),
  };
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, callback: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

export class AffiliateRouteHealthService {
  constructor(
    private readonly claims: AffiliateRouteHealthClaimStore = affiliateRouteHealthRepository,
    private readonly verifier: MarketActivationRouteVerifierPort = marketActivationRouteVerifier,
  ) {}

  private async checkClaim(claim: AffiliateRouteHealthClaim, now: Date): Promise<AffiliateRouteHealthResult> {
    if (!claim.offerId || !claim.trackingLinkId || !claim.redirectId || !claim.redirectSlug) {
      return unavailableResult(claim, "BROKEN", "ACTIVE_ACTIVATION_RELATIONSHIP_MISSING", now);
    }
    try {
      const checked = await this.verifier.verify(claim.activationId, now);
      return {
        routeKey: routeKey(claim),
        casinoId: claim.casinoId,
        casinoSlug: claim.casinoSlug,
        countryCode: claim.countryCode,
        marketCode: claim.marketCode,
        redirectId: claim.redirectId,
        redirectSlug: claim.redirectSlug,
        offerId: claim.offerId,
        trackingLinkId: claim.trackingLinkId,
        status: checked.status,
        reason: checked.reason,
        method: checked.method,
        statusCode: checked.statusCode,
        durationMs: checked.durationMs,
        redirectCount: checked.redirectCount,
        finalHost: checked.finalHost,
        verificationSource: "DIRECT",
        checkedAt: checked.checkedAt.toISOString(),
        lastDirectSuccessAt: checked.status === "HEALTHY" ? checked.checkedAt.toISOString() : lastPersistedDirectSuccess(claim),
        evidenceRevision: evidenceRevision(claim),
      };
    } catch {
      return unavailableResult(claim, "DEGRADED", "ROUTE_VERIFICATION_INCONCLUSIVE", now);
    }
  }

  async run(filters: { casino?: string; countryCode?: string; marketCode?: string; now?: Date } = {}) {
    const countryCode = filters.countryCode?.trim().toUpperCase();
    if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) throw new ValidationError("countryCode must be an ISO alpha-2 code");
    const marketCode = filters.marketCode?.trim().toUpperCase().replace(/_/g, "-");
    if (marketCode && !/^[A-Z]{2}(?:-[A-Z0-9]{1,12})?$/.test(marketCode)) throw new ValidationError("marketCode must be an ISO country or subdivision code");
    if (countryCode && marketCode && marketCode.slice(0, 2) !== countryCode) throw new ValidationError("marketCode must belong to countryCode");
    const now = filters.now ?? new Date();
    const claims = await this.claims.listClaims({ casino: filters.casino?.trim() || undefined, countryCode, marketCode, now });
    const results = await mapConcurrent(claims, 5, (claim) => this.checkClaim(claim, now));
    const statuses = ["HEALTHY", "DEGRADED", "EXTERNAL_CHALLENGE", "BROKEN", "EXPIRED", "CROSS_GEO", "ATTRIBUTION_FAILURE"] as const;
    const summary = Object.fromEntries(statuses.map((status) => [status, results.filter((result) => result.status === status).length])) as Record<AffiliateRouteHealthStatus, number>;
    const healthy = results.every((result) => result.status === "HEALTHY");
    return {
      authorityVersion: "affiliate-route-health-report.v2",
      checkedAt: now.toISOString(),
      healthy,
      noActiveRoutes: results.length === 0,
      filters: { casino: filters.casino?.trim() || null, countryCode: countryCode ?? null, marketCode: marketCode ?? null },
      summary: { routes: results.length, ...summary },
      results,
    } as const;
  }
}

export const affiliateRouteHealthService = new AffiliateRouteHealthService();
