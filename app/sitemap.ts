import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { articlePath } from "@/lib/articles/article-types";
import { absoluteUrl, coreRoutes } from "@/lib/site";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { parsePublicOfferQuery } from "@/lib/public-offer/query";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import {
  DEFAULT_MARKET_PROFILE,
  INDEXABLE_LANGUAGE_ROUTE_PROFILES,
  INITIAL_EUROPEAN_MARKET_PROFILES,
  languageForLocale,
  marketIndexingApproved,
  marketProfileByLocale,
  publicMarketPath,
  type MarketProfile,
} from "@/lib/market/registry";
import { isLocalizedPublicDestination } from "@/lib/market/routing";
import { localizedProductIndexingApproved } from "@/lib/market/product-context";
import { PROGRAMME_ROUTES } from "@/lib/programme/presentation";
import { bonusDirectoryIndexable } from "@/lib/seo/product-indexing";
import { reviewIndexable } from "@/lib/seo/review-indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function failClosed<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

/**
 * What a crawler is shown on a Bonuses page: every published offer, with no market's
 * closures applied. Pages are language routes whose market comes from the visitor's IP, and
 * the crawlers that index them crawl from outside the launch markets (Googlebot from the US),
 * so this is the inventory their robots decision sees. Using the German market's own
 * inventory made `/de/bonuses` leave the sitemap from 06:00 to 21:00 Berlin time, when German
 * rules close offers, while the page itself stayed `index, follow` (audit 27 Sep 2026).
 */
export async function loadCrawlerBonusDirectory() {
  return failClosed(() => publicOfferService.searchOffers(parsePublicOfferQuery({}, 1), null));
}

export async function loadMarketSitemapSnapshot(
  market: MarketProfile,
  crawlerBonuses?: Awaited<ReturnType<typeof loadCrawlerBonusDirectory>>,
) {
  const discoveryResult = await failClosed(async () => {
    const discovery = await publicCasinoDiscoveryService.discover(
      { page: 1, pageSize: 48 },
      null,
      { defaultEditorialCountry: market.countryCode },
    );
    const casinos = [...discovery.items];
    for (let page = 2; page <= Math.min(discovery.pageCount, 11) && casinos.length < 500; page += 1) {
      const result = await publicCasinoDiscoveryService.discover(
        { page, pageSize: 48 },
        null,
        { defaultEditorialCountry: market.countryCode },
      );
      casinos.push(...result.items);
    }
    return { casinos, discovery };
  });
  const bestOffers = await failClosed(() => publicOfferService.getBestOffersPageData(
    { country: market.countryCode, limit: 12 },
    null,
  ));
  const bonuses = crawlerBonuses === undefined ? await loadCrawlerBonusDirectory() : crawlerBonuses;
  return {
    bestOffers,
    bonuses,
    casinos: discoveryResult?.casinos ?? [],
    discovery: discoveryResult?.discovery ?? null,
    market,
  };
}

/**
 * Published, indexable reviews: the ones the sitemap and llms.txt list. With a language, only the
 * reviews of casinos licensed in that language's market (lib/seo/review-indexing.ts).
 */
export function indexableReviewCards<T extends Pick<PublicCasinoCardDto, "dataClassification" | "indexable" | "slug">>(casinos: readonly T[], language?: string) {
  return casinos
    .filter((casino) => casino.dataClassification === "PUBLISHED_RECORD" && casino.indexable !== false)
    .filter((casino) => !language || reviewIndexable(casino.slug, language))
    .slice(0, 500);
}

