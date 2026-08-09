import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CommercialHandoffConfirmation } from "@/components/commercial-handoff/CommercialHandoffPage";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { logJurisdictionDecision } from "@/lib/jurisdiction/decision-log";
import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { affiliateRedirectService } from "@/lib/services/affiliate-redirect.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm External Commercial Action | B4GAMBLE",
  description: "Review B4GAMBLE's commercial handoff before a managed external action.",
  robots: { index: false, follow: false },
};

const managedSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function CommercialHandoffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!managedSlug.test(slug)) redirect("/outbound/unavailable");
  if (!isAffiliateRedirectEnabled()) redirect("/outbound/unavailable");
  const now = new Date();
  const requestHeaders = await headers();
  let result: Awaited<ReturnType<typeof affiliateRedirectService.resolve>>;
  try {
    result = await affiliateRedirectService.resolve(slug, {
      requestCountrySignal: requestCountrySignalFromHeaders(requestHeaders, now),
      now,
    });
  } catch {
    redirect("/outbound/unavailable");
  }
  if (result.jurisdictionDecision) logJurisdictionDecision("AFFILIATE_REDIRECT", result.jurisdictionDecision);
  if (!result.ok) redirect("/outbound/unavailable");
  return <CommercialHandoffConfirmation slug={slug} />;
}
