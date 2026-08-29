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
import { formatProductMessage, productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { commercialAuthorityForPresentation, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const filtered = hasDiscoveryFilters(query);
  const [presentation, authority] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null }),
  ]);
  const messages = productPageMessages(presentation.locale);
  const market = presentation.market.seoDisplayName;
  const result = await publicCasinoDiscoveryService.discover(
    query,
    commercialAuthorityForPresentation(authority, presentation.market.countryCode),
    { defaultEditorialCountry: presentation.market.countryCode },
  );
  const containsDemo = result.inventoryMode !== "PUBLISHED_ONLY";
  const empty = result.total === 0;
  const canonicalParams = new URLSearchParams();
  if (!filtered && (query.page ?? 1) > 1) canonicalParams.set("page", String(query.page));
  const canonicalPath = `/casinos${canonicalParams.size ? `?${canonicalParams}` : ""}`;
  const title = formatProductMessage(containsDemo ? messages.casinos.demoTitle : messages.casinos.title, { market });
  const description = formatProductMessage(containsDemo ? messages.casinos.demoDescription : messages.casinos.description, { market });
  return productMetadata({ presentation, pathname: canonicalPath, title, description, robots: filtered || containsDemo || empty ? { index: false, follow: true } : { index: true, follow: true } });
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const query = parseCasinoDiscoveryQuery(raw);
  const [presentation, authority] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null }),
  ]);
  const messages = productPageMessages(presentation.locale);
  const market = presentation.market.seoDisplayName;
  const result = withHandoffCasinoDiscoveryData(
    await publicCasinoDiscoveryService.discover(
      query,
      commercialAuthorityForPresentation(authority, presentation.market.countryCode),
      { defaultEditorialCountry: presentation.market.countryCode },
    ),
    isLocalHandoffVisualDataFixture(raw.visualFixture),
  );
  const hasLocalPreviewAction = result.items.some((casino) => casino.dataClassification === "LOCAL_PREVIEW_FIXTURE" && casino.visitAction.available);
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "B4GAMBLE", item: absoluteUrl(productHref(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.casinos.directoryTitle, item: absoluteUrl(productHref(presentation, "/casinos")) }] },
    ...(result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? [{ "@context": "https://schema.org", "@type": "ItemList", name: messages.casinos.directoryTitle, numberOfItems: result.total, itemListElement: result.items.map((casino, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: casino.name, url: absoluteUrl(productHref(presentation, `/casino/${casino.slug}`)) })) }] : []),
  ];

  return <div className={styles.page} data-page-theme="dark" data-runtime-renderer="casinos">
    <CommercialSurfaceView surface="casinos" />
    <p className="srOnly">{messages.bestOffers.commissionNote}</p>
    <ContextualComparison messages={messages} presentation={presentation} />
    {schemas.map((schema, index) => <JsonLd data={schema} key={index} />)}
    <section className={styles.hero} data-nav-theme="dark">
      <div className={styles.shell}>
        <div className={styles.heroIntro}>
          <header><p>{formatProductMessage(messages.casinos.heroKicker, { market })}</p><h1>{messages.casinos.heroLead}<br /><em>{messages.casinos.heroEmphasis}</em></h1><span>{messages.casinos.heroCopy}</span></header>
        </div>
        <div className={styles.heroProof}><span>{messages.casinos.proofEvidence}</span><span>{messages.casinos.proofLimit}</span><span>{messages.casinos.proofPublished}</span></div>
      </div>
    </section>

    <CuratedCasinoShortlist casinos={result.items} messages={messages} presentation={presentation} />

    <section className={styles.directory} data-motion-reveal data-nav-theme="cream" id="casino-directory"><div className={styles.shell}>
      <div className={styles.directoryHeading}><div><p>{messages.casinos.directoryTitle}</p><h2>{messages.casinos.directoryTitle}</h2></div><span>{result.total} {result.inventoryMode === "PUBLISHED_ONLY" ? messages.common.published : messages.common.classified} {result.total === 1 ? messages.common.record : messages.common.records}</span></div>
      {result.inventoryMode !== "PUBLISHED_ONLY" ? <div className={styles.disclosure} role="note"><strong>{messages.common.demoData}</strong><p>{messages.common.demoDisclosure} {hasLocalPreviewAction ? messages.common.marketPresentationNotice : messages.common.commercialUnavailable}</p><Link href="/methodology">{messages.common.reviewMethodology} →</Link></div> : null}
      <DiscoveryControls messages={messages} presentation={presentation} result={result} />
      <ActiveDiscoveryFilters messages={messages} presentation={presentation} result={result} />
      <DiscoveryResults messages={messages} presentation={presentation} result={result} />
    </div></section>

    <section className={styles.faq} data-motion-reveal data-nav-theme="cream"><div className={styles.shell}><div className={styles.sectionIntro}><p>{messages.casinos.faqTitle}</p><h2>{messages.casinos.faqTitle}</h2></div><div>{[
      [messages.casinos.faqDifferenceQuestion, messages.casinos.faqDifferenceAnswer],
      [messages.casinos.faqReviewOnlyQuestion, messages.casinos.faqReviewOnlyAnswer],
      [messages.casinos.faqCommissionQuestion, messages.casinos.faqCommissionAnswer],
    ].map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
  </div>;
}
