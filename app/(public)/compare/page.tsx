import type { Metadata } from "next";
import { cache } from "react";

import { ComparisonExperience } from "@/components/comparison/ComparisonExperience";
import { parsePublicComparisonQuery, type ComparisonSearchParams } from "@/lib/public-comparison/query";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { publicComparisonService } from "@/lib/services/public-comparison.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";

export const dynamic = "force-dynamic";

type PageSearchParams = Record<string, string | string[] | undefined>;

function toSearchParams(raw: PageSearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, entry);
  }
  return params;
}

const resolveComparison = cache(async (serialized: string) => {
  const query = parsePublicComparisonQuery(new URLSearchParams(serialized) as ComparisonSearchParams);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country });
  return publicComparisonService.compare(query, authority);
});

export async function generateMetadata({ searchParams }: { searchParams: Promise<PageSearchParams> }): Promise<Metadata> {
  const raw = toSearchParams(await searchParams);
  const result = await resolveComparison(raw.toString());
  const cleanDefault = result.query.selectionMode === "default" && result.query.country === "GB" && !result.query.differences && !result.query.issues.length;
  const index = cleanDefault && result.status === "available" && result.inventoryMode === "PUBLISHED_ONLY";
  const title = result.status === "available"
    ? result.inventoryMode === "DEMO_ONLY"
      ? "Compare Fictional Casino Demonstrations | B4GAMBLE"
      : result.inventoryMode === "MIXED"
        ? "Compare Published and Fictional Casino Profiles | B4GAMBLE"
        : "Compare Published Casino Profiles | B4GAMBLE"
    : "Casino Comparison | B4GAMBLE";
  const description = result.inventoryMode === "DEMO_ONLY"
    ? "Compare up to three explicitly fictional demonstration profiles. Their licence, offer, payment and availability fields are illustrative and never enable a commercial action."
    : result.inventoryMode === "MIXED"
      ? "Compare published profiles and explicitly labelled fictional demonstrations without mixing their evidence status or enabling a demo commercial action."
    : "Compare up to three latest published casino profiles by licensing context, offer terms, payments, withdrawals and responsible-gambling evidence without a fabricated winner.";
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl("/compare") },
    robots: { index, follow: true },
    openGraph: { title, description, url: absoluteUrl("/compare"), siteName: "B4GAMBLE", type: "website" },
  };
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const raw = toSearchParams(await searchParams);
  const result = await resolveComparison(raw.toString());
  const schemas = result.status === "projection-unavailable" ? [] : [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Casino comparison", item: absoluteUrl("/compare") },
      ],
    },
    ...(result.inventoryMode === "PUBLISHED_ONLY" && result.casinos.length ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `B4GAMBLE ${result.query.country} declared-context casino comparison`,
      numberOfItems: result.casinos.length,
      itemListElement: result.casinos.map((casino, index) => ({ "@type": "ListItem", position: index + 1, name: casino.name, url: absoluteUrl(casino.reviewHref) })),
    }] : []),
  ];

  return <>
    {schemas.map((schema, index) => <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} key={index} type="application/ld+json" />)}
    <ComparisonExperience result={result} />
  </>;
}
