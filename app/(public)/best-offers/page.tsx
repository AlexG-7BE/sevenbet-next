import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { BestOffersExperience } from "@/components/best-offers/BestOffersExperience";
import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/best-offers/BestOffers.module.css";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { commercialUxFixtureMarket, isCommercialUxVisualDataFixture, withCommercialUxFixturePresentation, withHandoffOfferData } from "@/lib/final-handoff/visual-data-fixture";
import { formatProductMessage, productPageMessages } from "@/lib/i18n/product-pages-catalog";
import {
  commercialAuthorityForPresentation,
  productHref,
  productMetadata,
} from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerCommercialProductState } from "@/lib/market/commercial-product-state.server";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { triggerPublicCommercialErrorHarness } from "@/lib/qa/public-commercial-error-harness";
import { rankBestOffersForCategory } from "@/lib/public-offer/best-offer-ranking";

export const dynamic = "force-dynamic";
const loadBestOffersPageData = cache(async () => {
  const [presentation, authority, commercialProductState] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction(),
    resolveServerCommercialProductState(),
  ]);
  const commercialAuthority = commercialAuthorityForPresentation(authority, presentation.marketCountryCode);
  const result = await publicOfferService.getBestOffersPageData(
    {
      country: presentation.marketCountryCode ?? undefined,
      commercialMarketCode: presentation.marketCode ?? undefined,
      presentationLanguage: presentation.language,
      limit: 48,
    },
    commercialAuthority,
  );
  return { commercialAuthority, commercialProductState, presentation, result };
});

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const raw = await searchParams;
  const loaded = await loadBestOffersPageData();
  const fixtureEnabled = isCommercialUxVisualDataFixture(raw.visualFixture);
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, fixtureEnabled);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const result = withHandoffOfferData(loaded.result, fixtureEnabled, presentation.locale, fixtureMarket);
  const messages = productPageMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const copy = commercialUxMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const marketUnavailable = !fixtureEnabled && !commercialProductsAvailable(loaded.commercialProductState);
  const unavailable = result.status === "unavailable";
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const title = marketUnavailable
    ? `${shell.bestOffers} — ${market} | B4GAMBLE`
    : formatProductMessage(unavailable ? messages.bestOffers.unavailableTitle : messages.bestOffers.title, { market });
  const description = marketUnavailable
    ? formatProductMessage(copy.bestOffersMarketUnavailableCopy, { market })
    : formatProductMessage(unavailable ? messages.bestOffers.unavailableDescription : messages.bestOffers.description, { market });
  return productMetadata({
    presentation,
    pathname: "/best-offers",
    title,
    description,
    robots: marketUnavailable || unavailable || containsDemo ? { index: false, follow: true } : { index: true, follow: true },
  });
}

