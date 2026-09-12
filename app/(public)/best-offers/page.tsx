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
import { triggerPublicCommercialErrorHarness } from "@/lib/qa/public-commercial-error-harness";
import { rankBestOffersForCategory } from "@/lib/public-offer/best-offer-ranking";

export const dynamic = "force-dynamic";
const loadBestOffersPageData = cache(async () => {
  const [presentation, authority] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction(),
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
  return { commercialAuthority, presentation, result };
});

export async function generateMetadata(): Promise<Metadata> {
  const { presentation, result } = await loadBestOffersPageData();
  const messages = productPageMessages(presentation.locale);
  const market = presentation.marketDisplayName;
  const unavailable = result.status === "unavailable";
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const title = formatProductMessage(unavailable ? messages.bestOffers.unavailableTitle : messages.bestOffers.title, { market });
  const description = formatProductMessage(unavailable ? messages.bestOffers.unavailableDescription : messages.bestOffers.description, { market });
  return productMetadata({
    presentation,
    pathname: "/best-offers",
    title,
    description,
    robots: unavailable || containsDemo ? { index: false, follow: true } : { index: true, follow: true },
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
  const market = presentation.marketDisplayName;
  const result = withHandoffOfferData(loaded.result, fixtureEnabled, presentation.locale, fixtureMarket);
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
    {result.status === "available" ? <BestOffersExperience inventoryMode={result.inventoryMode} messages={messages} presentation={presentation} shortlist={result.records} /> : <section className={styles.statePage} data-nav-theme="light" id="shortlist"><div className={styles.shell}><div className={styles.statePanel} role="status"><p className={styles.kicker}>{messages.common.commercialUnavailable}</p><h2>{result.status === "unavailable" ? messages.bestOffers.unavailableTitleBody : formatProductMessage(messages.bestOffers.emptyTitle, { market })}</h2><p>{result.status === "unavailable" ? messages.bestOffers.unavailableCopy : messages.bestOffers.emptyCopy}</p><div className={styles.stateActions}><Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology}</Link><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link></div></div></div></section>}
  </div>;
}
