import Link from "next/link";

import type { AboutMessages } from "@/lib/i18n/static-pages/about";
import styles from "./AboutPage.module.css";

export function AboutDocument({ messages }: { messages: AboutMessages }) {
  const parts = messages.parts.map((part, index) => [(["I", "II", "III"] as const)[index], part.title, part.body] as const);
  return <article className={styles.page} data-about-document>
    <header className={styles.hero} data-about-section="hero">
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>{messages.eyebrow}</p>
        <h1>{messages.titleLead}<br /><em>{messages.titleEmphasis}</em></h1>
        <p>{messages.introduction}</p>
      </div>
    </header>

    <section className={styles.parts} data-about-section="three-parts">
      <div className={styles.shell}>
        <h2>{messages.partsTitle}</h2>
        <div className={styles.partGrid}>{parts.map(([number, title, body]) => <article key={number}>
          <span>{number}</span><h3>{title}</h3><p>{body}</p>
        </article>)}</div>
        <p className={styles.partsNote}>{messages.partsNote}</p>
      </div>
    </section>

    <section className={styles.separation} data-about-section="commercial-separation">
      <div className={styles.separationGrid}>
        <div><p className={styles.eyebrow}>{messages.fundingTitle}</p><p>{messages.fundingBody}</p><Link href="/affiliate-disclosure">{messages.disclosureLink}</Link></div>
        <div><p className={styles.eyebrow}>{messages.separationTitle}</p><ul>{messages.separationPoints.map((point) => <li key={point}>{point}</li>)}</ul></div>
      </div>
    </section>

    <section className={styles.lines} data-about-section="clear-lines">
      <div><p className={styles.eyebrow}>{messages.boundariesLabel}</p><h2>{messages.boundariesTitle}</h2></div>
      <ul>{messages.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
    </section>
  </article>;
}
