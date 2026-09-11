import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const TRACKING_LINK_ID = "577a59f8-c16a-42b0-b59e-d3452dce0e7a";
const EXPECTED_LINK_HASH = "75c41114c11b4f12d411e6e3fe4ca1823959f02ae5668acd49e0970241dc950e";

function object(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function GET() {
  const link = await prisma.affiliateTrackingLink.findUnique({
    where: { id: TRACKING_LINK_ID },
    select: { id: true, trackingUrl: true, metadata: true },
  });

  if (!link) {
    return NextResponse.json({ ok: false, code: "TRACKING_LINK_NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const actualHash = createHash("sha256").update(link.trackingUrl).digest("hex");
  if (actualHash !== EXPECTED_LINK_HASH) {
    return NextResponse.json({ ok: false, code: "TRACKING_URL_MISMATCH", actualHash }, { status: 409, headers: { "Cache-Control": "no-store" } });
  }

  const metadata = object(link.metadata);
  const registration = object(metadata.partnerTrackingRegistration as Prisma.JsonValue | null | undefined);
  const previousHash = typeof registration.linkHash === "string" ? registration.linkHash : null;

  if (previousHash !== EXPECTED_LINK_HASH) {
    const nextMetadata = JSON.parse(JSON.stringify({
      ...metadata,
      partnerTrackingRegistration: {
        ...registration,
        linkHash: EXPECTED_LINK_HASH,
      },
    })) as Prisma.InputJsonValue;

    await prisma.affiliateTrackingLink.update({
      where: { id: TRACKING_LINK_ID },
      data: { metadata: nextMetadata },
    });
  }

  const verified = await prisma.affiliateTrackingLink.findUniqueOrThrow({
    where: { id: TRACKING_LINK_ID },
    select: { metadata: true },
  });
  const verifiedRegistration = object(object(verified.metadata).partnerTrackingRegistration as Prisma.JsonValue | null | undefined);
  const currentHash = typeof verifiedRegistration.linkHash === "string" ? verifiedRegistration.linkHash : null;

  return NextResponse.json({
    ok: currentHash === EXPECTED_LINK_HASH,
    code: currentHash === EXPECTED_LINK_HASH ? "LINK_HASH_REPAIRED" : "LINK_HASH_REPAIR_FAILED",
    trackingLinkId: TRACKING_LINK_ID,
    previousHash,
    currentHash,
  }, { status: currentHash === EXPECTED_LINK_HASH ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
