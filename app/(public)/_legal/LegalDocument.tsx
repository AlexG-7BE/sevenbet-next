import type { ReactNode } from "react";

import styles from "./LegalDocument.module.css";

export type LegalSection = {
  id: string;
  label: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  kind: "privacy" | "terms";
  family: string;
  desktopNode: string;
  mobileNode: string;
  eyebrow: string;
  desktopTitle: ReactNode;
  mobileTitle: string;
  lead: string;
  effective: string;
  updated?: string;
  sections: readonly LegalSection[];
  boundary?: ReactNode;
};

export function LegalDocument({
  kind,
  family,
  desktopNode,
  mobileNode,
  eyebrow,
  desktopTitle,
  mobileTitle,
  lead,
  effective,
  updated,
  sections,
  boundary,
}: LegalDocumentProps) {
  return (
    <article
      className={styles.page}
      data-legal-document={kind}
      data-figma-family={family}
      data-figma-desktop={desktopNode}
      data-figma-mobile={mobileNode}
    >
      <header className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>
            <span className={styles.desktopTitle}>{desktopTitle}</span>
            <span className={styles.mobileTitle}>{mobileTitle}</span>
          </h1>
          <p className={styles.lead}>{lead}</p>
          <p className={styles.effective}>
            EFFECTIVE {effective.toUpperCase()}
            {updated ? <> · LAST UPDATED {updated.toUpperCase()}</> : null}
          </p>
          <details className={styles.mobileToc}>
            <summary>Jump to a section ↓</summary>
            <nav aria-label="On this page">
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>
        </div>
      </header>

      <div className={`${styles.shell} ${styles.documentGrid}`} id="legal-sections">
        <nav className={styles.toc} aria-label="On this page">
          <p>On this page</p>
          <ol>
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.documentColumn}>
          {sections.map((section, index) => (
            <section
              className={styles.documentSection}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              key={section.id}
            >
              <p className={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</p>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              <div className={styles.sectionContent}>{section.content}</div>
              {index === 2 && boundary ? <aside className={styles.boundary}>{boundary}</aside> : null}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
