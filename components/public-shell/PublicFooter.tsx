import Link from "next/link";

import styles from "./PublicShell.module.css";

const groups = [
  { title: "Discover", links: [["Casinos", "/casinos"], ["Bonuses", "/bonuses"], ["Best offers", "/best-offers"], ["Compare", "/compare"]] },
  { title: "Programme", links: [["10 Steps", "/10-steps"], ["My Programme", "/program"], ["Learn", "/learn"]] },
  { title: "Trust", links: [["Methodology", "/methodology"], ["Affiliate disclosure", "/affiliate-disclosure"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;

export function PublicFooter() {
  return (
    <footer className={styles.footer} data-public-shell="footer">
      <div className={styles.footerInner}>
        <div className={styles.footerLead}>
          <Link className={styles.footerBrand} href="/" translate="no">B4GAMBLE</Link>
          <p>Know your limits before you play.</p>
        </div>
        <div className={styles.footerGroups}>
          {groups.map((group) => (
            <div className={styles.footerGroup} key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            </div>
          ))}
        </div>
        <aside className={styles.footerHelp} aria-label="Control and support">
          <span>CONTROL &amp; SUPPORT</span>
          <p>Help opens without casino, bonus or affiliate prompts.</p>
          <Link href="/responsible-gambling">Open Help</Link>
        </aside>
        <div className={styles.footerDisclosure}>
          <strong>18+ · COMMERCIAL DISCLOSURE</strong>
          <p><span className={styles.desktopDisclosure}>B4GAMBLE may receive compensation from some outbound links. Rankings remain editorial and availability is never assumed.</span><span className={styles.mobileDisclosure}>Some outbound links may compensate B4GAMBLE. Availability is never assumed.</span></p>
        </div>
        <div className={styles.footerBaseline}>
          <span>© B4GAMBLE · Information and comparison service</span>
          <div><Link href="/responsible-gambling">Responsible gambling</Link><Link href="/about">About</Link><span>Contact</span></div>
        </div>
      </div>
    </footer>
  );
}
