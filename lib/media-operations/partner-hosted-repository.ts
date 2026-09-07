import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { checkAffiliateRouteHttp, type AffiliateRouteHttpCheck } from "@/lib/affiliate-health/checker";
import { prisma } from "@/lib/db/prisma";
import type { MediaResolvedContextRuntime } from "@/lib/media-operations/context";
import {
  partnerHostedBindingFingerprint,
  type ParsedPartnerHostedCreative,
} from "@/lib/media-operations/partner-hosted";

type PartnerHostedActor = { actorId: string; source: "ADMIN" | "CHATGPT_WORK" | "SYSTEM" };

function json(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function host(value: string | null | undefined) {
  if (!value) return null;
  try { return new URL(value).hostname.toLowerCase().replace(/\.$/, ""); } catch { return value.toLowerCase().replace(/\.$/, ""); }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function evidencedOperatorHost(metadata: unknown, countryCode: string | null) {
  const activation = record(record(metadata)?.commercialActivationV1);
  const records = record(activation?.records);
  if (!records) return null;
  const fromEntry = (value: unknown) => {
    const expected = record(record(value)?.routeHealth)?.expectedFinalHost;
    if (typeof expected !== "string") return null;
    const normalized = expected.trim().toLowerCase().replace(/\.$/, "");
    return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(normalized)
      ? normalized
      : null;
  };
  if (countryCode) {
    const exact = fromEntry(records[countryCode]);
    if (exact) return exact;
  }
  const unique = [...new Set(Object.values(records).map(fromEntry).filter((value): value is string => Boolean(value)))];
  return unique.length === 1 ? unique[0] : null;
}

export function superflyCanonicalCampaignMatches(
  parsed: Pick<ParsedPartnerHostedCreative, "provider" | "operatorProgramId" | "affiliateId" | "campaignId">,
  canonicalDestination: string,
  canonicalMetadata?: unknown,
) {
  if (parsed.provider !== "SUPERFLY") return true;
  try {
    const url = new URL(canonicalDestination);
    const isOpaqueCanonicalCampaign = url.protocol === "https:"
      && url.hostname.toLowerCase().replace(/\.$/, "") === "go.superflypartners.net"
      && /^\/c\/[a-f0-9]{8}$/i.test(url.pathname)
      && !url.search
      && !url.hash
      && !url.username
      && !url.password
      && !url.port;
    // The six existing governed routes use Superfly's opaque /c/{id} campaign
    // form, which intentionally does not reveal o/a/c query parameters. The
    // surrounding binding has already proved the exact Superfly programme and
    // canonical Casino route; the creative destination still has to pass its
    // own bounded terminal-operator verification before it can be activated.
    if (isOpaqueCanonicalCampaign) {
      const expectedHash = record(record(canonicalMetadata)?.commercialVisibility)?.canonicalUrlSha256;
      return typeof expectedHash === "string"
        && /^[a-f0-9]{64}$/.test(expectedHash)
        && sha256(canonicalDestination) === expectedHash;
    }
    const one = (key: string) => {
      const values = url.searchParams.getAll(key);
      return values.length === 1 ? values[0] : null;
    };
    return url.protocol === "https:"
      && url.hostname.toLowerCase().replace(/\.$/, "") === "go.superflypartners.net"
      && url.pathname === "/click"
      && one("o") === parsed.operatorProgramId
      && one("a") === parsed.affiliateId
      && one("c") === parsed.campaignId;
  } catch {
    return false;
  }
}

function normalized(value: string | null | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, "") ?? "";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export type PartnerHostedCommercialBinding = {
  affiliateOfferId: string | null;
  redirectSlugId: string | null;
  redirectSlug: string | null;
  trackingLinkId: string | null;
  expectedOperatorHost: string | null;
  relationshipState: "MATCH" | "REVIEW_REQUIRED";
  reason: string | null;
  matchAuthority?: "EXACT_GOVERNED_ROUTE" | "PROVIDER_CAMPAIGN" | null;
};

function exactCanonicalUrlMatch(candidate: string, governed: Array<string | null | undefined>) {
  const canonical = (value: string) => {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  };
  try {
    const normalizedCandidate = canonical(candidate);
    return governed.some((value) => {
      if (!value) return false;
      try { return canonical(value) === normalizedCandidate; } catch { return false; }
    });
  } catch {
    return false;
  }
}

type PartnerHostedTrackingLinkEvidence = {
  id: string;
  trackingUrl: string;
  destinationUrl: string;
  metadata: unknown;
};

export function selectPartnerHostedTrackingLink(
  provider: ParsedPartnerHostedCreative["provider"],
  destinationUrl: string,
  trackingLinks: PartnerHostedTrackingLinkEvidence[],
) {
  if (provider === "BANNERFLOW") {
    const exactMatches = trackingLinks.filter((trackingLink) => exactCanonicalUrlMatch(
      destinationUrl,
      [trackingLink.trackingUrl, trackingLink.destinationUrl],
    ));
    if (exactMatches.length === 1) return {
      trackingLink: exactMatches[0],
      exactBannerflowMatch: true,
      reason: null,
    };
    return {
      trackingLink: null,
      exactBannerflowMatch: false,
      reason: exactMatches.length > 1
        ? "CANONICAL_TRACKING_LINK_AMBIGUOUS"
        : trackingLinks.length === 0
          ? "CANONICAL_TRACKING_LINK_REQUIRED"
          : "CREATIVE_CANONICAL_DESTINATION_CONFLICT",
    };
  }
  return {
    trackingLink: trackingLinks.length === 1 ? trackingLinks[0] : null,
    exactBannerflowMatch: false,
    reason: trackingLinks.length > 1 ? "CANONICAL_TRACKING_LINK_AMBIGUOUS"
      : trackingLinks.length === 0 ? "CANONICAL_TRACKING_LINK_REQUIRED" : null,
  };
}

export async function resolvePartnerHostedCommercialBinding(
  parsed: ParsedPartnerHostedCreative,
  context: MediaResolvedContextRuntime,
): Promise<PartnerHostedCommercialBinding> {
  if (!context.persisted.casinoId) return {
    affiliateOfferId: null, redirectSlugId: null, redirectSlug: null, trackingLinkId: null,
    expectedOperatorHost: null, relationshipState: "REVIEW_REQUIRED", reason: "CASINO_ASSOCIATION_REQUIRED",
  };
  const casino = await prisma.casino.findUnique({
    where: { id: context.persisted.casinoId },
    select: {
      id: true, title: true, domain: true, websiteUrl: true,
      countries: {
        where: parsed.description.countryCode ? { countryCode: parsed.description.countryCode } : undefined,
        select: { localDomain: true, localWebsiteUrl: true },
        orderBy: { countryCode: "asc" },
        take: 1,
      },
      redirectSlugs: {
        where: {
          active: true, archivedAt: null,
          ...(context.persisted.affiliateOfferId ? { affiliateOfferId: context.persisted.affiliateOfferId } : {}),
          ...(context.persisted.bonusId ? { OR: [{ casinoBonusId: context.persisted.bonusId }, { casinoBonusId: null }] } : {}),
        },
        orderBy: [{ casinoBonusId: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
        select: {
          id: true, slug: true, affiliateOfferId: true,
          affiliateOffer: {
            select: {
              id: true, status: true,
              program: { select: { name: true, operator: true, providerType: true, network: { select: { name: true, slug: true } } } },
              trackingLinks: { where: { active: true, archivedAt: null }, orderBy: [{ priority: "desc" }, { id: "asc" }], select: { id: true, trackingUrl: true, destinationUrl: true, metadata: true } },
            },
          },
        },
        take: 3,
      },
    },
  });
  if (!casino) return {
    affiliateOfferId: null, redirectSlugId: null, redirectSlug: null, trackingLinkId: null,
    expectedOperatorHost: null, relationshipState: "REVIEW_REQUIRED", reason: "CASINO_ASSOCIATION_REQUIRED",
  };
  const exactMarketHost = host(casino.countries[0]?.localWebsiteUrl) ?? host(casino.countries[0]?.localDomain);
  const globalOperatorHost = host(casino.websiteUrl) ?? host(casino.domain);
  const fallbackOperatorHost = parsed.description.countryCode
    ? exactMarketHost ?? globalOperatorHost
    : globalOperatorHost ?? exactMarketHost;
  const route = casino.redirectSlugs.length === 1 ? casino.redirectSlugs[0] : null;
  if (!route?.affiliateOffer || !route.affiliateOfferId) return {
    affiliateOfferId: null, redirectSlugId: null, redirectSlug: null, trackingLinkId: null,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED",
    reason: casino.redirectSlugs.length > 1 ? "CANONICAL_COMMERCIAL_ROUTE_AMBIGUOUS" : "CANONICAL_COMMERCIAL_ROUTE_REQUIRED",
  };
  const programEvidence = normalized([
    route.affiliateOffer.program.name,
    route.affiliateOffer.program.operator,
    route.affiliateOffer.program.providerType,
    route.affiliateOffer.program.network.name,
    route.affiliateOffer.program.network.slug,
  ].join(" "));
  const providerMatches = parsed.provider === "SUPERFLY"
    ? programEvidence.includes("superfly")
    : programEvidence.includes("betsson");
  const trackingLinkSelection = selectPartnerHostedTrackingLink(
    parsed.provider,
    parsed.destinationUrl,
    route.affiliateOffer.trackingLinks,
  );
  const trackingLink = trackingLinkSelection.trackingLink;
  if (!trackingLink) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: null,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED",
    reason: trackingLinkSelection.reason,
  };
  const exactBannerflowMatch = trackingLinkSelection.exactBannerflowMatch;
  if (!providerMatches && !exactBannerflowMatch) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED", reason: "CREATIVE_CANONICAL_PARTNER_CONFLICT",
  };
  if (!superflyCanonicalCampaignMatches(parsed, trackingLink.destinationUrl, trackingLink.metadata)) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED", reason: "CREATIVE_CANONICAL_CAMPAIGN_CONFLICT",
  };
  if (parsed.provider === "BANNERFLOW" && !exactBannerflowMatch) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED", reason: "CREATIVE_CANONICAL_DESTINATION_CONFLICT",
    matchAuthority: null,
  };
  const expectedOperatorHost = evidencedOperatorHost(trackingLink.metadata, parsed.description.countryCode)
    ?? fallbackOperatorHost;
  if (!expectedOperatorHost && !exactBannerflowMatch) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
    expectedOperatorHost: null, relationshipState: "REVIEW_REQUIRED", reason: "EXPECTED_OPERATOR_HOST_REQUIRED",
  };
  return {
    affiliateOfferId: route.affiliateOfferId,
    redirectSlugId: route.id,
    redirectSlug: route.slug,
    trackingLinkId: trackingLink.id,
    expectedOperatorHost,
    relationshipState: "MATCH",
    reason: null,
    matchAuthority: parsed.provider === "BANNERFLOW" ? "EXACT_GOVERNED_ROUTE" : "PROVIDER_CAMPAIGN",
  };
}

