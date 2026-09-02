import type { PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const CASINO_COMMERCIAL_ACTIVATION_01_VERCEL_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";

const CANDIDATES = [
  { name: "Hello Casino", slug: "hello-casino", countryCode: "GB" },
  { name: "Skol Casino", slug: "skol-casino", countryCode: "GB" },
  { name: "Diamond7", slug: "diamond7", countryCode: "GB" },
  { name: "G'day Casino", slug: "gday-casino", countryCode: "GB" },
  { name: "21 Privé", slug: "21-prive", countryCode: "GB" },
  { name: "Slotnite", slug: "slotnite", countryCode: "GB" },
  { name: "DragonBet", slug: "dragonbet", countryCode: "GB" },
  { name: "Betsson", slug: "betsson", countryCode: "PE" },
  { name: "Betsson", slug: "betsson", countryCode: "SE" },
] as const;

type ReleaseEnvironment = Record<string, string | undefined>;

function writeEvent(payload: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function safeUrlShape(value: string) {
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      queryKeys: [...url.searchParams.keys()].sort(),
      hasCredentials: Boolean(url.username || url.password),
    };
  } catch {
    return { protocol: null, hostname: null, pathname: null, queryKeys: [], hasCredentials: false };
  }
}

function assertProductionAuditAuthority(environment: ReleaseEnvironment) {
  if (environment.CASINO_COMMERCIAL_ACTIVATION_01_MODE !== "AUDIT") {
    throw new Error("Casino commercial activation audit requires the exact AUDIT mode.");
  }
  const sourceCommit = environment.CASINO_COMMERCIAL_ACTIVATION_01_SOURCE_COMMIT;
  const expectedCommit = environment.CASINO_COMMERCIAL_ACTIVATION_01_EXPECTED_COMMIT;
  if (!sourceCommit || !/^[0-9a-f]{40}$/.test(sourceCommit) || sourceCommit !== expectedCommit) {
    throw new Error("Casino commercial activation audit requires one exact full source commit.");
  }
  if (environment.VERCEL_ENV !== "production") {
    throw new Error("Casino commercial activation audit requires the Vercel Production environment.");
  }
  if (environment.VERCEL_PROJECT_ID !== CASINO_COMMERCIAL_ACTIVATION_01_VERCEL_PROJECT_ID) {
    throw new Error("Casino commercial activation audit refused an unexpected Vercel project.");
  }
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || !readiness.ready || readiness.environment !== "production" || !readiness.sameDatabaseIdentity) {
    throw new Error("Casino commercial activation audit requires the verified Production database binding.");
  }
  return { sourceCommit, readiness };
}

async function inventory(prisma: PrismaClient) {
  const [
    casinos, markets, operators, brands, licences, marketEvidence, bonuses, images,
    networks, programs, offers, links, routeCountries, redirects, opportunities,
    eligibleRoutes,
  ] = await Promise.all([
    prisma.casino.count(),
    prisma.casinoCountry.count(),
    prisma.casinoOperator.count(),
    prisma.casinoBrand.count(),
    prisma.casinoLicense.count(),
    prisma.casinoCountryEvidence.count(),
    prisma.casinoBonus.count(),
    prisma.casinoImage.count(),
    prisma.affiliateNetwork.count(),
    prisma.affiliateProgram.count(),
    prisma.affiliateOffer.count(),
    prisma.affiliateTrackingLink.count(),
    prisma.affiliateTrackingLinkCountry.count(),
    prisma.affiliateRedirectSlug.count(),
    prisma.commercialOpportunity.count(),
    prisma.affiliateTrackingLinkCountry.count({ where: { productionEligible: true } }),
  ]);
  return { casinos, markets, operators, brands, licences, marketEvidence, bonuses, images, networks, programs, offers, links, routeCountries, redirects, opportunities, eligibleRoutes };
}

