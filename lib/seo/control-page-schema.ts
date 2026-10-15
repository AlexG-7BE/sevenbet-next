import type { ControlFaq } from "@/lib/i18n/static-pages/gambling-control";
import { CONTROL_PAGES_UPDATED } from "@/lib/i18n/static-pages/gambling-control";
import { organizationReference } from "@/lib/seo/structured-data";

type Crumb = Readonly<{ name: string; item: string }>;

/** WebPage, FAQPage and BreadcrumbList, like the pause plan, with the date the facts were checked. */
export function controlPageSchema(input: { name: string; description: string; url: string; inLanguage: string; faq: ControlFaq; breadcrumbs: readonly Crumb[] }) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: input.name,
      description: input.description,
      url: input.url,
      inLanguage: input.inLanguage,
      isAccessibleForFree: true,
      datePublished: CONTROL_PAGES_UPDATED,
      dateModified: CONTROL_PAGES_UPDATED,
      publisher: organizationReference(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: input.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: input.breadcrumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.item })),
    },
  ];
}
