import type { Metadata } from "next";
import Link from "next/link";

import { ActiveDiscoveryFilters, DiscoveryControls, DiscoveryResults } from "@/components/casino-discovery/CasinoDiscovery";
import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { CommercialAnalyticsLink, CommercialDecisionLayerView } from "@/components/commercial-decision/CommercialAnalytics";
import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { hasDiscoveryFilters, parseCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { absoluteUrl } from "@/lib/site";

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
  const title = query.page && query.page > 1 ? `All Casinos — Page ${query.page} | B4GAMBLE` : containsDemo ? "All Casinos Demonstration | B4GAMBLE" : "All Casinos and Reviews | B4GAMBLE";
  const description = containsDemo ? "Fictional demonstration records showing the B4GAMBLE review directory." : "Search and filter all published casino reviews after the B4GAMBLE shortlist.";
  return { title, description, alternates: { canonical }, robots: filtered || containsDemo || empty ? { index: false, follow: true } : { index: true, follow: true } };
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null });
  const result = await publicCasinoDiscoveryService.discover(query, authority);
  const commercialPreview = isCpoCommercialPreviewEnabled();
  const schemas = result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? [{ "@context": "https://schema.org", "@type": "ItemList", name: "All published casino reviews", numberOfItems: result.total, itemListElement: result.items.map((casino, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: casino.name, url: absoluteUrl(`/casino/${casino.slug}`) })) }] : [];

  return <div className={styles.page}>
    {schemas.map((schema, index) => <JsonLd data={schema} key={index} />)}
    <CommercialDecisionLayerView placement="all_results" sourceRoute="casinos" />
    <section className={styles.hero}><div className={styles.shell}><div className={styles.heroIntro}>
      <header><p>All Casinos · Research directory · 18+</p><h1>Every review.<br /><em>When you need it.</em></h1><span>The shortlist is the faster path. This directory keeps complete search, filters and review access for deeper research.</span></header>
      <div className={styles.heroSearch}><InstantDiscoveryForm action="/casinos" debouncedFields={["q"]} key={`hero:${result.appliedFilters.search ?? ""}`} pendingLabel="Updating casino results…"><label className={styles.srOnly} htmlFor="hero-casino-search">Search all casinos</label><input defaultValue={result.appliedFilters.search ?? ""} id="hero-casino-search" maxLength={100} name="q" placeholder="Search casinos, payments or providers" type="search" /><button aria-label="Search directory" type="submit">→</button></InstantDiscoveryForm><p>Country is a comparison preference, not proof of legal or commercial availability.</p></div>
    </div></div></section>

    <section className={styles.directory} id="casino-directory"><div className={styles.shell}>
      <aside className={styles.decisionBridge}><div><span>RECOMMENDED START</span><h2>Want the decision first?</h2><p>See B4GAMBLE’s three editorial picks, then return here only if you need more choice.</p></div><CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "best_casinos" }} href="/best-casinos" sourceRoute="casinos">See Best Casinos →</CommercialAnalyticsLink></aside>
      <div className={styles.directoryHeading}><div><p>All Casinos</p><h2>Search and filter<br /><em>every record.</em></h2></div><span>{result.total} {result.inventoryMode === "PUBLISHED_ONLY" ? "published" : "classified"} {result.total === 1 ? "record" : "records"}</span></div>
      {result.inventoryMode !== "PUBLISHED_ONLY" ? <div className={styles.disclosure} role="note"><strong>DEMONSTRATION DATA</strong><p>Fictional records are not current operators, licence claims, partners or live promotions.</p><Link href="/methodology">Read methodology →</Link></div> : null}
      <div className={styles.disclosure}><strong>Editorial boundary</strong><p>Affiliate compensation does not determine Editor Score or natural order. Missing evidence remains missing.</p><Link href="/affiliate-disclosure">Read disclosure →</Link></div>
      <DiscoveryControls result={result} />
      <ActiveDiscoveryFilters result={result} />
      <DiscoveryResults previewSimulation={commercialPreview} result={result} />
    </div></section>
  </div>;
}
