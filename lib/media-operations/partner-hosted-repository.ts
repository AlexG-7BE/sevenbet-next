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
) {
  if (parsed.provider !== "SUPERFLY") return true;
  try {
    const url = new URL(canonicalDestination);
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
};

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
              trackingLinks: { where: { active: true, archivedAt: null }, orderBy: [{ priority: "desc" }, { id: "asc" }], select: { id: true, destinationUrl: true, metadata: true }, take: 2 },
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
  if (!providerMatches) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: null,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED", reason: "CREATIVE_CANONICAL_PARTNER_CONFLICT",
  };
  const trackingLink = route.affiliateOffer.trackingLinks.length === 1 ? route.affiliateOffer.trackingLinks[0] : null;
  if (!trackingLink) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: null,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED",
    reason: route.affiliateOffer.trackingLinks.length > 1 ? "CANONICAL_TRACKING_LINK_AMBIGUOUS" : "CANONICAL_TRACKING_LINK_REQUIRED",
  };
  if (!superflyCanonicalCampaignMatches(parsed, trackingLink.destinationUrl)) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
    expectedOperatorHost: fallbackOperatorHost, relationshipState: "REVIEW_REQUIRED", reason: "CREATIVE_CANONICAL_CAMPAIGN_CONFLICT",
  };
  const expectedOperatorHost = evidencedOperatorHost(trackingLink.metadata, parsed.description.countryCode)
    ?? fallbackOperatorHost;
  if (!expectedOperatorHost) return {
    affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
    expectedOperatorHost: null, relationshipState: "REVIEW_REQUIRED", reason: "EXPECTED_OPERATOR_HOST_REQUIRED",
  };
  if (parsed.provider === "BANNERFLOW") {
    const evidenced = await prisma.commercialEvidence.count({
      where: {
        status: "CURRENT",
        classification: "DETECTED",
        category: "ACTIVATION",
        opportunity: { OR: [{ displayName: { contains: casino.title, mode: "insensitive" } }, { normalizedName: { contains: normalized(casino.title), mode: "insensitive" } }] },
        OR: [
          { sourceUrl: { contains: parsed.destinationHost, mode: "insensitive" } },
          { sourceReference: { contains: parsed.destinationHost, mode: "insensitive" } },
          { claim: { contains: parsed.destinationHost, mode: "insensitive" } },
          { notes: { contains: parsed.destinationHost, mode: "insensitive" } },
        ],
      },
    });
    if (!evidenced) return {
      affiliateOfferId: route.affiliateOfferId, redirectSlugId: route.id, redirectSlug: route.slug, trackingLinkId: trackingLink.id,
      expectedOperatorHost, relationshipState: "REVIEW_REQUIRED", reason: "PARTNER_DESTINATION_RELATIONSHIP_UNEVIDENCED",
    };
  }
  return {
    affiliateOfferId: route.affiliateOfferId,
    redirectSlugId: route.id,
    redirectSlug: route.slug,
    trackingLinkId: trackingLink.id,
    expectedOperatorHost,
    relationshipState: "MATCH",
    reason: null,
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

export async function storePartnerHostedCreative(input: {
  parsed: ParsedPartnerHostedCreative;
  context: MediaResolvedContextRuntime;
  binding: PartnerHostedCommercialBinding;
  verification: AffiliateRouteHttpCheck | null;
  actor: PartnerHostedActor;
}) {
  const { parsed, context, binding, verification, actor } = input;
  if (!context.persisted.casinoId) throw new Error("CASINO_ASSOCIATION_REQUIRED");
  const verified = verification?.status === "HEALTHY";
  const validationReason = parsed.description.contradiction
    ?? binding.reason
    ?? (verification && !verified ? `DESTINATION_INTEGRITY_${verification.reason}` : null);
  const destinationVerificationState = verified ? "VERIFIED" as const
    : verification ? "FAILED" as const : "PENDING" as const;
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
        verifiedFinalHost: verified ? verification?.finalHost : null,
        destinationVerificationState,
        destinationVerifiedAt: verified ? new Date() : null,
        destinationVerificationProvenance: verification ? json({
          method: verification.method, statusCode: verification.statusCode, redirectCount: verification.redirectCount,
          finalHost: verification.finalHost, result: verification.status, reason: verification.reason,
        }) : undefined,
        validationState: validationReason ? "REVIEW_REQUIRED" : "VALIDATED",
        validationReason,
        sourceChecksum: parsed.sourceChecksum,
        provenance: json({ source: "FOUNDER_PARTNER_INPUT", planChannel: actor.source, sourceEvidence: parsed.sourceEvidence, destinationEvidence: parsed.destinationEvidence }),
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
        verifiedFinalHost: verified ? verification?.finalHost : null,
        destinationVerificationState,
        destinationVerifiedAt: verified ? new Date() : null,
        destinationVerificationProvenance: verification ? json({
          method: verification.method, statusCode: verification.statusCode, redirectCount: verification.redirectCount,
          finalHost: verification.finalHost, result: verification.status, reason: verification.reason,
        }) : undefined,
        validationState: validationReason ? "REVIEW_REQUIRED" : "VALIDATED",
        validationReason,
        sourceChecksum: parsed.sourceChecksum,
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
          canonicalRouteId: binding.redirectSlugId, destinationVerificationState, validationReason,
        }),
      },
    });
    return stored;
  });
  return { record, binding, verification };
}

export async function resolvePublishedCreativeDestination(input: {
  creativeId: string;
  redirectSlugId: string;
  casinoId: string;
  affiliateOfferId: string;
  trackingLinkId: string;
}) {
  const creative = await prisma.partnerHostedCreative.findFirst({
    where: {
      id: input.creativeId,
      redirectSlugId: input.redirectSlugId,
      casinoId: input.casinoId,
      affiliateOfferId: input.affiliateOfferId,
      trackingLinkId: input.trackingLinkId,
      active: true,
      archivedAt: null,
      validationState: "VALIDATED",
      destinationVerificationState: "VERIFIED",
      casino: { status: "PUBLISHED", archivedAt: null },
    },
    select: { destinationUrl: true, destinationUrlHash: true, casinoId: true },
  });
  if (!creative) return null;
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
    trackingLinkId: input.trackingLinkId,
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