export async function verifyPartnerHostedDestination(
  parsed: ParsedPartnerHostedCreative,
  binding: PartnerHostedCommercialBinding,
  options: { fetcher?: typeof fetch; timeoutMs?: number } = {},
): Promise<AffiliateRouteHttpCheck> {
  if (binding.relationshipState !== "MATCH" || !binding.expectedOperatorHost) return {
    status: "BROKEN", reason: binding.reason ?? "COMMERCIAL_BINDING_REQUIRED", method: "HEAD", statusCode: null,
    durationMs: 0, redirectCount: 0, finalHost: null,
  };
  const check = await checkAffiliateRouteHttp({
    url: new URL(parsed.destinationUrl),
    expectation: {
      expectedFinalHost: binding.expectedOperatorHost,
      requiredAttributionParameters: parsed.provider === "SUPERFLY" ? ["creative_id"] : [],
      allowWwwEquivalentFinalHost: true,
    },
    fetcher: options.fetcher,
    timeoutMs: options.timeoutMs ?? 12_000,
    inspectTerminalContent: true,
  });
  return check;
}

export function classifyPartnerHostedCommercialRoute(
  binding: PartnerHostedCommercialBinding,
  verification: AffiliateRouteHttpCheck | null,
) {
  const probeHealthy = verification?.status === "HEALTHY";
  const exactGovernedMatch = binding.relationshipState === "MATCH" && binding.matchAuthority === "EXACT_GOVERNED_ROUTE";
  const valid = exactGovernedMatch || (binding.relationshipState === "MATCH" && probeHealthy);
  const reason = valid
    ? null
    : binding.reason ?? (verification ? `DESTINATION_INTEGRITY_${verification.reason}` : "CANONICAL_COMMERCIAL_ROUTE_REQUIRED");
  return {
    valid,
    reason,
    validity: valid ? "MATCH" as const
      : binding.reason === "CANONICAL_COMMERCIAL_ROUTE_REQUIRED" ? "MISSING" as const
        : binding.relationshipState === "MATCH" ? "REVIEW_REQUIRED" as const : "CONFLICT" as const,
    destinationVerificationState: valid ? "VERIFIED" as const
      : binding.relationshipState === "MATCH" && verification ? "FAILED" as const : "PENDING" as const,
    verifiedFinalHost: probeHealthy ? verification?.finalHost ?? null : null,
  };
}

