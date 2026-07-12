import type { MetadataRoute } from "next";
import { getCasinos } from "@/lib/data";
import {
  getArticlePath,
  getCategoryPath,
  learningArticles as centerArticles,
  learningCategories as centerCategories,
} from "@/lib/learning-center";
import { learningArticles } from "@/lib/responsible-gambling";
import { absoluteUrl, coreRoutes } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const casinoRoutes = getCasinos().slice(0, 80).map((casino) => ({
    url: absoluteUrl(`/casino/${casino.slug}`),
    lastModified: now,
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
