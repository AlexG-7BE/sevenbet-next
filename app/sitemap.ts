import type { MetadataRoute } from "next";
import {
  getArticlePath,
  learningArticles as centerArticles,
} from "@/lib/learning-center";
import { absoluteUrl, coreRoutes } from "@/lib/site";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { parsePublicOfferQuery } from "@/lib/public-offer/query";
import {
  DEFAULT_MARKET_PROFILE,
  INITIAL_EUROPEAN_MARKET_PROFILES,
  publicMarketPath,
  type MarketProfile,
} from "@/lib/market/registry";
import { localizedProductIndexingApproved } from "@/lib/market/product-context";
import { isLocalizedPublicDestination } from "@/lib/market/routing";

export const dynamic = "force-dynamic";

async function failClosed<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

export async function loadMarketSitemapSnapshot(market: MarketProfile) {
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
  const bonuses = await failClosed(() => publicOfferService.searchOffers(
    parsePublicOfferQuery({}, 1),
    null,
    { defaultEditorialCountry: market.countryCode },
  ));
  return {
    bestOffers,
    bonuses,
    casinos: discoveryResult?.casinos ?? [],
    discovery: discoveryResult?.discovery ?? null,
    market,
  };
}

export function indexableMarketProductPaths(snapshot: Awaited<ReturnType<typeof loadMarketSitemapSnapshot>>, localized: boolean) {
  const prefix = (pathname: string) => localized
    ? publicMarketPath(snapshot.market, snapshot.market.defaultLocale, pathname)
    : pathname;
  const publishedDirectory = Boolean(snapshot.discovery && snapshot.discovery.total > 0 && snapshot.discovery.inventoryMode === "PUBLISHED_ONLY");
  const routes = [
    ...(publishedDirectory ? [prefix("/casinos")] : []),
    ...(snapshot.bonuses && snapshot.bonuses.total > 0 && snapshot.bonuses.inventoryMode === "PUBLISHED_ONLY" ? [prefix("/bonuses")] : []),
    ...(snapshot.bestOffers && snapshot.bestOffers.status !== "unavailable" && snapshot.bestOffers.inventoryMode === "PUBLISHED_ONLY" ? [prefix("/best-offers")] : []),
  ];
  const casinoRoutes = snapshot.casinos
    .filter((casino) => casino.dataClassification === "PUBLISHED_RECORD")
    .slice(0, 500)
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseSnapshot = await failClosed(() => loadMarketSitemapSnapshot(DEFAULT_MARKET_PROFILE));
  const localizedSnapshots = await Promise.all(INITIAL_EUROPEAN_MARKET_PROFILES
    .filter((market) => localizedProductIndexingApproved(market.defaultLocale))
    .map((market) => failClosed(() => loadMarketSitemapSnapshot(market))));
  const baseProducts = baseSnapshot ? indexableMarketProductPaths(baseSnapshot, true) : { routes: [], casinoRoutes: [] };
  const localizedProducts = localizedSnapshots.flatMap((snapshot) => snapshot ? [indexableMarketProductPaths(snapshot, true)] : []);
  const learningArticleRoutes = centerArticles.map((article) => ({
    url: absoluteUrl(publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, getArticlePath(article))),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const completedLocalizedEditorialPaths = [
    "/methodology",
    "/contact",
    "/learn",
    ...centerArticles.map(getArticlePath),
  ];
  const localizedEditorialRoutes = INITIAL_EUROPEAN_MARKET_PROFILES
    .filter((market) => localizedProductIndexingApproved(market.defaultLocale))
    .flatMap((market) => completedLocalizedEditorialPaths.map((pathname) => ({
      url: absoluteUrl(publicMarketPath(market, market.defaultLocale, pathname)),
      changeFrequency: "monthly" as const,
      priority: pathname === "/learn" ? 0.8 : 0.7,
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
