import generatedPages from "@/lib/final-handoff/generated-pages.json";
import { transformCommonHandoff } from "@/lib/final-handoff/transforms";
import { NonceStyle } from "@/components/security/NonceStyle";
import { HandoffInteractions } from "./HandoffInteractions";

export type HandoffPageName = keyof typeof generatedPages;

export function HandoffPage({
  name,
  transform,
  kind,
  effective,
  updated,
}: {
  name: HandoffPageName;
  transform?: (html: string) => string;
  kind?: "privacy" | "terms";
  effective?: string;
  updated?: string;
}) {
  const page = generatedPages[name];
  const commonHtml = transformCommonHandoff(page.html);
  const html = transform ? transform(commonHtml) : commonHtml;

  return (
    <div data-document-effective={effective} data-document-kind={kind} data-document-updated={updated} data-handoff-page={name} data-legal-document={kind}>
      <NonceStyle>{page.css}</NonceStyle>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <HandoffInteractions name={name} />
    </div>
  );
}
