import Link from "next/link";

import styles from "./PublicShell.module.css";

const groups = [
  { title: "Explore", links: [["Best Offers", "/best-offers"], ["Casinos", "/casinos"], ["Bonuses", "/bonuses"], ["Learn", "/learn"]] },
  { title: "Programme & Support", links: [["Start Programme", "/program"], ["10 Steps", "/10-steps"], ["Responsible Gambling", "/responsible-gambling"], ["Help — protected support →", "/help"]] },
  { title: "Trust", links: [["About", "/about"], ["Methodology", "/methodology"], ["FAQ", "/faq"], ["Affiliate Disclosure", "/affiliate-disclosure"]] },
] as const;

export function PublicFooter() {
  return (
    <footer aria-label="Control and support" className={styles.footer} data-public-shell="footer">
      <div className={styles.footerInner}>
        <div className={styles.footerColumns}>
          <div className={styles.footerLead}>
            <Link className={styles.footerBrand} href="/" translate="no">B4GAMBLE</Link>
            <p>Information, comparison and education.<br />Not a gambling operator.</p>
          </div>
          {groups.map((group) => (
            <div className={styles.footerGroup} key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            </div>
          ))}
        </div>
        <div className={styles.footerBaseline}>
          <div><span className={styles.age}>18+</span><span>Gambling involves financial risk.</span><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></div>
          <p className={styles.footerCommission}>We may earn commission from clearly labelled affiliate links.</p>
        </div>
        <span aria-hidden="true" className={styles.footerEnd} data-public-footer-bottom />
      </div>
    </footer>
  );
}
