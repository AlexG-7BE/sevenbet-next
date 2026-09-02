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
  const needles = ["hello", "skol", "diamond7", "g'day", "gday", "21 privé", "21 prive", "slotnite", "dragonbet", "betsson"];
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
    ...opportunity,
    evidence: opportunity.evidence.map((evidence) => ({
      ...evidence,
      sourceUrl: evidence.sourceUrl ? safeUrlShape(evidence.sourceUrl) : null,
      hasSourceReference: Boolean(evidence.sourceReference?.trim()),
      sourceReference: undefined,
    })),
    terms: opportunity.terms.map((term) => ({
      ...term,
      hasTrackingRequirements: Boolean(term.trackingRequirements?.trim()),
      hasEntityRequirements: Boolean(term.entityRequirements?.trim()),
      trackingRequirements: undefined,
      entityRequirements: undefined,
    })),
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
    writeEvent({ event: "casino_commercial_activation_01_commercial_evidence", opportunities: await commercialEvidenceSummary(prisma) });
    writeEvent({ event: "casino_commercial_activation_01_production_audit_complete", mutationCount: 0 });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}
