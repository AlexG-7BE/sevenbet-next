import Link from "next/link";

import styles from "./AboutPage.module.css";

const parts = [
  ["I", "The Programme", "A free, private 10-step plan for staying in control. No paywall, no upsell, and nothing you say inside it ever touches the commercial side."],
  ["II", "Research & education", "Reviews built on real-money tests and guides that explain the fine print. Everything dated, everything correctable, nothing sponsored."],
  ["III", "Commercial discovery", "Best Offers, Casinos and Bonuses — openly commercial pages for people who've decided to play, ranked by evidence, funded by disclosed commission."],
] as const;

export function AboutDocument() {
  return <article className={styles.page} data-about-document>
    <header className={styles.hero} data-about-section="hero">
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>About B4GAMBLE</p>
        <h1>Built to be<br /><em>on your side.</em></h1>
        <p>An industry built on odds deserves one place where the player comes first. We test casinos with our own money, explain every term, and help you stay in control — three jobs, honestly separated.</p>
      </div>
    </header>

    <section className={styles.parts} data-about-section="three-parts">
      <div className={styles.shell}>
        <h2>One product. Three parts.</h2>
        <div className={styles.partGrid}>{parts.map(([number, title, body]) => <article key={number}>
          <span>{number}</span><h3>{title}</h3><p>{body}</p>
        </article>)}</div>
        <p className={styles.partsNote}>There&apos;s no forced path between them. Come for a review and leave; come for the Programme and never see an offer; or use all three. High-intent players go straight to the commercial pages — that&apos;s by design, not a leak.</p>
      </div>
    </section>

    <section className={styles.separation} data-about-section="commercial-separation">
      <div className={styles.separationGrid}>
        <div><p className={styles.eyebrow}>How we make money</p><p>When you sign up at a casino through our commercial links, we may earn a commission. That&apos;s the whole model — no paid placements, no sponsored scores, no selling data.</p><Link href="/affiliate-disclosure">Full affiliate disclosure →</Link></div>
        <div><p className={styles.eyebrow}>What stays separate</p><ul><li>Scores are set before commercial terms are discussed.</li><li>Programme and Help data never feeds offers or rankings.</li><li>Protected Help contains no commercial content at all.</li></ul></div>
      </div>
    </section>

    <section className={styles.lines} data-about-section="clear-lines">
      <div><p className={styles.eyebrow}>What B4GAMBLE is not</p><h2>Clear lines, kept.</h2></div>
      <ul><li>Not a casino. We never take bets or hold your money.</li><li>Not a therapy service. The Programme builds habits; it doesn&apos;t diagnose or treat.</li><li>Not neutral about honesty. Casinos that fail our tests don&apos;t get ranked, whatever they&apos;d pay.</li></ul>
    </section>
  </article>;
}
