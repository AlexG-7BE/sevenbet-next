import Link from "next/link";

import styles from "./PublicShell.module.css";

const groups = [
  { title: "Discover", links: [["Best Casinos", "/best-casinos"], ["Bonuses", "/bonuses"], ["All Casinos", "/casinos"], ["Compare", "/compare"]] },
  { title: "Programme", links: [["10 Steps", "/10-steps"], ["My Programme", "/program"], ["Learn", "/learn"]] },
  { title: "Trust", links: [["Methodology", "/methodology"], ["Affiliate disclosure", "/affiliate-disclosure"], ["FAQ", "/faq"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
  { title: "Control & Support", links: [["Responsible gambling", "/responsible-gambling"], ["Self-Check", "/self-check"], ["Personal Limit Tracker", "/tools/budget-calculator"], ["Help", "/help"]] },
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
          <Link href="/help">Open Help</Link>
        </aside>
        <div className={styles.footerDisclosure}>
          <strong>18+ · COMMERCIAL DISCLOSURE</strong>
          <p><span className={styles.desktopDisclosure}>B4GAMBLE may receive compensation from some outbound links. Rankings remain editorial and availability is never assumed.</span><span className={styles.mobileDisclosure}>Some outbound links may compensate B4GAMBLE. Availability is never assumed.</span></p>
        </div>
        <div className={styles.footerBaseline}>
          <span>© B4GAMBLE · Information and comparison service</span>
          <div><Link href="/about">About</Link><Link href="/contact">Contact</Link></div>
        </div>
      </div>
    </footer>
  );
}
