import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { cache } from "react";

import {
  ActiveBonusFilters,
  BonusComparisonList,
  BonusFilters,
  BonusPagination,
} from "@/components/bonus-directory/BonusDirectory";
import { CuratedBonusShortlist } from "@/components/bonus-directory/CuratedBonusShortlist";
import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import finalStyles from "./BonusesFinal.module.css";
import { BonusCalculator } from "./BonusCalculator";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import type { PublicOfferQuery } from "@/lib/public-offer/public-offer.types";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { isLocalHandoffVisualDataFixture, withHandoffBonusDirectoryData } from "@/lib/final-handoff/visual-data-fixture";
import { formatProductMessage, productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { commercialAuthorityForPresentation, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<PublicOfferSearchParams> };
const loadBonusDirectoryResult = cache(async (queryKey: string, presentationCountry: string) => {
  const query = JSON.parse(queryKey) as PublicOfferQuery;
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country ?? null });
  return publicOfferService.searchOffers(
    query,
    commercialAuthorityForPresentation(authority, presentationCountry),
    { defaultEditorialCountry: presentationCountry },
  );
});

function loadBonusDirectory(query: PublicOfferQuery, presentationCountry: string) {
  return loadBonusDirectoryResult(JSON.stringify(query), presentationCountry);
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parsePublicOfferQuery(await searchParams, 24);
  const presentation = await resolveServerPresentationContext();
  const messages = productPageMessages(presentation.locale);
  const market = presentation.market.seoDisplayName;
  const filtered = hasPublicOfferFilters(query);
  const result = await loadBonusDirectory(query, presentation.market.countryCode);
  const unavailable = result.inventoryMode === "UNAVAILABLE";
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const empty = result.total === 0;
  const title = formatProductMessage(
    unavailable ? `${messages.bonuses.unavailableTitleBody} | B4GAMBLE` : containsDemo ? messages.bonuses.demoTitle : messages.bonuses.title,
    { market },
  );
  const description = formatProductMessage(unavailable ? messages.bonuses.unavailableCopy : containsDemo ? messages.bonuses.demoDescription : messages.bonuses.description, { market });
  return productMetadata({ presentation, pathname: "/bonuses", title, description, robots: unavailable || filtered || containsDemo || empty ? { index: false, follow: true } : { index: true, follow: true } });
}

export default async function BonusesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const query = parsePublicOfferQuery(raw, 24);
  const presentation = await resolveServerPresentationContext();
  const messages = productPageMessages(presentation.locale);
  const market = presentation.market.seoDisplayName;
  const result = withHandoffBonusDirectoryData(
    await loadBonusDirectory(query, presentation.market.countryCode),
    isLocalHandoffVisualDataFixture(raw.visualFixture),
  );
  const activeCount = [query.country, query.type, query.payment, query.crypto, query.maxDeposit, query.maxWagering, query.availability].filter((value) => value !== undefined).length;
  const startPosition = (result.page - 1) * result.pageSize + 1;
  const schema = result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: messages.bonuses.directoryTitle,
    numberOfItems: result.total,
    itemListElement: result.records.map((offer, index) => ({
      "@type": "ListItem",
      position: startPosition + index,
      name: `${offer.casino.name}: ${offer.bonus.title}`,
      url: absoluteUrl(productHref(presentation, `/casino/${offer.casino.slug}`)),
    })),
  } : null;

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="bonuses">
    <CommercialSurfaceView surface="bonuses" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={finalStyles.hero} data-nav-theme="dark">
      <div className={finalStyles.heroCopy}>
        <small><span className={finalStyles.desktopKicker}>{messages.bonuses.heroKicker}</span><span className={finalStyles.mobileKicker}>{formatProductMessage(messages.bonuses.description, { market })}</span></small>
        <h1>{messages.bonuses.heroLead}<em>{messages.bonuses.heroEmphasis}</em></h1>
        <p>{messages.bonuses.heroCopy}</p>
      </div>
      <div className={finalStyles.heroMeta}><span>{messages.bonuses.proofTerms}</span><span>{messages.bonuses.proofClaims}</span><span>{messages.bonuses.proofSources}</span></div>
    </section>

    {result.inventoryMode !== "UNAVAILABLE" ? <CuratedBonusShortlist messages={messages} offers={result.records} presentation={presentation} /> : null}

    <section className={styles.directorySection} data-motion-reveal data-nav-theme="cream">
      <div className={styles.shell}>
        <header className={styles.sectionHeading}><h2 className={styles.display}>{messages.bonuses.directoryTitle}</h2><p>{result.total} {messages.common.records} · {messages.bonuses.sortedByValue}</p></header>
        {result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED" ? <aside className={styles.demoDirectoryDisclosure} role="note"><strong>{messages.common.demoData}</strong><p>{messages.common.demoDisclosure}</p></aside> : null}
        {result.inventoryMode === "UNAVAILABLE" ? <section className={styles.empty} role="status"><p className={styles.eyebrow}>{messages.common.commercialUnavailable}</p><h2>{messages.bonuses.unavailableTitleBody}</h2><p>{messages.bonuses.unavailableCopy}</p><Link href="/methodology">{messages.common.reviewMethodology}</Link></section> : <>
          <BonusFilters activeCount={activeCount} facets={result.facets} messages={messages} presentation={presentation} query={result.query} total={result.total} />
          <ActiveBonusFilters messages={messages} presentation={presentation} query={result.query} raw={raw} />

          {result.records.length > 0 ? <>
            <p className={styles.resultsStatus} aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? messages.common.result : messages.common.results} · {messages.common.pageOf.replace("{page}", String(result.page)).replace("{pages}", String(result.pageCount))}</p>
            <BonusComparisonList messages={messages} offers={result.records} presentation={presentation} startPosition={startPosition} />
            <BonusPagination messages={messages} page={result.page} pageCount={result.pageCount} presentation={presentation} raw={raw} />
          </> : <section className={styles.empty}><p className={styles.eyebrow}>{messages.bonuses.noMatchesTitle}</p><h2>{formatProductMessage(messages.bonuses.noMatchesTitle, { market })}</h2><p>{messages.bonuses.noMatchesCopy}</p></section>}
        </>}
      </div>
    </section>

    <BonusCalculator messages={messages} locale={presentation.locale} />
    <section className={finalStyles.method} data-motion-reveal data-nav-theme="cream"><div><div><small>{messages.bonuses.methodKicker}</small><h2>{messages.bonuses.methodLead} <em>{messages.bonuses.methodEmphasis}</em></h2><p>{messages.bonuses.methodCopy}</p><Link className={finalStyles.guideAction} href="/bonus-guide">{messages.bonuses.guideAction}</Link></div><ol><li><span>01</span><div><strong>{messages.common.wagering}</strong><p>{messages.bonuses.methodCopy}</p></div></li><li><span>02</span><div><strong>{messages.common.materialTerms}</strong><p>{messages.bonuses.proofTerms}</p></div></li><li><span>03</span><div><strong>{messages.common.sourceStatus}</strong><p>{messages.bonuses.proofSources}</p></div></li></ol></div></section>
    <section className={styles.disclosure} data-nav-theme="dark"><div className={styles.shell}><strong>{messages.bonuses.disclosureTitle}</strong><p>{messages.bonuses.disclosureCopy}</p><Link href="/affiliate-disclosure">{messages.bonuses.disclosureAction}</Link></div></section>
  </div>;
}
