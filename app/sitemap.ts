import type { MetadataRoute } from "next";
import {
  getArticlePath,
  getCategoryPath,
  learningArticles as centerArticles,
  learningCategories as centerCategories,
} from "@/lib/learning-center";
import { learningArticles } from "@/lib/responsible-gambling";
import { parsePublicComparisonQuery } from "@/lib/public-comparison/query";
import { absoluteUrl, coreRoutes } from "@/lib/site";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { publicComparisonService } from "@/lib/services/public-comparison.service";
import { publicOfferService } from "@/lib/services/public-offer.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [discovery, bestOffers, comparison] = await Promise.all([
    publicCasinoDiscoveryService.discover({ page: 1, pageSize: 48 }),
    publicOfferService.getBestOffersPageData({ country: "GB", limit: 12 }, null),
    publicComparisonService.compare(parsePublicComparisonQuery(new URLSearchParams()), null),
  ]);
  const casinos = [...discovery.items];
  for (let page = 2; page <= Math.min(discovery.pageCount, 11) && casinos.length < 500; page += 1) {
    const result = await publicCasinoDiscoveryService.discover({ page, pageSize: 48 });
    casinos.push(...result.items);
  }
  const publishedOnly = discovery.total > 0 && discovery.inventoryMode === "PUBLISHED_ONLY";
  const indexableProductRoutes = [
    ...(bestOffers.status !== "unavailable" && bestOffers.inventoryMode === "PUBLISHED_ONLY" ? ["/best-offers"] : []),
    ...(comparison.status === "available" && comparison.inventoryMode === "PUBLISHED_ONLY" ? ["/compare"] : []),
  ];
  const casinoRoutes = casinos.filter((casino) => casino.dataClassification === "PUBLISHED_RECORD").slice(0, 500).map((casino) => ({
    url: absoluteUrl(`/casino/${casino.slug}`),
    ...(casino.editorialUpdatedAt || casino.publishedAt
      ? { lastModified: casino.editorialUpdatedAt ?? casino.publishedAt ?? undefined }
      : {}),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const responsibleGamblingRoutes = learningArticles.map((article) => ({
    url: absoluteUrl(`/responsible-gambling/${article.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));
  const learningCategoryRoutes = centerCategories.map((category) => ({
    url: absoluteUrl(getCategoryPath(category.slug)),
    changeFrequency: "weekly" as const,
    priority: 0.74,
  }));
  const learningArticleRoutes = centerArticles.map((article) => ({
    url: absoluteUrl(getArticlePath(article)),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...coreRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...(publishedOnly ? ["/casinos", "/bonuses"].map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) : []),
    ...indexableProductRoutes.map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...learningCategoryRoutes,
    ...learningArticleRoutes,
    ...responsibleGamblingRoutes,
    ...casinoRoutes,
  ];
}
