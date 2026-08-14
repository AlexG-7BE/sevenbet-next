import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/components/commercial-decision/CommercialDecisionLayer.module.css";
import { cpoPreviewSourceRoutes, isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicOfferService } from "@/lib/services/public-offer.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Outbound Intent — Preview Only | B4GAMBLE", robots: { index: false, follow: false } };

const placements = ["shortlist", "top_offers", "all_results", "review"] as const;

export default async function PreviewOutboundPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isCpoCommercialPreviewEnabled()) notFound();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const source = typeof query.source === "string" && cpoPreviewSourceRoutes.includes(query.source as (typeof cpoPreviewSourceRoutes)[number]) ? query.source : null;
  const placement = typeof query.placement === "string" && placements.includes(query.placement as (typeof placements)[number]) ? query.placement : null;
  const rank = typeof query.rank === "string" && /^[1-5]$/.test(query.rank) ? Number(query.rank) : null;
  if (!isSafePublicSlug(slug) || !source || !placement) notFound();

  const result = await publicOfferService.getBestOffersPageData({ country: "GB", limit: 12 }, null);
  const operator = result.records.find((offer) => offer.casino.slug === slug)?.casino.name ?? null;
  const returnHref = source === "best_casinos" ? "/best-casinos" : source === "bonuses" ? "/bonuses" : source === "casino_review" ? `/casino/${slug}` : source === "casinos" ? "/casinos" : "/preview/cpo-commercial-v2";

  return <div className={styles.terminalPage}><section className={styles.terminalPanel}>
    <p className={styles.terminalBadge}>PREVIEW ONLY</p>
    <h1>No external visit occurred.</h1>
    <p>This terminal proves the one-click Preview interaction without resolving or exposing an affiliate destination. It does not imply a partner, commercial relationship, current offer, local availability or operator approval.</p>
    <dl>
      <div><dt>Operator</dt><dd>{operator || "Unresolved public record"}</dd></div>
      <div><dt>Public slug</dt><dd>{slug}</dd></div>
      <div><dt>Source route</dt><dd>{source.replaceAll("_", " ")}</dd></div>
      <div><dt>Placement</dt><dd>{placement.replaceAll("_", " ")}</dd></div>
      {rank ? <div><dt>Recommendation position</dt><dd>{rank}</dd></div> : null}
    </dl>
    <div className={styles.terminalActions}><Link href={returnHref}>Return to decision</Link><Link href="/preview/cpo-commercial-v2">Open review hub</Link></div>
  </section></div>;
}
