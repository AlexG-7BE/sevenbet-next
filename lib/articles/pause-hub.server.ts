import "server-only";

import type { PublicArticle } from "@/lib/articles/article-types";
import { PAUSE_HUB_CATEGORY, pauseHubSelection } from "@/lib/articles/pause-hub-selection";
import { articleService } from "@/lib/services/article.service";

/**
 * The guides the pause plan page lists (see pause-hub-selection.ts). It reads the editorial
 * article service alone, never the service registry with its commercial members, so the page
 * keeps importing nothing commercial. A failed read leaves the page standing without the list.
 */
export async function pauseHubGuides(locale: string, registerName: string): Promise<PublicArticle[]> {
  if (!registerName.trim()) return [];
  const published = await articleService.listPublished(locale, { category: PAUSE_HUB_CATEGORY, take: 100 }).catch(() => []);
  return pauseHubSelection(published, registerName);
}
