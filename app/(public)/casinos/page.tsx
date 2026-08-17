import type { Metadata } from "next";
import Link from "next/link";

import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { ActiveDiscoveryFilters, DiscoveryControls, DiscoveryResults } from "@/components/casino-discovery/CasinoDiscovery";
import { CuratedCasinoShortlist } from "@/components/casino-discovery/CuratedCasinoShortlist";
import { ContextualComparison } from "@/components/comparison-context/ContextualComparison";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { hasDiscoveryFilters, parseCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { absoluteUrl } from "@/lib/site";
import { isLocalHandoffVisualDataFixture, withHandoffCasinoDiscoveryData } from "@/lib/final-handoff/visual-data-fixture";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const filtered = hasDiscoveryFilters(query);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null });
  const result = await publicCasinoDiscoveryService.discover(query, authority);
  const containsDemo = result.inventoryMode !== "PUBLISHED_ONLY";
  const empty = result.total === 0;
  const canonicalParams = new URLSearchParams();
  if (!filtered && (query.page ?? 1) > 1) canonicalParams.set("page", String(query.page));
  const canonical = absoluteUrl(`/casinos${canonicalParams.size ? `?${canonicalParams}` : ""}`);
  const title = query.page && query.page > 1 ? `Casino Reviews — Page ${query.page} | B4GAMBLE` : containsDemo ? "Casino Review Demonstration | B4GAMBLE" : "Casino Reviews and Comparisons | B4GAMBLE";
  const description = containsDemo ? "Fictional demonstration casino records showing B4GAMBLE's review format. Not current GB operators, partner offers or live promotions." : "Search and compare published casino reviews by use-case, licence, payments, games, bonus availability and responsible gambling information.";
  return { title, description, alternates: { canonical }, robots: filtered || containsDemo || empty ? { index: false, follow: true } : { index: true, follow: true }, openGraph: { type: "website", title, description, url: canonical } };
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const query = parseCasinoDiscoveryQuery(raw);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null });
  const result = withHandoffCasinoDiscoveryData(
    await publicCasinoDiscoveryService.discover(query, authority),
    isLocalHandoffVisualDataFixture(raw.visualFixture),
  );
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Casino Reviews", item: absoluteUrl("/casinos") }] },
    ...(result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? [{ "@context": "https://schema.org", "@type": "ItemList", name: "Published casino reviews", numberOfItems: result.total, itemListElement: result.items.map((casino, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: casino.name, url: absoluteUrl(`/casino/${casino.slug}`) })) }] : []),
  ];

  return <div className={styles.page} data-page-theme="dark" data-runtime-renderer="casinos">
    <CommercialSurfaceView surface="casinos" />
    <p className="srOnly">Affiliate compensation does not determine Editor Score or natural editorial ranking.</p>
    <ContextualComparison />
    {schemas.map((schema, index) => <JsonLd data={schema} key={index} />)}
    <section className={styles.hero} data-nav-theme="dark">
      <div className={styles.shell}>
        <div className={styles.heroIntro}>
          <header><p>Curated by use-case</p><h1>Picked for<br /><em>how you play.</em></h1><span>Choose your use-case — we show the three casinos that earned it. The full directory waits below.</span></header>
        </div>
        <div className={styles.heroProof}><span>Evidence and limitations disclosed</span><span>Max 3 per use-case</span><span>Current published data only</span></div>
      </div>
    </section>

    <CuratedCasinoShortlist casinos={result.items} />

    <section className={styles.directory} data-motion-reveal data-nav-theme="cream" id="casino-directory"><div className={styles.shell}>
      <div className={styles.directoryHeading}><div><p>Casino directory</p><h2>Full directory</h2></div><span>{result.total} {result.inventoryMode === "PUBLISHED_ONLY" ? "published" : "classified"} {result.total === 1 ? "record" : "records"}</span></div>
      {result.inventoryMode !== "PUBLISHED_ONLY" ? <div className={styles.disclosure} role="note"><strong>DEMONSTRATION DATA</strong><p>Fictional operators and offer fields show the product experience. They are not current GB operators, licence claims, partner offers or live promotions. No commercial visit action is available.</p><Link href="/methodology">Read our review method →</Link></div> : null}
      <DiscoveryControls result={result} />
      <ActiveDiscoveryFilters result={result} />
      <DiscoveryResults result={result} />
    </div></section>

    <section className={styles.faq} data-motion-reveal data-nav-theme="cream"><div className={styles.shell}><div className={styles.sectionIntro}><p>Casino FAQ</p><h2>Before you choose</h2></div><div>{[
      ["How is this different from Best Offers?", "Best Offers presents a bounded overall shortlist. This page groups eligible published records by use-case while preserving the same data and availability boundaries."],
      ["What does “Review only” mean?", "We can’t offer a governed signup route for that casino right now, so we don’t fake one. The review and available published information stay visible."],
      ["Does commission affect the ranking?", "Affiliate compensation does not determine Editor Score or natural editorial ranking. Details are available in our affiliate disclosure."],
    ].map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
  </div>;
}