async function candidateMatrix(prisma: PrismaClient) {
  const rows = [];
  for (const candidate of CANDIDATES) {
    const casino = await prisma.casino.findUnique({
      where: { slug: candidate.slug },
      select: {
        id: true,
        title: true,
        status: true,
        archivedAt: true,
        countries: {
          where: { countryCode: candidate.countryCode },
          select: { id: true, availability: true, primaryLanguage: true, primaryCurrency: true },
        },
        images: { select: { id: true, kind: true, url: true, alt: true, isPrimary: true } },
        affiliatePrograms: {
          select: {
            id: true,
            name: true,
            status: true,
            workflowStatus: true,
            supportedCountries: true,
            archivedAt: true,
            network: { select: { name: true, slug: true, active: true, archivedAt: true } },
            offers: {
              select: {
                id: true,
                status: true,
                geoMode: true,
                archivedAt: true,
                countries: { where: { countryCode: candidate.countryCode }, select: { countryCode: true, mode: true } },
                trackingLinks: {
                  select: {
                    id: true,
                    active: true,
                    geoMode: true,
                    verifiedAt: true,
                    lastCheckedAt: true,
                    archivedAt: true,
                    destinationUrl: true,
                    trackingUrl: true,
                    countries: { where: { countryCode: candidate.countryCode }, select: {
                      countryCode: true,
                      mode: true,
                      productionEligible: true,
                      productionEligibilityVerifiedAt: true,
                      productionEligibilityExpiresAt: true,
                      productionEligibilityEvidence: true,
                    } },
                  },
                },
              },
            },
          },
        },
        redirectSlugs: { select: { slug: true, active: true, archivedAt: true, affiliateOfferId: true } },
      },
    });

    rows.push({
      casino: candidate.name,
      slug: candidate.slug,
      countryCode: candidate.countryCode,
      exists: Boolean(casino),
      title: casino?.title ?? null,
      publicationStatus: casino?.status ?? null,
      archived: Boolean(casino?.archivedAt),
      market: casino?.countries[0] ?? null,
      assets: casino?.images.map((image) => ({ ...image, url: safeUrlShape(image.url) })) ?? [],
      programs: casino?.affiliatePrograms.map((program) => ({
        id: program.id,
        name: program.name,
        status: program.status,
        workflowStatus: program.workflowStatus,
        supportedCountries: program.supportedCountries,
        archived: Boolean(program.archivedAt),
        network: { ...program.network, archived: Boolean(program.network.archivedAt), archivedAt: undefined },
        offers: program.offers.map((offer) => ({
          id: offer.id,
          status: offer.status,
          geoMode: offer.geoMode,
          archived: Boolean(offer.archivedAt),
          countries: offer.countries,
          links: offer.trackingLinks.map((link) => ({
            id: link.id,
            active: link.active,
            geoMode: link.geoMode,
            verifiedAt: link.verifiedAt,
            lastCheckedAt: link.lastCheckedAt,
            archived: Boolean(link.archivedAt),
            destination: safeUrlShape(link.destinationUrl),
            tracking: safeUrlShape(link.trackingUrl),
            countries: link.countries.map((country) => ({
              ...country,
              hasProductionEvidence: Boolean(country.productionEligibilityEvidence?.trim()),
              productionEligibilityEvidence: undefined,
            })),
          })),
        })),
      })) ?? [],
      redirects: casino?.redirectSlugs ?? [],
    });
  }
  return rows;
}