export default async function BestOffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  triggerPublicCommercialErrorHarness(raw.errorFixture);
  const loaded = await loadBestOffersPageData();
  const fixtureEnabled = isCommercialUxVisualDataFixture(raw.visualFixture);
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, fixtureEnabled);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const messages = productPageMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const copy = commercialUxMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const result = withHandoffOfferData(loaded.result, fixtureEnabled, presentation.locale, fixtureMarket);
  const marketUnavailable = !fixtureEnabled && !commercialProductsAvailable(loaded.commercialProductState);
  if (marketUnavailable) return <div className={styles.page} data-commercial-market-state="editorial-only" data-runtime-renderer="best-offers">
    <CommercialSurfaceView surface="best_offers" />
    <section className={styles.statePage} data-nav-theme="dark"><div className={styles.shell}><div className={styles.statePanel} role="status">
      <p className={styles.kicker}>{shell.bestOffers}</p>
      <h1>{formatProductMessage(copy.bestOffersMarketUnavailableTitle, { market })}</h1>
      <p>{copy.bestOffersMarketUnavailableCopy}</p>
      <div className={styles.stateActions}><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link><Link href={productHref(presentation, "/methodology")}>{messages.bestOffers.rankingLink}</Link></div>
    </div></div></section>
  </div>;
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const demoOnly = result.inventoryMode === "DEMO_ONLY";
  const hero = demoOnly
    ? { copy: messages.bestOffers.demoCopy, kicker: messages.bestOffers.demoKicker }
    : { copy: formatProductMessage(messages.bestOffers.heroCopy, { market }), kicker: formatProductMessage(messages.bestOffers.heroKicker, { market }) };
  const schemaOffers = rankBestOffersForCategory(result.records, "best_overall", {
    country: presentation.marketCountryCode ?? undefined,
    limit: 3,
  });
  const schema = result.status === "available" && result.inventoryMode === "PUBLISHED_ONLY" ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `B4GAMBLE ${market} ${messages.bestOffers.sectionTitle}`,
    numberOfItems: schemaOffers.length,
    itemListElement: schemaOffers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${offer.casino.name}: ${offer.bonus.title}`,
      url: absoluteUrl(productHref(presentation, `/casino/${offer.casino.slug}`)),
    })),
  } : null;

  return <div className={styles.page} data-runtime-renderer="best-offers">
    <p className="srOnly">{messages.bestOffers.commissionNote}</p>
    <CommercialSurfaceView surface="best_offers" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={styles.hero} data-nav-theme="dark"><div className={`${styles.shell} ${styles.heroInner}`}>
      <p className={styles.kicker}>✓ &nbsp; {hero.kicker}</p>
      <h1><span>{messages.bestOffers.heroLead}</span><em>{messages.bestOffers.heroEmphasis}</em></h1>
      <p className={styles.heroCopy}>{hero.copy}</p>
      <div className={styles.heroTicker}><Link href={productHref(presentation, "/methodology")}>{messages.bestOffers.rankingLink}</Link></div>
    </div></section>
    {containsDemo ? <section className={styles.demoDisclosure} data-nav-theme="dark" role="note"><div className={styles.shell}><p><strong>{messages.common.demoData}.</strong> {messages.bestOffers.demoCopy}</p></div></section> : null}
    {result.status === "available" ? <><BestOffersExperience inventoryMode={result.inventoryMode} messages={messages} presentation={presentation} shortlist={result.records} />
      <section className={styles.whyPicked} data-premium-section="best-offers-method" data-nav-theme="cream"><div className={styles.shell}>
        <div><p className={styles.lightKicker}>{presentation.language === "en" ? "How we choose" : messages.bestOffers.whyTitle}</p><h2>{messages.common.materialTerms} · {messages.common.sourceStatus}</h2><p><Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology}</Link></p></div>
        <ol>
          <li><span>01</span><div><strong>{messages.common.availability}</strong><p>{formatProductMessage(messages.bestOffers.heroCopy, { market })}</p></div></li>
          <li><span>02</span><div><strong>{messages.common.materialTerms}</strong><p>{messages.bonuses.methodCopy}</p></div></li>
          <li><span>03</span><div><strong>{messages.common.sourceStatus}</strong><p>{messages.bestOffers.whyCopy}</p></div></li>
        </ol>
      </div></section>
      <section className={styles.faq} data-premium-section="best-offers-faq"><div className={styles.faqGrid}><h2>{messages.bestOffers.beforeClick}</h2>
        <details><summary>{messages.bestOffers.faqWageringQuestion}</summary><p>{messages.bestOffers.faqWageringAnswer}</p></details>
        <details><summary>{messages.bestOffers.faqCommissionQuestion}</summary><p>{messages.bestOffers.faqCommissionAnswer}</p></details>
        <details><summary>{messages.bestOffers.faqWhyThreeQuestion}</summary><p>{messages.bestOffers.faqWhyThreeAnswer}</p></details>
      </div></section>
    </> : <section className={styles.statePage} data-nav-theme="light" id="shortlist"><div className={styles.shell}><div className={styles.statePanel} role="status"><p className={styles.kicker}>{messages.common.commercialUnavailable}</p><h2>{result.status === "unavailable" ? messages.bestOffers.unavailableTitleBody : formatProductMessage(messages.bestOffers.emptyTitle, { market })}</h2><p>{result.status === "unavailable" ? messages.bestOffers.unavailableCopy : messages.bestOffers.emptyCopy}</p><div className={styles.stateActions}><Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology}</Link><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link></div></div></div></section>}
  </div>;
}
