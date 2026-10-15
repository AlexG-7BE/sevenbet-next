import Link from "next/link";

import { licensedNeighbourMarket, licensedNeighbours } from "@/lib/casino-profile/licensed-neighbours";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { editorialPresentation } from "@/lib/market/editorial-market";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";

import styles from "./CasinoProfile.module.css";

/** The country a licence market names, in the page's language ("Sverige", "Danmark"). */
function countryName(locale: string, market: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(market) ?? market;
  } catch {
    return market;
  }
}

/**
 * "Other casinos licensed in <country>" under a review: 4–6 neighbouring reviews from the same
 * catalogue the casinos page shows, so each review gains links from its neighbours and the reader
 * a next review (affiliate traffic audit, 15 October 2026). It streams on its own; a failed read
 * renders nothing rather than delaying or failing the review.
 */
export async function LicensedNeighbours({ casinoSlug, messages, presentation }: {
  casinoSlug: string;
  messages: ProductPageMessages;
  presentation: PresentationResolution;
}) {
  const market = licensedNeighbourMarket(presentation.language);
  if (!market) return null;
  const neighbours = await (async () => {
    try {
      // The same catalogue read as the casinos page (app/(public)/casinos/page.tsx).
      const [visitor, authority] = await Promise.all([resolveServerPresentationContext(), resolveServerJurisdiction()]);
      const editorial = editorialPresentation(visitor);
      const result = await publicCasinoDiscoveryService.discover(
        { country: [], currency: [], license: [], payment: [], gameProvider: [], category: [], bonusType: [], sort: "FEATURED", page: 1, pageSize: 48 },
        authority,
        {
          ...(editorial.marketCountryCode ? { defaultEditorialCountry: editorial.marketCountryCode } : {}),
          ...(editorial.marketCode ? { commercialMarketCode: editorial.marketCode } : {}),
          presentationLanguage: editorial.language,
        },
      );
      return result.inventoryMode === "PUBLISHED_ONLY" ? licensedNeighbours(result.items, casinoSlug, presentation.language, undefined, editorial.marketCountryCode) : [];
    } catch {
      return [];
    }
  })();
  if (!neighbours.length) return null;
  const copy = commercialUxMessages(presentation.locale);
  const scoreFormat = new Intl.NumberFormat(presentation.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return <aside aria-labelledby="licensed-neighbours-heading" className={`${styles.section} ${styles.altSection}`} data-casino-neighbours={market}>
    <header data-motion-reveal><h2 id="licensed-neighbours-heading">{formatProductMessage(copy.licensedNeighboursTitle, { country: countryName(presentation.locale, market) })}</h2></header>
    <ul className={styles.neighbourList}>
      {neighbours.map((neighbour) => <li key={neighbour.slug}>
        <Link data-intent-prefetch="" href={productHref(presentation, `/casino/${neighbour.slug}`)}>
          <strong>{neighbour.name}</strong>
          {neighbour.rating === null ? null : <span>{messages.common.editorScore} {scoreFormat.format(neighbour.rating)}</span>}
          <em>{messages.common.readReview} <span aria-hidden="true">→</span></em>
        </Link>
      </li>)}
    </ul>
  </aside>;
}