async function commercialEvidenceSummary(prisma: PrismaClient) {
  const needles = ["hello", "skol", "diamond7", "g'day", "gday", "21 privé", "21 prive", "slotnite", "dragonbet", "betsson", "superfly", "brothers bet"];
  const opportunities = await prisma.commercialOpportunity.findMany({
    where: { OR: needles.map((needle) => ({ normalizedName: { contains: needle, mode: "insensitive" as const } })) },
    orderBy: [{ normalizedName: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      displayName: true,
      normalizedName: true,
      stage: true,
      waitingOn: true,
      updatedAt: true,
      casinoId: true,
      affiliateNetworkId: true,
      affiliateProgramId: true,
      evidence: { orderBy: { recordedAt: "desc" }, select: {
        category: true,
        classification: true,
        sourceAuthority: true,
        sourceType: true,
        status: true,
        observedAt: true,
        expiresAt: true,
        recheckAt: true,
        sourceUrl: true,
        sourceReference: true,
      } },
      terms: { orderBy: { createdAt: "desc" }, select: {
        model: true,
        status: true,
        territory: true,
        effectiveAt: true,
        expiresAt: true,
        trafficRestrictions: true,
        trackingRequirements: true,
        entityRequirements: true,
      } },
      activationPackets: { orderBy: { createdAt: "desc" }, select: { status: true, createdAt: true } },
    },
  });
  return opportunities.map((opportunity) => ({
    id: opportunity.id,
    displayName: opportunity.displayName,
    normalizedName: opportunity.normalizedName,
    stage: opportunity.stage,
    waitingOn: opportunity.waitingOn,
    updatedAt: opportunity.updatedAt,
    casinoLinked: Boolean(opportunity.casinoId),
    affiliateNetworkLinked: Boolean(opportunity.affiliateNetworkId),
    affiliateProgramLinked: Boolean(opportunity.affiliateProgramId),
    evidence: Object.values(opportunity.evidence.reduce<Record<string, {
      category: string;
      classification: string;
      sourceAuthority: string | null;
      sourceType: string;
      status: string;
      count: number;
      latestObservedAt: Date | null;
      latestRecheckAt: Date | null;
      latestExpiresAt: Date | null;
      sourceReferencePresent: boolean;
    }>>((summary, evidence) => {
      const key = [evidence.category, evidence.classification, evidence.sourceAuthority ?? "NONE", evidence.sourceType, evidence.status].join("|");
      const current = summary[key];
      summary[key] = {
        category: evidence.category,
        classification: evidence.classification,
        sourceAuthority: evidence.sourceAuthority,
        sourceType: evidence.sourceType,
        status: evidence.status,
        count: (current?.count ?? 0) + 1,
        latestObservedAt: !current?.latestObservedAt || (evidence.observedAt && evidence.observedAt > current.latestObservedAt) ? evidence.observedAt : current.latestObservedAt,
        latestRecheckAt: !current?.latestRecheckAt || (evidence.recheckAt && evidence.recheckAt > current.latestRecheckAt) ? evidence.recheckAt : current.latestRecheckAt,
        latestExpiresAt: !current?.latestExpiresAt || (evidence.expiresAt && evidence.expiresAt > current.latestExpiresAt) ? evidence.expiresAt : current.latestExpiresAt,
        sourceReferencePresent: (current?.sourceReferencePresent ?? false) || Boolean(evidence.sourceReference?.trim()),
      };
      return summary;
    }, {})),
    terms: opportunity.terms.map((term) => ({
      model: term.model,
      status: term.status,
      territoryMatches: {
        GB: /(^|\W)GB(\W|$)|united kingdom|great britain/i.test(term.territory ?? ""),
        PE: /(^|\W)PE(\W|$)|peru/i.test(term.territory ?? ""),
        SE: /(^|\W)SE(\W|$)|sweden/i.test(term.territory ?? ""),
      },
      effectiveAt: term.effectiveAt,
      expiresAt: term.expiresAt,
      trafficRestrictionCount: term.trafficRestrictions.length,
      hasTrackingRequirements: Boolean(term.trackingRequirements?.trim()),
      hasEntityRequirements: Boolean(term.entityRequirements?.trim()),
    })),
    activationPackets: opportunity.activationPackets,
  }));
}

export function isCasinoCommercialActivation01Requested(environment: ReleaseEnvironment) {
  return environment.CASINO_COMMERCIAL_ACTIVATION_01_MODE !== undefined;
}

export async function runCasinoCommercialActivation01Preflight(environment: ReleaseEnvironment = process.env) {
  const authority = assertProductionAuditAuthority(environment);
  const prisma = createCasinoMarket0025AdminClient();
  try {
    writeEvent({
      event: "casino_commercial_activation_01_production_audit_start",
      sourceCommit: authority.sourceCommit,
      projectId: CASINO_COMMERCIAL_ACTIVATION_01_VERCEL_PROJECT_ID,
      databaseReady: authority.readiness.ready,
    });
    writeEvent({ event: "casino_commercial_activation_01_inventory", ...(await inventory(prisma)) });
    writeEvent({ event: "casino_commercial_activation_01_candidate_matrix", candidates: await candidateMatrix(prisma) });
    const opportunities = await commercialEvidenceSummary(prisma);
    writeEvent({ event: "casino_commercial_activation_01_commercial_evidence_count", opportunityCount: opportunities.length });
    for (const opportunity of opportunities) {
      writeEvent({ event: "casino_commercial_activation_01_commercial_evidence", opportunity });
    }
    writeEvent({ event: "casino_commercial_activation_01_production_audit_complete", mutationCount: 0 });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}
