import type { AffiliateRouteHttpCheck } from "@/lib/affiliate-health/checker";
import { checkAffiliateRouteHttp } from "@/lib/affiliate-health/checker";
import { assertPublicNetworkUrl } from "@/lib/affiliate-health/public-network-url";
import {
  normalizePartnerTrackingMarkets,
  partnerTrackingLinkHash,
  type PartnerTrackingRegistrationInput,
  type PartnerTrackingRegistrationResult,
  type PartnerTrackingRegistrationResultRow,
} from "@/lib/commercial/partner-tracking-registration-contract";
import { founderRouteVerificationEvidence } from "@/lib/commercial/founder-route-verification-evidence";
import { jurisdictionResolver } from "@/lib/jurisdiction/resolver";
import { exactSubdivisionCommercialAuthority } from "@/lib/jurisdiction/exact-market-authority";
import { worldwideFounderGbAuthorityApplies } from "@/lib/current-partner-worldwide-authority/inventory";
import { marketActivationController } from "@/lib/market-activation/controller";
import type { MarketActivationRouteVerificationResult } from "@/lib/market-activation/contract";
import {
  partnerTrackingRegistrationRepository,
  type PartnerTrackingRegistrationRepository,
  type PartnerTrackingStage,
} from "@/lib/repositories/partner-tracking-registration.repository";
import { ServiceError, ValidationError } from "@/lib/services/service-error";

export type PartnerTrackingRegistrationContext = {
  actorId: string;
  auditSource: "COMMERCIAL_MCP" | "INTERNAL_APPLICATION";
  correlationId?: string;
};

type RegistrationRepositoryPort = Pick<PartnerTrackingRegistrationRepository,
  "resolveTarget" | "stage" | "recordVerification" | "promote" | "finalizePromotion" | "rejectPromotion" | "recordAudit">;

type ActivationControllerPort = {
  activateCasinoInGeo(input: {
    casinoId: string;
    countryCode: string;
    product: "CASINO";
    redirectSlugId: string;
    affiliateOfferId: string;
    primaryTrackingLinkId: string;
    actorId: string;
    origin: "ADMIN";
    reason: string;
    sourceReferences: string[];
    idempotencyKey: string;
  }, now?: Date, preverifiedRoute?: MarketActivationRouteVerificationResult | null): Promise<{
    activation: {
      id: string;
      desiredState: string;
      status: string;
      routeVerificationStatus: string;
      routeVerificationDetail: string | null;
      externalBlockerSource: string | null;
    };
  }>;
};

type RouteChecker = typeof checkAffiliateRouteHttp;

type JurisdictionResolverPort = {
  resolve(input: {
    requestCountrySignal: { countryCode: string; trust: "TRUSTED"; observedAt: Date };
    userSelectedCountry: null;
    accountCountry: null;
    routeCountryOrMarketSlug: null;
    administrativeOverride: null;
    policyVersion: null;
    now: Date;
  }): Promise<{ countryCode: string | null; commercialAllowed: boolean; referralAllowed: boolean; reasonCode: string }>;
};

function safeTrackingUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ValidationError("Tracking URL is invalid", { reason: "PARTNER_TRACKING_URL_INVALID" });
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.href.length > 4_096) {
    throw new ValidationError("Tracking URL is not a credential-free HTTPS URL", { reason: "PARTNER_TRACKING_URL_UNSAFE" });
  }
  if (/[\u0000-\u001f\u007f]/.test(value) || /%0d|%0a/i.test(value) || value.includes("\\")) {
    throw new ValidationError("Tracking URL is unsafe", { reason: "PARTNER_TRACKING_URL_UNSAFE" });
  }
  return parsed;
}

function transientVerification(result: AffiliateRouteHttpCheck) {
  return result.statusCode === null && ["NETWORK_ERROR", "TIMEOUT"].includes(result.reason);
}

type OperationalRestriction = { finalState: "BLOCKED_BY_LAW" | "ACTION_REQUIRED_REGULATORY"; reason: string };

