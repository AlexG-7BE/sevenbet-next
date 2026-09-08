import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { deterministicCasinoIngestionId } from "@/lib/casino-ingestion/importer";
import prisma from "@/lib/db/prisma";

const CATALOG_RELEASE = "CASINO-REAL-CATALOG-03";
const MEDIA_RELEASE = "CASINO-REAL-CATALOG-03-MEDIA";
const CORPUS_PATH = "data/casino-real-catalog-03/catalog.v1.json";
const EXPECTED_IMPORTED_SLUGS = ["betsafe", "inkabet", "nordicbet", "rizk"] as const;
const ASSIGNMENT_SORT_ORDER = 0;

type ImportedLogo = {
  slug: string;
  status: "PARTNER_ASSET_IMPORTED";
  source: string;
  officialSource: string;
  asset: string;
  sha256: string;
};

type LogoProvenance = ImportedLogo | {
  slug: string;
  status: string;
  source: string | null;
  officialSource?: string | null;
  asset?: string | null;
  sha256?: string | null;
};

type CatalogCorpus = {
  release: string;
  logoProvenance: LogoProvenance[];
};

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngDimensions(bytes: Buffer) {
  const signature = "89504e470d0a1a0a";
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== signature || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${MEDIA_RELEASE}: controlled logo is not a valid PNG`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (!width || !height) throw new Error(`${MEDIA_RELEASE}: controlled logo has invalid dimensions`);
  return { width, height };
}

async function loadImportedLogos() {
  const corpus = JSON.parse(await readFile(path.join(process.cwd(), CORPUS_PATH), "utf8")) as CatalogCorpus;
  if (corpus.release !== CATALOG_RELEASE) throw new Error(`${MEDIA_RELEASE}: catalog release identity mismatch`);

  const imported = corpus.logoProvenance.filter((entry): entry is ImportedLogo => entry.status === "PARTNER_ASSET_IMPORTED");
  const actualSlugs = imported.map(({ slug }) => slug).sort();
  const expectedSlugs = [...EXPECTED_IMPORTED_SLUGS].sort();
  if (JSON.stringify(actualSlugs) !== JSON.stringify(expectedSlugs)) {
    throw new Error(`${MEDIA_RELEASE}: expected exactly the four Founder-supplied imported logos`);
  }

  for (const logo of imported) {
    if (!logo.asset.startsWith(`/casino-brands/${logo.slug}/`) || !/^[a-f0-9]{64}$/.test(logo.sha256)) {
      throw new Error(`${MEDIA_RELEASE}: invalid controlled logo provenance for ${logo.slug}`);
    }
  }
  return imported;
}

async function selectActor() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error(`${MEDIA_RELEASE}: no governed CMS actor is available`);
  return actor.id;
}

function assetIdentity(slug: string, assetPath: string) {
  return {
    id: deterministicCasinoIngestionId(`${CATALOG_RELEASE}:${slug}:logo`),
    storageKey: `${CATALOG_RELEASE.toLowerCase()}/${slug}/logo${path.extname(assetPath)}`,
  };
}

function assignmentIdentity(slug: string) {
  return deterministicCasinoIngestionId(`${MEDIA_RELEASE}:${slug}:CASINO_LOGO:DEFAULT`);
}

async function readControlledLogo(logo: ImportedLogo) {
  const bytes = await readFile(path.join(process.cwd(), "public", logo.asset.replace(/^\//, "")));
  const digest = sha256(bytes);
  if (digest !== logo.sha256) throw new Error(`${MEDIA_RELEASE}: ${logo.slug} logo checksum mismatch`);
  return { bytes, ...pngDimensions(bytes) };
}

async function applyBindings(logos: ImportedLogo[], actorId: string) {
  const prepared = await Promise.all(logos.map(async (logo) => ({ logo, ...(await readControlledLogo(logo)) })));

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '10s'");

    const applied = [];
    for (const { logo, bytes, width, height } of prepared) {
      const casino = await tx.casino.findUnique({
        where: { slug: logo.slug },
        select: { id: true, title: true, status: true, domainPublicationStatus: true },
      });
      if (!casino || casino.status !== "PUBLISHED" || casino.domainPublicationStatus !== "PUBLISHED") {
        throw new Error(`${MEDIA_RELEASE}: ${logo.slug} must already be a published casino before logo binding`);
      }

      const identity = assetIdentity(logo.slug, logo.asset);
      const sourceDomain = new URL(logo.officialSource).hostname;
      const mediaAsset = await tx.mediaAsset.upsert({
        where: { storageKey: identity.storageKey },
        create: {
          id: identity.id,
          type: "LOGO",
          storageProvider: "LOCAL",
          storageKey: identity.storageKey,
          publicUrl: logo.asset,
          originalFilename: path.basename(logo.asset),
          mimeType: "image/png",
          width,
          height,
          sizeBytes: bytes.length,
          altText: `${casino.title} logo`,
          title: `${casino.title} controlled real brand mark`,
          caption: "Founder-supplied partner brand asset used for editorial brand identification; not an availability or endorsement signal.",
          credit: sourceDomain,
          sortOrder: -100,
          featured: true,
          status: "ACTIVE",
          checksum: logo.sha256,
          metadata: {
            release: CATALOG_RELEASE,
            mediaRelease: MEDIA_RELEASE,
            classification: "DETECTED",
            role: "CONTROLLED_REAL_BRAND_MARK",
            geoScope: "GLOBAL_IDENTITY_ONLY",
            provenanceStatus: logo.status,
            source: logo.source,
            officialSource: logo.officialSource,
          },
          createdBy: actorId,
          casinoId: casino.id,
        },
        update: {
          type: "LOGO",
          storageProvider: "LOCAL",
          publicUrl: logo.asset,
          originalFilename: path.basename(logo.asset),
          mimeType: "image/png",
          width,
          height,
          sizeBytes: bytes.length,
          altText: `${casino.title} logo`,
          title: `${casino.title} controlled real brand mark`,
          caption: "Founder-supplied partner brand asset used for editorial brand identification; not an availability or endorsement signal.",
          credit: sourceDomain,
          sortOrder: -100,
          featured: true,
          status: "ACTIVE",
          checksum: logo.sha256,
          archivedAt: null,
          casinoId: casino.id,
          casinoCountryId: null,
          casinoBonusId: null,
          affiliateOfferId: null,
          metadata: {
            release: CATALOG_RELEASE,
            mediaRelease: MEDIA_RELEASE,
            classification: "DETECTED",
            role: "CONTROLLED_REAL_BRAND_MARK",
            geoScope: "GLOBAL_IDENTITY_ONLY",
            provenanceStatus: logo.status,
            source: logo.source,
            officialSource: logo.officialSource,
          },
        },
      });

      const assignmentId = assignmentIdentity(logo.slug);
      await tx.casinoMediaAssignment.upsert({
        where: { id: assignmentId },
        create: {
          id: assignmentId,
          casinoId: casino.id,
          mediaAssetId: mediaAsset.id,
          placement: "CASINO_LOGO",
          variant: "DEFAULT",
          countryCode: null,
          languageCode: null,
          renderingMode: "CONTAIN",
          sortOrder: ASSIGNMENT_SORT_ORDER,
          active: true,
          cropSafe: false,
          altTextOverride: `${casino.title} logo`,
          reference: `${MEDIA_RELEASE}:${logo.slug}:logo`,
        },
        update: {
          casinoId: casino.id,
          mediaAssetId: mediaAsset.id,
          placement: "CASINO_LOGO",
          variant: "DEFAULT",
          countryCode: null,
          languageCode: null,
          renderingMode: "CONTAIN",
          sortOrder: ASSIGNMENT_SORT_ORDER,
          active: true,
          cropSafe: false,
          altTextOverride: `${casino.title} logo`,
          validFrom: null,
          validUntil: null,
          reference: `${MEDIA_RELEASE}:${logo.slug}:logo`,
        },
      });

      const incumbent = await tx.casinoMediaAssignment.findFirst({
        where: {
          casinoId: casino.id,
          placement: "CASINO_LOGO",
          variant: "DEFAULT",
          countryCode: null,
          languageCode: null,
          active: true,
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (incumbent?.id !== assignmentId) throw new Error(`${MEDIA_RELEASE}: ${logo.slug} controlled logo is not the winning global logo assignment`);

      applied.push({ slug: logo.slug, publicUrl: mediaAsset.publicUrl, checksum: mediaAsset.checksum, width, height });
    }
    return applied;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 45_000,
  });
}

async function verifyBindings(logos: ImportedLogo[]) {
  const verified = [];
  for (const logo of logos) {
    const identity = assetIdentity(logo.slug, logo.asset);
    const assignmentId = assignmentIdentity(logo.slug);
    const casino = await prisma.casino.findUnique({
      where: { slug: logo.slug },
      select: {
        id: true,
        mediaAssets: {
          where: { storageKey: identity.storageKey, status: "ACTIVE", archivedAt: null },
          select: { id: true, publicUrl: true, checksum: true, type: true, width: true, height: true },
        },
        mediaAssignments: {
          where: { id: assignmentId, active: true },
          select: { id: true, mediaAssetId: true, placement: true, variant: true, renderingMode: true, countryCode: true, languageCode: true },
        },
      },
    });
    const asset = casino?.mediaAssets[0];
    const assignment = casino?.mediaAssignments[0];
    if (!casino || !asset || asset.type !== "LOGO" || asset.publicUrl !== logo.asset || asset.checksum !== logo.sha256) {
      throw new Error(`${MEDIA_RELEASE}: ${logo.slug} controlled MediaAsset is not active`);
    }
    if (!assignment || assignment.mediaAssetId !== asset.id || assignment.placement !== "CASINO_LOGO" || assignment.variant !== "DEFAULT" || assignment.renderingMode !== "CONTAIN" || assignment.countryCode !== null || assignment.languageCode !== null) {
      throw new Error(`${MEDIA_RELEASE}: ${logo.slug} CASINO_LOGO assignment is not active`);
    }
    verified.push({ slug: logo.slug, asset: asset.publicUrl, dimensions: `${asset.width}x${asset.height}` });
  }

  const excluded = await prisma.casino.findMany({
    where: { slug: { in: ["starcasino", "supercasino"] } },
    select: {
      slug: true,
      mediaAssignments: { where: { reference: { startsWith: `${MEDIA_RELEASE}:` } }, select: { id: true } },
    },
  });
  if (excluded.some((casino) => casino.mediaAssignments.length > 0)) {
    throw new Error(`${MEDIA_RELEASE}: non-imported StarCasino/SuperCasino logo must not be fabricated`);
  }

  console.info(JSON.stringify({ release: MEDIA_RELEASE, verified: true, logos: verified }, null, 2));
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "build-preflight" && mode !== "verify") throw new Error(`${MEDIA_RELEASE}: use build-preflight or verify`);
  const logos = await loadImportedLogos();
  if (mode === "build-preflight" && process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: MEDIA_RELEASE, skipped: true, reason: "non-production" }));
    return;
  }
  if (mode === "build-preflight") {
    const actorId = await selectActor();
    const applied = await applyBindings(logos, actorId);
    console.info(JSON.stringify({ release: MEDIA_RELEASE, applied }, null, 2));
  }
  await verifyBindings(logos);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : `${MEDIA_RELEASE}: failed`);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
