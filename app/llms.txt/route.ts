import { indexableMarketProductPaths, indexableReviewCards, loadCrawlerBonusDirectory, loadMarketSitemapSnapshot } from "@/app/sitemap";
import { articleService } from "@/lib/services";
import { buildLlmsTxt, llmsLaunchMarkets, type LlmsMarketCatalogue } from "@/lib/seo/llms";
import { stripPublicMarketPrefix } from "@/lib/market/routing";

export const dynamic = "force-dynamic";

/**
 * llms.txt lists the same pages and reviews the sitemap lists for the launch markets, so
 * the two never disagree about what is published (see lib/seo/llms.ts for the wording).
 */
export async function GET() {
  const crawlerBonuses = await loadCrawlerBonusDirectory();
  const [markets, articles] = await Promise.all([
    Promise.all(llmsLaunchMarkets().map(async (market): Promise<LlmsMarketCatalogue> => {
      const snapshot = await loadMarketSitemapSnapshot(market, crawlerBonuses).catch(() => null);
      if (!snapshot) return { market, productPages: [], reviews: [] };
      return {
        market,
        productPages: indexableMarketProductPaths(snapshot, true).routes.map((route) => stripPublicMarketPrefix(route)),
        reviews: indexableReviewCards(snapshot.casinos).map((casino) => ({ name: casino.name, slug: casino.slug, score: casino.rating })),
      };
    })),
    articleService.listPublished("en-GB", { take: 100 }).catch(() => []),
  ]);

  return new Response(buildLlmsTxt({ markets, articles }), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
