import type { Metadata } from "next";

import { CommercialHandoffUnavailable } from "@/components/commercial-handoff/CommercialHandoffPage";
import { OUTBOUND_RECOVERY_LINK_PARAM } from "@/lib/commercial-handoff/recovery";
import { outboundRecoveryCasino } from "@/lib/commercial-handoff/recovery.server";
import { outboundRecoveryMessages } from "@/lib/i18n/outbound-recovery-catalog";
import { publicErrorMessages } from "@/lib/i18n/public-errors";
import { productHref } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";

export const metadata: Metadata = {
  title: "Link Unavailable | B4GAMBLE",
  description: "B4GAMBLE could not open this casino link. No redirect was made and nothing was sent to the casino.",
  robots: { index: false, follow: false },
};

export default async function CommercialHandoffUnavailablePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [presentation, params] = await Promise.all([resolveServerPresentationContext(), searchParams]);
  const casino = await outboundRecoveryCasino(params[OUTBOUND_RECOVERY_LINK_PARAM], presentation);
  return <CommercialHandoffUnavailable
    bestOffersHref={offersMayBePresented(presentation.marketCountryCode) ? productHref(presentation, "/best-offers") : null}
    casino={casino}
    homeHref={productHref(presentation, "/")}
    homeLabel={publicErrorMessages(presentation.locale).notFoundHome}
    text={outboundRecoveryMessages(presentation.locale)}
  />;
}
