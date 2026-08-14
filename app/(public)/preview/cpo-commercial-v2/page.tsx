import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/components/commercial-decision/CommercialDecisionLayer.module.css";
import { CPO_COMMERCIAL_PREVIEW_BRANCH, isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";
import { publicOfferService } from "@/lib/services/public-offer.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CPO Commercial V2 Review Hub | B4GAMBLE", robots: { index: false, follow: false } };

export default async function CpoReviewHubPage() {
  if (!isCpoCommercialPreviewEnabled()) notFound();
  const shortlist = await publicOfferService.getBestOffersPageData({ country: "GB", limit: 3 }, null);
  const casinoSlug = shortlist.records[0]?.casino.slug;
  const previewSha = process.env.VERCEL_GIT_COMMIT_SHA || "Local working tree";
  const links = [
    ["Home", "/", "Programme-first acquisition remains unchanged."],
    ["Mission 08", "/program", "Complete Mission 08 to inspect the optional handoff."],
    ["Mission 10", "/program", "Complete Mission 10 to inspect the final optional handoff."],
    ["Best Casinos", "/best-casinos", "Primary Top 3 decision surface."],
    ["Bonuses", "/bonuses", "Top Offers before Browse All Offers."],
    ["All Casinos", "/casinos", "Secondary directory and filters."],
    ["Compare", casinoSlug ? `/compare?casino=${casinoSlug}&country=GB` : "/compare", "Secondary evidence tool."],
    ["Casino Review", casinoSlug ? `/casino/${casinoSlug}` : "/casinos", "BOFU evidence surface."],
    ["Learn", "/learn", "Five subject groups and intent handoffs."],
    ["Learning Article", "/learn/casino-basics/online-casino-basics", "Casino-choice article handoff."],
    ["Bonus Guide", "/bonus-guide", "Ends at Top Offers."],
    ["About", "/about", "Recommendation-first operating philosophy."],
    ["Methodology", "/methodology", "Protected trust evidence."],
    ["Affiliate Disclosure", "/affiliate-disclosure", "Commercial relationship disclosure."],
    ["Responsible Gambling", "/responsible-gambling", "Non-commercial control hub."],
    ["Self-Check", "/self-check", "Non-commercial protected tool."],
    ["Personal Limit Tracker", "/tools/budget-calculator", "Non-commercial protected tool."],
    ["Help", "/help", "Protected support route."],
  ] as const;

  return <div className={styles.reviewHub}><section className={styles.hubHero}><div className={styles.shell}>
    <p className={styles.terminalBadge}>PREVIEW ONLY · NOT FOUNDER-APPROVED FOR PRODUCTION</p>
    <h1>CPO commercial<br />decision layer <em>v2.</em></h1>
    <div><span>Baseline <b>0c956d0</b></span><span>Preview <b>{previewSha.slice(0, 12)}</b></span><span>Branch <b>{CPO_COMMERCIAL_PREVIEW_BRANCH}</b></span></div>
  </div></section>
  <section className={styles.hubRoutes}><div className={styles.shell}>
    <header><p className={styles.eyebrow}>REVIEW MATRIX</p><h2>Every decision and protected surface.</h2><p>Start with Best Casinos, then inspect the supporting evidence routes. Programme missions require an authenticated eligible test account; no state is forged by this hub.</p></header>
    <nav aria-label="CPO Preview review routes">{links.map(([label, href, description], index) => <Link href={href} key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><small>{description}</small><b aria-hidden="true">→</b></Link>)}</nav>
  </div></section>
  <section className={styles.hubBoundary}><div className={styles.shell}><strong>NO PRODUCTION DEPLOYMENT</strong><p>All simulated Visit actions stop on an internal Preview terminal. `/r/[slug]`, jurisdiction decisions, affiliate routing, Production data and protected Help behaviour are unchanged.</p></div></section>
  </div>;
}
