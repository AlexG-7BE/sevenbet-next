import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { transformNotFoundHandoff } from "@/lib/final-handoff/transforms";
import { publicErrorMessages } from "@/lib/i18n/public-errors";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { productHref } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function NotFound() {
  const presentation = await resolveServerPresentationContext();
  const messages = publicErrorMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  return <>
    <a className="skipLink" href="#main-content">{shell.skipToMain}</a>
    <PublicHeader account={accountNavigationFor({ authenticated: false, programmePath })} authenticated={false} presentation={presentation} />
    <main id="main-content"><HandoffPage name="notFound" programmePath={programmePath} transform={(html) => transformNotFoundHandoff(html, messages, (href) => productHref(presentation, href))} /></main>
    <PublicFooter presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} />
  </>;
}
