import prisma from "../lib/db/prisma";

const slugs = [
  "betsson",
  "skol-casino",
  "hello-casino",
  "gday-casino",
  "diamond7",
  "dragonbet",
  "21-prive",
  "slotnite",
] as const;

function publicLocation(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return "INVALID_PUBLIC_LOCATION";
  }
}

async function main() {
  const casinos = await prisma.casino.findMany({
    where: { slug: { in: [...slugs] } },
    orderBy: { slug: "asc" },
    select: {
      slug: true,
      status: true,
      publishedVersion: true,
      mediaAssets: {
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          type: true,
          storageProvider: true,
          publicUrl: true,
          width: true,
          height: true,
          featured: true,
          status: true,
          casinoBonusId: true,
          affiliateOfferId: true,
        },
      },
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
        select: { version: true, snapshot: true },
      },
    },
  });

  const result = casinos.map((casino) => {
    const snapshot = casino.versions[0]?.snapshot;
    const snapshotObject = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
      ? snapshot as Record<string, unknown>
      : {};
    const snapshotMedia = Array.isArray(snapshotObject.mediaAssets) ? snapshotObject.mediaAssets : [];
    return {
      slug: casino.slug,
      status: casino.status,
      publishedVersion: casino.publishedVersion,
      latestPublishedSnapshotVersion: casino.versions[0]?.version ?? null,
      latestPublishedSnapshotMediaCount: snapshotMedia.length,
      mediaAssets: casino.mediaAssets.map((asset) => ({
        type: asset.type,
        storageProvider: asset.storageProvider,
        publicLocation: publicLocation(asset.publicUrl),
        dimensions: asset.width && asset.height ? `${asset.width}x${asset.height}` : "UNKNOWN",
        featured: asset.featured,
        status: asset.status,
        owner: asset.casinoBonusId ? "CASINO_BONUS" : asset.affiliateOfferId ? "AFFILIATE_OFFER" : "CASINO",
      })),
    };
  });

  console.log(JSON.stringify({ expectedCasinos: slugs.length, detectedCasinos: casinos.length, casinos: result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Media audit failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
