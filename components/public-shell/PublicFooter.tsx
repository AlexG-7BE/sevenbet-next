import Link from "next/link";

import styles from "./PublicShell.module.css";

const groups = [
  { title: "Discover", links: [["Best Offers", "/best-offers"], ["Casinos", "/casinos"], ["Bonuses", "/bonuses"]] },
  { title: "Build control", links: [["The 10 Steps", "/10-steps"], ["Start Programme", "/program"], ["Learn", "/learn"], ["Responsible Gambling", "/responsible-gambling"]] },
  { title: "About", links: [["Methodology", "/methodology"], ["About B4GAMBLE", "/about"], ["FAQ", "/faq"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Affiliate Disclosure", "/affiliate-disclosure"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;

export function PublicFooter() {
  return (
    <footer className={styles.footer} data-public-shell="footer">
      <div className={styles.footerInner}>
        <div className={styles.footerLead}>
          <Link className={styles.footerBrand} href="/" translate="no">B4GAMBLE</Link>
          <p>Keep gambling your decision, not a habit.</p>
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
          <span>NEED HELP NOW?</span>
          <p>Free, confidential support. No casino, bonus or affiliate prompts.</p>
          <Link href="/help">Get support</Link>
        </aside>
        <div className={styles.footerDisclosure}>
          <strong>18+ · PLAY RESPONSIBLY</strong>
          <p><span className={styles.desktopDisclosure}>B4GAMBLE is an information and comparison service. Some outbound links may compensate us. Rankings remain editorial and availability is never assumed.</span><span className={styles.mobileDisclosure}>Information and comparison service. Some outbound links may compensate us.</span></p>
        </div>
        <div className={styles.footerBaseline}>
          <span>© {new Date().getFullYear()} B4GAMBLE · Information and comparison service</span>
          <div><Link href="/responsible-gambling">Play responsibly</Link><Link href="/help">Help</Link></div>
        </div>
      </div>
    </footer>
  );
}
