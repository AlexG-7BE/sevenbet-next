import Link from "next/link";

import styles from "./PublicShell.module.css";

const groups = [
  { title: "Explore", links: [["Best Offers", "/best-offers"], ["Casinos", "/casinos"], ["Bonuses", "/bonuses"], ["Learn", "/learn"]] },
  { title: "Programme & Support", links: [["Start Programme", "/program"], ["10 Steps", "/10-steps"], ["Responsible Gambling", "/responsible-gambling"], ["Help — protected support →", "/help"]] },
  { title: "Trust", links: [["About", "/about"], ["Methodology", "/methodology"], ["FAQ", "/faq"], ["Affiliate Disclosure", "/affiliate-disclosure"]] },
] as const;

export function PublicFooter() {
  return (
    <footer className={styles.footer} data-public-shell="footer">
      <div className={styles.footerInner}>
        <div className={styles.footerLead}>
          <Link className={styles.footerBrand} href="/" translate="no">B4GAMBLE</Link>
          <p>Independent reviews. Real tests.<br />Player first.<br />Keep gambling your decision, not a habit.</p>
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
          <strong>18+ · GAMBLE RESPONSIBLY</strong>
          <p><span className={styles.desktopDisclosure}>B4GAMBLE is an information and comparison service. We may earn commission from some outbound links; rankings remain editorial.</span><span className={styles.mobileDisclosure}>Information and comparison service. We may earn commission.</span></p>
        </div>
        <div className={styles.footerBaseline}>
          <span>© {new Date().getFullYear()} B4GAMBLE · Information and comparison service</span>
          <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link><Link href="/affiliate-disclosure">How we&apos;re funded</Link></div>
        </div>
      </div>
    </footer>
  );
}
