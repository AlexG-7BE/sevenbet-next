import Link from "next/link";
import styles from "./AffiliateDisclosurePage.module.css";

export function AffiliateDisclosureDocument(){return <article className={styles.page} data-affiliate-disclosure-document>
  <header className={styles.hero} data-affiliate-section="hero"><div><p className={styles.eyebrow}>Affiliate Disclosure</p><h1>How we&apos;re <em>funded.</em></h1><span>Commission may fund us. It never sets a score. Here is exactly where the line runs.</span></div></header>
  <main className={styles.document}>
    <section><h2>1. How B4GAMBLE is funded</h2><p>When you follow an eligible commercial link on this site — View Offer, Visit Casino, Claim Offer — and subsequently register or deposit at the operator, we may receive a commission from that operator. The current product architecture does not provide paid ranking positions, sponsored scores, advertising slots or user-data sales.</p><p>The Programme, protected Help, Learn and trust pages do not expose operator outbound actions.</p></section>
    <section><h2>2. What commission can influence</h2><p>Whether an eligible operator has an active outbound route. If no commercial agreement or governed link exists, the page shows &quot;Review only&quot; or &quot;Offer unavailable&quot; instead of a working button.</p></section>
    <section><h2>3. What commission cannot influence</h2><p>Affiliate compensation does not determine Editor Score or natural editorial ranking. That boundary covers review text, use-case shortlists and the Best Offers selection; commercial availability is evaluated through separate publication, jurisdiction and affiliate gates.</p><p>Programme and Help data is never used to target offers or personalise rankings, in either direction.</p></section>
    <section><h2>4. How commercial links are identified</h2><p>When an eligible commercial action is available, it passes through an outbound confirmation that states you are leaving B4GAMBLE and repeats this disclosure. Buttons labelled View Offer, Visit Casino or Claim Offer identify commercial actions; Read Review, guide and methodology links remain editorial. Unavailable or incomplete commercial routes fail closed.</p></section>
    <section><h2>5. Corrections and further reading</h2><p>How we evaluate and score is documented in the <Link href="/methodology">Methodology</Link>. Verified corrections are reviewed, dated and noted in the affected text when published. If you believe a commercial relationship has influenced our editorial output, <Link href="/contact">tell us</Link>.</p></section>
    <footer className={styles.effective}><span>Effective 12 August 2026</span><span>18+ · BeGambleAware.org</span></footer>
  </main>
</article>}
