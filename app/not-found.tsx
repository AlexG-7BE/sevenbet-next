import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { transformNotFoundHandoff } from "@/lib/final-handoff/transforms";
import { publicErrorMessages } from "@/lib/i18n/public-errors";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { productHref } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerCommercialProductState } from "@/lib/market/commercial-product-state.server";
import { PROGRAMME_PRESENTATION_CONTEXT, programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function NotFound() {
  const presentation = await resolveServerPresentationContext();
  // Next writes this root boundary into every document's inline data, the Programme's included. In a
  // Programme document it is built without the research links and reads no partner availability:
  // the Programme links to no casino page (Founder, 16 October 2026). Leaving the Programme loads a
  // new document, so a public page always gets its own copy.
  const programmeDocument = presentation.context === PROGRAMME_PRESENTATION_CONTEXT;
  const commercialProductState = programmeDocument ? "EDITORIAL_ONLY" : await resolveServerCommercialProductState();
  const messages = publicErrorMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  return <>
    <a className="skipLink" href="#main-content">{shell.skipToMain}</a>
    <PublicHeader account={accountNavigationFor({ authenticated: false, programmePath })} authenticated={false} commercialProductState={commercialProductState} presentation={presentation} researchNavigation={!programmeDocument} />
    <main id="main-content"><HandoffPage name="notFound" programmePath={programmePath} transform={(html) => transformNotFoundHandoff(html, messages, (href) => productHref(presentation, href))} /></main>
    <PublicFooter commercialProductState={commercialProductState} presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} researchNavigation={!programmeDocument} />
  </>;
}