export async function storePartnerHostedCreative(input: {
  parsed: ParsedPartnerHostedCreative;
  context: MediaResolvedContextRuntime;
  binding: PartnerHostedCommercialBinding;
  verification: AffiliateRouteHttpCheck | null;
  actor: PartnerHostedActor;
}) {
  const { parsed, context, binding, verification, actor } = input;
  if (!context.persisted.casinoId) throw new Error("CASINO_ASSOCIATION_REQUIRED");
  const commercialRoute = classifyPartnerHostedCommercialRoute(binding, verification);
  const mediaValidationReason = parsed.description.contradiction;
  const commercialRouteReason = commercialRoute.reason;
  const destinationVerificationState = commercialRoute.destinationVerificationState;
  const verifiedAt = commercialRoute.valid ? new Date() : null;
  const record = await prisma.$transaction(async (tx) => {
    const stored = await tx.partnerHostedCreative.upsert({
      where: { providerIdentityKey: parsed.providerIdentityKey },
      create: {
        provider: parsed.provider,
        sourceMode: parsed.sourceMode,
        providerIdentityKey: parsed.providerIdentityKey,
        casinoId: context.persisted.casinoId!,
        casinoBonusId: context.persisted.bonusId,
        affiliateOfferId: binding.affiliateOfferId,
        redirectSlugId: binding.redirectSlugId,
        trackingLinkId: binding.trackingLinkId,
        originalDescription: parsed.description.raw,
        externalLabel: parsed.description.externalLabel,
        brandLabel: parsed.description.brandLabel ?? parsed.altText,
        purpose: parsed.description.purpose,
        externalCreativeId: parsed.externalCreativeId,
        affiliateId: parsed.affiliateId,
        campaignId: parsed.campaignId,
        adGroupId: parsed.adGroupId,
        did: parsed.did,
        mediaId: parsed.mediaId,
        operatorProgramId: parsed.operatorProgramId,
        declaredWidth: parsed.declaredWidth,
        declaredHeight: parsed.declaredHeight,
        altText: parsed.altText,
        hostedImageUrl: parsed.hostedImageUrl,
        providerEmbedPath: parsed.providerEmbedPath,
        providerEmbedParameters: parsed.providerEmbedParameters ? json(parsed.providerEmbedParameters) : undefined,
        countryCode: parsed.description.countryCode,
        languageCode: parsed.description.languageCode,
        languageState: parsed.description.languageState,
        currencyCode: parsed.description.currencyCode,
        destinationUrl: parsed.destinationUrl,
        destinationUrlHash: parsed.destinationUrlHash,
        destinationHost: parsed.destinationHost,
        expectedOperatorHost: binding.expectedOperatorHost,
        verifiedFinalHost: commercialRoute.verifiedFinalHost,
        destinationVerificationState,
        destinationVerifiedAt: verifiedAt,
        destinationVerificationProvenance: verification ? json({
          method: verification.method, statusCode: verification.statusCode, redirectCount: verification.redirectCount,
          finalHost: verification.finalHost, result: verification.status, reason: verification.reason,
        }) : undefined,
        validationState: mediaValidationReason ? "REVIEW_REQUIRED" : "VALIDATED",
        validationReason: mediaValidationReason,
        sourceChecksum: parsed.sourceChecksum,
        provenance: json({
          source: "FOUNDER_PARTNER_INPUT",
          planChannel: actor.source,
          sourceEvidence: parsed.sourceEvidence,
          destinationEvidence: parsed.destinationEvidence,
          dimensionProvenance: parsed.dimensionProvenance,
          commercialRoute: {
            state: commercialRoute.validity,
            reason: commercialRouteReason,
            authority: binding.matchAuthority ?? null,
            externalProbeAdvisory: verification ? { result: verification.status, reason: verification.reason, statusCode: verification.statusCode } : null,
          },
        }),
        createdBy: actor.actorId,
        updatedBy: actor.actorId,
      },
      update: {
        casinoId: context.persisted.casinoId!,
        casinoBonusId: context.persisted.bonusId,
        affiliateOfferId: binding.affiliateOfferId,
        redirectSlugId: binding.redirectSlugId,
        trackingLinkId: binding.trackingLinkId,
        originalDescription: parsed.description.raw,
        externalLabel: parsed.description.externalLabel,
        brandLabel: parsed.description.brandLabel ?? parsed.altText,
        purpose: parsed.description.purpose,
        declaredWidth: parsed.declaredWidth,
        declaredHeight: parsed.declaredHeight,
        altText: parsed.altText,
        hostedImageUrl: parsed.hostedImageUrl,
        providerEmbedPath: parsed.providerEmbedPath,
        providerEmbedParameters: parsed.providerEmbedParameters ? json(parsed.providerEmbedParameters) : undefined,
        countryCode: parsed.description.countryCode,
        languageCode: parsed.description.languageCode,
        languageState: parsed.description.languageState,
        currencyCode: parsed.description.currencyCode,
        destinationUrl: parsed.destinationUrl,
        destinationUrlHash: parsed.destinationUrlHash,
        destinationHost: parsed.destinationHost,
        expectedOperatorHost: binding.expectedOperatorHost,
        verifiedFinalHost: commercialRoute.verifiedFinalHost,
        destinationVerificationState,
        destinationVerifiedAt: verifiedAt,
        destinationVerificationProvenance: verification ? json({
          method: verification.method, statusCode: verification.statusCode, redirectCount: verification.redirectCount,
          finalHost: verification.finalHost, result: verification.status, reason: verification.reason,
        }) : undefined,
        validationState: mediaValidationReason ? "REVIEW_REQUIRED" : "VALIDATED",
        validationReason: mediaValidationReason,
        sourceChecksum: parsed.sourceChecksum,
        provenance: json({
          source: "FOUNDER_PARTNER_INPUT",
          planChannel: actor.source,
          sourceEvidence: parsed.sourceEvidence,
          destinationEvidence: parsed.destinationEvidence,
          dimensionProvenance: parsed.dimensionProvenance,
          commercialRoute: {
            state: commercialRoute.validity,
            reason: commercialRouteReason,
            authority: binding.matchAuthority ?? null,
            externalProbeAdvisory: verification ? { result: verification.status, reason: verification.reason, statusCode: verification.statusCode } : null,
          },
        }),
        active: true,
        archivedAt: null,
        updatedBy: actor.actorId,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.actorId,
        action: "partner-hosted-creative-ingested",
        entityType: "partner-hosted-creative",
        entityId: stored.id,
        summary: `Ingested vetted ${parsed.provider} partner-hosted creative`,
        metadata: json({
          provider: parsed.provider, sourceMode: parsed.sourceMode, providerIdentityKey: parsed.providerIdentityKey,
          destinationUrlHash: parsed.destinationUrlHash, destinationHost: parsed.destinationHost,
          canonicalRouteId: binding.redirectSlugId, destinationVerificationState,
          mediaValidationReason, commercialRouteReason, matchAuthority: binding.matchAuthority ?? null,
        }),
      },
    });
    return stored;
  });
  return {
    record,
    binding,
    verification,
    mediaValidity: mediaValidationReason ? "REVIEW_REQUIRED" as const : "VALID" as const,
    commercialRouteValidity: commercialRoute.validity,
    commercialRouteReason,
  };
}

