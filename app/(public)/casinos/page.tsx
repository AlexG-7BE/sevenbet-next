import type { Metadata } from "next";

import { ActiveDiscoveryFilters, DiscoveryControls, DiscoveryResults } from "@/components/casino-discovery/CasinoDiscovery";
import { AffiliateDisclosure, Card, Container } from "@/components/ui";
import { hasDiscoveryFilters, parseCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";
import { evaluateJurisdictionShadow } from "@/lib/jurisdiction/shadow";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { absoluteUrl } from "@/lib/site";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const filtered = hasDiscoveryFilters(query);
  const canonicalParams = new URLSearchParams();
  if (!filtered && (query.page ?? 1) > 1) canonicalParams.set("page", String(query.page));
  const canonical = absoluteUrl(`/casinos${canonicalParams.size ? `?${canonicalParams}` : ""}`);
  const title = query.page && query.page > 1 ? `Casino Reviews — Page ${query.page} | SevenBet` : "Casino Reviews and Comparisons | SevenBet";
  const description = "Search and compare published casino reviews by country, license, payments, games, bonus availability and responsible gambling information.";
  return {
    title, description, alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type: "website", title, description, url: canonical },
  };
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const result = await publicCasinoDiscoveryService.discover(query);
  const legacyCommercialAllowed = result.items.some((casino) => casino.visitAction.available);
  await evaluateJurisdictionShadow("CASINO_DISCOVERY", {
    // The query filter is a declared preference, never a trusted location signal.
    userSelectedCountry: query.country?.[0] ?? null,
    now: new Date(),
  }, { commercialAllowed: legacyCommercialAllowed, referralAllowed: legacyCommercialAllowed });
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Casino Reviews", item: absoluteUrl("/casinos") },
    ] },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Published casino reviews", numberOfItems: result.total,
      itemListElement: result.items.map((casino, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: casino.name, url: absoluteUrl(`/casino/${casino.slug}`) })) },
  ];
  return (
    <section className="pageShell discoveryPage">
      {schemas.map((schema, index) => <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} key={index} type="application/ld+json" />)}
      <Container>
        <header className="discoveryHero">
          <p className="eyebrow">Independent casino discovery</p>
          <h1>Find a casino review that fits your priorities.</h1>
          <p className="lead">Search published editorial profiles and compare licensing, payments, game providers, bonus terms and local availability. A listing can remain available for review even when no commercial visit action is available.</p>
        </header>
        <AffiliateDisclosure />
        <DiscoveryControls result={result} />
        <ActiveDiscoveryFilters query={result.appliedFilters} />
        <DiscoveryResults result={result} />
        <div className="discoverySupport">
          <Card><h2>Compare facts, not promises.</h2><p>SevenBet does not guarantee winnings or income. Check the operator’s current terms, licensing status and availability in your country before making a decision.</p></Card>
          <Card tone="warning"><h2>18+ · Gambling involves risk</h2><p>Set a budget, avoid chasing losses and use limits or self-exclusion tools when needed.</p><a href="/responsible-gambling">Visit the Responsible Gambling Hub</a></Card>
        </div>
      </Container>
    </section>
  );
}
