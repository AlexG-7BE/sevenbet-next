import type { MetadataRoute } from "next";
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
  marketIndexingApproved,
  marketProfileByLocale,
  publicMarketPath,
  type MarketProfile,
} from "@/lib/market/registry";
import { isLocalizedPublicDestination } from "@/lib/market/routing";
import { bonusDirectoryIndexable } from "@/lib/seo/product-indexing";

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

/** Published, indexable reviews: the ones the sitemap and llms.txt list. */
export function indexableReviewCards<T extends Pick<PublicCasinoCardDto, "dataClassification" | "indexable">>(casinos: readonly T[]) {
  return casinos
    .filter((casino) => casino.dataClassification === "PUBLISHED_RECORD" && casino.indexable !== false)
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
  const casinoRoutes = indexableReviewCards(snapshot.casinos)
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

export function localizedIndexableMarketProfiles(markets: readonly MarketProfile[]) {
  return markets.filter((market) => market.countryCode !== DEFAULT_MARKET_PROFILE.countryCode && marketIndexingApproved(market));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articleService } = await import("@/lib/services/article.service");
  const crawlerBonuses = await loadCrawlerBonusDirectory();
  const baseSnapshot = await failClosed(() => loadMarketSitemapSnapshot(DEFAULT_MARKET_PROFILE, crawlerBonuses));
  const localizedSnapshots = await Promise.all(localizedIndexableMarketProfiles(INITIAL_EUROPEAN_MARKET_PROFILES)
    .map((market) => failClosed(() => loadMarketSitemapSnapshot(market, crawlerBonuses))));
  const baseProducts = baseSnapshot ? indexableMarketProductPaths(baseSnapshot, true) : { routes: [], casinoRoutes: [] };
  const localizedProducts = localizedSnapshots.flatMap((snapshot) => snapshot ? [indexableMarketProductPaths(snapshot, true)] : []);
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
    ...baseProducts.casinoRoutes,
    ...localizedProducts.flatMap((entry) => entry.casinoRoutes),
  ];
}
