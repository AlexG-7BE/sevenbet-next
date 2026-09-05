import type { AffiliateOffer, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { MediaIngestionContextInput, MediaIngestionPlan } from "@/lib/media-operations/contracts";
import type { ParsedCreativeInternal } from "@/lib/media-operations/parser";

type PersistedResolvedContext = MediaIngestionPlan["resolvedContext"];

export type MediaResolvedContextRuntime = {
  persisted: PersistedResolvedContext;
  casinoStatus: string | null;
  bonus: {
    id: string;
    status: string;
    offerStatus: string;
    percentage: number | null;
    maximumBonus: number | null;
    currency: string | null;
    freeSpins: number | null;
    title: string;
  } | null;
  affiliateOffer: { id: string; status: string; casinoBonusId: string | null; languages: string[] } | null;
};

function normalized(value: string | null | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, "") || "";
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function decimal(value: Prisma.Decimal | null | undefined) {
  return value === null || value === undefined ? null : Number(value.toString());
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return value.trim();
  }
}

export async function resolveMediaIngestionContext(
  requested: MediaIngestionContextInput,
  creatives: ParsedCreativeInternal[],
): Promise<MediaResolvedContextRuntime> {
  const notes: string[] = [];
  let conflict = false;
  const casinoById = requested.casinoId
    ? await prisma.casino.findUnique({ where: { id: requested.casinoId }, include: { aliases: true, brandProfile: true, operatorProfile: true } })
    : null;
  const casinoBySlug = requested.casinoSlug
    ? await prisma.casino.findUnique({ where: { slug: requested.casinoSlug }, include: { aliases: true, brandProfile: true, operatorProfile: true } })
    : null;
  const explicitBonus = requested.bonusId
    ? await prisma.casinoBonus.findUnique({ where: { id: requested.bonusId } })
    : null;
  const opportunity = requested.opportunityId
    ? await prisma.commercialOpportunity.findUnique({
      where: { id: requested.opportunityId },
      include: { affiliateNetwork: true, affiliateProgram: true, casino: { include: { aliases: true, brandProfile: true, operatorProfile: true } } },
    })
    : null;

  if (requested.casinoId && !casinoById) { notes.push("Explicit casinoId was not found."); conflict = true; }
  if (requested.casinoSlug && !casinoBySlug) { notes.push("Explicit casinoSlug was not found."); conflict = true; }
  if (requested.bonusId && !explicitBonus) { notes.push("Explicit bonusId was not found."); conflict = true; }
  if (requested.opportunityId && !opportunity) { notes.push("Explicit opportunityId was not found."); conflict = true; }

  const explicitCasinoIds = new Set([
    casinoById?.id,
    casinoBySlug?.id,
    explicitBonus?.casinoId,
    opportunity?.casinoId,
  ].filter((value): value is string => Boolean(value)));
  if (explicitCasinoIds.size > 1) { notes.push("Explicit context resolves to different casinos."); conflict = true; }

  let casino = casinoById ?? casinoBySlug ?? opportunity?.casino ?? null;
  if (!casino && explicitBonus) {
    casino = await prisma.casino.findUnique({ where: { id: explicitBonus.casinoId }, include: { aliases: true, brandProfile: true, operatorProfile: true } });
  }

  let source: PersistedResolvedContext["source"] = casino ? "EXPLICIT" : "NONE";
  let ambiguous = false;
  if (!casino && !conflict) {
    const evidence = normalized(creatives.flatMap((creative) => [
      creative.providerDomain,
      creative.source.pathname,
      creative.alt,
      creative.title,
      ...Object.values(creative.identifiers),
    ]).filter(Boolean).join(" "));
    const candidates = await prisma.casino.findMany({
      where: { archivedAt: null },
      include: { aliases: true, brandProfile: true, operatorProfile: true },
      orderBy: { id: "asc" },
      take: 500,
    });
    const scored = candidates.map((candidate) => {
      const domain = normalized(candidate.domain);
      const title = normalized(candidate.title);
      const aliases = candidate.aliases.map((alias) => normalized(alias.value)).filter((value) => value.length >= 3);
      const brand = normalized(candidate.brandProfile?.name);
      const operator = normalized(candidate.operatorProfile?.name || candidate.operator);
      let score = 0;
      if (domain.length >= 4 && evidence.includes(domain)) score = Math.max(score, 110);
      if (title.length >= 4 && evidence.includes(title)) score = Math.max(score, 100);
      if (aliases.some((alias) => evidence.includes(alias))) score = Math.max(score, 90);
      if (brand.length >= 4 && evidence.includes(brand)) score = Math.max(score, 75);
      if (operator.length >= 4 && evidence.includes(operator)) score = Math.max(score, 70);
      return { candidate, score };
    }).filter((entry) => entry.score > 0).sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id));
    if (scored[0] && scored[0].score >= 70 && (!scored[1] || scored[0].score - scored[1].score >= 20)) {
      casino = scored[0].candidate;
      source = "DETERMINISTIC";
      notes.push(`Casino resolved deterministically at confidence score ${scored[0].score}.`);
    } else if (scored.length) {
      ambiguous = true;
      notes.push("Casino evidence matched more than one plausible record.");
    }
  }

  let bonus = explicitBonus;
  if (!bonus && casino && !conflict) {
    const bonuses = await prisma.casinoBonus.findMany({ where: { casinoId: casino.id, status: "DRAFT" }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 3 });
    if (bonuses.length === 1) {
      bonus = bonuses[0];
      notes.push("The casino's only draft bonus was selected deterministically.");
    } else if (bonuses.length > 1) notes.push("Multiple draft bonuses exist; no bonus was inferred.");
  }
  if (bonus && casino && bonus.casinoId !== casino.id) { notes.push("Selected bonus does not belong to the selected casino."); conflict = true; }

  const partnerIdentifier = requested.partnerIdentifier ?? opportunity?.affiliateNetwork?.slug ?? opportunity?.affiliateProgram?.name ?? null;
  let partnerProgramId = opportunity?.affiliateProgramId ?? null;
  if (requested.partnerIdentifier && !partnerProgramId) {
    const identifier = requested.partnerIdentifier;
    const network = await prisma.affiliateNetwork.findFirst({ where: { OR: [...(uuid(identifier) ? [{ id: identifier }] : []), { slug: { equals: identifier, mode: "insensitive" } }, { name: { equals: identifier, mode: "insensitive" } }] } });
    const program = await prisma.affiliateProgram.findFirst({ where: { OR: [...(uuid(identifier) ? [{ id: identifier }] : []), { externalProgramId: identifier }, { name: { equals: identifier, mode: "insensitive" } }] } });
    if (program) partnerProgramId = program.id;
    else if (network) {
      const programs = await prisma.affiliateProgram.findMany({ where: { networkId: network.id, ...(casino ? { casinoId: casino.id } : {}) }, select: { id: true }, take: 3 });
      if (programs.length === 1) partnerProgramId = programs[0].id;
      else if (programs.length > 1) notes.push("Partner resolves to multiple affiliate programs.");
    } else notes.push("Partner identifier was retained as evidence but did not resolve to a governed partner record.");
  }

  let affiliateOffer: AffiliateOffer | null = null;
  if (casino && !conflict) {
    const offers = await prisma.affiliateOffer.findMany({
      where: {
        casinoId: casino.id,
        status: "DRAFT",
        ...(bonus ? { casinoBonusId: bonus.id } : {}),
        ...(partnerProgramId ? { programId: partnerProgramId } : {}),
      },
      orderBy: [{ priority: "desc" }, { id: "asc" }],
      take: 3,
    });
    if (offers.length === 1) affiliateOffer = offers[0];
    else if (offers.length > 1) notes.push("Multiple draft affiliate offers match the context; assignment will use the bonus subject unless reviewed.");
  }

  const anchors = [...new Set(creatives.map((creative) => creative.anchorHref).filter((value): value is string => Boolean(value)).map(canonicalUrl))];
  let trackingDestinationState: PersistedResolvedContext["trackingDestinationState"] = anchors.length ? "TRACKING_DESTINATION_REVIEW_REQUIRED" : "NOT_PRESENT";
  if (anchors.length && affiliateOffer) {
    const links = await prisma.affiliateTrackingLink.findMany({
      where: { offerId: affiliateOffer.id, archivedAt: null },
      select: { trackingUrl: true, destinationUrl: true },
      take: 200,
    });
    const known = new Set(links.flatMap((link) => [link.trackingUrl, link.destinationUrl]).map(canonicalUrl));
    if (anchors.some((anchor) => known.has(anchor))) trackingDestinationState = "MATCH";
    else if (links.length) trackingDestinationState = "MISMATCH";
  }
  if (trackingDestinationState !== "MATCH" && anchors.length) notes.push("TRACKING_DESTINATION_REVIEW_REQUIRED: pasted href evidence was not activated or used as a route.");

  const state: PersistedResolvedContext["state"] = conflict ? "CONFLICT" : ambiguous ? "AMBIGUOUS" : casino ? "RESOLVED" : "UNRESOLVED";
  return {
    persisted: {
      state,
      source: conflict || ambiguous ? "NONE" : source,
      casinoId: casino?.id ?? null,
      casinoSlug: casino?.slug ?? null,
      casinoTitle: casino?.title ?? null,
      bonusId: bonus?.id ?? null,
      bonusTitle: bonus?.title ?? null,
      affiliateOfferId: affiliateOffer?.id ?? null,
      opportunityId: opportunity?.id ?? null,
      partnerIdentifier,
      trackingDestinationState,
      notes,
    },
    casinoStatus: casino?.status ?? null,
    bonus: bonus ? {
      id: bonus.id,
      status: bonus.status,
      offerStatus: bonus.offerStatus,
      percentage: decimal(bonus.percentage),
      maximumBonus: decimal(bonus.maximumBonus),
      currency: bonus.currency,
      freeSpins: bonus.freeSpins,
      title: bonus.title,
    } : null,
    affiliateOffer: affiliateOffer ? { id: affiliateOffer.id, status: affiliateOffer.status, casinoBonusId: affiliateOffer.casinoBonusId, languages: affiliateOffer.languages } : null,
  };
}
