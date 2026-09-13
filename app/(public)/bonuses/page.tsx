import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { cache } from "react";

import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { BonusOfferDirectory } from "@/components/bonus-directory/BonusOfferDirectory";
import { CompactProtection } from "@/components/commercial/CommercialPrimitives";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import finalStyles from "./BonusesFinal.module.css";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { commercialUxFixtureMarket, isCommercialUxVisualDataFixture, withCommercialUxFixturePresentation, withHandoffBonusDirectoryData } from "@/lib/final-handoff/visual-data-fixture";
import { formatProductMessage, productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerCommercialProductState } from "@/lib/market/commercial-product-state.server";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import { triggerPublicCommercialErrorHarness } from "@/lib/qa/public-commercial-error-harness";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });
export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<PublicOfferSearchParams> };

const loadBonusDirectory = cache(async () => {
  const [presentation, authority, commercialProductState] = await Promise.all([resolveServerPresentationContext(), resolveServerJurisdiction(), resolveServerCommercialProductState()]);
  const query = parsePublicOfferQuery({}, 100);
  const result = await publicOfferService.searchOffers(
    { ...query, country: presentation.marketCountryCode ?? undefined },
    authority,
    {
      ...(presentation.marketCountryCode ? { defaultEditorialCountry: presentation.marketCountryCode } : {}),
      ...(presentation.marketCode ? { commercialMarketCode: presentation.marketCode } : {}),
      presentationLanguage: presentation.language,
    },
  );
  return { commercialProductState, presentation, result };
});

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const legacyQuery = parsePublicOfferQuery(raw, 100);
  const loaded = await loadBonusDirectory();
  const visualFixture = isCommercialUxVisualDataFixture(raw.visualFixture);
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, visualFixture);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const result = withHandoffBonusDirectoryData(loaded.result, visualFixture, presentation.locale, parsePublicOfferQuery({}, 100), fixtureMarket);
  const messages = productPageMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const copy = commercialUxMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const hasCanonicalAction = result.records.some((offer) => offer.action !== null);
  const marketUnavailable = !visualFixture && !hasCanonicalAction && !commercialProductsAvailable(loaded.commercialProductState);
  const unavailable = result.inventoryMode === "UNAVAILABLE";
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const title = marketUnavailable ? `${shell.bonuses} — ${market} | B4GAMBLE` : formatProductMessage(unavailable ? `${messages.bonuses.unavailableTitleBody} | B4GAMBLE` : containsDemo ? messages.bonuses.demoTitle : messages.bonuses.title, { market });
  const description = marketUnavailable ? formatProductMessage(copy.bonusesMarketUnavailableCopy, { market }) : formatProductMessage(unavailable ? messages.bonuses.unavailableCopy : containsDemo ? messages.bonuses.demoDescription : messages.bonuses.description, { market });
  return productMetadata({
    presentation,
    pathname: "/bonuses",
    title,
    description,
    robots: marketUnavailable || unavailable || containsDemo || result.total === 0 || hasPublicOfferFilters(legacyQuery) ? { index: false, follow: true } : { index: true, follow: true },
  });
}

export default async function BonusesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  triggerPublicCommercialErrorHarness(raw.errorFixture);
  const loaded = await loadBonusDirectory();
  const visualFixture = isCommercialUxVisualDataFixture(raw.visualFixture);
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, visualFixture);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const messages = productPageMessages(presentation.locale);
  const copy = commercialUxMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const query = parsePublicOfferQuery({}, 100);
  const result = withHandoffBonusDirectoryData(loaded.result, visualFixture, presentation.locale, query, fixtureMarket);
  const hasCanonicalAction = result.records.some((offer) => offer.action !== null);
  const marketUnavailable = !visualFixture && !hasCanonicalAction && !commercialProductsAvailable(loaded.commercialProductState);
  if (marketUnavailable) return <div className={`${styles.page} ${instrumentSerif.variable}`} data-commercial-market-state="editorial-only" data-runtime-renderer="bonuses">
    <CommercialSurfaceView surface="bonuses" />
    <section className={finalStyles.unavailable} data-nav-theme="dark"><div>
      <small>{shell.bonuses}</small>
      <h1>{formatProductMessage(copy.bonusesMarketUnavailableTitle, { market })}</h1>
      <p>{copy.bonusesMarketUnavailableCopy}</p>
      <nav aria-label={shell.bonuses}><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link><Link href="/bonus-guide">{messages.common.bonusGuide}</Link></nav>
    </div></section>
  </div>;
  const schema = result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: messages.bonuses.directoryTitle,
    numberOfItems: result.total,
    itemListElement: result.records.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${offer.casino.name}: ${offer.bonus.title}`,
      url: absoluteUrl(productHref(presentation, `/casino/${offer.casino.slug}`)),
    })),
  } : null;

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="bonuses">
    <CommercialSurfaceView surface="bonuses" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={finalStyles.hero} data-nav-theme="dark">
      <div className={finalStyles.heroCopy}>
        <small>{messages.bonuses.heroKicker}</small>
        <h1>{messages.bonuses.heroLead}<em>{messages.bonuses.heroEmphasis}</em></h1>
        <p>{formatProductMessage(messages.bonuses.heroCopy, { market })}</p>
      </div>
    </section>
    <section className={styles.directorySection} data-nav-theme="cream" id="bonus-directory">
      <div className={styles.shell}>
        <header className={styles.sectionHeading}><h2 className={styles.display}>{messages.bonuses.directoryTitle}</h2><p>{result.total} {messages.common.records}</p></header>
        {result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED" ? <aside className={styles.demoDirectoryDisclosure} role="note"><strong>{messages.common.demoData}</strong><p>{messages.common.demoDisclosure}</p></aside> : null}
        {result.inventoryMode === "UNAVAILABLE" ? <section className={styles.empty} role="status"><h2>{messages.bonuses.unavailableTitleBody}</h2><p>{messages.bonuses.unavailableCopy}</p><Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology}</Link></section> : <BonusOfferDirectory messages={messages} offers={result.records} presentation={presentation} />}
        <div className={styles.commercialFooterNote}><p>{copy.compactDisclosure} · {messages.bonuses.disclosureCopy}</p><Link href={productHref(presentation, "/affiliate-disclosure")}>{messages.common.affiliateDisclosure}</Link><CompactProtection copy={copy} presentation={presentation} /></div>
      </div>
    </section>
    <section className={finalStyles.method} data-premium-section="bonus-terms-method" data-nav-theme="cream"><div>
      <div><small>{messages.bonuses.methodKicker}</small><h2>{messages.bonuses.methodLead}<br /><em>{messages.bonuses.methodEmphasis}</em></h2><p>{messages.bonuses.methodCopy}</p><Link href="/bonus-guide">{messages.bonuses.guideAction}</Link></div>
      <ol>
        <li><span>01</span><div><strong>{messages.common.wagering}</strong><p>{messages.bonuses.methodCopy}</p></div></li>
        <li><span>02</span><div><strong>{messages.common.materialTerms}</strong><p>{copy.importantRestrictions}</p></div></li>
        <li><span>03</span><div><strong>{messages.common.sourceStatus}</strong><p>{messages.bonuses.proofSources}</p></div></li>
      </ol>
    </div></section>
  </div>;
}
