import { unstable_cache } from "next/cache";

import { navigationStage2EditorialCacheBypassEnabled } from "@/lib/market/navigation-stage2-test-safety";

/**
 * Shared cache policy for public, published editorial projections.
 *
 * Request identity, trusted GEO authority, session state, Programme data and
 * governed commercial actions are deliberately outside these tags.
 */
export const PUBLIC_CASINO_EDITORIAL_CACHE_TAG = "public-casino-editorial-v1";
export const PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG = "public-article-editorial-v1";

// On-demand publication invalidation is authoritative. The short fallback
// bounds staleness for controlled writers that run outside the web process.
export const PUBLIC_EDITORIAL_CACHE_REVALIDATE_SECONDS = 60;

type AsyncCallback = Parameters<typeof unstable_cache>[0];

/** Next's persistent cache is unavailable in direct Node service tests. */
export function publicEditorialCache<T extends AsyncCallback>(callback: T, keyParts: string[], tags: string[]): T {
  const inFlight = new Map<string, Promise<unknown>>();
  const fill = async (...args: Parameters<T>) => {
    const invocationKey = JSON.stringify(args);
    const existing = inFlight.get(invocationKey);
    if (existing) return existing;
    const pending = Promise.resolve(callback(...args));
    inFlight.set(invocationKey, pending);
    try {
      return await pending;
    } finally {
      if (inFlight.get(invocationKey) === pending) inFlight.delete(invocationKey);
    }
  };
  const cached = unstable_cache(fill, keyParts, {
    tags,
    revalidate: PUBLIC_EDITORIAL_CACHE_REVALIDATE_SECONDS,
  });
  return (async (...args: Parameters<T>) => {
    // The streamed-shell lock suite must reach its intentionally held local
    // PostgreSQL seam even when an earlier test populated Next's data cache.
    if (navigationStage2EditorialCacheBypassEnabled()) return callback(...args);
    try {
      return await cached(...args);
    } catch (error) {
      if (error instanceof Error && error.message.includes("incrementalCache missing in unstable_cache")) {
        return fill(...args);
      }
      throw error;
    }
  }) as T;
}
