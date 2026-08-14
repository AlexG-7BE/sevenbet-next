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
  ["Atmosphere", "Acid editorial direction", "Deep forest and ivory with brighter local contrast"],
  ["Recommendation stage", "Editorial overlay theatre", "Sharp split product stage with governed identity media"],
  ["Key facts", "Compact evidence ledger", "Larger decision-first fact typography"],
  ["Accent behaviour", "Bright B4GAMBLE acid lift", "Restrained burgundy for decisive actions"],
  ["Shell", "Current public-shell sizing", "Larger B layout/type with A colours"],
] as const;

export default function CpoCommercialV3Page() {
  if (!isCpoCommercialPreviewEnabled()) notFound();
  const previewSha = process.env.VERCEL_GIT_COMMIT_SHA || "Local working tree";

  return <div className={styles.hub} data-founder-comparison="best-casinos-a-b">
    <section className={styles.hero}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>PREVIEW ONLY · FOUNDER COMPARISON</p>
        <h1>One decision layer.<em>Final A/B comparison.</em></h1>
        <div className={styles.heroMeta}><span>Preview <b>{previewSha.slice(0, 12)}</b></span><span>Branch <b>{CPO_COMMERCIAL_PREVIEW_BRANCH}</b></span><span>Status <b>A/B review pending</b></span></div>
      </div>
    </section>

    <section className={styles.variants} aria-labelledby="variants-title">
      <div className={styles.shell}>
        <header className={styles.variantsHeader}><p>OPEN EACH FULL PAGE</p><h2 id="variants-title">Compare the recommendation experience, not the product logic.</h2></header>
        <div className={styles.variantGrid}>
          <article className={`${styles.variant} ${styles.variantA}`}>
            <div className={styles.variantTop}><span>VARIANT A</span><b>A</b></div>
            <h3>Acid editorial direction</h3>
            <p>High-contrast B4GAMBLE night/paper chapters, acid lift and image-led asymmetry.</p>
            <Link href="/best-casinos">Open Variant A <span aria-hidden="true">→</span></Link>
          </article>
          <article className={`${styles.variant} ${styles.variantB}`}>
            <div className={styles.variantTop}><span>VARIANT B — REFINED</span><b>B</b></div>
            <h3>Casino-inspired deep palette + brighter execution</h3>
            <p>Forest and ivory retain the roulette-palette identity while brighter surfaces, governed operator media and stronger chapter separation add energy.</p>
            <Link href="/best-casinos-roulette">Open Refined Variant B <span aria-hidden="true">→</span></Link>
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
