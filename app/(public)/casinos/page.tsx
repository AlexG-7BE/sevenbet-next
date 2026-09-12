import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { CasinoCollection } from "@/components/casino-discovery/CasinoCollection";
import { CompactProtection } from "@/components/commercial/CommercialPrimitives";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { commercialUxFixtureMarket, isCommercialUxVisualDataFixture, withCommercialUxFixturePresentation, withHandoffCasinoDiscoveryData } from "@/lib/final-handoff/visual-data-fixture";
import { formatProductMessage, productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { commercialAuthorityForPresentation, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { parseCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";
import type { CasinoDiscoveryQuery, CasinoDiscoveryResult } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { triggerPublicCommercialErrorHarness } from "@/lib/qa/public-commercial-error-harness";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function collectionQuery(): CasinoDiscoveryQuery {
  return {
    country: [], currency: [], license: [], payment: [], gameProvider: [], category: [], bonusType: [],
    sort: "FEATURED", page: 1, pageSize: 48,
  };
}

function emptyCasinoCollection(query: CasinoDiscoveryQuery): CasinoDiscoveryResult {
  return {
    items: [],
    inventoryMode: "PUBLISHED_ONLY",
    total: 0,
    page: 1,
    pageSize: query.pageSize ?? 48,
    pageCount: 0,
    facets: {
      countries: [], currencies: [], licenses: [], payments: [], gameProviders: [], categories: [], bonusTypes: [],
    },
    appliedFilters: query,
  };
}

const loadCasinoCollection = cache(async (visualFixture: boolean) => {
  const [presentation, authority] = await Promise.all([resolveServerPresentationContext(), resolveServerJurisdiction()]);
  const query = collectionQuery();
  const result = visualFixture
    ? emptyCasinoCollection(query)
    : await publicCasinoDiscoveryService.discover(
        query,
        commercialAuthorityForPresentation(authority, presentation.marketCountryCode),
        {
          ...(presentation.marketCountryCode ? { defaultEditorialCountry: presentation.marketCountryCode } : {}),
          ...(presentation.marketCode ? { commercialMarketCode: presentation.marketCode } : {}),
          presentationLanguage: presentation.language,
        },
      );
  return { presentation, result };
});

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const query = parseCasinoDiscoveryQuery(raw);
  const visualFixture = isCommercialUxVisualDataFixture(raw.visualFixture);
  const { presentation, result } = await loadCasinoCollection(visualFixture);
  const messages = productPageMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const containsDemo = result.inventoryMode !== "PUBLISHED_ONLY";
  const title = formatProductMessage(containsDemo ? messages.casinos.demoTitle : messages.casinos.title, { market });
  const description = formatProductMessage(containsDemo ? messages.casinos.demoDescription : messages.casinos.description, { market });
  return productMetadata({
    presentation,
    pathname: "/casinos",
    title,
    description,
    robots: containsDemo || result.total === 0 || Boolean(query.search) ? { index: false, follow: true } : { index: true, follow: true },
  });
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  triggerPublicCommercialErrorHarness(raw.errorFixture);
  const query = parseCasinoDiscoveryQuery(raw);
  const visualFixture = isCommercialUxVisualDataFixture(raw.visualFixture);
  const loaded = await loadCasinoCollection(visualFixture);
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, visualFixture);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const messages = productPageMessages(presentation.locale);
  const copy = commercialUxMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const result = withHandoffCasinoDiscoveryData(loaded.result, visualFixture, presentation.locale, collectionQuery(), fixtureMarket);
  const containsLocalPreview = result.items.some((casino) => casino.dataClassification === "LOCAL_PREVIEW_FIXTURE");
  const disclosure = containsLocalPreview ? messages.common.marketPresentationNotice : messages.common.demoDisclosure;
  const schema = result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: messages.casinos.directoryTitle,
    numberOfItems: result.total,
    itemListElement: result.items.map((casino, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: casino.name,
      url: absoluteUrl(productHref(presentation, `/casino/${casino.slug}`)),
    })),
  } : null;

  return <div className={styles.page} data-page-theme="dark" data-runtime-renderer="casinos">
    <CommercialSurfaceView surface="casinos" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={styles.hero} data-nav-theme="dark">
      <div className={styles.shell}>
        <div className={styles.heroIntro}><header>
          <p>{formatProductMessage(messages.casinos.heroKicker, { market })}</p>
          <h1>{messages.casinos.heroLead}<br /><em>{messages.casinos.heroEmphasis}</em></h1>
          <span>{formatProductMessage(messages.casinos.heroCopy, { market })}</span>
        </header></div>
      </div>
    </section>
    <section className={styles.directory} data-nav-theme="cream" id="casino-directory"><div className={styles.shell}>
      <div className={styles.directoryHeading}><div><p>{copy.casinosShown}</p><h2>{messages.casinos.directoryTitle}</h2></div><span>{result.total} {messages.common.records}</span></div>
      {result.inventoryMode !== "PUBLISHED_ONLY" ? <aside className={styles.disclosure} role="note"><strong>{messages.common.demoData}</strong><p>{disclosure}</p></aside> : null}
      {result.items.length ? <CasinoCollection casinos={result.items} initialSearch={query.search} messages={messages} presentation={presentation} /> : <section className={styles.empty} role="status"><h2>{formatProductMessage(messages.casinos.noPublishedTitle, { market })}</h2><p>{messages.casinos.reviewOnlyNotice}</p></section>}
      <div className={styles.commercialFooterNote}><p>{copy.compactDisclosure} · {messages.bestOffers.commissionNote}</p><Link href={productHref(presentation, "/affiliate-disclosure")}>{messages.common.affiliateDisclosure}</Link><CompactProtection copy={copy} presentation={presentation} /></div>
    </div></section>
  </div>;
}
