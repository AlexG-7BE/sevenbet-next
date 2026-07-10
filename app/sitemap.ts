import type { MetadataRoute } from "next";
import { getCasinos } from "@/lib/data";
import { absoluteUrl, coreRoutes } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const casinoRoutes = getCasinos().slice(0, 80).map((casino) => ({
    url: absoluteUrl(`/casino/${casino.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...coreRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...casinoRoutes,
  ];
}
