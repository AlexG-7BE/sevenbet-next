import type { Metadata } from "next";

import { ProgramAiExperience } from "@/components/programme/ProgramAiExperience";
import { JsonLd } from "@/components/seo/JsonLd";
import { isGoogleAuthAvailable } from "@/lib/auth/google-config";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import {
  isProgrammeLocale,
  PROGRAMME_ROUTES,
  programmePath,
  programmePublicHref,
  type ProgrammeLocale,
} from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const locale = isProgrammeLocale(presentation.locale) ? presentation.locale : "en-GB";
  const path = programmePath(locale);
  const title = programmeText(locale, "B4GAMBLE 10-Step Control Programme | Personal Control Plan");
  const description = programmeText(locale, "Begin B4GAMBLE's private 10-Step Control Programme with a personal exercise, then continue through structured goals, limits, reflection and review.");
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: Object.fromEntries([
        ...PROGRAMME_ROUTES.map((route) => [route.locale, absoluteUrl(route.path)]),
        ["x-default", absoluteUrl("/program")],
      ]),
    },
    openGraph: { title, description, url: absoluteUrl(path), locale: locale.replace("-", "_") },
    twitter: { card: "summary", title, description },
  };
}

function breadcrumbSchema(locale: ProgrammeLocale) {
  const path = programmePath(locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: programmeText(locale, "Home"),
        item: absoluteUrl(programmePublicHref(locale, "/")),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: programmeText(locale, "10-Step Control Programme"),
        item: absoluteUrl(path),
      },
    ],
  };
}

export default async function ProgramPage() {
  const presentation = await resolveServerPresentationContext();
  const locale = isProgrammeLocale(presentation.locale) ? presentation.locale : "en-GB";
  const path = programmePath(locale);
  return (
    <>
      <JsonLd data={breadcrumbSchema(locale)} />
      <div data-nav-theme="dark" data-public-programme-renderer="program-ai" tabIndex={-1}>
        <ProgramAiExperience googleAvailable={isGoogleAuthAvailable()} locale={locale} programmePath={path} />
      </div>
    </>
  );
}
