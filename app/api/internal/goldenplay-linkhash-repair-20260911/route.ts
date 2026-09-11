import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { commercialMcpService } from "@/lib/commercial/commercial-mcp-service";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const GOLDENPLAY_CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const EXPECTED_TRACKING_LINK_ID = "b527efa1-2d0d-44a4-ba8d-135404ee68c7";
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
  const link = await prisma.affiliateTrackingLink.findUnique({
    where: { id: EXPECTED_TRACKING_LINK_ID },
    select: {
      id: true,
      trackingUrl: true,
      metadata: true,
      offer: { select: { casinoId: true, program: { select: { networkId: true } } } },
    },
  });

  if (!link || link.offer.casinoId !== GOLDENPLAY_CASINO_ID || sha256(link.trackingUrl) !== EXPECTED_LINK_HASH) {
    return NextResponse.json({ status: "REFUSED", reason: "EXPECTED_CANONICAL_TRACKING_LINK_MISMATCH" }, { status: 409 });
  }

  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "AFFILIATE_MANAGER"] } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (!actor) {
    return NextResponse.json({ status: "REFUSED", reason: "GOVERNED_ACTOR_UNAVAILABLE" }, { status: 409 });
  }

  const before = await Promise.all([
    prisma.affiliateProgram.count({ where: { casinoId: GOLDENPLAY_CASINO_ID, networkId: link.offer.program.networkId } }),
    prisma.affiliateOffer.count({ where: { casinoId: GOLDENPLAY_CASINO_ID, program: { networkId: link.offer.program.networkId } } }),
    prisma.affiliateTrackingLink.count({ where: { offer: { casinoId: GOLDENPLAY_CASINO_ID, program: { networkId: link.offer.program.networkId } } } }),
    prisma.affiliateRedirectSlug.count({ where: { casinoId: GOLDENPLAY_CASINO_ID } }),
  ]);

  const metadata = asObject(link.metadata);
  const registration = asObject(metadata[REGISTRATION_METADATA_KEY] as Prisma.JsonValue | undefined);
  if (registration.linkHash !== EXPECTED_LINK_HASH) {
    await prisma.affiliateTrackingLink.update({
      where: { id: link.id },
      data: {
        metadata: {
          ...metadata,
          [REGISTRATION_METADATA_KEY]: {
            ...registration,
            linkHash: EXPECTED_LINK_HASH,
            linkHashRepairedAt: new Date().toISOString(),
            linkHashRepairReason: "Founder-authorized GoldenPlay canonical tracking metadata correction",
          },
        } as Prisma.InputJsonValue,
      },
    });
  }

  const result = await commercialMcpService.registerPartnerTrackingLink({
    partner: "NetoPartners / Anakatech / GoldenPlay",
    casino: "GoldenPlay",
    trackingUrl: link.trackingUrl,
  }, {
    actorId: actor.id,
    clientId: "founder-office-goldenplay-reconcile-20260911",
  });

  const after = await Promise.all([
    prisma.affiliateProgram.count({ where: { casinoId: GOLDENPLAY_CASINO_ID, networkId: link.offer.program.networkId } }),
    prisma.affiliateOffer.count({ where: { casinoId: GOLDENPLAY_CASINO_ID, program: { networkId: link.offer.program.networkId } } }),
    prisma.affiliateTrackingLink.count({ where: { offer: { casinoId: GOLDENPLAY_CASINO_ID, program: { networkId: link.offer.program.networkId } } } }),
    prisma.affiliateRedirectSlug.count({ where: { casinoId: GOLDENPLAY_CASINO_ID } }),
  ]);

  const activations = await prisma.marketActivation.findMany({
    where: { casinoId: GOLDENPLAY_CASINO_ID, product: "CASINO" },
    select: {
      marketCode: true,
      desiredState: true,
      status: true,
      routeVerificationStatus: true,
      externalBlockerSource: true,
      primaryTrackingLinkId: true,
      affiliateOfferId: true,
      redirectSlugId: true,
    },
    orderBy: { marketCode: "asc" },
  });

  const buckets = activations.reduce<Record<string, number>>((counts, activation) => {
    const key = `${activation.desiredState}:${activation.status}:${activation.routeVerificationStatus}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return NextResponse.json({
    status: "RECONCILED",
    trackingLinkId: result.trackingLinkId,
    linkHash: result.linkHash,
    registrationStatus: result.status,
    verification: result.verification,
    finalHost: result.finalHost,
    redirectCount: result.redirectCount,
    affectedGeoCount: result.affectedGeoCount,
    results: result.results.map((row) => ({
      geo: row.geo,
      finalState: row.finalState,
      routeHealth: row.routeHealth,
      marketActivationId: row.marketActivationId,
      reason: row.reason,
    })),
    duplicateObjectCheck: {
      before: { programs: before[0], offers: before[1], trackingLinks: before[2], redirects: before[3] },
      after: { programs: after[0], offers: after[1], trackingLinks: after[2], redirects: after[3] },
    },
    activationBuckets: buckets,
    canonicalActivationCount: activations.filter((activation) =>
      activation.desiredState === "ACTIVE"
      && activation.status === "ACTIVE"
      && activation.routeVerificationStatus === "HEALTHY"
      && activation.primaryTrackingLinkId === result.trackingLinkId
      && activation.affiliateOfferId === result.affiliateOfferId
      && Boolean(activation.redirectSlugId)
    ).length,
  });
}
