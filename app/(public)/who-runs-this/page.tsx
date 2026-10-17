import type { Metadata } from "next";

import { resolveServerPresentationContext } from "@/lib/market/server";
import { helpOwnerPage, HELP_OWNER_PATH } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";
import { HelpTextPageView } from "../_help-pages/HelpTextPageView";
import { helpPageMetadata } from "../_help-pages/metadata";

/**
 * RFC-057 §17, the owner-disclosure page of the help site. It answers, before anyone asks,
 * the question that made two help organisations refuse us in October 2026: who runs this and
 * how are they paid. It names `b4gamble.com` in plain text because honesty about the owner
 * needs the name, and it never links there, because a help site with a path into a casino
 * catalogue is the thing the second domain exists to avoid (§6, rule 2).
 *
 * It replaces the help-side use of `/can-you-trust-b4gamble`, which stays on the commercial
 * site for its own reader and carries a research next-step block this host cannot show.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const copy = helpOwnerPage(presentation.locale);
  return helpPageMetadata({ copy, pathname: HELP_OWNER_PATH, presentation, site });
}

export default async function WhoRunsThisPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  return <HelpTextPageView copy={helpOwnerPage(presentation.locale)} pathname={HELP_OWNER_PATH} presentation={presentation} site={site} />;
}
