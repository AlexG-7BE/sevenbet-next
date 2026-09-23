import { prisma } from "@/lib/db/prisma";

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

  await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const [transactionSafety] = await transaction.$queryRawUnsafe<Array<{ transaction_read_only: string }>>(
      "SHOW transaction_read_only",
    );
    if (transactionSafety?.transaction_read_only !== "on") {
      throw new Error(`${RELEASE}: PostgreSQL did not enforce the read-only verification transaction`);
    }

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

    console.info(JSON.stringify({
      release: RELEASE,
      verified: true,
      publishedCasinos: publishedCasinos.length,
      preservedDirectOperatorLogos: publishedCasinos.length - missingOperatorLogos.length,
      operatorsWithoutLogo: missingOperatorLogos.length,
      operatorsWithoutLogoSlugs: missingOperatorLogos,
      activeLegacyAuthority,
    }));
  }, { isolationLevel: "RepeatableRead", maxWait: 10_000, timeout: 30_000 });
}

void verifyLogoOnlyMediaState()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : `${RELEASE}: failed`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
