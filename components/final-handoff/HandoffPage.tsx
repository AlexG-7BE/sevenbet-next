import generatedPages from "@/lib/final-handoff/generated-pages.json";
import { transformCommonHandoff } from "@/lib/final-handoff/transforms";
import { NonceStyle } from "@/components/security/NonceStyle";
import { HandoffInteractions } from "./HandoffInteractions";

export type HandoffPageName = keyof typeof generatedPages;

const HOME_STACK_COMPOSITOR_FIX = `
[data-handoff-page="home"] [data-stackpanel] {
  isolation: isolate;
}

[data-handoff-page="home"] [data-stackpanel] > div[style*="linear-gradient"] {
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}
`;

export function HandoffPage({
  name,
  transform,
  cssTransform,
  kind,
  effective,
  updated,
}: {
  name: HandoffPageName;
  transform?: (html: string) => string;
  cssTransform?: (css: string) => string;
  kind?: "privacy" | "terms";
  effective?: string;
  updated?: string;
}) {
  const page = generatedPages[name];
  const commonHtml = transformCommonHandoff(page.html);
  const html = transform ? transform(commonHtml) : commonHtml;
  const sourceCss = cssTransform ? cssTransform(page.css) : page.css;
  // Chrome can expose a raster-tile seam for one frame when the static gradient
  // sits above the continuously transformed photo inside a sticky clipped panel.
  // Keep that overlay in a stable isolated compositor layer without changing the
  // captured handoff markup or the visual treatment.
  const css = name === "home" ? `${sourceCss}\n${HOME_STACK_COMPOSITOR_FIX}` : sourceCss;

  return (
    <div data-document-effective={effective} data-document-kind={kind} data-document-updated={updated} data-handoff-page={name} data-legal-document={kind}>
      <NonceStyle>{css}</NonceStyle>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <HandoffInteractions name={name} />
    </div>
  );
}
