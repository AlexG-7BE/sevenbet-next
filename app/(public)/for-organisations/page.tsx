import type { Metadata } from "next";

import { resolveServerPresentationContext } from "@/lib/market/server";
import { helpOrganisationsPage, HELP_ORGANISATIONS_PATH } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";
import { HelpTextPageView } from "../_help-pages/HelpTextPageView";
import { helpPageMetadata } from "../_help-pages/metadata";

/**
 * RFC-057 §16.3, the data statement. It answers every row of §16.2 in plain words, including
 * the rows whose answer today is "we cannot tell you yet" — the §16.3 gate is that an open
 * question is written down honestly rather than left out, and phase 4 (outreach to help
 * organisations) does not start while one of them would come as a surprise.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const copy = helpOrganisationsPage(presentation.locale);
  return helpPageMetadata({ copy, pathname: HELP_ORGANISATIONS_PATH, presentation, site });
}

export default async function ForOrganisationsPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  return <HelpTextPageView copy={helpOrganisationsPage(presentation.locale)} pathname={HELP_ORGANISATIONS_PATH} presentation={presentation} site={site} />;
}