export async function resolvePublishedCreativeDestination(input: {
  creativeId: string;
  redirectSlugId: string;
  casinoId: string;
  affiliateOfferId: string;
  countryCode: string;
}) {
  const countryCode = input.countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return null;
  const creative = await prisma.partnerHostedCreative.findFirst({
    where: {
      id: input.creativeId,
      redirectSlugId: input.redirectSlugId,
      casinoId: input.casinoId,
      affiliateOfferId: input.affiliateOfferId,
      OR: [{ countryCode }, { countryCode: null }],
      active: true,
      archivedAt: null,
      validationState: "VALIDATED",
      destinationVerificationState: "VERIFIED",
      casino: { status: "PUBLISHED", archivedAt: null },
    },
    select: { destinationUrl: true, destinationUrlHash: true, casinoId: true, trackingLinkId: true },
  });
  if (!creative?.trackingLinkId) return null;
  const published = await prisma.casinoVersion.findFirst({
    where: { casinoId: creative.casinoId, status: "PUBLISHED" },
    orderBy: [{ version: "desc" }, { publishedAt: "desc" }],
    select: { snapshot: true },
  });
  const findPublishedBinding = (value: unknown, depth = 0): Record<string, unknown> | null => {
    if (depth > 12) return null;
    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = findPublishedBinding(entry, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const projected = record.creative;
    if (projected && typeof projected === "object" && !Array.isArray(projected)
      && (projected as Record<string, unknown>).id === input.creativeId) return projected as Record<string, unknown>;
    for (const entry of Object.values(record)) {
      const found = findPublishedBinding(entry, depth + 1);
      if (found) return found;
    }
    return null;
  };
  const projected = published ? findPublishedBinding(published.snapshot) : null;
  const expectedFingerprint = partnerHostedBindingFingerprint({
    affiliateOfferId: input.affiliateOfferId,
    redirectSlugId: input.redirectSlugId,
    trackingLinkId: creative.trackingLinkId,
    destinationUrlHash: creative.destinationUrlHash,
  });
  if (!projected || projected.bindingFingerprint !== expectedFingerprint) return null;
  try {
    const destination = new URL(creative.destinationUrl);
    if (destination.protocol !== "https:" || destination.username || destination.password
      || sha256(destination.href) !== creative.destinationUrlHash) return null;
    return destination;
  } catch {
    return null;
  }
}