export function indexableMarketProductPaths(snapshot: Awaited<ReturnType<typeof loadMarketSitemapSnapshot>>, localized: boolean) {
  const prefix = (pathname: string) => localized
    ? publicMarketPath(snapshot.market, snapshot.market.defaultLocale, pathname)
    : pathname;
  const publishedDirectory = Boolean(snapshot.discovery && snapshot.discovery.total > 0 && snapshot.discovery.inventoryMode === "PUBLISHED_ONLY");
  const routes = [
    ...(publishedDirectory ? [prefix("/casinos")] : []),
    ...(bonusDirectoryIndexable(snapshot.bonuses) ? [prefix("/bonuses")] : []),
    ...(snapshot.bestOffers && snapshot.bestOffers.status !== "unavailable" && snapshot.bestOffers.inventoryMode === "PUBLISHED_ONLY" ? [prefix("/best-offers")] : []),
  ];
  const casinoRoutes = indexableReviewCards(snapshot.casinos, languageForLocale(snapshot.market.defaultLocale))
    .map((casino) => ({
      url: absoluteUrl(prefix(`/casino/${casino.slug}`)),
      ...(casino.editorialUpdatedAt || casino.publishedAt
        ? { lastModified: casino.editorialUpdatedAt ?? casino.publishedAt ?? undefined }
        : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  return { routes, casinoRoutes };
}

/** Thrown when part of a market's catalogue could not be read; carries what was read. */
export class SitemapCatalogueUnavailable extends Error {
  constructor(readonly partial: ReturnType<typeof indexableMarketProductPaths>) {
    super("SITEMAP_MARKET_CATALOGUE_UNAVAILABLE");
  }
}

/**
 * A market's product URLs from a complete snapshot. A snapshot with any part unread (a database
 * stall: no discovery, no bonuses, Best Offers unavailable) throws instead, so it never replaces
 * the last good list below.
 */
export function completeMarketProductPaths(snapshot: Awaited<ReturnType<typeof loadMarketSitemapSnapshot>>) {
  const paths = indexableMarketProductPaths(snapshot, true);
  const incomplete = !snapshot.discovery
    || !snapshot.bonuses || snapshot.bonuses.inventoryMode === "UNAVAILABLE"
    || !snapshot.bestOffers || snapshot.bestOffers.status === "unavailable";
  if (incomplete) throw new SitemapCatalogueUnavailable(paths);
  return paths;
}

/**
 * The sitemap keeps the last good list of a market's reviews and directories when the database
 * stalls (affiliate traffic audit, 15 October 2026). Every casino update clears the catalogue
 * cache and announces the review to IndexNow, so a crawler arrived exactly when nothing was cached
 * and, during a pooler stall, got a sitemap without the casino pages. This entry has no tag a
 * casino update clears; after 10 minutes it is refreshed in the background, and a failed refresh
 * (a throw) leaves the previous list in place. With no list yet, what could be read is used.
 */
export async function lastGoodMarketProductPaths(
  market: MarketProfile,
  crawlerBonuses: Awaited<ReturnType<typeof loadCrawlerBonusDirectory>>,
  cache: typeof unstable_cache = unstable_cache,
) {
  try {
    return await cache(
      async () => completeMarketProductPaths(await loadMarketSitemapSnapshot(market, crawlerBonuses)),
      ["sitemap-market-products-v1", market.countryCode],
      { revalidate: 600 },
    )();
  } catch (cause) {
    return cause instanceof SitemapCatalogueUnavailable ? cause.partial : { routes: [], casinoRoutes: [] };
  }
}

export function localizedIndexableMarketProfiles(markets: readonly MarketProfile[]) {
  return markets.filter((market) => market.countryCode !== DEFAULT_MARKET_PROFILE.countryCode && marketIndexingApproved(market));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articleService } = await import("@/lib/services/article.service");
  const crawlerBonuses = await loadCrawlerBonusDirectory();
  const baseProducts = await lastGoodMarketProductPaths(DEFAULT_MARKET_PROFILE, crawlerBonuses);
  const localizedProducts = await Promise.all(localizedIndexableMarketProfiles(INITIAL_EUROPEAN_MARKET_PROFILES)
    .map((market) => lastGoodMarketProductPaths(market, crawlerBonuses)));
  const learningSnapshots = await Promise.all(INDEXABLE_LANGUAGE_ROUTE_PROFILES.map(async (language) => ({
    language,
    articles: await failClosed(() => articleService.listPublished(language.defaultLocale, { take: 500 })) ?? [],
  })));
  const learningArticleRoutes = learningSnapshots.flatMap(({ articles, language }) => {
    const market = marketProfileByLocale(language.defaultLocale) ?? DEFAULT_MARKET_PROFILE;
    return articles.map((article) => ({
      url: absoluteUrl(publicMarketPath(market, language.defaultLocale, articlePath(article))),
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  });
  // An indexable market lists the same core pages as the English sitemap,
  // wherever that page has a localized route in the market.
  const localizedEditorialRoutes = localizedIndexableMarketProfiles(INITIAL_EUROPEAN_MARKET_PROFILES)
    .flatMap((market) => coreRoutes
      .map((route) => route || "/")
      .filter((pathname) => isLocalizedPublicDestination(pathname, market))
      .map((pathname) => ({
        url: absoluteUrl(publicMarketPath(market, market.defaultLocale, pathname)),
        changeFrequency: "monthly" as const,
        priority: pathname === "/" ? 1 : pathname === "/learn" ? 0.8 : 0.7,
      })));
  // The Programme has its own language routes (`/de/program`) outside the public route manifest.
  // Every one it marks indexable, with hreflang, is listed too (lib/seo/programme-metadata.ts).
  const localizedProgrammeRoutes = PROGRAMME_ROUTES
    .filter((route) => localizedProductIndexingApproved(route.locale))
    .map((route) => ({
      url: absoluteUrl(route.path),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    ...coreRoutes.map((route) => {
      const pathname = route || "/";
      const canonicalPath = isLocalizedPublicDestination(pathname, DEFAULT_MARKET_PROFILE)
        ? publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, pathname)
        : pathname;
      return {
        url: absoluteUrl(canonicalPath),
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : 0.8,
      };
    }),
    ...[...baseProducts.routes, ...localizedProducts.flatMap((entry) => entry.routes)].map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...learningArticleRoutes,
    ...localizedEditorialRoutes,
    ...localizedProgrammeRoutes,
    ...baseProducts.casinoRoutes,
    ...localizedProducts.flatMap((entry) => entry.casinoRoutes),
  ];
}
