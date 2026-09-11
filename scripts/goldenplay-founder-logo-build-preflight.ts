import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";

const RELEASE = "GOLDENPLAY-FOUNDER-LOGO-20260911";
const CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const CASINO_SLUG = "goldenplay";
const ASSET_PATH = "/casino-brands/goldenplay/logo.jpg";
const STORAGE_KEY = "founder-supplied/goldenplay/logo-20260911.jpg";
const EXPECTED_SHA256 = "124cb77f13398ff5d2925995f80b68ef20e78edcbd5dea79490f02ac62c50904";
const EXPECTED_WIDTH = 300;
const EXPECTED_HEIGHT = 100;
const EXPECTED_SIZE = 5701;

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function ensureGoldenPlayLogo() {
  if (process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: RELEASE, skipped: true, reason: "non-production" }));
    return;
  }

  const bytes = await readFile(path.join(process.cwd(), "public", ASSET_PATH.replace(/^\//, "")));
  if (bytes.length !== EXPECTED_SIZE || sha256(bytes) !== EXPECTED_SHA256) {
    throw new Error(`${RELEASE}: Founder-supplied logo checksum/size mismatch`);
  }

  const casino = await prisma.casino.findUnique({
    where: { id: CASINO_ID },
    select: { id: true, slug: true, title: true, status: true, domainPublicationStatus: true },
  });
  if (!casino || casino.slug !== CASINO_SLUG || casino.status !== "PUBLISHED" || casino.domainPublicationStatus !== "PUBLISHED") {
    throw new Error(`${RELEASE}: canonical published GoldenPlay casino not found`);
  }

  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error(`${RELEASE}: no governed CMS actor is available`);

  const asset = await prisma.mediaAsset.upsert({
    where: { storageKey: STORAGE_KEY },
    create: {
      type: "LOGO",
      storageProvider: "LOCAL",
      storageKey: STORAGE_KEY,
      publicUrl: ASSET_PATH,
      originalFilename: "logo.jpg",
      mimeType: "image/jpeg",
      width: EXPECTED_WIDTH,
      height: EXPECTED_HEIGHT,
      sizeBytes: bytes.length,
      altText: `${casino.title} logo`,
      title: `${casino.title} logo`,
      caption: "Founder-supplied GoldenPlay brand asset.",
      credit: "Founder-supplied asset",
      sortOrder: -100,
      featured: true,
      status: "ACTIVE",
      checksum: EXPECTED_SHA256,
      metadata: {
        release: RELEASE,
        classification: "DETECTED",
        role: "CONTROLLED_REAL_BRAND_MARK",
        source: "FOUNDER_SUPPLIED",
        suppliedAt: "2026-09-11",
      },
      createdBy: actor.id,
      casinoId: casino.id,
    },
    update: {
      type: "LOGO",
      storageProvider: "LOCAL",
      publicUrl: ASSET_PATH,
      originalFilename: "logo.jpg",
      mimeType: "image/jpeg",
      width: EXPECTED_WIDTH,
      height: EXPECTED_HEIGHT,
      sizeBytes: bytes.length,
      altText: `${casino.title} logo`,
      title: `${casino.title} logo`,
      caption: "Founder-supplied GoldenPlay brand asset.",
      credit: "Founder-supplied asset",
      sortOrder: -100,
      featured: true,
      status: "ACTIVE",
      checksum: EXPECTED_SHA256,
      metadata: {
        release: RELEASE,
        classification: "DETECTED",
        role: "CONTROLLED_REAL_BRAND_MARK",
        source: "FOUNDER_SUPPLIED",
        suppliedAt: "2026-09-11",
      },
      archivedAt: null,
      casinoId: casino.id,
      casinoCountryId: null,
      casinoBonusId: null,
      affiliateOfferId: null,
    },
    select: { id: true, publicUrl: true, status: true, checksum: true },
  });

  console.info(JSON.stringify({
    release: RELEASE,
    applied: true,
    casino: casino.slug,
    publicUrl: asset.publicUrl,
    status: asset.status,
    checksumMatched: asset.checksum === EXPECTED_SHA256,
  }));
}

void ensureGoldenPlayLogo()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : `${RELEASE}: failed`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
