import generatedPages from "@/lib/final-handoff/generated-pages.json";
import { transformCommonHandoff } from "@/lib/final-handoff/transforms";
import { NonceStyle } from "@/components/security/NonceStyle";
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
  programmePath = "/program",
  updated,
}: {
  name: HandoffPageName;
  transform?: (html: string) => string;
  cssTransform?: (css: string) => string;
  kind?: "privacy" | "terms";
  effective?: string;
  programmePath?: string;
  updated?: string;
}) {
  const page = generatedPages[name];
  const commonHtml = transformCommonHandoff(page.html, programmePath);
  const html = transform ? transform(commonHtml) : commonHtml;
  const sourceCss = cssTransform ? cssTransform(page.css) : page.css;
  const css = name === "home" ? `${sourceCss}\n${HOME_STACK_COMPOSITOR_FIX}` : sourceCss;

  return (
    <div data-document-effective={effective} data-document-kind={kind} data-document-updated={updated} data-handoff-page={name} data-legal-document={kind}>
      <NonceStyle>{css}</NonceStyle>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <HandoffInteractions name={name} programmePath={programmePath} />
    </div>
  );
}
