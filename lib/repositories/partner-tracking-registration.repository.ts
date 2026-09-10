import { createHash } from "node:crypto";

import {
  Prisma,
  type AffiliateOffer,
  type AffiliateProgram,
  type AffiliateRedirectSlug,
  type AffiliateTrackingLink,
  type PrismaClient,
} from "@prisma/client";

import type {
  PartnerTrackingRegistrationResultRow,
  PartnerTrackingScope,
} from "@/lib/commercial/partner-tracking-registration-contract";
import {
  CURRENT_PARTNER_INVENTORY,
  CURRENT_PARTNER_RECORDS,
  GLOBAL_CURRENT_PARTNER_RELEASE,
  normalizeCurrentPartnerIdentity,
  type CurrentPartnerName,
  type CurrentPartnerInventorySeed,
} from "@/lib/current-partner-rollout/inventory";
import prisma from "@/lib/db/prisma";
import { ConflictError, ValidationError } from "@/lib/services/service-error";

type Transaction = Prisma.TransactionClient;

const REGISTRATION_METADATA_KEY = "partnerTrackingRegistration";
const REGISTRATION_VERSION = "PARTNER-TRACKING-REGISTRATION-V1";
const REGISTRATION_SOURCE = "COMMERCIAL_MCP_PARTNER_PROVIDED";
const VERIFYING_TTL_MS = 2 * 60_000;

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function object(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function registrationMetadata(value: Prisma.JsonValue | null | undefined) {
  return object(object(value)[REGISTRATION_METADATA_KEY] as Prisma.JsonValue);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hostFromUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return null;
  }
}

function normalizedHost(value: string | null) {
  return value?.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "") || null;
}

function countryFromGeo(geo: string) {
  return /^[A-Z]{2}$/.test(geo) ? geo : null;
}

function boundedCandidate(casino: { id: string; title: string; slug: string }) {
  return { id: casino.id, name: casino.title, slug: casino.slug };
}

export type PartnerTrackingTarget = {
  partner: CurrentPartnerName;
  partnerId: string;
  affiliateNetworkId: string | null;
  casino: string;
  casinoId: string;
  casinoSlug: string;
  casinoDomain: string;
  casinoWebsiteUrl: string | null;
  rows: CurrentPartnerInventorySeed[];
};

export type PartnerTrackingStage = {
  target: PartnerTrackingTarget & { affiliateNetworkId: string };
  scope: PartnerTrackingScope;
  geo: string | null;
  linkHash: string;
  trackingLinkId: string;
  affiliateProgramId: string;
  affiliateOfferId: string;
  redirectId: string;
  internalRedirect: string;
  expectedFinalHost: string;
  requiredAttributionParameters: string[];
  affectedRows: CurrentPartnerInventorySeed[];
  previousTrackingLinkIds: string[];
  previousActivations: Array<{
    id: string;
    geo: string;
    trackingLinkId: string;
    affiliateOfferId: string;
    redirectId: string;
  }>;
  alreadyCanonical: boolean;
  candidateCreated: boolean;
};

export type PartnerTrackingPromotion = PartnerTrackingStage & {
  previousTrackingLinkId: string | null;
};

export class PartnerTrackingRegistrationRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  async resolveTarget(input: {
    partner: CurrentPartnerName;
    partnerId: string;
    partnerAliases: readonly string[];
    casino: string;
    geo: string | null;
  }): Promise<PartnerTrackingTarget> {
    const opportunity = await this.database.commercialOpportunity.findUnique({
      where: { id: input.partnerId },
      select: { id: true, displayName: true, stage: true, affiliateNetworkId: true },
    });
    if (!opportunity || opportunity.stage !== "ACTIVE") {
      throw new ValidationError("Current partner record is unavailable", {
        reason: "CURRENT_PARTNER_RECORD_UNAVAILABLE",
        partner: input.partner,
      });
    }

    let affiliateNetworkId = opportunity.affiliateNetworkId;
    if (!affiliateNetworkId) {
      const identities = new Set([input.partner, ...input.partnerAliases].map(normalizeCurrentPartnerIdentity));
      const networks = (await this.database.affiliateNetwork.findMany({
        where: { archivedAt: null },
        select: { id: true, name: true, slug: true },
      })).filter((network) => identities.has(normalizeCurrentPartnerIdentity(network.name))
        || identities.has(normalizeCurrentPartnerIdentity(network.slug)));
      if (networks.length > 1) {
        throw new ValidationError("Current partner network cannot be resolved unambiguously", {
          reason: "PARTNER_NETWORK_AMBIGUOUS",
          candidates: networks.slice(0, 10).map((network) => ({ id: network.id, name: network.name })),
        });
      }
      affiliateNetworkId = networks[0]?.id ?? null;
    }

    const allRows = CURRENT_PARTNER_INVENTORY;
    const allCanonicalNames = [...new Set(allRows.map((row) => row.casino))];
    const allCanonicalSlugs = [...new Set(allRows.flatMap((row) => row.casinoSlug ? [row.casinoSlug] : []))];
    const casinos = await this.database.casino.findMany({
      where: { OR: [{ title: { in: allCanonicalNames } }, { slug: { in: allCanonicalSlugs } }] },
      select: {
        id: true,
        title: true,
        slug: true,
        domain: true,
        websiteUrl: true,
        aliases: { select: { value: true, normalizedValue: true } },
      },
    });
    const requested = normalizeCurrentPartnerIdentity(input.casino);
    const candidates = casinos.filter((casino) => [
      casino.title,
      casino.slug,
      casino.domain,
      ...casino.aliases.flatMap((alias) => [alias.value, alias.normalizedValue]),
    ].some((value) => normalizeCurrentPartnerIdentity(value) === requested));
    if (candidates.length === 0) {
      throw new ValidationError("Casino cannot be resolved", { reason: "CASINO_NOT_FOUND", candidates: [] });
    }
    if (candidates.length > 1) {
      throw new ConflictError("Casino identity is ambiguous", {
        reason: "CASINO_AMBIGUOUS",
        candidates: candidates.slice(0, 10).map(boundedCandidate),
      });
    }
    const casino = candidates[0];
    const relationshipRows = allRows.filter((row) => row.partner === input.partner
      && (normalizeCurrentPartnerIdentity(row.casino) === normalizeCurrentPartnerIdentity(casino.title)
        || (row.casinoSlug && normalizeCurrentPartnerIdentity(row.casinoSlug) === normalizeCurrentPartnerIdentity(casino.slug))));
    if (!relationshipRows.length) {
      throw new ConflictError("Casino is not associated with the supplied current partner", {
        reason: "PARTNER_CASINO_RELATIONSHIP_MISMATCH",
        casino: boundedCandidate(casino),
      });
    }
    if (input.geo && !relationshipRows.some((row) => row.geo === input.geo)) {
      throw new ValidationError("GEO is not in the current supported Partner × Casino inventory", {
        reason: "PARTNER_CASINO_GEO_UNSUPPORTED",
        geo: input.geo,
        supportedGeos: relationshipRows.map((row) => row.geo).sort(),
      });
    }

    return {
      partner: input.partner,
      partnerId: opportunity.id,
      affiliateNetworkId,
      casino: casino.title,
      casinoId: casino.id,
      casinoSlug: casino.slug,
      casinoDomain: casino.domain,
      casinoWebsiteUrl: casino.websiteUrl,
      rows: relationshipRows.sort((left, right) => left.geo.localeCompare(right.geo)),
    };
  }

  async stage(input: {
    target: PartnerTrackingTarget;
    trackingUrl: string;
    linkHash: string;
    scope: PartnerTrackingScope;
    geo: string | null;
    actorId: string;
    now: Date;
  }): Promise<PartnerTrackingStage> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        return await this.database.$transaction(
          (tx) => this.stageInTransaction(tx, input),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 },
        );
      } catch (error) {
        lastError = error;
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (!["P2002", "P2034"].includes(code) || attempt === 4) throw error;
      }
    }
    throw lastError;
  }

  private async stageInTransaction(tx: Transaction, input: {
    target: PartnerTrackingTarget;
    trackingUrl: string;
    linkHash: string;
    scope: PartnerTrackingScope;
    geo: string | null;
    actorId: string;
    now: Date;
  }): Promise<PartnerTrackingStage> {
    let network = input.target.affiliateNetworkId
      ? await tx.affiliateNetwork.findUnique({ where: { id: input.target.affiliateNetworkId } })
      : null;
    if (network?.archivedAt) throw new Error("PARTNER_TRACKING_NETWORK_UNAVAILABLE");
    if (!network) {
      const slug = normalizeCurrentPartnerIdentity(input.target.partner).replace(/\s+/g, "-");
      const existing = await tx.affiliateNetwork.findUnique({ where: { slug } });
      const acceptedIdentities = new Set([
        input.target.partner,
        ...CURRENT_PARTNER_RECORDS.find((partner) => partner.opportunityId === input.target.partnerId)?.aliases ?? [],
      ].map(normalizeCurrentPartnerIdentity));
      if (existing && !acceptedIdentities.has(normalizeCurrentPartnerIdentity(existing.name))
        && !acceptedIdentities.has(normalizeCurrentPartnerIdentity(existing.slug))) {
        throw new ConflictError("Canonical partner network slug belongs to another identity", {
          reason: "PARTNER_NETWORK_IDENTITY_COLLISION",
          candidates: [{ id: existing.id, name: existing.name }],
        });
      }
      network = existing
        ? await tx.affiliateNetwork.update({
            where: { id: existing.id },
            data: { active: true, archivedAt: null, updatedBy: input.actorId },
          })
        : await tx.affiliateNetwork.create({
            data: {
              name: input.target.partner,
              slug,
              type: "OTHER",
              active: true,
              notes: `${REGISTRATION_VERSION}: internal network normalization for an established current partner; no new relationship or terms inferred.`,
              createdBy: input.actorId,
              updatedBy: input.actorId,
            },
          });
    }
    const target = { ...input.target, affiliateNetworkId: network.id };

    const sameUrl = await tx.affiliateTrackingLink.findFirst({
      where: {
        trackingUrl: input.trackingUrl,
        offer: { casinoId: input.target.casinoId, program: { networkId: network.id } },
      },
      include: { offer: { include: { program: true } }, countries: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    let program: AffiliateProgram | null = sameUrl?.offer.program ?? await tx.affiliateProgram.findFirst({
      where: { networkId: network.id, casinoId: input.target.casinoId },
      orderBy: [{ status: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    if (!program) {
      const externalProgramId = `${REGISTRATION_VERSION}:${input.target.casinoId}`;
      program = await tx.affiliateProgram.upsert({
        where: { networkId_externalProgramId: { networkId: network.id, externalProgramId } },
        create: {
          networkId: network.id,
          casinoId: input.target.casinoId,
          externalProgramId,
          name: `${input.target.casino} / ${input.target.partner}`,
          operator: input.target.partner,
          status: "DRAFT",
          workflowStatus: "DRAFT",
          providerType: "COMMERCIAL_MCP",
          connectionStatus: "CONFIGURED",
          integrationMode: "MANUAL",
          metadata: json({ registrationVersion: REGISTRATION_VERSION, internalNormalizationOnly: true }),
          sourceOfTruth: json({ source: "FOUNDER_SUPPLIED_PARTNER_URL" }),
          notes: "Internal normalization for an established current Partner × Casino; RFC-042 remains final activation authority.",
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: { casinoId: input.target.casinoId, archivedAt: null, updatedBy: input.actorId },
      });
    }
    if (program.casinoId && program.casinoId !== input.target.casinoId) {
      throw new ConflictError("AffiliateProgram belongs to another casino", {
        reason: "PARTNER_TRACKING_PROGRAM_CASINO_MISMATCH",
        affiliateProgramId: program.id,
      });
    }

    let offer: AffiliateOffer | null = sameUrl?.offer ?? null;
    let redirect: AffiliateRedirectSlug | null = offer ? await tx.affiliateRedirectSlug.findFirst({
      where: { casinoId: input.target.casinoId, affiliateOfferId: offer.id },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    }) : null;
    if (!offer) {
      const existingRedirect = await tx.affiliateRedirectSlug.findFirst({
        where: { casinoId: input.target.casinoId, affiliateOfferId: { not: null } },
        include: { affiliateOffer: { include: { program: true } } },
        orderBy: [{ active: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      });
      if (existingRedirect?.affiliateOffer?.program.networkId === network.id) {
        offer = existingRedirect.affiliateOffer;
        redirect = existingRedirect;
        program = existingRedirect.affiliateOffer.program;
      }
    }
    if (!offer) {
      offer = await tx.affiliateOffer.findFirst({
        where: { programId: program.id, casinoId: input.target.casinoId, archivedAt: null },
        orderBy: [{ status: "desc" }, { priority: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      });
    }
    if (!offer) {
      const externalOfferId = `${REGISTRATION_VERSION}:${input.target.casinoId}:CASINO`;
      offer = await tx.affiliateOffer.upsert({
        where: { programId_externalOfferId: { programId: program.id, externalOfferId } },
        create: {
          programId: program.id,
          casinoId: input.target.casinoId,
          externalOfferId,
          internalName: `${input.target.casino} evergreen casino route`,
          publicLabel: "Visit Casino",
          offerType: "CASINO",
          status: "DRAFT",
          payoutModel: "UNKNOWN",
          geoMode: "ALLOW",
          evergreen: true,
          priority: 0,
          notes: "Neutral evergreen route; no unsupported promotional or commercial terms.",
          metadata: json({ registrationVersion: REGISTRATION_VERSION, internalNormalizationOnly: true }),
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: { archivedAt: null, updatedBy: input.actorId },
      });
    }

    // This bounded no-op update is the common scope lock. It serializes stage
    // decisions without exposing a generic SQL or Prisma surface to MCP.
    await tx.affiliateOffer.update({ where: { id: offer.id }, data: { updatedBy: input.actorId } });

    const allLinks = await tx.affiliateTrackingLink.findMany({
      where: { offerId: offer.id },
      include: { countries: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const sameScope = (metadata: ReturnType<typeof registrationMetadata>) => metadata.scope === input.scope
      && (input.scope === "GENERIC" || metadata.geo === input.geo);
    const verifying = allLinks.find((link) => {
      const metadata = registrationMetadata(link.metadata);
      return sameScope(metadata)
        && metadata.stage === "VERIFYING"
        && metadata.linkHash !== input.linkHash
        && link.updatedAt.getTime() >= input.now.getTime() - VERIFYING_TTL_MS;
    });
    if (verifying) {
      throw new ConflictError("Another tracking registration is already being verified for this scope", {
        reason: "PARTNER_TRACKING_REGISTRATION_IN_PROGRESS",
        trackingLinkId: verifying.id,
      });
    }

    const exactOverrides = new Set(input.target.rows
      .filter((row) => row.partnerTrackingUrlPresent && row.trackingScope === "EXACT_GEO")
      .map((row) => row.geo));
    for (const link of allLinks) {
      const metadata = registrationMetadata(link.metadata);
      if (metadata.stage === "CANONICAL" && metadata.scope === "EXACT_GEO" && typeof metadata.geo === "string") {
        exactOverrides.add(metadata.geo);
      }
    }
    const affectedRows = (input.scope === "EXACT_GEO"
      ? input.target.rows.filter((row) => row.geo === input.geo)
      : input.target.rows.filter((row) => !exactOverrides.has(row.geo)))
      .sort((left, right) => left.geo.localeCompare(right.geo));
    if (!affectedRows.length) {
      throw new ValidationError("No supported GEO remains in the requested tracking scope", {
        reason: "PARTNER_TRACKING_SCOPE_EMPTY",
      });
    }

    const previousActivations = await tx.marketActivation.findMany({
      where: {
        casinoId: input.target.casinoId,
        countryCode: { in: affectedRows.map((row) => row.geo).filter((geo) => /^[A-Z]{2}$/.test(geo)) },
        product: "CASINO",
        status: "ACTIVE",
        routeVerificationStatus: "HEALTHY",
        primaryTrackingLinkId: { not: null },
      },
      select: {
        id: true,
        countryCode: true,
        primaryTrackingLinkId: true,
        affiliateOfferId: true,
        redirectSlugId: true,
        routeFinalHost: true,
      },
    });
    const previousTrackingLinkIds = [...new Set(previousActivations.flatMap((row) => row.primaryTrackingLinkId ? [row.primaryTrackingLinkId] : []))];

    const sameUrlRegistration = registrationMetadata(sameUrl?.metadata);
    const sameUrlMatchesScope = sameUrl && sameUrl.offerId === offer.id && (
      sameScope(sameUrlRegistration)
      || (!sameUrlRegistration.scope && previousActivations.some((activation) => activation.primaryTrackingLinkId === sameUrl.id))
    );
    let link: AffiliateTrackingLink | null = sameUrlMatchesScope ? sameUrl : allLinks.find((candidate) => {
      const metadata = registrationMetadata(candidate.metadata);
      return metadata.linkHash === input.linkHash && sameScope(metadata);
    }) ?? null;
    const candidateCreated = !link;
    const requiredAttributionParameters = [...new URL(input.trackingUrl).searchParams.keys()]
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort();
    const scopeIdentity = input.scope === "GENERIC" ? "GENERIC" : `EXACT:${input.geo}`;
    const externalLinkId = `${REGISTRATION_VERSION}:${scopeIdentity}:${input.linkHash}`;
    const existingMetadata = object(link?.metadata);
    const alreadyCanonical = Boolean(link && (
      registrationMetadata(link.metadata).stage === "CANONICAL"
      || previousActivations.some((activation) => activation.primaryTrackingLinkId === link?.id)
    ));
    if (!link) {
      link = await tx.affiliateTrackingLink.upsert({
        where: { offerId_externalLinkId: { offerId: offer.id, externalLinkId } },
        create: {
          offerId: offer.id,
          externalLinkId,
          label: input.scope === "GENERIC" ? "Partner default tracking route" : `Partner ${input.geo} tracking route`,
          destinationUrl: input.trackingUrl,
          trackingUrl: input.trackingUrl,
          geoMode: "ALLOW",
          active: false,
          priority: input.scope === "EXACT_GEO" ? 1_000 : 500,
          source: REGISTRATION_SOURCE,
          metadata: json({
            [REGISTRATION_METADATA_KEY]: {
              version: REGISTRATION_VERSION,
              partnerId: input.target.partnerId,
              casinoId: input.target.casinoId,
              scope: input.scope,
              geo: input.geo,
              linkHash: input.linkHash,
              stage: "VERIFYING",
              stagedAt: input.now.toISOString(),
            },
          }),
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {},
      });
    } else if (!alreadyCanonical) {
      link = await tx.affiliateTrackingLink.update({
        where: { id: link.id },
        data: {
          externalLinkId: link.externalLinkId ?? externalLinkId,
          destinationUrl: input.trackingUrl,
          trackingUrl: input.trackingUrl,
          source: REGISTRATION_SOURCE,
          metadata: json({
            ...existingMetadata,
            [REGISTRATION_METADATA_KEY]: {
              ...registrationMetadata(link.metadata),
              version: REGISTRATION_VERSION,
              partnerId: input.target.partnerId,
              casinoId: input.target.casinoId,
              scope: input.scope,
              geo: input.geo,
              linkHash: input.linkHash,
              stage: "VERIFYING",
              stagedAt: input.now.toISOString(),
            },
          }),
          updatedBy: input.actorId,
        },
      });
    }
    if (!link) throw new Error("PARTNER_TRACKING_CANDIDATE_UNAVAILABLE");

    for (const row of affectedRows) {
      await tx.affiliateTrackingLinkCountry.upsert({
        where: { trackingLinkId_countryCode: { trackingLinkId: link.id, countryCode: row.geo } },
        create: {
          trackingLinkId: link.id,
          countryCode: row.geo,
          mode: "ALLOW",
          productionEligible: alreadyCanonical && previousActivations.some((activation) => activation.countryCode === row.geo && activation.primaryTrackingLinkId === link?.id),
          productionEligibilityEvidence: `FOUNDER_SUPPLIED_PARTNER_URL:${input.linkHash}`,
          productionEligibilityNotes: `${REGISTRATION_VERSION} staged scope ${scopeIdentity}`,
        },
        update: {
          mode: "ALLOW",
          productionEligibilityEvidence: `FOUNDER_SUPPLIED_PARTNER_URL:${input.linkHash}`,
        },
      });
    }

    if (!redirect) {
      const slug = `${input.target.casinoSlug}-casino`;
      const collision = await tx.affiliateRedirectSlug.findUnique({ where: { slug } });
      if (collision && collision.casinoId !== input.target.casinoId) {
        throw new ConflictError("Canonical redirect slug belongs to another casino", {
          reason: "PARTNER_TRACKING_REDIRECT_COLLISION",
          redirectId: collision.id,
        });
      }
      redirect = collision ?? await tx.affiliateRedirectSlug.create({ data: {
        slug,
        casinoId: input.target.casinoId,
        affiliateOfferId: offer.id,
        active: false,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      } });
    }

    const exactProfile = input.geo && /^[A-Z]{2}$/.test(input.geo)
      ? await tx.casinoCountry.findUnique({
          where: { casinoId_countryCode: { casinoId: input.target.casinoId, countryCode: input.geo } },
          select: { localDomain: true, localWebsiteUrl: true },
        })
      : null;
    const currentRouteHost = previousActivations.find((activation) => activation.primaryTrackingLinkId === link?.id)?.routeFinalHost ?? null;
    const storedRecords = object(object(link.metadata).commercialActivationV1 as Prisma.JsonValue);
    const storedRecord = input.geo
      ? object(object(storedRecords.records as Prisma.JsonValue)[input.geo] as Prisma.JsonValue)
      : {};
    const storedHealth = object(storedRecord.routeHealth as Prisma.JsonValue);
    const expectedFinalHost = normalizedHost(typeof storedHealth.expectedFinalHost === "string" ? storedHealth.expectedFinalHost : null)
      || normalizedHost(currentRouteHost)
      || normalizedHost(input.scope === "EXACT_GEO" ? exactProfile?.localDomain ?? null : null)
      || hostFromUrl(input.scope === "EXACT_GEO" ? exactProfile?.localWebsiteUrl ?? null : null)
      || normalizedHost(input.target.casinoDomain)
      || hostFromUrl(input.target.casinoWebsiteUrl);
    if (!expectedFinalHost) throw new Error("PARTNER_TRACKING_EXPECTED_HOST_UNAVAILABLE");

    return {
      target,
      scope: input.scope,
      geo: input.geo,
      linkHash: input.linkHash,
      trackingLinkId: link.id,
      affiliateProgramId: program.id,
      affiliateOfferId: offer.id,
      redirectId: redirect.id,
      internalRedirect: `/r/${redirect.slug}`,
      expectedFinalHost,
      requiredAttributionParameters,
      affectedRows,
      previousTrackingLinkIds,
      previousActivations: previousActivations.flatMap((activation) => activation.primaryTrackingLinkId
        && activation.affiliateOfferId
        && activation.redirectSlugId ? [{
        id: activation.id,
        geo: activation.countryCode,
        trackingLinkId: activation.primaryTrackingLinkId,
        affiliateOfferId: activation.affiliateOfferId,
        redirectId: activation.redirectSlugId,
      }] : []),
      alreadyCanonical,
      candidateCreated,
    };
  }

  async recordVerification(input: {
    stage: PartnerTrackingStage;
    verification: "HEALTHY" | "BROKEN" | "INCONCLUSIVE";
    reason: string;
    finalHost: string | null;
    redirectCount: number | null;
    statusCode: number | null;
    checkedAt: Date;
    actorId: string;
  }) {
    const link = await this.database.affiliateTrackingLink.findUnique({ where: { id: input.stage.trackingLinkId } });
    if (!link) throw new Error("PARTNER_TRACKING_CANDIDATE_NOT_FOUND");
    const existing = object(link.metadata);
    const registration = registrationMetadata(link.metadata);
    if (registration.linkHash && registration.linkHash !== input.stage.linkHash) {
      throw new ConflictError("Tracking candidate changed during verification", { reason: "PARTNER_TRACKING_CANDIDATE_STALE" });
    }
    await this.database.affiliateTrackingLink.update({
      where: { id: link.id },
      data: {
        ...(!input.stage.alreadyCanonical && input.verification !== "HEALTHY" ? {
          destinationUrl: `https://partner-route.invalid/${input.stage.linkHash}`,
          trackingUrl: `https://partner-route.invalid/${input.stage.linkHash}`,
        } : {}),
        lastCheckedAt: input.checkedAt,
        ...(input.verification === "HEALTHY" ? { verifiedAt: input.checkedAt } : {}),
        metadata: json({
          ...existing,
          [REGISTRATION_METADATA_KEY]: {
            ...registration,
            version: REGISTRATION_VERSION,
            partnerId: input.stage.target.partnerId,
            casinoId: input.stage.target.casinoId,
            scope: input.stage.scope,
            geo: input.stage.geo,
            linkHash: input.stage.linkHash,
            stage: input.stage.alreadyCanonical ? "CANONICAL" : input.verification,
            verification: {
              outcome: input.verification,
              reason: input.reason,
              finalHost: input.finalHost,
              redirectCount: input.redirectCount,
              statusCode: input.statusCode,
              checkedAt: input.checkedAt.toISOString(),
            },
          },
        }),
        updatedBy: input.actorId,
      },
    });
  }

  async promote(input: {
    stage: PartnerTrackingStage;
    finalHost: string;
    redirectCount: number;
    checkedAt: Date;
    actorId: string;
  }): Promise<PartnerTrackingPromotion> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        return await this.database.$transaction(async (tx) => {
          const candidate = await tx.affiliateTrackingLink.findUniqueOrThrow({ where: { id: input.stage.trackingLinkId } });
          const registration = registrationMetadata(candidate.metadata);
          if (registration.linkHash && registration.linkHash !== input.stage.linkHash) {
            throw new ConflictError("Tracking candidate changed before promotion", { reason: "PARTNER_TRACKING_CANDIDATE_STALE" });
          }
          const offer = await tx.affiliateOffer.findUniqueOrThrow({ where: { id: input.stage.affiliateOfferId }, include: { program: true } });
          await tx.affiliateOffer.update({ where: { id: offer.id }, data: { updatedBy: input.actorId } });

          const links = await tx.affiliateTrackingLink.findMany({ where: { offerId: offer.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
          const priorSameScope = links.filter((link) => {
            if (link.id === candidate.id) return false;
            const metadata = registrationMetadata(link.metadata);
            return metadata.stage === "CANONICAL"
              && metadata.scope === input.stage.scope
              && (input.stage.scope === "GENERIC" || metadata.geo === input.stage.geo);
          });
          const existingMetadata = object(candidate.metadata);
          const activationMetadata = object(existingMetadata.commercialActivationV1 as Prisma.JsonValue);
          const records = object(activationMetadata.records as Prisma.JsonValue);
          const nextRecords = { ...records };
          for (const row of input.stage.affectedRows) {
            const current = object(records[row.geo] as Prisma.JsonValue);
            nextRecords[row.geo] = {
              ...current,
              routeHealth: {
                expectedFinalHost: input.finalHost,
                expectedPathPrefix: null,
                requiredAttributionParameters: input.stage.requiredAttributionParameters,
              },
            };
          }
          await tx.affiliateTrackingLink.update({
            where: { id: candidate.id },
            data: {
              destinationUrl: `https://${input.finalHost}/`,
              active: true,
              archivedAt: null,
              geoMode: "ALLOW",
              priority: input.stage.scope === "EXACT_GEO" ? 1_000 : 500,
              verifiedAt: input.checkedAt,
              lastCheckedAt: input.checkedAt,
              source: REGISTRATION_SOURCE,
              metadata: json({
                ...existingMetadata,
                commercialActivationV1: { ...activationMetadata, records: nextRecords },
                [REGISTRATION_METADATA_KEY]: {
                  ...registration,
                  version: REGISTRATION_VERSION,
                  partnerId: input.stage.target.partnerId,
                  casinoId: input.stage.target.casinoId,
                  scope: input.stage.scope,
                  geo: input.stage.geo,
                  linkHash: input.stage.linkHash,
                  stage: "CANONICAL",
                  promotedAt: input.checkedAt.toISOString(),
                  verification: {
                    outcome: "HEALTHY",
                    reason: "EXPECTED_OPERATOR_DESTINATION_CONFIRMED",
                    finalHost: input.finalHost,
                    redirectCount: input.redirectCount,
                    checkedAt: input.checkedAt.toISOString(),
                  },
                },
              }),
              updatedBy: input.actorId,
            },
          });

          const supportedCountries = [...new Set([
            ...offer.program.supportedCountries.map((value) => value.toUpperCase()),
            ...input.stage.affectedRows.map((row) => row.geo),
          ])].sort();
          await tx.affiliateNetwork.update({ where: { id: offer.program.networkId }, data: { active: true, archivedAt: null, updatedBy: input.actorId } });
          await tx.affiliateProgram.update({
            where: { id: offer.program.id },
            data: { casinoId: input.stage.target.casinoId, supportedCountries, archivedAt: null, updatedBy: input.actorId },
          });
          for (const row of input.stage.affectedRows) {
            await tx.affiliateOfferCountry.upsert({
              where: { offerId_countryCode: { offerId: offer.id, countryCode: row.geo } },
              create: { offerId: offer.id, countryCode: row.geo, mode: "ALLOW" },
              update: { mode: "ALLOW" },
            });
            await tx.affiliateTrackingLinkCountry.upsert({
              where: { trackingLinkId_countryCode: { trackingLinkId: candidate.id, countryCode: row.geo } },
              create: {
                trackingLinkId: candidate.id,
                countryCode: row.geo,
                mode: "ALLOW",
                productionEligible: false,
                productionEligibilityEvidence: `FOUNDER_SUPPLIED_PARTNER_URL:${input.stage.linkHash}`,
                productionEligibilityNotes: `${REGISTRATION_VERSION} verified and promoted; RFC-042 controls eligibility`,
              },
              update: {
                mode: "ALLOW",
                productionEligibilityEvidence: `FOUNDER_SUPPLIED_PARTNER_URL:${input.stage.linkHash}`,
                productionEligibilityNotes: `${REGISTRATION_VERSION} verified and promoted; RFC-042 controls eligibility`,
              },
            });
            const countryCode = countryFromGeo(row.geo);
            if (countryCode) {
              const profile = await tx.casinoCountry.upsert({
                where: { casinoId_countryCode: { casinoId: input.stage.target.casinoId, countryCode } },
                create: {
                  casinoId: input.stage.target.casinoId,
                  countryCode,
                  availability: "AVAILABLE",
                  localDomain: input.finalHost,
                  localWebsiteUrl: `https://${input.finalHost}/`,
                  lastVerifiedAt: input.checkedAt,
                  notes: `${REGISTRATION_VERSION}: current supported-market inventory; commercial state remains RFC-042 governed.`,
                },
                update: { lastVerifiedAt: input.checkedAt },
                select: { id: true },
              });
              const evidenceId = sha256(`${REGISTRATION_VERSION}:${profile.id}`).slice(0, 32);
              const uuid = `${evidenceId.slice(0, 8)}-${evidenceId.slice(8, 12)}-4${evidenceId.slice(13, 16)}-8${evidenceId.slice(17, 20)}-${evidenceId.slice(20, 32)}`;
              await tx.casinoCountryEvidence.upsert({
                where: { id: uuid },
                create: {
                  id: uuid,
                  casinoCountryId: profile.id,
                  classification: "DETECTED",
                  sourceType: "PARTNER_COMMUNICATION",
                  sourceReference: `FOUNDER_SUPPLIED_PARTNER_URL:${input.stage.linkHash}; ${GLOBAL_CURRENT_PARTNER_RELEASE}`,
                  fieldKeys: ["availability", "countryCode"],
                  observedAt: input.checkedAt,
                  lastVerifiedAt: input.checkedAt,
                  notes: `${REGISTRATION_VERSION}; no tokenized URL retained in evidence`,
                },
                update: { lastVerifiedAt: input.checkedAt },
              });
            }
          }
          await tx.affiliateRedirectSlug.update({
            where: { id: input.stage.redirectId },
            data: { casinoId: input.stage.target.casinoId, affiliateOfferId: offer.id, active: true, archivedAt: null, updatedBy: input.actorId },
          });
          await tx.commercialOpportunity.update({
            where: { id: input.stage.target.partnerId },
            data: { affiliateNetworkId: input.stage.target.affiliateNetworkId, updatedBy: input.actorId },
          });
          return {
            ...input.stage,
            previousTrackingLinkId: input.stage.previousTrackingLinkIds.find((id) => id !== candidate.id)
              ?? priorSameScope[0]?.id
              ?? null,
          };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 45_000 });
      } catch (error) {
        lastError = error;
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (!["P2002", "P2034"].includes(code) || attempt === 4) throw error;
      }
    }
    throw lastError;
  }

  async finalizePromotion(input: {
    stage: PartnerTrackingStage;
    checkedAt: Date;
    actorId: string;
  }) {
    await this.database.$transaction(async (tx) => {
      const candidate = await tx.affiliateTrackingLink.findUniqueOrThrow({ where: { id: input.stage.trackingLinkId } });
      await tx.affiliateOffer.update({ where: { id: candidate.offerId }, data: { updatedBy: input.actorId } });
      const links = await tx.affiliateTrackingLink.findMany({ where: { offerId: candidate.offerId } });
      for (const prior of links) {
        if (prior.id === candidate.id) continue;
        const registration = registrationMetadata(prior.metadata);
        const sameScope = registration.stage === "CANONICAL"
          && registration.scope === input.stage.scope
          && (input.stage.scope === "GENERIC" || registration.geo === input.stage.geo);
        if (!sameScope) continue;
        await tx.affiliateTrackingLink.update({
          where: { id: prior.id },
          data: {
            active: false,
            metadata: json({
              ...object(prior.metadata),
              [REGISTRATION_METADATA_KEY]: {
                ...registration,
                stage: "SUPERSEDED",
                supersededAt: input.checkedAt.toISOString(),
                supersededByTrackingLinkId: candidate.id,
              },
            }),
            updatedBy: input.actorId,
          },
        });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
  }

  async rejectPromotion(input: {
    stage: PartnerTrackingStage;
    reason: string;
    checkedAt: Date;
    actorId: string;
  }) {
    const link = await this.database.affiliateTrackingLink.findUniqueOrThrow({ where: { id: input.stage.trackingLinkId } });
    const registration = registrationMetadata(link.metadata);
    await this.database.affiliateTrackingLink.update({
      where: { id: link.id },
      data: {
        active: false,
        metadata: json({
          ...object(link.metadata),
          [REGISTRATION_METADATA_KEY]: {
            ...registration,
            stage: "BROKEN",
            verification: {
              outcome: "BROKEN",
              reason: input.reason,
              checkedAt: input.checkedAt.toISOString(),
            },
          },
        }),
        updatedBy: input.actorId,
      },
    });
  }

  async reconcileAuditAndCrm(input: {
    stage: PartnerTrackingStage;
    verification: "HEALTHY" | "BROKEN" | "INCONCLUSIVE" | "ALREADY_REGISTERED";
    previousTrackingLinkId: string | null;
    results: PartnerTrackingRegistrationResultRow[];
    actorId: string;
    clientId: string;
    now: Date;
  }) {
    await this.database.$transaction(async (tx) => {
      const allLinks = await tx.affiliateTrackingLink.findMany({
        where: { offer: { program: { networkId: input.stage.target.affiliateNetworkId } } },
        select: {
          active: true,
          metadata: true,
          offer: { select: { casino: { select: { title: true, slug: true } } } },
        },
      });
      const coverage = allLinks.flatMap((link) => {
        const metadata = registrationMetadata(link.metadata);
        if (metadata.partnerId !== input.stage.target.partnerId) return [];
        return [{
          active: link.active,
          stage: typeof metadata.stage === "string" ? metadata.stage : "",
          scope: metadata.scope,
          geo: typeof metadata.geo === "string" ? metadata.geo : null,
          casino: link.offer.casino.title,
          casinoSlug: link.offer.casino.slug,
        }];
      });
      const partnerRows = CURRENT_PARTNER_INVENTORY.filter((row) => row.partner === input.stage.target.partner);
      const coversRow = (link: typeof coverage[number], row: CurrentPartnerInventorySeed) => (
        normalizeCurrentPartnerIdentity(link.casino) === normalizeCurrentPartnerIdentity(row.casino)
          || Boolean(row.casinoSlug && normalizeCurrentPartnerIdentity(link.casinoSlug) === normalizeCurrentPartnerIdentity(row.casinoSlug))
      ) && (link.scope === "GENERIC" || (link.scope === "EXACT_GEO" && link.geo === row.geo));
      const missingRows = partnerRows.filter((row) => !row.partnerTrackingUrlPresent && !coverage.some((link) =>
        link.active && link.stage === "CANONICAL" && coversRow(link, row)));
      const brokenRows = partnerRows.filter((row) => coverage.some((link) => link.stage === "BROKEN" && coversRow(link, row)));
      const missingTasks = await tx.commercialTask.findMany({
        where: { opportunityId: input.stage.target.partnerId, completedAt: null, title: { startsWith: "MISSING_TRACKING_ROUTE:" } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      if (missingRows.length === 0) {
        await tx.commercialTask.updateMany({ where: { id: { in: missingTasks.map((task) => task.id) } }, data: { completedAt: input.now } });
      } else if (missingTasks[0]) {
        await tx.commercialTask.update({
          where: { id: missingTasks[0].id },
          data: { title: `MISSING_TRACKING_ROUTE: ${missingRows.length} supported ${input.stage.target.partner} Partner × Casino × GEO rows remain without a healthy canonical route.` },
        });
      }
      if (input.verification === "BROKEN" && input.stage.previousTrackingLinkIds.length === 0) {
        const key = `${REGISTRATION_VERSION}:route-repair:${input.stage.linkHash}:${input.stage.scope}:${input.stage.geo ?? "GENERIC"}`;
        await tx.commercialTask.upsert({
          where: { opportunityId_idempotencyKey: { opportunityId: input.stage.target.partnerId, idempotencyKey: key } },
          create: {
            opportunityId: input.stage.target.partnerId,
            type: "ACTIVATION",
            title: `ROUTE_REPAIR: verified partner route for ${input.stage.target.casino} did not reach a healthy expected operator destination.`,
            idempotencyKey: key,
            createdBy: input.actorId,
          },
          update: { completedAt: null },
        });
      }
      if (["HEALTHY", "ALREADY_REGISTERED"].includes(input.verification)) {
        await tx.commercialTask.updateMany({
          where: {
            opportunityId: input.stage.target.partnerId,
            completedAt: null,
            idempotencyKey: { startsWith: `${REGISTRATION_VERSION}:route-repair:${input.stage.linkHash}:` },
          },
          data: { completedAt: input.now },
        });
      }
      const openTasks = await tx.commercialTask.findMany({
        where: { opportunityId: input.stage.target.partnerId, completedAt: null },
        select: { title: true },
      });
      const states = [...new Set(openTasks.map((task) => task.title.split(":")[0]))];
      await tx.commercialOpportunity.update({
        where: { id: input.stage.target.partnerId },
        data: {
          nextActionSummary: states.length ? `ACTIVE; remaining current states: ${states.join(", ")}.` : "ACTIVE",
          updatedBy: input.actorId,
        },
      });
      const activityKey = `${REGISTRATION_VERSION}:${input.stage.scope}:${input.stage.geo ?? "GENERIC"}:${input.stage.linkHash}:${input.verification}`;
      await tx.commercialActivity.upsert({
        where: { opportunityId_idempotencyKey: { opportunityId: input.stage.target.partnerId, idempotencyKey: activityKey } },
        create: {
          opportunityId: input.stage.target.partnerId,
          actorId: input.actorId,
          actorKind: "PARTNER_OPERATIONS_AGENT",
          type: "ACTIVATION_EVENT",
          summary: `${input.stage.target.casino} ${input.stage.scope} tracking registration ${input.verification}`,
          details: `linkHash=${input.stage.linkHash}; affectedGeoCount=${input.results.length}; active=${input.results.filter((row) => row.finalState === "ACTIVE_HEALTHY").length}; blocked=${input.results.filter((row) => row.finalState === "BLOCKED_BY_LAW").length}; regulatory=${input.results.filter((row) => row.finalState === "ACTION_REQUIRED_REGULATORY").length}; missing=${missingRows.length}; broken=${brokenRows.length}`,
          reason: `${REGISTRATION_VERSION}; raw tracking URL excluded`,
          occurredAt: input.now,
          idempotencyKey: activityKey,
        },
        update: {},
      });
      await tx.auditLog.create({ data: {
        actorId: input.actorId,
        action: "commercial-partner-tracking-link-registered",
        entityType: "commercial-opportunity",
        entityId: input.stage.target.partnerId,
        summary: `${input.stage.target.partner} / ${input.stage.target.casino}: ${input.verification}`,
        metadata: json({
          version: REGISTRATION_VERSION,
          source: "MCP_WORK",
          oauthClientIdHash: sha256(input.clientId),
          partnerId: input.stage.target.partnerId,
          casinoId: input.stage.target.casinoId,
          scope: input.stage.scope,
          geo: input.stage.geo,
          linkHash: input.stage.linkHash,
          previousTrackingLinkId: input.previousTrackingLinkId,
          newTrackingLinkId: input.stage.trackingLinkId,
          verification: input.verification,
          affectedGeoCount: input.results.length,
          counts: {
            active: input.results.filter((row) => row.finalState === "ACTIVE_HEALTHY").length,
            blockedLegal: input.results.filter((row) => row.finalState === "BLOCKED_BY_LAW").length,
            regulatory: input.results.filter((row) => row.finalState === "ACTION_REQUIRED_REGULATORY").length,
            broken: input.results.filter((row) => row.finalState === "BROKEN_ROUTE").length,
            missing: input.results.filter((row) => row.finalState === "MISSING_TRACKING_ROUTE").length,
          },
        }),
        timestamp: input.now,
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
  }
}

export const partnerTrackingRegistrationRepository = new PartnerTrackingRegistrationRepository();
