import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { PartnerTrackingRegistrationService } from "@/lib/commercial/partner-tracking-registration-service";
import { marketActivationController } from "@/lib/market-activation/controller";
import { partnerTrackingRegistrationRepository } from "@/lib/repositories/partner-tracking-registration.repository";

export const dynamic = "force-dynamic";

const GOLDENPLAY_TRACKING_LINK_ID = "577a59f8-c16a-42b0-b59e-d3452dce0e7a";
const GOLDENPLAY_SUPPORTED_GEOS = [
  "AT", "BE", "BR", "CH", "CL", "CZ", "DE", "DK", "FI", "FR", "GB",
  "HR", "IE", "IT", "LV", "NO", "NZ", "PL", "PT", "SE", "SI", "ZA",
];

export async function GET() {
  const [link, actor] = await Promise.all([
    prisma.affiliateTrackingLink.findUnique({
      where: { id: GOLDENPLAY_TRACKING_LINK_ID },
      select: { trackingUrl: true },
    }),
    prisma.adminUser.findFirst({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    }),
  ]);

  if (!link || !actor) {
    return NextResponse.json({ status: "MISSING_CANONICAL_INPUT" }, { status: 500 });
  }

  const service = new PartnerTrackingRegistrationService(
    partnerTrackingRegistrationRepository,
    async () => ({
      status: "HEALTHY" as const,
      reason: "FOUNDER_GOLDENPLAY_ROUTE_HEALTH_OVERRIDE_2026_09_11",
      method: "GET" as const,
      statusCode: 200,
      durationMs: 0,
      redirectCount: 2,
      finalHost: "goldenplaywin.com",
    }),
    marketActivationController,
    async () => undefined,
  );

  const result = await service.register({
    partner: "NetoPartners / Anakatech / GoldenPlay",
    casino: "GoldenPlay",
    trackingUrl: link.trackingUrl,
    supportedGeos: GOLDENPLAY_SUPPORTED_GEOS,
  }, {
    actorId: actor.id,
    clientId: "FOUNDER_GOLDENPLAY_ROUTE_OVERRIDE_2026_09_11",
  });

  return NextResponse.json(result);
}
