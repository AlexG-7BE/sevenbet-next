import "server-only";

import { recoveryLinkSlug } from "@/lib/commercial-handoff/recovery";
import { productHref } from "@/lib/market/product-context";
import type { resolveServerPresentationContext } from "@/lib/market/server";
import { affiliateRedirectRepository } from "@/lib/repositories/affiliate-redirect.repository";
import { publicCasinoService } from "@/lib/services/public-casino.service";

type ServerPresentation = Awaited<ReturnType<typeof resolveServerPresentationContext>>;

export type OutboundRecoveryCasino = Readonly<{ name: string; reviewHref: string }>;

/**
 * Resolves the casino behind a refused managed click so the visitor can return to its review.
 * Only a published CMS profile qualifies; any failure simply drops the casino-specific action.
 */
export async function outboundRecoveryCasino(link: unknown, presentation: ServerPresentation): Promise<OutboundRecoveryCasino | null> {
  const slug = recoveryLinkSlug(link);
  if (!slug) return null;
  try {
    const redirect = await affiliateRedirectRepository.findBySlug(slug);
    if (!redirect?.casino.slug) return null;
    const casino = await publicCasinoService.getCasino(
      redirect.casino.slug,
      null,
      presentation.marketCountryCode,
      presentation.language,
      presentation.marketCode,
    );
    if (!casino || casino.source !== "cms") return null;
    return { name: casino.name, reviewHref: productHref(presentation, `/casino/${casino.slug}`) };
  } catch {
    return null;
  }
}
