import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./HandoffLegalPage.module.css";

export function HandoffLegalPage({ kind, lead, sections, boundary, effective, updated = "12 August 2026", legalContact }: {
  kind: "privacy" | "terms";
  lead: string;
  sections: ReadonlyArray<{ id?: string; title: string; content: ReactNode }>;
  boundary: ReactNode;
  effective?: string;
  updated?: string;
  legalContact?: ReactNode;
}) {
  return <article className={styles.page} data-legal-document={kind}>
    <header className={styles.hero}><div>
      <p>Legal · Updated {updated}</p>
      <h1>{kind === "privacy" ? <>Privacy<br /><em>by default.</em></> : <>Terms<br /><em>of use.</em></>}</h1>
      <span>{lead}</span>
    </div></header>
    <main className={styles.body}>
      {sections.map((section,index) => <section id={section.id} key={section.title}>
        <p>Section {String(index + 1).padStart(2,"0")}</p><h2>{section.title}</h2><div>{section.content}</div>
        {index === 1 ? <aside><strong>{kind === "privacy" ? "Boundary" : "Commercial disclosure"}</strong>{boundary}</aside> : null}
      </section>)}
      <footer><div><span>Questions {kind === "privacy" ? "about this policy" : ""} — <Link href="/contact">Contact</Link></span>{effective ? <span>Effective {effective}</span> : null}{legalContact}</div><Link href={kind === "privacy" ? "/terms" : "/privacy"}>{kind === "privacy" ? "Terms of use" : "Privacy policy"} →</Link></footer>
    </main>
  </article>;
}
