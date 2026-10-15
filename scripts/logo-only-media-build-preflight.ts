import { exitWhenOutputIsWritten, runReadOnlyReleaseVerification } from "@/lib/db/release-verification";

const RELEASE = "LOGO-ONLY-MEDIA-RETIREMENT-01";

async function verifyLogoOnlyMediaState() {
  const mode = process.argv[2] ?? "build-preflight";
  if (!["build-preflight", "production-verify", "verify"].includes(mode)) {
    throw new Error(`${RELEASE}: use build-preflight, production-verify or verify`);
  }
  if (["build-preflight", "production-verify"].includes(mode) && process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: RELEASE, skipped: true, reason: "non-production" }));
    return;
  }

  // A read-only snapshot over the direct binding, as in scripts/vercel-build-preflight.ts: the
  // pooled endpoint the site uses stalled this step past its 25 s query bound (15 October 2026).
  const summary = await runReadOnlyReleaseVerification({
    release: RELEASE,
    maxWait: 10_000,
    timeout: 30_000,
    verify: async (transaction) => {
      const [
        publishedCasinos,
        casinoAssignments,
        casinoBonusAssignments,
        offerAssignments,
        hostedCasinoAssignments,
        hostedBonusAssignments,
        hostedOfferAssignments,
        hostedCreatives,
        creativeSets,
        creativeVariants,
        mediaRevisions,
      ] = await Promise.all([
        transaction.casino.findMany({
          where: { status: "PUBLISHED", archivedAt: null },
          orderBy: { slug: "asc" },
          select: {
            id: true,
            slug: true,
            mediaAssets: {
              where: { type: "LOGO", status: "ACTIVE", archivedAt: null },
              orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
              take: 1,
              select: { id: true, publicUrl: true },
            },
          },
        }),
        transaction.casinoMediaAssignment.count({ where: { active: true } }),
        transaction.casinoBonusMediaAssignment.count({ where: { active: true } }),
        transaction.affiliateOfferMediaAssignment.count({ where: { active: true } }),
        transaction.casinoPartnerHostedCreativeAssignment.count({ where: { active: true } }),
        transaction.casinoBonusPartnerHostedCreativeAssignment.count({ where: { active: true } }),
        transaction.affiliateOfferPartnerHostedCreativeAssignment.count({ where: { active: true } }),
        transaction.partnerHostedCreative.count({ where: { OR: [{ active: true }, { archivedAt: null }] } }),
        transaction.mediaCreativeSet.count({ where: { OR: [{ status: { not: "ARCHIVED" } }, { archivedAt: null }] } }),
        transaction.mediaCreativeVariant.count({ where: { status: { in: ["PREPARED", "ACTIVE"] } } }),
        transaction.mediaRevision.count({ where: { status: { in: ["PREPARED", "ACTIVE"] } } }),
      ]);

      const activeLegacyAuthority = casinoAssignments
        + casinoBonusAssignments
        + offerAssignments
        + hostedCasinoAssignments
        + hostedBonusAssignments
        + hostedOfferAssignments
        + hostedCreatives
        + creativeSets
        + creativeVariants
        + mediaRevisions;
      if (activeLegacyAuthority !== 0) {
        throw new Error(`${RELEASE}: active MEDIA-GEO3 or placement authority remains (${activeLegacyAuthority} rows)`);
      }

      // A direct operator logo stays supported and preferred, but it is not a
      // release condition: public compositions fall back to the operator initial
      // when no active LOGO asset exists. Missing logos are reported so they stay
      // visible in the build record without blocking a Production release.
      const missingOperatorLogos = publishedCasinos
        .filter((casino) => casino.mediaAssets.length === 0)
        .map((casino) => casino.slug);

      return {
        release: RELEASE,
        verified: true,
        publishedCasinos: publishedCasinos.length,
        preservedDirectOperatorLogos: publishedCasinos.length - missingOperatorLogos.length,
        operatorsWithoutLogo: missingOperatorLogos.length,
        operatorsWithoutLogoSlugs: missingOperatorLogos,
        activeLegacyAuthority,
      };
    },
  });
  console.info(JSON.stringify(summary));
}

void verifyLogoOnlyMediaState()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : `${RELEASE}: failed`);
    process.exitCode = 1;
  })
  .finally(exitWhenOutputIsWritten);
