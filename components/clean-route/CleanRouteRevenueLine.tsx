import Link from "next/link";

import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { HELP_OWNER_PATH, helpRevenueLine, helpRevenueLinkLabel } from "@/lib/site/help-copy";
import type { SiteClass } from "@/lib/site/host-gate";

/**
 * RFC-057 §17.1. Five help pages end with "B4GAMBLE earns commission from licensed casinos.
 * This text contains none." On the help host that sentence contradicts `/who-runs-this`
 * point 2 — the site earns nothing at all — and it prints the other site's brand on a host
 * that carries no B4GAMBLE wordmark (Q2). The replacement says the true thing in plain words
 * and sends a reader who wants the detail to the owner page, which is the only place on this
 * host where the other site is named.
 *
 * One component rather than five edits, so the sentence cannot drift between the pages that
 * print it.
 */
export function CleanRouteRevenueLine({
  mainLine,
  presentation,
  site,
}: {
  mainLine: string;
  presentation: PresentationResolution;
  site: SiteClass;
}) {
  if (site !== "help") return <>{mainLine}</>;
  return <>
    {helpRevenueLine(presentation.locale)}{" "}
    <Link href={productHref(presentation, HELP_OWNER_PATH)} prefetch={false}>{helpRevenueLinkLabel(presentation.locale)}</Link>
  </>;
}
