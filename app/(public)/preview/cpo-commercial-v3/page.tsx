import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/components/commercial-decision/CommercialVariantHub.module.css";
import { CPO_COMMERCIAL_PREVIEW_BRANCH, isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Founder A/B Visual Comparison | B4GAMBLE",
  description: "A Preview-only comparison of the B4GAMBLE Best Casinos Golden visual variants.",
  robots: { index: false, follow: false },
};

const comparisons = [
  ["Atmosphere", "Night, paper, acid and teal", "Forest, ivory and restrained burgundy"],
  ["Recommendation stage", "Editorial overlay theatre", "Sharp split product stage"],
  ["Key facts", "Compact evidence ledger", "Larger decision-first fact typography"],
  ["Accent behaviour", "Bright B4GAMBLE lift", "Card-contained, low-frequency emphasis"],
  ["Footer", "Current public-shell composition", "Larger type and compact Help cell"],
] as const;

export default function CpoCommercialV3Page() {
  if (!isCpoCommercialPreviewEnabled()) notFound();
  const previewSha = process.env.VERCEL_GIT_COMMIT_SHA || "Local working tree";

  return <div className={styles.hub} data-founder-comparison="best-casinos-a-b">
    <section className={styles.hero}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>PREVIEW ONLY · FOUNDER COMPARISON</p>
        <h1>One decision layer.<em>Two visual directions.</em></h1>
        <div className={styles.heroMeta}><span>Preview <b>{previewSha.slice(0, 12)}</b></span><span>Branch <b>{CPO_COMMERCIAL_PREVIEW_BRANCH}</b></span><span>Status <b>A/B review pending</b></span></div>
      </div>
    </section>

    <section className={styles.variants} aria-labelledby="variants-title">
      <div className={styles.shell}>
        <header className={styles.variantsHeader}><p>OPEN EACH FULL PAGE</p><h2 id="variants-title">Compare the recommendation experience, not the product logic.</h2></header>
        <div className={styles.variantGrid}>
          <article className={`${styles.variant} ${styles.variantA}`}>
            <div className={styles.variantTop}><span>VARIANT A · CURRENT GOLDEN</span><b>A</b></div>
            <h3>Editorial Decision Theatre</h3>
            <p>High-contrast B4GAMBLE night/paper chapters, acid lift and image-led asymmetry.</p>
            <Link href="/best-casinos">Open Variant A <span aria-hidden="true">→</span></Link>
          </article>
          <article className={`${styles.variant} ${styles.variantB}`}>
            <div className={styles.variantTop}><span>VARIANT B · ROULETTE PALETTE</span><b>B</b></div>
            <h3>Card-Dominant Roulette Mood</h3>
            <p>Deeper green atmosphere, restrained burgundy, larger facts and a redesigned shell treatment.</p>
            <Link href="/best-casinos-roulette">Open Variant B <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </div>
    </section>

    <section className={styles.compare} aria-labelledby="compare-title">
      <div className={styles.shell}>
        <h2 id="compare-title">What deliberately changes.</h2>
        <ol className={styles.compareList}>{comparisons.map(([label, a, b]) => <li key={label}><strong>{label}</strong><span>A · {a}</span><span>B · {b}</span></li>)}</ol>
      </div>
    </section>

    <section className={styles.boundary}><div className={styles.shell}><strong>PRODUCT LOGIC UNCHANGED</strong><p>Both routes use the same Top 3, order, facts, limitations, Visit/Review/Compare actions, internal Preview terminal and protected-data boundary. This hub provides no merge or Production authority.</p></div></section>
  </div>;
}