function preservedOrFailedRows(
  stage: PartnerTrackingStage,
  outcome: "BROKEN" | "INCONCLUSIVE",
  restrictions: Map<string, OperationalRestriction>,
) {
  return stage.affectedRows.map<PartnerTrackingRegistrationResultRow>((row) => {
    const restriction = restrictions.get(row.geo);
    if (restriction) {
      return { geo: row.geo, marketSupport: row.marketSupport, finalState: restriction.finalState, marketActivationId: null, routeHealth: "NOT_APPLICABLE", reason: restriction.reason };
    }
    const existing = stage.previousActivations.find((activation) => activation.geo === row.geo);
    if (existing) {
      return {
        geo: row.geo,
        marketSupport: row.marketSupport,
        finalState: "ACTIVE_HEALTHY",
        marketActivationId: existing.id,
        routeHealth: "HEALTHY",
        reason: "Existing healthy canonical route retained; the candidate was not promoted.",
      };
    }
    return outcome === "BROKEN"
      ? { geo: row.geo, marketSupport: row.marketSupport, finalState: "BROKEN_ROUTE", marketActivationId: null, routeHealth: "BROKEN", reason: "Partner route failed bounded verification and was not activated." }
      : { geo: row.geo, marketSupport: row.marketSupport, finalState: "MISSING_TRACKING_ROUTE", marketActivationId: null, routeHealth: "NOT_APPLICABLE", reason: "Verification infrastructure was inconclusive; retry without changing terminal commercial state." };
  });
}

function registrationResponse(input: {
  stage: PartnerTrackingStage;
  status: PartnerTrackingRegistrationResult["status"];
  verification: PartnerTrackingRegistrationResult["verification"];
  finalHost: string | null;
  redirectCount: number | null;
  checkedAt: Date;
  results: PartnerTrackingRegistrationResultRow[];
}): PartnerTrackingRegistrationResult {
  return {
    status: input.status,
    partner: input.stage.target.partner,
    partnerId: input.stage.target.partnerId,
    casino: input.stage.target.casino,
    casinoId: input.stage.target.casinoId,
    partnerCasinoRelationshipId: input.stage.partnerCasinoRelationshipId,
    trackingScope: input.stage.scope,
    geo: input.stage.geo,
    supportedGeos: input.stage.supportedGeos,
    newSupportedGeoCount: input.stage.newSupportedGeoCount,
    existingSupportedGeoCount: input.stage.existingSupportedGeoCount,
    linkHash: input.stage.linkHash,
    trackingLinkId: input.stage.trackingLinkId,
    affiliateOfferId: input.stage.affiliateOfferId,
    internalRedirect: input.stage.internalRedirect,
    verification: input.verification,
    finalHost: input.finalHost,
    redirectCount: input.redirectCount,
    verificationTimestamp: input.checkedAt.toISOString(),
    affectedGeoCount: input.results.length,
    results: input.results,
  };
}

export class PartnerTrackingRegistrationService {
  constructor(
    private readonly repository: RegistrationRepositoryPort = partnerTrackingRegistrationRepository,
    private readonly checker: RouteChecker = checkAffiliateRouteHttp,
    private readonly activationController: ActivationControllerPort = marketActivationController,
    private readonly publicUrlValidator: (url: URL) => Promise<void> = assertPublicNetworkUrl,
    private readonly jurisdiction: JurisdictionResolverPort = jurisdictionResolver,
  ) {}

  private async operationalRestrictions(stage: PartnerTrackingStage, now: Date) {
    const entries: Array<readonly [string, OperationalRestriction] | null> = await Promise.all(stage.affectedRows.map(async (row) => {
      if (row.legalState === "BLOCKED_BY_LAW") {
        return [row.geo, { finalState: "BLOCKED_BY_LAW", reason: row.reason }] as const;
      }
      if (row.legalState === "ACTION_REQUIRED_REGULATORY") {
        return [row.geo, { finalState: "ACTION_REQUIRED_REGULATORY", reason: row.reason }] as const;
      }
      const decision = await this.jurisdiction.resolve({
        requestCountrySignal: { countryCode: row.geo.slice(0, 2), trust: "TRUSTED", observedAt: now },
        userSelectedCountry: null,
        accountCountry: null,
        routeCountryOrMarketSlug: null,
        administrativeOverride: null,
        policyVersion: null,
        now,
      });
      if (row.geo.includes("-") && !exactSubdivisionCommercialAuthority({
        casinoSlug: stage.target.casinoSlug,
        marketCode: row.geo,
        parentDecision: decision,
      }).allowed) {
        return [row.geo, {
          finalState: "ACTION_REQUIRED_REGULATORY",
          reason: "Exact detected subdivision legal authority is required before this market can expose a CTA.",
        }] as const;
      }
      const scopedFounderGbOverride = row.geo === "GB"
        && worldwideFounderGbAuthorityApplies(stage.target.casinoSlug)
        && ["COMMERCIAL_NOT_ACTIVE", "POLICY_STALE"].includes(decision.reasonCode);
      if ((!decision.commercialAllowed || !decision.referralAllowed) && !scopedFounderGbOverride) {
        return [row.geo, {
          finalState: "ACTION_REQUIRED_REGULATORY",
          reason: `Current jurisdiction authority denies commercial/referral capability: ${decision.reasonCode}.`,
        }] as const;
      }
      return null;
    }));
    return new Map<string, OperationalRestriction>(
      entries.filter((entry): entry is readonly [string, OperationalRestriction] => entry !== null),
    );
  }

