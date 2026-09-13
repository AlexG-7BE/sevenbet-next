import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { Prisma } from "@prisma/client";

import { evaluateGbCommercialReadiness } from "@/lib/affiliate-commercial/gb-commercial-route-readiness";
import { gbCommercialDomainEvidenceStore } from "@/lib/affiliate-commercial/gb-domain-evidence";
import { worldwideFounderGbAuthorityApplies } from "@/lib/current-partner-worldwide-authority/inventory";
import { prisma } from "@/lib/db/prisma";
import { canonicalCommercialMarketKey } from "@/lib/jurisdiction/canonical-commercial-market";
import { evaluateGbOperatorEligibility } from "@/lib/jurisdiction/gb-operator-eligibility";
import { jurisdictionResolver } from "@/lib/jurisdiction/resolver";
import { scopedCasinoReferralAllowed } from "@/lib/jurisdiction/scoped-commercial-authority";
import { safeActivationDestination } from "@/lib/market-activation/contract";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { mapCasinoAggregateToDomain } from "@/lib/repositories/casino-domain.mapper";
import { casinoAggregateInclude } from "@/lib/repositories/casino.repository";

const EXPECTED_DATABASE_FINGERPRINT = "ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function databaseFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function distribution<T extends Record<string, unknown>>(rows: T[], keys: Array<keyof T>) {
  return Object.fromEntries([...rows.reduce((counts, row) => {
    const key = keys.map((field) => `${String(field)}=${String(row[field])}`).join("|");
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>()).entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function currentDate(value: Date | null, now: Date, boundary: "start" | "end") {
  return !value || (boundary === "start" ? value <= now : value > now);
}

function legacyProgramGate(program: {
  status: string;
  workflowStatus: string;
  integrationMode: string;
  connectionStatus: string;
  providerAccountId: string | null;
  credentialReference: string | null;
  domainLifecycleStatus: string | null;
  archivedAt: Date | null;
  trustedAutoActivation: boolean;
  network: { active: boolean; archivedAt: Date | null };
}) {
  return program.status === "ACTIVE"
    && program.workflowStatus === "PUBLISHED"
    && !program.archivedAt
    && !["SUSPENDED", "ARCHIVED"].includes(program.domainLifecycleStatus ?? "")
    && program.network.active
    && !program.network.archivedAt
    && (program.integrationMode === "MANUAL"
      || (program.connectionStatus === "CONNECTED" && Boolean(program.providerAccountId) && Boolean(program.credentialReference)));
}

async function projection(transaction: Prisma.TransactionClient) {
  await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
  const now = new Date();
  const [networks, programs, offers, trackingLinks, offerCountries, trackingCountries, records, legacyZzRecords] = await Promise.all([
    transaction.affiliateNetwork.findMany({ select: { active: true, archivedAt: true } }),
    transaction.affiliateProgram.findMany({ select: { status: true, workflowStatus: true, domainLifecycleStatus: true, archivedAt: true } }),
    transaction.affiliateOffer.findMany({ select: { status: true, geoMode: true, domainLifecycleStatus: true, archivedAt: true } }),
    transaction.affiliateTrackingLink.findMany({ select: { active: true, geoMode: true, archivedAt: true } }),
    transaction.affiliateOfferCountry.findMany({ select: { mode: true } }),
    transaction.affiliateTrackingLinkCountry.findMany({ select: { mode: true, productionEligible: true } }),
    transaction.marketActivation.findMany({
      where: { product: "CASINO", marketCode: { not: "ZZ" } },
      include: {
        casino: { select: { id: true, slug: true, status: true, archivedAt: true } },
        marketProfile: { select: { casinoId: true, countryCode: true } },
        affiliateOffer: {
          include: {
            program: { include: { network: true } },
          },
        },
        casinoBonus: { select: { id: true, casinoId: true } },
        primaryTrackingLink: true,
        redirectSlug: true,
      },
      orderBy: [{ marketCode: "asc" }, { casinoId: "asc" }, { id: "asc" }],
    }),
    transaction.marketActivation.findMany({
      where: { product: "CASINO", marketCode: "ZZ" },
      select: { desiredState: true, status: true, routeVerificationStatus: true },
    }),
  ]);

  const casinoIds = [...new Set(records.map((record) => record.casinoId))];
  const casinoAggregates = await transaction.casino.findMany({
    where: { id: { in: casinoIds } },
    include: casinoAggregateInclude,
  });
  const casinoDomains = new Map(casinoAggregates.map((casino) => [casino.id, mapCasinoAggregateToDomain(casino)]));
  const routeMultiplicity = records.reduce((counts, record) => {
    const key = `${record.casinoId}:${record.marketCode}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  const decisions = new Map<string, Awaited<ReturnType<typeof jurisdictionResolver.resolve>>>();
  for (const countryCode of [...new Set(records.map((record) => record.countryCode))]) {
    decisions.set(countryCode, await jurisdictionResolver.resolve({
      requestCountrySignal: { countryCode, marketCode: countryCode, trust: "TRUSTED", observedAt: now },
      accountCountry: null,
      now,
    }));
  }

  const comparisons = records.map((record) => {
    const offer = record.affiliateOffer;
    const link = record.primaryTrackingLink;
    const redirect = record.redirectSlug;
    const canonicalKey = canonicalCommercialMarketKey({ countryCode: record.countryCode, marketCode: record.marketCode, trust: "TRUSTED" });
    const unambiguous = routeMultiplicity.get(`${record.casinoId}:${record.marketCode}`) === 1;
    const commonRoute = canonicalKey === record.marketCode
      && record.desiredState === "ACTIVE"
      && record.status === "ACTIVE"
      && record.routeVerificationStatus === "HEALTHY"
      && Boolean(record.routeLastCheckedAt)
      && unambiguous
      && (!record.marketProfile || (record.marketProfile.casinoId === record.casinoId && record.marketProfile.countryCode === record.countryCode))
      && Boolean(offer && offer.casinoId === record.casinoId && offer.program.casinoId === record.casinoId)
      && Boolean(offer?.casinoBonusId === record.casinoBonusId)
      && Boolean(!record.casinoBonusId || (record.casinoBonus?.casinoId === record.casinoId && record.casinoBonus.id === record.casinoBonusId))
      && Boolean(link && offer && link.offerId === offer.id && currentDate(link.validFrom, now, "start") && currentDate(link.expiresAt, now, "end"))
      && Boolean(redirect && offer && redirect.casinoId === record.casinoId && redirect.affiliateOfferId === offer.id
        && redirect.casinoBonusId === record.casinoBonusId && redirect.active && !redirect.archivedAt && isSafePublicSlug(redirect.slug))
      && Boolean(link && safeActivationDestination(link.trackingUrl) && safeActivationDestination(link.destinationUrl));
    const currentRoute = commonRoute && Boolean(link?.active && !link.archivedAt);
    const pr4Route = commonRoute && Boolean(offer && currentDate(offer.startAt, now, "start") && currentDate(offer.expiresAt, now, "end"));
    const decision = decisions.get(record.countryCode)!;
    const legalAllowed = scopedCasinoReferralAllowed(decision, record.casino.slug);
    const published = record.casino.status === "PUBLISHED" && !record.casino.archivedAt;

    const legacyAffiliateGate = Boolean(offer && link
      && legacyProgramGate(offer.program)
      && offer.status === "ACTIVE"
      && !offer.archivedAt
      && !["SUSPENDED", "ARCHIVED"].includes(offer.domainLifecycleStatus ?? "")
      && currentDate(offer.startAt, now, "start")
      && currentDate(offer.expiresAt, now, "end")
      && link.active
      && !link.archivedAt);

    let currentGbPublic = true;
    let currentGbRedirect = true;
    let pr4Gb = true;
    let currentGbReason = "NOT_APPLICABLE";
    let pr4GbReason = "NOT_APPLICABLE";
    if (record.countryCode === "GB" && offer && link && redirect) {
      const casino = casinoDomains.get(record.casinoId);
      if (!casino) {
        currentGbPublic = false;
        currentGbRedirect = false;
        pr4Gb = false;
        currentGbReason = "CASINO_EVIDENCE_UNAVAILABLE";
        pr4GbReason = "GB_COMMERCIAL_EVIDENCE_UNAVAILABLE";
      } else {
        const domainRecord = gbCommercialDomainEvidenceStore.findExact(casino.id, casino.domain);
        const redirectContract = {
          slugActive: redirect.active && !redirect.archivedAt,
          destinationServerOwned: true,
          destinationSafe: safeActivationDestination(link.trackingUrl) && safeActivationDestination(link.destinationUrl),
        };
        const domainEvidence = domainRecord ? {
          domain: domainRecord.domain,
          sourceUrl: domainRecord.officialSourceUrl,
          status: "VERIFIED" as const,
          observedAt: new Date(domainRecord.observedAt),
          expiresAt: new Date(domainRecord.revalidateAt),
        } : null;
        const operator = evaluateGbOperatorEligibility({ casino, now, domainEvidence, redirectContract });
        currentGbPublic = operator.referralEligible && legacyAffiliateGate;
        currentGbReason = currentGbPublic ? "GB_OPERATOR_ELIGIBLE" : operator.reasonCodes[0] ?? "LEGACY_AFFILIATE_LIFECYCLE_DENIED";
        const readiness = evaluateGbCommercialReadiness({
          casino,
          route: {
            program: { id: offer.program.id, casinoId: offer.program.casinoId, operator: offer.program.operator, metadata: offer.program.metadata },
            offer: { id: offer.id, casinoId: offer.casinoId, casinoBonusId: offer.casinoBonusId, startAt: offer.startAt, expiresAt: offer.expiresAt },
            trackingLink: { id: link.id, offerId: link.offerId, destinationUrl: link.destinationUrl, trackingUrl: link.trackingUrl, verifiedAt: link.verifiedAt, lastCheckedAt: link.lastCheckedAt, validFrom: link.validFrom, expiresAt: link.expiresAt },
          },
          domainEvidence: domainRecord,
          jurisdictionDecision: decision,
          redirectContract,
          founderWorldwideAuthority: worldwideFounderGbAuthorityApplies(record.casino.slug),
          now,
        });
        pr4Gb = readiness.referralReady;
        pr4GbReason = readiness.reasonCodes[0] ?? "GB_COMMERCIAL_EVIDENCE_UNAVAILABLE";
        currentGbRedirect = readiness.referralReady && legacyAffiliateGate && !offer.program.trustedAutoActivation;
      }
    }

    const currentAction = published && legalAllowed && currentRoute && currentGbPublic;
    const pr4Action = published && legalAllowed && pr4Route && pr4Gb;
    const currentRedirect = published && legalAllowed && currentRoute && currentGbRedirect;
    const pr4Redirect = published && legalAllowed && pr4Route && pr4Gb;
    let classification = "UNCHANGED";
    if (currentAction !== pr4Action || currentRedirect !== pr4Redirect) {
      if (!currentAction && pr4Action && !legacyAffiliateGate && pr4Route) classification = "INTENDED_SIMPLIFICATION";
      else if (record.countryCode === "GB" && currentGbPublic !== pr4Gb) classification = "LEGAL_CHANGE";
      else if (currentRoute && !pr4Route) classification = "TECHNICAL_CHANGE";
      else classification = "UNINTENDED_REGRESSION";
    }
    return {
      route: `${record.casino.slug}:${record.marketCode}`,
      currentAction,
      pr4Action,
      currentRedirect,
      pr4Redirect,
      legalOutcome: { allowed: legalAllowed, reasonCode: decision.reasonCode },
      gbOutcome: { current: currentGbPublic, currentReason: currentGbReason, pr4: pr4Gb, pr4Reason: pr4GbReason },
      healthOutcome: { status: record.status, routeVerificationStatus: record.routeVerificationStatus },
      destination: link ? { sha256: sha256(link.trackingUrl), finalHost: record.routeFinalHost } : null,
      legacyAffiliateGate,
      classification,
    };
  });

  const differences = comparisons.filter((row) => row.classification !== "UNCHANGED");
  return {
    operation: "COMMERCIAL-CORE-PR4-AFFILIATE-LIFECYCLE-PROJECTION",
    mode: "READ_ONLY_REPEATABLE_READ",
    productionMutationPerformed: false,
    capturedAt: now.toISOString(),
    head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    lifecycleDistribution: {
      affiliateNetwork: distribution(networks, ["active", "archivedAt"]),
      affiliateProgram: distribution(programs, ["status", "workflowStatus", "domainLifecycleStatus", "archivedAt"]),
      affiliateOffer: distribution(offers, ["status", "geoMode", "domainLifecycleStatus", "archivedAt"]),
      affiliateTrackingLink: distribution(trackingLinks, ["active", "geoMode", "archivedAt"]),
      affiliateOfferCountry: distribution(offerCountries, ["mode"]),
      affiliateTrackingLinkCountry: distribution(trackingCountries, ["mode", "productionEligible"]),
    },
    semanticProjection: {
      routeCount: comparisons.length,
      totalMarketActivationRows: comparisons.length + legacyZzRecords.length,
      legacyZzRowsExcludedAsNonCanonical: legacyZzRecords.length,
      activeLegacyZzRows: legacyZzRecords.filter((row) => row.desiredState === "ACTIVE" && row.status === "ACTIVE").length,
      unchanged: comparisons.length - differences.length,
      intendedSimplifications: differences.filter((row) => row.classification === "INTENDED_SIMPLIFICATION").length,
      unintendedRegressions: differences.filter((row) => row.classification === "UNINTENDED_REGRESSION").length,
      legalChanges: differences.filter((row) => row.classification === "LEGAL_CHANGE").length,
      technicalChanges: differences.filter((row) => row.classification === "TECHNICAL_CHANGE").length,
      differences,
    },
  };
}

async function main() {
  if (databaseFingerprint() !== EXPECTED_DATABASE_FINGERPRINT) throw new Error("PR4_PRODUCTION_DATABASE_FINGERPRINT_MISMATCH");
  const result = await prisma.$transaction(projection, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    maxWait: 10_000,
    timeout: 120_000,
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
