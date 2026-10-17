import generatedPages from "@/lib/final-handoff/generated-pages.json";
import { markHandoffReadability } from "@/lib/final-handoff/readability";
import { transformCommonHandoff, transformCommonHandoffCss } from "@/lib/final-handoff/transforms";
import { NonceStyle } from "@/components/security/NonceStyle";
import { withSiteName } from "@/lib/site/help-copy";
import { DEFAULT_SITE_CLASS, type SiteClass } from "@/lib/site/host-gate";
import { HandoffInteractions } from "./HandoffInteractions";

export type HandoffPageName = keyof typeof generatedPages;

const HOME_STACK_COMPOSITOR_FIX = `
[data-handoff-page="home"] [data-stackpanel] {
  isolation: isolate;
}

/*
 * The captured chapter cards animate a full-viewport photo continuously with a
 * Ken Burns transform. In Chromium that layer can be partially discarded while
 * the tab is backgrounded, then exposed as the panel's dark background for one
 * or two frames on resume. The same layer stack can also show a horizontal tile
 * seam while scrolling. Keep the chapter composition static; the sticky card
 * transition remains intact and the visual crop is unchanged.
 */
[data-handoff-page="home"] [data-stackpanel] > div:first-child {
  animation: none !important;
}

[data-handoff-page="home"] [data-stackpanel] [data-home-media="chapter"],
[data-handoff-page="home"] [data-stackpanel] [data-home-media="chapter"] img {
  backface-visibility: hidden;
}
`;

export function HandoffPage({
  name,
  transform,
  cssTransform,
  kind,
  effective,
  headerAutoHide = false,
  programmePath = "/program",
  revealHeadings = false,
  site = DEFAULT_SITE_CLASS,
  updated,
}: {
  name: HandoffPageName;
  transform?: (html: string) => string;
  cssTransform?: (css: string) => string;
  kind?: "privacy" | "terms";
  effective?: string;
  /** Long mobile reading pages let the fixed header give its height back while scrolling down. */
  headerAutoHide?: boolean;
  programmePath?: string;
  /** Section headings rise into view through the shared site motion (Founder, 27 Sep 2026). */
  revealHeadings?: boolean;
  /**
   * The captured page is a photograph of the main site, so its body text names B4GAMBLE:
   * "A boundary worth stating: B4GAMBLE does not diagnose…" on /responsible-gambling, "a
   * break from all gambling content on B4GAMBLE" on /help. The captured header and footer are
   * stripped above; these sentences are the page itself. On the help host they are said in
   * that site's name (Founder, 17 October 2026), and on the main host the HTML is returned
   * unchanged, byte for byte.
   */
  site?: SiteClass;
  updated?: string;
}) {
  const page = generatedPages[name];
  const commonHtml = transformCommonHandoff(page.html, programmePath);
  // Readability pass (Founder, 25 Sep 2026): tokens only; app/globals.css applies the fixes (Home on phones only).
  const readableHtml = markHandoffReadability(transform ? transform(commonHtml) : commonHtml);
  const html = withSiteName(revealHeadings ? readableHtml.replace(/<h2\b/g, "<h2 data-motion-reveal") : readableHtml, site);
  const commonCss = transformCommonHandoffCss(page.css);
  const sourceCss = cssTransform ? cssTransform(commonCss) : commonCss;
  const css = name === "home" ? `${sourceCss}\n${HOME_STACK_COMPOSITOR_FIX}` : sourceCss;

  return (
    <div data-document-effective={effective} data-document-kind={kind} data-document-updated={updated} data-handoff-page={name} data-header-autohide={headerAutoHide ? "" : undefined} data-legal-document={kind}>
      <NonceStyle>{css}</NonceStyle>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <HandoffInteractions name={name} programmePath={programmePath} />
    </div>
  );
}
