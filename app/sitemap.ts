import type { MetadataRoute } from "next";
import {
  getArticlePath,
  getCategoryPath,
  learningArticles as centerArticles,
  learningCategories as centerCategories,
} from "@/lib/learning-center";
import { learningArticles } from "@/lib/responsible-gambling";
import { absoluteUrl, coreRoutes } from "@/lib/site";
import { publicCasinoService } from "@/lib/services/public-casino.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const casinoRoutes = (await publicCasinoService.listCasinos()).slice(0, 500).map((casino) => ({
    url: absoluteUrl(`/casino/${casino.slug}`),
    lastModified: casino.lastReviewedAt ?? casino.publishedAt ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const responsibleGamblingRoutes = learningArticles.map((article) => ({
    url: absoluteUrl(`/responsible-gambling/${article.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));
  const learningCategoryRoutes = centerCategories.map((category) => ({
    url: absoluteUrl(getCategoryPath(category.slug)),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.74,
  }));
  const learningArticleRoutes = centerArticles.map((article) => ({
    url: absoluteUrl(getArticlePath(article)),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...coreRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...learningCategoryRoutes,
    ...learningArticleRoutes,
    ...responsibleGamblingRoutes,
    ...casinoRoutes,
  ];
}
