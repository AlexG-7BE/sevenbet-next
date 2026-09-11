import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";

const RELEASE = "GOLDENPLAY-TRACKING-METADATA-REPAIR-20260911";
const TRACKING_LINK_ID = "577a59f8-c16a-42b0-b59e-d3452dce0e7a";
const CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const EXPECTED_LINK_HASH = "75c41114c11b4f12d411e6e3fe4ca1823959f02ae5668acd49e0970241dc950e";
const REGISTRATION_METADATA_KEY = "partnerTrackingRegistration";

function object(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function repairGoldenPlayTrackingMetadata() {
  if (process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: RELEASE, skipped: true, reason: "non-production" }));
    return;
  }

  const link = await prisma.affiliateTrackingLink.findUnique({
    where: { id: TRACKING_LINK_ID },
    include: { offer: { select: { casinoId: true } } },
  });

  if (!link || link.offer.casinoId !== CASINO_ID) {
    throw new Error(`${RELEASE}: canonical GoldenPlay tracking link not found`);
  }

  if (sha256(link.trackingUrl) !== EXPECTED_LINK_HASH) {
    throw new Error(`${RELEASE}: stored GoldenPlay tracking URL does not match Founder-authorized URL hash`);
  }

  const metadata = object(link.metadata);
  const registration = object(metadata[REGISTRATION_METADATA_KEY] as Prisma.JsonValue);

  if (registration.linkHash === EXPECTED_LINK_HASH) {
    console.info(JSON.stringify({ release: RELEASE, applied: false, alreadyCurrent: true, trackingLinkId: link.id }));
    return;
  }

  await prisma.affiliateTrackingLink.update({
    where: { id: link.id },
    data: {
      metadata: json({
        ...metadata,
        [REGISTRATION_METADATA_KEY]: {
          ...registration,
          linkHash: EXPECTED_LINK_HASH,
          metadataRepairedAt: new Date().toISOString(),
          metadataRepairRelease: RELEASE,
        },
      }),
    },
  });

  console.info(JSON.stringify({
    release: RELEASE,
    applied: true,
    trackingLinkId: link.id,
    linkHash: EXPECTED_LINK_HASH,
  }));
}

void repairGoldenPlayTrackingMetadata()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : `${RELEASE}: failed`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
