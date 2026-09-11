import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const GOLDENPLAY_CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const EXPECTED_LINK_HASH = "75c41114c11b4f12d411e6e3fe4ca1823959f02ae5668acd49e0970241dc950e";
const REGISTRATION_METADATA_KEY = "partnerTrackingRegistration";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function GET() {
  const links = await prisma.affiliateTrackingLink.findMany({
    where: {
      offer: { casinoId: GOLDENPLAY_CASINO_ID },
    },
    select: {
      id: true,
      trackingUrl: true,
      metadata: true,
    },
  });

  const matching = links.filter((link) => sha256(link.trackingUrl) === EXPECTED_LINK_HASH);

  if (matching.length !== 1) {
    return NextResponse.json(
      {
        status: "REFUSED",
        reason: matching.length === 0 ? "EXPECTED_TRACKING_LINK_NOT_FOUND" : "EXPECTED_TRACKING_LINK_AMBIGUOUS",
        matchingCount: matching.length,
      },
      { status: 409 },
    );
  }

  const link = matching[0];
  const metadata = asObject(link.metadata);
  const registration = asObject(metadata[REGISTRATION_METADATA_KEY] as Prisma.JsonValue | undefined);
  const oldLinkHash = typeof registration.linkHash === "string" ? registration.linkHash : null;

  if (oldLinkHash === EXPECTED_LINK_HASH) {
    return NextResponse.json({
      status: "ALREADY_REPAIRED",
      trackingLinkId: link.id,
      oldLinkHash,
      newLinkHash: EXPECTED_LINK_HASH,
    });
  }

  const updatedMetadata = {
    ...metadata,
    [REGISTRATION_METADATA_KEY]: {
      ...registration,
      linkHash: EXPECTED_LINK_HASH,
      linkHashRepairedAt: new Date().toISOString(),
      linkHashRepairReason: "Founder-authorized GoldenPlay canonical tracking metadata correction",
    },
  } as Prisma.InputJsonValue;

  await prisma.affiliateTrackingLink.update({
    where: { id: link.id },
    data: { metadata: updatedMetadata },
  });

  const verified = await prisma.affiliateTrackingLink.findUnique({
    where: { id: link.id },
    select: { id: true, metadata: true },
  });
  const verifiedRegistration = asObject(
    asObject(verified?.metadata)[REGISTRATION_METADATA_KEY] as Prisma.JsonValue | undefined,
  );
  const persistedLinkHash = typeof verifiedRegistration.linkHash === "string" ? verifiedRegistration.linkHash : null;

  if (persistedLinkHash !== EXPECTED_LINK_HASH) {
    return NextResponse.json(
      {
        status: "FAILED_VERIFICATION",
        trackingLinkId: link.id,
        oldLinkHash,
        persistedLinkHash,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "REPAIRED",
    trackingLinkId: link.id,
    oldLinkHash,
    newLinkHash: persistedLinkHash,
  });
}
