import Link from "next/link";
import styles from "./MethodologyPage.module.css";

export const methodologyFaqItems = [
  ["Does commission affect scores?","No. Scores and reviews are completed before commercial terms are discussed."],
  ["Are test results guarantees?","No. They are dated observations from particular methods and jurisdictions."],
] as const;

export function MethodologyDocument(){return <article className={styles.page} data-methodology-document>
  <header className={styles.hero}><div><p className={styles.eyebrow}>Methodology</p><h1>Evidence before <em>opinion.</em></h1><span>Every published score should show the evidence available, the date reviewed and the limits of what can be concluded.</span></div></header>
  <section className={styles.band}><div className={styles.split}>
    <article><p>01 · How we evaluate casinos</p><h2>One framework. Evidence stays visible.</h2><p>Published records are assessed under the same editorial framework. The available source status, material terms, dates, missing fields and limitations remain part of the review instead of being filled with assumptions.</p><p>A review can describe only the evidence actually attached to its published record. Incomplete commercial or jurisdiction evidence fails closed and does not become an inferred recommendation or visit route.</p></article>
    <article><ul><li>Evidence-bound published records</li><li>Material terms shown before action</li><li>Sources, dates and limitations visible</li><li>Missing evidence fails closed</li></ul></article>
  </div></section>
  <section className={styles.band}><div className={styles.split}>
    <article><p>02 · What affects the score</p><h2>Judgement, constrained by evidence.</h2><p>The Editor Score is editorial judgement grounded in the published evidence record — not the output of a fixed arithmetic formula, and no percentage weighting should be inferred from it. Payout evidence and honesty of material terms carry the greatest editorial influence.</p><p>Serious unresolved evidence can prevent a recommendation. A high score never proves current availability, licensing in a reader&apos;s location, or that an individual outcome will match a dated observation.</p></article>
    <div className={styles.scoreList}><div><strong>Payout speed &amp; reliability</strong><span>weighs heaviest</span></div><div><strong>Honesty of bonus terms</strong><span>heavy</span></div><div><strong>Game library &amp; live floor</strong><span>moderate</span></div><div><strong>Support quality</strong><span>moderate</span></div><div><strong>Verification friction</strong><span>moderate</span></div><div><strong>Commission we might earn</strong><span>never a factor</span></div></div>
  </div></section>
  <section className={styles.band}><div className={styles.cards}>
    <article><p>03 · How Best Offers are selected</p><p>Best Offers uses eligible published records and the disclosed editorial ranking inputs. Material terms, source status and commercial availability remain visible; incomplete records are not promoted merely to fill the page.</p><p>Alternatives should answer materially different needs rather than pad the shortlist. Fictional demonstration records remain labelled, non-claimable and separate from published commercial inventory.</p></article>
    <article><p>04 · Editorial vs commercial</p><p>Affiliate compensation does not determine Editor Score or natural editorial ranking. A commercial action is exposed only when the separate jurisdiction, publication and affiliate gates authorize it.</p><p>Programme and protected Help activity is excluded from offer targeting, ranking and advertising personalisation by the product&apos;s data boundary.</p></article>
  </div></section>
  <section className={styles.band}><div className={styles.split}>
    <article><p>05 · Sources, freshness, corrections</p><p>A review is only as useful as its evidence date. Published pages show the review date or available source status, and material changes should be re-checked before the affected claim is presented as current.</p><ul><li>Review date or source status remains visible with the record.</li><li>Verified material changes require the affected content to be reviewed.</li><li>Spotted a possible error? <Link href="/contact">Tell us</Link>.</li><li>Record retention follows the governed Privacy schedule rather than a public fixed-duration promise.</li></ul></article>
    <article><p>06 · Limitations — read this part</p><p>An honest methodology admits what it can&apos;t do. Our findings are observations of operator behaviour at particular moments, from particular jurisdictions, with particular payment instruments and amounts — snapshots, not guarantees.</p><ul><li>An operator can change behaviour after we publish; your outcome may differ from ours.</li><li>Payout times vary by method, jurisdiction, amount and account history.</li><li>RTP spot checks compare published sheets; we cannot verify RTP empirically through play.</li><li>We can&apos;t test every casino in every country. Absence of a review is not a verdict, and presence of one is not a claim of availability in your jurisdiction.</li></ul></article>
  </div></section>
</article>}