  async register(
    input: PartnerTrackingRegistrationInput,
    context: PartnerTrackingRegistrationContext,
    now = new Date(),
  ): Promise<PartnerTrackingRegistrationResult> {
    let geo: string | null;
    let supportedGeos: string[] | null;
    let requestedGeos: string[] | null;
    try {
      ({ geo, supportedGeos, requestedGeos } = normalizePartnerTrackingMarkets(input));
    } catch {
      throw new ValidationError("GEO is invalid", { reason: "PARTNER_TRACKING_GEO_INVALID" });
    }
    const target = await this.repository.resolveTarget({
      partner: input.partner,
      casino: input.casino,
      requestedGeos,
    });
    const scope = geo ? "EXACT_GEO" : "GENERIC";
    const trackingUrl = safeTrackingUrl(input.trackingUrl);
    const founderVerification = founderRouteVerificationEvidence(input);
    if (!founderVerification) {
      try {
        await this.publicUrlValidator(trackingUrl);
      } catch (error) {
        if (error instanceof Error && error.message === "UNSAFE_HEALTH_TARGET") {
          throw new ValidationError("Tracking URL resolves to an unsafe network target", { reason: "PARTNER_TRACKING_URL_UNSAFE" });
        }
        throw new ServiceError("Tracking URL safety validation is temporarily unavailable", "PARTNER_TRACKING_VERIFICATION_INCONCLUSIVE", 503, { retriable: true });
      }
    }
    const linkHash = partnerTrackingLinkHash(trackingUrl.href);
    const stage = await this.repository.stage({
      target,
      trackingUrl: trackingUrl.href,
      linkHash,
      scope,
      geo,
      supportedGeos,
      actorId: context.actorId,
      now,
    });
    const restrictions = await this.operationalRestrictions(stage, now);

    let verification: AffiliateRouteHttpCheck | null = founderVerification;
    if (!verification) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        verification = await this.checker({
          url: trackingUrl,
          expectation: {
            expectedFinalHost: stage.expectedFinalHost,
            expectedPathPrefix: null,
            requiredAttributionParameters: stage.requiredAttributionParameters,
            allowWwwEquivalentFinalHost: true,
          },
          timeoutMs: 12_000,
          inspectTerminalContent: true,
        });
        if (!transientVerification(verification)) break;
      }
    }
    if (!verification) throw new Error("PARTNER_TRACKING_VERIFIER_NO_RESULT");
    const checkedAt = new Date();
    const inconclusive = transientVerification(verification);
    const healthy = verification.status === "HEALTHY";
    const boundedOutcome = healthy ? "HEALTHY" : inconclusive ? "INCONCLUSIVE" : "BROKEN";
    await this.repository.recordVerification({
      stage,
      verification: boundedOutcome,
      reason: verification.reason,
      finalHost: verification.finalHost,
      redirectCount: verification.redirectCount,
      statusCode: verification.statusCode,
      checkedAt,
      actorId: context.actorId,
    });

    if (!healthy) {
      const results = preservedOrFailedRows(stage, inconclusive ? "INCONCLUSIVE" : "BROKEN", restrictions);
      await this.repository.recordAudit({
        stage,
        verification: inconclusive ? "INCONCLUSIVE" : "BROKEN",
        previousTrackingLinkId: stage.previousTrackingLinkIds[0] ?? null,
        results,
        actorId: context.actorId,
        auditSource: context.auditSource,
        correlationId: context.correlationId,
        now: checkedAt,
      });
      return registrationResponse({
        stage,
        status: inconclusive ? "RETRY" : "NOT_PROMOTED",
        verification: inconclusive ? "INCONCLUSIVE" : "BROKEN",
        finalHost: verification.finalHost,
        redirectCount: verification.redirectCount,
        checkedAt,
        results,
      });
    }
    if (!verification.finalHost) throw new Error("PARTNER_TRACKING_HEALTHY_FINAL_HOST_MISSING");
    const preverifiedRoute: MarketActivationRouteVerificationResult = {
      status: verification.status,
      reason: verification.reason,
      checkedAt,
      method: verification.method,
      statusCode: verification.statusCode,
      durationMs: verification.durationMs,
      redirectCount: verification.redirectCount,
      finalHost: verification.finalHost,
    };
    const promotion = stage.alreadyCanonical
      ? { ...stage, previousTrackingLinkId: null }
      : await this.repository.promote({
          stage,
          finalHost: verification.finalHost,
          redirectCount: verification.redirectCount,
          checkedAt,
          actorId: context.actorId,
        });

    const results: PartnerTrackingRegistrationResultRow[] = [];
    const attemptedActivationIds = new Map<string, string>();
    let activationIncomplete = false;
    let candidateRouteBroken = false;
    let controllerFailureReason = "RFC_042_ROUTE_VERIFICATION_FAILED";
    for (const row of stage.affectedRows) {
      const restriction = restrictions.get(row.geo);
      if (restriction) {
        results.push({ geo: row.geo, marketSupport: row.marketSupport, finalState: restriction.finalState, marketActivationId: null, routeHealth: "NOT_APPLICABLE", reason: restriction.reason });
        continue;
      }
      const result = await this.activationController.activateCasinoInGeo({
        casinoId: target.casinoId,
        countryCode: row.geo,
        product: "CASINO",
        redirectSlugId: stage.redirectId,
        affiliateOfferId: stage.affiliateOfferId,
        primaryTrackingLinkId: stage.trackingLinkId,
        actorId: context.actorId,
        origin: "ADMIN",
        reason: `${REGISTRATION_VERSION}: verified partner-provided route for ${target.partner} / ${target.casino} / ${row.geo}.`,
        sourceReferences: [...new Set([...row.evidenceReferences, `FOUNDER_SUPPLIED_PARTNER_URL:${linkHash}`])],
        idempotencyKey: `${REGISTRATION_VERSION}:${target.partnerId}:${target.casinoId}:${row.geo}:${linkHash}`,
      }, checkedAt, preverifiedRoute);
      attemptedActivationIds.set(row.geo, result.activation.id);
      if (result.activation.status === "ACTIVE" && result.activation.routeVerificationStatus === "HEALTHY") {
        results.push({
          geo: row.geo,
          marketSupport: row.marketSupport,
          finalState: "ACTIVE_HEALTHY",
          marketActivationId: result.activation.id,
          routeHealth: "HEALTHY",
          reason: "RFC-042 canonical MarketActivation converged to ACTIVE + HEALTHY.",
        });
      } else if (result.activation.externalBlockerSource === "AffiliateRouteHealth") {
        candidateRouteBroken = true;
        controllerFailureReason = result.activation.routeVerificationDetail || controllerFailureReason;
        results.push({
          geo: row.geo,
          marketSupport: row.marketSupport,
          finalState: "BROKEN_ROUTE",
          marketActivationId: result.activation.id,
          routeHealth: "BROKEN",
          reason: "RFC-042 route verification did not establish a healthy canonical route.",
        });
        break;
      } else {
        activationIncomplete = true;
        results.push({
          geo: row.geo,
          marketSupport: row.marketSupport,
          finalState: stage.previousActivations.some((activation) => activation.geo === row.geo) ? "ACTIVE_HEALTHY" : "MISSING_TRACKING_ROUTE",
          marketActivationId: result.activation.id,
          routeHealth: stage.previousActivations.some((activation) => activation.geo === row.geo) ? "HEALTHY" : "NOT_APPLICABLE",
          reason: "RFC-042 convergence is retriable; no terminal technical business state was created.",
        });
      }
    }

    if (candidateRouteBroken) {
      let rollbackResults: PartnerTrackingRegistrationResultRow[];
      if (stage.alreadyCanonical) {
        rollbackResults = stage.affectedRows.map((row) => {
          const restriction = restrictions.get(row.geo);
          return restriction
            ? { geo: row.geo, marketSupport: row.marketSupport, finalState: restriction.finalState, marketActivationId: null, routeHealth: "NOT_APPLICABLE", reason: restriction.reason }
            : {
                geo: row.geo,
                marketSupport: row.marketSupport,
                finalState: "BROKEN_ROUTE",
                marketActivationId: attemptedActivationIds.get(row.geo) ?? null,
                routeHealth: "BROKEN",
                reason: "The existing canonical route failed RFC-042 verification.",
              };
        });
      } else {
        rollbackResults = [];
        for (const row of stage.affectedRows) {
          const restriction = restrictions.get(row.geo);
          if (restriction) {
            rollbackResults.push({ geo: row.geo, marketSupport: row.marketSupport, finalState: restriction.finalState, marketActivationId: null, routeHealth: "NOT_APPLICABLE", reason: restriction.reason });
            continue;
          }
          const previous = stage.previousActivations.find((activation) => activation.geo === row.geo);
          if (previous && attemptedActivationIds.has(row.geo)) {
            const restored = await this.activationController.activateCasinoInGeo({
              casinoId: target.casinoId,
              countryCode: row.geo,
              product: "CASINO",
              redirectSlugId: previous.redirectId,
              affiliateOfferId: previous.affiliateOfferId,
              primaryTrackingLinkId: previous.trackingLinkId,
              actorId: context.actorId,
              origin: "ADMIN",
              reason: `${REGISTRATION_VERSION}: restore previous healthy route after candidate verification failure.`,
              sourceReferences: [`${REGISTRATION_VERSION}:ROLLBACK`, `TRACKING_LINK:${previous.trackingLinkId}`],
              idempotencyKey: `${REGISTRATION_VERSION}:ROLLBACK:${target.casinoId}:${row.geo}:${linkHash}`,
            }, checkedAt);
            if (restored.activation.status !== "ACTIVE" || restored.activation.routeVerificationStatus !== "HEALTHY") {
              throw new Error("PARTNER_TRACKING_ROLLBACK_DID_NOT_CONVERGE");
            }
            rollbackResults.push({
              geo: row.geo,
              marketSupport: row.marketSupport,
              finalState: "ACTIVE_HEALTHY",
              marketActivationId: restored.activation.id,
              routeHealth: "HEALTHY",
              reason: "Previous healthy canonical route restored after candidate verification failure.",
            });
          } else if (previous) {
            rollbackResults.push({
              geo: row.geo,
              marketSupport: row.marketSupport,
              finalState: "ACTIVE_HEALTHY",
              marketActivationId: previous.id,
              routeHealth: "HEALTHY",
              reason: "Previous healthy canonical route remained unchanged.",
            });
          } else {
            rollbackResults.push({
              geo: row.geo,
              marketSupport: row.marketSupport,
              finalState: "BROKEN_ROUTE",
              marketActivationId: attemptedActivationIds.get(row.geo) ?? null,
              routeHealth: "BROKEN",
              reason: "Candidate failed RFC-042 verification and no prior healthy route existed.",
            });
          }
        }
        await this.repository.rejectPromotion({
          stage,
          reason: controllerFailureReason,
          checkedAt,
          actorId: context.actorId,
        });
      }
      await this.repository.recordAudit({
        stage,
        verification: "BROKEN",
        previousTrackingLinkId: promotion.previousTrackingLinkId,
        results: rollbackResults,
        actorId: context.actorId,
        auditSource: context.auditSource,
        correlationId: context.correlationId,
        now: checkedAt,
      });
      return registrationResponse({
        stage,
        status: "NOT_PROMOTED",
        verification: "BROKEN",
        finalHost: verification.finalHost,
        redirectCount: verification.redirectCount,
        checkedAt,
        results: rollbackResults,
      });
    }

    if (!activationIncomplete) {
      await this.repository.finalizePromotion({ stage, checkedAt, actorId: context.actorId });
    }

    const auditVerification = stage.alreadyCanonical ? "ALREADY_REGISTERED" : "HEALTHY";
    await this.repository.recordAudit({
      stage,
      verification: auditVerification,
      previousTrackingLinkId: promotion.previousTrackingLinkId,
      results,
      actorId: context.actorId,
      auditSource: context.auditSource,
      correlationId: context.correlationId,
      now: checkedAt,
    });
    return registrationResponse({
      stage,
      status: activationIncomplete ? "RETRY" : stage.alreadyCanonical ? "NO_CHANGE" : "REGISTERED",
      verification: stage.alreadyCanonical ? "ALREADY_REGISTERED" : "HEALTHY",
      finalHost: verification.finalHost,
      redirectCount: verification.redirectCount,
      checkedAt,
      results,
    });
  }
}

const REGISTRATION_VERSION = "PARTNER-TRACKING-REGISTRATION-V2";

export const partnerTrackingRegistrationService = new PartnerTrackingRegistrationService();
