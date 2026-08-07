import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/site";
import { PersonalLimitTracker } from "./PersonalLimitTracker";
import styles from "./PersonalLimitTracker.module.css";

export const metadata: Metadata = {
  title: "Personal Gambling Limit Tracker | SevenBet",
  description: "Track a gambling limit you choose yourself without SevenBet calculating a safe or affordable gambling amount.",
  alternates: { canonical: absoluteUrl("/tools/budget-calculator") },
};

export default function PersonalLimitTrackerPage() {
  return (
    <article
      className={styles.page}
      data-limit-tracker-page
      data-figma-family="924:3422"
      data-figma-desktop="924:3424"
      data-figma-mobile="924:3555"
    >
      <div className={styles.shell}>
        <div className={styles.layout}>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>Personal Gambling Limit Tracker · Local only</p>
            <h1>Check your<br />own limit.</h1>
            <p>Start with a limit that you choose. SevenBet does not calculate how much gambling is safe or affordable for you.</p>
          </header>
          <PersonalLimitTracker />
        </div>

        <noscript>
          <section className={styles.noJs} data-limit-tracker-nojs aria-labelledby="limit-tracker-nojs-title">
            <p className={styles.eyebrow}>Private by default</p>
            <h2 id="limit-tracker-nojs-title">Interactive tracker needs JavaScript.</h2>
            <p>Manual fallback: your chosen limit minus the amount already used equals the amount remaining under your own limit.</p>
            <p>SevenBet does not calculate a safe gambling amount.</p>
            <Link href="/responsible-gambling">Open Protected Help</Link>
          </section>
        </noscript>

        <aside className={styles.privacyNote}>
          <strong>Private by default.</strong>
          <span>Values stay in this browser session and clear when you refresh.</span>
          <span>They are not stored in SevenBet&apos;s application database and are not used to recommend casinos or bonuses.</span>
          <Link href="/responsible-gambling">Open Protected Help</Link>
        </aside>
      </div>
    </article>
  );
}
