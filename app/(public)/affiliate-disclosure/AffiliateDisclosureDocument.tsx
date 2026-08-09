import Link from "next/link";

import styles from "./AffiliateDisclosurePage.module.css";

const sections = [
  {
    number: "01",
    id: "commercial-relationship",
    indexLabel: "Commercial relationship",
    title: "THE COMMERCIAL RELATIONSHIP",
    body: (
      <>
        Future eligible governed links on B4GAMBLE may be affiliate links. If a reader follows one and
        completes a qualifying action, B4GAMBLE may receive a commission from the operator. Not every operator
        listed or reviewed has to be an affiliate partner, and readers should still review the
        operator&apos;s current terms, fees, and conditions.
      </>
    ),
  },
  {
    number: "02",
    id: "editorial-boundary",
    indexLabel: "Editorial boundary",
    title: "COMPENSATION DOES NOT SET THE SCORE.",
    body: (
      <>
        Affiliate compensation does not determine B4GAMBLE&apos;s Editor Score or natural editorial
        ranking. Commercial relationships do not remove negative findings, hide material
        limitations, or replace the criteria described in the published methodology. Any future
        sponsored or paid placement must be identified separately.
      </>
    ),
  },
  {
    number: "03",
    id: "reader-verification",
    indexLabel: "Reader verification",
    title: "WHAT READERS CAN VERIFY",
    body: (
      <>
        Check the disclosure around a commercial link, read the ranking methodology, confirm the
        operator&apos;s current licensing and availability context, and review the full operator terms
        before registering or depositing.
      </>
    ),
  },
  {
    number: "04",
    id: "corrections",
    indexLabel: "Corrections",
    title: "CORRECTIONS",
    body: (
      <>
        B4GAMBLE reviews material errors against relevant sources and corrects them when appropriate.
        A commercial relationship does not suppress a correction, warning, or material limitation.
      </>
    ),
  },
] as const;

function DocumentSection({ section }: { section: (typeof sections)[number] }) {
  return (
    <section className={styles.documentSection} id={section.id} aria-labelledby={`${section.id}-title`}>
      <p className={styles.sectionNumber}>{section.number}</p>
      <h2 id={`${section.id}-title`}>{section.title}</h2>
      <p className={styles.sectionBody}>{section.body}</p>
    </section>
  );
}

export function AffiliateDisclosureDocument() {
  return (
    <article className={styles.page} data-affiliate-disclosure-document>
      <header className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Affiliate disclosure</p>
          <h1>HOW B4GAMBLE<br />IS FUNDED.</h1>
          <div className={styles.highlight} aria-hidden="true" />
          <p className={styles.heroLead}>
            Some future governed links may generate affiliate commissions. Affiliate compensation
            does not determine B4GAMBLE&apos;s Editor Score or natural editorial ranking.
          </p>
          <Link className={styles.primaryAction} href="/methodology">Read methodology</Link>
        </div>
      </header>

      <div className={`${styles.shell} ${styles.documentGrid}`}>
        <nav className={styles.toc} aria-label="On this page">
          <p>On this page</p>
          <ol>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}><span>{section.number}</span>{section.indexLabel}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.documentColumn}>
          <DocumentSection section={sections[0]} />
          <DocumentSection section={sections[1]} />

          <aside className={styles.principlePanel} aria-labelledby="affiliate-principle-title">
            <p>Control &amp; transparency</p>
            <h2 id="affiliate-principle-title">A paid link is not proof.</h2>
            <p>
              Affiliate status is not a substitute for evidence. Missing information should stay
              visible as uncertainty rather than being replaced with promotional claims.
            </p>
          </aside>

          <DocumentSection section={sections[2]} />
          <DocumentSection section={sections[3]} />

          <p className={styles.documentNote}>
            FRONTEND DISCLOSURE · SUBSTANTIVE WORDING REMAINS SUBJECT TO PRODUCT AND COMPLIANCE REVIEW.
          </p>
        </div>
      </div>
    </article>
  );
}
